"use client";

export const dynamic = "force-dynamic";

import { CestaViewer } from "~/features/baskets/CestaViewer";

export default function BasketsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CestaViewer />
    </div>
  );
}