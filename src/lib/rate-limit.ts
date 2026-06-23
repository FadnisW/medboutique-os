import { headers } from "next/headers";

interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
}

const POLICIES: Record<string, RateLimitPolicy> = {
  auth: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 requests per minute
  booking: { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 requests per 5 minutes
  standard: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
};

// Global in-memory store for rate limits (sliding window logs)
const rateLimitStore = new Map<string, number[]>();

// Periodically clean up old memory logs to prevent exhaustion
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    // Keep only timestamps within the last 5 minutes (max window)
    const validTimestamps = timestamps.filter(ts => now - ts < 5 * 60 * 1000);
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validTimestamps);
    }
  }
}, 60000).unref?.(); // Prevent blocking the Node.js event loop on exit

/**
 * Retrieves the client's IP address from standard request headers.
 */
export async function getClientIp(): Promise<string> {
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return reqHeaders.get("x-real-ip") || "127.0.0.1";
}

/**
 * Checks if a specific action invocation exceeds rate limit policies.
 * 
 * @param keyIdentifier Unique client identifier (e.g. IP address or User ID)
 * @param policyName The rate limit policy to apply ('auth', 'booking', 'standard')
 * @returns Object indicating whether the request is allowed, limit numbers, and remaining count.
 */
export function checkRateLimit(keyIdentifier: string, policyName: keyof typeof POLICIES) {
  const policy = POLICIES[policyName];
  if (!policy) {
    return { allowed: true, limit: 0, remaining: 0 };
  }

  const key = `${policyName}:${keyIdentifier}`;
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) || [];

  // Filter timestamps to only keep those within the active policy window
  const activeTimestamps = timestamps.filter(ts => now - ts < policy.windowMs);

  if (activeTimestamps.length >= policy.maxRequests) {
    return {
      allowed: false,
      limit: policy.maxRequests,
      remaining: 0,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, activeTimestamps);

  return {
    allowed: true,
    limit: policy.maxRequests,
    remaining: policy.maxRequests - activeTimestamps.length,
  };
}
