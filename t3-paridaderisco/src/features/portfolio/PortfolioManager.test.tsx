import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioManager } from "./PortfolioManager";
import * as apiModule from "~/lib/api";

// Mock tRPC
const mockPortfolioData = {
  id: "1",
  cashBalance: 10000,
  userId: "user1",
  totalValue: 15500,
  positions: [
    {
      id: "1",
      ativoId: "asset1",
      shares: 100,
      averagePrice: 50,
      currentPrice: 55,
      totalCost: 5000,
      currentValue: 5500,
      unrealizedGain: 500,
      ativo: {
        id: "asset1",
        name: "Test Asset",
        ticker: "TEST",
        type: "ETF",
      },
    },
  ],
};

const mockTransactions = [
  {
    id: "1",
    type: "COMPRA",
    shares: 100,
    pricePerShare: 50,
    date: new Date("2024-01-01"),
    ativo: { ticker: "TEST", name: "Test Asset" },
  },
];

// Mock the API
vi.mock("~/lib/api", () => ({
  api: {
    portfolio: {
      get: {
        useQuery: vi.fn(),
      },
      listTransactions: {
        useQuery: vi.fn(),
      },
      getRebalancePlan: {
        useMutation: vi.fn(),
      },
    },
    asset: {
      list: {
        useQuery: vi.fn(),
      },
    },
    cesta: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe("PortfolioManager", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    
    // Set default mock implementations using the imported module
    const api = vi.mocked(apiModule.api);
    api.portfolio.get.useQuery.mockReturnValue({
      data: mockPortfolioData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    
    api.portfolio.listTransactions.useQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    
    api.portfolio.getRebalancePlan.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: null,
      error: null,
    });
    
    api.asset.list.useQuery.mockReturnValue({
      data: [
        {
          id: "asset1",
          name: "Test Asset",
          ticker: "TEST",
          type: "ETF",
        },
      ],
      isLoading: false,
    });
    
    api.cesta.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
  });

  it("renders portfolio overview", () => {
    render(<PortfolioManager />);
    
    expect(screen.getByText("Gerenciamento de Portfolio")).toBeInTheDocument();
    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument(); // Cash balance
    expect(screen.getByText("TEST")).toBeInTheDocument(); // Asset ticker
  });

  it("shows portfolio tabs", () => {
    render(<PortfolioManager />);
    
    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("Transações")).toBeInTheDocument();
    expect(screen.getByText("Rebalanceamento")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("calculates portfolio metrics correctly", () => {
    render(<PortfolioManager />);
    
    // Check key display values are shown
    expect(screen.getByText("R$ 15.500,00")).toBeInTheDocument(); // Total value
    expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument(); // Cash balance
    expect(screen.getByText("1 ativos")).toBeInTheDocument(); // Number of assets
    
    // Check that gain/loss appears (using getAllBy since it appears multiple times)
    const gains = screen.getAllByText("R$ 500,00");
    expect(gains.length).toBeGreaterThan(0);
    
    // Just check that the component rendered basic portfolio data
    expect(screen.getByText("TEST")).toBeInTheDocument(); // Asset ticker
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    render(<PortfolioManager />);
    
    const transactionsTab = screen.getByText("Transações");
    await user.click(transactionsTab);
    
    expect(screen.getByText("Histórico de Transações")).toBeInTheDocument();
    expect(screen.getByText("COMPRA")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    const api = vi.mocked(apiModule.api);
    api.portfolio.get.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<PortfolioManager />);
    
    expect(screen.getByText("Carregando dados do portfolio...")).toBeInTheDocument();
  });

  it("displays error state", () => {
    const api = vi.mocked(apiModule.api);
    api.portfolio.get.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: "Failed to fetch portfolio" },
      refetch: vi.fn(),
    });

    render(<PortfolioManager />);
    
    expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
  });
});