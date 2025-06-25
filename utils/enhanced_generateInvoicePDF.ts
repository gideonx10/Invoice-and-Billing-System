
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Define your invoice structure
interface Item {
  description: string;
  itemCode: string;
  hsn: string;
  quantity: number;
  rate: number;
  discount: number;
}

interface InvoiceData {
  billNo: string;
  clientName: string;
  orderNo: string;
  challanNo: string;
  gstNo: string;
  invoiceDate: string;
  gstRate: number;
  items: Item[];
}

export async function generateInvoicePDF(data: InvoiceData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed logo and signature
  const logoUrl = '/logo.png';
  const signatureUrl = '/signature.png';

  const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
  const signatureBytes = await fetch(signatureUrl).then(res => res.arrayBuffer());

  const logoImg = await pdfDoc.embedPng(logoBytes);
  const signatureImg = await pdfDoc.embedPng(signatureBytes);

  const fontSize = 10;
  const lineHeight = fontSize * 1.4;
  const pageWidth = 595;

  const breakLines = (text: string, maxWidth: number, textFont = font) => {
    if (!text) return [''];
    const words = text.toString().split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = textFont.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxWidth - 8) {
        line = testLine;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [''];
  };

  const drawTextInCell = (lines: string[], x: number, y: number, width: number, height: number, textFont = font) => {
    const padding = 4;
    const availableHeight = height - (2 * padding);
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + height - padding - fontSize - Math.max(0, (availableHeight - totalTextHeight) / 2);
    lines.forEach((line, i) => {
      const lineY = startY - (i * lineHeight);
      if (lineY >= y + padding) {
        page.drawText(line, {
          x: x + padding,
          y: lineY,
          size: fontSize,
          font: textFont,
          color: rgb(0, 0, 0),
        });
      }
    });
  };

  let y = 812;

  // Top Symbol
  page.drawText('॥ श्री ॥', {
    x: pageWidth / 2 - font.widthOfTextAtSize('॥ श्री ॥', 14) / 2,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.6, 0.1, 0.1),
  });

  y -= 30;

  // Logo
  page.drawImage(logoImg, { x: 40, y: y - 40, width: 50, height: 30 });

  // Header title
  page.drawText('Shakti Mechanical Works', {
    x: pageWidth / 2 - boldFont.widthOfTextAtSize('Shakti Mechanical Works', 18) / 2,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Mobile Numbers
  page.drawText('+91 98765XXXXX, +91 91234XXXXX', {
    x: pageWidth - 200,
    y,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  y -= 40;

  page.drawText('Near Panchratna Bldg. Kosamba (R.S.)', {
    x: pageWidth / 2 - font.widthOfTextAtSize('Near Panchratna Bldg. Kosamba (R.S.)', 12) / 2,
    y,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Footer GSTIN and Signature
  page.drawText('GSTIN: 24ABCDE1234F1Z5', {
    x: 40,
    y: 40,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawImage(signatureImg, {
    x: pageWidth - 130,
    y: 20,
    width: 90,
    height: 45,
  });

  // Note: You would continue the rest of your invoice drawing logic below
  // (table, items, totals, etc.)

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice_${data.billNo}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
  link.click();
}
