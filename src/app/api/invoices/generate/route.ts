import { NextRequest, NextResponse } from 'next/server';
import { generateModernInvoicePDF } from '@/lib/pdf/modern-invoice-generator';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json();

    // Validate required fields
    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Line items are required' },
        { status: 400 }
      );
    }

    if (!invoiceData.metadata?.client) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Calculate total from line items or use provided total
    const calculatedTotal = invoiceData.totals?.total ||
      invoiceData.lineItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    const currency = invoiceData.currency || 'GBP';

    // Get exchange rate for non-BDT currencies
    let amountBDT = calculatedTotal;
    let exchangeRate: number | null = null;

    if (currency !== 'BDT') {
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

      if (rate) {
        exchangeRate = rate.rate;
        amountBDT = calculatedTotal * rate.rate;
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
      }
    }

    // Generate invoice number if not provided
    let invoiceNumber = invoiceData.metadata?.invoiceNumber;
    if (!invoiceNumber) {
      const date = new Date();
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      invoiceNumber = `INV-${month}-${year}-${randomNum}`;
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        type: 'INCOME',
        date: new Date(),
        category: 'CLIENT INVOICE',
        payee: invoiceData.metadata.client,
        description: invoiceData.metadata.chargedTo
          ? `Invoice for ${invoiceData.metadata.client} - Charged to: ${invoiceData.metadata.chargedTo}`
          : `Invoice for ${invoiceData.metadata.client}`,
        amount: calculatedTotal,
        currency: currency,
        exchangeRate: exchangeRate,
        amountBDT: amountBDT,
        paymentStatus: 'UNPAID',
        invoiceNumber: invoiceNumber,
        invoiceGenerated: true,
        notes: invoiceData.metadata?.notes || null,

        // Store invoice metadata
        lineItemsJson: JSON.stringify(invoiceData.lineItems),
        projectName: invoiceData.metadata?.project || null,
        duration: invoiceData.metadata?.duration || null,
      },
    });

    // Update invoice data with generated invoice number
    const finalInvoiceData = {
      ...invoiceData,
      metadata: {
        ...invoiceData.metadata,
        invoiceNumber: invoiceNumber,
      },
    };

    // Generate PDF
    const pdfBytes = await generateModernInvoicePDF(finalInvoiceData);

    // Return PDF as response with transaction ID in header
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
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
