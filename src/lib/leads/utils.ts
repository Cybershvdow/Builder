import { createHash } from 'crypto';
import type {
  AppifyBusinessResult,
  NormalizedLead,
  WorkflowFormInput,
  WorkflowFormValidationErrors,
  RetryConfig,
} from '@/types/leads';

// ============================================
// Validation
// ============================================

export function validateWorkflowInput(
  input: Partial<WorkflowFormInput>
): WorkflowFormValidationErrors {
  const errors: WorkflowFormValidationErrors = {};

  if (!input.business_type?.trim()) {
    errors.business_type = 'Business type is required';
  }

  if (!input.city?.trim()) {
    errors.city = 'City is required';
  }

  if (input.radius_miles !== undefined) {
    if (input.radius_miles < 1 || input.radius_miles > 50) {
      errors.radius_miles = 'Radius must be between 1 and 50 miles';
    }
  }

  if (input.max_results !== undefined) {
    if (input.max_results < 1 || input.max_results > 500) {
      errors.max_results = 'Max results must be between 1 and 500';
    }
  }

  if (input.zip_code && !/^\d{5}(-\d{4})?$/.test(input.zip_code)) {
    errors.zip_code = 'Invalid ZIP code format';
  }

  return errors;
}

export function isValidInput(input: Partial<WorkflowFormInput>): input is WorkflowFormInput {
  const errors = validateWorkflowInput(input);
  return Object.keys(errors).length === 0;
}

// ============================================
// Phone Normalization
// ============================================

export function normalizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) return undefined;

  // US phone number handling
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // International format - assume it's already correct
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return undefined;
}

// ============================================
// Domain Extraction
// ============================================

export function extractDomain(website: string | undefined | null): string | undefined {
  if (!website) return undefined;

  try {
    // Add protocol if missing
    let url = website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();

    // Remove www. prefix
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    return domain;
  } catch {
    return undefined;
  }
}

// ============================================
// Lead ID Generation
// ============================================

function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

export function generateLeadId(lead: {
  place_id?: string | null;
  phone_normalized?: string | null;
  business_name: string;
  address_full?: string | null;
  domain?: string | null;
}): string {
  // Priority 1: Google Place ID (most stable identifier)
  if (lead.place_id) {
    return `place_${hashString(`place:${lead.place_id}`)}`;
  }

  const nameLower = lead.business_name.toLowerCase().trim();

  // Priority 2: Phone + Business Name
  if (lead.phone_normalized) {
    return `phone_${hashString(`phone:${lead.phone_normalized}:${nameLower}`)}`;
  }

  // Priority 3: Address + Business Name
  if (lead.address_full) {
    const addrLower = lead.address_full.toLowerCase().trim();
    return `addr_${hashString(`addr:${addrLower}:${nameLower}`)}`;
  }

  // Priority 4: Domain + Business Name
  if (lead.domain) {
    return `domain_${hashString(`domain:${lead.domain.toLowerCase()}:${nameLower}`)}`;
  }

  // Fallback: Generate UUID-like string (no dedup possible)
  return `uuid_${hashString(`${Date.now()}_${Math.random()}_${nameLower}`)}`;
}

// ============================================
// Address Parsing
// ============================================

interface ParsedAddress {
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export function parseAddress(fullAddress: string | undefined | null): ParsedAddress {
  if (!fullAddress) return {};

  // Common US address pattern: "123 Main St, City, ST 12345, USA"
  const parts = fullAddress.split(',').map((p) => p.trim());

  if (parts.length === 0) return {};

  const result: ParsedAddress = {};

  // Last part might be country
  const lastPart = parts[parts.length - 1];
  if (['USA', 'US', 'United States', 'Canada', 'CA'].includes(lastPart.toUpperCase())) {
    result.country = lastPart;
    parts.pop();
  }

  // Second to last might be "State ZIP"
  if (parts.length > 0) {
    const stateZipPart = parts[parts.length - 1];
    const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
    if (stateZipMatch) {
      result.state = stateZipMatch[1].toUpperCase();
      result.zip = stateZipMatch[2];
      parts.pop();
    } else {
      // Try just state
      const stateMatch = stateZipPart.match(/^([A-Z]{2})$/i);
      if (stateMatch) {
        result.state = stateMatch[1].toUpperCase();
        parts.pop();
      }
      // Try just zip
      const zipMatch = stateZipPart.match(/^(\d{5}(?:-\d{4})?)$/);
      if (zipMatch) {
        result.zip = zipMatch[1];
        parts.pop();
      }
    }
  }

  // Next part is city
  if (parts.length > 0) {
    result.city = parts.pop();
  }

  // Remaining parts are street address
  if (parts.length > 0) {
    result.street_address = parts.join(', ');
  }

  return result;
}

// ============================================
// Appify Result Normalization
// ============================================

export function normalizeAppifyResult(
  result: AppifyBusinessResult,
  searchContext: {
    campaign_name?: string;
    business_type: string;
    search_city: string;
    search_zip?: string;
    radius_miles: number;
  }
): NormalizedLead {
  // Extract and normalize phone
  const phone = result.phone || undefined;
  const phone_normalized = normalizePhone(phone);

  // Extract and normalize website/domain
  const website = result.website || undefined;
  const domain = extractDomain(website);

  // Build full address
  const addressParts = [
    result.streetAddress || result.address,
    result.city,
    result.state,
    result.zipCode || result.zip,
    result.country,
  ].filter(Boolean);
  const address_full = addressParts.length > 0 ? addressParts.join(', ') : undefined;

  // Parse address if we only have full address
  let parsed: ParsedAddress = {};
  if (address_full && !result.city) {
    parsed = parseAddress(address_full);
  }

  // Build listing URL
  const listing_url =
    result.mapsUrl ||
    result.url ||
    (result.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${result.placeId}`
      : undefined);

  // Normalize categories
  const categories_all = result.categories || (result.category ? [result.category] : undefined);
  const category_primary = result.category || categories_all?.[0];

  // Build the normalized lead
  const normalized: Omit<NormalizedLead, 'lead_id'> = {
    business_name: result.name,
    place_id: result.placeId || undefined,
    google_id: result.googleId || undefined,
    listing_url,
    address_full,
    street_address: result.streetAddress || parsed.street_address,
    city: result.city || parsed.city || searchContext.search_city,
    state: result.state || parsed.state,
    zip: result.zipCode || result.zip || parsed.zip || searchContext.search_zip,
    country: result.country || parsed.country,
    lat: result.latitude,
    lng: result.longitude,
    phone,
    phone_normalized,
    website,
    domain,
    email: result.email || undefined,
    category_primary,
    categories_all,
    rating: result.rating,
    review_count: result.reviewCount,
    price_level: result.priceLevel || undefined,
    hours: result.hours,
    open_status: result.openStatus || (result.isOpen !== undefined ? (result.isOpen ? 'Open' : 'Closed') : undefined),
    description: result.description || undefined,
    services: result.services,
    photos: result.photos,
    has_booking: result.hasBooking,
    appointment_url: result.bookingUrl || undefined,
    raw_json: result as Record<string, unknown>,
  };

  // Generate stable lead_id
  const lead_id = generateLeadId({
    place_id: normalized.place_id,
    phone_normalized: normalized.phone_normalized,
    business_name: normalized.business_name,
    address_full: normalized.address_full,
    domain: normalized.domain,
  });

  return {
    ...normalized,
    lead_id,
  };
}

// ============================================
// Retry Logic
// ============================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    max_retries: 3,
    base_delay_ms: 1000,
    max_delay_ms: 10000,
  }
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.max_retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on 4xx errors (except 429)
      if (lastError.message.includes('status: 4') && !lastError.message.includes('status: 429')) {
        throw lastError;
      }

      if (attempt < config.max_retries) {
        const delay = Math.min(
          config.base_delay_ms * Math.pow(2, attempt),
          config.max_delay_ms
        );
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Rate Limiting
// ============================================

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRatePerSecond: number;

  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.refillRatePerSecond = requestsPerMinute / 60;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / this.refillRatePerSecond) * 1000;
      await sleep(waitTime);
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerSecond);
    this.lastRefill = now;
  }
}

// ============================================
// Email Validation
// ============================================

const GENERIC_EMAIL_PATTERNS = [
  /^info@/i,
  /^contact@/i,
  /^hello@/i,
  /^support@/i,
  /^admin@/i,
  /^sales@/i,
  /^help@/i,
  /^office@/i,
  /^mail@/i,
  /^webmaster@/i,
  /^noreply@/i,
  /^no-reply@/i,
];

export function classifyEmail(email: string): 'personal' | 'generic' | 'support' {
  const emailLower = email.toLowerCase();

  if (/^support@|^help@|^service@/i.test(emailLower)) {
    return 'support';
  }

  for (const pattern of GENERIC_EMAIL_PATTERNS) {
    if (pattern.test(emailLower)) {
      return 'generic';
    }
  }

  return 'personal';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// Merge Logic for Updates
// ============================================

export function shouldUpdateField(
  existingValue: unknown,
  newValue: unknown
): boolean {
  // If new value is null/undefined/empty, keep existing
  if (newValue === null || newValue === undefined || newValue === '') {
    return false;
  }

  // If existing is empty, use new
  if (existingValue === null || existingValue === undefined || existingValue === '') {
    return true;
  }

  // For arrays, prefer longer array
  if (Array.isArray(existingValue) && Array.isArray(newValue)) {
    return newValue.length > existingValue.length;
  }

  // For objects, prefer more keys
  if (typeof existingValue === 'object' && typeof newValue === 'object') {
    return (
      Object.keys(newValue as object).length > Object.keys(existingValue as object).length
    );
  }

  // For strings, prefer longer (more complete) value
  if (typeof existingValue === 'string' && typeof newValue === 'string') {
    return newValue.length > existingValue.length;
  }

  // Default: keep existing
  return false;
}

export function mergeLeadData<T extends Record<string, unknown>>(
  existing: T,
  incoming: Partial<T>,
  fieldsToMerge: (keyof T)[]
): { merged: T; updatedFields: string[] } {
  const merged = { ...existing };
  const updatedFields: string[] = [];

  for (const field of fieldsToMerge) {
    if (shouldUpdateField(existing[field], incoming[field])) {
      (merged as Record<string, unknown>)[field as string] = incoming[field];
      updatedFields.push(field as string);
    }
  }

  return { merged, updatedFields };
}

// ============================================
// Batch Processing
// ============================================

export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize: number;
    concurrency: number;
    delayBetweenBatches?: number;
  }
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];

  for (let i = 0; i < items.length; i += options.batchSize) {
    const batch = items.slice(i, i + options.batchSize);

    // Process batch with concurrency limit
    const batchPromises = batch.map(async (item) => {
      try {
        const result = await processor(item);
        results.push(result);
      } catch (error) {
        errors.push({
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    });

    // Wait for all items in batch to complete
    await Promise.all(batchPromises);

    // Delay between batches if specified
    if (options.delayBetweenBatches && i + options.batchSize < items.length) {
      await sleep(options.delayBetweenBatches);
    }
  }

  return { results, errors };
}

// ============================================
// Query Building for Appify
// ============================================

export function buildAppifyQuery(input: WorkflowFormInput): string {
  if (input.zip_code) {
    return `${input.business_type} near ${input.zip_code}`;
  }
  return `${input.business_type} in ${input.city}`;
}
