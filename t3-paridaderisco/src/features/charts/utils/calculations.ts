import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChartDataPoint, TimeRange } from "../types/charts";

/**
 * Calcula retorno percentual normalizado baseado no primeiro valor
 */
export function calculateNormalizedReturns(data: ChartDataPoint[]): ChartDataPoint[] {
  if (data.length === 0) return [];
  
  const baseValue = data[0]?.rawPrice || data[0]?.value || 0;
  
  if (baseValue === 0) return data;

  return data.map(point => ({
    ...point,
    value: ((point.rawPrice || point.value) - baseValue) / baseValue * 100
  }));
}

/**
 * Converte TimeRange para número de dias
 */
export function timeRangeTodays(timeRange: TimeRange): number {
  const map: Record<TimeRange, number> = {
    "30d": 30,
    "90d": 90,
    "365d": 365,
    "1y": 365,
    "3y": 365 * 3,
    "5y": 365 * 5,
    "custom": 365, // fallback
  };
  
  return map[timeRange];
}

/**
 * Calcula data de início baseada no TimeRange
 */
export function getStartDateFromRange(timeRange: TimeRange, endDate = new Date()): Date {
  const days = timeRangeTodays(timeRange);
  return subDays(endDate, days);
}

/**
 * Formata data para display no gráfico
 */
export function formatDateForChart(dateString: string, timeRange: TimeRange): string {
  const date = parseISO(dateString);
  
  // Formato baseado no range temporal
  switch (timeRange) {
    case "30d":
    case "90d":
      return format(date, "dd/MM", { locale: ptBR });
    case "365d":
    case "1y":
      return format(date, "MMM/yy", { locale: ptBR });
    case "3y":
    case "5y":
      return format(date, "MMM yyyy", { locale: ptBR });
    default:
      return format(date, "dd/MM/yy", { locale: ptBR });
  }
}

/**
 * Calcula estatísticas básicas dos dados
 */
export function calculateStats(data: ChartDataPoint[]) {
  if (data.length === 0) return null;
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const firstValue = values[0] || 0;
  const lastValue = values[values.length - 1] || 0;
  const totalChange = lastValue - firstValue;
  const totalChangePercent = firstValue !== 0 ? (totalChange / firstValue) * 100 : 0;
  
  return {
    min,
    max,
    avg,
    totalChange,
    totalChangePercent,
    dataPoints: data.length,
  };
}

/**
 * Gera cores para múltiplos assets no gráfico
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    "#2563eb", // blue-600
    "#dc2626", // red-600
    "#059669", // emerald-600
    "#d97706", // amber-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#0891b2", // cyan-600
    "#65a30d", // lime-600
  ];
  
  // Se precisar de mais cores, gera variações
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  const colors: string[] = [...baseColors];
  let hue = 0;
  
  while (colors.length < count) {
    colors.push(`hsl(${hue}, 70%, 50%)`);
    hue += 360 / Math.max(count - baseColors.length, 1);
  }
  
  return colors;
}

/**
 * Formata valor para display (com sinal + ou -)
 */
export function formatPercentageChange(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formata valor monetário brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Valida se o range de datas é válido
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate < endDate && endDate <= new Date();
}

/**
 * Interpola dados faltantes (fill gaps)
 */
export function fillDataGaps(data: ChartDataPoint[]): ChartDataPoint[] {
  if (data.length <= 1) return data;
  
  // Ordenar por data para garantir sequência
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const filledData: ChartDataPoint[] = [];
  
  for (let i = 0; i < sortedData.length; i++) {
    filledData.push(sortedData[i]!);
    
    // Se há um gap maior que 1 dia, interpolar
    if (i < sortedData.length - 1) {
      const currentDate = new Date(sortedData[i]!.date);
      const nextDate = new Date(sortedData[i + 1]!.date);
      const daysDiff = Math.floor(
        (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff > 1) {
        // Interpolar valores para dias faltantes
        const currentValue = sortedData[i]!.value;
        const nextValue = sortedData[i + 1]!.value;
        const step = (nextValue - currentValue) / daysDiff;
        
        for (let j = 1; j < daysDiff; j++) {
          const interpolatedDate = new Date(currentDate);
          interpolatedDate.setDate(currentDate.getDate() + j);
          
          filledData.push({
            date: format(interpolatedDate, "yyyy-MM-dd"),
            value: currentValue + (step * j),
            percentageChange: 0, // Interpolar se necessário
          });
        }
      }
    }
  }
  
  return filledData;
}