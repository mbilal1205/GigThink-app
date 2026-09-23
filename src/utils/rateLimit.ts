interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const map = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false; // limit exceeded
  }

  entry.count += 1;
  map.set(key, entry);
  return true;
}