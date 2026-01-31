import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Helper to extract company ID from inbound email address
function extractCompanyId(toAddress: string): string | null {
  // Format: loads+{companyId}@domain.com
  const match = toAddress.match(/loads\+([^@]+)@/);
  return match ? match[1] : null;
}

// Helper to parse email content and extract structured data
async function extractLoadFields(subject: string, body: string): Promise<Record<string, unknown>> {
  // In production, this would call OpenAI to parse the email
  // For MVP, we do basic extraction
  const fields: Record<string, unknown> = {};

  // Extract rate (look for $ amounts)
  const rateMatch = body.match(/\$[\d,]+(?:\.\d{2})?/);
  if (rateMatch) {
    fields.rate = {
      amount: parseFloat(rateMatch[0].replace(/[$,]/g, '')),
      currency: 'USD',
    };
  }

  // Extract locations (basic pattern matching)
  const locationPatterns = [
    /(?:pickup|origin|from)[:\s]+([^,\n]+)/i,
    /(?:delivery|destination|to)[:\s]+([^,\n]+)/i,
  ];

  const pickupMatch = body.match(locationPatterns[0]);
  if (pickupMatch) {
    fields.pickup = { location: pickupMatch[1].trim() };
  }

  const dropoffMatch = body.match(locationPatterns[1]);
  if (dropoffMatch) {
    fields.dropoff = { location: dropoffMatch[1].trim() };
  }

  // Extract reference number
  const refMatch = body.match(/(?:ref(?:erence)?|load|order)[#:\s]+([A-Z0-9-]+)/i);
  if (refMatch) {
    fields.referenceNumber = refMatch[1];
  }

  // Extract equipment type
  const equipmentMatch = body.match(/(?:equipment|trailer|type)[:\s]+([^,\n]+)/i);
  if (equipmentMatch) {
    fields.equipment = equipmentMatch[1].trim();
  }

  return fields;
}

// POST /api/webhooks/email - SendGrid Inbound Parse webhook
export async function POST(request: NextRequest) {
  try {
    // SendGrid sends multipart form data
    const formData = await request.formData();

    // Extract email fields from SendGrid
    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;
    const headers = formData.get('headers') as string;

    // Validate required fields
    if (!to || !from) {
      console.error('Missing required email fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract company ID from the "to" address
    const companyId = extractCompanyId(to);
    if (!companyId) {
      console.error('Could not extract company ID from:', to);
      return NextResponse.json(
        { success: false, error: 'Invalid inbound address' },
        { status: 400 }
      );
    }

    // Verify company exists and integration is active
    const integration = await prisma.emailIntegration.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
      },
    });

    if (!integration) {
      console.error('No active email integration for company:', companyId);
      // Still return 200 to prevent SendGrid retries
      return NextResponse.json({ success: true, ignored: true });
    }

    // Parse sender info
    const senderMatch = from.match(/(?:"?([^"<]+)"?\s*)?<?([^>]+@[^>]+)>?/);
    const senderName = senderMatch?.[1]?.trim() || '';
    const senderEmail = senderMatch?.[2]?.trim() || from;

    // Extract structured fields from email content
    const extractedFields = await extractLoadFields(subject || '', text || '');

    // Create load offer
    const loadOffer = await prisma.loadOffer.create({
      data: {
        companyId,
        sourceType: 'EMAIL',
        sourceId: headers ? JSON.parse(headers)['message-id'] : null,
        senderName,
        senderEmail,
        subject,
        bodyText: text,
        bodyHtml: html,
        extractedFields,
        status: 'NEW',
        receivedAt: new Date(),
      },
    });

    console.log('Created load offer from email:', loadOffer.id);

    return NextResponse.json({
      success: true,
      data: { loadOfferId: loadOffer.id },
    });
  } catch (error) {
    console.error('Error processing inbound email:', error);
    // Return 200 to prevent SendGrid retries on internal errors
    return NextResponse.json({
      success: false,
      error: 'Internal error processing email',
    });
  }
}
