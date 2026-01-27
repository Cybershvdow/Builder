import type {
  WorkflowFormInput,
  WorkflowRunSummary,
  WorkflowStatus,
  Lead,
} from '@/types/leads';
import { createAppifyService } from './appify-scraper';
import { getLeadService, getWorkflowRunService } from './lead-service';
import { createSheetsService } from './sheets-service';
import { createEnrichmentService } from './enrichment-service';
import { createEmailService } from './email-service';
import { validateWorkflowInput, isValidInput } from './utils';

// ============================================
// Workflow Orchestrator
// ============================================

export interface WorkflowOptions {
  useMock?: boolean;
  skipSheets?: boolean;
  skipEnrichment?: boolean;
  skipEmail?: boolean;
  onProgress?: (step: string, message: string) => void;
}

export class LeadWorkflowOrchestrator {
  private appifyService: ReturnType<typeof createAppifyService>;
  private leadService: ReturnType<typeof getLeadService>;
  private workflowRunService: ReturnType<typeof getWorkflowRunService>;
  private sheetsService: ReturnType<typeof createSheetsService>;
  private enrichmentService: ReturnType<typeof createEnrichmentService>;
  private emailService: ReturnType<typeof createEmailService>;
  private options: WorkflowOptions;

  constructor(options: WorkflowOptions = {}) {
    this.options = options;
    this.appifyService = createAppifyService({ useMock: options.useMock });
    this.leadService = getLeadService();
    this.workflowRunService = getWorkflowRunService();
    this.sheetsService = createSheetsService({ useMock: options.useMock });
    this.enrichmentService = createEnrichmentService({ useMock: options.useMock });
    this.emailService = createEmailService({ useMock: options.useMock });
  }

  private log(step: string, message: string): void {
    this.options.onProgress?.(step, message);
    console.log(`[${step}] ${message}`);
  }

  /**
   * Run the complete lead generation workflow
   */
  async runWorkflow(input: WorkflowFormInput): Promise<WorkflowRunSummary> {
    // Validate input
    const validationErrors = validateWorkflowInput(input);
    if (Object.keys(validationErrors).length > 0) {
      throw new Error(`Invalid input: ${JSON.stringify(validationErrors)}`);
    }

    const startTime = Date.now();
    let runId: string;
    let status: WorkflowStatus = 'RUNNING';

    // Create workflow run record
    try {
      runId = await this.workflowRunService.createRun(input);
      this.log('INIT', `Created workflow run: ${runId}`);
    } catch (error) {
      throw new Error(`Failed to initialize workflow: ${error}`);
    }

    const stats = {
      total_fetched: 0,
      total_inserted: 0,
      total_updated: 0,
      total_deduped: 0,
      total_approved: 0,
      total_enriched: 0,
      total_emailed: 0,
    };

    const errors: Array<{ step: string; message: string }> = [];

    try {
      // ========================================
      // STEP 1: SCRAPE
      // ========================================
      this.log('SCRAPE', `Starting scrape for "${input.business_type}" in ${input.city}`);

      await this.workflowRunService.updateProgress(runId, { current_step: 'SCRAPE' });

      const scrapeResult = await this.appifyService.fetchAndNormalizeLeads(input, {
        onPage: async (page, rawResults, normalizedResults) => {
          // Store raw import
          await this.workflowRunService.storeRawImport(
            runId,
            page,
            { results: rawResults },
            rawResults.length
          );
          this.log('SCRAPE', `Page ${page}: fetched ${rawResults.length} results`);
        },
      });

      stats.total_fetched = scrapeResult.totalFetched;
      this.log('SCRAPE', `Completed: ${stats.total_fetched} leads fetched in ${scrapeResult.pages} pages`);

      if (scrapeResult.errors.length > 0) {
        for (const err of scrapeResult.errors) {
          errors.push({ step: 'SCRAPE', message: err });
          await this.workflowRunService.addError(runId, { step: 'SCRAPE', message: err });
        }
      }

      // ========================================
      // STEP 2: NORMALIZE + DEDUPE
      // ========================================
      this.log('NORMALIZE', 'Starting normalization and deduplication');

      await this.workflowRunService.updateProgress(runId, { current_step: 'NORMALIZE' });

      const upsertResult = await this.leadService.upsertLeads(scrapeResult.leads, {
        campaign_name: input.campaign_name,
        business_type: input.business_type,
        search_city: input.city,
        search_zip: input.zip_code,
        radius_miles: input.radius_miles,
      });

      stats.total_inserted = upsertResult.inserted;
      stats.total_updated = upsertResult.updated;
      stats.total_deduped = upsertResult.skipped;

      this.log('NORMALIZE', `Completed: ${stats.total_inserted} inserted, ${stats.total_updated} updated, ${stats.total_deduped} skipped`);

      if (upsertResult.errors.length > 0) {
        for (const err of upsertResult.errors) {
          errors.push({ step: 'NORMALIZE', message: `${err.lead_id}: ${err.error}` });
        }
      }

      await this.workflowRunService.updateProgress(runId, {
        total_fetched: stats.total_fetched,
        total_inserted: stats.total_inserted,
        total_updated: stats.total_updated,
        total_deduped: stats.total_deduped,
      });

      // ========================================
      // STEP 3: SYNC TO SHEETS
      // ========================================
      if (!this.options.skipSheets) {
        this.log('SYNC_SHEETS', 'Starting Google Sheets sync');

        await this.workflowRunService.updateProgress(runId, { current_step: 'SYNC_SHEETS' });

        try {
          // Initialize sheets if needed
          await this.sheetsService.initializeSheets();

          // Get leads to sync
          const leadsToSync = await this.leadService.getLeadsForSheetSync(undefined, 500);

          // Sync to raw sheet
          const syncResult = await this.sheetsService.syncToRawSheet(leadsToSync);

          this.log('SYNC_SHEETS', `Completed: ${syncResult.rows_synced} synced, ${syncResult.rows_updated} updated`);

          if (syncResult.errors.length > 0) {
            for (const err of syncResult.errors) {
              errors.push({ step: 'SYNC_SHEETS', message: err });
            }
          }

          // Mark leads as synced
          const syncedIds = leadsToSync.map((l) => l.lead_id);
          await this.leadService.markLeadsSynced(syncedIds);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ step: 'SYNC_SHEETS', message: errorMessage });
          this.log('SYNC_SHEETS', `Error: ${errorMessage}`);
        }
      }

      // ========================================
      // STEP 4: PROCESS APPROVED LEADS
      // ========================================
      // Note: In a real workflow, you'd wait for human qualification
      // For now, we'll check for any already-approved leads

      // Pull qualification decisions from sheets
      if (!this.options.skipSheets) {
        try {
          const decisions = await this.sheetsService.pullQualificationDecisions();
          for (const decision of decisions) {
            await this.leadService.updateQualifyDecision(
              decision.lead_id,
              decision.decision,
              decision.notes
            );
            if (decision.decision === 'APPROVE') {
              stats.total_approved++;
            }
          }
          this.log('QUALIFY', `Pulled ${decisions.length} qualification decisions, ${stats.total_approved} approved`);
        } catch (error) {
          // Non-fatal - qualification sync is optional
          this.log('QUALIFY', `Skipped qualification sync: ${error}`);
        }
      }

      // ========================================
      // STEP 5: ENRICH APPROVED LEADS
      // ========================================
      if (!this.options.skipEnrichment) {
        this.log('ENRICH', 'Starting enrichment for approved leads');

        await this.workflowRunService.updateProgress(runId, { current_step: 'ENRICH' });

        try {
          const leadsToEnrich = await this.leadService.getLeadsForEnrichment(50);

          if (leadsToEnrich.length > 0) {
            const enrichResults = await this.enrichmentService.enrichLeads(leadsToEnrich, {
              concurrency: 3,
              onProgress: (completed, total) => {
                this.log('ENRICH', `Progress: ${completed}/${total}`);
              },
            });

            for (const result of enrichResults) {
              if (result.result.emails.length > 0) {
                const bestEmail = result.result.emails[0];
                const contact = result.result.contacts[0];

                await this.leadService.updateEnrichment(result.lead_id, {
                  contact_email: bestEmail.email,
                  email_confidence: bestEmail.confidence,
                  contact_name: contact?.name,
                  contact_role: contact?.role,
                  personalization_summary: result.personalization,
                  enrichment_source: bestEmail.source,
                });

                stats.total_enriched++;
              }
            }

            this.log('ENRICH', `Completed: ${stats.total_enriched} leads enriched`);
          } else {
            this.log('ENRICH', 'No leads to enrich');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ step: 'ENRICH', message: errorMessage });
          this.log('ENRICH', `Error: ${errorMessage}`);
        }
      }

      await this.workflowRunService.updateProgress(runId, {
        total_enriched: stats.total_enriched,
      });

      // ========================================
      // STEP 6: EMAIL OUTREACH (if enabled)
      // ========================================
      if (input.send_emails && !this.options.skipEmail) {
        this.log('EMAIL', 'Starting email outreach');

        await this.workflowRunService.updateProgress(runId, { current_step: 'EMAIL' });

        try {
          const leadsToEmail = await this.leadService.getLeadsForEmail(0.70, 50);

          if (leadsToEmail.length > 0) {
            const emailResult = await this.emailService.sendBulkOutreach(leadsToEmail, {
              delayBetweenEmails: 2000,
              onProgress: (sent, total, errs) => {
                this.log('EMAIL', `Progress: ${sent}/${total} sent, ${errs} errors`);
              },
            });

            stats.total_emailed = emailResult.sent;

            // Update lead statuses
            for (const lead of leadsToEmail) {
              await this.leadService.updateLeadStatus(lead.lead_id, 'EMAILED', {
                email_sent_at: new Date().toISOString(),
              });
            }

            if (emailResult.errors.length > 0) {
              for (const err of emailResult.errors) {
                errors.push({ step: 'EMAIL', message: `${err.lead_id}: ${err.error}` });
              }
            }

            this.log('EMAIL', `Completed: ${stats.total_emailed} emails sent, ${emailResult.skipped} skipped`);
          } else {
            this.log('EMAIL', 'No leads ready for email');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ step: 'EMAIL', message: errorMessage });
          this.log('EMAIL', `Error: ${errorMessage}`);
        }
      }

      await this.workflowRunService.updateProgress(runId, {
        total_emailed: stats.total_emailed,
      });

      // ========================================
      // STEP 7: SYNC QUALIFIED TO OUTPUT SHEET
      // ========================================
      if (!this.options.skipSheets) {
        this.log('OUTPUT', 'Syncing qualified leads to output sheet');

        try {
          const qualifiedLeads = await this.leadService.getQualifiedLeads({
            campaign_name: input.campaign_name,
          });

          if (qualifiedLeads.length > 0) {
            const outputResult = await this.sheetsService.syncToQualifiedSheet(qualifiedLeads);
            this.log('OUTPUT', `Synced ${outputResult.rows_synced} leads to Leads_Qualified`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ step: 'OUTPUT', message: errorMessage });
        }
      }

      // Determine final status
      status = errors.length > 0 ? 'PARTIAL' : 'COMPLETED';
    } catch (error) {
      status = 'FAILED';
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ step: 'WORKFLOW', message: errorMessage });
      await this.workflowRunService.addError(runId, { step: 'WORKFLOW', message: errorMessage });
    }

    // Complete the workflow run
    await this.workflowRunService.completeRun(runId, status);

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    this.log('COMPLETE', `Workflow ${status} in ${durationSeconds}s`);

    return {
      run_id: runId,
      status,
      ...stats,
      errors,
      duration_seconds: durationSeconds,
    };
  }

  /**
   * Run only the enrichment step for approved leads
   */
  async runEnrichmentOnly(): Promise<{
    enriched: number;
    errors: Array<{ lead_id: string; error: string }>;
  }> {
    const leads = await this.leadService.getLeadsForEnrichment(100);
    const enriched: string[] = [];
    const errors: Array<{ lead_id: string; error: string }> = [];

    for (const lead of leads) {
      try {
        const result = await this.enrichmentService.enrichLead(lead);

        if (result.emails.length > 0) {
          const bestEmail = result.emails[0];
          const contact = result.contacts[0];
          const personalization = await this.enrichmentService.generatePersonalization(lead);

          await this.leadService.updateEnrichment(lead.lead_id, {
            contact_email: bestEmail.email,
            email_confidence: bestEmail.confidence,
            contact_name: contact?.name,
            contact_role: contact?.role,
            personalization_summary: personalization,
            enrichment_source: bestEmail.source,
          });

          enriched.push(lead.lead_id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ lead_id: lead.lead_id, error: errorMessage });
      }
    }

    return { enriched: enriched.length, errors };
  }

  /**
   * Run only the email step for enriched leads
   */
  async runEmailOnly(limit: number = 50): Promise<{
    sent: number;
    skipped: number;
    errors: Array<{ lead_id: string; error: string }>;
  }> {
    const leads = await this.leadService.getLeadsForEmail(0.70, limit);

    const result = await this.emailService.sendBulkOutreach(leads, {
      delayBetweenEmails: 2000,
    });

    // Update lead statuses
    for (const lead of leads) {
      if (!result.errors.some((e) => e.lead_id === lead.lead_id)) {
        await this.leadService.updateLeadStatus(lead.lead_id, 'EMAILED', {
          email_sent_at: new Date().toISOString(),
        });
      }
    }

    return result;
  }

  /**
   * Sync qualification decisions from sheets to database
   */
  async syncQualificationDecisions(): Promise<{
    approved: number;
    rejected: number;
  }> {
    const decisions = await this.sheetsService.pullQualificationDecisions();

    let approved = 0;
    let rejected = 0;

    for (const decision of decisions) {
      await this.leadService.updateQualifyDecision(
        decision.lead_id,
        decision.decision,
        decision.notes
      );

      if (decision.decision === 'APPROVE') {
        approved++;
      } else if (decision.decision === 'REJECT') {
        rejected++;
      }
    }

    return { approved, rejected };
  }
}

// ============================================
// Factory Function
// ============================================

export function createWorkflowOrchestrator(
  options?: WorkflowOptions
): LeadWorkflowOrchestrator {
  return new LeadWorkflowOrchestrator(options);
}
