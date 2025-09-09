import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword } from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const user = getUserByUsername(username);
    
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = await new SignJWT({ 
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);
    
    // Create response with token in body AND cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      token: token // Incluir token na resposta
    });

    // Set cookie
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Tentar pegar token do cookie primeiro
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth-token');
    
    // Se não tiver no cookie, tentar pegar do header
    const headerToken = request.headers.get('X-Auth-Token');
    
    const token = cookieToken?.value || headerToken;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    const { payload } = await jwtVerify(token, secret);
    
    return NextResponse.json({
      user: {
        id: payload.id as string,
        username: payload.username as string,
        name: payload.name as string,
        role: payload.role as string
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  
  return response;
}
