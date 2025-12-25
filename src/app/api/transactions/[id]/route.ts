import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateTransactionSchema } from '@/lib/validations/transaction';
import { Prisma } from '@prisma/client';
import { convertCurrency, roundCurrency, validateExchangeRate } from '@/lib/utils/financial';
import { createAuditLog, getUserInfoFromSession, calculateChanges } from '@/lib/utils/audit';
import { authorize, getUserRole, Permission } from '@/lib/utils/rbac';

// GET /api/transactions/[id] - Get a single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    try {
      const userRole = getUserRole(session);
      authorize(userRole, Permission.TRANSACTION_READ);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: 403 }
      );
    }

    const { id} = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction is soft-deleted
    if (transaction.deletedAt) {
      return NextResponse.json(
        { error: 'Transaction has been deleted' },
        { status: 410 } // 410 Gone
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update a transaction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    try {
      const userRole = getUserRole(session);
      authorize(userRole, Permission.TRANSACTION_UPDATE);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateTransactionSchema.parse(body);

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Prevent updating deleted transactions
    if (existingTransaction.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot update a deleted transaction' },
        { status: 410 } // 410 Gone
      );
    }

    // Prevent changing financial amounts on PAID transactions
    if (existingTransaction.paymentStatus === 'PAID') {
      const financialFieldsBeingChanged = [
        validatedData.amount !== undefined && validatedData.amount !== existingTransaction.amount,
        validatedData.currency !== undefined && validatedData.currency !== existingTransaction.currency,
        validatedData.exchangeRate !== undefined && validatedData.exchangeRate !== existingTransaction.exchangeRate,
        validatedData.amountBDT !== undefined && validatedData.amountBDT !== existingTransaction.amountBDT,
      ];

      if (financialFieldsBeingChanged.some(changed => changed)) {
        return NextResponse.json(
          {
            error: 'Cannot modify financial amounts (amount, currency, exchangeRate, amountBDT) on a PAID transaction',
            hint: 'To modify amounts, first change the payment status to UNPAID or create a new transaction',
          },
          { status: 422 } // 422 Unprocessable Entity
        );
      }
    }

    // Validate exchange rate if being updated
    if (validatedData.exchangeRate !== undefined) {
      const currency = validatedData.currency || existingTransaction.currency;
      if (currency && currency !== 'BDT') {
        const rateValidation = validateExchangeRate(
          currency,
          'BDT',
          validatedData.exchangeRate
        );

        if (!rateValidation.isValid) {
          return NextResponse.json(
            { error: rateValidation.error },
            { status: 400 }
          );
        }

        // Log warning if rate is outside typical range
        if (rateValidation.warning) {
          console.warn(`[Transaction Update] ${rateValidation.warning}`);
        }
      }
    }

    // Calculate amountBDT if needed
    const updateData: any = { ...validatedData };

    // Convert date strings to Date objects for Prisma
    if (validatedData.date && typeof validatedData.date === 'string') {
      updateData.date = new Date(validatedData.date);
    }
    if (validatedData.dueDate && typeof validatedData.dueDate === 'string') {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.paymentDate && typeof validatedData.paymentDate === 'string') {
      updateData.paymentDate = new Date(validatedData.paymentDate);
    }

    // If currency or amount or exchangeRate changed, recalculate amountBDT
    if (
      (validatedData.currency && validatedData.currency !== 'BDT') ||
      validatedData.exchangeRate !== undefined ||
      validatedData.amount !== undefined
    ) {
      const currency = validatedData.currency || existingTransaction.currency;
      const amount = validatedData.amount ?? existingTransaction.amount;
      const exchangeRate = validatedData.exchangeRate ?? existingTransaction.exchangeRate;

      if (currency !== 'BDT' && exchangeRate) {
        updateData.amountBDT = convertCurrency(amount, exchangeRate);
      } else if (currency === 'BDT') {
        updateData.amountBDT = roundCurrency(amount);
      }
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    // Audit log: Transaction updated
    const userInfo = getUserInfoFromSession(session);
    const changes = calculateChanges(
      existingTransaction as Record<string, any>,
      transaction as Record<string, any>
    );

    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        entityType: 'Transaction',
        entityId: transaction.id,
        action: 'UPDATE',
        ...userInfo,
        changes,
        metadata: {
          invoiceNumber: transaction.invoiceNumber,
          fieldsChanged: Object.keys(changes),
        },
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      console.error('Zod validation error:', (error as any).issues);
      return NextResponse.json(
        { error: 'Invalid transaction data', details: (error as any).issues },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Invoice number already exists' },
          { status: 409 }
        );
      }
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    try {
      const userRole = getUserRole(session);
      authorize(userRole, Permission.TRANSACTION_DELETE);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Check if transaction exists and not already deleted
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (existingTransaction.deletedAt) {
      return NextResponse.json(
        { error: 'Transaction already deleted' },
        { status: 410 } // 410 Gone - resource deleted
      );
    }

    // Soft delete transaction - set deletedAt timestamp and deletedBy
    const deletedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user?.email || session.user?.name || 'unknown',
      },
    });

    // Audit log: Transaction deleted
    const userInfo = getUserInfoFromSession(session);
    await createAuditLog({
      entityType: 'Transaction',
      entityId: id,
      action: 'DELETE',
      ...userInfo,
      metadata: {
        invoiceNumber: existingTransaction.invoiceNumber,
        amount: existingTransaction.amount,
        currency: existingTransaction.currency,
        payee: existingTransaction.payee,
      },
    });

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
