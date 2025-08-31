import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { setupServer } from "msw/node";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { api } from "~/lib/api";
import superjson from "superjson";
import type { AppRouter } from "~/server/api/root";

// Mock server setup for tRPC integration testing
const trpcMsw = createTRPCMsw<AppRouter>();
const server = setupServer();

// Test client setup
function createTestClient() {
  return api.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}

describe("Authentication Integration", () => {
  let queryClient: QueryClient;
  let trpcClient: ReturnType<typeof createTestClient>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    trpcClient = createTestClient();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
    queryClient.clear();
  });

  it("should register user with valid data", async () => {
    // Mock successful registration
    server.use(
      trpcMsw.auth.register.mutation((req, res, ctx) => {
        const { name, email, phone, password } = req.body;
        
        if (email === "test@example.com" && password && name && phone) {
          return res(
            ctx.status(200),
            ctx.data({
              success: true,
              user: {
                id: "1",
                name,
                email,
                phone,
              },
            })
          );
        }
        
        return res(
          ctx.status(400),
          ctx.json({ message: "Validation error" })
        );
      })
    );

    const mutation = trpcClient.auth.register.useMutation();
    
    const result = await new Promise((resolve, reject) => {
      mutation.mutate(
        {
          name: "Test User",
          email: "test@example.com", 
          phone: "11999999999",
          password: "password123",
        },
        {
          onSuccess: resolve,
          onError: reject,
        }
      );
    });

    expect(result).toEqual({
      success: true,
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        phone: "11999999999",
      },
    });
  });

  it("should login user with valid credentials", async () => {
    // Mock successful login
    server.use(
      trpcMsw.auth.login.mutation((req, res, ctx) => {
        const { email, password } = req.body;
        
        if (email === "test@example.com" && password === "password123") {
          return res(
            ctx.status(200),
            ctx.data({
              token: "mock-jwt-token",
              user: {
                id: "1",
                name: "Test User",
                email: "test@example.com",
              },
            })
          );
        }
        
        return res(
          ctx.status(401),
          ctx.json({ message: "Invalid credentials" })
        );
      })
    );

    const mutation = trpcClient.auth.login.useMutation();
    
    const result = await new Promise((resolve, reject) => {
      mutation.mutate(
        {
          email: "test@example.com",
          password: "password123",
        },
        {
          onSuccess: resolve,
          onError: reject,
        }
      );
    });

    expect(result).toEqual({
      token: "mock-jwt-token",
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
      },
    });
  });

  it("should reject invalid login credentials", async () => {
    // Mock failed login
    server.use(
      trpcMsw.auth.login.mutation((req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ message: "Invalid credentials" })
        );
      })
    );

    const mutation = trpcClient.auth.login.useMutation();
    
    await expect(
      new Promise((resolve, reject) => {
        mutation.mutate(
          {
            email: "wrong@example.com",
            password: "wrongpassword",
          },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      })
    ).rejects.toThrow();
  });
});