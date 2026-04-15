import { NextRequest, NextResponse } from 'next/server';
import { getAllLinks, createLink, updateLink, deleteLink } from '@/lib/db';
import { verifyAuth, requireAdmin } from '@/lib/auth';
import {
  validateCreateLink,
  validateUpdateLink,
  ValidationError,
} from '@/lib/validation';

function badRequest(err: unknown) {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const links = getAllLinks();

    if (!auth) {
      return NextResponse.json(links.filter((link) => link.is_public));
    }

    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 });
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
      input = validateCreateLink(body);
    } catch (err) {
      const r = badRequest(err);
      if (r) return r;
      throw err;
    }

    const link = createLink(input);
    return NextResponse.json(link);
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    let input;
    try {
      input = validateUpdateLink(body);
    } catch (err) {
      const r = badRequest(err);
      if (r) return r;
      throw err;
    }

    const { id, ...updates } = input;
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

    deleteLink(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json({ error: 'Erro ao excluir link' }, { status: 500 });
  }
}
