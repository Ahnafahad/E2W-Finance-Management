import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateInvoiceForTransaction } from '@/lib/pdf/invoice-generator';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Transaction IDs required' },
        { status: 400 }
      );
    }

    // Create ZIP file
    const zip = new AdmZip();

    // Generate invoices and add to ZIP
    for (const id of transactionIds) {
      try {
        const pdfBytes = await generateInvoiceForTransaction(id, prisma);

        const transaction = await prisma.transaction.findUnique({
          where: { id },
        });

        if (transaction) {
          const date = new Date(transaction.date);
          const month = date.toLocaleString('default', { month: 'short' });
          const safePayee = transaction.payee.replace(/[^a-zA-Z0-9 ]/g, '').trim();
          const filename = `Invoice_${safePayee}_${month}.pdf`;

          zip.addFile(filename, Buffer.from(pdfBytes));
        }
      } catch (error) {
        console.error(`Failed to generate invoice for ${id}:`, error);
      }
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(Buffer.from(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="invoices.zip"',
      },
    });
  } catch (error) {
    console.error('Bulk invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoices' },
      { status: 500 }
    );
  }
}
