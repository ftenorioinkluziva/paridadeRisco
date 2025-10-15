import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MainNav } from "./MainNav";

// Mock usePathname hook
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("MainNav", () => {
  it("renders navigation items", () => {
    render(<MainNav />);
    
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Baskets")).toBeInTheDocument();
  });

  it("shows correct navigation links", () => {
    render(<MainNav />);
    
    const links = screen.getAllByRole("link");
    const dashboardLinks = links.filter(link => link.getAttribute("href") === "/dashboard");
    const portfolioLinks = links.filter(link => link.getAttribute("href") === "/portfolio");
    const transactionsLinks = links.filter(link => link.getAttribute("href") === "/transactions");
    const basketsLinks = links.filter(link => link.getAttribute("href") === "/baskets");

    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(portfolioLinks.length).toBeGreaterThan(0);
    expect(transactionsLinks.length).toBeGreaterThan(0);
    expect(basketsLinks.length).toBeGreaterThan(0);
  });

  it("applies correct navigation classes", () => {
    const { container } = render(<MainNav />);
    const nav = container.querySelector("nav");
    
    expect(nav).toHaveClass("flex", "items-center", "space-x-4", "lg:space-x-6");
  });

  it("applies active styles to current route", () => {
    render(<MainNav />);
    
    const links = screen.getAllByRole("link");
    const dashboardLinks = links.filter(link => link.getAttribute("href") === "/dashboard");
    
    // Check if the active styling is applied (component uses text-primary for active)
    expect(dashboardLinks[0]).toHaveClass("text-primary");
  });
});