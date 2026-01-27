import { createAdminClient } from '@/lib/supabase/server';
import type { Lead, EnrichmentResult, EnrichmentCache } from '@/types/leads';
import { withRetry, sleep, isValidEmail, classifyEmail, extractDomain } from './utils';

// ============================================
// Configuration
// ============================================

interface EnrichmentConfig {
  hunterApiKey?: string;
  apolloApiKey?: string;
  cacheTtlHours: number;
  maxPagesToCrawl: number;
  crawlDelayMs: number;
}

function getConfig(): EnrichmentConfig {
  return {
    hunterApiKey: process.env.HUNTER_API_KEY,
    apolloApiKey: process.env.APOLLO_API_KEY,
    cacheTtlHours: parseInt(process.env.ENRICHMENT_CACHE_TTL_HOURS || '24', 10),
    maxPagesToCrawl: parseInt(process.env.ENRICHMENT_MAX_PAGES || '3', 10),
    crawlDelayMs: parseInt(process.env.ENRICHMENT_CRAWL_DELAY_MS || '1000', 10),
  };
}

// ============================================
// Email Extraction Patterns
// ============================================

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const CONTACT_PAGE_PATTERNS = [
  '/contact',
  '/contact-us',
  '/contactus',
  '/about',
  '/about-us',
  '/aboutus',
  '/team',
  '/our-team',
  '/staff',
  '/leadership',
];

// ============================================
// Enrichment Service
// ============================================

export class EnrichmentService {
  private config: EnrichmentConfig;
  private supabase: ReturnType<typeof createAdminClient>;

  constructor(config?: Partial<EnrichmentConfig>) {
    const defaultConfig = getConfig();
    this.config = { ...defaultConfig, ...config };
    this.supabase = createAdminClient();
  }

  /**
   * Enrich a single lead with email and contact information
   */
  async enrichLead(lead: Lead): Promise<EnrichmentResult> {
    if (!lead.domain && !lead.website) {
      return { emails: [], contacts: [] };
    }

    const domain = lead.domain || extractDomain(lead.website);
    if (!domain) {
      return { emails: [], contacts: [] };
    }

    // Check cache first
    const cached = await this.getCachedEnrichment(domain);
    if (cached) {
      return {
        emails: cached.emails || [],
        contacts: cached.contacts || [],
        social_profiles: cached.social_profiles,
      };
    }

    // Try multiple enrichment methods
    let result: EnrichmentResult = { emails: [], contacts: [] };

    // 1. Try website crawling first (free)
    const crawlResult = await this.crawlWebsiteForEmails(lead.website || `https://${domain}`);
    if (crawlResult.emails.length > 0) {
      result = crawlResult;
    }

    // 2. If no results, try Hunter.io (if configured)
    if (result.emails.length === 0 && this.config.hunterApiKey) {
      const hunterResult = await this.enrichWithHunter(domain);
      if (hunterResult.emails.length > 0) {
        result = hunterResult;
      }
    }

    // 3. If still no results, try Apollo (if configured)
    if (result.emails.length === 0 && this.config.apolloApiKey) {
      const apolloResult = await this.enrichWithApollo(domain, lead.business_name);
      if (apolloResult.emails.length > 0) {
        result = apolloResult;
      }
    }

    // Cache the result
    await this.cacheEnrichment(domain, result);

    return result;
  }

  /**
   * Crawl website for emails
   */
  private async crawlWebsiteForEmails(baseUrl: string): Promise<EnrichmentResult> {
    const emails: EnrichmentResult['emails'] = [];
    const visitedUrls = new Set<string>();
    const domain = extractDomain(baseUrl);

    if (!domain) {
      return { emails: [], contacts: [] };
    }

    // Normalize base URL
    let normalizedBase = baseUrl;
    if (!normalizedBase.startsWith('http')) {
      normalizedBase = `https://${normalizedBase}`;
    }

    // Pages to crawl
    const pagesToCrawl = [
      normalizedBase,
      ...CONTACT_PAGE_PATTERNS.map((path) => `${normalizedBase}${path}`),
    ];

    let pagesCrawled = 0;

    for (const url of pagesToCrawl) {
      if (pagesCrawled >= this.config.maxPagesToCrawl) {
        break;
      }

      if (visitedUrls.has(url)) {
        continue;
      }

      visitedUrls.add(url);

      try {
        const pageEmails = await this.fetchPageEmails(url, domain);
        for (const email of pageEmails) {
          // Avoid duplicates
          if (!emails.some((e) => e.email === email)) {
            emails.push({
              email,
              confidence: this.calculateEmailConfidence(email, domain),
              source: 'CRAWL',
              type: classifyEmail(email),
            });
          }
        }
        pagesCrawled++;

        // Rate limit
        if (pagesCrawled < this.config.maxPagesToCrawl) {
          await sleep(this.config.crawlDelayMs);
        }
      } catch {
        // Ignore errors for individual pages
      }
    }

    // Sort by confidence
    emails.sort((a, b) => b.confidence - a.confidence);

    return { emails, contacts: [] };
  }

  /**
   * Fetch and extract emails from a single page
   */
  private async fetchPageEmails(url: string, domain: string): Promise<string[]> {
    try {
      const response = await withRetry(
        async () => {
          const res = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            redirect: 'follow',
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          return res.text();
        },
        {
          max_retries: 2,
          base_delay_ms: 500,
          max_delay_ms: 2000,
        }
      );

      const matches = response.match(EMAIL_REGEX) || [];

      // Filter to only emails from this domain or common providers
      return matches.filter((email) => {
        const emailDomain = email.split('@')[1].toLowerCase();
        // Accept emails from the business domain
        if (emailDomain === domain.toLowerCase()) {
          return true;
        }
        // Accept common business email providers
        if (['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'].includes(emailDomain)) {
          return true;
        }
        return false;
      });
    } catch {
      return [];
    }
  }

  /**
   * Calculate confidence score for an email
   */
  private calculateEmailConfidence(email: string, domain: string): number {
    let confidence = 0.5; // Base confidence

    const emailDomain = email.split('@')[1].toLowerCase();
    const emailLocal = email.split('@')[0].toLowerCase();

    // Higher confidence if email domain matches business domain
    if (emailDomain === domain.toLowerCase()) {
      confidence += 0.3;
    } else {
      confidence -= 0.1;
    }

    // Higher confidence for personal-looking emails
    const emailType = classifyEmail(email);
    if (emailType === 'personal') {
      confidence += 0.1;
    } else if (emailType === 'generic') {
      confidence += 0.05;
    }

    // Check for common patterns that suggest validity
    if (/^[a-z]+\.[a-z]+@/.test(emailLocal)) {
      confidence += 0.1; // firstname.lastname pattern
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Enrich using Hunter.io API
   */
  private async enrichWithHunter(domain: string): Promise<EnrichmentResult> {
    if (!this.config.hunterApiKey) {
      return { emails: [], contacts: [] };
    }

    try {
      const response = await withRetry(
        async () => {
          const res = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${this.config.hunterApiKey}`
          );

          if (!res.ok) {
            throw new Error(`Hunter API error: ${res.status}`);
          }

          return res.json();
        },
        {
          max_retries: 2,
          base_delay_ms: 1000,
          max_delay_ms: 4000,
        }
      );

      const emails: EnrichmentResult['emails'] = [];
      const contacts: EnrichmentResult['contacts'] = [];

      if (response.data?.emails) {
        for (const emailData of response.data.emails) {
          if (emailData.value && isValidEmail(emailData.value)) {
            emails.push({
              email: emailData.value,
              confidence: (emailData.confidence || 50) / 100,
              source: 'HUNTER',
              type: classifyEmail(emailData.value),
            });

            if (emailData.first_name || emailData.last_name) {
              contacts.push({
                name: `${emailData.first_name || ''} ${emailData.last_name || ''}`.trim(),
                role: emailData.position,
                email: emailData.value,
                linkedin: emailData.linkedin,
              });
            }
          }
        }
      }

      return { emails, contacts };
    } catch {
      return { emails: [], contacts: [] };
    }
  }

  /**
   * Enrich using Apollo API
   */
  private async enrichWithApollo(
    domain: string,
    companyName: string
  ): Promise<EnrichmentResult> {
    if (!this.config.apolloApiKey) {
      return { emails: [], contacts: [] };
    }

    try {
      const response = await withRetry(
        async () => {
          const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': this.config.apolloApiKey!,
            },
            body: JSON.stringify({
              q_organization_domains: domain,
              page: 1,
              per_page: 5,
            }),
          });

          if (!res.ok) {
            throw new Error(`Apollo API error: ${res.status}`);
          }

          return res.json();
        },
        {
          max_retries: 2,
          base_delay_ms: 1000,
          max_delay_ms: 4000,
        }
      );

      const emails: EnrichmentResult['emails'] = [];
      const contacts: EnrichmentResult['contacts'] = [];

      if (response.people) {
        for (const person of response.people) {
          if (person.email && isValidEmail(person.email)) {
            emails.push({
              email: person.email,
              confidence: person.email_status === 'verified' ? 0.95 : 0.7,
              source: 'APOLLO',
              type: 'personal',
            });

            contacts.push({
              name: person.name,
              role: person.title,
              email: person.email,
              linkedin: person.linkedin_url,
              phone: person.phone_numbers?.[0]?.sanitized_number,
            });
          }
        }
      }

      return { emails, contacts };
    } catch {
      return { emails: [], contacts: [] };
    }
  }

  /**
   * Get cached enrichment data
   */
  private async getCachedEnrichment(domain: string): Promise<EnrichmentCache | null> {
    const { data, error } = await this.supabase
      .from('lead_enrichment_cache')
      .select('*')
      .eq('domain', domain.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data as EnrichmentCache;
  }

  /**
   * Cache enrichment data
   */
  private async cacheEnrichment(
    domain: string,
    result: EnrichmentResult
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.cacheTtlHours);

    const bestConfidence =
      result.emails.length > 0
        ? Math.max(...result.emails.map((e) => e.confidence))
        : 0;

    await this.supabase.from('lead_enrichment_cache').upsert(
      {
        domain: domain.toLowerCase(),
        emails: result.emails,
        contacts: result.contacts,
        social_profiles: result.social_profiles,
        source: result.emails[0]?.source || 'NONE',
        confidence: bestConfidence,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'domain',
      }
    );
  }

  /**
   * Generate personalization summary for a lead
   */
  async generatePersonalization(lead: Lead): Promise<string> {
    const parts: string[] = [];

    // Category-based personalization
    if (lead.category_primary) {
      parts.push(`${lead.category_primary} business`);
    }

    // Location-based
    if (lead.city && lead.state) {
      parts.push(`located in ${lead.city}, ${lead.state}`);
    } else if (lead.city) {
      parts.push(`located in ${lead.city}`);
    }

    // Rating-based
    if (lead.rating && lead.rating >= 4.5) {
      parts.push(`highly rated (${lead.rating} stars)`);
    } else if (lead.rating && lead.rating >= 4.0) {
      parts.push(`well-reviewed (${lead.rating} stars)`);
    }

    // Review count
    if (lead.review_count && lead.review_count > 100) {
      parts.push(`with ${lead.review_count}+ customer reviews`);
    } else if (lead.review_count && lead.review_count > 50) {
      parts.push(`with many satisfied customers`);
    }

    // Website presence
    if (lead.website) {
      parts.push(`with established online presence`);
    }

    if (parts.length === 0) {
      return `Local ${lead.business_type || 'business'} in the area`;
    }

    return parts.join(', ');
  }

  /**
   * Enrich multiple leads with concurrency control
   */
  async enrichLeads(
    leads: Lead[],
    options?: {
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<
    Array<{
      lead_id: string;
      result: EnrichmentResult;
      personalization: string;
      error?: string;
    }>
  > {
    const concurrency = options?.concurrency || 3;
    const results: Array<{
      lead_id: string;
      result: EnrichmentResult;
      personalization: string;
      error?: string;
    }> = [];

    let completed = 0;

    // Process in batches
    for (let i = 0; i < leads.length; i += concurrency) {
      const batch = leads.slice(i, i + concurrency);

      const batchPromises = batch.map(async (lead) => {
        try {
          const result = await this.enrichLead(lead);
          const personalization = await this.generatePersonalization(lead);

          completed++;
          options?.onProgress?.(completed, leads.length);

          return {
            lead_id: lead.lead_id,
            result,
            personalization,
          };
        } catch (error) {
          completed++;
          options?.onProgress?.(completed, leads.length);

          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            lead_id: lead.lead_id,
            result: { emails: [], contacts: [] },
            personalization: '',
            error: errorMessage,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches
      if (i + concurrency < leads.length) {
        await sleep(1000);
      }
    }

    return results;
  }
}

// ============================================
// Mock Service for Development
// ============================================

export class MockEnrichmentService extends EnrichmentService {
  constructor() {
    super({
      cacheTtlHours: 24,
      maxPagesToCrawl: 3,
      crawlDelayMs: 0,
    });
  }

  override async enrichLead(lead: Lead): Promise<EnrichmentResult> {
    // Return mock data based on lead
    const domain = lead.domain || extractDomain(lead.website);

    if (!domain) {
      return { emails: [], contacts: [] };
    }

    // Simulate some leads having emails
    const businessNameSlug = lead.business_name.toLowerCase().replace(/[^a-z]/g, '');
    const mockEmail = `info@${domain}`;

    return {
      emails: [
        {
          email: mockEmail,
          confidence: 0.85,
          source: 'MOCK',
          type: 'generic',
        },
      ],
      contacts: [
        {
          name: 'Business Owner',
          role: 'Owner',
          email: mockEmail,
        },
      ],
    };
  }
}

// ============================================
// Factory Function
// ============================================

export function createEnrichmentService(
  options?: { useMock?: boolean }
): EnrichmentService {
  if (options?.useMock || process.env.USE_MOCK_ENRICHMENT === 'true') {
    return new MockEnrichmentService();
  }

  return new EnrichmentService();
}
