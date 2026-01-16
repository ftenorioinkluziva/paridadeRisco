import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getChatById } from "~/lib/chat-queries";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const chat = await getChatById({ id });

    if (!chat) {
      return new Response("Not Found", { status: 404 });
    }

    if (chat.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("[Chat API] Get by ID error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
