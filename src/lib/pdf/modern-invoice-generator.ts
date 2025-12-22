import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

// Adaptive JSON format interfaces
interface InvoiceMetadata {
  client?: string;
  project?: string;
  duration?: string;
  invoiceNumber?: string;
  notes?: string;
  billingAddress?: string[];
  fromName?: string;
  fromAddress?: string[];
}

interface LineItem {
  title: string;
  description?: string;
  details?: string[];
  quantity?: number;
  rate?: number;
  amount: number;
  category?: string; // For grouping
}

interface InvoiceTotals {
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total: number;
}

interface ModernInvoiceData {
  metadata?: InvoiceMetadata;
  lineItems: LineItem[];
  totals?: InvoiceTotals;

  // Legacy support
  transaction?: {
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
  };
  isPaid?: boolean;
  currency?: string;
  invoiceDate?: string;
}

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'BDT': '৳',
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
  };
  return symbols[currency] || currency;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Helper to add footer to each page
function addFooter(
  page: PDFPage,
  width: number,
  brandColor: any,
  regularFont: PDFFont,
  invoiceNumber: string
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 60,
    color: brandColor,
  });

  page.drawText('E2W Global', {
    x: 50,
    y: 35,
    size: 9,
    font: regularFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('e2w.global', {
    x: 50,
    y: 20,
    size: 8,
    font: regularFont,
    color: rgb(0.7, 0.7, 0.7),
  });

  page.drawText(`Invoice ${invoiceNumber}`, {
    x: width - 150,
    y: 28,
    size: 8,
    font: regularFont,
    color: rgb(0.6, 0.6, 0.6),
  });
}

// Helper to add a new page when needed
function addNewPage(
  pdfDoc: PDFDocument,
  width: number,
  brandColor: any,
  regularFont: PDFFont,
  invoiceNumber: string
): PDFPage {
  const newPage = pdfDoc.addPage([595.28, 841.89]);
  addFooter(newPage, width, brandColor, regularFont, invoiceNumber);
  return newPage;
}

export async function generateModernInvoicePDF(data: ModernInvoiceData): Promise<Uint8Array> {
  // Create PDF with modern design
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  const { width, height } = page.getSize();

  // Embed fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Modern color palette
  const brandColor = rgb(0.05, 0.05, 0.15); // Deep navy/black #0D0D26
  const accentColor = rgb(0.4, 0.45, 0.95); // Modern blue #6673F3
  const textPrimary = rgb(0.15, 0.15, 0.2); // Dark gray
  const textSecondary = rgb(0.5, 0.52, 0.55); // Medium gray
  const lineColor = rgb(0.93, 0.94, 0.95); // Light gray
  const bgLight = rgb(0.98, 0.98, 0.99); // Off-white

  // Extract data
  const currency = data.currency || data.transaction?.currency || 'GBP';
  const currencySymbol = getCurrencySymbol(currency);
  const isPaid = data.isPaid || false;

  // Invoice metadata
  const client = data.metadata?.client || data.transaction?.payee || 'Client';
  const project = data.metadata?.project || '';
  const duration = data.metadata?.duration || '';
  const invoiceNumber = data.metadata?.invoiceNumber || data.transaction?.invoiceNumber || 'INV-001';
  const invoiceDate = data.invoiceDate || (data.transaction?.date ? formatDate(data.transaction.date) : formatDate(new Date()));
  const notes = data.metadata?.notes || '';

  // Pagination constants
  const FOOTER_HEIGHT = 80; // Space reserved for footer
  const MIN_CONTENT_Y = FOOTER_HEIGHT + 20; // Minimum Y before needing new page

  // ============================================
  // HEADER SECTION - Modern minimal design
  // ============================================
  let currentY = height - 60;

  // Try to load logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'E2W-Black-Logo.png');
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoScale = 0.15; // Smaller, more subtle
    const logoDims = logoImage.scale(logoScale);

    page.drawImage(logoImage, {
      x: 50,
      y: currentY - 15,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (error) {
    // If no logo, draw company name
    page.drawText('E2W', {
      x: 50,
      y: currentY,
      size: 24,
      font: boldFont,
      color: brandColor,
    });
  }

  // Invoice title (top right)
  page.drawText('INVOICE', {
    x: width - 150,
    y: currentY + 5,
    size: 28,
    font: boldFont,
    color: brandColor,
  });

  currentY -= 60;

  // Thin accent line
  page.drawLine({
    start: { x: 50, y: currentY },
    end: { x: width - 50, y: currentY },
    thickness: 2,
    color: accentColor,
  });

  currentY -= 50;

  // ============================================
  // INVOICE INFO SECTION - Two column layout
  // ============================================

  // Left column - Bill To
  let leftY = currentY;
  page.drawText('BILL TO', {
    x: 50,
    y: leftY,
    size: 9,
    font: boldFont,
    color: textSecondary,
  });

  leftY -= 22;
  page.drawText(client, {
    x: 50,
    y: leftY,
    size: 14,
    font: boldFont,
    color: textPrimary,
  });

  if (project) {
    leftY -= 20;
    page.drawText(`Project: ${project}`, {
      x: 50,
      y: leftY,
      size: 10,
      font: regularFont,
      color: textSecondary,
    });
  }

  if (duration) {
    leftY -= 18;
    page.drawText(`Duration: ${duration}`, {
      x: 50,
      y: leftY,
      size: 10,
      font: regularFont,
      color: textSecondary,
    });
  }

  // Right column - Invoice Details
  const rightX = width - 200;
  let rightY = currentY;

  // Invoice number in accent color box
  page.drawRectangle({
    x: rightX - 10,
    y: rightY - 5,
    width: 160,
    height: 24,
    color: bgLight,
  });

  page.drawText('Invoice #', {
    x: rightX,
    y: rightY + 2,
    size: 9,
    font: regularFont,
    color: textSecondary,
  });

  page.drawText(invoiceNumber, {
    x: width - 50 - boldFont.widthOfTextAtSize(invoiceNumber, 11),
    y: rightY + 2,
    size: 11,
    font: boldFont,
    color: brandColor,
  });

  rightY -= 35;
  page.drawText('Issue Date', {
    x: rightX,
    y: rightY,
    size: 9,
    font: regularFont,
    color: textSecondary,
  });

  page.drawText(invoiceDate, {
    x: width - 50 - regularFont.widthOfTextAtSize(invoiceDate, 10),
    y: rightY,
    size: 10,
    font: regularFont,
    color: textPrimary,
  });

  // From section (right column, below invoice details)
  rightY -= 40;
  page.drawText('FROM', {
    x: rightX,
    y: rightY,
    size: 9,
    font: boldFont,
    color: textSecondary,
  });

  rightY -= 20;
  page.drawText('E2W', {
    x: rightX,
    y: rightY,
    size: 11,
    font: boldFont,
    color: textPrimary,
  });

  rightY -= 16;
  page.drawText('316 Wensley Road', {
    x: rightX,
    y: rightY,
    size: 9,
    font: regularFont,
    color: textSecondary,
  });

  rightY -= 14;
  page.drawText('Reading, RG1 6DR', {
    x: rightX,
    y: rightY,
    size: 9,
    font: regularFont,
    color: textSecondary,
  });

  rightY -= 14;
  page.drawText('United Kingdom', {
    x: rightX,
    y: rightY,
    size: 9,
    font: regularFont,
    color: textSecondary,
  });

  rightY -= 18;
  page.drawText('e2w.global', {
    x: rightX,
    y: rightY,
    size: 9,
    font: regularFont,
    color: accentColor,
  });

  currentY = Math.min(leftY, rightY) - 50;

  // ============================================
  // LINE ITEMS TABLE - Modern card-style design
  // ============================================

  // Table header background
  page.drawRectangle({
    x: 50,
    y: currentY - 28,
    width: width - 100,
    height: 28,
    color: bgLight,
  });

  // Table headers
  page.drawText('DESCRIPTION', {
    x: 60,
    y: currentY - 18,
    size: 9,
    font: boldFont,
    color: textPrimary,
  });

  page.drawText('AMOUNT', {
    x: width - 130,
    y: currentY - 18,
    size: 9,
    font: boldFont,
    color: textPrimary,
  });

  currentY -= 45;

  // Render line items with pagination support
  const lineItems = data.lineItems || [];
  let calculatedSubtotal = 0;

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    calculatedSubtotal += item.amount;

    // Check if we need a new page (estimate space needed for this item)
    const estimatedItemHeight = 18 + // title
      (item.description ? 16 : 0) +
      (item.details ? item.details.length * 14 : 0) +
      25; // padding

    if (currentY - estimatedItemHeight < MIN_CONTENT_Y) {
      // Add footer to current page
      addFooter(page, width, brandColor, regularFont, invoiceNumber);

      // Create new page
      page = addNewPage(pdfDoc, width, brandColor, regularFont, invoiceNumber);
      currentY = height - 80; // Start from top of new page

      // Re-draw table header on new page
      page.drawRectangle({
        x: 50,
        y: currentY - 28,
        width: width - 100,
        height: 28,
        color: bgLight,
      });

      page.drawText('DESCRIPTION', {
        x: 60,
        y: currentY - 18,
        size: 9,
        font: boldFont,
        color: textPrimary,
      });

      page.drawText('AMOUNT', {
        x: width - 130,
        y: currentY - 18,
        size: 9,
        font: boldFont,
        color: textPrimary,
      });

      currentY -= 45;
    }

    // Item title
    page.drawText(`${i + 1}. ${item.title}`, {
      x: 60,
      y: currentY,
      size: 11,
      font: boldFont,
      color: textPrimary,
    });

    // Item amount (right-aligned)
    const amountStr = item.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const amountText = `${currencySymbol}${amountStr}`;
    const amountWidth = regularFont.widthOfTextAtSize(amountText, 11);
    page.drawText(amountText, {
      x: width - 60 - amountWidth,
      y: currentY,
      size: 11,
      font: regularFont,
      color: textPrimary,
    });

    currentY -= 20;

    // Item description (if exists)
    if (item.description) {
      page.drawText(item.description, {
        x: 75,
        y: currentY,
        size: 9,
        font: regularFont,
        color: textSecondary,
      });
      currentY -= 16;
    }

    // Item details (bullet points)
    if (item.details && item.details.length > 0) {
      for (const detail of item.details) {
        // Check if we need a new page for this detail
        if (currentY - 14 < MIN_CONTENT_Y) {
          addFooter(page, width, brandColor, regularFont, invoiceNumber);
          page = addNewPage(pdfDoc, width, brandColor, regularFont, invoiceNumber);
          currentY = height - 80;
        }

        // Word wrap for long details
        const maxWidth = 380;
        const words = detail.split(' ');
        let line = '';

        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = regularFont.widthOfTextAtSize(testLine, 8.5);

          if (testWidth > maxWidth && line) {
            page.drawText(`• ${line}`, {
              x: 75,
              y: currentY,
              size: 8.5,
              font: regularFont,
              color: textSecondary,
            });
            currentY -= 13;

            // Check pagination for wrapped line
            if (currentY < MIN_CONTENT_Y) {
              addFooter(page, width, brandColor, regularFont, invoiceNumber);
              page = addNewPage(pdfDoc, width, brandColor, regularFont, invoiceNumber);
              currentY = height - 80;
            }

            line = word;
          } else {
            line = testLine;
          }
        }

        if (line) {
          page.drawText(`• ${line}`, {
            x: 75,
            y: currentY,
            size: 8.5,
            font: regularFont,
            color: textSecondary,
          });
          currentY -= 13;
        }
      }
    }

    // Space between items
    currentY -= 15;

    // Separator line (except for last item)
    if (i < lineItems.length - 1) {
      page.drawLine({
        start: { x: 60, y: currentY },
        end: { x: width - 60, y: currentY },
        thickness: 0.5,
        color: lineColor,
      });
      currentY -= 18;
    }
  }

  // ============================================
  // TOTALS SECTION - Modern summary box
  // ============================================

  currentY -= 35;

  const totals = data.totals || { total: calculatedSubtotal };
  const hasBreakdown = totals.subtotal !== undefined || totals.tax !== undefined || totals.discount !== undefined;

  const totalsBoxHeight = hasBreakdown ? 120 : 60;

  // Check if we need a new page for totals
  if (currentY - totalsBoxHeight < MIN_CONTENT_Y) {
    addFooter(page, width, brandColor, regularFont, invoiceNumber);
    page = addNewPage(pdfDoc, width, brandColor, regularFont, invoiceNumber);
    currentY = height - 80;
  }

  // Totals box background
  page.drawRectangle({
    x: width - 270,
    y: currentY - totalsBoxHeight + 10,
    width: 220,
    height: totalsBoxHeight,
    color: bgLight,
  });

  const totalsX = width - 250;
  let totalsY = currentY;

  // Show breakdown if available
  if (hasBreakdown) {
    if (totals.subtotal) {
      page.drawText('Subtotal', {
        x: totalsX,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: textSecondary,
      });

      const subtotalStr = `${currencySymbol}${totals.subtotal.toFixed(2)}`;
      const subtotalWidth = regularFont.widthOfTextAtSize(subtotalStr, 10);
      page.drawText(subtotalStr, {
        x: width - 70 - subtotalWidth,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: textPrimary,
      });

      totalsY -= 20;
    }

    if (totals.discount && totals.discount > 0) {
      page.drawText('Discount', {
        x: totalsX,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: textSecondary,
      });

      const discountStr = `-${currencySymbol}${totals.discount.toFixed(2)}`;
      const discountWidth = regularFont.widthOfTextAtSize(discountStr, 10);
      page.drawText(discountStr, {
        x: width - 70 - discountWidth,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: accentColor,
      });

      totalsY -= 20;
    }

    if (totals.tax && totals.tax > 0) {
      const taxLabel = totals.taxRate ? `Tax (${totals.taxRate}%)` : 'Tax';
      page.drawText(taxLabel, {
        x: totalsX,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: textSecondary,
      });

      const taxStr = `${currencySymbol}${totals.tax.toFixed(2)}`;
      const taxWidth = regularFont.widthOfTextAtSize(taxStr, 10);
      page.drawText(taxStr, {
        x: width - 70 - taxWidth,
        y: totalsY,
        size: 10,
        font: regularFont,
        color: textPrimary,
      });

      totalsY -= 20;
    }

    // Separator before total
    page.drawLine({
      start: { x: totalsX, y: totalsY + 5 },
      end: { x: width - 70, y: totalsY + 5 },
      thickness: 1,
      color: lineColor,
    });

    totalsY -= 12;
  }

  // Total amount
  page.drawText('TOTAL', {
    x: totalsX,
    y: totalsY,
    size: 12,
    font: boldFont,
    color: textPrimary,
  });

  const totalStr = `${currencySymbol}${totals.total.toFixed(2)}`;
  const totalWidth = boldFont.widthOfTextAtSize(totalStr, 16);
  page.drawText(totalStr, {
    x: width - 70 - totalWidth,
    y: totalsY - 2,
    size: 16,
    font: boldFont,
    color: brandColor,
  });

  // ============================================
  // PAID STAMP (if paid)
  // ============================================

  if (isPaid) {
    const stampX = 120;
    const stampY = currentY - 100;

    // Only draw if there's space
    if (stampY > MIN_CONTENT_Y) {
      page.drawRectangle({
        x: stampX - 45,
        y: stampY - 15,
        width: 90,
        height: 35,
        borderColor: accentColor,
        borderWidth: 3,
        opacity: 0.1,
      });

      page.drawText('PAID', {
        x: stampX - 30,
        y: stampY - 8,
        size: 24,
        font: boldFont,
        color: accentColor,
        opacity: 0.4,
      });
    }
  }

  // ============================================
  // FOOTER SECTION - Notes and thank you
  // ============================================

  let footerY = currentY - totalsBoxHeight - 40;

  // Check if notes fit on this page
  if (notes && footerY > MIN_CONTENT_Y + 60) {
    page.drawText('NOTES', {
      x: 50,
      y: footerY,
      size: 9,
      font: boldFont,
      color: textSecondary,
    });

    footerY -= 18;
    page.drawText(notes, {
      x: 50,
      y: footerY,
      size: 9,
      font: regularFont,
      color: textSecondary,
    });
  }

  // Add footer to final page
  addFooter(page, width, brandColor, regularFont, invoiceNumber);

  // Return PDF bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
