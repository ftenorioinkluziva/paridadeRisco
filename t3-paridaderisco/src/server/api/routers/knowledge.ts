import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { processTextForEmbedding } from "~/lib/ai/embeddings";
import { findRelevantContent } from "~/lib/ai/similarity";
import { ResourceCategory } from "@prisma/client";

export const knowledgeRouter = createTRPCRouter({
  /**
   * Listar todos os recursos da base de conhecimento
   */
  list: protectedProcedure
    .input(
      z.object({
        category: z.nativeEnum(ResourceCategory).optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = input?.category ? { category: input.category } : {};

      const [resources, total] = await Promise.all([
        ctx.prisma.resource.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input?.limit ?? 20,
          skip: input?.offset ?? 0,
          include: {
            _count: {
              select: { embeddings: true },
            },
          },
        }),
        ctx.prisma.resource.count({ where }),
      ]);

      return {
        resources,
        total,
      };
    }),

  /**
   * Obter um recurso específico por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const resource = await ctx.prisma.resource.findUnique({
        where: { id: input.id },
        include: {
          embeddings: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      return resource;
    }),

  /**
   * Adicionar novo recurso à base de conhecimento
   * Automaticamente processa o texto e gera embeddings
   */
  add: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Título é obrigatório"),
        content: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
        category: z.nativeEnum(ResourceCategory),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se já existe recurso similar (evitar duplicatas)
        const similarResources = await ctx.prisma.resource.findMany({
          where: {
            title: {
              contains: input.title,
              mode: 'insensitive',
            },
          },
          take: 1,
        });

        if (similarResources.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um recurso com título similar",
          });
        }

        // Criar o recurso
        const resource = await ctx.prisma.resource.create({
          data: {
            title: input.title,
            content: input.content,
            category: input.category,
          },
        });

        // Processar texto: chunking + embeddings
        const chunksWithEmbeddings = await processTextForEmbedding(input.content, {
          maxChunkSize: 1000,
          overlap: 100,
        });

        // Salvar embeddings no banco usando raw SQL (tipos Unsupported não funcionam com Prisma)
        for (const chunk of chunksWithEmbeddings) {
          await ctx.prisma.$executeRaw`
            INSERT INTO "Embedding" (id, "resourceId", content, embedding)
            VALUES (
              gen_random_uuid()::text,
              ${resource.id},
              ${chunk.content},
              ${`[${chunk.embedding.join(',')}]`}::vector
            )
          `;
        }

        return {
          ...resource,
          embeddingsCount: chunksWithEmbeddings.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error adding resource:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao adicionar recurso. Verifique sua API key da OpenAI.",
        });
      }
    }),

  /**
   * Atualizar um recurso existente
   * Re-processa embeddings se o conteúdo foi alterado
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        content: z.string().min(10).optional(),
        category: z.nativeEnum(ResourceCategory).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existingResource = await ctx.prisma.resource.findUnique({
        where: { id },
      });

      if (!existingResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      try {
        // Se o conteúdo foi alterado, reprocessar embeddings
        if (data.content && data.content !== existingResource.content) {
          // Deletar embeddings antigos
          await ctx.prisma.embedding.deleteMany({
            where: { resourceId: id },
          });

          // Gerar novos embeddings
          const chunksWithEmbeddings = await processTextForEmbedding(data.content, {
            maxChunkSize: 1000,
            overlap: 100,
          });

          // Salvar novos embeddings usando raw SQL
          for (const chunk of chunksWithEmbeddings) {
            await ctx.prisma.$executeRaw`
              INSERT INTO "Embedding" (id, "resourceId", content, embedding)
              VALUES (
                gen_random_uuid()::text,
                ${id},
                ${chunk.content},
                ${`[${chunk.embedding.join(',')}]`}::vector
              )
            `;
          }
        }

        // Atualizar o recurso
        const updatedResource = await ctx.prisma.resource.update({
          where: { id },
          data,
          include: {
            _count: {
              select: { embeddings: true },
            },
          },
        });

        return updatedResource;
      } catch (error) {
        console.error('Error updating resource:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar recurso",
        });
      }
    }),

  /**
   * Deletar um recurso (cascata deleta embeddings automaticamente)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.prisma.resource.findUnique({
        where: { id: input.id },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        });
      }

      await ctx.prisma.resource.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Buscar conhecimento relevante (usado pelo chat)
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(10).optional(),
        category: z.nativeEnum(ResourceCategory).optional(),
      })
    )
    .query(async ({ input }) => {
      const results = await findRelevantContent(input.query, {
        limit: input.limit ?? 4,
        similarityThreshold: 0.5,
        category: input.category,
      });

      return results;
    }),

  /**
   * Obter estatísticas da base de conhecimento
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [totalResources, totalEmbeddings, resourcesByCategory] = await Promise.all([
      ctx.prisma.resource.count(),
      ctx.prisma.embedding.count(),
      ctx.prisma.resource.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    return {
      totalResources,
      totalEmbeddings,
      avgEmbeddingsPerResource: totalResources > 0
        ? Math.round(totalEmbeddings / totalResources)
        : 0,
      byCategory: resourcesByCategory.map(item => ({
        category: item.category,
        count: item._count,
      })),
    };
  }),
});
