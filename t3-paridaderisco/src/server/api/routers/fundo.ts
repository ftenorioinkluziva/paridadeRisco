import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const fundoRouter = createTRPCRouter({
  // Listar todos os fundos do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    const fundos = await ctx.prisma.fundoInvestimento.findMany({
      where: {
        userId: ctx.session.userId,
      },
      include: {
        indice: true,
      },
      orderBy: {
        investmentDate: 'desc',
      },
    });

    // Calcular rentabilidade para cada fundo
    const fundosComRentabilidade = fundos.map((fundo) => {
      const rentabilidade = ((fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber()) / fundo.initialInvestment.toNumber()) * 100;
      const ganhoPerda = fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber();
      
      return {
        ...fundo,
        rentabilidade: rentabilidade,
        ganhoPerda: ganhoPerda,
        initialInvestment: fundo.initialInvestment.toNumber(),
        currentValue: fundo.currentValue.toNumber(),
      };
    });

    return fundosComRentabilidade;
  }),

  // Obter fundo por ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fundo = await ctx.prisma.fundoInvestimento.findUnique({
        where: {
          id: input.id,
        },
        include: {
          indice: true,
        },
      });

      if (!fundo || fundo.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment fund not found",
        });
      }

      const rentabilidade = ((fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber()) / fundo.initialInvestment.toNumber()) * 100;
      const ganhoPerda = fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber();

      return {
        ...fundo,
        rentabilidade,
        ganhoPerda,
        initialInvestment: fundo.initialInvestment.toNumber(),
        currentValue: fundo.currentValue.toNumber(),
      };
    }),

  // Criar novo fundo de investimento
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Fund name is required"),
        initialInvestment: z.number().min(0.01, "Initial investment must be greater than 0"),
        currentValue: z.number().min(0, "Current value must be non-negative"),
        investmentDate: z.string().transform((str) => new Date(str)),
        indiceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fundo = await ctx.prisma.fundoInvestimento.create({
        data: {
          name: input.name,
          initialInvestment: input.initialInvestment,
          currentValue: input.currentValue,
          investmentDate: input.investmentDate,
          indiceId: input.indiceId,
          userId: ctx.session.userId,
        },
      });

      const rentabilidade = ((fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber()) / fundo.initialInvestment.toNumber()) * 100;
      const ganhoPerda = fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber();

      return {
        ...fundo,
        rentabilidade,
        ganhoPerda,
        initialInvestment: fundo.initialInvestment.toNumber(),
        currentValue: fundo.currentValue.toNumber(),
      };
    }),

  // Atualizar fundo existente
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Fund name is required").optional(),
        initialInvestment: z.number().min(0.01, "Initial investment must be greater than 0").optional(),
        currentValue: z.number().min(0, "Current value must be non-negative").optional(),
        investmentDate: z.string().transform((str) => new Date(str)).optional(),
        indiceId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verificar se o fundo pertence ao usuário
      const existingFundo = await ctx.prisma.fundoInvestimento.findUnique({
        where: { id },
      });

      if (!existingFundo || existingFundo.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment fund not found",
        });
      }

      const fundo = await ctx.prisma.fundoInvestimento.update({
        where: { id },
        data: updateData,
      });

      const rentabilidade = ((fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber()) / fundo.initialInvestment.toNumber()) * 100;
      const ganhoPerda = fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber();

      return {
        ...fundo,
        rentabilidade,
        ganhoPerda,
        initialInvestment: fundo.initialInvestment.toNumber(),
        currentValue: fundo.currentValue.toNumber(),
      };
    }),

  // Deletar fundo
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se o fundo pertence ao usuário
      const existingFundo = await ctx.prisma.fundoInvestimento.findUnique({
        where: { id: input.id },
      });

      if (!existingFundo || existingFundo.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment fund not found",
        });
      }

      await ctx.prisma.fundoInvestimento.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Atualizar apenas o valor atual (para atualizações manuais frequentes)
  updateCurrentValue: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        currentValue: z.number().min(0, "Current value must be non-negative"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se o fundo pertence ao usuário
      const existingFundo = await ctx.prisma.fundoInvestimento.findUnique({
        where: { id: input.id },
      });

      if (!existingFundo || existingFundo.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment fund not found",
        });
      }

      const fundo = await ctx.prisma.fundoInvestimento.update({
        where: { id: input.id },
        data: { 
          currentValue: input.currentValue,
          updatedAt: new Date(),
        },
      });

      const rentabilidade = ((fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber()) / fundo.initialInvestment.toNumber()) * 100;
      const ganhoPerda = fundo.currentValue.toNumber() - fundo.initialInvestment.toNumber();

      return {
        ...fundo,
        rentabilidade,
        ganhoPerda,
        initialInvestment: fundo.initialInvestment.toNumber(),
        currentValue: fundo.currentValue.toNumber(),
      };
    }),

  // Obter estatísticas gerais dos fundos
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const fundos = await ctx.prisma.fundoInvestimento.findMany({
      where: {
        userId: ctx.session.userId,
      },
    });

    if (fundos.length === 0) {
      return {
        totalInvestido: 0,
        valorAtual: 0,
        ganhoPerda: 0,
        rentabilidadeMedia: 0,
        quantidadeFundos: 0,
      };
    }

    const totalInvestido = fundos.reduce((sum, fundo) => sum + fundo.initialInvestment.toNumber(), 0);
    const valorAtual = fundos.reduce((sum, fundo) => sum + fundo.currentValue.toNumber(), 0);
    const ganhoPerda = valorAtual - totalInvestido;
    const rentabilidadeMedia = (ganhoPerda / totalInvestido) * 100;

    return {
      totalInvestido,
      valorAtual,
      ganhoPerda,
      rentabilidadeMedia,
      quantidadeFundos: fundos.length,
    };
  }),

  // Obter índices disponíveis para associação
  getAvailableIndices: protectedProcedure.query(async ({ ctx }) => {
    const indices = await ctx.prisma.ativo.findMany({
      where: {
        type: "Fixed Income",
      },
      select: {
        id: true,
        ticker: true,
        name: true,
        type: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return indices;
  }),
});