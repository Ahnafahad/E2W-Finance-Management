import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Transaction {
  id: string;
  payee: string;
  category: string;
  amount: number;
  currency: string;
  amountBDT: number;
  date: Date;
  dueDate?: Date | null;
  paymentStatus: string;
  description?: string | null;
  invoiceNumber?: string | null;
  lineItemsJson?: string | null;
}

interface InvoiceLineItem {
  title: string;            // e.g., "Discovery & Strategy Phase"
  details?: string[];       // Optional bullet points like ["Initial consultation & 5 discovery meetings"]
  amount: number;           // Subtotal for this line item
}

interface InvoiceData {
  transaction: Transaction;
  isPaid: boolean;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems?: InvoiceLineItem[];  // Optional detailed breakdown
  duration?: string;              // Optional duration like "22 Oct – 23 Dec 2024"
  projectName?: string;           // Optional project name
}

function getInvoiceNumber(transaction: Transaction): string {
  if (transaction.invoiceNumber) {
    return transaction.invoiceNumber;
  }

  const date = new Date(transaction.date);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const hash = Math.abs(hashString(transaction.payee + month)) % 10000;
  return `INV-${month}-${hash.toString().padStart(4, '0')}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'BDT': 'BDT',
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
  };
  return symbols[currency] || currency;
}

function getInvoiceDate(transaction: Transaction): string {
  if (transaction.dueDate) {
    const dueDate = new Date(transaction.dueDate);
    return dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  const date = new Date(transaction.date);
  // Get end of month
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfMonth.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
  const { transaction, isPaid } = invoiceData;

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  const { width, height } = page.getSize();

  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const textColor = rgb(0.2, 0.2, 0.2);
  const lineColor = rgb(0.88, 0.88, 0.88);

  // Header Background (Black)
  page.drawRectangle({
    x: 0,
    y: height - 144, // 2 inches from top
    width: width,
    height: 144,
    color: black,
  });

  // Try to load and draw logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'e2w-white-logo.png');
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.3);

    page.drawImage(logoImage, {
      x: width - 180, // 2.5 inches from right
      y: height - 108, // Position in header
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (error) {
    // Logo not found, skip
    console.warn('Logo not found, skipping:', error);
  }

  // Invoice Title
  page.drawText('INVOICE', {
    x: 57.6, // 0.8 inch
    y: height - 86.4,
    size: 30,
    font: helveticaBold,
    color: white,
  });

  // Invoice Details
  const invoiceNumber = getInvoiceNumber(transaction);
  const invoiceDate = getInvoiceDate(transaction);

  page.drawText(`Invoice No: ${invoiceNumber}`, {
    x: 57.6,
    y: height - 115.2,
    size: 10,
    font: helveticaFont,
    color: white,
  });

  page.drawText(`Date: ${invoiceDate}`, {
    x: 57.6,
    y: height - 129.6,
    size: 10,
    font: helveticaFont,
    color: white,
  });

  // Optional: Project Name and Duration for detailed invoices
  let headerExtraLines = 0;
  if (invoiceData.projectName) {
    page.drawText(`Project: ${invoiceData.projectName}`, {
      x: 288,
      y: height - 115.2,
      size: 9,
      font: helveticaFont,
      color: white,
    });
    headerExtraLines++;
  }
  if (invoiceData.duration) {
    page.drawText(`Duration: ${invoiceData.duration}`, {
      x: 288,
      y: height - 115.2 - (headerExtraLines * 14.4),
      size: 9,
      font: helveticaFont,
      color: white,
    });
  }

  // Address Section
  const yAddress = height - 216; // 3 inches from top
  const isExpense = transaction.type === 'EXPENSE';

  // FROM / BILL FROM
  page.drawText(isExpense ? 'BILL FROM' : 'FROM', {
    x: 57.6,
    y: yAddress,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  page.drawText(isExpense ? transaction.payee : 'E2W', {
    x: 57.6,
    y: yAddress - 18,
    size: 12,
    font: helveticaFont,
    color: textColor,
  });

  // BILL TO / TO
  page.drawText(isExpense ? 'BILL TO' : 'TO', {
    x: 288,
    y: yAddress,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  page.drawText(isExpense ? 'E2W' : transaction.payee, {
    x: 288,
    y: yAddress - 18,
    size: 12,
    font: helveticaFont,
    color: textColor,
  });

  page.drawText('316, Wensley Road', {
    x: 288,
    y: yAddress - 32.4,
    size: 10,
    font: helveticaFont,
    color: textColor,
  });

  page.drawText('Reading, United Kingdom, RG16DR', {
    x: 288,
    y: yAddress - 43.2,
    size: 10,
    font: helveticaFont,
    color: textColor,
  });

  page.drawText('e2w.global', {
    x: 288,
    y: yAddress - 54,
    size: 10,
    font: helveticaFont,
    color: textColor,
  });

  // Table
  const yTable = height - 360; // 5 inches from top
  const currencySymbol = getCurrencySymbol(transaction.currency);
  const currencyLabel = transaction.currency === 'BDT' ? 'AMOUNT (BDT)' : `AMOUNT (${currencySymbol})`;

  // Table Header (Black background)
  page.drawRectangle({
    x: 57.6,
    y: yTable,
    width: width - 115.2,
    height: 28.8,
    color: black,
  });

  page.drawText('DESCRIPTION', {
    x: 72,
    y: yTable + 8.64,
    size: 10,
    font: helveticaBold,
    color: white,
  });

  page.drawText(currencyLabel, {
    x: width - 145,
    y: yTable + 8.64,
    size: 10,
    font: helveticaBold,
    color: white,
  });

  let currentY = yTable - 14.4; // Start position for rows

  // Check if we have detailed line items
  if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
    // Render detailed line items
    for (const item of invoiceData.lineItems) {
      currentY -= 14.4; // Space before item

      // Draw line item title (bold)
      page.drawText(item.title, {
        x: 72,
        y: currentY,
        size: 10,
        font: helveticaBold,
        color: textColor,
      });

      // Draw amount (subtotal)
      const itemAmountStr = item.amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const itemAmountWidth = helveticaFont.widthOfTextAtSize(itemAmountStr, 10);
      page.drawText(itemAmountStr, {
        x: width - 72 - itemAmountWidth,
        y: currentY,
        size: 10,
        font: helveticaFont,
        color: textColor,
      });

      currentY -= 11.52; // Space for details

      // Draw detail bullets if present
      if (item.details && item.details.length > 0) {
        for (const detail of item.details) {
          // Word wrap if detail is too long
          const maxWidth = 350; // Maximum width for detail text
          const words = detail.split(' ');
          let line = '';

          for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = helveticaFont.widthOfTextAtSize(testLine, 9);

            if (testWidth > maxWidth && line) {
              // Draw current line
              page.drawText(`• ${line}`, {
                x: 86.4, // Indented
                y: currentY,
                size: 9,
                font: helveticaFont,
                color: rgb(0.4, 0.4, 0.4),
              });
              currentY -= 10.8;
              line = word;
            } else {
              line = testLine;
            }
          }

          // Draw remaining line
          if (line) {
            page.drawText(`• ${line}`, {
              x: 86.4,
              y: currentY,
              size: 9,
              font: helveticaFont,
              color: rgb(0.4, 0.4, 0.4),
            });
            currentY -= 10.8;
          }
        }
      }

      currentY -= 7.2; // Space after item
    }

    // Draw separator line
    currentY -= 7.2;
    page.drawLine({
      start: { x: 57.6, y: currentY },
      end: { x: width - 57.6, y: currentY },
      thickness: 0.5,
      color: lineColor,
    });
  } else {
    // Single line item (legacy format)
    currentY -= 14.4;

    // Description
    const desc = transaction.category === 'OTHER EXPENSES'
      ? `${transaction.payee} - ${new Date(transaction.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
      : `${transaction.category} - ${new Date(transaction.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;

    page.drawText(desc, {
      x: 72,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });

    // Amount
    const displayAmount = transaction.currency === 'BDT' ? transaction.amountBDT : transaction.amount;
    const amountStr = displayAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const amountWidth = helveticaFont.widthOfTextAtSize(amountStr, 10);
    page.drawText(amountStr, {
      x: width - 72 - amountWidth,
      y: currentY,
      size: 10,
      font: helveticaFont,
      color: textColor,
    });

    currentY -= 14.4;

    // Bottom Line
    page.drawLine({
      start: { x: 57.6, y: currentY },
      end: { x: width - 57.6, y: currentY },
      thickness: 0.5,
      color: lineColor,
    });
  }

  // Total Section
  const yTotal = currentY - 28.8;

  page.drawText('TOTAL', {
    x: 288,
    y: yTotal,
    size: 14,
    font: helveticaBold,
    color: black,
  });

  // Calculate total from line items or use transaction amount
  const totalAmount = invoiceData.lineItems && invoiceData.lineItems.length > 0
    ? invoiceData.lineItems.reduce((sum, item) => sum + item.amount, 0)
    : (transaction.currency === 'BDT' ? transaction.amountBDT : transaction.amount);

  const totalAmountStr = totalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalStr = `${currencySymbol} ${totalAmountStr}`;
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 14);
  page.drawText(totalStr, {
    x: width - 72 - totalWidth,
    y: yTotal,
    size: 14,
    font: helveticaBold,
    color: black,
  });

  // PAID Stamp
  if (isPaid) {
    // Save state
    const stampX = width - 180;
    const stampY = 108;

    // Draw black rectangle
    page.drawRectangle({
      x: stampX - 86.4,
      y: stampY - 25.2,
      width: 172.8,
      height: 50.4,
      color: black,
      borderColor: black,
      borderWidth: 2,
    });

    // Draw inner outline
    page.drawRectangle({
      x: stampX - 82.8,
      y: stampY - 21.6,
      width: 165.6,
      height: 43.2,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 0.5,
    });

    // Draw PAID text
    const paidWidth = helveticaBold.widthOfTextAtSize('PAID', 36);
    page.drawText('PAID', {
      x: stampX - paidWidth / 2,
      y: stampY - 10,
      size: 36,
      font: helveticaBold,
      color: white,
    });
  }

  // Bottom decorative bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 36,
    color: black,
  });

  // Return PDF bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function generateInvoiceForTransaction(
  transactionId: string,
  prisma: any
): Promise<Uint8Array> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Check if transaction has modern invoice data (lineItemsJson)
  if (transaction.lineItemsJson) {
    // Use modern invoice generator
    const { generateModernInvoicePDF } = await import('./modern-invoice-generator');

    const lineItems = JSON.parse(transaction.lineItemsJson);
    const invoiceData = {
      type: transaction.type, // Pass transaction type (INCOME or EXPENSE)
      metadata: {
        client: transaction.payee,
        project: transaction.projectName || undefined,
        duration: transaction.duration || undefined,
        invoiceNumber: transaction.invoiceNumber || getInvoiceNumber(transaction),
        notes: transaction.notes || undefined,
      },
      currency: transaction.currency,
      lineItems: lineItems,
      totals: {
        total: transaction.currency === 'BDT' ? transaction.amountBDT : transaction.amount,
      },
      isPaid: transaction.paymentStatus === 'PAID',
      invoiceDate: getInvoiceDate(transaction),
    };

    return await generateModernInvoicePDF(invoiceData);
  }

  // Use legacy invoice generator
  const invoiceData: InvoiceData = {
    transaction,
    isPaid: transaction.paymentStatus === 'PAID',
    invoiceNumber: getInvoiceNumber(transaction),
    invoiceDate: getInvoiceDate(transaction),
  };

  return await generateInvoicePDF(invoiceData);
}
