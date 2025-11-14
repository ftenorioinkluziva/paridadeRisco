/**
 * Utility functions for calculating price-related metrics
 * These functions calculate percentage changes dynamically instead of storing them in the database
 */

/**
 * Calcula a variação percentual entre dois preços
 * @param previousPrice Preço anterior
 * @param currentPrice Preço atual
 * @returns Variação percentual (ex: 2.5 para 2.5%) ou null se inválido
 *
 * @example
 * calculatePercentageChange(100, 105) // returns 5
 * calculatePercentageChange(100, 95) // returns -5
 * calculatePercentageChange(null, 100) // returns null
 * calculatePercentageChange(0, 100) // returns null (evita divisão por zero)
 */
export function calculatePercentageChange(
  previousPrice: number | null,
  currentPrice: number | null
): number | null {
  // Validações
  if (
    previousPrice === null ||
    currentPrice === null ||
    previousPrice === 0
  ) {
    return null;
  }

  // Fórmula: ((valorAtual - valorAnterior) / valorAnterior) * 100
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Adiciona percentageChange calculado a um array de dados históricos ordenados por data
 * O primeiro elemento sempre terá percentageChange = null (não há preço anterior)
 *
 * @param data Array de dados com price (deve estar ordenado por data ascendente)
 * @returns Array com percentageChange calculado para cada elemento
 *
 * @example
 * const data = [
 *   { date: new Date('2024-01-01'), price: 100 },
 *   { date: new Date('2024-01-02'), price: 105 },
 *   { date: new Date('2024-01-03'), price: 102 },
 * ];
 * const result = addPercentageChangeToData(data);
 * // result[0].percentageChange === null
 * // result[1].percentageChange === 5
 * // result[2].percentageChange === -2.857...
 */
export function addPercentageChangeToData<T extends { price: number | null }>(
  data: T[]
): (T & { percentageChange: number | null })[] {
  if (data.length === 0) return [];

  return data.map((item, index) => {
    // Primeiro elemento não tem preço anterior
    if (index === 0) {
      return { ...item, percentageChange: null };
    }

    const previousPrice = data[index - 1]?.price ?? null;
    const percentageChange = calculatePercentageChange(previousPrice, item.price);

    return { ...item, percentageChange };
  });
}

/**
 * Calcula percentageChange para dados de múltiplos ativos
 * Agrupa por ativoId e calcula percentageChange dentro de cada grupo
 * Útil para cestas de investimento e comparações multi-asset
 *
 * @param data Array de dados com price e ativoId
 * @returns Array com percentageChange calculado por ativo
 *
 * @example
 * const data = [
 *   { ativoId: 'BTC', date: '2024-01-01', price: 100 },
 *   { ativoId: 'ETH', date: '2024-01-01', price: 50 },
 *   { ativoId: 'BTC', date: '2024-01-02', price: 105 },
 *   { ativoId: 'ETH', date: '2024-01-02', price: 52 },
 * ];
 * const result = addPercentageChangeByAsset(data);
 * // BTC primeiro elemento: percentageChange = null
 * // BTC segundo elemento: percentageChange = 5
 * // ETH primeiro elemento: percentageChange = null
 * // ETH segundo elemento: percentageChange = 4
 */
export function addPercentageChangeByAsset<T extends { price: number | null; ativoId: string }>(
  data: T[]
): (T & { percentageChange: number | null })[] {
  if (data.length === 0) return [];

  // Agrupar por ativo
  const byAsset = data.reduce((acc, item) => {
    if (!acc[item.ativoId]) {
      acc[item.ativoId] = [];
    }
    acc[item.ativoId].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  // Calcular percentageChange por ativo
  const result: (T & { percentageChange: number | null })[] = [];

  for (const ativoId in byAsset) {
    const assetData = byAsset[ativoId];
    const withPercentage = addPercentageChangeToData(assetData);
    result.push(...withPercentage);
  }

  return result;
}

/**
 * Calcula o retorno acumulado entre dois pontos
 * Útil para calcular retorno total de um período
 *
 * @param startPrice Preço inicial
 * @param endPrice Preço final
 * @returns Retorno percentual acumulado
 *
 * @example
 * calculateCumulativeReturn(100, 150) // returns 50
 * calculateCumulativeReturn(150, 100) // returns -33.33...
 */
export function calculateCumulativeReturn(
  startPrice: number | null,
  endPrice: number | null
): number | null {
  return calculatePercentageChange(startPrice, endPrice);
}

/**
 * Calcula retorno anualizado a partir de um retorno total e número de dias
 * Fórmula: ((1 + retornoTotal)^(365/dias) - 1) * 100
 *
 * @param totalReturn Retorno total em percentual (ex: 50 para 50%)
 * @param days Número de dias do período
 * @returns Retorno anualizado em percentual
 *
 * @example
 * calculateAnnualizedReturn(10, 365) // returns ~10 (10% em 1 ano = 10% a.a.)
 * calculateAnnualizedReturn(10, 182.5) // returns ~20.25 (10% em 6 meses = ~20% a.a.)
 */
export function calculateAnnualizedReturn(
  totalReturn: number,
  days: number
): number {
  if (days <= 0) return 0;

  const returnDecimal = totalReturn / 100;
  const annualizedReturn = Math.pow(1 + returnDecimal, 365 / days) - 1;

  return annualizedReturn * 100;
}

/**
 * Converte Decimal do Prisma para number, tratando null
 * @param value Valor Decimal do Prisma ou null
 * @returns number ou null
 */
export function decimalToNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

/**
 * Converte array de objetos com Decimal para number
 * Útil após queries do Prisma
 *
 * @param data Array de objetos com campo price do tipo Decimal
 * @returns Array com price convertido para number
 */
export function convertPriceArrayToNumber<T extends { price: any }>(
  data: T[]
): (Omit<T, 'price'> & { price: number | null })[] {
  return data.map(item => ({
    ...item,
    price: decimalToNumber(item.price),
  }));
}

/**
 * Calcula índice acumulado a partir de taxas percentuais
 * Usado para ativos do tipo Index com calculationType PERCENTUAL (CDI, IPCA, etc.)
 *
 * Fórmula: índice_atual = índice_anterior * (1 + taxa/100)
 * Começa com índice base de 100
 *
 * @param data Array de dados com price representando taxa percentual
 * @param baseIndex Índice inicial (default: 100)
 * @returns Array com índice acumulado calculado
 *
 * @example
 * const rates = [
 *   { date: '2024-01-01', price: 0.5 },  // 0.5% ao dia
 *   { date: '2024-01-02', price: 0.5 },  // 0.5% ao dia
 * ];
 * const result = calculateAccumulatedIndexFromRates(rates);
 * // result[0] = { ..., accumulatedIndex: 100.5 }
 * // result[1] = { ..., accumulatedIndex: 101.0025 }
 */
export function calculateAccumulatedIndexFromRates<T extends { price: number | null }>(
  data: T[],
  baseIndex: number = 100
): (T & { accumulatedIndex: number })[] {
  if (data.length === 0) return [];

  let currentIndex = baseIndex;

  return data.map((item, index) => {
    // Se não há taxa (price é null), mantém o índice anterior
    if (item.price === null || item.price === undefined) {
      return { ...item, accumulatedIndex: currentIndex };
    }

    // Para o primeiro item, aplica a taxa ao índice base
    // Para os demais, aplica ao índice acumulado anterior
    if (index === 0) {
      currentIndex = baseIndex * (1 + item.price / 100);
    } else {
      currentIndex = currentIndex * (1 + item.price / 100);
    }

    return { ...item, accumulatedIndex: currentIndex };
  });
}

/**
 * Calcula retorno normalizado a partir do índice acumulado
 * Converte índice acumulado em retorno percentual em relação ao índice base
 *
 * @param data Array de dados com accumulatedIndex
 * @param baseIndex Índice inicial (default: 100)
 * @returns Array com retorno normalizado
 *
 * @example
 * const indexed = [
 *   { accumulatedIndex: 100.5 },
 *   { accumulatedIndex: 101.0 },
 * ];
 * const result = calculateNormalizedReturnFromIndex(indexed, 100);
 * // result[0] = { ..., normalizedReturn: 0.5 }
 * // result[1] = { ..., normalizedReturn: 1.0 }
 */
export function calculateNormalizedReturnFromIndex<T extends { accumulatedIndex: number }>(
  data: T[],
  baseIndex: number = 100
): (T & { normalizedReturn: number })[] {
  return data.map(item => ({
    ...item,
    normalizedReturn: ((item.accumulatedIndex - baseIndex) / baseIndex) * 100
  }));
}
