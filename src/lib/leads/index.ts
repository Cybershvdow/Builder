// Lead Generation Workflow - Public API

// Types
export type {
  Lead,
  LeadInsert,
  LeadUpdate,
  LeadStatus,
  QualifyDecision,
  OutreachStatus,
  WorkflowFormInput,
  WorkflowRun,
  WorkflowRunSummary,
  WorkflowStatus,
  WorkflowStep,
  EnrichmentResult,
  EnrichmentCache,
  EmailTemplate,
  EmailLog,
  NormalizedLead,
  AppifyBusinessResult,
  AppifyResponse,
} from '@/types/leads';

// Utilities
export {
  validateWorkflowInput,
  isValidInput,
  normalizePhone,
  extractDomain,
  generateLeadId,
  normalizeAppifyResult,
  withRetry,
  sleep,
  RateLimiter,
  classifyEmail,
  isValidEmail,
  buildAppifyQuery,
} from './utils';

// Services
export { createAppifyService, AppifyScraperService, MockAppifyScraperService } from './appify-scraper';
export { getLeadService, getWorkflowRunService, LeadService, WorkflowRunService } from './lead-service';
export { createSheetsService, GoogleSheetsService, MockGoogleSheetsService } from './sheets-service';
export { createEnrichmentService, EnrichmentService, MockEnrichmentService } from './enrichment-service';
export { createEmailService, EmailOutreachService, MockEmailOutreachService, generateOutreachEmail } from './email-service';

// Workflow Orchestrator
export { createWorkflowOrchestrator, LeadWorkflowOrchestrator } from './workflow-orchestrator';
export type { WorkflowOptions } from './workflow-orchestrator';
