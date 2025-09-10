import { NextRequest, NextResponse } from 'next/server';
import { getFormSubmissions } from '@/lib/db-forms';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyAuth(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth-token');
    const headerToken = request.headers.get('X-Auth-Token');
    const token = cookieToken?.value || headerToken;
    
    if (!token) return null;
    
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const submissions = getFormSubmissions(params.id);
    
    return NextResponse.json({
      formId: params.id,
      submissions: submissions,
      total: submissions.length,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar submissões' },
      { status: 500 }
    );
  }
}
