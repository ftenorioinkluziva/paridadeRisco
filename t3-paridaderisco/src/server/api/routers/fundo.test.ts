import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { fundoRouter } from './fundo';
import { createTRPCMsw } from 'msw-trpc';
import { type AppRouter } from '../root';

// Mock do contexto
const createMockContext = (userId?: string) => ({
  prisma: {
    fundoInvestimento: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  session: userId ? {
    user: { id: userId },
  } : null,
});

describe('FundoRouter', () => {
  const mockUserId = 'test-user-id';
  
  describe('list', () => {
    it('should return user funds with calculated profitability', async () => {
      const mockFunds = [
        {
          id: 'fund-1',
          name: 'Test Fund 1',
          initialInvestment: { toNumber: () => 10000 },
          currentValue: { toNumber: () => 11000 },
          investmentDate: new Date('2023-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
        {
          id: 'fund-2',
          name: 'Test Fund 2',
          initialInvestment: { toNumber: () => 5000 },
          currentValue: { toNumber: () => 4800 },
          investmentDate: new Date('2023-02-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findMany.mockResolvedValue(mockFunds);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'fund-1',
        name: 'Test Fund 1',
        initialInvestment: 10000,
        currentValue: 11000,
        rentabilidade: 10,
        ganhoPerda: 1000,
      });
      expect(result[1]).toMatchObject({
        id: 'fund-2',
        name: 'Test Fund 2',
        initialInvestment: 5000,
        currentValue: 4800,
        rentabilidade: -4,
        ganhoPerda: -200,
      });
    });

    it('should return empty array when user has no funds', async () => {
      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findMany.mockResolvedValue([]);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.list();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new fund with correct data', async () => {
      const mockFund = {
        id: 'new-fund-id',
        name: 'New Fund',
        initialInvestment: { toNumber: () => 8000 },
        currentValue: { toNumber: () => 8500 },
        investmentDate: new Date('2023-03-01'),
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.create.mockResolvedValue(mockFund);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.create({
        name: 'New Fund',
        initialInvestment: 8000,
        currentValue: 8500,
        investmentDate: new Date('2023-03-01'),
      });

      expect(result).toMatchObject({
        id: 'new-fund-id',
        name: 'New Fund',
        initialInvestment: 8000,
        currentValue: 8500,
        rentabilidade: 6.25,
        ganhoPerda: 500,
      });

      expect(ctx.prisma.fundoInvestimento.create).toHaveBeenCalledWith({
        data: {
          name: 'New Fund',
          initialInvestment: 8000,
          currentValue: 8500,
          investmentDate: new Date('2023-03-01'),
          userId: mockUserId,
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return correct statistics for multiple funds', async () => {
      const mockFunds = [
        {
          id: 'fund-1',
          initialInvestment: { toNumber: () => 10000 },
          currentValue: { toNumber: () => 11000 },
          userId: mockUserId,
        },
        {
          id: 'fund-2',
          initialInvestment: { toNumber: () => 5000 },
          currentValue: { toNumber: () => 4800 },
          userId: mockUserId,
        },
      ];

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findMany.mockResolvedValue(mockFunds);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.getStats();

      expect(result).toMatchObject({
        totalInvestido: 15000,
        valorAtual: 15800,
        ganhoPerda: 800,
        rentabilidadeMedia: 5.333333333333334,
        quantidadeFundos: 2,
      });
    });

    it('should return zero stats when no funds exist', async () => {
      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findMany.mockResolvedValue([]);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.getStats();

      expect(result).toMatchObject({
        totalInvestido: 0,
        valorAtual: 0,
        ganhoPerda: 0,
        rentabilidadeMedia: 0,
        quantidadeFundos: 0,
      });
    });
  });

  describe('updateCurrentValue', () => {
    it('should update fund current value and return updated data', async () => {
      const existingFund = {
        id: 'fund-1',
        name: 'Test Fund',
        initialInvestment: { toNumber: () => 10000 },
        currentValue: { toNumber: () => 10000 },
        userId: mockUserId,
      };

      const updatedFund = {
        ...existingFund,
        currentValue: { toNumber: () => 12000 },
        updatedAt: new Date(),
      };

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findUnique.mockResolvedValue(existingFund);
      ctx.prisma.fundoInvestimento.update.mockResolvedValue(updatedFund);

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.updateCurrentValue({
        id: 'fund-1',
        currentValue: 12000,
      });

      expect(result).toMatchObject({
        id: 'fund-1',
        currentValue: 12000,
        rentabilidade: 20,
        ganhoPerda: 2000,
      });

      expect(ctx.prisma.fundoInvestimento.update).toHaveBeenCalledWith({
        where: { id: 'fund-1' },
        data: { 
          currentValue: 12000,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when fund does not exist', async () => {
      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findUnique.mockResolvedValue(null);

      const caller = fundoRouter.createCaller(ctx);

      await expect(
        caller.updateCurrentValue({
          id: 'non-existent-fund',
          currentValue: 12000,
        })
      ).rejects.toThrow('Investment fund not found');
    });

    it('should throw error when fund belongs to different user', async () => {
      const existingFund = {
        id: 'fund-1',
        userId: 'different-user-id',
      };

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findUnique.mockResolvedValue(existingFund);

      const caller = fundoRouter.createCaller(ctx);

      await expect(
        caller.updateCurrentValue({
          id: 'fund-1',
          currentValue: 12000,
        })
      ).rejects.toThrow('Investment fund not found');
    });
  });

  describe('delete', () => {
    it('should delete fund when user owns it', async () => {
      const existingFund = {
        id: 'fund-1',
        userId: mockUserId,
      };

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findUnique.mockResolvedValue(existingFund);
      ctx.prisma.fundoInvestimento.delete.mockResolvedValue({});

      const caller = fundoRouter.createCaller(ctx);
      const result = await caller.delete({ id: 'fund-1' });

      expect(result).toEqual({ success: true });
      expect(ctx.prisma.fundoInvestimento.delete).toHaveBeenCalledWith({
        where: { id: 'fund-1' },
      });
    });

    it('should throw error when trying to delete non-owned fund', async () => {
      const existingFund = {
        id: 'fund-1',
        userId: 'different-user-id',
      };

      const ctx = createMockContext(mockUserId);
      ctx.prisma.fundoInvestimento.findUnique.mockResolvedValue(existingFund);

      const caller = fundoRouter.createCaller(ctx);

      await expect(caller.delete({ id: 'fund-1' })).rejects.toThrow(
        'Investment fund not found'
      );
    });
  });
});