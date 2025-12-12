'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  unpaidCount: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    date: string;
    payee: string;
    amount: number;
    currency: string;
    amountBDT: number;
    paymentStatus: string;
  }>;
  upcomingPayments: Array<{
    id: string;
    payee: string;
    dueDate: string;
    amount: number;
    currency: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error || 'Failed to load dashboard'}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back! Here's your financial overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Monthly Income */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.monthlyIncome)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Monthly Expenses */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(stats.monthlyExpenses)}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Net Cash Flow */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
              <p className={`text-2xl font-bold mt-1 ${stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.netCashFlow)}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stats.netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-6 w-6 ${stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>

        {/* Unpaid Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unpaid</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.unpaidCount}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
            ) : (
              stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Receipt className={`h-5 w-5 ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.payee}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amountBDT)}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.paymentStatus}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Payments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Payments</h2>
            <Link href="/transactions?status=UNPAID" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {stats.upcomingPayments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming payments</p>
            ) : (
              stats.upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.payee}</p>
                    <p className="text-xs text-gray-500">
                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
