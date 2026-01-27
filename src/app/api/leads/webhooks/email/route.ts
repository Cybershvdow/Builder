import { NextRequest, NextResponse } from 'next/server';
import { createEmailService } from '@/lib/leads/email-service';

// Webhook handler for email events (Resend webhooks)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature (in production, verify with Resend's webhook secret)
    const signature = request.headers.get('svix-signature');
    // TODO: Verify signature with Resend webhook secret

    const emailService = createEmailService();

    // Handle different event types from Resend
    const eventType = body.type;
    const eventData = body.data;

    let mappedType: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';

    switch (eventType) {
      case 'email.delivered':
        mappedType = 'delivered';
        break;
      case 'email.opened':
        mappedType = 'opened';
        break;
      case 'email.clicked':
        mappedType = 'clicked';
        break;
      case 'email.bounced':
        mappedType = 'bounced';
        break;
      case 'email.complained':
        mappedType = 'complained';
        break;
      default:
        return NextResponse.json({ received: true, ignored: true });
    }

    await emailService.handleEmailEvent({
      type: mappedType,
      email: eventData.to?.[0] || eventData.email,
      messageId: eventData.email_id || eventData.id,
      bounceType: eventData.bounce_type === 'hard' ? 'hard' : 'soft',
      timestamp: eventData.created_at || new Date().toISOString(),
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Webhook processing failed', message: errorMessage },
      { status: 500 }
    );
  }
}
