// ============================================================================
// API Route: POST /api/trips/from-video
// Specification Section 4:
// - Receives public travel video URL and optional preferences
// - Validates URL format
// - Creates asynchronous job and returns immediately
// - Triggers background processing without holding HTTP connection
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { JobStore } from '@/lib/video-pipeline/jobStore';
import { VideoPipelineOrchestrator } from '@/lib/video-pipeline/orchestrator';
import { VideoIngestionService } from '@/lib/video-pipeline/videoIngestionService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, preferences } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'A valid travel video/reel URL string is required.' },
        { status: 400 }
      );
    }

    // 1. Validate URL
    const validation = VideoIngestionService.validateUrl(url.trim());
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Only public Instagram Reels, YouTube Shorts/Videos, TikToks, or direct travel videos are supported.' },
        { status: 400 }
      );
    }

    // 2. Create Job
    const job = JobStore.createJob(url.trim(), preferences || {});

    // 3. Initiate background execution (fire & forget in Node server runtime)
    VideoPipelineOrchestrator.executePipeline(job.id).catch((err) => {
      console.error(`[BackgroundJob ${job.id}] Unhandled error:`, err);
    });

    // 4. Return immediately with job_id
    return NextResponse.json(
      {
        job_id: job.id,
        status: 'processing',
        initial_state: job.status,
        message: 'Video ingestion initiated. Poll /api/jobs/' + job.id + ' for real-time progress.',
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to initiate video processing.' },
      { status: 500 }
    );
  }
}
