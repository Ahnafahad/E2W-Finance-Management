'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TransactionForm } from '@/components/transactions/TransactionForm';

interface Transaction {
  id: string;
  type: string;
  date: Date | string;
  dueDate?: Date | string | null;
  category: string;
  subcategory?: string | null;
  payee: string;
  description?: string | null;
  amount: number;
  currency: string;
  exchangeRate?: number | null;
  amountBDT: number;
  paymentStatus: string;
  paymentDate?: Date | string | null;
  paymentMethod?: string | null;
  invoiceNumber?: string | null;
  invoiceGenerated: boolean;
  invoiceUrl?: string | null;
  notes?: string | null;
  tags?: string | null;
}

export default function EditTransactionPage() {
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/transactions/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch transaction');
        }

        const data = await response.json();
        setTransaction(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransaction();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error || 'Transaction not found'}
        </div>
        <Link
          href="/transactions"
          className="inline-block mt-4 text-blue-600 hover:text-blue-900"
        >
          Back to Transactions
        </Link>
      </div>
    );
  }

  // Format dates for the form
  const formattedTransaction = {
    ...transaction,
    date: transaction.date instanceof Date
      ? transaction.date.toISOString().split('T')[0]
      : new Date(transaction.date).toISOString().split('T')[0],
    dueDate: transaction.dueDate
      ? transaction.dueDate instanceof Date
        ? transaction.dueDate.toISOString().split('T')[0]
        : new Date(transaction.dueDate).toISOString().split('T')[0]
      : undefined,
    paymentDate: transaction.paymentDate
      ? transaction.paymentDate instanceof Date
        ? transaction.paymentDate.toISOString().split('T')[0]
        : new Date(transaction.paymentDate).toISOString().split('T')[0]
      : undefined,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/transactions" className="hover:text-gray-900">
            Transactions
          </Link>
          <span>/</span>
          <span className="text-gray-900">Edit Transaction</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Transaction</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update transaction details for {transaction.payee}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <TransactionForm mode="edit" initialData={formattedTransaction} />
      </div>
    </div>
  );
}
