import { createAdminClient } from '@/lib/supabase/server';
import type {
  Lead,
  LeadInsert,
  NormalizedLead,
  DedupeResult,
  WorkflowFormInput,
} from '@/types/leads';
import { mergeLeadData } from './utils';

// ============================================
// Lead Service
// ============================================

export class LeadService {
  private supabase: ReturnType<typeof createAdminClient>;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Upsert a single lead with deduplication
   */
  async upsertLead(
    normalizedLead: NormalizedLead,
    searchContext: {
      campaign_name?: string;
      business_type: string;
      search_city: string;
      search_zip?: string;
      radius_miles: number;
    }
  ): Promise<DedupeResult> {
    // Check for existing lead
    const existing = await this.findExistingLead(normalizedLead.lead_id);

    if (existing) {
      // Merge and update
      const mergeResult = this.mergeWithExisting(existing, normalizedLead);

      if (mergeResult.updatedFields.length > 0) {
        await this.supabase
          .from('leads')
          .update({
            ...mergeResult.merged,
            updated_at: new Date().toISOString(),
          })
          .eq('lead_id', normalizedLead.lead_id);

        return {
          action: 'UPDATE',
          lead_id: normalizedLead.lead_id,
          existing_id: existing.id,
          merged_fields: mergeResult.updatedFields,
        };
      }

      return {
        action: 'SKIP',
        lead_id: normalizedLead.lead_id,
        existing_id: existing.id,
      };
    }

    // Insert new lead
    const insertData: LeadInsert = {
      lead_id: normalizedLead.lead_id,
      source: 'APPIFY_GOOGLE_SCRAPER',
      campaign_name: searchContext.campaign_name,
      business_type: searchContext.business_type,
      search_city: searchContext.search_city,
      search_zip: searchContext.search_zip,
      radius_miles: searchContext.radius_miles,
      business_name: normalizedLead.business_name,
      place_id: normalizedLead.place_id,
      google_id: normalizedLead.google_id,
      listing_url: normalizedLead.listing_url,
      address_full: normalizedLead.address_full,
      street_address: normalizedLead.street_address,
      city: normalizedLead.city,
      state: normalizedLead.state,
      zip: normalizedLead.zip,
      country: normalizedLead.country,
      lat: normalizedLead.lat,
      lng: normalizedLead.lng,
      phone: normalizedLead.phone,
      phone_normalized: normalizedLead.phone_normalized,
      website: normalizedLead.website,
      domain: normalizedLead.domain,
      email: normalizedLead.email,
      category_primary: normalizedLead.category_primary,
      categories_all: normalizedLead.categories_all,
      rating: normalizedLead.rating,
      review_count: normalizedLead.review_count,
      price_level: normalizedLead.price_level,
      hours: normalizedLead.hours,
      open_status: normalizedLead.open_status,
      description: normalizedLead.description,
      services: normalizedLead.services,
      photos: normalizedLead.photos,
      has_booking: normalizedLead.has_booking,
      appointment_url: normalizedLead.appointment_url,
      status: 'NEW',
      qualify_decision: 'PENDING',
      raw_json: normalizedLead.raw_json,
      scraped_at: new Date().toISOString(),
    };

    const { error } = await this.supabase.from('leads').insert(insertData);

    if (error) {
      throw new Error(`Failed to insert lead: ${error.message}`);
    }

    return {
      action: 'INSERT',
      lead_id: normalizedLead.lead_id,
    };
  }

  /**
   * Bulk upsert leads with deduplication
   */
  async upsertLeads(
    leads: NormalizedLead[],
    searchContext: {
      campaign_name?: string;
      business_type: string;
      search_city: string;
      search_zip?: string;
      radius_miles: number;
    }
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: Array<{ lead_id: string; error: string }>;
  }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ lead_id: string; error: string }> = [];

    // Process in batches of 50 to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      // Get existing leads for this batch
      const leadIds = batch.map((l) => l.lead_id);
      const existingMap = await this.findExistingLeadsBatch(leadIds);

      // Process each lead in batch
      for (const lead of batch) {
        try {
          const existing = existingMap.get(lead.lead_id);

          if (existing) {
            const mergeResult = this.mergeWithExisting(existing, lead);

            if (mergeResult.updatedFields.length > 0) {
              await this.supabase
                .from('leads')
                .update({
                  ...mergeResult.merged,
                  updated_at: new Date().toISOString(),
                })
                .eq('lead_id', lead.lead_id);

              updated++;
            } else {
              skipped++;
            }
          } else {
            const insertData: LeadInsert = {
              lead_id: lead.lead_id,
              source: 'APPIFY_GOOGLE_SCRAPER',
              campaign_name: searchContext.campaign_name,
              business_type: searchContext.business_type,
              search_city: searchContext.search_city,
              search_zip: searchContext.search_zip,
              radius_miles: searchContext.radius_miles,
              business_name: lead.business_name,
              place_id: lead.place_id,
              google_id: lead.google_id,
              listing_url: lead.listing_url,
              address_full: lead.address_full,
              street_address: lead.street_address,
              city: lead.city,
              state: lead.state,
              zip: lead.zip,
              country: lead.country,
              lat: lead.lat,
              lng: lead.lng,
              phone: lead.phone,
              phone_normalized: lead.phone_normalized,
              website: lead.website,
              domain: lead.domain,
              email: lead.email,
              category_primary: lead.category_primary,
              categories_all: lead.categories_all,
              rating: lead.rating,
              review_count: lead.review_count,
              price_level: lead.price_level,
              hours: lead.hours,
              open_status: lead.open_status,
              description: lead.description,
              services: lead.services,
              photos: lead.photos,
              has_booking: lead.has_booking,
              appointment_url: lead.appointment_url,
              status: 'NEW',
              qualify_decision: 'PENDING',
              raw_json: lead.raw_json,
              scraped_at: new Date().toISOString(),
            };

            const { error } = await this.supabase.from('leads').insert(insertData);

            if (error) {
              errors.push({ lead_id: lead.lead_id, error: error.message });
            } else {
              inserted++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ lead_id: lead.lead_id, error: errorMessage });
        }
      }
    }

    return { inserted, updated, skipped, errors };
  }

  /**
   * Find an existing lead by lead_id
   */
  private async findExistingLead(leadId: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Lead;
  }

  /**
   * Find multiple existing leads by lead_ids
   */
  private async findExistingLeadsBatch(
    leadIds: string[]
  ): Promise<Map<string, Lead>> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .in('lead_id', leadIds);

    if (error || !data) {
      return new Map();
    }

    return new Map((data as Lead[]).map((lead) => [lead.lead_id, lead]));
  }

  /**
   * Merge new data with existing lead
   */
  private mergeWithExisting(
    existing: Lead,
    incoming: NormalizedLead
  ): { merged: Partial<Lead>; updatedFields: string[] } {
    const fieldsToMerge: (keyof NormalizedLead)[] = [
      'place_id',
      'google_id',
      'listing_url',
      'address_full',
      'street_address',
      'city',
      'state',
      'zip',
      'country',
      'lat',
      'lng',
      'phone',
      'phone_normalized',
      'website',
      'domain',
      'email',
      'category_primary',
      'categories_all',
      'rating',
      'review_count',
      'price_level',
      'hours',
      'open_status',
      'description',
      'services',
      'photos',
      'has_booking',
      'appointment_url',
    ];

    return mergeLeadData(existing, incoming, fieldsToMerge);
  }

  /**
   * Get leads for qualification (NEW status, PENDING decision)
   */
  async getLeadsForQualification(
    options?: {
      campaign_name?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Lead[]> {
    let query = this.supabase
      .from('leads')
      .select('*')
      .eq('status', 'NEW')
      .eq('qualify_decision', 'PENDING')
      .order('created_at', { ascending: false });

    if (options?.campaign_name) {
      query = query.eq('campaign_name', options.campaign_name);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return (data || []) as Lead[];
  }

  /**
   * Get approved leads for enrichment
   */
  async getLeadsForEnrichment(limit: number = 50): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .eq('qualify_decision', 'APPROVE')
      .in('status', ['NEW', 'ENRICHED'])
      .is('contact_email', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch leads for enrichment: ${error.message}`);
    }

    return (data || []) as Lead[];
  }

  /**
   * Get leads ready for email outreach
   */
  async getLeadsForEmail(
    minConfidence: number = 0.70,
    limit: number = 50
  ): Promise<Lead[]> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .eq('qualify_decision', 'APPROVE')
      .eq('status', 'ENRICHED')
      .not('contact_email', 'is', null)
      .gte('email_confidence', minConfidence)
      .is('email_sent_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch leads for email: ${error.message}`);
    }

    return (data || []) as Lead[];
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: Lead['status'],
    additionalFields?: Partial<Lead>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .update({
        status,
        ...additionalFields,
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId);

    if (error) {
      throw new Error(`Failed to update lead status: ${error.message}`);
    }
  }

  /**
   * Update qualification decision
   */
  async updateQualifyDecision(
    leadId: string,
    decision: Lead['qualify_decision'],
    notes?: string
  ): Promise<void> {
    const newStatus = decision === 'REJECT' ? 'REJECTED' : undefined;

    const { error } = await this.supabase
      .from('leads')
      .update({
        qualify_decision: decision,
        qualify_notes: notes,
        ...(newStatus && { status: newStatus }),
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId);

    if (error) {
      throw new Error(`Failed to update qualification: ${error.message}`);
    }
  }

  /**
   * Update enrichment data
   */
  async updateEnrichment(
    leadId: string,
    enrichmentData: {
      contact_name?: string;
      contact_role?: string;
      contact_email?: string;
      email_confidence?: number;
      personalization_summary?: string;
      enrichment_source?: string;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .update({
        ...enrichmentData,
        status: 'ENRICHED',
        enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadId);

    if (error) {
      throw new Error(`Failed to update enrichment: ${error.message}`);
    }
  }

  /**
   * Get leads that need to be synced to sheets
   */
  async getLeadsForSheetSync(
    lastSyncTime?: string,
    limit: number = 100
  ): Promise<Lead[]> {
    let query = this.supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (lastSyncTime) {
      query = query.gt('updated_at', lastSyncTime);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch leads for sync: ${error.message}`);
    }

    return (data || []) as Lead[];
  }

  /**
   * Mark leads as synced to sheets
   */
  async markLeadsSynced(leadIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .update({
        last_synced_to_sheets_at: new Date().toISOString(),
      })
      .in('lead_id', leadIds);

    if (error) {
      throw new Error(`Failed to mark leads as synced: ${error.message}`);
    }
  }

  /**
   * Get qualified leads for output sheet
   */
  async getQualifiedLeads(
    options?: {
      campaign_name?: string;
      limit?: number;
    }
  ): Promise<Lead[]> {
    let query = this.supabase
      .from('leads')
      .select('*')
      .eq('qualify_decision', 'APPROVE')
      .in('status', ['ENRICHED', 'EMAILED', 'REPLIED'])
      .order('updated_at', { ascending: false });

    if (options?.campaign_name) {
      query = query.eq('campaign_name', options.campaign_name);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch qualified leads: ${error.message}`);
    }

    return (data || []) as Lead[];
  }
}

// ============================================
// Workflow Run Service
// ============================================

export class WorkflowRunService {
  private supabase: ReturnType<typeof createAdminClient>;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Create a new workflow run
   */
  async createRun(input: WorkflowFormInput): Promise<string> {
    const { data, error } = await this.supabase
      .from('lead_workflow_runs')
      .insert({
        business_type: input.business_type,
        city: input.city,
        zip_code: input.zip_code,
        radius_miles: input.radius_miles,
        max_results: input.max_results || 100,
        campaign_name: input.campaign_name,
        send_emails: input.send_emails || false,
        status: 'RUNNING',
        current_step: 'SCRAPE',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create workflow run: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Update workflow run progress
   */
  async updateProgress(
    runId: string,
    update: {
      current_step?: string;
      checkpoint?: Record<string, unknown>;
      total_fetched?: number;
      total_inserted?: number;
      total_updated?: number;
      total_deduped?: number;
      total_approved?: number;
      total_enriched?: number;
      total_emailed?: number;
    }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('lead_workflow_runs')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (error) {
      throw new Error(`Failed to update workflow run: ${error.message}`);
    }
  }

  /**
   * Add error to workflow run
   */
  async addError(
    runId: string,
    error: { step: string; message: string; lead_id?: string }
  ): Promise<void> {
    // First fetch current errors
    const { data, error: fetchError } = await this.supabase
      .from('lead_workflow_runs')
      .select('errors')
      .eq('id', runId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch workflow run: ${fetchError.message}`);
    }

    const currentErrors = (data?.errors || []) as Array<unknown>;
    const newErrors = [
      ...currentErrors,
      { ...error, timestamp: new Date().toISOString() },
    ];

    const { error: updateError } = await this.supabase
      .from('lead_workflow_runs')
      .update({ errors: newErrors })
      .eq('id', runId);

    if (updateError) {
      throw new Error(`Failed to add error: ${updateError.message}`);
    }
  }

  /**
   * Complete workflow run
   */
  async completeRun(
    runId: string,
    status: 'COMPLETED' | 'FAILED' | 'PARTIAL'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('lead_workflow_runs')
      .update({
        status,
        current_step: 'COMPLETE',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (error) {
      throw new Error(`Failed to complete workflow run: ${error.message}`);
    }
  }

  /**
   * Store raw import data
   */
  async storeRawImport(
    runId: string,
    pageNumber: number,
    rawResponse: Record<string, unknown>,
    recordCount: number,
    cursor?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('lead_raw_imports').insert({
      workflow_run_id: runId,
      page_number: pageNumber,
      cursor,
      raw_response: rawResponse,
      record_count: recordCount,
      processed: false,
    });

    if (error) {
      throw new Error(`Failed to store raw import: ${error.message}`);
    }
  }

  /**
   * Get workflow run by ID
   */
  async getRun(runId: string): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase
      .from('lead_workflow_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}

// ============================================
// Singleton Instances
// ============================================

let leadServiceInstance: LeadService | null = null;
let workflowRunServiceInstance: WorkflowRunService | null = null;

export function getLeadService(): LeadService {
  if (!leadServiceInstance) {
    leadServiceInstance = new LeadService();
  }
  return leadServiceInstance;
}

export function getWorkflowRunService(): WorkflowRunService {
  if (!workflowRunServiceInstance) {
    workflowRunServiceInstance = new WorkflowRunService();
  }
  return workflowRunServiceInstance;
}
