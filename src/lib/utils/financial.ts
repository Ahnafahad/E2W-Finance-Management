/**
 * Financial calculation utilities
 * Implements proper rounding strategies for currency calculations
 */

/**
 * Exchange rate validation ranges
 * Based on historical ranges with buffer for volatility
 */
export const EXCHANGE_RATE_RANGES: Record<string, { min: number; max: number; typical: { min: number; max: number } }> = {
  'USD-BDT': {
    min: 50,
    max: 200,
    typical: { min: 80, max: 150 },
  },
  'GBP-BDT': {
    min: 70,
    max: 250,
    typical: { min: 100, max: 200 },
  },
  'EUR-BDT': {
    min: 60,
    max: 220,
    typical: { min: 90, max: 180 },
  },
};

/**
 * Banker's Rounding (Round Half to Even)
 * This is the IEEE 754 standard and recommended for financial calculations
 * to avoid systematic bias when rounding many numbers.
 *
 * Examples:
 * - 2.5 rounds to 2 (even)
 * - 3.5 rounds to 4 (even)
 * - 2.51 rounds to 3
 * - 2.49 rounds to 2
 *
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2 for currency)
 * @returns Rounded number
 */
export function roundCurrency(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) {
    throw new Error('Invalid number for currency rounding');
  }

  const multiplier = Math.pow(10, decimals);
  const shifted = value * multiplier;
  const floor = Math.floor(shifted);
  const fraction = shifted - floor;

  // If exactly 0.5, round to even
  if (Math.abs(fraction - 0.5) < Number.EPSILON) {
    return (floor % 2 === 0 ? floor : floor + 1) / multiplier;
  }

  // Otherwise, standard rounding
  return Math.round(shifted) / multiplier;
}

/**
 * Convert amount from one currency to another with proper rounding
 *
 * @param amount - Original amount
 * @param exchangeRate - Exchange rate to apply
 * @param decimals - Number of decimal places (default: 2)
 * @returns Converted and rounded amount
 */
export function convertCurrency(
  amount: number,
  exchangeRate: number,
  decimals: number = 2
): number {
  if (exchangeRate <= 0) {
    throw new Error('Exchange rate must be positive');
  }

  const converted = amount * exchangeRate;
  return roundCurrency(converted, decimals);
}

/**
 * Calculate percentage with proper rounding
 *
 * @param amount - Base amount
 * @param percentage - Percentage (e.g., 15 for 15%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Calculated percentage amount
 */
export function calculatePercentage(
  amount: number,
  percentage: number,
  decimals: number = 2
): number {
  const result = (amount * percentage) / 100;
  return roundCurrency(result, decimals);
}

/**
 * Add multiple amounts with proper rounding
 * Avoids floating-point accumulation errors
 *
 * @param amounts - Array of amounts to sum
 * @param decimals - Number of decimal places (default: 2)
 * @returns Sum with proper rounding
 */
export function sumAmounts(amounts: number[], decimals: number = 2): number {
  const sum = amounts.reduce((acc, amount) => acc + amount, 0);
  return roundCurrency(sum, decimals);
}

/**
 * Format currency for display
 *
 * @param amount - Amount to format
 * @param currency - Currency code (e.g., 'USD', 'BDT')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'BDT',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate that an amount has correct precision
 *
 * @param amount - Amount to validate
 * @param decimals - Expected decimal places (default: 2)
 * @returns True if valid precision
 */
export function hasValidPrecision(amount: number, decimals: number = 2): boolean {
  const multiplier = Math.pow(10, decimals);
  const shifted = Math.round(amount * multiplier);
  const reconstructed = shifted / multiplier;
  return Math.abs(amount - reconstructed) < Number.EPSILON;
}

/**
 * Validation result for exchange rates
 */
export interface ExchangeRateValidationResult {
  isValid: boolean;
  isWithinTypicalRange: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validate exchange rate is within acceptable ranges
 *
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code (usually BDT)
 * @param rate - Exchange rate to validate
 * @returns Validation result with errors/warnings
 */
export function validateExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): ExchangeRateValidationResult {
  // Basic validation
  if (rate <= 0) {
    return {
      isValid: false,
      isWithinTypicalRange: false,
      error: 'Exchange rate must be positive',
    };
  }

  if (!isFinite(rate) || isNaN(rate)) {
    return {
      isValid: false,
      isWithinTypicalRange: false,
      error: 'Exchange rate must be a valid number',
    };
  }

  // Only validate rates to BDT
  if (toCurrency !== 'BDT') {
    return {
      isValid: true,
      isWithinTypicalRange: true,
    };
  }

  const rateKey = `${fromCurrency}-${toCurrency}`;
  const ranges = EXCHANGE_RATE_RANGES[rateKey];

  // If no range defined for this currency pair, allow but warn
  if (!ranges) {
    return {
      isValid: true,
      isWithinTypicalRange: true,
      warning: `No validation range defined for ${fromCurrency} to ${toCurrency}`,
    };
  }

  // Check hard limits
  if (rate < ranges.min || rate > ranges.max) {
    return {
      isValid: false,
      isWithinTypicalRange: false,
      error: `Exchange rate ${rate} is outside acceptable range (${ranges.min}-${ranges.max}) for ${fromCurrency}/${toCurrency}`,
    };
  }

  // Check typical range
  if (rate < ranges.typical.min || rate > ranges.typical.max) {
    return {
      isValid: true,
      isWithinTypicalRange: false,
      warning: `Exchange rate ${rate} is outside typical range (${ranges.typical.min}-${ranges.typical.max}) for ${fromCurrency}/${toCurrency}. Please verify this rate is correct.`,
    };
  }

  return {
    isValid: true,
    isWithinTypicalRange: true,
  };
}
