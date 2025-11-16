"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface Asset {
  rank: number;
  ticker: string;
  name: string;
  performance: number;
  value: string;
}

interface AssetRankingProps {
  assets: Asset[];
  title: string;
  newCount?: number;
}

export function AssetRanking({ assets, title, newCount }: AssetRankingProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              {title}
            </CardTitle>
          </div>
          {newCount && newCount > 0 && (
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
              {newCount} NEW
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assets.map((asset) => (
            <div
              key={asset.rank}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  {asset.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{asset.ticker}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {asset.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Badge variant="default" className="font-mono text-sm">
                    {asset.value}
                  </Badge>
                  <div
                    className={cn(
                      "text-xs font-medium flex items-center gap-1 justify-end mt-1",
                      asset.performance >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {asset.performance >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {asset.performance >= 0 ? "+" : ""}
                    {asset.performance.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
