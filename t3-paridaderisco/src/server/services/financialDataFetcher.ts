import axios from "axios";
import { prisma } from "~/lib/prisma";
import { AssetCalculationType } from "@prisma/client";

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        exchangeName: string;
        instrumentType: string;
        firstTradeDate: number;
        regularMarketTime: number;
        gmtoffset: number;
        timezone: string;
        exchangeTimezoneName: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        scale: number;
        priceHint: number;
        currentTradingPeriod: any;
        tradingPeriods: any;
        dataGranularity: string;
        range: string;
        validRanges: string[];
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error?: any;
  };
}

interface BCBResponse {
  value: Array<{
    data: string;
    valor: string;
  }>;
}

interface AssetData {
  ticker: string;
  name: string;
  type: string;
  calculationType: AssetCalculationType;
  currentPrice?: number;
  historicalData: Array<{
    date: Date;
    price: number | null;
    percentageChange: number | null;
  }>;
}

export class FinancialDataFetcher {
  private readonly yahooBaseUrl = "https://query1.finance.yahoo.com/v8/finance/chart";
  private readonly bcbBaseUrl = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
  
  // CDI series code from BCB
  private readonly CDI_SERIES_CODE = 12;

  // Default assets to fetch
  private readonly defaultAssets = [
    { ticker: 'BOVA11.SA', name: 'BOVA11 (Ibovespa)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'XFIX11.SA', name: 'XFIX11 (IFIX)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'IB5M11.SA', name: 'IB5M11 (IMAB5+)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'B5P211.SA', name: 'B5P211 (IMAB5)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'FIXA11.SA', name: 'FIXA11 (Pré)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'USDBRL=X', name: 'USD/BRL (Dólar)', type: 'Currency', calculationType: AssetCalculationType.PRECO },
    { ticker: 'CDI', name: 'CDI', type: 'Index', calculationType: AssetCalculationType.PERCENTUAL },
  ];

  async fetchYahooFinanceData(ticker: string, startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      const now = new Date();
      const start = startDate || new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      const end = endDate || now;

      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      const url = `${this.yahooBaseUrl}/${ticker}`;
      const params = {
        period1: startTimestamp.toString(),
        period2: endTimestamp.toString(),
        interval: '1d',
        events: 'history',
      };

      console.log(`Fetching Yahoo Finance data for ${ticker} from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);

      const response = await axios.get<YahooFinanceResponse>(url, { 
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.data.chart.result || response.data.chart.result.length === 0) {
        console.error(`No data returned for ${ticker}`);
        return null;
      }

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      if (!timestamps || timestamps.length === 0) {
        console.error(`No price data available for ${ticker}`);
        return null;
      }

      const historicalData = [];
      let previousPrice: number | null = null;

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const close = quotes.close[i];
        
        if (timestamp && close !== null && close !== undefined) {
          const date = new Date(timestamp * 1000);
          const price = Number(close);
          
          let percentageChange: number | null = null;
          if (previousPrice !== null && previousPrice !== 0) {
            percentageChange = ((price - previousPrice) / previousPrice) * 100;
          }

          historicalData.push({
            date,
            price,
            percentageChange,
          });

          previousPrice = price;
        }
      }

      // Find asset configuration
      const assetConfig = this.defaultAssets.find(a => a.ticker === ticker);
      if (!assetConfig) {
        console.error(`Unknown asset ticker: ${ticker}`);
        return null;
      }

      return {
        ticker,
        name: assetConfig.name,
        type: assetConfig.type,
        calculationType: assetConfig.calculationType,
        currentPrice: historicalData.length > 0 ? historicalData[historicalData.length - 1].price : undefined,
        historicalData,
      };

    } catch (error) {
      console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
      return null;
    }
  }

  async fetchBCBData(seriesCode: number = this.CDI_SERIES_CODE, startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      const now = new Date();
      const start = startDate || new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      const end = endDate || now;

      const startStr = this.formatDateForBCB(start);
      const endStr = this.formatDateForBCB(end);

      const url = `${this.bcbBaseUrl}/${seriesCode}/dados`;
      const params = {
        formato: 'json',
        dataInicial: startStr,
        dataFinal: endStr,
      };

      console.log(`Fetching BCB data for series ${seriesCode} from ${startStr} to ${endStr}`);

      const response = await axios.get<BCBResponse>(url, { 
        params,
        timeout: 30000,
      });

      if (!response.data.value || response.data.value.length === 0) {
        console.error(`No BCB data returned for series ${seriesCode}`);
        return null;
      }

      const historicalData = [];
      let cumulativeIndex = 100; // Start with base 100
      let previousPrice: number | null = null;

      for (const item of response.data.value) {
        const dateStr = item.data;
        const rateStr = item.valor;

        if (!dateStr || !rateStr) continue;

        const date = new Date(dateStr.split('/').reverse().join('-'));
        const dailyRate = parseFloat(rateStr);

        if (isNaN(dailyRate)) continue;

        // Convert daily rate to cumulative index
        cumulativeIndex = cumulativeIndex * (1 + dailyRate / 100);
        const price = cumulativeIndex;

        let percentageChange: number | null = null;
        if (previousPrice !== null && previousPrice !== 0) {
          percentageChange = ((price - previousPrice) / previousPrice) * 100;
        }

        historicalData.push({
          date,
          price,
          percentageChange,
        });

        previousPrice = price;
      }

      return {
        ticker: 'CDI',
        name: 'CDI',
        type: 'Index',
        calculationType: AssetCalculationType.PERCENTUAL,
        currentPrice: historicalData.length > 0 ? historicalData[historicalData.length - 1].price : undefined,
        historicalData,
      };

    } catch (error) {
      console.error(`Error fetching BCB data for series ${seriesCode}:`, error);
      return null;
    }
  }

  private formatDateForBCB(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }

  async getLastUpdateDate(ticker: string): Promise<Date | null> {
    try {
      const lastRecord = await prisma.dadoHistorico.findFirst({
        where: { ativo: { ticker } },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      return lastRecord?.date || null;
    } catch (error) {
      console.error(`Error getting last update date for ${ticker}:`, error);
      return null;
    }
  }

  async upsertAsset(assetData: AssetData): Promise<void> {
    try {
      // Upsert asset
      const asset = await prisma.ativo.upsert({
        where: { ticker: assetData.ticker },
        update: {
          name: assetData.name,
          type: assetData.type,
          calculationType: assetData.calculationType,
        },
        create: {
          ticker: assetData.ticker,
          name: assetData.name,
          type: assetData.type,
          calculationType: assetData.calculationType,
        },
      });

      // Upsert historical data in batches
      const batchSize = 100;
      const totalBatches = Math.ceil(assetData.historicalData.length / batchSize);

      for (let i = 0; i < assetData.historicalData.length; i += batchSize) {
        const batch = assetData.historicalData.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        console.log(`Processing batch ${batchNumber}/${totalBatches} for ${assetData.ticker}`);

        for (const dataPoint of batch) {
          await prisma.dadoHistorico.upsert({
            where: {
              ativoId_date: {
                ativoId: asset.id,
                date: dataPoint.date,
              },
            },
            update: {
              price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
              percentageChange: dataPoint.percentageChange ? parseFloat(dataPoint.percentageChange.toFixed(4)) : null,
            },
            create: {
              ativoId: asset.id,
              date: dataPoint.date,
              price: dataPoint.price ? parseFloat(dataPoint.price.toFixed(4)) : null,
              percentageChange: dataPoint.percentageChange ? parseFloat(dataPoint.percentageChange.toFixed(4)) : null,
            },
          });
        }
      }

      console.log(`✅ Successfully updated ${assetData.historicalData.length} records for ${assetData.ticker}`);
    } catch (error) {
      console.error(`Error upserting asset data for ${assetData.ticker}:`, error);
      throw error;
    }
  }

  async updateAllAssets(incrementalUpdate = true): Promise<void> {
    console.log('🚀 Starting financial data update...');
    
    for (const assetConfig of this.defaultAssets) {
      try {
        console.log(`\nProcessing ${assetConfig.name} (${assetConfig.ticker})...`);

        let startDate: Date | undefined;
        
        if (incrementalUpdate) {
          const lastUpdate = await this.getLastUpdateDate(assetConfig.ticker);
          if (lastUpdate) {
            startDate = new Date(lastUpdate);
            startDate.setDate(startDate.getDate() + 1); // Start from the day after last update
            
            const now = new Date();
            if (startDate >= now) {
              console.log(`✅ Data for ${assetConfig.name} is already up to date`);
              continue;
            }
          }
        }

        let assetData: AssetData | null;

        if (assetConfig.ticker === 'CDI') {
          assetData = await this.fetchBCBData(this.CDI_SERIES_CODE, startDate);
        } else {
          assetData = await this.fetchYahooFinanceData(assetConfig.ticker, startDate);
        }

        if (assetData && assetData.historicalData.length > 0) {
          await this.upsertAsset(assetData);
        } else {
          console.log(`No new data found for ${assetConfig.ticker}`);
        }

      } catch (error) {
        console.error(`⚠️ Error processing ${assetConfig.ticker}:`, error);
      }
    }

    console.log('\n✅ Financial data update completed!');
  }

  async updateSpecificAsset(ticker: string, startDate?: Date, endDate?: Date): Promise<void> {
    console.log(`🚀 Starting update for ${ticker}...`);

    try {
      let assetData: AssetData | null;

      if (ticker === 'CDI') {
        assetData = await this.fetchBCBData(this.CDI_SERIES_CODE, startDate, endDate);
      } else {
        assetData = await this.fetchYahooFinanceData(ticker, startDate, endDate);
      }

      if (assetData && assetData.historicalData.length > 0) {
        await this.upsertAsset(assetData);
        console.log(`✅ Successfully updated ${ticker}`);
      } else {
        console.log(`No data found for ${ticker}`);
      }

    } catch (error) {
      console.error(`⚠️ Error updating ${ticker}:`, error);
      throw error;
    }
  }
}