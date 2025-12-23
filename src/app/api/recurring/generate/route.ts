import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addMonths } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const generatedCount = { count: 0 };

    // Get active templates that need generation
    const templates = await prisma.recurringTemplate.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { nextScheduled: { lte: now } },
              { nextScheduled: null },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
    });

    for (const template of templates) {
      try {
        // Generate transaction
        const transactionDate = template.nextScheduled || now;

        // Calculate due date based on payment terms
        let dueDate = new Date(transactionDate);
        if (template.paymentTerms?.includes('10th of Following Month')) {
          dueDate = new Date(transactionDate);
          dueDate.setMonth(dueDate.getMonth() + 1);
          dueDate.setDate(10);
        } else {
          // End of month
          dueDate = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0);
        }

        // Get exchange rate for non-BDT currencies
        let amountBDT = template.amount;
        let exchangeRate: number | null = null;

        if (template.currency !== 'BDT') {
          // Try to get exchange rate from database
          const rate = await prisma.exchangeRate.findFirst({
            where: {
              fromCurrency: template.currency,
              toCurrency: 'BDT',
            },
            orderBy: {
              date: 'desc',
            },
          });

          if (rate) {
            exchangeRate = rate.rate;
            amountBDT = template.amount * rate.rate;
          } else {
            // Default exchange rates if not found
            const defaultRates: Record<string, number> = {
              USD: 110,
              GBP: 140,
              EUR: 120,
            };
            const rateValue = defaultRates[template.currency] || 1;
            exchangeRate = rateValue;
            amountBDT = template.amount * rateValue;
          }
        }

        // Create description that indicates which month's work this is for
        let description = template.description;
        if (template.paymentTerms?.toLowerCase().includes('10th of following month')) {
          // Transaction date is payment date, work was done in previous month
          const workMonth = new Date(transactionDate);
          workMonth.setMonth(workMonth.getMonth() - 1);
          const workMonthName = workMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
          description = `${template.description} - ${workMonthName}`;
        }

        const transaction = await prisma.transaction.create({
          data: {
            type: template.type,
            date: transactionDate,
            dueDate,
            category: template.category,
            subcategory: template.subcategory,
            payee: template.payee,
            amount: template.amount,
            currency: template.currency,
            exchangeRate,
            amountBDT,
            paymentStatus: 'UNPAID',
            description,
            recurringTemplateId: template.id,
          },
        });

        // Calculate next scheduled date
        let nextScheduled = new Date(transactionDate);

        switch (template.frequency) {
          case 'MONTHLY':
            nextScheduled = addMonths(nextScheduled, 1);
            break;
          case 'QUARTERLY':
            nextScheduled = addMonths(nextScheduled, 3);
            break;
          case 'YEARLY':
            nextScheduled = addMonths(nextScheduled, 12);
            break;
        }

        nextScheduled.setDate(template.dayOfMonth || 1);

        // Update template
        await prisma.recurringTemplate.update({
          where: { id: template.id },
          data: {
            lastGenerated: now,
            nextScheduled,
          },
        });

        generatedCount.count++;
      } catch (error) {
        console.error(`Failed to generate transaction for template ${template.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      generatedCount: generatedCount.count,
      message: `Generated ${generatedCount.count} transactions`,
    });
  } catch (error) {
    console.error('Recurring generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recurring transactions' },
      { status: 500 }
    );
  }
}
