import { NextResponse } from 'next/server';
import { getServerAuthSession } from '~/server/auth';
import { processPDF } from '~/lib/ai/pdf-processor';

export const runtime = 'nodejs'; // Precisamos do runtime Node para processar PDFs

/**
 * POST /api/knowledge/extract-pdf
 *
 * Faz upload de um PDF e extrai título, categoria e conteúdo usando LLM
 */
export async function POST(req: Request) {
  try {
    // 1. Autenticação
    // TODO: Fix authentication in nodejs runtime
    // const session = await getServerAuthSession();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[Extract PDF] Skipping auth check temporarily');

    // 2. Parse do arquivo
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    console.log(`[Extract PDF] Processing file: ${file.name} (${file.size} bytes)`);

    // 3. Converter para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Processar PDF
    const extractedInfo = await processPDF(buffer);

    return NextResponse.json({
      success: true,
      data: extractedInfo,
    });
  } catch (error) {
    console.error('[Extract PDF API] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
