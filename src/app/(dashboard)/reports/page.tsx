'use client';

import { useEffect, useState } from 'react';
import { ProfitLossStatement } from '@/components/reports/ProfitLossStatement';
import { endOfMonth, startOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import type { PeriodProfitLoss } from '@/lib/utils/reports';

export type PeriodMode = 'monthly' | 'quarterly' | 'half-yearly' | 'lifetime';

interface ProfitLossData {
  revenue: {
    total: number;
    byCategory: Array<{ category: string; amount: number; percentage: number }>;
  };
  expenses: {
    total: number;
    byCategory: Array<{ category: string; amount: number; percentage: number }>;
  };
  netIncome: number;
  profitMargin: number;
  unrecognizedRevenue: number;
  periodBreakdown: PeriodProfitLoss[];
}

function getModeParams(mode: PeriodMode): { startDate: Date; endDate: Date; groupBy: string } {
  const now = new Date();

  switch (mode) {
    case 'monthly':
      return {
        startDate: startOfMonth(subMonths(now, 11)),
        endDate: endOfMonth(now),
        groupBy: 'month',
      };
    case 'quarterly':
      return {
        startDate: startOfQuarter(subQuarters(now, 3)),
        endDate: endOfQuarter(now),
        groupBy: 'quarter',
      };
    case 'half-yearly': {
      const isH2 = now.getMonth() >= 6;
      return {
        startDate: isH2
          ? new Date(now.getFullYear() - 1, 6, 1)  // Start of last H2 (18 months back)
          : new Date(now.getFullYear() - 2, 0, 1),  // Start of H1 two years ago
        endDate: endOfMonth(now),
        groupBy: 'half-year',
      };
    }
    case 'lifetime':
      return {
        startDate: new Date('2020-01-01'),
        endDate: endOfMonth(now),
        groupBy: 'year',
      };
  }
}

const PERIOD_TABS: Array<{ value: PeriodMode; label: string; description: string }> = [
  { value: 'monthly', label: 'Monthly', description: 'Last 12 months' },
  { value: 'quarterly', label: 'Quarterly', description: 'Last 4 quarters' },
  { value: 'half-yearly', label: 'Half-Yearly', description: 'By half-year' },
  { value: 'lifetime', label: 'Lifetime', description: 'All time by year' },
];

export default function ReportsPage() {
  const [mode, setMode] = useState<PeriodMode>('monthly');
  const [reportData, setReportData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [mode]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate, groupBy } = getModeParams(mode);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        groupBy,
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');

      const data = await response.json();
      setReportData(data.profitLoss);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profit & Loss</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cash basis — revenue recognized when paid, expenses recognized when recorded
        </p>
      </div>

      {/* Period Mode Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setMode(tab.value)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              mode === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="block">{tab.label}</span>
            <span className="block text-xs font-normal opacity-70">{tab.description}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* P&L Report */}
      <ProfitLossStatement data={reportData} loading={loading} mode={mode} />
    </div>
  );
}
