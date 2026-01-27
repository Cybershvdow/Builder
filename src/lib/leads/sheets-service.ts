import type { Lead, SheetsSyncResult, QualifyDecision } from '@/types/leads';
import { withRetry, sleep } from './utils';

// ============================================
// Configuration
// ============================================

interface SheetsConfig {
  credentials: string; // JSON string of service account credentials
  spreadsheetId: string;
  leadsRawSheet: string;
  leadsQualifiedSheet: string;
}

function getConfig(): SheetsConfig {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!credentials) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is required');
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required');
  }

  return {
    credentials,
    spreadsheetId,
    leadsRawSheet: process.env.GOOGLE_SHEETS_RAW_SHEET || 'Leads_Raw',
    leadsQualifiedSheet: process.env.GOOGLE_SHEETS_QUALIFIED_SHEET || 'Leads_Qualified',
  };
}

// ============================================
// Column Definitions
// ============================================

const LEADS_RAW_COLUMNS = [
  'lead_id',
  'place_id',
  'campaign_name',
  'business_type',
  'search_city',
  'search_zip',
  'radius_miles',
  'business_name',
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
  'listing_url',
  'category_primary',
  'categories_all',
  'rating',
  'review_count',
  'hours',
  'open_status',
  'status',
  'qualify_decision',
  'qualify_notes',
  'contact_name',
  'contact_role',
  'contact_email',
  'email_confidence',
  'personalization_summary',
  'last_enriched_at',
  'last_emailed_at',
  'error_message',
  'scraped_at',
] as const;

const LEADS_QUALIFIED_COLUMNS = [
  'lead_id',
  'campaign_name',
  'business_name',
  'address_full',
  'city',
  'state',
  'zip',
  'phone',
  'website',
  'category_primary',
  'rating',
  'review_count',
  'contact_name',
  'contact_email',
  'email_confidence',
  'personalization_summary',
  'outreach_status',
  'last_touch_at',
  'notes',
] as const;

// ============================================
// Google Sheets API Client
// ============================================

export class GoogleSheetsService {
  private config: SheetsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<SheetsConfig>) {
    const defaultConfig = getConfig();
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get OAuth2 access token using service account
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const credentials = JSON.parse(this.config.credentials);
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    // Create JWT for Google OAuth
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    };

    // Sign JWT (simplified - in production use proper JWT library)
    const jwt = await this.createSignedJWT(header, payload, credentials.private_key);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Create a signed JWT (simplified implementation)
   */
  private async createSignedJWT(
    header: object,
    payload: object,
    privateKey: string
  ): Promise<string> {
    // In a real implementation, use a proper JWT library
    // This is a simplified version using Node.js crypto
    const crypto = await import('crypto');

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(privateKey, 'base64url');

    return `${signatureInput}.${signature}`;
  }

  /**
   * Make an API request to Google Sheets
   */
  private async apiRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`;

    const response = await withRetry(
      async () => {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: options.method || 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Sheets API error (status: ${res.status}): ${error}`);
        }

        return res.json();
      },
      {
        max_retries: 3,
        base_delay_ms: 1000,
        max_delay_ms: 8000,
      }
    );

    return response as T;
  }

  /**
   * Initialize sheets with headers if they don't exist
   */
  async initializeSheets(): Promise<void> {
    // Check and create Leads_Raw sheet
    await this.ensureSheetExists(this.config.leadsRawSheet, LEADS_RAW_COLUMNS);

    // Check and create Leads_Qualified sheet
    await this.ensureSheetExists(this.config.leadsQualifiedSheet, LEADS_QUALIFIED_COLUMNS);
  }

  /**
   * Ensure a sheet exists with headers
   */
  private async ensureSheetExists(
    sheetName: string,
    headers: readonly string[]
  ): Promise<void> {
    try {
      // Try to read the first row to check if sheet exists
      const response = await this.apiRequest<{ values?: string[][] }>(
        `/values/${encodeURIComponent(sheetName)}!A1:1`
      );

      // If no values, add headers
      if (!response.values || response.values.length === 0) {
        await this.apiRequest(
          `/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
          {
            method: 'PUT',
            body: {
              values: [headers],
            },
          }
        );
      }
    } catch (error) {
      // Sheet doesn't exist, create it
      await this.createSheet(sheetName, headers);
    }
  }

  /**
   * Create a new sheet with headers
   */
  private async createSheet(
    sheetName: string,
    headers: readonly string[]
  ): Promise<void> {
    // Add the sheet
    await this.apiRequest(':batchUpdate', {
      method: 'POST',
      body: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    // Add headers
    await this.apiRequest(
      `/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: {
          values: [headers],
        },
      }
    );
  }

  /**
   * Convert lead to row values for Leads_Raw sheet
   */
  private leadToRawRow(lead: Lead): string[] {
    return LEADS_RAW_COLUMNS.map((col) => {
      const value = lead[col as keyof Lead];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  }

  /**
   * Convert lead to row values for Leads_Qualified sheet
   */
  private leadToQualifiedRow(lead: Lead): string[] {
    const outreachStatus =
      lead.status === 'EMAILED'
        ? 'EMAILED'
        : lead.status === 'BOUNCED'
          ? 'BOUNCED'
          : lead.status === 'REPLIED'
            ? 'REPLIED'
            : 'READY_TO_CALL';

    const lastTouchAt = lead.email_sent_at || lead.enriched_at || lead.scraped_at;

    const row: Record<string, unknown> = {
      lead_id: lead.lead_id,
      campaign_name: lead.campaign_name,
      business_name: lead.business_name,
      address_full: lead.address_full,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      phone: lead.phone,
      website: lead.website,
      category_primary: lead.category_primary,
      rating: lead.rating,
      review_count: lead.review_count,
      contact_name: lead.contact_name,
      contact_email: lead.contact_email,
      email_confidence: lead.email_confidence,
      personalization_summary: lead.personalization_summary,
      outreach_status: outreachStatus,
      last_touch_at: lastTouchAt,
      notes: lead.qualify_notes || '',
    };

    return LEADS_QUALIFIED_COLUMNS.map((col) => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      return String(value);
    });
  }

  /**
   * Sync leads to Leads_Raw sheet
   */
  async syncToRawSheet(leads: Lead[]): Promise<SheetsSyncResult> {
    if (leads.length === 0) {
      return { rows_synced: 0, rows_updated: 0, qualification_changes: 0, errors: [] };
    }

    const errors: string[] = [];
    let rowsSynced = 0;
    let rowsUpdated = 0;

    try {
      // Get existing lead_ids from sheet
      const existingIds = await this.getExistingLeadIds(this.config.leadsRawSheet);

      // Separate inserts and updates
      const toInsert: Lead[] = [];
      const toUpdate: Lead[] = [];

      for (const lead of leads) {
        if (existingIds.has(lead.lead_id)) {
          toUpdate.push(lead);
        } else {
          toInsert.push(lead);
        }
      }

      // Insert new rows
      if (toInsert.length > 0) {
        const rows = toInsert.map((l) => this.leadToRawRow(l));
        await this.appendRows(this.config.leadsRawSheet, rows);
        rowsSynced = toInsert.length;
      }

      // Update existing rows
      for (const lead of toUpdate) {
        try {
          await this.updateLeadRow(this.config.leadsRawSheet, lead);
          rowsUpdated++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to update ${lead.lead_id}: ${errorMessage}`);
        }
        // Rate limit updates
        await sleep(100);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Sync failed: ${errorMessage}`);
    }

    return {
      rows_synced: rowsSynced,
      rows_updated: rowsUpdated,
      qualification_changes: 0,
      errors,
    };
  }

  /**
   * Sync qualified leads to Leads_Qualified sheet
   */
  async syncToQualifiedSheet(leads: Lead[]): Promise<SheetsSyncResult> {
    if (leads.length === 0) {
      return { rows_synced: 0, rows_updated: 0, qualification_changes: 0, errors: [] };
    }

    const errors: string[] = [];

    try {
      // Get existing lead_ids
      const existingIds = await this.getExistingLeadIds(this.config.leadsQualifiedSheet);

      // Only insert leads not already in sheet
      const toInsert = leads.filter((l) => !existingIds.has(l.lead_id));

      if (toInsert.length > 0) {
        const rows = toInsert.map((l) => this.leadToQualifiedRow(l));
        await this.appendRows(this.config.leadsQualifiedSheet, rows);
      }

      return {
        rows_synced: toInsert.length,
        rows_updated: 0,
        qualification_changes: 0,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Sync failed: ${errorMessage}`);
      return {
        rows_synced: 0,
        rows_updated: 0,
        qualification_changes: 0,
        errors,
      };
    }
  }

  /**
   * Get existing lead_ids from a sheet
   */
  private async getExistingLeadIds(sheetName: string): Promise<Set<string>> {
    const response = await this.apiRequest<{ values?: string[][] }>(
      `/values/${encodeURIComponent(sheetName)}!A:A`
    );

    const ids = new Set<string>();
    if (response.values) {
      // Skip header row
      for (let i = 1; i < response.values.length; i++) {
        const leadId = response.values[i][0];
        if (leadId) {
          ids.add(leadId);
        }
      }
    }

    return ids;
  }

  /**
   * Append rows to a sheet
   */
  private async appendRows(sheetName: string, rows: string[][]): Promise<void> {
    // Batch append in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      await this.apiRequest(
        `/values/${encodeURIComponent(sheetName)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          body: {
            values: batch,
          },
        }
      );

      // Rate limit
      if (i + batchSize < rows.length) {
        await sleep(500);
      }
    }
  }

  /**
   * Update a specific lead row
   */
  private async updateLeadRow(sheetName: string, lead: Lead): Promise<void> {
    // Find the row with this lead_id
    const rowIndex = await this.findLeadRow(sheetName, lead.lead_id);

    if (rowIndex === -1) {
      throw new Error(`Lead ${lead.lead_id} not found in sheet`);
    }

    const row = this.leadToRawRow(lead);
    const range = `${sheetName}!A${rowIndex}:${String.fromCharCode(64 + row.length)}${rowIndex}`;

    await this.apiRequest(`/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
      method: 'PUT',
      body: {
        values: [row],
      },
    });
  }

  /**
   * Find the row index for a lead_id
   */
  private async findLeadRow(sheetName: string, leadId: string): Promise<number> {
    const response = await this.apiRequest<{ values?: string[][] }>(
      `/values/${encodeURIComponent(sheetName)}!A:A`
    );

    if (!response.values) return -1;

    for (let i = 0; i < response.values.length; i++) {
      if (response.values[i][0] === leadId) {
        return i + 1; // Sheets uses 1-based indexing
      }
    }

    return -1;
  }

  /**
   * Pull qualification decisions from sheet back to database
   */
  async pullQualificationDecisions(): Promise<
    Array<{ lead_id: string; decision: QualifyDecision; notes?: string }>
  > {
    const response = await this.apiRequest<{ values?: string[][] }>(
      `/values/${encodeURIComponent(this.config.leadsRawSheet)}!A:AD`
    );

    if (!response.values || response.values.length <= 1) {
      return [];
    }

    const headers = response.values[0];
    const leadIdIndex = headers.indexOf('lead_id');
    const decisionIndex = headers.indexOf('qualify_decision');
    const notesIndex = headers.indexOf('qualify_notes');

    if (leadIdIndex === -1 || decisionIndex === -1) {
      return [];
    }

    const decisions: Array<{ lead_id: string; decision: QualifyDecision; notes?: string }> = [];

    for (let i = 1; i < response.values.length; i++) {
      const row = response.values[i];
      const leadId = row[leadIdIndex];
      const decision = row[decisionIndex] as QualifyDecision;
      const notes = notesIndex !== -1 ? row[notesIndex] : undefined;

      if (leadId && decision && ['APPROVE', 'REJECT'].includes(decision)) {
        decisions.push({ lead_id: leadId, decision, notes });
      }
    }

    return decisions;
  }
}

// ============================================
// Mock Service for Development
// ============================================

export class MockGoogleSheetsService extends GoogleSheetsService {
  private mockData: Map<string, string[][]> = new Map();

  constructor() {
    // Don't call parent constructor to avoid config requirements
    super({
      credentials: '{}',
      spreadsheetId: 'mock',
      leadsRawSheet: 'Leads_Raw',
      leadsQualifiedSheet: 'Leads_Qualified',
    });

    // Initialize mock sheets
    this.mockData.set('Leads_Raw', [[...LEADS_RAW_COLUMNS]]);
    this.mockData.set('Leads_Qualified', [[...LEADS_QUALIFIED_COLUMNS]]);
  }

  override async initializeSheets(): Promise<void> {
    // Already initialized in constructor
  }

  override async syncToRawSheet(leads: Lead[]): Promise<SheetsSyncResult> {
    const sheet = this.mockData.get('Leads_Raw') || [];
    let synced = 0;

    for (const lead of leads) {
      // Convert lead to row (simplified)
      const row = LEADS_RAW_COLUMNS.map((col) => {
        const value = lead[col as keyof Lead];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      });
      sheet.push(row);
      synced++;
    }

    this.mockData.set('Leads_Raw', sheet);

    return {
      rows_synced: synced,
      rows_updated: 0,
      qualification_changes: 0,
      errors: [],
    };
  }

  override async syncToQualifiedSheet(leads: Lead[]): Promise<SheetsSyncResult> {
    const sheet = this.mockData.get('Leads_Qualified') || [];
    let synced = 0;

    for (const lead of leads) {
      const row = LEADS_QUALIFIED_COLUMNS.map((col) => {
        const value = lead[col as keyof Lead];
        if (value === null || value === undefined) return '';
        return String(value);
      });
      sheet.push(row);
      synced++;
    }

    this.mockData.set('Leads_Qualified', sheet);

    return {
      rows_synced: synced,
      rows_updated: 0,
      qualification_changes: 0,
      errors: [],
    };
  }

  override async pullQualificationDecisions(): Promise<
    Array<{ lead_id: string; decision: QualifyDecision; notes?: string }>
  > {
    // Return empty for mock
    return [];
  }

  // Utility method for testing
  getMockData(): Map<string, string[][]> {
    return this.mockData;
  }
}

// ============================================
// Factory Function
// ============================================

export function createSheetsService(
  options?: { useMock?: boolean }
): GoogleSheetsService {
  if (options?.useMock || process.env.USE_MOCK_SHEETS === 'true') {
    return new MockGoogleSheetsService();
  }

  return new GoogleSheetsService();
}
