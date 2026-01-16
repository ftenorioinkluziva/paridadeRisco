import { streamText, stepCountIs } from "ai";
import { getChatModel } from "~/lib/ai/config";
import { agentTools, setCurrentUserId } from "~/lib/ai/tools";
import { RISK_PARITY_SYSTEM_PROMPT } from "~/lib/ai/config";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { saveChat, getChatById, deleteChatById } from "~/lib/chat-queries";

interface SimpleMessage {
  role: string;
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    let token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as {
        userId: string;
      };
      userId = decoded.userId;
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, messages } = body as { id: string; messages: SimpleMessage[] };

    const coreMessages = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

const systemMessage = `Você é um assistente financeiro especializado em portfólios. Use as ferramentas disponíveis para analisar dados do portfólio do usuário e responder perguntas.

**User ID**: ${userId}

**REGRAS**:
1. Para perguntas sobre o portfólio, use getPortfolioData ou getPortfolioMetrics
2. Analise os dados retornados e responda de forma clara e útil
3. Use getInformation para dúvidas sobre conceitos de investimento
4. Sempre aguarde os resultados das ferramentas antes de responder

Seu objetivo: ajudar o usuário a entender seu portfólio e tomar decisões melhores.`;
    const model = getChatModel();

    // Set the current user ID for tools to use
    setCurrentUserId(userId);

    console.log('[Chat API] Processing chat for user:', userId);
    console.log('[Chat API] Messages count:', coreMessages.length);

console.log('[Chat API] Model:', model.provider, model.modelId);
    console.log('[Chat API] System message length:', systemMessage.length);
    console.log('[Chat API] Core messages:', coreMessages.map(m => ({ role: m.role, contentLength: m.content?.length || 0 })));

    const result = streamText({
      model,
      system: systemMessage,
      messages: coreMessages,
      tools: agentTools,
      temperature: 0.5,
      stopWhen: stepCountIs(10), // Allow multiple tool calls + final response
      onFinish: async ({ text }) => {
        console.log('[Chat API] AI Response received:', text?.substring(0, 200) + '...');
        if (userId && text) {
          try {
            const allMessages = [
              ...messages,
              { role: "assistant", content: text },
            ];
            await saveChat({
              id,
              messages: allMessages,
              userId,
            });
            console.log('[Chat API] Chat saved successfully');
          } catch (error) {
            console.error("Failed to save chat:", error);
          }
        } else {
          console.log('[Chat API] No text or userId received. Text:', text, 'UserId:', userId);
        }
      },
    });

try {
    return result.toTextStreamResponse();
  } catch (streamError) {
    console.error("[Chat API] Stream Error:", streamError);
    return new Response(JSON.stringify({ 
      error: "Stream Error", 
      details: streamError instanceof Error ? streamError.message : 'Unknown' 
    }), {
      status: 500,
    });
  }
  } catch (error) {
    console.error("[Chat API] General Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error", 
      details: error instanceof Error ? error.message : 'Unknown' 
    }), {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  let token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as {
      userId: string;
    };
    userId = decoded.userId;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat || chat.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    console.error("[Chat API] Delete error:", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
