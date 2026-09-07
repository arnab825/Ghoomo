/**
 * EduSpark Security & Rate Limiting Configuration
 * All thresholds are configurable via environment variables with safe defaults.
 */

export const securityConfig = {
  // Authentication Routes (login, signup, password reset)
  auth: {
    maxAttempts: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    windowMs: Number(process.env.AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    baseBackoffSeconds: Number(process.env.AUTH_BASE_BACKOFF_SECONDS) || 2, // 2s * 2^(failed-1)
    maxBackoffSeconds: Number(process.env.AUTH_MAX_BACKOFF_SECONDS) || 300, // max 5 min delay
  },

  // Public Marketing & Inquiry Endpoints (home, pricing, about, contact)
  public: {
    maxRequests: Number(process.env.PUBLIC_RATE_LIMIT_MAX) || 60,
    windowMs: Number(process.env.PUBLIC_WINDOW_MS) || 60 * 1000, // 1 minute
  },

  // Authenticated Learner App Endpoints (actions, goals, copilot, learning)
  authenticated: {
    maxRequests: Number(process.env.AUTHENTICATED_RATE_LIMIT_MAX) || 120,
    windowMs: Number(process.env.AUTHENTICATED_WINDOW_MS) || 60 * 1000, // 1 minute
  },

  // File Upload Limits
  upload: {
    maxSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 5 * 1024 * 1024, // 5 MB
    minSizeBytes: 100, // 100 bytes
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const,
  },
} as const;
