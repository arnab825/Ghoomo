// ============================================================================
// Job Store for Asynchronous Video Processing
// Specification Section 4:
// - Manages asynchronous jobs
// - Records progress states and stage logs
// - Supports destination confirmation resumes
// - Maintains observability metrics
// ============================================================================

import {
  VideoProcessingJob,
  JobStatus,
  PipelinePreferences,
} from '../types/travelVideoPipeline';

const JOBS = new Map<string, VideoProcessingJob>();

export class JobStore {
  public static createJob(url: string, preferences: PipelinePreferences = {}): VideoProcessingJob {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const job: VideoProcessingJob = {
      id,
      url,
      status: 'DOWNLOADING',
      progressPercent: 10,
      preferences,
      createdAt: now,
      updatedAt: now,
      logs: [
        {
          stage: 'DOWNLOADING',
          message: 'Video received. Validating URL and preparing ingestion.',
          timestamp: now,
        },
      ],
    };

    JOBS.set(id, job);
    return job;
  }

  public static getJob(id: string): VideoProcessingJob | undefined {
    return JOBS.get(id);
  }

  public static updateJobState(
    id: string,
    status: JobStatus,
    progressPercent: number,
    logMessage?: string
  ): VideoProcessingJob | undefined {
    const job = JOBS.get(id);
    if (!job) return undefined;

    job.status = status;
    job.progressPercent = progressPercent;
    job.updatedAt = new Date().toISOString();

    if (logMessage) {
      job.logs.push({
        stage: status,
        message: logMessage,
        timestamp: job.updatedAt,
      });
    }

    return job;
  }

  public static appendLog(id: string, stage: JobStatus, message: string): void {
    const job = JOBS.get(id);
    if (!job) return;
    job.logs.push({
      stage,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  public static setJobData(id: string, updates: Partial<VideoProcessingJob>): VideoProcessingJob | undefined {
    const job = JOBS.get(id);
    if (!job) return undefined;

    Object.assign(job, updates);
    job.updatedAt = new Date().toISOString();
    return job;
  }

  public static setJobError(id: string, error: string): VideoProcessingJob | undefined {
    const job = JOBS.get(id);
    if (!job) return undefined;

    job.status = 'FAILED';
    job.error = error;
    job.updatedAt = new Date().toISOString();
    job.logs.push({
      stage: 'FAILED',
      message: error,
      timestamp: job.updatedAt,
    });
    return job;
  }
}
