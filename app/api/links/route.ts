import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, createLink, updateLink, deleteLink } from '@/lib/db';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyAuth(request: NextRequest) {
  const token = cookies().get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const links = getAllLinks();
    
    // If not authenticated, return only public links
    if (!auth) {
      return NextResponse.json(links.filter(link => link.is_public));
    }
    
    // If authenticated, return all links
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar links' },
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
    const { name, subtitle, url, is_public, icon } = body;
    
    const link = createLink({ name, subtitle, url, is_public, icon });
    
    return NextResponse.json(link);
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: 'Erro ao criar link' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { id, name, subtitle, url, is_public, icon } = body;
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (url !== undefined) updates.url = url;
    if (is_public !== undefined) updates.is_public = is_public;
    if (icon !== undefined) updates.icon = icon;
    
    updateLink(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }
    
    deleteLink(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir link' },
      { status: 500 }
    );
  }
}
