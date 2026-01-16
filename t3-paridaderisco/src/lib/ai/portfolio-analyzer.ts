import { generateText } from 'ai';
import { getChatModel, RISK_PARITY_SYSTEM_PROMPT } from './config';
import { agentTools } from './tools';
import { prisma } from '~/lib/prisma';

/**
 * Analisa o portfólio de um usuário e gera insights/notificações automaticamente
 */
export async function analyzePortfolio(userId: string): Promise<{
  success: boolean;
  insights: string[];
  notificationsCreated: number;
  error?: string;
}> {
  try {
    console.log(`[Portfolio Analyzer] Starting analysis for user ${userId}`);

    // 1. Usar o modelo para analisar o portfólio
    const model = getChatModel();

    const analysisPrompt = `
Analise o portfólio do usuário (ID: ${userId}) e identifique:

1. **Status do Risk Balance Score**: O portfólio está balanceado?
2. **Performance**: Ganhos/perdas significativos?
3. **Oportunidades**: Há ativos desbalanceados que precisam de rebalanceamento?
4. **Riscos**: Existe algum risco concentrado?

Para cada insight relevante:
- Use o tool \`createNotification\` para criar uma notificação
- Classifique corretamente o tipo (INSIGHT, WARNING, OPPORTUNITY, REBALANCE)
- Defina a prioridade apropriada (HIGH, MEDIUM, LOW)

Seja objetivo e crie apenas notificações quando houver insights realmente importantes.
Se o portfólio estiver bem balanceado e sem problemas, apenas confirme isso sem criar notificações desnecessárias.
`;

    const result = await generateText({
      model,
      system: RISK_PARITY_SYSTEM_PROMPT,
      prompt: analysisPrompt,
      tools: agentTools,
      temperature: 0.5,
    });

    // 2. Extrair insights do texto gerado
    const insights: string[] = [];

    // Procurar por linhas que começam com marcadores de insight
    const lines = result.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('•') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('*') ||
        /^\d+\./.test(trimmed)
      ) {
        insights.push(trimmed.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, ''));
      }
    }

    // 3. Contar notificações criadas
    const toolCalls = result.toolCalls || [];
    const notificationsCreated = toolCalls.filter(
      (call: any) => call.toolName === 'createNotification'
    ).length;

    console.log(`[Portfolio Analyzer] Analysis complete for user ${userId}:`, {
      insightsFound: insights.length,
      notificationsCreated,
      toolCallsTotal: toolCalls.length,
    });

    return {
      success: true,
      insights: insights.length > 0 ? insights : [result.text],
      notificationsCreated,
    };
  } catch (error) {
    console.error('[Portfolio Analyzer] Error:', error);

    return {
      success: false,
      insights: [],
      notificationsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Analisa os portfólios de todos os usuários ativos
 */
export async function analyzeAllPortfolios(): Promise<{
  success: boolean;
  usersAnalyzed: number;
  totalNotifications: number;
  errors: string[];
}> {
  try {
    console.log('[Portfolio Analyzer] Starting batch analysis for all users');

    // Buscar todos os usuários com portfólio
    const users = await prisma.user.findMany({
      where: {
        portfolio: {
          isNot: null,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`[Portfolio Analyzer] Found ${users.length} users with portfolios`);

    const errors: string[] = [];
    let totalNotifications = 0;

    // Analisar cada usuário
    for (const user of users) {
      try {
        const result = await analyzePortfolio(user.id);

        if (result.success) {
          totalNotifications += result.notificationsCreated;
        } else {
          errors.push(`User ${user.email}: ${result.error}`);
        }

        // Pequeno delay entre análises para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`User ${user.email}: ${errorMsg}`);
        console.error(`[Portfolio Analyzer] Error analyzing user ${user.id}:`, error);
      }
    }

    console.log('[Portfolio Analyzer] Batch analysis complete:', {
      usersAnalyzed: users.length,
      totalNotifications,
      errors: errors.length,
    });

    return {
      success: true,
      usersAnalyzed: users.length,
      totalNotifications,
      errors,
    };
  } catch (error) {
    console.error('[Portfolio Analyzer] Batch analysis error:', error);

    return {
      success: false,
      usersAnalyzed: 0,
      totalNotifications: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
