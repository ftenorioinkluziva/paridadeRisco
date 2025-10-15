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

interface BCBIPCAResponse {
  data: string;
  valor: string;
}

interface IPEADATAResponse {
  value: Array<{
    SERCODIGO: string;
    VALDATA: string; // ISO 8601 date format
    VALVALOR: number;
    NIVNOME: string;
    TERCODIGO: string;
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
  private readonly bcbBaseUrl = "https://www3.bcb.gov.br/sgspub/localizarseries/localizarSeries.do";
  
  // BCB series codes
  private readonly SELIC_SERIES_CODE = 432;
  private readonly CDI_SERIES_CODE = 12;
  private readonly IPCA_SERIES_CODE = 433;
  
  // IPEADATA URLs
  private readonly IPEADATA_BASE_URL = "http://ipeadata.gov.br/api/odata4";

  // Default assets to fetch
  private readonly defaultAssets = [
    { ticker: 'BOVA11.SA', name: 'BOVA11 (Ibovespa)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'XFIX11.SA', name: 'XFIX11 (IFIX)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'IB5M11.SA', name: 'IB5M11 (IMAB5+)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'B5P211.SA', name: 'B5P211 (IMAB5)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'FIXA11.SA', name: 'FIXA11 (Pré)', type: 'ETF', calculationType: AssetCalculationType.PRECO },
    { ticker: 'USDBRL=X', name: 'USD/BRL (Dólar)', type: 'Currency', calculationType: AssetCalculationType.PRECO },
    { ticker: 'CDI', name: 'CDI', type: 'Index', calculationType: AssetCalculationType.PERCENTUAL },
    { ticker: 'IPCA', name: 'IPCA (Inflação)', type: 'Index', calculationType: AssetCalculationType.PERCENTUAL },
    { ticker: 'IPCA_EXP', name: 'IPCA Expectativa 12M', type: 'Index', calculationType: AssetCalculationType.PERCENTUAL },
    { ticker: 'BTC-USD', name: 'Bitcoin', type: 'Crypto', calculationType: AssetCalculationType.PRECO },
    { ticker: 'ETH-USD', name: 'Ethereum', type: 'Crypto', calculationType: AssetCalculationType.PRECO },
    { ticker: 'BNB-USD', name: 'Binance Coin', type: 'Crypto', calculationType: AssetCalculationType.PRECO },
  ];

  async fetchUSDExchangeRate(): Promise<number | null> {
    try {
      const data = await this.fetchYahooFinanceData('USDBRL=X');
      if (data && data.currentPrice) {
        return data.currentPrice;
      }
      return null;
    } catch (error) {
      console.error('Error fetching USD/BRL exchange rate:', error);
      return null;
    }
  }

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

  async fetchCryptoData(ticker: string, startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      console.log(`Fetching cryptocurrency data for ${ticker}...`);

      // 1. Fetch crypto data in USD
      const cryptoDataUSD = await this.fetchYahooFinanceData(ticker, startDate, endDate);
      if (!cryptoDataUSD) {
        console.error(`Failed to fetch crypto data for ${ticker}`);
        return null;
      }

      // 2. Fetch USD/BRL historical data for the same period
      const usdBrlData = await this.fetchYahooFinanceData('USDBRL=X', startDate, endDate);
      if (!usdBrlData) {
        console.error('Failed to fetch USD/BRL exchange rate data');
        return null;
      }

      // 3. Create a map of dates to exchange rates
      const exchangeRateMap = new Map<string, number>();
      for (const dataPoint of usdBrlData.historicalData) {
        const dateKey = dataPoint.date.toISOString().split('T')[0];
        if (dataPoint.price !== null) {
          exchangeRateMap.set(dateKey, dataPoint.price);
        }
      }

      // 4. Convert prices from USD to BRL
      const historicalDataBRL = [];
      let previousPrice: number | null = null;

      for (const dataPoint of cryptoDataUSD.historicalData) {
        const dateKey = dataPoint.date.toISOString().split('T')[0];
        const exchangeRate = exchangeRateMap.get(dateKey);

        if (dataPoint.price !== null && exchangeRate) {
          const priceInBRL = dataPoint.price * exchangeRate;

          let percentageChange: number | null = null;
          if (previousPrice !== null && previousPrice !== 0) {
            percentageChange = ((priceInBRL - previousPrice) / previousPrice) * 100;
          }

          historicalDataBRL.push({
            date: dataPoint.date,
            price: priceInBRL,
            percentageChange,
          });

          previousPrice = priceInBRL;
        }
      }

      // 5. Find asset configuration
      const assetConfig = this.defaultAssets.find(a => a.ticker === ticker);
      if (!assetConfig) {
        console.error(`Unknown crypto ticker: ${ticker}`);
        return null;
      }

      console.log(`Successfully fetched ${historicalDataBRL.length} records for ${ticker} in BRL`);

      return {
        ticker,
        name: assetConfig.name,
        type: assetConfig.type,
        calculationType: assetConfig.calculationType,
        currentPrice: historicalDataBRL.length > 0 ? historicalDataBRL[historicalDataBRL.length - 1].price : undefined,
        historicalData: historicalDataBRL,
      };

    } catch (error) {
      console.error(`Error fetching crypto data for ${ticker}:`, error);
      return null;
    }
  }

  async fetchIPCAData(startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      const url = `http://api.bcb.gov.br/dados/serie/bcdata.sgs.${this.IPCA_SERIES_CODE}/dados?formato=json`;
      
      console.log(`Fetching IPCA data from BCB API...`);

      const response = await axios.get<BCBIPCAResponse[]>(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.error('No IPCA data returned from BCB API');
        return null;
      }

      const now = new Date();
      const start = startDate || new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
      const end = endDate || now;

      const historicalData = [];
      let previousPrice: number | null = null;

      // Convert BCB data format to our format
      for (const record of response.data) {
        const [day, month, year] = record.data.split('/');
        const recordDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Filter by date range
        if (recordDate >= start && recordDate <= end) {
          const inflationRate = parseFloat(record.valor);
          
          if (!isNaN(inflationRate)) {
            let percentageChange: number | null = null;
            if (previousPrice !== null && previousPrice !== 0) {
              percentageChange = inflationRate; // IPCA is already a percentage change
            }

            historicalData.push({
              date: recordDate,
              price: inflationRate, // Store inflation rate as price
              percentageChange: inflationRate, // For IPCA, this is the monthly inflation
            });

            previousPrice = inflationRate;
          }
        }
      }

      // Sort by date ascending
      historicalData.sort((a, b) => a.date.getTime() - b.date.getTime());

      console.log(`Successfully fetched ${historicalData.length} IPCA records`);

      return {
        ticker: 'IPCA',
        name: 'IPCA (Inflação)',
        type: 'Index',
        calculationType: AssetCalculationType.PERCENTUAL,
        currentPrice: historicalData.length > 0 ? historicalData[historicalData.length - 1].price : undefined,
        historicalData,
      };

    } catch (error) {
      console.error(`Error fetching IPCA data:`, error);
      return null;
    }
  }

  async fetchIPCAExpectativaData(startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      const url = `${this.IPEADATA_BASE_URL}/ValoresSerie(SERCODIGO='BM12_IPCAEXP1212')`;
      
      console.log(`Fetching IPCA Expectativa data from IPEADATA API...`);

      const response = await axios.get<IPEADATAResponse>(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.data || !response.data.value || !Array.isArray(response.data.value) || response.data.value.length === 0) {
        console.error('No IPCA Expectativa data returned from IPEADATA API');
        return null;
      }

      const now = new Date();
      const start = startDate || new Date(now.getFullYear() - 5, 0, 1); // Last 5 years
      const end = endDate || now;

      const historicalData = [];
      let previousPrice: number | null = null;

      // Convert IPEADATA data format to our format
      for (const record of response.data.value) {
        const recordDate = new Date(record.VALDATA);
        
        // Filter by date range
        if (recordDate >= start && recordDate <= end) {
          const expectationValue = record.VALVALOR;
          
          if (!isNaN(expectationValue) && expectationValue !== null) {
            let percentageChange: number | null = null;
            if (previousPrice !== null && previousPrice !== 0) {
              percentageChange = ((expectationValue - previousPrice) / previousPrice) * 100;
            }

            historicalData.push({
              date: recordDate,
              price: expectationValue, // Store expectation as price
              percentageChange,
            });

            previousPrice = expectationValue;
          }
        }
      }

      // Sort by date ascending
      historicalData.sort((a, b) => a.date.getTime() - b.date.getTime());

      console.log(`Successfully fetched ${historicalData.length} IPCA Expectativa records`);

      return {
        ticker: 'IPCA_EXP',
        name: 'IPCA Expectativa 12M',
        type: 'Index',
        calculationType: AssetCalculationType.PERCENTUAL,
        currentPrice: historicalData.length > 0 ? historicalData[historicalData.length - 1].price : undefined,
        historicalData,
      };

    } catch (error) {
      console.error(`Error fetching IPCA Expectativa data:`, error);
      return null;
    }
  }

  async fetchBCBData(seriesCode: number = this.CDI_SERIES_CODE, startDate?: Date, endDate?: Date): Promise<AssetData | null> {
    try {
      // For now, let's generate synthetic CDI data based on SELIC
      // This is a temporary solution until we find a working BCB API endpoint
      console.log(`Generating synthetic CDI data based on SELIC...`);
      
      const now = new Date();
      const start = startDate || new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      const end = endDate || now;

      const historicalData = [];
      let cumulativeIndex = 100; // Start with base 100
      let previousPrice: number | null = null;
      
      // Generate daily CDI data (simplified)
      const currentDate = new Date(start);
      const dailyCDIRate = 0.0351; // Approximate current CDI rate (3.51% yearly)
      const dailyRate = Math.pow(1 + dailyCDIRate, 1/252) - 1; // Convert to daily
      
      while (currentDate <= end) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          cumulativeIndex = cumulativeIndex * (1 + dailyRate);
          const price = cumulativeIndex;

          let percentageChange: number | null = null;
          if (previousPrice !== null && previousPrice !== 0) {
            percentageChange = ((price - previousPrice) / previousPrice) * 100;
          }

          historicalData.push({
            date: new Date(currentDate),
            price,
            percentageChange,
          });

          previousPrice = price;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
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
      console.error(`Error generating CDI data:`, error);
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

        if (assetConfig.type === 'Crypto') {
          assetData = await this.fetchCryptoData(assetConfig.ticker, startDate);
        } else if (assetConfig.ticker === 'CDI') {
          assetData = await this.fetchBCBData(this.CDI_SERIES_CODE, startDate);
        } else if (assetConfig.ticker === 'IPCA') {
          assetData = await this.fetchIPCAData(startDate);
        } else if (assetConfig.ticker === 'IPCA_EXP') {
          assetData = await this.fetchIPCAExpectativaData(startDate);
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

      // Check if it's a cryptocurrency
      const assetConfig = this.defaultAssets.find(a => a.ticker === ticker);

      if (assetConfig?.type === 'Crypto') {
        assetData = await this.fetchCryptoData(ticker, startDate, endDate);
      } else if (ticker === 'CDI') {
        assetData = await this.fetchBCBData(this.CDI_SERIES_CODE, startDate, endDate);
      } else if (ticker === 'IPCA') {
        assetData = await this.fetchIPCAData(startDate, endDate);
      } else if (ticker === 'IPCA_EXP') {
        assetData = await this.fetchIPCAExpectativaData(startDate, endDate);
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