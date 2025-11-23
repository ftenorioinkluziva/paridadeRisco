import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResourceCategory } from '@prisma/client';

export interface ExtractedPDFInfo {
  title: string;
  category: ResourceCategory;
  content: string;
}

/**
 * Processa um PDF completo usando Google Gemini com visão de documentos
 * Envia o PDF diretamente para o Gemini processar
 */
export async function processPDF(buffer: Buffer): Promise<ExtractedPDFInfo> {
  try {
    console.log('[PDF Processor] Starting PDF processing with Gemini...');

    console.log(`[PDF Processor] PDF size: ${buffer.length} bytes`);

    // 1. Inicializar Gemini
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY não configurada');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analise este documento PDF e extraia as seguintes informações:

1. **Título**: Um título claro e conciso que resuma o documento (máximo 100 caracteres)
2. **Categoria**: Classifique o documento em UMA das seguintes categorias:
   - STRATEGY: Estratégias de investimento
   - MARKET_ANALYSIS: Análises de mercado e cenário econômico
   - INVESTMENT_GUIDE: Guias práticos de investimento
   - RISK_PARITY: Conceitos e metodologia de Paridade de Risco
   - ASSET_INFO: Informações sobre ativos específicos (ações, ETFs, fundos)
   - ECONOMIC_SCENARIO: Cenários econômicos e projeções

3. **Conteúdo**: O texto completo do documento, limpo e formatado em Markdown
   - Mantenha títulos, subtítulos e estrutura
   - Remova cabeçalhos/rodapés repetitivos e numeração de páginas
   - Preserve tabelas, listas e formatação importante
   - Extraia TODO o conteúdo relevante do documento

IMPORTANTE:
- O conteúdo deve ser completo e bem estruturado
- Use Markdown para formatar o conteúdo (títulos com #, listas, etc)

Responda APENAS no seguinte formato JSON (sem markdown code blocks, sem explicações):
{
  "title": "título aqui",
  "category": "CATEGORIA_AQUI",
  "content": "conteúdo completo em markdown aqui"
}`;

    // 2. Preparar o PDF para envio (inline data com base64)
    const base64Pdf = buffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Pdf,
          mimeType: 'application/pdf',
        },
      },
      prompt,
    ]);

    console.log('[PDF Processor] Gemini response received');

    // Pegar o texto da resposta
    const response = await result.response;
    const text = response.text();

    console.log('[PDF Processor] Response text length:', text.length);

    // Parse do JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[PDF Processor] Gemini response:', text);
      throw new Error('Gemini não retornou um JSON válido');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      title: string;
      category: string;
      content: string;
    };

    // Validar categoria
    const validCategories = Object.keys(ResourceCategory);
    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Categoria inválida: ${parsed.category}`);
    }

    // Validar tamanho do conteúdo
    if (parsed.content.length < 100) {
      throw new Error('Conteúdo extraído é muito curto');
    }

    console.log(`[PDF Processor] Successfully extracted info: "${parsed.title}"`);
    console.log(`[PDF Processor] Content length: ${parsed.content.length} characters`);

    return {
      title: parsed.title.substring(0, 100),
      category: parsed.category as ResourceCategory,
      content: parsed.content,
    };
  } catch (error) {
    console.error('[PDF Processor] Error processing PDF:', error);
    throw new Error(
      error instanceof Error
        ? `Erro ao processar PDF: ${error.message}`
        : 'Erro ao processar PDF'
    );
  }
}
