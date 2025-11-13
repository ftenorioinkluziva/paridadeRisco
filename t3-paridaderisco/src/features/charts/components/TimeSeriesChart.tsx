"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TimeSeriesData, ChartConfig, TimeRange } from "../types/charts";
import { formatPercentageChange, formatCurrency } from "../utils/calculations";

interface TimeSeriesChartProps {
  data: TimeSeriesData;
  timeRange: TimeRange;
  config?: Partial<ChartConfig>;
  className?: string;
  enableZoom?: boolean;
  enableBrush?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    value: number;
    payload: {
      date: string;
      value: number;
      rawPrice?: number;
      percentageChange?: number;
    };
  }>;
  label?: string | number;
  isNormalized?: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label,
  isNormalized = false 
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0]?.payload;
    
    if (!data) return null;
    
    // Safely parse the date with validation
    let formattedDate = "Data inválida";
    try {
      if (data.date && typeof data.date === "string") {
        const date = parseISO(data.date);
        if (isValid(date)) {
          formattedDate = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        }
      }
    } catch (error) {
      console.warn("Error parsing date in tooltip:", error, "Date:", data.date);
      formattedDate = "Data inválida";
    }

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium text-foreground">{formattedDate}</p>
        
        {isNormalized ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Retorno: </span>
            <span className={`font-medium ${data.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentageChange(data.value)}
            </span>
          </p>
        ) : (
          <p className="text-sm">
            <span className="text-muted-foreground">Preço: </span>
            <span className="font-medium">
              {formatCurrency(data.value)}
            </span>
          </p>
        )}
        
        {data.percentageChange !== undefined && (
          <p className="text-sm">
            <span className="text-muted-foreground">Variação: </span>
            <span className={`font-medium ${data.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentageChange(data.percentageChange)}
            </span>
          </p>
        )}
        
        {data.rawPrice && isNormalized && (
          <p className="text-xs text-muted-foreground">
            Preço: {formatCurrency(data.rawPrice)}
          </p>
        )}
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

const formatYAxisLabel = (value: number, isNormalized: boolean): string => {
  if (isNormalized) {
    return `${value.toFixed(2)}%`;
  }

  // Para valores monetários grandes, usar formato compacto
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(2)}k`;
  }

  return `R$ ${value.toFixed(2)}`;
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = React.memo(({
  data,
  timeRange,
  config = {},
  className = "",
  enableZoom = true,
  enableBrush = true,
}) => {
  const [zoomDomain, setZoomDomain] = React.useState<[number, number] | undefined>();
  const {
    height = 400,
    margin = { top: 20, right: 30, left: 20, bottom: 20 },
    colors = ["#2563eb"],
    showGrid = true,
    showTooltip = true,
    responsive = true,
  } = config;

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data.data || data.data.length === 0) return [];
    
    console.log('🔍 Chart Data Debug:', {
      dataLength: data.data.length,
      firstDataPoint: data.data[0],
      isNormalized: data.isNormalized,
      sampleValues: data.data.slice(0, 3).map(p => ({ date: p.date, value: p.value }))
    });
    
    return data.data.map(point => ({
      ...point,
      formattedDate: formatXAxisLabel(point.date, timeRange),
    }));
  }, [data.data, timeRange]);

  // Determinar cor da linha baseada na performance
  const lineColor = useMemo(() => {
    if (chartData.length === 0) return colors[0];
    
    const firstValue = chartData[0]?.value || 0;
    const lastValue = chartData[chartData.length - 1]?.value || 0;
    
    if (data.isNormalized) {
      return lastValue >= 0 ? "#059669" : "#dc2626"; // green-600 ou red-600
    }
    
    return lastValue >= firstValue ? "#059669" : "#dc2626";
  }, [chartData, colors, data.isNormalized]);

  // Handlers para zoom
  const handleZoom = (domain: any) => {
    if (enableZoom && domain) {
      setZoomDomain([domain.startIndex || 0, domain.endIndex || chartData.length - 1]);
    }
  };

  const resetZoom = () => {
    setZoomDomain(undefined);
  };

  // Loading state
  if (!data.data || data.data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium">Sem dados disponíveis</div>
          <div className="text-sm">Selecione um ativo para visualizar o gráfico</div>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('🚀 TimeSeriesChart render:', {
    hasData: !!data.data,
    dataLength: data.data.length,
    chartDataLength: chartData.length,
    height,
    responsive,
    className
  });

  if (responsive) {
    return (
      <div className={`w-full overflow-hidden relative ${className}`} style={{ height }}>
        {/* Reset zoom button */}
        {enableZoom && zoomDomain && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs bg-background border rounded shadow-sm hover:bg-muted transition-colors"
            >
              Reset Zoom
            </button>
          </div>
        )}
        
        <ResponsiveContainer width="100%" height="100%" minWidth={300}>
          <LineChart
            data={chartData}
            margin={margin}
            onMouseDown={enableZoom ? handleZoom : undefined}
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
              domain={zoomDomain ? ['dataMin', 'dataMax'] : ['dataMin', 'dataMax']}
            />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(value) => formatYAxisLabel(value, data.isNormalized || false)}
              width={60}
              domain={['auto', 'auto']}
              scale="linear"
              allowDataOverflow={false}
            />
            
            {showTooltip && (
              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} isNormalized={data.isNormalized} />
                )}
                cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: "4 4" }}
                animationDuration={150}
              />
            )}
            
            {/* Linha de referência no zero para gráficos normalizados */}
            {data.isNormalized && (
              <ReferenceLine 
                y={0} 
                stroke="#64748b" 
                strokeDasharray="2 2" 
                strokeWidth={1}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: lineColor,
                stroke: "#fff",
                strokeWidth: 2
              }}
              animationDuration={300}
              animationEasing="ease-out"
            />
            
            {/* Brush para seleção de intervalo */}
            {enableBrush && chartData.length > 20 && (
              <Brush
                dataKey="formattedDate"
                height={30}
                stroke={lineColor}
                fill="rgba(37, 99, 235, 0.1)"
                onChange={handleZoom}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        {/* Reset zoom button */}
        {enableZoom && zoomDomain && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-xs bg-background border rounded shadow-sm hover:bg-muted transition-colors"
            >
              Reset Zoom
            </button>
          </div>
        )}
        
        <LineChart
          width={800}
          height={height}
          data={chartData}
          margin={margin}
          onMouseDown={enableZoom ? handleZoom : undefined}
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
            domain={zoomDomain ? ['dataMin', 'dataMax'] : ['dataMin', 'dataMax']}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => formatYAxisLabel(value, data.isNormalized || false)}
            width={60}
            domain={['auto', 'auto']}
            scale="linear"
            allowDataOverflow={false}
          />
          
          {showTooltip && (
            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} isNormalized={data.isNormalized} />
              )}
              cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: "4 4" }}
              animationDuration={150}
            />
          )}
          
          {/* Linha de referência no zero para gráficos normalizados */}
          {data.isNormalized && (
            <ReferenceLine 
              y={0} 
              stroke="#64748b" 
              strokeDasharray="2 2" 
              strokeWidth={1}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: lineColor,
              stroke: "#fff",
              strokeWidth: 2
            }}
            animationDuration={300}
            animationEasing="ease-out"
          />
          
          {/* Brush para seleção de intervalo */}
          {enableBrush && chartData.length > 20 && (
            <Brush
              dataKey="formattedDate"
              height={30}
              stroke={lineColor}
              fill="rgba(37, 99, 235, 0.1)"
              onChange={handleZoom}
            />
          )}
        </LineChart>
      </div>
    </div>
  );
});