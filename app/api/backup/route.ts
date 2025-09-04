import { NextRequest, NextResponse } from 'next/server';
import { exportData, importData } from '@/lib/db';
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
  const auth = await verifyAuth(request);
  
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const data = exportData();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' },
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
    const data = await request.json();
    
    // Validate data structure
    if (!data.users || !Array.isArray(data.users)) {
      return NextResponse.json(
        { error: 'Formato de dados inválido: usuários não encontrados' },
        { status: 400 }
      );
    }
    
    if (!data.links || !Array.isArray(data.links)) {
      return NextResponse.json(
        { error: 'Formato de dados inválido: links não encontrados' },
        { status: 400 }
      );
    }
    
    importData(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Erro ao importar dados' },
      { status: 500 }
    );
  }
}
