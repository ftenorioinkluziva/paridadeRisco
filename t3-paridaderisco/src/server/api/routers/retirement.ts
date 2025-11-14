import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Decimal } from "@prisma/client/runtime/library";
import { calculatePercentageChange } from "~/lib/utils/priceCalculations";

// Schema de validação para entrada
const retirementInputSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),

  // Situação Atual
  idadeAtual: z.number().int().min(18).max(100),
  patrimonioInicial: z.number().min(0),
  aporteMensal: z.number().min(0),

  // Objetivos
  idadeAposentadoria: z.number().int().min(18).max(120),
  valorReceberAnualDesejado: z.number().min(1),
  periodoUsufruir: z.number().int().min(1).max(100),

  // Premissas (como percentuais: 12.5 para 12.5%)
  previsaoInflacaoAnual: z.number().min(0).max(100),
  taxaRealAcumulacao: z.number().min(-10).max(100),
  taxaRealAposentadoria: z.number().min(-10).max(100),
  aliquotaIR: z.number().min(0).max(100).default(15), // Alíquota de IR sobre rendimentos
});

// Função auxiliar para cálculos financeiros
function calcularSimulacao(input: z.infer<typeof retirementInputSchema>) {
  // Passo 1: Definir variáveis de tempo e taxas
  const anosAcumulacao = input.idadeAposentadoria - input.idadeAtual;
  const mesesAcumulacao = anosAcumulacao * 12;

  // Converter percentuais para decimais (12.5% -> 0.125)
  const taxaInflacaoDecimal = input.previsaoInflacaoAnual / 100;
  const taxaRealAcumulacaoDecimal = input.taxaRealAcumulacao / 100;
  const taxaRealAposentadoriaDecimal = input.taxaRealAposentadoria / 100;

  // Taxa mensal de acumulação
  const taxaRealMensalAcumulacao = Math.pow(1 + taxaRealAcumulacaoDecimal, 1/12) - 1;

  // Passo 2: Calcular Património Acumulado (Projeção)

  // FV do Património Inicial
  const fvInicial = input.patrimonioInicial * Math.pow(1 + taxaRealAcumulacaoDecimal, anosAcumulacao);

  // FV dos Aportes Mensais (Fórmula de Valor Futuro de Anuidade)
  let fvAportes = 0;
  if (taxaRealMensalAcumulacao > 0 && input.aporteMensal > 0) {
    fvAportes = input.aporteMensal * ((Math.pow(1 + taxaRealMensalAcumulacao, mesesAcumulacao) - 1) / taxaRealMensalAcumulacao);
  } else if (input.aporteMensal > 0) {
    // Se taxa é zero, o FV é simplesmente a soma dos aportes
    fvAportes = input.aporteMensal * mesesAcumulacao;
  }

  const patrimonioAcumulado = fvInicial + fvAportes;

  // Capital total investido (não tributável)
  const capitalInvestido = input.patrimonioInicial + (input.aporteMensal * mesesAcumulacao);

  // Rendimentos totais (tributáveis)
  const rendimentosTotais = patrimonioAcumulado - capitalInvestido;

  // Passo 3: Calcular Património Necessário (Meta) considerando IR

  // Corrigir custo de vida pela inflação
  const valorAnualCorrigido = input.valorReceberAnualDesejado * Math.pow(1 + taxaInflacaoDecimal, anosAcumulacao);

  // Converter alíquota de IR para decimal
  const aliquotaIRDecimal = input.aliquotaIR / 100;

  // Calcular patrimônio necessário considerando IR sobre rendimentos
  // A cada ano, o saque terá uma proporção de capital (isento) e rendimentos (tributáveis)
  // Proporção inicial de rendimentos no patrimônio
  const proporcaoRendimentos = rendimentosTotais / patrimonioAcumulado;

  // Ajustar valor anual para considerar IR sobre rendimentos
  // valorLiquido = valorBruto - (valorBruto * proporcaoRendimentos * aliquotaIR)
  // valorLiquido = valorBruto * (1 - proporcaoRendimentos * aliquotaIR)
  // valorBruto = valorLiquido / (1 - proporcaoRendimentos * aliquotaIR)
  const fatorAjusteIR = 1 - (proporcaoRendimentos * aliquotaIRDecimal);
  const valorAnualBruto = valorAnualCorrigido / fatorAjusteIR;

  // Calcular Valor Presente da Aposentadoria (Fórmula de PV de Anuidade)
  let patrimonioNecessario = 0;
  if (taxaRealAposentadoriaDecimal > 0) {
    patrimonioNecessario = valorAnualBruto * ((1 - Math.pow(1 + taxaRealAposentadoriaDecimal, -input.periodoUsufruir)) / taxaRealAposentadoriaDecimal);
  } else {
    // Se taxa é zero, simplesmente multiplicar o valor anual pelo período
    patrimonioNecessario = valorAnualBruto * input.periodoUsufruir;
  }

  // Passo 4: Calcular Veredito
  const resultado = patrimonioAcumulado - patrimonioNecessario;
  const planoViavel = resultado >= 0;

  // Calcular IR estimado no primeiro saque
  const irPrimeiroSaque = valorAnualBruto * proporcaoRendimentos * aliquotaIRDecimal;

  return {
    patrimonioNecessario,
    patrimonioAcumulado,
    valorPrimeiroSaque: valorAnualCorrigido, // Valor líquido (após IR)
    valorPrimeiroSaqueBruto: valorAnualBruto, // Valor antes do IR
    irPrimeiroSaque, // IR no primeiro saque
    resultado,
    planoViavel,
    anosAcumulacao,
    capitalInvestido,
    rendimentosTotais,
    proporcaoRendimentos,
  };
}

export const retirementRouter = createTRPCRouter({
  // Simular (calcular sem salvar)
  simulate: protectedProcedure
    .input(retirementInputSchema)
    .mutation(({ input }) => {
      const resultados = calcularSimulacao(input);

      return {
        ...resultados,
        inputData: input,
      };
    }),

  // Criar e salvar simulação
  create: protectedProcedure
    .input(retirementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const resultados = calcularSimulacao(input);

      const simulacao = await ctx.prisma.simulacaoAposentadoria.create({
        data: {
          name: input.name,
          userId: ctx.session.userId,

          // Inputs
          idadeAtual: input.idadeAtual,
          patrimonioInicial: new Decimal(input.patrimonioInicial),
          aporteMensal: new Decimal(input.aporteMensal),
          idadeAposentadoria: input.idadeAposentadoria,
          valorReceberAnualDesejado: new Decimal(input.valorReceberAnualDesejado),
          periodoUsufruir: input.periodoUsufruir,
          previsaoInflacaoAnual: new Decimal(input.previsaoInflacaoAnual),
          taxaRealAcumulacao: new Decimal(input.taxaRealAcumulacao),
          taxaRealAposentadoria: new Decimal(input.taxaRealAposentadoria),
          aliquotaIR: new Decimal(input.aliquotaIR),

          // Resultados
          patrimonioNecessario: new Decimal(resultados.patrimonioNecessario),
          patrimonioAcumulado: new Decimal(resultados.patrimonioAcumulado),
          valorPrimeiroSaque: new Decimal(resultados.valorPrimeiroSaque),
          resultado: new Decimal(resultados.resultado),
          planoViavel: resultados.planoViavel,
        },
      });

      return simulacao;
    }),

  // Listar simulações do usuário
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const simulacoes = await ctx.prisma.simulacaoAposentadoria.findMany({
        where: {
          userId: ctx.session.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return simulacoes;
    }),

  // Buscar uma simulação específica
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const simulacao = await ctx.prisma.simulacaoAposentadoria.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.userId, // Segurança: apenas próprias simulações
        },
      });

      if (!simulacao) {
        throw new Error("Simulação não encontrada");
      }

      return simulacao;
    }),

  // Deletar simulação
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.simulacaoAposentadoria.delete({
        where: {
          id: input.id,
          userId: ctx.session.userId, // Segurança: apenas próprias simulações
        },
      });

      return { success: true };
    }),

  // Atualizar simulação
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: retirementInputSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resultados = calcularSimulacao(input.data);

      const simulacao = await ctx.prisma.simulacaoAposentadoria.update({
        where: {
          id: input.id,
          userId: ctx.session.userId,
        },
        data: {
          name: input.data.name,

          // Inputs
          idadeAtual: input.data.idadeAtual,
          patrimonioInicial: new Decimal(input.data.patrimonioInicial),
          aporteMensal: new Decimal(input.data.aporteMensal),
          idadeAposentadoria: input.data.idadeAposentadoria,
          valorReceberAnualDesejado: new Decimal(input.data.valorReceberAnualDesejado),
          periodoUsufruir: input.data.periodoUsufruir,
          previsaoInflacaoAnual: new Decimal(input.data.previsaoInflacaoAnual),
          taxaRealAcumulacao: new Decimal(input.data.taxaRealAcumulacao),
          taxaRealAposentadoria: new Decimal(input.data.taxaRealAposentadoria),
          aliquotaIR: new Decimal(input.data.aliquotaIR),

          // Resultados
          patrimonioNecessario: new Decimal(resultados.patrimonioNecessario),
          patrimonioAcumulado: new Decimal(resultados.patrimonioAcumulado),
          valorPrimeiroSaque: new Decimal(resultados.valorPrimeiroSaque),
          resultado: new Decimal(resultados.resultado),
          planoViavel: resultados.planoViavel,
        },
      });

      return simulacao;
    }),

  // Buscar premissas de mercado (IPCA e IPCA_EXP)
  getMarketPremises: protectedProcedure.query(async ({ ctx }) => {
    // Buscar últimos dados do IPCA e IPCA_EXP
    const ipca = await ctx.prisma.ativo.findUnique({
      where: { ticker: 'IPCA' },
      include: {
        dadosHistoricos: {
          orderBy: { date: 'desc' },
          take: 12, // últimos 12 meses
        },
      },
    });

    const ipcaExp = await ctx.prisma.ativo.findUnique({
      where: { ticker: 'IPCA_EXP' },
      include: {
        dadosHistoricos: {
          orderBy: { date: 'desc' },
          take: 1, // mais recente
        },
      },
    });

    // Calcular inflação anual acumulada (soma dos últimos 12 meses)
    let inflacaoAnualAcumulada = 0;
    if (ipca && ipca.dadosHistoricos.length > 1) {
      const last12Months = ipca.dadosHistoricos.slice(0, Math.min(12, ipca.dadosHistoricos.length));
      for (let i = 0; i < last12Months.length; i++) {
        if (i < ipca.dadosHistoricos.length - 1) {
          const currentPrice = last12Months[i]?.price?.toNumber() || null;
          const previousPrice = ipca.dadosHistoricos[i + 1]?.price?.toNumber() || null;
          const percentual = calculatePercentageChange(previousPrice, currentPrice) || 0;
          inflacaoAnualAcumulada += percentual;
        }
      }
    }

    // Expectativa de inflação (IPCA_EXP)
    let expectativaInflacao = 0;
    if (ipcaExp && ipcaExp.dadosHistoricos.length > 0) {
      expectativaInflacao = ipcaExp.dadosHistoricos[0]?.price?.toNumber() || 0;
    }

    return {
      inflacaoAnualAcumulada: Math.round(inflacaoAnualAcumulada * 100) / 100, // 2 casas decimais
      expectativaInflacao12M: Math.round(expectativaInflacao * 100) / 100,
      dataAtualizacaoIPCA: ipca?.dadosHistoricos[0]?.date || null,
      dataAtualizacaoIPCA_EXP: ipcaExp?.dadosHistoricos[0]?.date || null,
    };
  }),

  // Buscar valor total do portfólio do usuário
  getUserPortfolioValue: protectedProcedure.query(async ({ ctx }) => {
    // Buscar saldo em caixa
    const portfolio = await ctx.prisma.portfolio.findUnique({
      where: { userId: ctx.session.userId },
    });

    // Buscar todas as transações do usuário para calcular posições em ativos
    const transacoes = await ctx.prisma.transacao.findMany({
      where: { userId: ctx.session.userId },
      include: {
        ativo: {
          include: {
            dadosHistoricos: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    // Buscar fundos de investimento do usuário
    const fundos = await ctx.prisma.fundoInvestimento.findMany({
      where: { userId: ctx.session.userId },
    });

    // Calcular valor das posições em ativos (via transações)
    const posicoesMap = new Map<string, { shares: number, ativo: any }>();

    for (const transacao of transacoes) {
      const ativoId = transacao.ativoId;
      const shares = transacao.shares.toNumber();
      const tipo = transacao.type;

      if (!posicoesMap.has(ativoId)) {
        posicoesMap.set(ativoId, { shares: 0, ativo: transacao.ativo });
      }

      const posicao = posicoesMap.get(ativoId)!;
      posicao.shares += tipo === 'COMPRA' ? shares : -shares;
    }

    let valorAtivos = 0;
    for (const [_, posicao] of posicoesMap) {
      if (posicao.shares > 0 && posicao.ativo.dadosHistoricos.length > 0) {
        const precoAtual = posicao.ativo.dadosHistoricos[0]?.price?.toNumber() || 0;
        valorAtivos += posicao.shares * precoAtual;
      }
    }

    // Calcular valor total dos fundos de investimento
    let valorFundos = 0;
    for (const fundo of fundos) {
      valorFundos += fundo.currentValue.toNumber();
    }

    const cashBalance = portfolio?.cashBalance.toNumber() || 0;
    const valorTotal = cashBalance + valorAtivos + valorFundos;

    return {
      cashBalance,
      valorAtivos,
      valorFundos,
      valorTotal: Math.round(valorTotal * 100) / 100,
    };
  }),
});
