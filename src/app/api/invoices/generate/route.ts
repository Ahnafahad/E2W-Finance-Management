import { NextRequest, NextResponse } from 'next/server';
import { generateModernInvoicePDF } from '@/lib/pdf/modern-invoice-generator';
import { prisma } from '@/lib/db';
import { PaymentStatus, TransactionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] === INVOICE GENERATION REQUEST START ===`);

  try {
    console.log(`[${requestId}] Step 1: Parsing request body...`);
    const invoiceData = await request.json();
    console.log(`[${requestId}] Step 1 ✓: Request body parsed successfully`);
    console.log(`[${requestId}] Invoice Data Keys:`, Object.keys(invoiceData));
    console.log(`[${requestId}] Full Invoice Data:`, JSON.stringify(invoiceData, null, 2));

    // Get transaction type (default to INCOME for backward compatibility)
    const transactionType = invoiceData.type || 'INCOME';
    console.log(`[${requestId}] Step 2: Transaction Type = "${transactionType}"`);

    // Validate required fields
    console.log(`[${requestId}] Step 3: Validating line items...`);
    console.log(`[${requestId}] Line Items exists:`, !!invoiceData.lineItems);
    console.log(`[${requestId}] Line Items length:`, invoiceData.lineItems?.length);

    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      console.error(`[${requestId}] ✗ VALIDATION FAILED: Line items are required`);
      return NextResponse.json(
        { error: 'Line items are required' },
        { status: 400 }
      );
    }
    console.log(`[${requestId}] Step 3 ✓: Line items validated`);

    console.log(`[${requestId}] Step 4: Validating client/vendor name...`);
    console.log(`[${requestId}] Metadata exists:`, !!invoiceData.metadata);
    console.log(`[${requestId}] Client name:`, invoiceData.metadata?.client);

    if (!invoiceData.metadata?.client) {
      console.error(`[${requestId}] ✗ VALIDATION FAILED: ${transactionType === 'INCOME' ? 'Client' : 'Vendor'} name is required`);
      return NextResponse.json(
        { error: `${transactionType === 'INCOME' ? 'Client' : 'Vendor'} name is required` },
        { status: 400 }
      );
    }
    console.log(`[${requestId}] Step 4 ✓: Client/vendor name validated`);

    // Calculate total from line items or use provided total
    console.log(`[${requestId}] Step 5: Calculating total...`);
    console.log(`[${requestId}] Totals object:`, invoiceData.totals);
    console.log(`[${requestId}] Provided total:`, invoiceData.totals?.total);

    const calculatedTotal = invoiceData.totals?.total ||
      invoiceData.lineItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    console.log(`[${requestId}] Step 5 ✓: Calculated total = ${calculatedTotal}`);

    const currency = invoiceData.currency || 'GBP';
    console.log(`[${requestId}] Step 6: Currency = "${currency}"`);


    // Get exchange rate for non-BDT currencies
    let amountBDT = calculatedTotal;
    let exchangeRate: number | null = null;

    console.log(`[${requestId}] Step 7: Processing exchange rate...`);
    if (currency !== 'BDT') {
      console.log(`[${requestId}] Currency is not BDT, looking up exchange rate...`);
      // Try to get exchange rate from database
      const rate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: currency,
          toCurrency: 'BDT',
        },
        orderBy: {
          date: 'desc',
        },
      });

      console.log(`[${requestId}] Database exchange rate found:`, !!rate);
      if (rate) {
        exchangeRate = rate.rate;
        amountBDT = calculatedTotal * rate.rate;
        console.log(`[${requestId}] Using database rate: ${exchangeRate}`);
      } else {
        // Default exchange rates if not found
        const defaultRates: Record<string, number> = {
          USD: 110,
          GBP: 140,
          EUR: 120,
        };
        const rateValue = defaultRates[currency] || 1;
        exchangeRate = rateValue;
        amountBDT = calculatedTotal * rateValue;
        console.log(`[${requestId}] Using default rate: ${exchangeRate}`);
      }
      console.log(`[${requestId}] Step 7 ✓: Amount in BDT = ${amountBDT}`);
    } else {
      console.log(`[${requestId}] Step 7 ✓: Currency is BDT, no conversion needed`);
    }

    // Auto-generate unique invoice number
    console.log(`[${requestId}] Step 8: Generating unique invoice number...`);

    const date = new Date();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const prefix = transactionType === 'INCOME' ? 'INV' : 'EXP';

    // Find the highest invoice number with this prefix and date to ensure uniqueness
    const existingInvoices = await prisma.transaction.findMany({
      where: {
        invoiceNumber: {
          startsWith: `${prefix}-${month}-${year}-`
        }
      },
      select: {
        invoiceNumber: true
      },
      orderBy: {
        invoiceNumber: 'desc'
      },
      take: 1
    });

    let sequenceNum = 1;
    if (existingInvoices.length > 0 && existingInvoices[0].invoiceNumber) {
      // Extract the sequence number from the last invoice
      const lastInvoice = existingInvoices[0].invoiceNumber;
      const match = lastInvoice.match(/-(\d{4})$/);
      if (match) {
        sequenceNum = parseInt(match[1], 10) + 1;
      }
    }

    const invoiceNumber = `${prefix}-${month}-${year}-${sequenceNum.toString().padStart(4, '0')}`;
    console.log(`[${requestId}] Generated unique invoice number: ${invoiceNumber}`);
    console.log(`[${requestId}] Step 8 ✓: Invoice number = ${invoiceNumber}`);


    // Create transaction record
    console.log(`[${requestId}] Step 9: Creating transaction in database...`);
    const transactionData = {
      type: transactionType as TransactionType,
      date: new Date(),
      category: transactionType === 'INCOME' ? 'CLIENT INVOICE' : 'VENDOR INVOICE',
      payee: invoiceData.metadata.client,
      description: invoiceData.metadata.chargedTo
        ? `Invoice ${transactionType === 'INCOME' ? 'for' : 'from'} ${invoiceData.metadata.client}${invoiceData.metadata.chargedTo ? ` - ${transactionType === 'INCOME' ? 'Charged to' : 'Received by'}: ${invoiceData.metadata.chargedTo}` : ''}`
        : `Invoice ${transactionType === 'INCOME' ? 'for' : 'from'} ${invoiceData.metadata.client}`,
      amount: calculatedTotal,
      currency: currency,
      exchangeRate: exchangeRate,
      amountBDT: amountBDT,
      paymentStatus: PaymentStatus.UNPAID,
      invoiceNumber: invoiceNumber,
      invoiceGenerated: true,
      notes: invoiceData.metadata?.notes || null,

      // Store invoice metadata
      lineItemsJson: JSON.stringify(invoiceData.lineItems),
      projectName: invoiceData.metadata?.project || null,
      duration: invoiceData.metadata?.duration || null,
    };
    console.log(`[${requestId}] Transaction data to insert:`, JSON.stringify(transactionData, null, 2));

    const transaction = await prisma.transaction.create({
      data: transactionData,
    });
    console.log(`[${requestId}] Step 9 ✓: Transaction created with ID: ${transaction.id}`);

    // Update invoice data with generated invoice number
    console.log(`[${requestId}] Step 10: Preparing final invoice data for PDF...`);
    const finalInvoiceData = {
      ...invoiceData,
      metadata: {
        ...invoiceData.metadata,
        invoiceNumber: invoiceNumber,
      },
    };
    console.log(`[${requestId}] Final invoice data:`, JSON.stringify(finalInvoiceData, null, 2));

    // Generate PDF
    console.log(`[${requestId}] Step 11: Generating PDF...`);
    const pdfBytes = await generateModernInvoicePDF(finalInvoiceData);
    console.log(`[${requestId}] Step 11 ✓: PDF generated, size: ${pdfBytes.length} bytes`);

    // Return PDF as response with transaction ID in header
    console.log(`[${requestId}] Step 12: Returning PDF response...`);
    console.log(`[${requestId}] === INVOICE GENERATION SUCCESS ===`);
    console.log(`[${requestId}] Transaction ID: ${transaction.id}`);
    console.log(`[${requestId}] Invoice Number: ${invoiceNumber}`);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        'X-Transaction-Id': transaction.id,
        'X-Invoice-Number': invoiceNumber,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] === INVOICE GENERATION FAILED ===`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name);
    console.error(`[${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');

    // Try to log error properties
    if (error && typeof error === 'object') {
      const errorProps = Object.getOwnPropertyNames(error);
      console.error(`[${requestId}] Error properties:`, errorProps);
      errorProps.forEach(prop => {
        try {
          console.error(`[${requestId}] Error.${prop}:`, (error as any)[prop]);
        } catch (e) {
          console.error(`[${requestId}] Could not log Error.${prop}`);
        }
      });
    }

    // If it's a Prisma error, log details
    if (error && typeof error === 'object' && 'code' in error) {
      console.error(`[${requestId}] Prisma error code:`, (error as any).code);
      console.error(`[${requestId}] Prisma error meta:`, (error as any).meta);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId: requestId
      },
      { status: 500 }
    );
  }
}
