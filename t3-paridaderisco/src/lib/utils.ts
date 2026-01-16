import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Gets the decimal places based on asset type
 * @param assetType - The type of the asset (string from database)
 * @returns Number of decimal places to use
 */
function getDecimalsByAssetType(assetType?: string): number {
  if (!assetType) return 2;
  const type = assetType.toLowerCase();
  // Crypto assets need 8 decimal places
  if (type.includes('cripto') || type.includes('crypto') || type.includes('btc') || type.includes('eth')) {
    return 8;
  }
  // All other assets (ETF, Index, Currency, Stocks) use 2 decimal places
  return 2;
}

/**
 * Formats a number based on the asset type
 * @param value - The number to format
 * @param assetType - The type of the asset from database
 * @returns Formatted string with appropriate decimal places
 */
export function formatDecimalByAssetClass(
  value: number,
  assetType?: string
): string {
  const decimals = getDecimalsByAssetType(assetType);
  return value.toFixed(decimals);
}

/**
 * Formats a number with thousands separator and appropriate decimal places
 * @param value - The number to format
 * @param assetType - The type of the asset from database
 * @returns Formatted string with locale formatting
 */
export function formatNumberByAssetClass(
  value: number,
  assetType?: string
): string {
  const decimals = getDecimalsByAssetType(assetType);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
