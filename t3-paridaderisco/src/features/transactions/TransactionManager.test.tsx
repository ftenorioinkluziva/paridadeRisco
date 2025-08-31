import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionManager } from "./TransactionManager";

// Mock data
const mockAssets = [
  {
    id: "1",
    name: "Test ETF",
    ticker: "TEST11",
    type: "ETF",
    dadosHistoricos: [{ price: 50.00 }],
  },
  {
    id: "2",
    name: "Another Asset",
    ticker: "ANOT11",
    type: "STOCK",
    dadosHistoricos: [{ price: 25.50 }],
  },
];

const mockTransactions = [
  {
    id: "1",
    type: "COMPRA",
    shares: 100,
    pricePerShare: 50,
    date: new Date("2024-01-15"),
    ativo: { ticker: "TEST11", name: "Test ETF" },
  },
];

const mockPortfolio = {
  id: "1",
  cashBalance: 10000,
  userId: "user1",
};

const mockAddTransaction = vi.fn();

vi.mock("~/lib/api", () => ({
  api: {
    asset: {
      list: {
        useQuery: () => ({
          data: mockAssets,
          isLoading: false,
        }),
      },
    },
    portfolio: {
      addTransaction: {
        useMutation: () => ({
          mutate: mockAddTransaction,
          isPending: false,
          error: null,
        }),
      },
      listTransactions: {
        useQuery: () => ({
          data: mockTransactions,
          isLoading: false,
        }),
      },
      get: {
        useQuery: () => ({
          data: mockPortfolio,
          isLoading: false,
        }),
      },
    },
  },
}));

describe("TransactionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders transaction form", () => {
    render(<TransactionManager />);
    
    expect(screen.getByText("Gerenciamento de Transações")).toBeInTheDocument();
    expect(screen.getByText("Nova Transação")).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de transação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preço por ação/i)).toBeInTheDocument();
  });

  it("shows transaction history", () => {
    render(<TransactionManager />);
    
    expect(screen.getByText("Histórico de Transações")).toBeInTheDocument();
    expect(screen.getByText("TEST11")).toBeInTheDocument();
    expect(screen.getByText("COMPRA")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
  });

  it("displays current cash balance", () => {
    render(<TransactionManager />);
    
    expect(screen.getByText("Saldo Atual")).toBeInTheDocument();
    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<TransactionManager />);
    
    const submitButton = screen.getByRole("button", { name: /executar transação/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/selecione um ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/quantidade é obrigatória/i)).toBeInTheDocument();
    expect(screen.getByText(/preço é obrigatório/i)).toBeInTheDocument();
  });

  it("submits valid transaction", async () => {
    const user = userEvent.setup();
    render(<TransactionManager />);
    
    // Fill out the form
    const assetSelect = screen.getByRole("combobox", { name: /ativo/i });
    const quantityInput = screen.getByLabelText(/quantidade/i);
    const priceInput = screen.getByLabelText(/preço por ação/i);
    const submitButton = screen.getByRole("button", { name: /executar transação/i });

    await user.selectOptions(assetSelect, "1");
    await user.type(quantityInput, "50");
    await user.type(priceInput, "45.50");
    await user.click(submitButton);

    expect(mockAddTransaction).toHaveBeenCalledWith({
      type: "COMPRA",
      ativoId: "1",
      shares: 50,
      pricePerShare: 45.50,
    });
  });

  it("calculates transaction value", async () => {
    const user = userEvent.setup();
    render(<TransactionManager />);
    
    const quantityInput = screen.getByLabelText(/quantidade/i);
    const priceInput = screen.getByLabelText(/preço por ação/i);

    await user.type(quantityInput, "100");
    await user.type(priceInput, "25.50");

    expect(screen.getByText("R$ 2.550,00")).toBeInTheDocument();
  });

  it("switches between transaction types", async () => {
    const user = userEvent.setup();
    render(<TransactionManager />);
    
    const typeSelect = screen.getByLabelText(/tipo de transação/i);
    await user.selectOptions(typeSelect, "VENDA");

    expect(screen.getByDisplayValue("VENDA")).toBeInTheDocument();
  });

  it("filters assets in dropdown", async () => {
    const user = userEvent.setup();
    render(<TransactionManager />);
    
    const assetSelect = screen.getByRole("combobox", { name: /ativo/i });
    
    // Check if both assets are available
    expect(screen.getByText("TEST11 - Test ETF")).toBeInTheDocument();
    expect(screen.getByText("ANOT11 - Another Asset")).toBeInTheDocument();
  });
});