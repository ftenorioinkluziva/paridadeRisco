import React from "react";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

interface Asset {
  id: string;
  ticker: string;
  name: string;
  percentage: number;
  currentValue: number;
  gain: number;
  type: "stock" | "crypto" | "fund" | "etf";
}

interface PortfolioAssetsProps {
  assets: Asset[];
}

export default function PortfolioAssets({ assets }: PortfolioAssetsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getAssetTypeColor = (type: string) => {
    const colors = {
      stock: "text-blue-400",
      crypto: "text-purple-400",
      fund: "text-green-400",
      etf: "text-orange-400",
    };
    return colors[type as keyof typeof colors] || "text-gray-400";
  };

  return (
    <Card className="p-6 bg-card border border-border/50">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Distribuição percentual do portfólio
      </h3>
      <div className="space-y-6">
        {assets.map((asset) => (
          <div key={asset.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <span className={cn("text-sm font-bold", getAssetTypeColor(asset.type))}>
                    {asset.ticker}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {asset.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {asset.percentage}%
                </p>
                <p className="text-xs font-medium text-foreground">
                  {formatCurrency(asset.currentValue)}
                </p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    asset.gain >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {formatCurrency(asset.gain)}
                </p>
              </div>
            </div>
            <Progress value={asset.percentage} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
}
