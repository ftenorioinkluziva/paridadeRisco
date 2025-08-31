"use client";

export const dynamic = "force-dynamic";

import { TransactionManager } from "~/features/transactions/TransactionManager";

export default function TransactionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TransactionManager />
    </div>
  );
}