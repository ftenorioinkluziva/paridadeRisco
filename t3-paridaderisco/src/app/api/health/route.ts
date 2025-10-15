/**
 * Health Check Endpoint
 *
 * Usado pelo Docker healthcheck para verificar se a aplicação está funcionando
 */

import { prisma } from "~/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Testar conexão com o banco de dados
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
