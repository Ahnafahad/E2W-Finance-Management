import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createTransactionSchema, transactionFilterSchema } from '@/lib/validations/transaction';
import { Prisma } from '@prisma/client';
import { convertCurrency, roundCurrency, validateExchangeRate } from '@/lib/utils/financial';
import { createAuditLog, getUserInfoFromSession } from '@/lib/utils/audit';
import { authorize, getUserRole, Permission } from '@/lib/utils/rbac';

// GET /api/transactions - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    // Authentication check
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

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const filterParams = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      payee: searchParams.get('payee') || undefined,
      currency: searchParams.get('currency') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '50',
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    const filters = transactionFilterSchema.parse(filterParams);

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null, // Exclude soft-deleted transactions
    };

    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.paymentStatus = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.payee) {
      where.payee = { contains: filters.payee };
    }

    if (filters.currency && filters.currency !== 'ALL') {
      where.currency = filters.currency;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { payee: { contains: filters.search } },
        { description: { contains: filters.search } },
        { notes: { contains: filters.search } },
        { invoiceNumber: { contains: filters.search } },
      ];
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // Build order by clause
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    // Execute query
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / filters.pageSize);
    const hasNext = filters.page < totalPages;
    const hasPrev = filters.page > 1;

    return NextResponse.json({
      data: transactions,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    try {
      const userRole = getUserRole(session);
      authorize(userRole, Permission.TRANSACTION_CREATE);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createTransactionSchema.parse(body);

    // Validate exchange rate if provided
    if (validatedData.exchangeRate && validatedData.currency !== 'BDT') {
      const rateValidation = validateExchangeRate(
        validatedData.currency,
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
        console.warn(`[Transaction Creation] ${rateValidation.warning}`);
      }
    }

    // Convert date strings to Date objects for Prisma
    const date = typeof validatedData.date === 'string' ? new Date(validatedData.date) : validatedData.date;
    const dueDate = validatedData.dueDate
      ? (typeof validatedData.dueDate === 'string' ? new Date(validatedData.dueDate) : validatedData.dueDate)
      : null;
    const paymentDate = validatedData.paymentDate
      ? (typeof validatedData.paymentDate === 'string' ? new Date(validatedData.paymentDate) : validatedData.paymentDate)
      : null;

    // If exchange rate is provided but amountBDT isn't calculated, calculate it with proper rounding
    if (validatedData.currency !== 'BDT' && validatedData.exchangeRate && !validatedData.amountBDT) {
      validatedData.amountBDT = convertCurrency(validatedData.amount, validatedData.exchangeRate);
    }

    // If currency is BDT and amountBDT isn't set, set it to amount (with rounding for consistency)
    if (validatedData.currency === 'BDT' && !validatedData.amountBDT) {
      validatedData.amountBDT = roundCurrency(validatedData.amount);
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: validatedData.type,
        date,
        dueDate,
        category: validatedData.category,
        subcategory: validatedData.subcategory || null,
        payee: validatedData.payee,
        description: validatedData.description || null,
        amount: validatedData.amount,
        currency: validatedData.currency,
        exchangeRate: validatedData.exchangeRate || null,
        amountBDT: validatedData.amountBDT,
        paymentStatus: validatedData.paymentStatus || 'UNPAID',
        paymentDate,
        paymentMethod: validatedData.paymentMethod || null,
        invoiceNumber: validatedData.invoiceNumber || null,
        invoiceGenerated: validatedData.invoiceGenerated || false,
        invoiceUrl: validatedData.invoiceUrl || null,
        notes: validatedData.notes || null,
        tags: validatedData.tags || null,
        recurringTemplateId: validatedData.recurringTemplateId || null,
        createdBy: validatedData.createdBy || null,
      },
    });

    // Audit log: Transaction created
    const userInfo = getUserInfoFromSession(session);
    await createAuditLog({
      entityType: 'Transaction',
      entityId: transaction.id,
      action: 'CREATE',
      ...userInfo,
      metadata: {
        invoiceNumber: transaction.invoiceNumber,
        amount: transaction.amount,
        currency: transaction.currency,
        payee: transaction.payee,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return NextResponse.json(
        { error: 'Invalid transaction data', details: error },
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
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
