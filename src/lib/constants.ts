export const CURRENCIES = {
  BDT: { symbol: '৳', name: 'Bangladesh Taka' },
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  EUR: { symbol: '€', name: 'Euro' },
} as const;

export const TRANSACTION_TYPES = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
} as const;

export const PAYMENT_STATUSES = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
} as const;

export const PAYMENT_STATUS_COLORS = {
  UNPAID: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
} as const;

export const FREQUENCIES = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  CUSTOM: 'Custom',
} as const;

export const INVOICE_TYPES = {
  PAYABLE: 'Payable (To Vendor)',
  RECEIVABLE: 'Receivable (From Client)',
} as const;

export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const MONTH_YEAR_FORMAT = 'MMM yyyy';
