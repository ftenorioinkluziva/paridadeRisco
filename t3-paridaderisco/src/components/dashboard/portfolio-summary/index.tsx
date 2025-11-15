import React from "react";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface PortfolioSummaryProps {
  summary: {
    totalInvested: number;
    currentValue: number;
    fundsValue: number;
    totalGain: number;
    totalGainPercentage: number;
    numberOfAssets: number;
  };
}

export default function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const summaryItems = [
    {
      label: "Custo Total Investido",
      value: formatCurrency(summary.totalInvested),
      color: "text-foreground",
    },
    {
      label: "Valor Atual das Posições",
      value: formatCurrency(summary.currentValue),
      color: "text-foreground",
    },
    {
      label: "Valor dos Fundos",
      value: formatCurrency(summary.fundsValue),
      color: "text-foreground",
    },
    {
      label: "Ganho/Perda Total",
      value: formatCurrency(summary.totalGain),
      color: summary.totalGain >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Número de Ativos",
      value: summary.numberOfAssets.toString(),
      color: "text-foreground",
    },
  ];

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Métricas principais do portfólio
      </h3>
      <div className="space-y-4">
        {summaryItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-lg"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className={cn("text-sm font-bold", item.color)}>{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
