import { z } from 'zod';

// Enums matching Prisma schema
export const TransactionTypeEnum = z.enum(['EXPENSE', 'INCOME']);
export const CurrencyEnum = z.enum(['BDT', 'USD', 'GBP', 'EUR']);
export const PaymentStatusEnum = z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']);

// Full transaction schema
export const transactionSchema = z.object({
  type: TransactionTypeEnum,
  date: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  payee: z.string().min(1, 'Payee/Client name is required'),
  description: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  exchangeRate: z.number().positive().optional().nullable(),
  amountBDT: z.number().positive('Amount in BDT must be positive'),
  paymentStatus: PaymentStatusEnum,
  paymentDate: z.string().or(z.date()).optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  invoiceGenerated: z.boolean(),
  invoiceUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  recurringTemplateId: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If currency is not BDT, exchange rate is required
    if (data.currency !== 'BDT' && !data.exchangeRate) {
      return false;
    }
    return true;
  },
  {
    message: 'Exchange rate is required for non-BDT currencies',
    path: ['exchangeRate'],
  }
).refine(
  (data) => {
    // If payment status is PAID, payment date is required
    if (data.paymentStatus === 'PAID' && !data.paymentDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Payment date is required when marking transaction as PAID',
    path: ['paymentDate'],
  }
);

export type TransactionInput = z.infer<typeof transactionSchema>;

// Create and update schemas
export const createTransactionSchema = transactionSchema;
export const updateTransactionSchema = transactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// Filter schema
export const transactionFilterSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME', 'ALL']).optional(),
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'ALL']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  payee: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  search: z.string().optional(),
  currency: z.enum(['BDT', 'USD', 'GBP', 'EUR', 'ALL']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(['date', 'amount', 'payee', 'category', 'paymentStatus', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Type exports
export type TransactionType = z.infer<typeof TransactionTypeEnum>;
export type Currency = z.infer<typeof CurrencyEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
