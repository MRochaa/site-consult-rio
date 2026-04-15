import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByUsername,
} from '@/lib/db';
import { verifyAuth, requireAdmin } from '@/lib/auth';
import {
  validateCreateUser,
  validateUpdateUser,
  ValidationError,
} from '@/lib/validation';

function badRequest(err: unknown) {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    let input;
    try {
      input = validateCreateUser(body);
    } catch (err) {
      const r = badRequest(err);
      if (r) return r;
      throw err;
    }

    if (getUserByUsername(input.username)) {
      return NextResponse.json(
        { error: 'Nome de usuário já existe' },
        { status: 400 }
      );
    }

    const user = createUser(input);
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    let input;
    try {
      input = validateUpdateUser(body);
    } catch (err) {
      const r = badRequest(err);
      if (r) return r;
      throw err;
    }

    // Users can only update their own profile unless they're admin.
    if (auth.role !== 'admin' && auth.id !== input.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const updates: {
      username?: string;
      password?: string;
      name?: string;
      role?: 'admin' | 'user';
    } = {};
    if (input.username) updates.username = input.username;
    if (input.password) updates.password = input.password;
    if (input.name) updates.name = input.name;
    // Only admins may change role — silently drop it from non-admin callers.
    if (input.role && auth.role === 'admin') updates.role = input.role;

    updateUser(input.id, updates);

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
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id.length > 64) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Prevent deleting yourself.
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
