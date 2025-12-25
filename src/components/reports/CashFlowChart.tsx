'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CashFlowTrend } from '@/lib/utils/reports';

interface CashFlowData {
  trends: CashFlowTrend[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
  };
}

interface CashFlowChartProps {
  data: CashFlowData;
  loading: boolean;
}

export function CashFlowChart({ data, loading }: CashFlowChartProps) {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `৳${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `৳${(value / 1000).toFixed(1)}K`;
    }
    return `৳${value.toFixed(0)}`;
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Income */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrencyFull(data.summary.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatCurrencyFull(data.summary.averageMonthlyIncome)}/period
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrencyFull(data.summary.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatCurrencyFull(data.summary.averageMonthlyExpenses)}/period
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
              <p
                className={`text-2xl font-bold mt-1 ${
                  data.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrencyFull(data.summary.netCashFlow)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </div>
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                data.summary.netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <DollarSign
                className={`h-6 w-6 ${
                  data.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trends</h3>

        {data.trends.length === 0 ? (
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">No data available for the selected period</p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.trends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    formatCurrencyFull(value || 0),
                    name === 'income'
                      ? 'Income'
                      : name === 'expenses'
                      ? 'Expenses'
                      : 'Net',
                  ]}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) =>
                    value === 'income'
                      ? 'Income'
                      : value === 'expenses'
                      ? 'Expenses'
                      : 'Net Cash Flow'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="income"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                  name="expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
