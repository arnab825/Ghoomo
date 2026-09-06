// ============================================================================
// API Route: POST /api/jobs/[id]/confirm
// Specification Section 10H & 36:
// - Receives user destination selection for ambiguous or seasonal recommendations
// - Resumes pipeline optimization
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/video-pipeline/jobStore';
import { VideoPipelineOrchestrator } from '@/lib/video-pipeline/orchestrator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  const job = JobStore.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: `Job with ID "${jobId}" not found.` }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { destination } = body;

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json(
        { error: 'A valid destination name is required to resume processing.' },
        { status: 400 }
      );
    }

    // Update job state
    JobStore.updateJobState(
      jobId,
      'OPTIMIZING_TRIP',
      70,
      `Destination confirmed: "${destination}". Resuming geographic optimization.`
    );
    JobStore.setJobData(jobId, { resolvedDestination: destination });

    // Resume pipeline execution in background
    VideoPipelineOrchestrator.finalizeOptimizedTrip(
      jobId,
      destination,
      job.evidence
    ).catch((err) => {
      console.error(`[BackgroundJob ${jobId}] Finalize error:`, err);
    });

    return NextResponse.json({
      success: true,
      message: `Destination confirmed as ${destination}. Route optimization in progress.`,
      job_id: jobId,
      status: 'OPTIMIZING_TRIP',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to confirm destination.' },
      { status: 500 }
    );
  }
}
