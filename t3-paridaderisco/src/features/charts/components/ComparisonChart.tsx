"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MultiAssetComparison, ChartConfig, TimeRange, MultiAssetData } from "../types/charts";
import { formatPercentageChange } from "../utils/calculations";

interface ComparisonChartProps {
  data: MultiAssetComparison;
  timeRange: TimeRange;
  config?: Partial<ChartConfig>;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
    payload: any;
  }>;
  label?: string | number;
}

// Cores predefinidas para os ativos com melhor contraste
const CHART_COLORS = [
  "#1d4ed8", // blue-700
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // violet-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#c026d3", // fuchsia-600
  "#374151", // gray-700
  "#047857", // emerald-700
  "#b45309", // amber-700
];

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (active && payload && payload.length > 0) {
    // Safely parse the date with validation
    let formattedDate = "Data inválida";
    try {
      if (label && typeof label === "string") {
        const date = parseISO(label);
        if (isValid(date)) {
          formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        }
      }
    } catch (error) {
      console.warn("Error parsing date in tooltip:", error, "Label:", label);
    }

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md max-w-sm">
        <p className="font-medium text-foreground mb-2">{formattedDate}</p>
        
        <div className="space-y-1">
          {payload
            .sort((a, b) => b.value - a.value) // Ordenar por valor decrescente
            .map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.dataKey}:
                  </span>
                </div>
                <span 
                  className={`text-sm font-medium ${
                    entry.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatPercentageChange(entry.value)}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
};

const formatXAxisLabel = (dateString: string, timeRange: TimeRange): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    
    switch (timeRange) {
      case "30d":
      case "90d":
        return format(date, "dd/MM", { locale: ptBR });
      case "365d":
      case "1y":
        return format(date, "MMM", { locale: ptBR });
      case "3y":
      case "5y":
        return format(date, "MMM/yy", { locale: ptBR });
      default:
        return format(date, "dd/MM", { locale: ptBR });
    }
  } catch (error) {
    console.warn("Error formatting X-axis date:", error, "Date string:", dateString);
    return dateString;
  }
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  data,
  timeRange,
  config = {},
  className = "",
}) => {
  const {
    height = 400,
    margin = { top: 20, right: 30, left: 20, bottom: 20 },
    showGrid = true,
    showTooltip = true,
    showLegend = true,
    responsive = true,
  } = config;

  // Estado para controlar visibilidade das linhas
  const [hiddenAssets, setHiddenAssets] = useState<Set<string>>(new Set());

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data.data || data.data.length === 0) return [];
    
    // Criar um mapa de todas as datas únicas
    const allDates = new Set<string>();
    data.data.forEach(assetData => {
      assetData.data.forEach(point => allDates.add(point.date));
    });
    
    // Ordenar datas
    const sortedDates = Array.from(allDates).sort();
    
    // Criar dados combinados
    return sortedDates.map(date => {
      const point: Record<string, any> = { 
        date,
        formattedDate: formatXAxisLabel(date, timeRange) 
      };
      
      // Adicionar dados de cada ativo
      data.data.forEach(assetData => {
        const dataPoint = assetData.data.find(p => p.date === date);
        point[assetData.asset.ticker] = dataPoint?.value || null;
      });
      
      return point;
    });
  }, [data.data, timeRange]);

  // Obter cores dos ativos
  const getAssetColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

  // Handler para toggle da legenda
  const handleLegendClick = (dataKey: string) => {
    setHiddenAssets(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(dataKey)) {
        newHidden.delete(dataKey);
      } else {
        newHidden.add(dataKey);
      }
      return newHidden;
    });
  };

  // Loading state
  if (!data.data || data.data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-${height} ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium">Sem dados disponíveis</div>
          <div className="text-sm">Selecione ativos para visualizar a comparação</div>
        </div>
      </div>
    );
  }

  const ChartComponent = (
    <LineChart
      width={responsive ? undefined : 800}
      height={height}
      data={chartData}
      margin={margin}
    >
      {showGrid && (
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e5e7eb"
          strokeOpacity={0.6}
          vertical={false}
          horizontalPoints={[0, 20, 40, 60, 80, 100]}
        />
      )}

      <XAxis
        dataKey="formattedDate"
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: "#64748b" }}
        tickMargin={10}
        interval="preserveStartEnd"
        minTickGap={50}
      />

      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 12, fill: "#64748b" }}
        tickFormatter={(value) => `${value.toFixed(2)}%`}
        width={60}
        domain={['auto', 'auto']}
        scale="linear"
        allowDataOverflow={false}
      />
      
      {showTooltip && (
        <Tooltip
          content={(props) => <CustomTooltip {...props} />}
          cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
      )}
      
      {/* Linha de referência no zero */}
      <ReferenceLine 
        y={0} 
        stroke="#64748b" 
        strokeDasharray="2 2" 
        strokeWidth={1}
      />

      {/* Legenda customizada */}
      {showLegend && (
        <Legend 
          content={(props) => (
            <div className="flex flex-wrap gap-2 justify-center mt-6 mb-2">
              {data.data.map((assetData, index) => {
                const isHidden = hiddenAssets.has(assetData.asset.ticker);
                const color = getAssetColor(index);
                
                return (
                  <button
                    key={assetData.asset.ticker}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isHidden 
                        ? 'bg-muted/50 text-muted-foreground border border-muted' 
                        : 'bg-background border border-border text-foreground hover:bg-muted/30 shadow-sm'
                    }`}
                    onClick={() => handleLegendClick(assetData.asset.ticker)}
                  >
                    <div 
                      className={`w-3 h-3 rounded-full border ${isHidden ? 'opacity-30' : 'border-white/20'}`}
                      style={{ backgroundColor: color }}
                    />
                    <span className={isHidden ? 'line-through opacity-60' : ''}>
                      {assetData.asset.ticker}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
      )}
      
      {/* Linhas dos ativos */}
      {data.data.map((assetData, index) => {
        const color = getAssetColor(index);
        const isHidden = hiddenAssets.has(assetData.asset.ticker);
        
        return (
          <Line
            key={assetData.asset.ticker}
            type="monotone"
            dataKey={assetData.asset.ticker}
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            hide={isHidden}
            activeDot={{ 
              r: 4, 
              fill: color,
              stroke: "#fff",
              strokeWidth: 2
            }}
          />
        );
      })}
    </LineChart>
  );

  if (responsive) {
    return (
      <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={300}>
          {ChartComponent}
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className={className}>{ChartComponent}</div>;
};