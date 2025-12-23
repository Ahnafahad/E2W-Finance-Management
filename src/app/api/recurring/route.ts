import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.recurringTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('Recurring templates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      category,
      subcategory,
      payee,
      amount,
      currency,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
      paymentTerms,
      description,
      active,
    } = body;

    // Calculate next scheduled date
    // For "10th of following month" payment terms, the transaction is dated
    // one month after the work month (e.g., April work → May 10 transaction)
    const start = new Date(startDate);
    const nextScheduled = new Date(start);

    // Transaction date is one month after the start date
    nextScheduled.setMonth(nextScheduled.getMonth() + 1);
    nextScheduled.setDate(dayOfMonth);

    // If that date is in the past, move to next occurrence
    if (nextScheduled < new Date()) {
      nextScheduled.setMonth(nextScheduled.getMonth() + 1);
    }

    const template = await prisma.recurringTemplate.create({
      data: {
        name,
        type,
        category,
        subcategory,
        payee,
        amount,
        currency,
        frequency,
        dayOfMonth,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        paymentTerms,
        description,
        active: active ?? true,
        nextScheduled,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Recurring template creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring template' },
      { status: 500 }
    );
  }
}
