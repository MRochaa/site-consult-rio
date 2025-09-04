import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUser, deleteUser, getUserByUsername } from '@/lib/db';
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
    const users = getAllUsers();
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
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
    const { username, password, name, role } = body;
    
    // Check if username already exists
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Nome de usuário já existe' },
        { status: 400 }
      );
    }
    
    const user = createUser({ username, password, name, role });
    const { password: _, ...safeUser } = user;
    
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  
  if (!auth) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { id, username, password, name, role } = body;
    
    // Users can only update their own profile unless they're admin
    if (auth.role !== 'admin' && auth.id !== id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }
    
    const updates: any = {};
    if (username) updates.username = username;
    if (password) updates.password = password;
    if (name) updates.name = name;
    if (role && auth.role === 'admin') updates.role = role;
    
    updateUser(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
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
    
    // Prevent deleting yourself
    if (auth.id === id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 }
      );
    }
    
    deleteUser(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}
