import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug } from '@/lib/db-forms';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const form = getFormBySlug(params.slug);
    
    if (!form) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      );
    }
    
    // Retornar apenas informações públicas
    return NextResponse.json({
      id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar formulário' },
      { status: 500 }
    );
  }
}
