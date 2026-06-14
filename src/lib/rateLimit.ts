// Simple in-memory rate limiter (per server instance). Good enough to blunt
// spam/brute-force on public endpoints for a single self-hosted instance.
// For multi-instance deployments, back this with Redis/Upstash instead.
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  b.count += 1
  return b.count <= limit
}

export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
