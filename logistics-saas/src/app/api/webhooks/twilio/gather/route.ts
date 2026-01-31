import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// TwiML response helper
function twimlResponse(content: string): NextResponse {
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

function twimlSay(text: string): string {
  const voice = 'Polly.Matthew';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${text}</Say>
</Response>`;
}

// Helper to extract load info from speech (in production, use OpenAI)
function extractLoadFromSpeech(transcript: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  // Extract locations
  const pickupMatch = transcript.match(/(?:pickup|picking up|from)\s+(?:at|in)?\s*([^,\.]+)/i);
  if (pickupMatch) {
    fields.pickup = { location: pickupMatch[1].trim() };
  }

  const dropoffMatch = transcript.match(/(?:deliver|drop off|dropping|going to|to)\s+(?:at|in)?\s*([^,\.]+)/i);
  if (dropoffMatch) {
    fields.dropoff = { location: dropoffMatch[1].trim() };
  }

  // Extract rate
  const rateMatch = transcript.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|bucks?)/i);
  if (rateMatch) {
    fields.rate = {
      amount: parseFloat(rateMatch[1].replace(/,/g, '')),
      currency: 'USD',
    };
  }

  // Extract equipment
  const equipmentPatterns = ['dry van', 'reefer', 'flatbed', 'step deck', 'tanker', 'box truck'];
  for (const eq of equipmentPatterns) {
    if (transcript.toLowerCase().includes(eq)) {
      fields.equipment = eq;
      break;
    }
  }

  return fields;
}

// Helper to find company by phone number
async function getCompanyByPhone(phoneNumber: string) {
  const integration = await prisma.telephonyIntegration.findFirst({
    where: {
      phoneNumber,
      status: 'ACTIVE',
    },
  });
  return integration;
}

// POST /api/webhooks/twilio/gather - Process speech input
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const speechResult = formData.get('SpeechResult') as string;

    if (!speechResult) {
      return twimlResponse(
        twimlSay("I didn't catch that. Let me transfer you to a dispatcher. Goodbye.")
      );
    }

    // Find company
    const integration = await getCompanyByPhone(to);
    if (!integration) {
      return twimlResponse(
        twimlSay('Sorry, we encountered an error. Goodbye.')
      );
    }

    // Extract load information from speech
    const extractedFields = extractLoadFromSpeech(speechResult);

    // Create load offer from phone call
    const loadOffer = await prisma.loadOffer.create({
      data: {
        companyId: integration.companyId,
        sourceType: 'PHONE',
        sourceId: callSid,
        senderPhone: from,
        transcript: speechResult,
        extractedFields,
        status: 'NEW',
        receivedAt: new Date(),
      },
    });

    // Build confirmation message
    let confirmation = "Thank you! I've recorded your load information. ";

    if (extractedFields.pickup && (extractedFields.pickup as { location?: string }).location) {
      confirmation += `Pickup from ${(extractedFields.pickup as { location: string }).location}. `;
    }
    if (extractedFields.dropoff && (extractedFields.dropoff as { location?: string }).location) {
      confirmation += `Delivery to ${(extractedFields.dropoff as { location: string }).location}. `;
    }
    if (extractedFields.rate && (extractedFields.rate as { amount?: number }).amount) {
      confirmation += `Rate of $${(extractedFields.rate as { amount: number }).amount}. `;
    }

    confirmation += "A dispatcher will review your offer and get back to you shortly. Thank you for calling!";

    console.log('Created load offer from call:', loadOffer.id);

    return twimlResponse(twimlSay(confirmation));
  } catch (error) {
    console.error('Error processing Twilio gather:', error);
    return twimlResponse(
      twimlSay('Sorry, we encountered an error. Please try again later. Goodbye.')
    );
  }
}
