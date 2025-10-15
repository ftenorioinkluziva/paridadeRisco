import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

// Mock Next.js router
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock tRPC
const mockLogin = vi.fn();
vi.mock("~/lib/api", () => ({
  api: {
    auth: {
      login: {
        useMutation: () => ({
          mutate: mockLogin,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />);
    
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    const submitButtons = screen.getAllByRole("button", { name: /entrar/i });
    expect(submitButtons.length).toBeGreaterThan(0);
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const submitButtons = screen.getAllByRole("button", { name: /entrar/i });
    await user.click(submitButtons[0]);
    
    expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    expect(screen.getByText(/senha deve ter pelo menos/i)).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(({ onSuccess }) => {
      onSuccess({ token: "fake-token", user: { id: "1", name: "Test User" } });
    });

    render(<LoginPage />);
    
    const emailInputs = screen.getAllByLabelText(/email/i);
    const passwordInputs = screen.getAllByLabelText(/senha/i);
    const submitButtons = screen.getAllByRole("button", { name: /entrar/i });
    
    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];
    const submitButton = submitButtons[0];

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows register link", () => {
    render(<LoginPage />);
    
    const registerLinks = screen.getAllByRole("link", { name: /cadastre-se/i });
    expect(registerLinks[0]).toHaveAttribute("href", "/register");
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const emailInputs = screen.getAllByLabelText(/email/i);
    const submitButtons = screen.getAllByRole("button", { name: /entrar/i });

    await user.type(emailInputs[0], "invalid-email");
    await user.click(submitButtons[0]);

    const errorMessages = screen.getAllByText(/email inválido/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });
});