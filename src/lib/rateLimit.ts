/**
 * rateLimit.ts
 *
 * Provides rate limiting for VEXA API routes.
 * 
 * SCALING RULE:
 * 1. If UPSTASH_REDIS_REST_URL is set, use distributed Redis (production-ready).
 * 2. Otherwise, fallback to in-memory Map (local development / single-instance).
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for fallback/dev
const localStore = new Map<string, RateLimitRecord>();

/**
 * Distributed rate limit check using Upstash Redis REST API.
 */
async function checkRedisLimit(ip: string, limit: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return false;

  try {
    const key = `ratelimit:${ip}`;
    
    // Atomic INCR + PEXPIRE via Lua script to avoid races
    const luaScript = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("PEXPIRE", KEYS[1], ARGV[1])
      end
      return current
    `;

    const res = await fetch(`${url}/eval`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        script: luaScript,
        keys: [key],
        args: [windowMs.toString()],
      }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    const count = data.result;
    
    return (count || 0) > limit;
  } catch (err) {
    console.error('[RateLimit] Redis failure, falling back to local memory:', err);
    return false;
  }
}

/**
 * Returns true if the request should be BLOCKED, false if allowed.
 * Supports async check for Redis.
 */
export async function isRateLimited(
  ip: string,
  limit = 10,
  windowMs = 60_000
): Promise<boolean> {
  // Try Redis first if configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const blocked = await checkRedisLimit(ip, limit, windowMs);
    if (blocked) return true;
    // Note: if Redis fails, we fall back to local memory below
  }

  // Fallback to in-memory store
  const now = Date.now();
  const record = localStore.get(ip);

  if (!record || now > record.resetTime) {
    localStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count += 1;
  return record.count > limit;
}

// Low-frequency cleanup for local store
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of localStore.entries()) {
      if (now > record.resetTime) localStore.delete(key);
    }
  }, 10 * 60 * 1000);
}
