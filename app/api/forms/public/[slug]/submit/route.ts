import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug, createSubmission } from '@/lib/db-forms';

export async function POST(
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
    
    const { data, signature } = await request.json();
    
    // Obter IP do cliente
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const submission = createSubmission({
      form_id: form.id,
      data,
      signature,
      ip_address: ip
    });
    
    return NextResponse.json({ 
      success: true,
      submissionId: submission.id 
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar formulário' },
      { status: 500 }
    );
  }
}
