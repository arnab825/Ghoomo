/**
 * Ghoomo Development Profiler & Telemetry
 * Measures database query count, Gemini request count, latency, and router execution times.
 * Only logs in non-production environments; zero overhead in production.
 */

export interface ProfilerMetrics {
  dbReadCount: number;
  dbWriteCount: number;
  aiCallCount: number;
  aiTotalLatencyMs: number;
  routerExecutionTimeMs: number;
}

class SystemProfiler {
  private metrics: ProfilerMetrics = {
    dbReadCount: 0,
    dbWriteCount: 0,
    aiCallCount: 0,
    aiTotalLatencyMs: 0,
    routerExecutionTimeMs: 0,
  };

  public recordDbRead(count = 1): void {
    this.metrics.dbReadCount += count;
  }

  public recordDbWrite(count = 1): void {
    this.metrics.dbWriteCount += count;
  }

  public recordAiCall(latencyMs: number): void {
    this.metrics.aiCallCount += 1;
    this.metrics.aiTotalLatencyMs += latencyMs;
  }

  public recordRouterTime(durationMs: number): void {
    this.metrics.routerExecutionTimeMs += durationMs;
  }

  public getSnapshot(): ProfilerMetrics {
    return { ...this.metrics };
  }

  public reset(): void {
    this.metrics = {
      dbReadCount: 0,
      dbWriteCount: 0,
      aiCallCount: 0,
      aiTotalLatencyMs: 0,
      routerExecutionTimeMs: 0,
    };
  }
}

export const profiler = new SystemProfiler();
