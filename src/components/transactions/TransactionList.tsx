'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';

interface Transaction {
  id: string;
  type: string;
  date: Date | string;
  payee: string;
  category: string;
  subcategory?: string | null;
  amount: number;
  currency: string;
  amountBDT: number;
  paymentStatus: string;
  paymentDate?: Date | string | null;
  invoiceNumber?: string | null;
  description?: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

export function TransactionList({ transactions, onDelete, onUpdate }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleQuickMarkPaid = async (id: string) => {
    setMarkingPaidId(id);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'PAID',
          paymentDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as paid');
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Failed to mark as paid');
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Mark ${selectedIds.size} transaction(s) as PAID?`)) {
      return;
    }

    setBulkUpdating(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const updates = Array.from(selectedIds).map(id =>
        fetch(`/api/transactions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            paymentDate: today,
          }),
        })
      );

      await Promise.all(updates);
      setSelectedIds(new Set());

      if (onUpdate) {
        onUpdate();
      }

      alert(`Successfully marked ${selectedIds.size} transaction(s) as PAID`);
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Failed to update some transactions');
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'UNPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_PAID':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    return type === 'INCOME'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-lg">No transactions found</p>
        <Link
          href="/transactions/new"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add First Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkMarkPaid}
              disabled={bulkUpdating}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              {bulkUpdating ? 'Updating...' : '✓ Mark as PAID'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount (BDT)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.has(transaction.id)}
                  onChange={() => handleToggleSelect(transaction.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(transaction.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(
                    transaction.type
                  )}`}
                >
                  {transaction.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {transaction.payee}
                </div>
                {transaction.description && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {transaction.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{transaction.category}</div>
                {transaction.subcategory && (
                  <div className="text-sm text-gray-500">{transaction.subcategory}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(transaction.amount, transaction.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(transaction.amountBDT, 'BDT')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                    transaction.paymentStatus
                  )}`}
                >
                  {transaction.paymentStatus.replace('_', ' ')}
                </span>
                {transaction.paymentDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Paid: {formatDate(transaction.paymentDate)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {transaction.invoiceNumber || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  {transaction.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => handleQuickMarkPaid(transaction.id)}
                      disabled={markingPaidId === transaction.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs font-medium"
                      title="Mark as paid today"
                    >
                      {markingPaidId === transaction.id ? '...' : '✓ Paid'}
                    </button>
                  )}
                  <Link
                    href={`/transactions/${transaction.id}/edit`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deletingId === transaction.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === transaction.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
