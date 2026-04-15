import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';

/**
 * JWT secret loading.
 *
 * In production we REQUIRE JWT_SECRET to be set and to be long enough to be
 * resistant to brute-force. The previous code used a hard-coded fallback
 * string which meant anyone who read the source could forge tokens if the
 * env var happened to be missing.
 *
 * In development (NODE_ENV !== 'production') we generate an ephemeral secret
 * per-process so the app still boots locally; all existing sessions are
 * invalidated on restart, which is fine for dev.
 */
function loadSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }

  if (process.env.NODE_ENV === 'production') {
    // Hard fail — never run production with a weak/missing secret.
    throw new Error(
      'JWT_SECRET is not set or is shorter than 32 characters. ' +
        'Set a strong random value (>= 64 hex chars recommended) in the environment.'
    );
  }

  // Dev-only ephemeral secret.
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] JWT_SECRET missing or too short — using an ephemeral dev secret. ' +
      'DO NOT deploy without a strong JWT_SECRET.'
  );
  const random = new Uint8Array(64);
  crypto.getRandomValues(random);
  return random;
}

// Evaluated once per process.
const secret = loadSecret();

export interface AuthPayload extends JWTPayload {
  id: string;
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export async function signAuthToken(payload: {
  id: string;
  username: string;
  role: 'admin' | 'user';
  name: string;
}): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Verify the auth cookie. Returns null when missing/invalid.
 * Centralised so the 4 API routes can't drift.
 */
export async function verifyAuth(
  _request?: NextRequest
): Promise<AuthPayload | null> {
  const token = cookies().get('auth-token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    // Minimal shape check — a forged payload with missing fields shouldn't
    // count as authenticated.
    if (
      typeof payload.id !== 'string' ||
      typeof payload.username !== 'string' ||
      (payload.role !== 'admin' && payload.role !== 'user') ||
      typeof payload.name !== 'string'
    ) {
      return null;
    }
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export async function requireAdmin(
  request?: NextRequest
): Promise<AuthPayload | null> {
  const auth = await verifyAuth(request);
  if (!auth || auth.role !== 'admin') return null;
  return auth;
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

/**
 * In-memory sliding-window rate limiter. Scoped per-process, which is fine
 * for a single-container deployment backed by SQLite. For horizontally
 * scaled deploys this should be moved to Redis.
 */
interface Bucket {
  timestamps: number[];
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number; blockMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [], blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  // Drop timestamps outside the window.
  const cutoff = now - opts.windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= opts.max) {
    bucket.blockedUntil = now + opts.blockMs;
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(opts.blockMs / 1000),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup to keep the Map bounded.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.blockedUntil < now && v.timestamps.length === 0) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Extract a best-effort client IP. Next.js does not expose remoteAddr in the
 * Edge runtime, so we fall back to the standard proxy headers. Anyone behind
 * the trust boundary can spoof these — that's acceptable for rate-limiting
 * login attempts (worst case: attacker gets their own per-spoofed-IP quota,
 * which is still O(n) work for them).
 */
export function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}
