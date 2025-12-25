'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AgingBucket } from '@/lib/utils/reports';
import { format } from 'date-fns';

interface PaymentStatusData {
  aging: AgingBucket[];
  summary: {
    totalUnpaid: number;
    totalOverdue: number;
    unpaidCount: number;
    overdueCount: number;
    averageDaysOutstanding: number;
  };
}

interface PaymentStatusReportProps {
  data: PaymentStatusData;
  loading: boolean;
}

const BUCKET_COLORS = {
  'Current (0-30 days)': '#22c55e', // green
  '31-60 days': '#f59e0b', // yellow
  '61-90 days': '#f97316', // orange
  'Over 90 days': '#ef4444', // red
};

export function PaymentStatusReport({ data, loading }: PaymentStatusReportProps) {
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());

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

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `৳${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `৳${(value / 1000).toFixed(1)}K`;
    }
    return `৳${value.toFixed(0)}`;
  };

  const toggleBucket = (range: string) => {
    const newExpanded = new Set(expandedBuckets);
    if (newExpanded.has(range)) {
      newExpanded.delete(range);
    } else {
      newExpanded.add(range);
    }
    setExpandedBuckets(newExpanded);
  };

  // Prepare chart data
  const chartData = data.aging.map((bucket) => ({
    name: bucket.range.replace(' days', '').replace('Current ', ''),
    value: bucket.total,
    fullName: bucket.range,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Unpaid */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Unpaid</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(data.summary.totalUnpaid)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.unpaidCount} transactions
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Overdue Amount */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(data.summary.totalOverdue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.summary.overdueCount} transactions
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Average Days Outstanding */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Days Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.averageDaysOutstanding}
              </p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aging Analysis</h3>

        {data.aging.every((b) => b.count === 0) ? (
          <div className="flex h-96 items-center justify-center">
            <p className="text-gray-500">No unpaid transactions</p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatCurrencyShort}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BUCKET_COLORS[entry.fullName as keyof typeof BUCKET_COLORS]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Aging Detail Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aging Details</h3>

        <div className="space-y-4">
          {data.aging.map((bucket) => (
            <div key={bucket.range} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Bucket Header */}
              <button
                onClick={() => toggleBucket(bucket.range)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        BUCKET_COLORS[bucket.range as keyof typeof BUCKET_COLORS],
                    }}
                  />
                  <span className="font-medium text-gray-900">{bucket.range}</span>
                  <span className="text-sm text-gray-500">
                    ({bucket.count} transactions)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(bucket.total)}
                  </span>
                  {expandedBuckets.has(bucket.range) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Bucket Content */}
              {expandedBuckets.has(bucket.range) && bucket.transactions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payee
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Out
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bucket.transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.invoiceNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.payee}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {format(new Date(transaction.dueDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {transaction.currency} {transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {transaction.daysOutstanding}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {expandedBuckets.has(bucket.range) && bucket.transactions.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No transactions in this age range
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
