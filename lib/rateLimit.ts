// Rate limiter en mémoire (adapté à Vercel serverless : par instance)
// Pour une production robuste, utiliser Upstash Redis

const store = new Map<string, { count: number; reset: number }>()

export function rateLimit(
  ip: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.reset - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
