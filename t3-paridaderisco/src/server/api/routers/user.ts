import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        selectedBasketId: true,
        dataNascimento: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Validate that selectedBasketId exists and belongs to user
    if (user.selectedBasketId) {
      const basket = await ctx.prisma.cesta.findFirst({
        where: {
          id: user.selectedBasketId,
          userId: ctx.session.userId,
        },
      });

      // If basket no longer exists or doesn't belong to user, clear it
      if (!basket) {
        await ctx.prisma.user.update({
          where: { id: ctx.session.userId },
          data: { selectedBasketId: null },
        });
        user.selectedBasketId = null;
      }
    }

    return user;
  }),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório").optional(),
        email: z.string().email("Email inválido").optional(),
        phone: z.string().min(1, "Telefone é obrigatório").optional(),
        image: z.string().nullable().optional(),
        selectedBasketId: z.string().nullable().optional(),
        dataNascimento: z.string().nullable().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword, ...updateData } = input;

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Senha atual é obrigatória para alterar a senha",
          });
        }

        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado",
          });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        (updateData as any).password = hashedPassword;
      }

      // Check if email is already taken by another user
      if (input.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser && existingUser.id !== ctx.session.userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está em uso",
          });
        }
      }

      // Convert dataNascimento string to Date if provided
      if (input.dataNascimento !== undefined) {
        (updateData as any).dataNascimento = input.dataNascimento ? new Date(input.dataNascimento) : null;
      }

      // Update user
      const updatedUser = await ctx.prisma.user.update({
        where: { id: ctx.session.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          selectedBasketId: true,
          dataNascimento: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    }),
});
