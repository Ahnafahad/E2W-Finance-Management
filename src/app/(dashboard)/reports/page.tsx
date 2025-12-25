'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeSelector } from '@/components/reports/DateRangeSelector';
import { CashFlowChart } from '@/components/reports/CashFlowChart';
import { PaymentStatusReport } from '@/components/reports/PaymentStatusReport';
import { ProfitLossStatement } from '@/components/reports/ProfitLossStatement';
import { getDefaultDateRange } from '@/lib/utils/date';

interface ReportData {
  cashFlow: {
    trends: Array<{
      period: string;
      label: string;
      income: number;
      expenses: number;
      netCashFlow: number;
      counts: {
        income: number;
        expense: number;
      };
    }>;
    summary: {
      totalIncome: number;
      totalExpenses: number;
      netCashFlow: number;
      averageMonthlyIncome: number;
      averageMonthlyExpenses: number;
    };
  };
  paymentStatus: {
    aging: Array<{
      range: string;
      minDays: number;
      maxDays: number | null;
      count: number;
      total: number;
      transactions: Array<any>;
    }>;
    summary: {
      totalUnpaid: number;
      totalOverdue: number;
      unpaidCount: number;
      overdueCount: number;
      averageDaysOutstanding: number;
    };
  };
  profitLoss: {
    revenue: {
      total: number;
      byCategory: Array<{
        category: string;
        amount: number;
        percentage: number;
      }>;
    };
    expenses: {
      total: number;
      byCategory: Array<{
        category: string;
        amount: number;
        percentage: number;
      }>;
    };
    netIncome: number;
    profitMargin: number;
  };
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        groupBy: 'month',
      });

      const response = await fetch(`/api/reports?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-600">
          Comprehensive financial analysis and insights
        </p>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector onRangeChange={handleRangeChange} initialRange={dateRange} />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !reportData && (
        <div className="flex h-96 items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Report Tabs */}
      {reportData && (
        <Tabs defaultValue="cashflow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow">
            <CashFlowChart data={reportData.cashFlow} loading={loading} />
          </TabsContent>

          <TabsContent value="payment-status">
            <PaymentStatusReport data={reportData.paymentStatus} loading={loading} />
          </TabsContent>

          <TabsContent value="profit-loss">
            <ProfitLossStatement data={reportData.profitLoss} loading={loading} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
