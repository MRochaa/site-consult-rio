import { NextRequest, NextResponse } from 'next/server';
import { getAllForms, createForm } from '@/lib/db-forms';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyAuth(request: NextRequest) {
  try {
    // Tentar pegar token do cookie primeiro
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth-token');
    
    // Se não tiver no cookie, tentar pegar do header
    const headerToken = request.headers.get('X-Auth-Token');
    
    const token = cookieToken?.value || headerToken;
    
    console.log('Token found:', !!token, 'From cookie:', !!cookieToken, 'From header:', !!headerToken);
    
    if (!token) {
      console.log('No token found in /api/forms');
      return null;
    }
    
    const { payload } = await jwtVerify(token, secret);
    console.log('Auth verified in /api/forms:', payload);
    return payload;
  } catch (error) {
    console.error('Auth verification error in /api/forms:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth) {
    console.log('GET /api/forms - No auth');
    return NextResponse.json(
      { error: 'Não autorizado - token não encontrado' },
      { status: 401 }
    );
  }

  if (auth.role !== 'admin') {
    console.log('GET /api/forms - Not admin:', auth.role);
    return NextResponse.json(
      { error: 'Não autorizado - apenas administradores' },
      { status: 401 }
    );
  }
  
  try {
    const forms = getAllForms();
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar formulários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const form = createForm({
      slug: body.slug,
      title: body.title,
      description: body.description,
      fields: body.fields,
      is_active: true
    });
    
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Erro ao criar formulário' },
      { status: 500 }
    );
  }
}
