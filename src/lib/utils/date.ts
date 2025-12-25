import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  format,
} from 'date-fns';

export type DateRangePreset =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'last-year'
  | 'custom';

export type GroupBy = 'month' | 'quarter' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get date range presets for the date range selector
 */
export function getDateRangePresets(): Array<{
  value: DateRangePreset;
  label: string;
}> {
  return [
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'last-quarter', label: 'Last Quarter' },
    { value: 'this-year', label: 'This Year' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];
}

/**
 * Calculate start and end dates for a given preset
 */
export function getDateRange(preset: DateRangePreset): DateRange | null {
  const now = new Date();

  switch (preset) {
    case 'this-month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };

    case 'last-month': {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    }

    case 'this-quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };

    case 'last-quarter': {
      const lastQuarter = subQuarters(now, 1);
      return {
        start: startOfQuarter(lastQuarter),
        end: endOfQuarter(lastQuarter),
      };
    }

    case 'this-year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };

    case 'last-year': {
      const lastYear = subYears(now, 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear),
      };
    }

    case 'custom':
      // Return null for custom - caller should provide dates
      return null;

    default:
      return null;
  }
}

/**
 * Format a date period label based on grouping
 */
export function formatPeriodLabel(date: Date, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'month':
      return format(date, 'MMM yyyy'); // "Jan 2025"

    case 'quarter': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${format(date, 'yyyy')}`; // "Q1 2025"
    }

    case 'year':
      return format(date, 'yyyy'); // "2025"

    default:
      return format(date, 'MMM yyyy');
  }
}

/**
 * Get period identifier (for grouping)
 */
export function getPeriodIdentifier(date: Date, groupBy: GroupBy): string {
  switch (groupBy) {
    case 'month':
      return format(date, 'yyyy-MM'); // "2025-01"

    case 'quarter': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${format(date, 'yyyy')}-Q${quarter}`; // "2025-Q1"
    }

    case 'year':
      return format(date, 'yyyy'); // "2025"

    default:
      return format(date, 'yyyy-MM');
  }
}

/**
 * Validate date range
 */
export function validateDateRange(start: Date, end: Date): {
  valid: boolean;
  error?: string;
} {
  if (start > end) {
    return {
      valid: false,
      error: 'Start date must be before end date',
    };
  }

  // Maximum range: 2 years
  const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
  if (end.getTime() - start.getTime() > maxRangeMs) {
    return {
      valid: false,
      error: 'Date range cannot exceed 2 years',
    };
  }

  return { valid: true };
}

/**
 * Get default date range (current month)
 */
export function getDefaultDateRange(): DateRange {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}
