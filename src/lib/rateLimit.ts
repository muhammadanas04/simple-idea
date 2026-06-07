import { NextResponse } from "next/server";
import { corsHeaders } from "./cors";

// Simple in-memory storage for rate limits
const rateLimitMap = new Map<string, number[]>();

export interface RateLimitResult {
  isLimited: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks if the request exceeds the rate limit for the given identifier.
 * Default limit is 30 requests per 60 seconds.
 */
export function checkRateLimit(
  identifier: string,
  limit = 30,
  windowMs = 60000,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = rateLimitMap.get(identifier) || [];

  // Filter out timestamps older than the rate limit window
  timestamps = timestamps.filter((t) => t > windowStart);

  const isLimited = timestamps.length >= limit;
  const remaining = Math.max(0, limit - timestamps.length);

  // Determine when the oldest request in the window expires
  const oldestTimestamp = timestamps[0] || now;
  const reset = oldestTimestamp + windowMs;

  if (!isLimited) {
    timestamps.push(now);
  }

  rateLimitMap.set(identifier, timestamps);

  return {
    isLimited,
    limit,
    remaining,
    reset,
  };
}

/**
 * Helper to build rate limit headers from a RateLimitResult.
 */
export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)), // Epoch seconds
  };
}

/**
 * Returns a rate limit exceeded NextResponse.
 */
export function rateLimitExceededResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      success: false,
      error: "Too Many Requests. Rate limit of 30 requests per minute exceeded.",
      code: "RATE_LIMIT_EXCEEDED",
    },
    {
      status: 429,
      headers: {
        ...corsHeaders,
        ...getRateLimitHeaders(result),
      },
    },
  );
}
