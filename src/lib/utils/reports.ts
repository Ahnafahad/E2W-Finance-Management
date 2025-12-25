import { roundCurrency } from './financial';
import { getPeriodIdentifier, formatPeriodLabel, type GroupBy } from './date';
import { differenceInDays } from 'date-fns';

/**
 * Transaction data for reporting
 */
export interface TransactionForReport {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  dueDate?: Date | null;
  category: string;
  payee: string;
  amount: number;
  currency: string;
  amountBDT: number;
  paymentStatus: string;
  invoiceNumber?: string | null;
}

/**
 * Cash flow trend data point
 */
export interface CashFlowTrend {
  period: string;
  label: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  counts: {
    income: number;
    expense: number;
  };
}

/**
 * Aging bucket for payment status
 */
export interface AgingBucket {
  range: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  total: number;
  transactions: Array<{
    id: string;
    invoiceNumber: string | null;
    payee: string;
    dueDate: Date;
    amount: number;
    currency: string;
    amountBDT: number;
    paymentStatus: string;
    daysOutstanding: number;
  }>;
}

/**
 * Category breakdown item
 */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

/**
 * Group transactions by time period (month/quarter/year)
 */
export function groupTransactionsByPeriod(
  transactions: TransactionForReport[],
  groupBy: GroupBy = 'month'
): CashFlowTrend[] {
  // Group transactions by period
  const grouped = new Map<string, TransactionForReport[]>();

  transactions.forEach((transaction) => {
    const period = getPeriodIdentifier(transaction.date, groupBy);
    if (!grouped.has(period)) {
      grouped.set(period, []);
    }
    grouped.get(period)!.push(transaction);
  });

  // Convert to trend data points
  const trends: CashFlowTrend[] = [];

  // Sort periods chronologically
  const sortedPeriods = Array.from(grouped.keys()).sort();

  sortedPeriods.forEach((period) => {
    const periodTransactions = grouped.get(period)!;

    const income = periodTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amountBDT, 0);

    const expenses = periodTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amountBDT, 0);

    const incomeCount = periodTransactions.filter((t) => t.type === 'INCOME').length;
    const expenseCount = periodTransactions.filter((t) => t.type === 'EXPENSE').length;

    // Use first transaction's date for label formatting
    const firstTransaction = periodTransactions[0];

    trends.push({
      period,
      label: formatPeriodLabel(firstTransaction.date, groupBy),
      income: roundCurrency(income),
      expenses: roundCurrency(expenses),
      netCashFlow: roundCurrency(income - expenses),
      counts: {
        income: incomeCount,
        expense: expenseCount,
      },
    });
  });

  return trends;
}

/**
 * Calculate aging buckets for unpaid/overdue transactions
 */
export function calculateAgingBuckets(
  transactions: TransactionForReport[]
): AgingBucket[] {
  const now = new Date();

  // Define aging buckets
  const buckets: AgingBucket[] = [
    {
      range: 'Current (0-30 days)',
      minDays: 0,
      maxDays: 30,
      count: 0,
      total: 0,
      transactions: [],
    },
    {
      range: '31-60 days',
      minDays: 31,
      maxDays: 60,
      count: 0,
      total: 0,
      transactions: [],
    },
    {
      range: '61-90 days',
      minDays: 61,
      maxDays: 90,
      count: 0,
      total: 0,
      transactions: [],
    },
    {
      range: 'Over 90 days',
      minDays: 91,
      maxDays: null,
      count: 0,
      total: 0,
      transactions: [],
    },
  ];

  // Classify transactions into buckets
  transactions.forEach((transaction) => {
    if (!transaction.dueDate) return;

    const daysOutstanding = differenceInDays(now, transaction.dueDate);

    // Find appropriate bucket
    const bucket = buckets.find((b) => {
      if (b.maxDays === null) {
        return daysOutstanding >= b.minDays;
      }
      return daysOutstanding >= b.minDays && daysOutstanding <= b.maxDays;
    });

    if (bucket) {
      bucket.count++;
      bucket.total += transaction.amountBDT;
      bucket.transactions.push({
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber || null,
        payee: transaction.payee,
        dueDate: transaction.dueDate,
        amount: transaction.amount,
        currency: transaction.currency,
        amountBDT: transaction.amountBDT,
        paymentStatus: transaction.paymentStatus,
        daysOutstanding,
      });
    }
  });

  // Round totals and sort transactions by days outstanding (descending)
  buckets.forEach((bucket) => {
    bucket.total = roundCurrency(bucket.total);
    bucket.transactions.sort((a, b) => b.daysOutstanding - a.daysOutstanding);

    // Limit to top 10 transactions per bucket to prevent huge payloads
    if (bucket.transactions.length > 10) {
      bucket.transactions = bucket.transactions.slice(0, 10);
    }
  });

  return buckets;
}

/**
 * Calculate category breakdown with percentages
 */
export function calculateCategoryBreakdown(
  transactions: TransactionForReport[]
): CategoryBreakdown[] {
  // Group by category and sum amounts
  const categoryTotals = new Map<string, number>();

  transactions.forEach((transaction) => {
    const category = transaction.category || 'Uncategorized';
    const currentTotal = categoryTotals.get(category) || 0;
    categoryTotals.set(category, currentTotal + transaction.amountBDT);
  });

  // Calculate total for percentage calculations
  const grandTotal = Array.from(categoryTotals.values()).reduce(
    (sum, amount) => sum + amount,
    0
  );

  // Convert to breakdown array with percentages
  const breakdown: CategoryBreakdown[] = [];

  categoryTotals.forEach((amount, category) => {
    const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

    breakdown.push({
      category,
      amount: roundCurrency(amount),
      percentage: roundCurrency(percentage),
    });
  });

  // Sort by amount descending
  breakdown.sort((a, b) => b.amount - a.amount);

  return breakdown;
}

/**
 * Calculate summary statistics for cash flow
 */
export function calculateCashFlowSummary(trends: CashFlowTrend[]) {
  const totalIncome = trends.reduce((sum, t) => sum + t.income, 0);
  const totalExpenses = trends.reduce((sum, t) => sum + t.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;

  const periodCount = trends.length;
  const averageMonthlyIncome = periodCount > 0 ? totalIncome / periodCount : 0;
  const averageMonthlyExpenses = periodCount > 0 ? totalExpenses / periodCount : 0;

  return {
    totalIncome: roundCurrency(totalIncome),
    totalExpenses: roundCurrency(totalExpenses),
    netCashFlow: roundCurrency(netCashFlow),
    averageMonthlyIncome: roundCurrency(averageMonthlyIncome),
    averageMonthlyExpenses: roundCurrency(averageMonthlyExpenses),
  };
}

/**
 * Calculate summary statistics for payment status
 */
export function calculatePaymentStatusSummary(buckets: AgingBucket[]) {
  const totalUnpaid = buckets.reduce((sum, b) => sum + b.total, 0);
  const unpaidCount = buckets.reduce((sum, b) => sum + b.count, 0);

  // Overdue is everything beyond current (0-30 days)
  const overdueData = buckets.slice(1); // Skip first bucket (current)
  const totalOverdue = overdueData.reduce((sum, b) => sum + b.total, 0);
  const overdueCount = overdueData.reduce((sum, b) => sum + b.count, 0);

  // Calculate average days outstanding
  let totalDaysOutstanding = 0;
  let totalTransactions = 0;

  buckets.forEach((bucket) => {
    bucket.transactions.forEach((transaction) => {
      totalDaysOutstanding += transaction.daysOutstanding;
      totalTransactions++;
    });
  });

  const averageDaysOutstanding =
    totalTransactions > 0 ? totalDaysOutstanding / totalTransactions : 0;

  return {
    totalUnpaid: roundCurrency(totalUnpaid),
    totalOverdue: roundCurrency(totalOverdue),
    unpaidCount,
    overdueCount,
    averageDaysOutstanding: roundCurrency(averageDaysOutstanding, 1),
  };
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  const netIncome = revenue - expenses;
  const margin = (netIncome / revenue) * 100;
  return roundCurrency(margin);
}
