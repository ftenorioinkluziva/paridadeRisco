import { render, screen } from "@testing-library/react";
import { MainNav } from "./MainNav";

// Mock usePathname hook
jest.mock("next/navigation", () => ({
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

  it("applies correct classes", () => {
    const { container } = render(<MainNav />);
    const nav = container.querySelector("nav");
    
    expect(nav).toHaveClass("flex", "items-center", "space-x-4", "lg:space-x-6");
  });
});