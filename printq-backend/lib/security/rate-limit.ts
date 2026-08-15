/**
 * lib/security/rate-limit.ts
 * Upstash Redis-backed rate limiting — replaces the in-memory Map that was
 * in staff-login's route file directly. That version reset on every cold
 * start and didn't share state across serverless instances, which defeats
 * the point of rate limiting on Vercel. This is a real fix, not a bigger
 * hammer — same 5-attempts-per-15-minutes policy, just backed by state
 * that actually persists and is shared.
 *
 * Env vars (from your Upstash Redis dashboard — already in your stack per
 * the PRD):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _staffLoginLimiter: Ratelimit | null = null;

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for rate limiting."
    );
  }
  return new Redis({ url, token });
}

/** 5 attempts per 15 minutes, keyed by shopId+phone — same policy as before. */
export function getStaffLoginLimiter(): Ratelimit {
  if (_staffLoginLimiter) return _staffLoginLimiter;
  _staffLoginLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "printq:ratelimit:staff-login",
  });
  return _staffLoginLimiter;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

export async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<RateLimitCheckResult> {
  const { success, remaining, reset } = await limiter.limit(key);
  return { allowed: success, remaining, resetAt: reset };
}
