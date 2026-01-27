import { NextRequest, NextResponse } from 'next/server';
import { createWorkflowOrchestrator } from '@/lib/leads/workflow-orchestrator';
import { validateWorkflowInput } from '@/lib/leads/utils';
import type { WorkflowFormInput } from '@/types/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const input: WorkflowFormInput = {
      business_type: body.business_type,
      city: body.city,
      zip_code: body.zip_code,
      radius_miles: body.radius_miles || 10,
      max_results: body.max_results || 100,
      campaign_name: body.campaign_name,
      send_emails: body.send_emails || false,
    };

    const validationErrors = validateWorkflowInput(input);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Create orchestrator
    const orchestrator = createWorkflowOrchestrator({
      useMock: process.env.USE_MOCK_SERVICES === 'true',
      skipSheets: body.skip_sheets || false,
      skipEnrichment: body.skip_enrichment || false,
      skipEmail: !input.send_emails,
    });

    // Run workflow
    const result = await orchestrator.runWorkflow(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Workflow error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Workflow failed', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Lead Generation Workflow API',
    endpoints: {
      'POST /api/leads/workflow': 'Run full workflow',
      'POST /api/leads/enrich': 'Run enrichment only',
      'POST /api/leads/email': 'Run email outreach only',
      'POST /api/leads/sync-qualification': 'Sync qualification from sheets',
      'GET /api/leads/runs': 'Get workflow run history',
      'GET /api/leads/runs/:id': 'Get specific workflow run',
    },
    parameters: {
      business_type: 'Required - Type of business to search (e.g., "plumbers")',
      city: 'Required - City to search in (e.g., "Los Angeles")',
      zip_code: 'Optional - ZIP code for more precise location',
      radius_miles: 'Required - Search radius (5, 10, 15, 20, 30, or 50)',
      max_results: 'Optional - Maximum results to fetch (1-500, default 100)',
      campaign_name: 'Optional - Name for this campaign',
      send_emails: 'Optional - Whether to send outreach emails (default false)',
    },
  });
}
