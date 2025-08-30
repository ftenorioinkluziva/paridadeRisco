import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cestaRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.session;

    return await ctx.prisma.cesta.findMany({
      where: { userId },
      include: {
        ativos: {
          include: {
            ativo: {
              include: {
                dadosHistoricos: {
                  orderBy: { date: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const cesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          ativos: {
            include: {
              ativo: {
                include: {
                  dadosHistoricos: {
                    orderBy: { date: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!cesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Calculate total target percentage to validate basket
      const totalPercentage = cesta.ativos.reduce(
        (sum, ativoEmCesta) => sum + Number(ativoEmCesta.targetPercentage),
        0
      );

      return {
        ...cesta,
        totalPercentage,
        isValid: Math.abs(totalPercentage - 100) < 0.01, // Allow for small floating point errors
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        ativos: z.array(
          z.object({
            ativoId: z.string(),
            targetPercentage: z.number().min(0).max(100),
          }),
        ).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Validate that total percentages add up to 100%
      const totalPercentage = input.ativos.reduce((sum, ativo) => sum + ativo.targetPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Target percentages must add up to 100%. Current total: ${totalPercentage}%`,
        });
      }

      // Validate that all assets exist
      const ativoIds = input.ativos.map(a => a.ativoId);
      const existingAtivos = await ctx.prisma.ativo.findMany({
        where: {
          id: {
            in: ativoIds,
          },
        },
        select: { id: true },
      });

      if (existingAtivos.length !== ativoIds.length) {
        const existingIds = new Set(existingAtivos.map(a => a.id));
        const missingIds = ativoIds.filter(id => !existingIds.has(id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid asset IDs: ${missingIds.join(", ")}`,
        });
      }

      // Check for duplicate asset IDs
      const uniqueIds = new Set(ativoIds);
      if (uniqueIds.size !== ativoIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate assets are not allowed in a basket",
        });
      }

      // Create the basket with atomic transaction
      const cesta = await ctx.prisma.$transaction(async (prisma) => {
        // Create the basket
        const newCesta = await prisma.cesta.create({
          data: {
            name: input.name,
            userId,
          },
        });

        // Create the asset allocations
        await prisma.ativosEmCestas.createMany({
          data: input.ativos.map((ativo) => ({
            cestaId: newCesta.id,
            ativoId: ativo.ativoId,
            targetPercentage: ativo.targetPercentage,
          })),
        });

        // Return the complete basket with its assets
        return await prisma.cesta.findUniqueOrThrow({
          where: { id: newCesta.id },
          include: {
            ativos: {
              include: {
                ativo: {
                  include: {
                    dadosHistoricos: {
                      orderBy: { date: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });
      });

      return cesta;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        ativos: z.array(
          z.object({
            ativoId: z.string(),
            targetPercentage: z.number().min(0).max(100),
          }),
        ).min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // If updating assets, validate percentages and assets
      if (input.ativos) {
        const totalPercentage = input.ativos.reduce((sum, ativo) => sum + ativo.targetPercentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Target percentages must add up to 100%. Current total: ${totalPercentage}%`,
          });
        }

        const ativoIds = input.ativos.map(a => a.ativoId);
        const existingAtivos = await ctx.prisma.ativo.findMany({
          where: {
            id: { in: ativoIds },
          },
          select: { id: true },
        });

        if (existingAtivos.length !== ativoIds.length) {
          const existingIds = new Set(existingAtivos.map(a => a.id));
          const missingIds = ativoIds.filter(id => !existingIds.has(id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid asset IDs: ${missingIds.join(", ")}`,
          });
        }

        const uniqueIds = new Set(ativoIds);
        if (uniqueIds.size !== ativoIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate assets are not allowed in a basket",
          });
        }
      }

      // Update basket with transaction
      const updatedCesta = await ctx.prisma.$transaction(async (prisma) => {
        // Update basket name if provided
        if (input.name) {
          await prisma.cesta.update({
            where: { id: input.id },
            data: { name: input.name },
          });
        }

        // Update assets if provided
        if (input.ativos) {
          // Delete existing asset allocations
          await prisma.ativosEmCestas.deleteMany({
            where: { cestaId: input.id },
          });

          // Create new asset allocations
          await prisma.ativosEmCestas.createMany({
            data: input.ativos.map((ativo) => ({
              cestaId: input.id,
              ativoId: ativo.ativoId,
              targetPercentage: ativo.targetPercentage,
            })),
          });
        }

        // Return updated basket
        return await prisma.cesta.findUniqueOrThrow({
          where: { id: input.id },
          include: {
            ativos: {
              include: {
                ativo: {
                  include: {
                    dadosHistoricos: {
                      orderBy: { date: "desc" },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });
      });

      return updatedCesta;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      // Verify basket exists and is owned by user
      const existingCesta = await ctx.prisma.cesta.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingCesta) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Basket not found or not owned by user",
        });
      }

      // Delete basket (cascading delete will handle AtivosEmCestas)
      await ctx.prisma.cesta.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});