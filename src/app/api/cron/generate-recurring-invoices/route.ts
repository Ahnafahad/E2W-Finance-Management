import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addMonths } from 'date-fns';

/**
 * Vercel Cron Job endpoint for automatic recurring invoice generation
 * This endpoint is called daily by Vercel Cron to generate scheduled invoices
 *
 * Security: Uses CRON_SECRET environment variable for authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`[Cron] Starting recurring invoice generation at ${now.toISOString()}`);

    // Find all active recurring templates that are ready to generate
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
      include: {
        user: true,
      },
    });

    console.log(`[Cron] Found ${templates.length} templates ready for generation`);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Generate transactions for each template
    for (const template of templates) {
      try {
        const transactionDate = new Date();

        // Calculate due date based on payment terms
        let dueDate: Date;
        if (template.paymentTerms?.includes('10th of Following Month')) {
          dueDate = new Date(transactionDate);
          dueDate.setMonth(dueDate.getMonth() + 1);
          dueDate.setDate(10);
        } else {
          // Default to end of current month
          dueDate = new Date(
            transactionDate.getFullYear(),
            transactionDate.getMonth() + 1,
            0
          );
        }

        // Create transaction from template
        const transaction = await prisma.transaction.create({
          data: {
            date: transactionDate,
            amount: template.amount,
            currency: template.currency,
            type: template.type,
            category: template.category,
            subcategory: template.subcategory || '',
            description: template.description,
            paymentMethod: template.paymentMethod || 'BANK_TRANSFER',
            clientName: template.clientName,
            email: template.email,
            phone: template.phone,
            address: template.address,
            invoiceGenerated: true,
            projectName: template.projectName,
            duration: template.duration,
            notes: template.notes,
            lineItemsJson: template.lineItemsJson,
            paymentTerms: template.paymentTerms,
            userId: template.userId,
            recurringTemplateId: template.id,
          },
        });

        // Calculate next scheduled date
        let nextScheduled = template.nextScheduled || template.startDate;

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
          case 'CUSTOM':
            // For custom, use the interval if provided, otherwise default to monthly
            nextScheduled = addMonths(nextScheduled, 1);
            break;
        }

        // Set the day of month
        if (template.dayOfMonth) {
          nextScheduled.setDate(template.dayOfMonth);
        }

        // Update template with next scheduled date
        await prisma.recurringTemplate.update({
          where: { id: template.id },
          data: {
            lastGenerated: now,
            nextScheduled: nextScheduled,
          },
        });

        console.log(`[Cron] Generated transaction ${transaction.id} from template ${template.id}`);
        results.success++;
      } catch (error) {
        const errorMsg = `Template ${template.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Cron] ${errorMsg}`);
        results.failed++;
        results.errors.push(errorMsg);
      }
    }

    console.log(`[Cron] Completed: ${results.success} successful, ${results.failed} failed`);

    return NextResponse.json({
      message: 'Recurring invoice generation completed',
      timestamp: now.toISOString(),
      templatesProcessed: templates.length,
      results,
    });
  } catch (error) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
