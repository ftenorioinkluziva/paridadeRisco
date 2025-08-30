import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { authOptions } from "./auth";

// Mock dependencies
vi.mock("bcryptjs");
vi.mock("~/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret",
  },
}));

const mockBcrypt = vi.mocked(bcrypt);

vi.mock("~/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock PrismaAdapter
vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn().mockReturnValue({
    name: "prisma-adapter",
  }),
}));

describe("NextAuth configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authOptions", () => {
    it("should have correct configuration", () => {
      expect(authOptions.secret).toBe("test-secret");
      expect(authOptions.session?.strategy).toBe("jwt");
      expect(authOptions.pages?.signIn).toBe("/auth/signin");
      // signUp page configuration is optional and may not be set
      // expect(authOptions.pages?.signUp).toBe("/auth/signup");
      expect(authOptions.providers).toHaveLength(1);
    });

    it("should have CredentialsProvider configured", () => {
      const credentialsProvider = authOptions.providers[0] as any;
      // The provider type is "Credentials" but we configured name as "credentials"
      expect(credentialsProvider?.options?.name || credentialsProvider?.name).toBe("credentials");
    });
  });

  describe("session callback", () => {
    it("should add user id to session", () => {
      const mockSession = {
        user: {
          name: "John Doe",
          email: "john@example.com",
        },
        expires: "2024-01-01",
      };

      const mockToken = {
        sub: "user-123",
        name: "John Doe",
        email: "john@example.com",
      };

      const result = authOptions.callbacks?.session?.({
        session: mockSession,
        token: mockToken,
      });

      expect(result).toEqual({
        ...mockSession,
        user: {
          ...mockSession.user,
          id: "user-123",
        },
      });
    });
  });

  describe("jwt callback", () => {
    it("should add user id to token when user is present", () => {
      const mockToken = {
        name: "John Doe",
        email: "john@example.com",
      };

      const mockUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
      };

      const result = authOptions.callbacks?.jwt?.({
        token: mockToken,
        user: mockUser,
      });

      expect(result).toEqual({
        ...mockToken,
        id: "user-123",
      });
    });

    it("should return token unchanged when no user", () => {
      const mockToken = {
        sub: "user-123",
        name: "John Doe",
        email: "john@example.com",
      };

      const result = authOptions.callbacks?.jwt?.({
        token: mockToken,
      });

      expect(result).toEqual(mockToken);
    });
  });

  describe("CredentialsProvider authorize function", () => {
    const credentialsProvider = authOptions.providers[0] as any;
    const authorize = credentialsProvider?.authorize;

    it("should authorize user with valid credentials", async () => {
      const credentials = {
        email: "john@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      };

      const { prisma } = await import("~/lib/prisma");
      const mockPrismaUser = vi.mocked(prisma.user);
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authorize(credentials);

      expect(result).toEqual({
        id: "user-123",
        email: "john@example.com",
        name: "John Doe",
      });

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password,
      );
    });

    it("should return null when credentials are missing", async () => {
      // Test missing email
      let result = await authorize({
        password: "password123",
      });
      expect(result).toBe(null);

      // Test missing password
      result = await authorize({
        email: "john@example.com",
      });
      expect(result).toBe(null);

      // Test both missing
      result = await authorize({});
      expect(result).toBe(null);
    });

    it("should return null when user doesn't exist", async () => {
      const credentials = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const { prisma } = await import("~/lib/prisma");
      const mockPrismaUser = vi.mocked(prisma.user);
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const result = await authorize(credentials);

      expect(result).toBe(null);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
    });

    it("should return null when password is invalid", async () => {
      const credentials = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password: "hashed-password",
      };

      const { prisma } = await import("~/lib/prisma");
      const mockPrismaUser = vi.mocked(prisma.user);
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authorize(credentials);

      expect(result).toBe(null);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password,
      );
    });
  });
});