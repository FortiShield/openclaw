/**
 * Simple in-memory rate limiter for client-side request throttling
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  constructor(
    private requestsPerWindow: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count < this.requestsPerWindow) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for this window
   */
  getRemaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.requestsPerWindow;
    }
    return Math.max(0, this.requestsPerWindow - entry.count);
  }

  /**
   * Get time until reset (in milliseconds)
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) {
      return 0;
    }
    return Math.max(0, entry.resetTime - Date.now());
  }

  /**
   * Reset a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clear(): void {
    this.limits.clear();
  }
}

// Create default rate limiters
export const apiRateLimiter = new RateLimiter(30, 60000); // 30 requests per minute
export const wsRateLimiter = new RateLimiter(100, 1000); // 100 messages per second

/**
 * Create a debounced function with rate limiting
 */
export function createRateLimitedFunction<T extends any[], R>(
  fn: (...args: T) => R,
  key: string,
  limiter: RateLimiter = apiRateLimiter
): (...args: T) => R | null {
  return (...args: T) => {
    if (limiter.isAllowed(key)) {
      return fn(...args);
    }
    const remaining = limiter.getRemaining(key);
    console.warn(
      `[v0] Rate limit exceeded for ${key}. Remaining: ${remaining}`
    );
    return null;
  };
}

/**
 * Async version for promises
 */
export function createRateLimitedAsyncFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  key: string,
  limiter: RateLimiter = apiRateLimiter
): (...args: T) => Promise<R | null> {
  return async (...args: T) => {
    if (limiter.isAllowed(key)) {
      return fn(...args);
    }
    const remaining = limiter.getRemaining(key);
    console.warn(
      `[v0] Rate limit exceeded for ${key}. Remaining: ${remaining}`
    );
    return null;
  };
}
