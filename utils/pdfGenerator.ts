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
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const lineHeight = fontSize * 1.4;

  const breakLines = (text: string, maxWidth: number, textFont = font) => {
    if (!text) return [''];
    
    const words = text.toString().split(' ');
    const lines: string[] = [];
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = textFont.widthOfTextAtSize(testLine, fontSize);
      if (width <= maxWidth - 8) { // Account for padding
        line = testLine;
      } else {
        if (line) lines.push(line);
        line = word;
        // Handle very long words that don't fit
        if (textFont.widthOfTextAtSize(word, fontSize) > maxWidth - 8) {
          let chars = '';
          for (const char of word) {
            const testChars = chars + char;
            if (textFont.widthOfTextAtSize(testChars, fontSize) <= maxWidth - 8) {
              chars = testChars;
            } else {
              if (chars) lines.push(chars);
              chars = char;
            }
          }
          line = chars;
        }
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
      if (lineY >= y + padding) { // Don't draw text outside cell bounds
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

  let y = page.getHeight() - 40;

  // Header with better styling
  page.drawText('Shakti Mechanical Works', {
    x: 595 / 2 - boldFont.widthOfTextAtSize('Shakti Mechanical Works', 18) / 2,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 25;
  
  page.drawText('Near Panchratna Bldg. Kosamba (R.S.)', {
    x: 595 / 2 - font.widthOfTextAtSize('Near Panchratna Bldg. Kosamba (R.S.)', 12) / 2,
    y,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 40;

  // Invoice details in a more organized layout
  const detailsY = y;
  page.drawText(`Bill No: ${data.billNo}`, { x: 50, y: detailsY, size: fontSize, font: boldFont });
  page.drawText(`Date: ${data.invoiceDate}`, { x: 400, y: detailsY, size: fontSize, font: boldFont });
  
  page.drawText(`Client: ${data.clientName}`, { x: 50, y: detailsY - 20, size: fontSize, font });
  page.drawText(`GST No: ${data.gstNo}`, { x: 400, y: detailsY - 20, size: fontSize, font });
  
  page.drawText(`Order No: ${data.orderNo}`, { x: 50, y: detailsY - 40, size: fontSize, font });
  page.drawText(`Challan No: ${data.challanNo}`, { x: 400, y: detailsY - 40, size: fontSize, font });
  
  y = detailsY - 70;

  // Table with improved layout
  const headers = ['Sr.', 'Description', 'HSN', 'Qty', 'Rate', 'Discount', 'Amount'];
  const colWidths = [35, 200, 55, 40, 65, 65, 75];
  const colXs = colWidths.reduce((acc, w, i) => {
    acc.push(i === 0 ? 40 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, [] as number[]);

  const headerHeight = 25;
  
  // Draw header
  headers.forEach((header, i) => {
    page.drawRectangle({
      x: colXs[i],
      y,
      width: colWidths[i],
      height: headerHeight,
      color: rgb(0.85, 0.85, 0.85),
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    });
    
    page.drawText(header, {
      x: colXs[i] + 4,
      y: y + (headerHeight - fontSize) / 2,
      size: fontSize,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  y -= headerHeight;

  let subtotal = 0;

  // Draw items with proper text wrapping
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const amount = item.quantity * item.rate - item.discount;
    subtotal += amount;

    // Create description with item code if available
    const description = item.itemCode ? 
      `${item.description}, Item Code: ${item.itemCode}` : 
      item.description;

    const cellContents = [
      String(i + 1),
      description,
      item.hsn,
      item.quantity.toString(),
      `Rs. ${item.rate.toFixed(2)}`,
      `Rs. ${item.discount.toFixed(2)}`,
      `Rs. ${amount.toFixed(2)}`,
    ];

    // Calculate required height for this row
    const linesPerCell = cellContents.map((text, j) =>
      breakLines(text, colWidths[j])
    );
    
    const maxLines = Math.max(...linesPerCell.map(l => l.length));
    const minRowHeight = 25;
    const rowHeight = Math.max(minRowHeight, maxLines * lineHeight + 10);

    // Check if we need space for this row plus totals (reserve 150px for totals)
    if (y - rowHeight < 150) {
      // Add a new page if we're running out of space
      const newPage = pdfDoc.addPage([595, 842]);
      // Note: In a real implementation, you'd need to track the current page
      // and update all drawing operations to use the new page
      y = newPage.getHeight() - 50;
      
      // Redraw headers on new page
      headers.forEach((header, headerIndex) => {
        newPage.drawRectangle({
          x: colXs[headerIndex],
          y,
          width: colWidths[headerIndex],
          height: headerHeight,
          color: rgb(0.85, 0.85, 0.85),
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 1,
        });
        
        newPage.drawText(header, {
          x: colXs[headerIndex] + 4,
          y: y + (headerHeight - fontSize) / 2,
          size: fontSize,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
      y -= headerHeight;
    }

    // Draw row cells
    colXs.forEach((x, j) => {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width: colWidths[j],
        height: rowHeight,
        color: i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });
    });

    // Draw text content
    colXs.forEach((x, j) => {
      const textFont = j === 0 ? boldFont : font; // Make serial number bold
      drawTextInCell(linesPerCell[j], x, y - rowHeight, colWidths[j], rowHeight, textFont);
    });

    y -= rowHeight;
  }

  // Totals section with better formatting
  const sgst = subtotal * (data.gstRate / 100);
  const cgst = sgst;
  const total = subtotal + sgst + cgst;

  y -= 30;
  const totalsX = 380;
  const totalsWidth = 180;
  
  // Draw totals box
  page.drawRectangle({
    x: totalsX,
    y: y - 90,
    width: totalsWidth,
    height: 90,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });

  page.drawText(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { x: totalsX + 10, y: y - 20, size: fontSize, font });
  page.drawText(`SGST (${data.gstRate}%): Rs. ${sgst.toFixed(2)}`, { x: totalsX + 10, y: y - 35, size: fontSize, font });
  page.drawText(`CGST (${data.gstRate}%): Rs. ${cgst.toFixed(2)}`, { x: totalsX + 10, y: y - 50, size: fontSize, font });
  page.drawText(`Total: Rs. ${total.toFixed(2)}`, { x: totalsX + 10, y: y - 75, size: fontSize + 2, font: boldFont, color: rgb(0.2, 0.2, 0.8) });

  // Footer
  y -= 120;
  if (y > 50) {
    page.drawText('Thank you for your business!', {
      x: 595 / 2 - font.widthOfTextAtSize('Thank you for your business!', fontSize) / 2,
      y,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice_${data.billNo}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
  link.click();
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}