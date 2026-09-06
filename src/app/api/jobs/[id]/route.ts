// ============================================================================
// API Route: GET /api/jobs/[id]
// Specification Section 4:
// - Polls progress states:
//   DOWNLOADING -> PROCESSING_VIDEO -> EXTRACTING_EVIDENCE ->
//   RESOLVING_DESTINATION -> NEEDS_CONFIRMATION -> OPTIMIZING_TRIP ->
//   GENERATING_ITINERARY -> VALIDATING -> READY / FAILED
// - Returns full payload once ready
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/video-pipeline/jobStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  const job = JobStore.getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { error: `Job with ID "${jobId}" not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    progress_percent: job.progressPercent,
    current_stage: job.logs[job.logs.length - 1]?.stage || job.status,
    message: job.logs[job.logs.length - 1]?.message || '',
    logs: job.logs,
    destination_candidates: job.destinationCandidates || [],
    resolved_destination: job.resolvedDestination,
    duration_days: job.durationDays,
    trip_id: job.tripId,
    trip: job.trip,
    observability: job.observability,
    error: job.error,
  });
}
