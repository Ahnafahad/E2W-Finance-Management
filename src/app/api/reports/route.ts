import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  groupTransactionsByPeriod,
  calculateAgingBuckets,
  calculateCategoryBreakdown,
  calculateCashFlowSummary,
  calculatePaymentStatusSummary,
  calculateProfitMargin,
  type TransactionForReport,
} from '@/lib/utils/reports';
import type { GroupBy } from '@/lib/utils/date';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const groupBy = (searchParams.get('groupBy') || 'month') as GroupBy;

    // Validate required parameters
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Fetch all transactions for the date range
    // Exclude soft-deleted transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        date: true,
        dueDate: true,
        category: true,
        payee: true,
        amount: true,
        currency: true,
        amountBDT: true,
        paymentStatus: true,
        invoiceNumber: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Convert to TransactionForReport type
    const transactionsForReport: TransactionForReport[] = transactions.map((t) => ({
      ...t,
      type: t.type as 'INCOME' | 'EXPENSE',
    }));

    // === CASH FLOW ANALYSIS ===
    const cashFlowTrends = groupTransactionsByPeriod(transactionsForReport, groupBy);
    const cashFlowSummary = calculateCashFlowSummary(cashFlowTrends);

    // === PAYMENT STATUS REPORT ===
    // Get unpaid and overdue transactions with due dates
    const unpaidTransactions = await prisma.transaction.findMany({
      where: {
        paymentStatus: {
          in: ['UNPAID', 'OVERDUE'],
        },
        dueDate: {
          not: null,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        date: true,
        dueDate: true,
        category: true,
        payee: true,
        amount: true,
        currency: true,
        amountBDT: true,
        paymentStatus: true,
        invoiceNumber: true,
      },
    });

    const unpaidForReport: TransactionForReport[] = unpaidTransactions.map((t) => ({
      ...t,
      type: t.type as 'INCOME' | 'EXPENSE',
    }));

    const agingBuckets = calculateAgingBuckets(unpaidForReport);
    const paymentStatusSummary = calculatePaymentStatusSummary(agingBuckets);

    // === PROFIT & LOSS STATEMENT ===
    const incomeTransactions = transactionsForReport.filter((t) => t.type === 'INCOME');
    const expenseTransactions = transactionsForReport.filter((t) => t.type === 'EXPENSE');

    const revenueByCategory = calculateCategoryBreakdown(incomeTransactions);
    const expensesByCategory = calculateCategoryBreakdown(expenseTransactions);

    const totalRevenue = revenueByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const profitMargin = calculateProfitMargin(totalRevenue, totalExpenses);

    // Construct response
    const reportData = {
      cashFlow: {
        trends: cashFlowTrends,
        summary: cashFlowSummary,
      },
      paymentStatus: {
        aging: agingBuckets,
        summary: paymentStatusSummary,
      },
      profitLoss: {
        revenue: {
          total: totalRevenue,
          byCategory: revenueByCategory,
        },
        expenses: {
          total: totalExpenses,
          byCategory: expensesByCategory,
        },
        netIncome,
        profitMargin,
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
