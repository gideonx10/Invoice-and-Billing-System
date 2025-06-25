import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 10;
  const lineHeight = fontSize * 1.2;

  const breakLines = (text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width < maxWidth) {
        line = testLine;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const drawCenteredLines = (
    lines: string[],
    x: number,
    y: number,
    boxHeight: number
  ) => {
    const totalTextHeight = lines.length * lineHeight;
    const topY = y + boxHeight - ((boxHeight - totalTextHeight) / 2) - fontSize;
    lines.forEach((line, i) => {
      page.drawText(line, {
        x,
        y: topY - i * lineHeight,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
  };

  let y = page.getHeight() - 40;

  // Header
  page.drawText('Shakti Mechanical Works', {
    x: 595 / 2 - font.widthOfTextAtSize('Shakti Mechanical Works', 16) / 2,
    y,
    size: 16,
    font,
  });
  y -= 20;
  page.drawText('Near Panchratna Bldg. Kosamba (R.S.)', {
    x: 595 / 2 - font.widthOfTextAtSize('Near Panchratna Bldg. Kosamba (R.S.)', 12) / 2,
    y,
    size: 12,
    font,
  });
  y -= 30;

  page.drawText(`Bill No: ${data.billNo}`, { x: 50, y, size: fontSize, font });
  page.drawText(`Date: ${data.invoiceDate}`, { x: 350, y, size: fontSize, font });
  y -= 20;
  page.drawText(`Client: ${data.clientName}`, { x: 50, y, size: fontSize, font });
  y -= 20;
  page.drawText(`Order No: ${data.orderNo}`, { x: 50, y, size: fontSize, font });
  page.drawText(`Challan No: ${data.challanNo}`, { x: 350, y, size: fontSize, font });
  y -= 20;
  page.drawText(`GST No: ${data.gstNo}`, { x: 50, y, size: fontSize, font });
  y -= 30;

  // Table
  const headers = ['Sr.', 'Description', 'HSN', 'Qty', 'Rate', 'Discount', 'Amount'];
  const colWidths = [30, 160, 60, 40, 60, 60, 70];
  const colXs = colWidths.reduce((acc, w, i) => {
    acc.push(i === 0 ? 50 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, [] as number[]);

  const headerHeight = lineHeight + 6;
  headers.forEach((header, i) => {
    page.drawRectangle({
      x: colXs[i],
      y,
      width: colWidths[i],
      height: headerHeight,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.5,
    });
    page.drawText(header, {
      x: colXs[i] + 4,
      y: y + 4,
      size: fontSize,
      font,
    });
  });

  y -= headerHeight;

  let subtotal = 0;

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const amount = item.quantity * item.rate - item.discount;
    subtotal += amount;

    const description = `${item.description} (Item Code: ${item.itemCode})`;

    const cells = [
      String(i + 1),
      description,
      item.hsn,
      item.quantity.toString(),
      item.rate.toFixed(2),
      item.discount.toFixed(2),
      amount.toFixed(2),
    ];

    const linesPerCell = cells.map((text, j) =>
      breakLines(text, colWidths[j] - 8)
    );

    const maxLines = Math.max(...linesPerCell.map(l => l.length));
    const rowHeight = maxLines * lineHeight + 4;

    // Draw cells
    colXs.forEach((x, j) => {
      page.drawRectangle({
        x,
        y,
        width: colWidths[j],
        height: rowHeight,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.5,
      });
    });

    // Draw wrapped and vertically centered text
    colXs.forEach((x, j) => {
      drawCenteredLines(linesPerCell[j], x + 4, y, rowHeight);
    });

    y -= rowHeight;
  }

  // Totals
  const sgst = subtotal * (data.gstRate / 100);
  const cgst = sgst;
  const total = subtotal + sgst + cgst;

  const rightX = 595 - 200;
  y -= 30;
  page.drawText(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { x: rightX, y, size: fontSize, font });
  y -= 15;
  page.drawText(`SGST (${data.gstRate}%): Rs. ${sgst.toFixed(2)}`, { x: rightX, y, size: fontSize, font });
  y -= 15;
  page.drawText(`CGST (${data.gstRate}%): Rs. ${cgst.toFixed(2)}`, { x: rightX, y, size: fontSize, font });
  y -= 15;
  page.drawText(`Total: Rs. ${total.toFixed(2)}`, { x: rightX, y, size: fontSize, font });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice_${data.billNo}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
  link.click();
}
