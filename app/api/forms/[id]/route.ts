import { NextRequest, NextResponse } from 'next/server';
import { getFormById, updateForm, deleteForm } from '@/lib/db-forms';
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
    const form = getFormById(params.id);
    
    if (!form) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar formulário' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    
    updateForm(params.id, {
      slug: body.slug,
      title: body.title,
      description: body.description,
      fields: body.fields,
      is_active: body.is_active !== undefined ? body.is_active : true
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar formulário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    deleteForm(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir formulário' },
      { status: 500 }
    );
  }
}
