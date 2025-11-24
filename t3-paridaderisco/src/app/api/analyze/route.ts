import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '~/server/auth';
import { analyzePortfolio, analyzeAllPortfolios } from '~/lib/ai/portfolio-analyzer';

/**
 * POST /api/analyze
 *
 * Endpoint para triggerar análise de portfólio
 *
 * Query params:
 * - userId: analisa apenas este usuário (opcional)
 * - all: analisa todos os usuários se for "true" (requer admin)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerAuthSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse params
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const analyzeAll = searchParams.get('all') === 'true';

    // 3. Se for análise em lote, verificar se é admin
    if (analyzeAll) {
      // TODO: Adicionar verificação de role admin quando implementar
      // Por enquanto, qualquer usuário autenticado pode triggerar

      const result = await analyzeAllPortfolios();

      return NextResponse.json({
        success: result.success,
        message: `Analisados ${result.usersAnalyzed} usuários, ${result.totalNotifications} notificações criadas`,
        data: result,
      });
    }

    // 4. Análise de usuário específico
    const targetUserId = userId || session.user.id;

    // Verificar se está tentando analisar outro usuário sem ser admin
    if (targetUserId !== session.user.id) {
      // TODO: Verificar role admin
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await analyzePortfolio(targetUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Análise completa. ${result.notificationsCreated} notificações criadas.`,
      data: {
        insights: result.insights,
        notificationsCreated: result.notificationsCreated,
      },
    });
  } catch (error) {
    console.error('[Analyze API] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
