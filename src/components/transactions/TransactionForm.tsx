'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  createTransactionSchema,
  type CreateTransactionInput,
  TransactionTypeEnum,
  CurrencyEnum,
  PaymentStatusEnum,
} from '@/lib/validations/transaction';

interface TransactionFormProps {
  initialData?: Partial<CreateTransactionInput> & { id?: string };
  mode: 'create' | 'edit';
}

export function TransactionForm({ initialData, mode }: TransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: initialData || {
      type: 'EXPENSE',
      currency: 'BDT',
      paymentStatus: 'UNPAID',
      invoiceGenerated: false,
      date: new Date().toISOString().split('T')[0] as any,
    },
  });

  const watchCurrency = watch('currency');
  const watchAmount = watch('amount');
  const watchExchangeRate = watch('exchangeRate');

  // Auto-calculate amountBDT when currency, amount, or exchange rate changes
  useEffect(() => {
    if (watchCurrency === 'BDT') {
      setValue('amountBDT', watchAmount || 0);
      setValue('exchangeRate', null as any);
    } else if (watchAmount && watchExchangeRate) {
      setValue('amountBDT', watchAmount * watchExchangeRate);
    }
  }, [watchCurrency, watchAmount, watchExchangeRate, setValue]);

  const onSubmit = async (data: CreateTransactionInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === 'create'
        ? '/api/transactions'
        : `/api/transactions/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transaction');
      }

      router.push('/transactions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            id="type"
            {...register('type')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TransactionTypeEnum.options.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Payee */}
        <div>
          <label htmlFor="payee" className="block text-sm font-medium text-gray-700 mb-1">
            Payee (Vendor/Client) *
          </label>
          <input
            type="text"
            id="payee"
            {...register('payee')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.payee && (
            <p className="mt-1 text-sm text-red-600">{errors.payee.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            {...register('date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            {...register('dueDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <input
            type="text"
            id="category"
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          <input
            type="text"
            id="subcategory"
            {...register('subcategory')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.subcategory && (
            <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            id="amount"
            {...register('amount')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency *
          </label>
          <select
            id="currency"
            {...register('currency')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CurrencyEnum.options.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
          )}
        </div>

        {/* Exchange Rate (only if not BDT) */}
        {watchCurrency !== 'BDT' && (
          <div>
            <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate ({watchCurrency} to BDT)
            </label>
            <input
              type="number"
              step="0.0001"
              id="exchangeRate"
              {...register('exchangeRate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.exchangeRate && (
              <p className="mt-1 text-sm text-red-600">{errors.exchangeRate.message}</p>
            )}
          </div>
        )}

        {/* Amount BDT */}
        <div>
          <label htmlFor="amountBDT" className="block text-sm font-medium text-gray-700 mb-1">
            Amount in BDT *
          </label>
          <input
            type="number"
            step="0.01"
            id="amountBDT"
            {...register('amountBDT')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly={watchCurrency === 'BDT'}
          />
          {errors.amountBDT && (
            <p className="mt-1 text-sm text-red-600">{errors.amountBDT.message}</p>
          )}
        </div>

        {/* Payment Status */}
        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status *
          </label>
          <select
            id="paymentStatus"
            {...register('paymentStatus')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PaymentStatusEnum.options.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          {errors.paymentStatus && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentStatus.message}</p>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date
          </label>
          <input
            type="date"
            id="paymentDate"
            {...register('paymentDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.paymentDate && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <input
            type="text"
            id="paymentMethod"
            {...register('paymentMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bank Transfer, Cash, Credit Card"
          />
          {errors.paymentMethod && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Invoice Number */}
        <div>
          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number
          </label>
          <input
            type="text"
            id="invoiceNumber"
            {...register('invoiceNumber')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.invoiceNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber.message}</p>
          )}
        </div>

        {/* Invoice URL */}
        <div>
          <label htmlFor="invoiceUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice URL
          </label>
          <input
            type="url"
            id="invoiceUrl"
            {...register('invoiceUrl')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.invoiceUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.invoiceUrl.message}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            {...register('tags')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., urgent, recurring, project-x"
          />
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Invoice Generated Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="invoiceGenerated"
          {...register('invoiceGenerated')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="invoiceGenerated" className="ml-2 block text-sm text-gray-700">
          Invoice Generated
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Transaction' : 'Update Transaction'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
