import type {
  AppifyResponse,
  AppifyBusinessResult,
  WorkflowFormInput,
  NormalizedLead,
} from '@/types/leads';
import {
  withRetry,
  RateLimiter,
  buildAppifyQuery,
  normalizeAppifyResult,
} from './utils';

// ============================================
// Configuration
// ============================================

interface AppifyConfig {
  apiKey: string;
  endpointUrl: string;
  rateLimit: number; // requests per minute
}

function getConfig(): AppifyConfig {
  const apiKey = process.env.APPIFY_API_KEY;
  const endpointUrl = process.env.APPIFY_ENDPOINT_URL || 'https://api.appify.com/v1/google-places';

  if (!apiKey) {
    throw new Error('APPIFY_API_KEY environment variable is required');
  }

  return {
    apiKey,
    endpointUrl,
    rateLimit: parseInt(process.env.APPIFY_RATE_LIMIT || '30', 10),
  };
}

// ============================================
// Appify API Client
// ============================================

export class AppifyScraperService {
  private config: AppifyConfig;
  private rateLimiter: RateLimiter;

  constructor(config?: Partial<AppifyConfig>) {
    const defaultConfig = getConfig();
    this.config = { ...defaultConfig, ...config };
    this.rateLimiter = new RateLimiter(this.config.rateLimit);
  }

  /**
   * Fetches a single page of results from Appify
   */
  private async fetchPage(
    query: string,
    options: {
      location?: string;
      radius?: number;
      maxResults?: number;
      cursor?: string;
    }
  ): Promise<AppifyResponse> {
    await this.rateLimiter.acquire();

    const requestBody = {
      query,
      location: options.location,
      radius: options.radius,
      maxResults: options.maxResults || 20,
      cursor: options.cursor,
    };

    const response = await withRetry(
      async () => {
        const res = await fetch(this.config.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Appify API error (status: ${res.status}): ${errorText}`);
        }

        return res.json() as Promise<AppifyResponse>;
      },
      {
        max_retries: 3,
        base_delay_ms: 2000,
        max_delay_ms: 16000,
      }
    );

    return response;
  }

  /**
   * Fetches all results with pagination, up to maxResults
   */
  async fetchAllLeads(
    input: WorkflowFormInput,
    options?: {
      onPage?: (page: number, results: AppifyBusinessResult[]) => Promise<void>;
      startCursor?: string;
    }
  ): Promise<{
    results: AppifyBusinessResult[];
    totalFetched: number;
    pages: number;
    errors: string[];
  }> {
    const query = buildAppifyQuery(input);
    const maxResults = input.max_results || 100;
    const results: AppifyBusinessResult[] = [];
    const errors: string[] = [];
    let cursor = options?.startCursor;
    let page = 0;
    let hasMore = true;

    // Calculate page size - Appify typically returns 20-50 per page
    const pageSize = Math.min(50, maxResults);

    while (hasMore && results.length < maxResults) {
      page++;

      try {
        const response = await this.fetchPage(query, {
          location: input.zip_code || input.city,
          radius: this.milesToMeters(input.radius_miles),
          maxResults: pageSize,
          cursor,
        });

        if (!response.success) {
          errors.push(`Page ${page}: ${response.error || 'Unknown error'}`);
          break;
        }

        const pageResults = response.data || [];
        results.push(...pageResults);

        // Call page callback for progress tracking / raw storage
        if (options?.onPage) {
          await options.onPage(page, pageResults);
        }

        // Check if more pages available
        hasMore = response.hasMore === true && !!response.cursor;
        cursor = response.cursor;

        // Stop if we've reached max results
        if (results.length >= maxResults) {
          break;
        }

        // Stop if page returned no results
        if (pageResults.length === 0) {
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Page ${page}: ${errorMessage}`);
        // Continue to next page on error
      }
    }

    // Trim to max results
    const trimmedResults = results.slice(0, maxResults);

    return {
      results: trimmedResults,
      totalFetched: trimmedResults.length,
      pages: page,
      errors,
    };
  }

  /**
   * Fetches and normalizes leads in one step
   */
  async fetchAndNormalizeLeads(
    input: WorkflowFormInput,
    options?: {
      onPage?: (page: number, rawResults: AppifyBusinessResult[], normalizedResults: NormalizedLead[]) => Promise<void>;
      startCursor?: string;
    }
  ): Promise<{
    leads: NormalizedLead[];
    totalFetched: number;
    pages: number;
    errors: string[];
  }> {
    const allLeads: NormalizedLead[] = [];

    const { results, totalFetched, pages, errors } = await this.fetchAllLeads(input, {
      startCursor: options?.startCursor,
      onPage: async (page, rawResults) => {
        // Normalize each result
        const normalized = rawResults.map((result) =>
          normalizeAppifyResult(result, {
            campaign_name: input.campaign_name,
            business_type: input.business_type,
            search_city: input.city,
            search_zip: input.zip_code,
            radius_miles: input.radius_miles,
          })
        );

        allLeads.push(...normalized);

        // Call the outer callback
        if (options?.onPage) {
          await options.onPage(page, rawResults, normalized);
        }
      },
    });

    return {
      leads: allLeads,
      totalFetched,
      pages,
      errors,
    };
  }

  /**
   * Convert miles to meters for Appify API
   */
  private milesToMeters(miles: number): number {
    return Math.round(miles * 1609.344);
  }
}

// ============================================
// Mock Service for Development
// ============================================

export class MockAppifyScraperService extends AppifyScraperService {
  private mockData: AppifyBusinessResult[];

  constructor(mockData?: AppifyBusinessResult[]) {
    super({
      apiKey: 'mock-key',
      endpointUrl: 'mock://appify',
      rateLimit: 1000,
    });
    this.mockData = mockData || this.generateMockData();
  }

  private generateMockData(): AppifyBusinessResult[] {
    const businesses = [
      { name: "Joe's Plumbing", category: 'Plumber', rating: 4.5 },
      { name: 'City Plumbing Services', category: 'Plumber', rating: 4.2 },
      { name: 'Quick Fix Plumbers', category: 'Plumber', rating: 4.8 },
      { name: 'Reliable Plumbing Co', category: 'Plumber', rating: 3.9 },
      { name: 'Pro Pipe Solutions', category: 'Plumber', rating: 4.6 },
      { name: 'Emergency Plumbing 24/7', category: 'Plumber', rating: 4.1 },
      { name: 'Master Plumbers Inc', category: 'Plumber', rating: 4.7 },
      { name: 'Budget Plumbing', category: 'Plumber', rating: 3.5 },
      { name: 'Premium Pipe Works', category: 'Plumber', rating: 4.9 },
      { name: 'Local Plumbing Experts', category: 'Plumber', rating: 4.3 },
    ];

    return businesses.map((b, i) => ({
      placeId: `mock_place_${i}`,
      name: b.name,
      address: `${100 + i} Main Street`,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: `9000${i}`,
      country: 'USA',
      latitude: 34.0522 + (i * 0.01),
      longitude: -118.2437 + (i * 0.01),
      phone: `(310) 555-${String(1000 + i).slice(-4)}`,
      website: `https://www.${b.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      category: b.category,
      rating: b.rating,
      reviewCount: Math.floor(Math.random() * 200) + 10,
      isOpen: true,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:mock_place_${i}`,
    }));
  }

  override async fetchAllLeads(
    input: WorkflowFormInput,
    options?: {
      onPage?: (page: number, results: AppifyBusinessResult[]) => Promise<void>;
      startCursor?: string;
    }
  ): Promise<{
    results: AppifyBusinessResult[];
    totalFetched: number;
    pages: number;
    errors: string[];
  }> {
    // Simulate pagination
    const pageSize = 5;
    const maxResults = Math.min(input.max_results || 100, this.mockData.length);
    const results = this.mockData.slice(0, maxResults);
    const pages = Math.ceil(results.length / pageSize);

    // Call onPage for each simulated page
    if (options?.onPage) {
      for (let i = 0; i < pages; i++) {
        const pageResults = results.slice(i * pageSize, (i + 1) * pageSize);
        await options.onPage(i + 1, pageResults);
      }
    }

    return {
      results,
      totalFetched: results.length,
      pages,
      errors: [],
    };
  }
}

// ============================================
// Factory Function
// ============================================

export function createAppifyService(
  options?: { useMock?: boolean; mockData?: AppifyBusinessResult[] }
): AppifyScraperService {
  if (options?.useMock || process.env.USE_MOCK_APPIFY === 'true') {
    return new MockAppifyScraperService(options?.mockData);
  }

  return new AppifyScraperService();
}
