import { Decimal } from "@prisma/client/runtime/library";

export type PerformancePeriod = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

export interface PeriodDates {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface AssetReturn {
  ativoId: string;
  ticker: string;
  startPrice: number;
  endPrice: number;
  returnPercentage: number;
  allocation: number;
  weightedReturn: number;
}

export interface EvolutionPoint {
  date: Date;
  valor: number;
  valorCDI?: number;
  valorIPCA?: number;
}

export interface BenchmarkComparison {
  nome: string;
  retorno: number;
  diferenca: number;
}

export interface BasketPerformance {
  periodo: PerformancePeriod;
  periodoLabel: string;
  retornoPercentual: number;
  retornoAnualizado: number;
  valorInicial: number;
  valorFinal: number;
  ganhoAbsoluto: number;
  ativosReturns: AssetReturn[];
  temDadosSuficientes: boolean;

  // Novas métricas
  volatilidade: number;
  sharpeRatio: number;
  evolucaoHistorica: EvolutionPoint[];
  benchmarks: BenchmarkComparison[];
}

/**
 * Calcula as datas de início e fim para um período específico
 */
export function getPeriodDates(period: PerformancePeriod, referenceDate: Date = new Date()): PeriodDates {
  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;
  let label: string;

  switch (period) {
    case '1M':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
      label = 'Último mês';
      break;

    case '3M':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 3);
      label = 'Últimos 3 meses';
      break;

    case '6M':
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 6);
      label = 'Últimos 6 meses';
      break;

    case '1Y':
      startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      label = 'Último ano';
      break;

    case 'YTD':
      startDate = new Date(endDate.getFullYear(), 0, 1); // January 1st
      label = 'No ano (YTD)';
      break;

    case 'ALL':
      // Para 'ALL', usaremos uma data muito antiga (será ajustada depois com base nos dados)
      startDate = new Date('2000-01-01');
      label = 'Desde o início';
      break;

    default:
      throw new Error(`Período inválido: ${period}`);
  }

  startDate.setHours(0, 0, 0, 0);

  return {
    startDate,
    endDate,
    label,
  };
}

/**
 * Calcula o retorno anualizado a partir do retorno total e número de dias
 */
export function calculateAnnualizedReturn(totalReturn: number, days: number): number {
  if (days <= 0) return 0;

  const years = days / 365.25;
  if (years === 0) return 0;

  // Fórmula: ((1 + retorno_total) ^ (1 / anos)) - 1
  const annualizedReturn = Math.pow(1 + totalReturn / 100, 1 / years) - 1;
  return annualizedReturn * 100;
}

/**
 * Calcula o número de dias entre duas datas
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula o retorno ponderado da cesta
 */
export function calculateWeightedReturn(assetReturns: AssetReturn[]): number {
  return assetReturns.reduce((sum, asset) => sum + asset.weightedReturn, 0);
}

/**
 * Encontra o preço mais próximo de uma data em um array de dados históricos
 */
export function findClosestPrice(
  historicalData: Array<{ date: Date; price: Decimal | null }>,
  targetDate: Date
): number | null {
  if (!historicalData || historicalData.length === 0) return null;

  // Filtrar dados válidos (com price não-null)
  const validData = historicalData.filter(d => d.price !== null);
  if (validData.length === 0) return null;

  // Ordenar por data
  const sortedData = [...validData].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Se a data alvo é anterior ao primeiro dado, retornar o primeiro preço
  if (targetDate <= sortedData[0]!.date) {
    return sortedData[0]!.price!.toNumber();
  }

  // Se a data alvo é posterior ao último dado, retornar o último preço
  if (targetDate >= sortedData[sortedData.length - 1]!.date) {
    return sortedData[sortedData.length - 1]!.price!.toNumber();
  }

  // Encontrar o dado mais próximo
  let closestIndex = 0;
  let closestDiff = Math.abs(targetDate.getTime() - sortedData[0]!.date.getTime());

  for (let i = 1; i < sortedData.length; i++) {
    const diff = Math.abs(targetDate.getTime() - sortedData[i]!.date.getTime());
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return sortedData[closestIndex]!.price!.toNumber();
}

/**
 * Calcula o retorno de um ativo entre duas datas
 */
export function calculateAssetReturn(
  startPrice: number,
  endPrice: number
): number {
  if (startPrice === 0) return 0;
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * Calcula a volatilidade (desvio padrão) dos retornos
 * Retorna em percentual anualizado
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;

  // Calcular média
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // Calcular variância
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);

  // Desvio padrão (volatilidade)
  const stdDev = Math.sqrt(variance);

  // Anualizar (assumindo retornos diários, multiplicar por sqrt(252) dias úteis)
  // Se retornos forem mensais, multiplicar por sqrt(12)
  // Para simplificar, vamos retornar o desvio padrão direto
  return stdDev;
}

/**
 * Calcula o Sharpe Ratio
 * Formula: (Retorno da Carteira - Taxa Livre de Risco) / Volatilidade
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  riskFreeRate: number,
  volatility: number
): number {
  if (volatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / volatility;
}

/**
 * Calcula retornos periódicos a partir de uma série de preços
 */
export function calculatePeriodicReturns(prices: number[]): number[] {
  const returns: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) {
      const ret = ((prices[i]! - prices[i - 1]!) / prices[i - 1]!) * 100;
      returns.push(ret);
    }
  }

  return returns;
}

/**
 * Agrupa dados históricos em intervalos mensais
 */
export function groupByMonth(data: Array<{ date: Date; value: number }>): Array<{ date: Date; value: number }> {
  const grouped = new Map<string, { date: Date; value: number }>();

  for (const point of data) {
    const monthKey = `${point.date.getFullYear()}-${String(point.date.getMonth() + 1).padStart(2, '0')}`;

    // Pegar o último valor de cada mês
    if (!grouped.has(monthKey) || point.date > grouped.get(monthKey)!.date) {
      grouped.set(monthKey, point);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}
