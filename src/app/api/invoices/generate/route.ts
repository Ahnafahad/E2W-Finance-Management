import { NextRequest, NextResponse } from 'next/server';
import { generateModernInvoicePDF } from '@/lib/pdf/modern-invoice-generator';

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

    // Generate PDF
    const pdfBytes = await generateModernInvoicePDF(invoiceData);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.metadata?.invoiceNumber || 'download'}.pdf"`,
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
