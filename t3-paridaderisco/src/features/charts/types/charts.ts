export type TimeRange = "30d" | "90d" | "365d" | "1y" | "3y" | "5y" | "custom";

export type ChartType = "timeseries" | "comparison" | "benchmark";

export interface ChartDataPoint {
  date: string;
  value: number;
  percentageChange?: number;
  rawPrice?: number;
}

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: string;
  calculationType?: "PRECO" | "PERCENTUAL";
}

export interface TimeSeriesData {
  data: ChartDataPoint[];
  asset: Asset | null;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
  isNormalized?: boolean;
}

export interface MultiAssetData {
  assetId: string;
  asset: Asset;
  data: ChartDataPoint[];
}

export interface MultiAssetComparison {
  data: MultiAssetData[];
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
}

export interface AssetStats {
  totalReturn: number;
  maxPrice: number;
  minPrice: number;
  avgPrice: number;
  dataPoints: number;
  period: {
    startDate: Date | string;
    endDate: Date | string;
  };
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  responsive?: boolean;
}

export interface AssetOption {
  id: string;
  ticker: string;
  name: string;
  type: string;
  dataPoints: number;
}