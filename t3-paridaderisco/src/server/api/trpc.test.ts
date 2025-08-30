import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { createTRPCContext, protectedProcedure } from "./trpc";

// Mock dependencies
vi.mock("jsonwebtoken");
vi.mock("~/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret",
  },
}));

const mockJwt = vi.mocked(jwt);

vi.mock("~/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("tRPC context and procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTRPCContext", () => {
    it("should create context with valid JWT token", async () => {
      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "authorization") return "Bearer valid-token";
            return null;
          }),
        },
      } as any;

      // Mock JWT verification
      mockJwt.verify.mockReturnValue({ userId: "user-123" });

      const context = await createTRPCContext({ req: mockReq, res: {} as any });

      expect(context.session).toEqual({ userId: "user-123" });
      expect(context.prisma).toBeDefined();
      expect(mockJwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    });

    it("should create context without session when no token provided", async () => {
      const mockReq = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as any;

      const context = await createTRPCContext({ req: mockReq, res: {} as any });

      expect(context.session).toBe(null);
      expect(context.prisma).toBeDefined();
    });

    it("should create context without session when invalid token provided", async () => {
      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "authorization") return "Bearer invalid-token";
            return null;
          }),
        },
      } as any;

      // Mock JWT verification to throw error
      mockJwt.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const context = await createTRPCContext({ req: mockReq, res: {} as any });

      expect(context.session).toBe(null);
      expect(context.prisma).toBeDefined();
    });

    it("should handle malformed authorization header", async () => {
      const mockReq = {
        headers: {
          get: vi.fn().mockImplementation((name: string) => {
            if (name === "authorization") return "InvalidFormat";
            return null;
          }),
        },
      } as any;

      const context = await createTRPCContext({ req: mockReq, res: {} as any });

      expect(context.session).toBe(null);
      // JWT verification is still called but fails for malformed header
      expect(mockJwt.verify).toHaveBeenCalledWith("InvalidFormat", "test-secret");
    });
  });

  describe("protectedProcedure", () => {
    it("should allow access with authenticated user", async () => {
      const mockContext = {
        session: { userId: "user-123" },
        prisma: {} as any,
      };

      const mockNext = vi.fn().mockResolvedValue({ ctx: mockContext });
      
      // Test the middleware directly
      const middleware = protectedProcedure._def.middlewares[0];
      const result = await middleware!({
        ctx: mockContext,
        next: mockNext,
        path: "test",
        type: "query",
        input: {},
        rawInput: {},
        meta: undefined,
      });

      expect(result.ctx.session.userId).toBe("user-123");
      // The middleware calls next with modified context (without prisma in the passed context)
      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          session: { userId: "user-123" },
        },
      });
    });

    it("should throw UNAUTHORIZED error when no session", async () => {
      const mockContext = {
        session: null,
        prisma: {} as any,
      };

      const mockNext = vi.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      try {
        await middleware!({
          ctx: mockContext,
          next: mockNext,
          path: "test",
          type: "query",
          input: {},
          rawInput: {},
          meta: undefined,
        });
        // If no error is thrown, fail the test
        expect.fail("Expected TRPCError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      }

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UNAUTHORIZED error when session has no userId", async () => {
      const mockContext = {
        session: { userId: undefined as any },
        prisma: {} as any,
      };

      const mockNext = vi.fn();
      const middleware = protectedProcedure._def.middlewares[0];

      try {
        await middleware!({
          ctx: mockContext,
          next: mockNext,
          path: "test",
          type: "query",
          input: {},
          rawInput: {},
          meta: undefined,
        });
        // If no error is thrown, fail the test
        expect.fail("Expected TRPCError to be thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      }

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});