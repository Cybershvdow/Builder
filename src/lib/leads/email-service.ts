import { createAdminClient } from '@/lib/supabase/server';
import type { Lead, EmailTemplate, EmailLog } from '@/types/leads';
import { withRetry, sleep } from './utils';

// ============================================
// Configuration
// ============================================

interface EmailConfig {
  provider: 'RESEND' | 'SENDGRID';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  dailyLimit: number;
  minConfidence: number;
  replyTo?: string;
}

function getConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required for email sending');
  }

  return {
    provider: 'RESEND',
    apiKey,
    fromEmail: process.env.EMAIL_FROM_ADDRESS || process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'noreply@example.com',
    fromName: process.env.EMAIL_FROM_NAME || process.env.NEXT_PUBLIC_COMPANY_NAME || 'Lead Outreach',
    dailyLimit: parseInt(process.env.LEAD_WORKFLOW_DAILY_EMAIL_LIMIT || '50', 10),
    minConfidence: parseFloat(process.env.LEAD_WORKFLOW_MIN_EMAIL_CONFIDENCE || '0.70'),
    replyTo: process.env.EMAIL_REPLY_TO,
  };
}

// ============================================
// Email Templates
// ============================================

export function generateOutreachEmail(lead: Lead): EmailTemplate {
  const businessName = lead.business_name;
  const category = lead.category_primary || lead.business_type || 'your business';
  const city = lead.city || '';
  const personalization = lead.personalization_summary || '';

  // Generate subject line
  const subjectOptions = [
    `Quick question for ${businessName}`,
    `Partnership opportunity for ${businessName}`,
    `${businessName} - Let's connect`,
    `Idea for ${businessName}`,
  ];
  const subject = subjectOptions[Math.floor(Math.random() * subjectOptions.length)];

  // Generate email body (80-140 words)
  const bodyText = `Hi${lead.contact_name ? ` ${lead.contact_name.split(' ')[0]}` : ''},

I came across ${businessName} while researching ${category} businesses${city ? ` in ${city}` : ''}.

${personalization ? `I noticed you're ${personalization}. ` : ''}Your online presence caught my attention, and I wanted to reach out directly.

We help local businesses like yours grow their customer base and streamline operations. I'd love to share a few ideas that have worked well for similar businesses.

Would you be open to a brief 10-minute call this week? I promise to keep it short and valuable.

Looking forward to connecting,

Best regards`;

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hi${lead.contact_name ? ` ${lead.contact_name.split(' ')[0]}` : ''},</p>

  <p>I came across <strong>${businessName}</strong> while researching ${category} businesses${city ? ` in ${city}` : ''}.</p>

  ${personalization ? `<p>I noticed you're ${personalization}. Your online presence caught my attention, and I wanted to reach out directly.</p>` : '<p>Your online presence caught my attention, and I wanted to reach out directly.</p>'}

  <p>We help local businesses like yours grow their customer base and streamline operations. I'd love to share a few ideas that have worked well for similar businesses.</p>

  <p>Would you be open to a brief 10-minute call this week? I promise to keep it short and valuable.</p>

  <p>Looking forward to connecting,</p>

  <p>Best regards</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">
    If you'd prefer not to receive emails from us, simply reply with "unsubscribe".
  </p>
</body>
</html>`;

  return {
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
  };
}

// ============================================
// Email Service
// ============================================

export class EmailOutreachService {
  private config: EmailConfig;
  private supabase: ReturnType<typeof createAdminClient>;

  constructor(config?: Partial<EmailConfig>) {
    const defaultConfig = getConfig();
    this.config = { ...defaultConfig, ...config };
    this.supabase = createAdminClient();
  }

  /**
   * Check if an email is blacklisted
   */
  async isBlacklisted(email: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('lead_email_blacklist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return !!data;
  }

  /**
   * Check daily send count
   */
  async getDailySendCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await this.supabase
      .from('lead_email_log')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today.toISOString());

    return count || 0;
  }

  /**
   * Check if we can send more emails today
   */
  async canSendEmail(): Promise<{ canSend: boolean; remaining: number }> {
    const sent = await this.getDailySendCount();
    const remaining = Math.max(0, this.config.dailyLimit - sent);
    return { canSend: remaining > 0, remaining };
  }

  /**
   * Send an email via Resend
   */
  private async sendViaResend(
    to: string,
    template: EmailTemplate
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await withRetry(
        async () => {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${this.config.fromName} <${this.config.fromEmail}>`,
              to: [to],
              reply_to: this.config.replyTo,
              subject: template.subject,
              html: template.body_html,
              text: template.body_text,
            }),
          });

          if (!res.ok) {
            const error = await res.text();
            throw new Error(`Resend API error (${res.status}): ${error}`);
          }

          return res.json();
        },
        {
          max_retries: 2,
          base_delay_ms: 1000,
          max_delay_ms: 4000,
        }
      );

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Log an email send
   */
  private async logEmail(
    leadId: string,
    to: string,
    template: EmailTemplate,
    result: { success: boolean; messageId?: string; error?: string }
  ): Promise<void> {
    await this.supabase.from('lead_email_log').insert({
      lead_id: leadId,
      to_email: to,
      from_email: this.config.fromEmail,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      provider: this.config.provider,
      provider_message_id: result.messageId,
      status: result.success ? 'SENT' : 'BOUNCED',
      bounce_reason: result.error,
    });
  }

  /**
   * Add email to blacklist
   */
  async addToBlacklist(
    email: string,
    reason: 'HARD_BOUNCE' | 'SOFT_BOUNCE' | 'UNSUBSCRIBE' | 'COMPLAINT' | 'MANUAL'
  ): Promise<void> {
    const domain = email.split('@')[1];

    await this.supabase.from('lead_email_blacklist').upsert(
      {
        email: email.toLowerCase(),
        domain: domain?.toLowerCase(),
        reason,
      },
      {
        onConflict: 'email',
      }
    );
  }

  /**
   * Send outreach email to a lead
   */
  async sendOutreachEmail(
    lead: Lead,
    template?: EmailTemplate
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
  }> {
    const toEmail = lead.contact_email || lead.email;

    // Validation checks
    if (!toEmail) {
      return { success: false, skipped: true, skipReason: 'No email address' };
    }

    if (lead.email_confidence !== undefined && lead.email_confidence < this.config.minConfidence) {
      return {
        success: false,
        skipped: true,
        skipReason: `Email confidence ${lead.email_confidence} below threshold ${this.config.minConfidence}`,
      };
    }

    // Check blacklist
    if (await this.isBlacklisted(toEmail)) {
      return { success: false, skipped: true, skipReason: 'Email is blacklisted' };
    }

    // Check daily limit
    const { canSend, remaining } = await this.canSendEmail();
    if (!canSend) {
      return { success: false, skipped: true, skipReason: 'Daily email limit reached' };
    }

    // Generate template if not provided
    const emailTemplate = template || generateOutreachEmail(lead);

    // Send email
    const result = await this.sendViaResend(toEmail, emailTemplate);

    // Log the email
    await this.logEmail(lead.id, toEmail, emailTemplate, result);

    // If hard bounce, add to blacklist
    if (!result.success && result.error?.includes('hard bounce')) {
      await this.addToBlacklist(toEmail, 'HARD_BOUNCE');
    }

    return result;
  }

  /**
   * Send emails to multiple leads with rate limiting
   */
  async sendBulkOutreach(
    leads: Lead[],
    options?: {
      delayBetweenEmails?: number;
      onProgress?: (sent: number, total: number, errors: number) => void;
    }
  ): Promise<{
    sent: number;
    skipped: number;
    errors: Array<{ lead_id: string; error: string }>;
  }> {
    const delay = options?.delayBetweenEmails || 2000;
    let sent = 0;
    let skipped = 0;
    const errors: Array<{ lead_id: string; error: string }> = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];

      // Check if we can still send
      const { canSend } = await this.canSendEmail();
      if (!canSend) {
        // Stop sending - daily limit reached
        for (let j = i; j < leads.length; j++) {
          skipped++;
        }
        break;
      }

      const result = await this.sendOutreachEmail(lead);

      if (result.success) {
        sent++;
      } else if (result.skipped) {
        skipped++;
      } else {
        errors.push({ lead_id: lead.lead_id, error: result.error || 'Unknown error' });
      }

      options?.onProgress?.(sent, leads.length, errors.length);

      // Rate limit
      if (i < leads.length - 1) {
        await sleep(delay);
      }
    }

    return { sent, skipped, errors };
  }

  /**
   * Handle webhook for email events (bounces, opens, clicks)
   */
  async handleEmailEvent(event: {
    type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
    email: string;
    messageId: string;
    bounceType?: 'hard' | 'soft';
    timestamp: string;
  }): Promise<void> {
    const updateData: Partial<EmailLog> = {};

    switch (event.type) {
      case 'delivered':
        updateData.status = 'DELIVERED';
        updateData.delivered_at = event.timestamp;
        break;
      case 'opened':
        updateData.status = 'OPENED';
        updateData.opened_at = event.timestamp;
        break;
      case 'clicked':
        updateData.status = 'CLICKED';
        updateData.clicked_at = event.timestamp;
        break;
      case 'bounced':
        updateData.status = 'BOUNCED';
        updateData.bounced_at = event.timestamp;
        updateData.bounce_type = event.bounceType === 'hard' ? 'HARD' : 'SOFT';
        // Add to blacklist for hard bounces
        if (event.bounceType === 'hard') {
          await this.addToBlacklist(event.email, 'HARD_BOUNCE');
        }
        break;
      case 'complained':
        updateData.status = 'COMPLAINED';
        await this.addToBlacklist(event.email, 'COMPLAINT');
        break;
    }

    await this.supabase
      .from('lead_email_log')
      .update(updateData)
      .eq('provider_message_id', event.messageId);

    // Also update the lead record
    if (event.type === 'bounced') {
      await this.supabase
        .from('leads')
        .update({
          status: 'BOUNCED',
          email_bounced_at: event.timestamp,
        })
        .eq('contact_email', event.email);
    } else if (event.type === 'opened') {
      await this.supabase
        .from('leads')
        .update({ email_opened_at: event.timestamp })
        .eq('contact_email', event.email);
    } else if (event.type === 'clicked') {
      await this.supabase
        .from('leads')
        .update({ email_clicked_at: event.timestamp })
        .eq('contact_email', event.email);
    }
  }
}

// ============================================
// Mock Service for Development
// ============================================

export class MockEmailOutreachService extends EmailOutreachService {
  private sentEmails: Array<{ to: string; subject: string; lead_id: string }> = [];

  constructor() {
    super({
      provider: 'RESEND',
      apiKey: 'mock-key',
      fromEmail: 'test@example.com',
      fromName: 'Test',
      dailyLimit: 100,
      minConfidence: 0.70,
    });
  }

  override async isBlacklisted(): Promise<boolean> {
    return false;
  }

  override async getDailySendCount(): Promise<number> {
    return this.sentEmails.length;
  }

  override async sendOutreachEmail(
    lead: Lead,
    template?: EmailTemplate
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
  }> {
    const toEmail = lead.contact_email || lead.email;

    if (!toEmail) {
      return { success: false, skipped: true, skipReason: 'No email address' };
    }

    const emailTemplate = template || generateOutreachEmail(lead);

    this.sentEmails.push({
      to: toEmail,
      subject: emailTemplate.subject,
      lead_id: lead.lead_id,
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
  }

  // Utility for testing
  getSentEmails(): Array<{ to: string; subject: string; lead_id: string }> {
    return this.sentEmails;
  }

  clearSentEmails(): void {
    this.sentEmails = [];
  }
}

// ============================================
// Factory Function
// ============================================

export function createEmailService(
  options?: { useMock?: boolean }
): EmailOutreachService {
  if (options?.useMock || process.env.USE_MOCK_EMAIL === 'true') {
    return new MockEmailOutreachService();
  }

  return new EmailOutreachService();
}
