import { streamText, convertToModelMessages } from 'ai';
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
 * Chat endpoint com streaming e RAG.
 * Usa os tools do agente para buscar informações e analisar o portfólio.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação usando JWT customizado (mesmo sistema do tRPC)
    let token = req.headers.get("authorization")?.replace("Bearer ", "");

    // Se não houver token no header, buscar do cookie
    if (!token) {
      token = req.cookies.get("auth_token")?.value;
    }

    if (!token) {
      console.log('[Chat API] No token found');
      return new Response('Unauthorized', { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      console.log('[Chat API] Invalid token:', error);
      return new Response('Unauthorized', { status: 401 });
    }


    // 2. Parse do body
    const body = await req.json();
    console.log('[Chat API] Received body:', JSON.stringify(body, null, 2));

    const { messages } = body as { messages: Array<{ role: string; content: string }> };

    if (!messages || !Array.isArray(messages)) {
      console.log('[Chat API] Invalid messages:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid request body: messages must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Converter para ModelMessages (apenas role e content)
    console.log('[Chat API] Converting messages:', messages.length);
    const modelMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || msg.parts?.find((p: any) => p.type === 'text')?.text || ''
    }));

    // 4. Adicionar userId como contexto para os tools
    // Os tools precisam do userId para buscar dados do portfólio
    const systemMessage = `${RISK_PARITY_SYSTEM_PROMPT}

**User ID para os tools**: ${userId}`;

    // 5. Configurar modelo e fazer streaming
    const model = getChatModel();

    const result = streamText({
      model,
      system: systemMessage,
      messages: modelMessages,
      // tools: agentTools, // Desabilitado temporariamente para testar
      // maxSteps: 5,
      temperature: 0.7,
      onFinish: async ({ text, toolCalls, finishReason, usage }) => {
        console.log('[Chat] Finished:', {
          textLength: text.length,
          toolCallsCount: toolCalls?.length || 0,
          finishReason,
          usage,
        });
      },
    });

    // 6. Retornar stream no formato UI Message (compatível com useChat)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);

    if (error instanceof Error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
