/**
 * Ghoomo Circuit Breaker Pattern for AI Call Protection
 * Rule: If Tier 1 (Gemini 1.5 Flash) fails 3x in a row, transition to OPEN
 * and skip directly to Tier 2 (Groq Llama 3.1 70B) without waiting on timeouts.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitStatus {
  service: string;
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  cooldownRemainingSeconds: number;
}

class CircuitBreaker {
  private serviceName: string;
  private failureThreshold: number;
  private cooldownMs: number;
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;

  constructor(serviceName = 'Gemini_Tier1', failureThreshold = 3, cooldownMs = 60000) {
    this.serviceName = serviceName;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Check whether the circuit allows attempting Tier 1.
   */
  public isAvailable(): boolean {
    const now = Date.now();

    if (this.state === 'OPEN') {
      // Check if cooldown has elapsed to allow a canary request
      if (this.lastFailureTime && now - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.serviceName}] Cooldown elapsed. Testing canary in HALF_OPEN state.`);
        return true;
      }
      return false;
    }

    // In CLOSED or HALF_OPEN, we allow the request
    return true;
  }

  /**
   * Record a successful call.
   */
  public recordSuccess(): void {
    if (this.state !== 'CLOSED') {
      console.log(`[CircuitBreaker:${this.serviceName}] Canary succeeded. Closing circuit breaker.`);
    }
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }

  /**
   * Record a failure.
   */
  public recordFailure(errorMsg?: string): void {
    this.consecutiveFailures += 1;
    this.lastFailureTime = Date.now();

    console.warn(
      `[CircuitBreaker:${this.serviceName}] Failure #${this.consecutiveFailures} recorded. Error: ${errorMsg || 'unknown'}`
    );

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(
        `[CircuitBreaker:${this.serviceName}] TRIP! ${this.failureThreshold} consecutive failures. Circuit is now OPEN. Fast-pathing to Tier 2 for ${this.cooldownMs / 1000}s.`
      );
    }
  }

  /**
   * Force reset (used for testing or admin overrides).
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }

  /**
   * Get current status for observability.
   */
  public getStatus(): CircuitStatus {
    const now = Date.now();
    let cooldownRemainingSeconds = 0;

    if (this.state === 'OPEN' && this.lastFailureTime) {
      cooldownRemainingSeconds = Math.max(0, Math.ceil((this.lastFailureTime + this.cooldownMs - now) / 1000));
    }

    return {
      service: this.serviceName,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingSeconds,
    };
  }
}

// Global Tier 1 Circuit Breaker singleton
export const tier1CircuitBreaker = new CircuitBreaker('Tier1_Gemini', 3, 60000);
