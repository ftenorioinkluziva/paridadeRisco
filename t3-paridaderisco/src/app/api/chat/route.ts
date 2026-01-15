import { generateText } from 'ai';
import { getChatModel } from '~/lib/ai/config';
import { agentTools } from '~/lib/ai/tools';
import { RISK_PARITY_SYSTEM_PROMPT } from '~/lib/ai/config';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { env } from '~/env';

// Removido 'edge' runtime pois NextAuth não é compatível com Edge Runtime
// export const runtime = 'edge';

/**
 * POST /api/chat
 *
 * Chat endpoint "Robust Edition".
 * Usa generateText com loop manual para garantir que o modelo fale após usar tools.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    let token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Parse do body
    const body = await req.json();
    const { messages } = body as { messages: Array<{ role: string; content: string }> };

    // 3. Sanitização de Mensagens (vazia -> skip)
    // Importante para evitar erros de API da Google
    const history = messages
      .filter(m => m.role !== 'system') // remove system injetado pelo client se houver
      .map((m: any) => ({
        role: m.role,
        content: m.content || ''
      }))
      .filter((m: any) => m.role !== 'assistant' || m.content.trim() !== '');

    console.log('[Chat API] History size:', history.length);

    // 4. Contexto do sistema
    const systemMessage = `${RISK_PARITY_SYSTEM_PROMPT}\n\n**User ID**: ${userId}`;

    // 5. Configurar modelo
    const model = getChatModel();

    // 6. Chamada Principal (Passo 1)
    // Permitimos tools.
    let result = await generateText({
      model,
      system: systemMessage,
      messages: history as any,
      tools: agentTools,
      maxSteps: 5, // Tenta resolver tudo sozinho primeiro
      temperature: 0.5,
    });

    console.log('[Chat API] Pass 1 Finish:', result.finishReason, 'Text:', result.text.length);

    // 7. Check de "Silêncio"
    // Se parou em tool-calls e não gerou texto, OU se gerou texto vazio
    if ((result.finishReason === 'tool-calls' || result.finishReason === 'stop') && result.text.trim().length === 0) {
      console.log('[Chat API] Model went silent. Forcing summary generation via RETRY LOOP...');

      const generatedSteps = result.response.messages;

      const retryMessages = [
        ...history,
        ...generatedSteps,
        {
          role: 'user',
          content: 'Analise os dados retornados pelas ferramentas acima e responda à minha pergunta original. Explique o que encontrou.'
        }
      ];

      // Chamada de Força (Passo 2) - USANDO GENERATE TEXT PARA EVITAR ERROS DE STREAM
      const retryResult = await generateText({
        model,
        system: systemMessage,
        messages: retryMessages as any,
        maxSteps: 1,
        temperature: 0.7,
      });

      console.log('[Chat API] Pass 2 Finish:', retryResult.finishReason, 'Text:', retryResult.text.length);

      // Usar o resultado da retentativa
      result = retryResult;
    }

    // Formatar resposta final como Data Stream Protocol
    // Protocolo: 0:"conteudo"\n
    // Isso engana o useChat fazendo-o achar que recebeu um stream de um único chunk.
    const textContent = JSON.stringify(result.text);
    return new Response(`0:${textContent}\n`, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1' // Opcional, mas ajuda a identificar
      },
    });

  } catch (error) {
    console.error('[Chat API] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
