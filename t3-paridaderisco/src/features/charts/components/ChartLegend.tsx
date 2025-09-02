"use client";

import React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import type { Asset } from "../types/charts";
import { formatPercentageChange } from "../utils/calculations";

interface ChartLegendProps {
  assets: Asset[];
  colors: string[];
  hiddenAssets: Set<string>;
  onToggleAsset: (assetId: string) => void;
  showStats?: boolean;
  assetStats?: Record<string, {
    currentValue?: number;
    totalReturn?: number;
    isPositive?: boolean;
  }>;
  className?: string;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  assets,
  colors,
  hiddenAssets,
  onToggleAsset,
  showStats = false,
  assetStats = {},
  className = "",
}) => {
  const getAssetColor = (index: number) => colors[index % colors.length];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controles globais */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">
          Ativos ({assets.length})
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Mostrar todos
              assets.forEach(asset => {
                if (hiddenAssets.has(asset.ticker)) {
                  onToggleAsset(asset.ticker);
                }
              });
            }}
            disabled={hiddenAssets.size === 0}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Mostrar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Ocultar todos
              assets.forEach(asset => {
                if (!hiddenAssets.has(asset.ticker)) {
                  onToggleAsset(asset.ticker);
                }
              });
            }}
            disabled={hiddenAssets.size === assets.length}
            className="text-xs"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Ocultar Todos
          </Button>
        </div>
      </div>

      {/* Lista de ativos */}
      <div className="space-y-2">
        {assets.map((asset, index) => {
          const isHidden = hiddenAssets.has(asset.ticker);
          const color = getAssetColor(index);
          const stats = assetStats[asset.ticker];
          
          return (
            <div
              key={asset.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isHidden 
                  ? 'bg-muted/30 border-muted' 
                  : 'bg-background border-border hover:bg-muted/50'
              }`}
            >
              {/* Informações do ativo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAsset(asset.ticker)}
                  className="flex items-center gap-2 text-left"
                >
                  <div 
                    className={`w-3 h-3 rounded-full transition-opacity ${
                      isHidden ? 'opacity-30' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className={`font-medium text-sm ${
                      isHidden ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {asset.ticker}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {asset.name}
                    </div>
                  </div>
                </button>
                
                <Badge variant="outline" className="text-xs">
                  {asset.type}
                </Badge>
              </div>

              {/* Estatísticas (opcional) */}
              {showStats && stats && (
                <div className="flex items-center gap-4">
                  {stats.currentValue !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Atual</div>
                      <div className="text-sm font-medium">
                        R$ {stats.currentValue.toFixed(2)}
                      </div>
                    </div>
                  )}
                  
                  {stats.totalReturn !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Retorno</div>
                      <div className={`text-sm font-medium ${
                        stats.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentageChange(stats.totalReturn)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleAsset(asset.ticker)}
                className="ml-2 h-8 w-8 p-0"
              >
                {isHidden ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t">
        {hiddenAssets.size === 0 
          ? `Todos os ${assets.length} ativos visíveis`
          : `${assets.length - hiddenAssets.size} de ${assets.length} ativos visíveis`
        }
      </div>
    </div>
  );
};