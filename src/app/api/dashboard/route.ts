import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get monthly income
    const monthlyIncomeResult = await prisma.transaction.aggregate({
      where: {
        type: 'INCOME',
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amountBDT: true,
      },
    });

    // Get monthly expenses
    const monthlyExpensesResult = await prisma.transaction.aggregate({
      where: {
        type: 'EXPENSE',
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amountBDT: true,
      },
    });

    // Get total income (all time)
    const totalIncomeResult = await prisma.transaction.aggregate({
      where: {
        type: 'INCOME',
      },
      _sum: {
        amountBDT: true,
      },
    });

    // Get total expenses (all time)
    const totalExpensesResult = await prisma.transaction.aggregate({
      where: {
        type: 'EXPENSE',
      },
      _sum: {
        amountBDT: true,
      },
    });

    // Get unpaid count
    const unpaidCount = await prisma.transaction.count({
      where: {
        paymentStatus: 'UNPAID',
      },
    });

    // Get recent transactions (last 5)
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        type: true,
        date: true,
        payee: true,
        amount: true,
        currency: true,
        amountBDT: true,
        paymentStatus: true,
      },
    });

    // Get upcoming payments (unpaid, due in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingPayments = await prisma.transaction.findMany({
      where: {
        paymentStatus: 'UNPAID',
        dueDate: {
          lte: thirtyDaysFromNow,
        },
      },
      take: 5,
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        id: true,
        payee: true,
        dueDate: true,
        amount: true,
        currency: true,
      },
    });

    const monthlyIncome = monthlyIncomeResult._sum.amountBDT || 0;
    const monthlyExpenses = monthlyExpensesResult._sum.amountBDT || 0;
    const totalIncome = totalIncomeResult._sum.amountBDT || 0;
    const totalExpenses = totalExpensesResult._sum.amountBDT || 0;

    const stats = {
      monthlyIncome,
      monthlyExpenses,
      netCashFlow: monthlyIncome - monthlyExpenses,
      totalIncome,
      totalExpenses,
      unpaidCount,
      recentTransactions,
      upcomingPayments,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
