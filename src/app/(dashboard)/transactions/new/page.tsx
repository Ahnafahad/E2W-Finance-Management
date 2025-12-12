import { TransactionForm } from '@/components/transactions/TransactionForm';
import Link from 'next/link';

export default function NewTransactionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/transactions" className="hover:text-gray-900">
            Transactions
          </Link>
          <span>/</span>
          <span className="text-gray-900">New Transaction</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Transaction</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new expense or income transaction
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <TransactionForm mode="create" />
      </div>
    </div>
  );
}
