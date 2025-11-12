import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Decimal } from "@prisma/client/runtime/library";

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

  // Passo 3: Calcular Património Necessário (Meta)

  // Corrigir custo de vida pela inflação
  const valorAnualCorrigido = input.valorReceberAnualDesejado * Math.pow(1 + taxaInflacaoDecimal, anosAcumulacao);

  // Calcular Valor Presente da Aposentadoria (Fórmula de PV de Anuidade)
  let patrimonioNecessario = 0;
  if (taxaRealAposentadoriaDecimal > 0) {
    patrimonioNecessario = valorAnualCorrigido * ((1 - Math.pow(1 + taxaRealAposentadoriaDecimal, -input.periodoUsufruir)) / taxaRealAposentadoriaDecimal);
  } else {
    // Se taxa é zero, simplesmente multiplicar o valor anual pelo período
    patrimonioNecessario = valorAnualCorrigido * input.periodoUsufruir;
  }

  // Passo 4: Calcular Veredito
  const resultado = patrimonioAcumulado - patrimonioNecessario;
  const planoViavel = resultado >= 0;

  return {
    patrimonioNecessario,
    patrimonioAcumulado,
    valorPrimeiroSaque: valorAnualCorrigido,
    resultado,
    planoViavel,
    anosAcumulacao,
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

      const simulacao = await ctx.db.simulacaoAposentadoria.create({
        data: {
          name: input.name,
          userId: ctx.session.user.id,

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
      const simulacoes = await ctx.db.simulacaoAposentadoria.findMany({
        where: {
          userId: ctx.session.user.id,
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
      const simulacao = await ctx.db.simulacaoAposentadoria.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Segurança: apenas próprias simulações
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
      await ctx.db.simulacaoAposentadoria.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Segurança: apenas próprias simulações
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

      const simulacao = await ctx.db.simulacaoAposentadoria.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
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
});
