/**
 * Payment tracking utilities
 * Manages partial payments and payment status calculations
 */

import { prisma } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';
import { roundCurrency } from './financial';

/**
 * Calculate total paid amount for a transaction
 *
 * @param transactionId - Transaction ID
 * @returns Total paid amount in BDT
 */
export async function calculateTotalPaid(transactionId: string): Promise<number> {
  const payments = await prisma.payment.findMany({
    where: { transactionId },
  });

  const total = payments.reduce((sum, payment) => sum + payment.amountBDT, 0);
  return roundCurrency(total);
}

/**
 * Determine payment status based on paid amount vs total amount
 *
 * @param totalAmount - Total transaction amount in BDT
 * @param paidAmount - Total paid amount in BDT
 * @param dueDate - Due date of the transaction
 * @returns Appropriate payment status
 */
export function determinePaymentStatus(
  totalAmount: number,
  paidAmount: number,
  dueDate?: Date | null
): PaymentStatus {
  const roundedTotal = roundCurrency(totalAmount);
  const roundedPaid = roundCurrency(paidAmount);

  // Fully paid
  if (roundedPaid >= roundedTotal) {
    return 'PAID';
  }

  // Partially paid
  if (roundedPaid > 0) {
    return 'PARTIALLY_PAID';
  }

  // Unpaid and overdue
  if (dueDate && new Date() > dueDate) {
    return 'OVERDUE';
  }

  // Unpaid
  return 'UNPAID';
}

/**
 * Update transaction payment status based on payments
 *
 * @param transactionId - Transaction ID
 * @returns Updated transaction
 */
export async function updateTransactionPaymentStatus(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { payments: true },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const totalPaid = await calculateTotalPaid(transactionId);
  const newStatus = determinePaymentStatus(
    transaction.amountBDT,
    totalPaid,
    transaction.dueDate
  );

  // Only update if status changed
  if (newStatus !== transaction.paymentStatus) {
    return await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: newStatus,
        // Set paymentDate to latest payment date when fully paid
        paymentDate: newStatus === 'PAID'
          ? transaction.payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]?.paymentDate
          : transaction.paymentDate,
      },
    });
  }

  return transaction;
}

/**
 * Get payment summary for a transaction
 *
 * @param transactionId - Transaction ID
 * @returns Payment summary with total, paid, and remaining amounts
 */
export async function getPaymentSummary(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { payments: true },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const totalPaid = await calculateTotalPaid(transactionId);
  const remaining = roundCurrency(transaction.amountBDT - totalPaid);

  return {
    totalAmount: transaction.amountBDT,
    totalPaid,
    remaining: remaining > 0 ? remaining : 0,
    paymentCount: transaction.payments.length,
    paymentStatus: transaction.paymentStatus,
    payments: transaction.payments.map(p => ({
      id: p.id,
      amount: p.amount,
      amountBDT: p.amountBDT,
      currency: p.currency,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      notes: p.notes,
    })),
  };
}
