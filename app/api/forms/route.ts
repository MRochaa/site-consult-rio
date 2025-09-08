import { NextRequest, NextResponse } from 'next/server';
import { getAllForms, createForm } from '@/lib/db-forms';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyAuth(request: NextRequest) {
  const token = cookies().get('auth-token')?.value;
  
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const forms = getAllForms();
    return NextResponse.json(forms);
  } catch (error) {
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
    return NextResponse.json(
      { error: 'Erro ao criar formulário' },
      { status: 500 }
    );
  }
}
