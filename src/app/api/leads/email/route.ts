import { NextRequest, NextResponse } from 'next/server';
import { createWorkflowOrchestrator } from '@/lib/leads/workflow-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const limit = body.limit || 50;

    const orchestrator = createWorkflowOrchestrator({
      useMock: process.env.USE_MOCK_SERVICES === 'true',
    });

    const result = await orchestrator.runEmailOnly(limit);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Email outreach error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Email outreach failed', message: errorMessage },
      { status: 500 }
    );
  }
}
