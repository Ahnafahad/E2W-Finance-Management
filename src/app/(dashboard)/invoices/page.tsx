'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  type: string;
  date: string;
  payee: string;
  category: string;
  amount: number;
  currency: string;
  amountBDT: number;
  paymentStatus: string;
  invoiceNumber: string | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      setInvoices(data.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    setDownloading(id);
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to generate invoice');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    } finally {
      setDownloading(null);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    setBulkDownloading(true);
    try {
      const response = await fetch('/api/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: selectedIds }),
      });

      if (!response.ok) throw new Error('Failed to generate invoices');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSelectedIds([]);
    } catch (error) {
      console.error('Error downloading invoices:', error);
      alert('Failed to download invoices');
    } finally {
      setBulkDownloading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invoices.map((inv) => inv.id));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate and download invoices for transactions
          </p>
        </div>
        <Button
          onClick={handleBulkDownload}
          disabled={selectedIds.length === 0 || bulkDownloading}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {bulkDownloading ? 'Generating...' : `Download Selected (${selectedIds.length})`}
        </Button>
      </div>

      {/* Invoice List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(invoice.id)}
                        onChange={() => toggleSelect(invoice.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {invoice.payee}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {invoice.currency} {invoice.amount.toFixed(2)}
                      <span className="text-xs text-gray-500 block">
                        BDT {invoice.amountBDT.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : invoice.paymentStatus === 'UNPAID'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {invoice.paymentStatus === 'PAID' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {invoice.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        disabled={downloading === invoice.id}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {downloading === invoice.id ? 'Generating...' : 'Download'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
