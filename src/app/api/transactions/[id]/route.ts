import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { updateTransactionSchema } from '@/lib/validations/transaction';
import { Prisma } from '@prisma/client';

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

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
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
        updateData.amountBDT = amount * exchangeRate;
      } else if (currency === 'BDT') {
        updateData.amountBDT = amount;
      }
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

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

    const { id } = await params;
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

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
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
