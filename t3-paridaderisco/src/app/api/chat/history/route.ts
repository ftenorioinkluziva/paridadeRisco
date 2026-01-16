import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";
import { getChatsByUserId } from "~/lib/chat-queries";

export async function GET(req: NextRequest) {
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

    const chats = await getChatsByUserId({ id: userId });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("[Chat History API] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
