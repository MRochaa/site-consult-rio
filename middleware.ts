import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function middleware(request: NextRequest) {
  // Only check auth for /api routes that need protection
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Skip auth check for public routes
    const publicRoutes = [
      '/api/auth',
      '/api/forms/public'
    ];
    
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Check for auth token
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      // Allow GET requests to /api/links (public links)
      if (request.nextUrl.pathname === '/api/links' && request.method === 'GET') {
        return NextResponse.next();
      }
      
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    try {
      await jwtVerify(token.value, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*'
  ]
};
