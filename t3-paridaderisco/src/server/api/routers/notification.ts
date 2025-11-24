import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { NotificationType, NotificationPriority } from "@prisma/client";

export const notificationRouter = createTRPCRouter({
  /**
   * Listar notificações do usuário
   */
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().min(1).max(50).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const where = {
        userId,
        ...(input?.unreadOnly ? { read: false } : {}),
      };

      const [notifications, total, unreadCount] = await Promise.all([
        ctx.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input?.limit ?? 20,
          skip: input?.offset ?? 0,
        }),
        ctx.prisma.notification.count({ where }),
        ctx.prisma.notification.count({
          where: { userId, read: false },
        }),
      ]);

      return {
        notifications,
        total,
        unreadCount,
      };
    }),

  /**
   * Marcar notificação como lida
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to mark this notification",
        });
      }

      return await ctx.prisma.notification.update({
        where: { id: input.id },
        data: { read: true },
      });
    }),

  /**
   * Marcar todas as notificações como lidas
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx.session;

      await ctx.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return { success: true };
    }),

  /**
   * Deletar uma notificação
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this notification",
        });
      }

      await ctx.prisma.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Deletar todas as notificações lidas
   */
  deleteAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx.session;

      await ctx.prisma.notification.deleteMany({
        where: { userId, read: true },
      });

      return { success: true };
    }),

  /**
   * Criar notificação (geralmente chamado pelo agente)
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.nativeEnum(NotificationType),
        priority: z.nativeEnum(NotificationPriority),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.notification.create({
        data: input,
      });
    }),

  /**
   * Obter estatísticas de notificações
   */
  stats: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx.session;

      const [total, unread, byType, byPriority] = await Promise.all([
        ctx.prisma.notification.count({ where: { userId } }),
        ctx.prisma.notification.count({ where: { userId, read: false } }),
        ctx.prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: true,
        }),
        ctx.prisma.notification.groupBy({
          by: ['priority'],
          where: { userId, read: false },
          _count: true,
        }),
      ]);

      return {
        total,
        unread,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count,
        })),
        byPriority: byPriority.map(item => ({
          priority: item.priority,
          count: item._count,
        })),
      };
    }),

  /**
   * Obter notificações recentes para o painel Overview
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx.session;

      return await ctx.prisma.notification.findMany({
        where: { userId },
        orderBy: [
          { read: 'asc' }, // Não lidas primeiro
          { createdAt: 'desc' }, // Mais recentes primeiro
        ],
        take: input?.limit ?? 5,
      });
    }),
});
