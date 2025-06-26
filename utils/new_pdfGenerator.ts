import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';

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

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  gstin: string;
  email?: string;
  website?: string;
}

export async function generateInvoicePDF(data: InvoiceData) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Company information
  const companyInfo: CompanyInfo = {
    name: 'Shakti Mechanical Works',
    address: 'Near Panchratna Bldg. Kosamba (R.S.)',
    phone: '+91 98765XXXXX, +91 87654XXXXX',
    gstin: '24ABCDE1234F1Z5',
    email: 'info@shaktimechanical.com',
    // website: 'www.shaktimechanical.com'
  };

  // Page constants
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const fontSize = 10;
  const lineHeight = fontSize * 1.4;
  const headerHeight = 120;
  const footerHeight = 80;
  const contentStartY = pageHeight - headerHeight;
  const contentEndY = footerHeight + 20;

  // Load images with error handling
  let logoImg = null;
  let signatureImg = null;

  try {
    const logoBytes = await fetch('/logo.png').then(res => res.arrayBuffer());
    logoImg = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.warn('Logo not found, continuing without logo');
  }

  try {
    const signatureBytes = await fetch('/signature.png').then(res => res.arrayBuffer());
    signatureImg = await pdfDoc.embedPng(signatureBytes);
  } catch (error) {
    console.warn('Signature not found, continuing without signature');
  }

  // Helper functions
  const breakLines = (text: string, maxWidth: number, textFont = font) => {
    if (!text) return [''];
    
    // Handle newlines by splitting first, then processing each part
    const paragraphs = text.toString().split('\n');
    const allLines: string[] = [];
    
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const width = textFont.widthOfTextAtSize(testLine, fontSize);
        if (width <= maxWidth - 8) {
          line = testLine;
        } else {
          if (line) allLines.push(line);
          line = word;
          // Handle very long words that don't fit
          if (textFont.widthOfTextAtSize(word, fontSize) > maxWidth - 8) {
            let chars = '';
            for (const char of word) {
              const testChars = chars + char;
              if (textFont.widthOfTextAtSize(testChars, fontSize) <= maxWidth - 8) {
                chars = testChars;
              } else {
                if (chars) allLines.push(chars);
                chars = char;
              }
            }
            line = chars;
          }
        }
      }
      if (line) allLines.push(line);
    }
    return allLines.length > 0 ? allLines : [''];
  };

  const drawTextInCell = (page: PDFPage, lines: string[], x: number, y: number, width: number, height: number, textFont = font) => {
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

  const drawHeader = (page: PDFPage) => {
    let y = pageHeight - 20;

    // Sacred symbol "Shree" at top
    const shreeText = '॥ श्री ॥';
    try {
      page.drawText(shreeText, {
        x: pageWidth / 2 - font.widthOfTextAtSize(shreeText, 12) / 2,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.6, 0.1, 0.1),
      });
    } catch (error) {
      // Fallback to "Shree" if Unicode not supported
      page.drawText('Shree', {
        x: pageWidth / 2 - font.widthOfTextAtSize('Shree', 12) / 2,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.6, 0.1, 0.1),
      });
    }

    y -= 25;

    // Logo (left side)
    if (logoImg) {
      page.drawImage(logoImg, { 
        x: margin, 
        y: y - 35, 
        width: 50, 
        height: 30 
      });
    }

    // Company name (center)
    page.drawText(companyInfo.name, {
      x: pageWidth / 2 - boldFont.widthOfTextAtSize(companyInfo.name, 18) / 2,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Phone numbers (right side)
    const phoneLines = companyInfo.phone.split(',');
    phoneLines.forEach((phone, i) => {
      page.drawText(phone.trim(), {
        x: pageWidth - 150,
        y: y - (i * 12),
        size: 9,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    });

    y -= 25;

    // Address (center)
    page.drawText(companyInfo.address, {
      x: pageWidth / 2 - font.widthOfTextAtSize(companyInfo.address, 12) / 2,
      y,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    y -= 15;

    // Additional contact info
    if (companyInfo.email) {
      page.drawText(`Email: ${companyInfo.email}`, {
        x: pageWidth / 2 - font.widthOfTextAtSize(`Email: ${companyInfo.email}`, 9) / 2,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Draw header separator line
    page.drawLine({
      start: { x: margin, y: contentStartY - 10 },
      end: { x: pageWidth - margin, y: contentStartY - 10 },
      thickness: 2,
      color: rgb(0.3, 0.3, 0.3),
    });
  };

  const drawFooter = (page: PDFPage, pageNumber: number, totalPages: number) => {
    const footerY = 60;

    // Draw footer separator line
    page.drawLine({
      start: { x: margin, y: footerY + 20 },
      end: { x: pageWidth - margin, y: footerY + 20 },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    // GSTIN (left)
    page.drawText(`GSTIN: ${companyInfo.gstin}`, {
      x: margin,
      y: footerY,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Terms and conditions (center)
    const termsText = 'Subject to Surat Jurisdiction | Payment due within 30 days';
    page.drawText(termsText, {
      x: pageWidth / 2 - font.widthOfTextAtSize(termsText, 8) / 2,
      y: footerY,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Page number (right)
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    page.drawText(pageText, {
      x: pageWidth - margin - font.widthOfTextAtSize(pageText, 9),
      y: footerY,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Signature (right side, above page number)
    if (signatureImg) {
      page.drawText('Authorized Signature:', {
        x: pageWidth - 140,
        y: footerY + 35,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      
      page.drawImage(signatureImg, {
        x: pageWidth - 130,
        y: footerY - 10,
        width: 80,
        height: 35,
      });
    }

    // Thank you message
    page.drawText('Thank you for your business!', {
      x: margin,
      y: 25,
      size: 9,
      font: boldFont,
      color: rgb(0.1, 0.5, 0.1),
    });
  };

  // Start creating the invoice
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = contentStartY - 30;
  let pageCount = 1;

  // Draw header on first page
  drawHeader(currentPage);

  // Invoice title
  currentPage.drawText('TAX INVOICE', {
    x: pageWidth / 2 - boldFont.widthOfTextAtSize('TAX INVOICE', 16) / 2,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.6),
  });

  currentY -= 40;

  // Invoice details section
  const detailsBoxHeight = 80;
  currentPage.drawRectangle({
    x: margin,
    y: currentY - detailsBoxHeight,
    width: pageWidth - (2 * margin),
    height: detailsBoxHeight,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  // Left column details
  currentPage.drawText(`Bill No: ${data.billNo}`, { x: margin + 10, y: currentY - 20, size: fontSize, font: boldFont });
  currentPage.drawText(`Client Name: ${data.clientName}`, { x: margin + 10, y: currentY - 35, size: fontSize, font });
  currentPage.drawText(`Order No: ${data.orderNo || 'N/A'}`, { x: margin + 10, y: currentY - 50, size: fontSize, font });
  currentPage.drawText(`Challan No: ${data.challanNo || 'N/A'}`, { x: margin + 10, y: currentY - 65, size: fontSize, font });

  // Right column details
  currentPage.drawText(`Date: ${data.invoiceDate}`, { x: pageWidth - 200, y: currentY - 20, size: fontSize, font: boldFont });
  currentPage.drawText(`GST No: ${data.gstNo || 'N/A'}`, { x: pageWidth - 200, y: currentY - 35, size: fontSize, font });

  currentY -= detailsBoxHeight + 20;

  // Table headers
  const headers = ['Sr.', 'Description', 'HSN', 'Qty', 'Rate', 'Discount', 'Amount'];
  const colWidths = [35, 200, 55, 40, 65, 65, 75];
  const colXs = colWidths.reduce((acc, w, i) => {
    acc.push(i === 0 ? margin : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, [] as number[]);

  const tableHeaderHeight = 25;

  const drawTableHeader = (page: PDFPage, y: number) => {
    headers.forEach((header, i) => {
      page.drawRectangle({
        x: colXs[i],
        y,
        width: colWidths[i],
        height: tableHeaderHeight,
        color: rgb(0.2, 0.2, 0.2),
        borderColor: rgb(0.1, 0.1, 0.1),
        borderWidth: 1,
      });
      
      page.drawText(header, {
        x: colXs[i] + 4,
        y: y + (tableHeaderHeight - fontSize) / 2,
        size: fontSize,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
    });
    return y - tableHeaderHeight;
  };

  currentY = drawTableHeader(currentPage, currentY);

  let subtotal = 0;
  const pages = [currentPage];

  // Draw items
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
      item.hsn || 'N/A',
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

    // Check if we need a new page
    if (currentY - rowHeight < contentEndY + 100) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pages.push(currentPage);
      pageCount++;
      drawHeader(currentPage);
      currentY = contentStartY - 20;
      currentY = drawTableHeader(currentPage, currentY);
    }

    // Draw row cells
    colXs.forEach((x, j) => {
      currentPage.drawRectangle({
        x,
        y: currentY - rowHeight,
        width: colWidths[j],
        height: rowHeight,
        color: i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
      });
    });

    // Draw text content
    colXs.forEach((x, j) => {
      const textFont = j === 0 ? boldFont : font;
      drawTextInCell(currentPage, linesPerCell[j], x, currentY - rowHeight, colWidths[j], rowHeight, textFont);
    });

    currentY -= rowHeight;
  }

  // Totals section
  const sgst = subtotal * (data.gstRate / 100);
  const cgst = sgst;
  const total = subtotal + sgst + cgst;

  currentY -= 20;
  const totalsX = pageWidth - 220;
  const totalsWidth = 180;
  const totalsHeight = 120;

  // Check if totals section fits on current page
  if (currentY - totalsHeight < contentEndY) {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(currentPage);
    pageCount++;
    drawHeader(currentPage);
    currentY = contentStartY - 50;
  }

  // Draw totals box
  currentPage.drawRectangle({
    x: totalsX,
    y: currentY - totalsHeight,
    width: totalsWidth,
    height: totalsHeight,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1,
  });

  // Totals text
  currentPage.drawText(`Subtotal: Rs. ${subtotal.toFixed(2)}`, { 
    x: totalsX + 10, y: currentY - 25, size: fontSize, font 
  });
  currentPage.drawText(`SGST (${data.gstRate}%): Rs. ${sgst.toFixed(2)}`, { 
    x: totalsX + 10, y: currentY - 45, size: fontSize, font 
  });
  currentPage.drawText(`CGST (${data.gstRate}%): Rs. ${cgst.toFixed(2)}`, { 
    x: totalsX + 10, y: currentY - 65, size: fontSize, font 
  });
  
  // Total amount with emphasis
  currentPage.drawRectangle({
    x: totalsX + 5,
    y: currentY - 95,
    width: totalsWidth - 10,
    height: 25,
    color: rgb(0.1, 0.1, 0.6),
  });
  
  currentPage.drawText(`TOTAL: Rs. ${total.toFixed(2)}`, { 
    x: totalsX + 10, y: currentY - 88, size: fontSize + 2, font: boldFont, color: rgb(1, 1, 1) 
  });

  // Amount in words
//   const numberToWords = (num: number): string => {
//     // Simple implementation - you might want to use a library for this
//     const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//     const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//     const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
//     if (num === 0) return 'Zero';
//     if (num < 10) return ones[num];
//     if (num < 20) return teens[num - 10];
//     if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
//     if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    
//     return 'Amount'; // Fallback for complex numbers
//   };

//   const amountInWords = `Amount in Words: ${numberToWords(Math.floor(total))} Rupees${total % 1 ? ' and ' + Math.round((total % 1) * 100) + ' Paise' : ''} Only`;
  
  currentY -= 140;
//   if (currentY > contentEndY + 20) {
//     const wordLines = breakLines(amountInWords, pageWidth - (2 * margin));
//     wordLines.forEach((line, i) => {
//       currentPage.drawText(line, {
//         x: margin,
//         y: currentY - (i * lineHeight),
//         size: fontSize,
//         font: boldFont,
//         color: rgb(0.2, 0.2, 0.2),
//       });
//     });
//   }

  // Draw footers on all pages
  pages.forEach((page, index) => {
    drawFooter(page, index + 1, pageCount);
  });

  // Generate and download PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Invoice_${data.billNo}_${data.clientName.replace(/\s+/g, '_')}.pdf`;
  link.click();
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}