'use client';

import { Card } from '@/components/ui/card';
import type { CategoryBreakdown, PeriodProfitLoss } from '@/lib/utils/reports';
import type { PeriodMode } from '@/app/(dashboard)/reports/page';

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
  unrecognizedRevenue: number;
  periodBreakdown: PeriodProfitLoss[];
}

interface ProfitLossStatementProps {
  data: ProfitLossData | null;
  loading: boolean;
  mode: PeriodMode;
}

const fmt = (value: number) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function ProfitLossStatement({ data, loading, mode }: ProfitLossStatementProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const isProfit = data.netIncome >= 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue (Paid)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(data.revenue.total)}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expenses</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{fmt(data.expenses.total)}</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net {isProfit ? 'Profit' : 'Loss'}</p>
          <p className={`text-2xl font-bold mt-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(data.netIncome)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{data.profitMargin.toFixed(1)}% margin</p>
        </Card>

        <Card className="p-5 border-amber-200 bg-amber-50">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Unearned Revenue</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(data.unrecognizedRevenue)}</p>
          <p className="text-xs text-amber-600 mt-0.5">Not yet paid</p>
        </Card>
      </div>

      {/* Period Breakdown Table */}
      {data.periodBreakdown.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {mode === 'monthly' && 'Month-by-Month Breakdown'}
              {mode === 'quarterly' && 'Quarter-by-Quarter Breakdown'}
              {mode === 'half-yearly' && 'Half-Year Breakdown'}
              {mode === 'lifetime' && 'Year-by-Year Breakdown'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Revenue</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Expenses</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Net</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.periodBreakdown.map((row) => {
                  const net = row.netIncome >= 0;
                  return (
                    <tr key={row.period} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{row.label}</td>
                      <td className="px-6 py-3 text-right text-green-700">{fmt(row.revenue)}</td>
                      <td className="px-6 py-3 text-right text-red-700">{fmt(row.expenses)}</td>
                      <td className={`px-6 py-3 text-right font-semibold ${net ? 'text-green-700' : 'text-red-700'}`}>
                        {net ? '+' : ''}{fmt(row.netIncome)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500">
                        {row.revenue > 0 ? `${row.profitMargin.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-6 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-green-700">{fmt(data.revenue.total)}</td>
                  <td className="px-6 py-3 text-right font-bold text-red-700">{fmt(data.expenses.total)}</td>
                  <td className={`px-6 py-3 text-right font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                    {isProfit ? '+' : ''}{fmt(data.netIncome)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-600">
                    {data.revenue.total > 0 ? `${data.profitMargin.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Revenue by Category</span>
            <span className="text-green-600 font-bold">{fmt(data.revenue.total)}</span>
          </h3>

          {data.revenue.byCategory.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No paid revenue in this period</p>
          ) : (
            <div className="space-y-3">
              {data.revenue.byCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate pr-2">{cat.category}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-400 text-xs">{cat.percentage.toFixed(1)}%</span>
                      <span className="font-medium text-gray-900">{fmt(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Expenses by Category */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Expenses by Category</span>
            <span className="text-red-600 font-bold">{fmt(data.expenses.total)}</span>
          </h3>

          {data.expenses.byCategory.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No expenses in this period</p>
          ) : (
            <div className="space-y-3">
              {data.expenses.byCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate pr-2">{cat.category}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-400 text-xs">{cat.percentage.toFixed(1)}%</span>
                      <span className="font-medium text-gray-900">{fmt(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Formal P&L Statement */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wide">
          Statement of Profit & Loss
        </h3>

        <div className="space-y-0 text-sm">
          {/* Revenue */}
          <div className="flex justify-between py-2 font-semibold text-gray-900 border-b border-gray-200">
            <span>Revenue (Cash Received)</span>
            <span className="text-green-600">{fmt(data.revenue.total)}</span>
          </div>

          {/* Expenses */}
          <div className="flex justify-between py-2 font-semibold text-gray-900 mt-4 border-b border-gray-200">
            <span>Total Expenses</span>
            <span className="text-red-600">({fmt(data.expenses.total)})</span>
          </div>

          {/* Net */}
          <div className={`flex justify-between py-3 font-bold text-base mt-1 border-t-2 ${isProfit ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}`}>
            <span>Net {isProfit ? 'Profit' : 'Loss'}</span>
            <span>{fmt(data.netIncome)}</span>
          </div>

          {/* Unrecognized */}
          {data.unrecognizedRevenue > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed border-amber-300">
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Unearned Revenue (Invoiced, Unpaid)</span>
                <span>{fmt(data.unrecognizedRevenue)}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Not included in revenue — will be recognized when payment is received
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
