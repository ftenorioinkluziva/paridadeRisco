import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRouter } from "./auth";

// Mock dependencies
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");
vi.mock("~/env", () => ({
  env: {
    NEXTAUTH_SECRET: "test-secret",
  },
}));

const mockBcrypt = vi.mocked(bcrypt);
const mockJwt = vi.mocked(jwt);

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

// Create caller for testing
const createCaller = () => {
  const caller = authRouter.createCaller({
    session: null,
    prisma: mockPrisma as any,
  });
  return caller;
};

describe("authRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const caller = createCaller();
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "123456789",
        password: "password123",
      };

      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock password hashing
      mockBcrypt.hash.mockResolvedValue("hashed-password");

      // Mock user creation
      const createdUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        phone: "123456789",
        createdAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      // Mock JWT generation
      mockJwt.sign.mockReturnValue("test-token");

      const result = await caller.register(userData);

      expect(result).toEqual({
        user: createdUser,
        token: "test-token",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: "hashed-password",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: "user-123" },
        "test-secret",
        { expiresIn: "24h" },
      );
    });

    it("should throw error if user already exists", async () => {
      const caller = createCaller();
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "123456789",
        password: "password123",
      };

      // Mock user already exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: "john@example.com",
      });

      await expect(caller.register(userData)).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        }),
      );
    });

    it("should validate input data", async () => {
      const caller = createCaller();

      // Test invalid email
      await expect(
        caller.register({
          name: "John Doe",
          email: "invalid-email",
          phone: "123456789",
          password: "password123",
        }),
      ).rejects.toThrow();

      // Test short password
      await expect(
        caller.register({
          name: "John Doe",
          email: "john@example.com",
          phone: "123456789",
          password: "short",
        }),
      ).rejects.toThrow();

      // Test missing name
      await expect(
        caller.register({
          name: "",
          email: "john@example.com",
          phone: "123456789",
          password: "password123",
        }),
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("should login user with valid credentials", async () => {
      const caller = createCaller();
      const loginData = {
        email: "john@example.com",
        password: "password123",
      };

      const existingUser = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        phone: "123456789",
        password: "hashed-password",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      // Mock password comparison
      mockBcrypt.compare.mockResolvedValue(true);

      // Mock JWT generation
      mockJwt.sign.mockReturnValue("test-token");

      const result = await caller.login(loginData);

      expect(result).toEqual({
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          createdAt: existingUser.createdAt,
        },
        token: "test-token",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        existingUser.password,
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: "user-123" },
        "test-secret",
        { expiresIn: "24h" },
      );
    });

    it("should throw error if user doesn't exist", async () => {
      const caller = createCaller();
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      // Mock user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(caller.login(loginData)).rejects.toThrow(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        }),
      );
    });

    it("should throw error if password is invalid", async () => {
      const caller = createCaller();
      const loginData = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      const existingUser = {
        id: "user-123",
        email: "john@example.com",
        password: "hashed-password",
      };

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      // Mock password comparison fails
      mockBcrypt.compare.mockResolvedValue(false);

      await expect(caller.login(loginData)).rejects.toThrow(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        }),
      );
    });

    it("should validate login input", async () => {
      const caller = createCaller();

      // Test invalid email
      await expect(
        caller.login({
          email: "invalid-email",
          password: "password123",
        }),
      ).rejects.toThrow();

      // Test empty password
      await expect(
        caller.login({
          email: "john@example.com",
          password: "",
        }),
      ).rejects.toThrow();
    });
  });
});