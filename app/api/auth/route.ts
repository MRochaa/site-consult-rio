import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword } from '@/lib/db';
import { cookies } from 'next/headers';
import {
  signAuthToken,
  verifyAuth,
  rateLimit,
  clientIp,
} from '@/lib/auth';
import { validateLogin, ValidationError } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP AND per username to slow down brute force without
    // letting a single attacker lock a victim out from their own IP-less
    // network (we combine both keys into the bucket name).
    const ip = clientIp(request);

    const ipLimit = rateLimit(`login:ip:${ip}`, {
      windowMs: 60_000,
      max: 10,
      blockMs: 5 * 60_000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => null);
    let input;
    try {
      input = validateLogin(body);
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const userLimit = rateLimit(`login:user:${input.username.toLowerCase()}`, {
      windowMs: 60_000,
      max: 5,
      blockMs: 5 * 60_000,
    });
    if (!userLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(userLimit.retryAfterSeconds) },
        }
      );
    }

    const user = getUserByUsername(input.username);

    if (!user || !verifyPassword(input.password, user.password)) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = await signAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    // Use secure flag only when the app is actually served over HTTPS.
    // NODE_ENV=production alone is not enough — local/intranet deploys may
    // run on plain HTTP even in production mode.
    const isHttps = (process.env.NEXTAUTH_URL ?? '').startsWith('https://');
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: auth.id,
      username: auth.username,
      name: auth.name,
      role: auth.role,
    },
  });
}

export async function DELETE() {
  cookies().delete('auth-token');
  return NextResponse.json({ success: true });
}
