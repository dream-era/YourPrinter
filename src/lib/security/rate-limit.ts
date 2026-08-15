import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _staffLoginLimiter: Ratelimit | null = null;
let _standardLimiter: Ratelimit | null = null;
let _strictLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

export function getStaffLoginLimiter(): Ratelimit | null {
  if (_staffLoginLimiter) return _staffLoginLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _staffLoginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "printq:ratelimit:staff-login",
  });
  return _staffLoginLimiter;
}

// Used for orders, document uploads
export function getStandardLimiter(): Ratelimit | null {
  if (_standardLimiter) return _standardLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _standardLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "15 m"),
    prefix: "printq:ratelimit:standard",
  });
  return _standardLimiter;
}

// Used for payment verification, webhooks
export function getStrictLimiter(): Ratelimit | null {
  if (_strictLimiter) return _strictLimiter;
  const redis = getRedis();
  if (!redis) return null;
  _strictLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "printq:ratelimit:strict",
  });
  return _strictLimiter;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitCheckResult> {
  // Fail open if Redis is not configured
  if (!limiter) {
    return { allowed: true, remaining: 99, resetAt: Date.now() + 60000 };
  }
  
  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return { allowed: success, remaining, resetAt: reset };
  } catch (error) {
    // Fail open on network/redis errors to prevent blocking production
    console.warn("Rate limit check failed, failing open", error);
    return { allowed: true, remaining: 99, resetAt: Date.now() + 60000 };
  }
}
