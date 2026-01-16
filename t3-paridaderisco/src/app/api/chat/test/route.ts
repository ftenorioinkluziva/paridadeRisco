// Teste simplificado da API de chat
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { env } from "~/env";

export async function GET(req: NextRequest) {
  try {
    // Test authentication
    let token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) token = req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.NEXTAUTH_SECRET!) as {
        userId: string;
      };
      userId = decoded.userId;
      return NextResponse.json({ 
        success: true, 
        userId,
        tokenValid: true,
        message: "Authentication working"
      });
    } catch (error) {
      return NextResponse.json({ 
        error: "Invalid token", 
        details: error instanceof Error ? error.message : 'Unknown'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}