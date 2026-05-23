import { NextRequest, NextResponse } from 'next/server';
import { exportData, importData } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateBackup, ValidationError } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const raw = await request.json().catch(() => null);

    let data;
    try {
      data = validateBackup(raw);
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
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
