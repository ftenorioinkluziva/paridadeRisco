"use client";

export const dynamic = "force-dynamic";

import { PortfolioManager } from "~/features/portfolio/PortfolioManager";

export default function PortfolioPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PortfolioManager />
    </div>
  );
}