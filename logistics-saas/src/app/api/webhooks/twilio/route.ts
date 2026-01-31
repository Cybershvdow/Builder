import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// TwiML response helpers
function twimlResponse(content: string): NextResponse {
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

function twimlSay(text: string, gather = false): string {
  const voice = 'Polly.Matthew'; // Natural-sounding voice
  if (gather) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/webhooks/twilio/gather" method="POST">
    <Say voice="${voice}">${text}</Say>
  </Gather>
  <Say voice="${voice}">I didn't catch that. Please try again.</Say>
  <Redirect>/api/webhooks/twilio</Redirect>
</Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${text}</Say>
</Response>`;
}

// Helper to find company by phone number
async function getCompanyByPhone(phoneNumber: string) {
  const integration = await prisma.telephonyIntegration.findFirst({
    where: {
      phoneNumber,
      status: 'ACTIVE',
    },
    include: {
      company: true,
    },
  });
  return integration;
}

// POST /api/webhooks/twilio - Initial call handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Twilio webhook params
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    // Find company by the called number
    const integration = await getCompanyByPhone(to);

    if (!integration) {
      return twimlResponse(
        twimlSay('Sorry, this number is not configured. Goodbye.')
      );
    }

    // Store call session in temp storage (in production, use Redis)
    // For now, we'll use query params to track state

    const greeting = `Hello! Thank you for calling ${integration.company.name}. I'm an AI assistant and I can help you with load offers. Please tell me about the load you'd like to submit, including pickup and delivery locations, rate, and any special requirements.`;

    return twimlResponse(twimlSay(greeting, true));
  } catch (error) {
    console.error('Error handling Twilio call:', error);
    return twimlResponse(
      twimlSay('Sorry, we encountered an error. Please try again later.')
    );
  }
}
