'use client';

import { Card } from '@/components/ui/card';
import type { CategoryBreakdown } from '@/lib/utils/reports';

interface ProfitLossData {
  revenue: {
    total: number;
    byCategory: CategoryBreakdown[];
  };
  expenses: {
    total: number;
    byCategory: CategoryBreakdown[];
  };
  netIncome: number;
  profitMargin: number;
}

interface ProfitLossStatementProps {
  data: ProfitLossData;
  loading: boolean;
}

export function ProfitLossStatement({ data, loading }: ProfitLossStatementProps) {
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(data.revenue.total)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(data.expenses.total)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-medium text-gray-600">Net Income</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(data.netIncome)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Profit Margin: {data.profitMargin.toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* P&L Statement Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Profit & Loss Statement
        </h3>

        <div className="space-y-8">
          {/* Revenue Section */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-green-600">
              <h4 className="text-md font-semibold text-gray-900">REVENUE</h4>
              <span className="text-md font-bold text-green-600">
                {formatCurrency(data.revenue.total)}
              </span>
            </div>

            {data.revenue.byCategory.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No revenue in this period</p>
            ) : (
              <div className="space-y-3">
                {data.revenue.byCategory.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{category.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">
                          {category.percentage.toFixed(2)}%
                        </span>
                        <span className="font-medium text-gray-900 w-32 text-right">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                    </div>
                    {/* Percentage Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses Section */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600">
              <h4 className="text-md font-semibold text-gray-900">EXPENSES</h4>
              <span className="text-md font-bold text-red-600">
                {formatCurrency(data.expenses.total)}
              </span>
            </div>

            {data.expenses.byCategory.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No expenses in this period</p>
            ) : (
              <div className="space-y-3">
                {data.expenses.byCategory.map((category) => (
                  <div key={category.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{category.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500">
                          {category.percentage.toFixed(2)}%
                        </span>
                        <span className="font-medium text-gray-900 w-32 text-right">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                    </div>
                    {/* Percentage Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Net Income Section */}
          <div className="pt-4 border-t-2 border-gray-900">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">NET INCOME</h4>
              <span
                className={`text-xl font-bold ${
                  data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(data.netIncome)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Profit Margin</span>
              <span
                className={`font-medium ${
                  data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.profitMargin.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
