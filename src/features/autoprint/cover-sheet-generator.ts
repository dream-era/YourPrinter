import { CoverSheetData } from "./types";

/**
 * Generates automated 1-page Cover Sheet HTML payload for CUPS / Spooler printing
 */
export function generateCoverSheetHTML(data: CoverSheetData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cover Sheet - ${data.orderNumber}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #0f172a;
      background: #ffffff;
    }
    .header {
      border-bottom: 4px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #1e3a8a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .pin-box {
      border: 3px solid #10b981;
      background: #ecfdf5;
      padding: 20px;
      border-radius: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .pin-label {
      font-size: 11px;
      font-weight: 700;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .pin-code {
      font-size: 42px;
      font-weight: 900;
      color: #065f46;
      letter-spacing: 6px;
      margin: 5px 0;
    }
    .specs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }
    .spec-item label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .spec-item div {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">YOURPRINTER</div>
      <div class="subtitle">Official Job Cover Sheet</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: 900; color: #2563eb;">#${data.orderNumber}</div>
      <div style="font-size: 11px; color: #64748b;">${data.timestamp}</div>
    </div>
  </div>

  <div class="pin-box">
    <div class="pin-label">Counter Release Pickup Code</div>
    <div class="pin-code">${data.pickupCode}</div>
    <div style="font-size: 10px; color: #059669;">Show this PIN or scan QR code to verify pickup</div>
  </div>

  <div class="specs-grid">
    <div class="spec-item">
      <label>Customer Name</label>
      <div>${data.customerName}</div>
    </div>
    <div class="spec-item">
      <label>Document File Name</label>
      <div>${data.fileName}</div>
    </div>
    <div class="spec-item">
      <label>Print Volume</label>
      <div>${data.pages} Pages × ${data.copies} Copies</div>
    </div>
    <div class="spec-item">
      <label>Layout & Specs</label>
      <div>${data.paperSize} • ${data.colorMode.toUpperCase()} • ${data.duplex ? "Duplex" : "Single-sided"}</div>
    </div>
  </div>

  <div class="footer">
    AutoPrint Spooler Engine v1.0 • Do not separate cover sheet from printed document bundle.
  </div>
</body>
</html>
  `;
}

/**
 * Generates a valid standard PDF Cover Sheet binary stream in pure TypeScript (No dependencies)
 * Incorporating Order Number, Customer Name, Copies, Colour Mode, Pages, Pickup Code, Shop Name, and vector QR representation.
 */
export function generateCoverSheetPDF(data: CoverSheetData & { shopName: string }): Uint8Array {
  // Construct content stream commands
  const lines: string[] = [];
  
  // PDF Text stream setup
  lines.push("BT");
  lines.push("/F1 28 Tf");
  lines.push("30 800 Td");
  lines.push(`(YOURPRINTER - ${data.shopName.toUpperCase()}) Tj`);
  
  lines.push("/F1 14 Tf");
  lines.push("0 -40 Td");
  lines.push("(OFFICIAL AUTO-PRINT JOB COVER SHEET) Tj");
  
  // Order details
  lines.push("/F1 16 Tf");
  lines.push("0 -60 Td");
  lines.push(`(ORDER NUMBER: #${data.orderNumber}) Tj`);
  
  lines.push("/F1 12 Tf");
  lines.push("0 -30 Td");
  lines.push(`(Customer Name: ${data.customerName}) Tj`);
  lines.push("0 -20 Td");
  lines.push(`(File Name: ${data.fileName}) Tj`);
  lines.push("0 -20 Td");
  lines.push(`(Volume: ${data.pages} Pages x ${data.copies} Copies) Tj`);
  lines.push("0 -20 Td");
  lines.push(`(Color Mode: ${data.colorMode.toUpperCase()}) Tj`);
  lines.push("0 -20 Td");
  lines.push(`(Pickup PIN: ${data.pickupCode}) Tj`);
  lines.push("0 -30 Td");
  lines.push(`(Printed On: ${data.timestamp}) Tj`);
  lines.push("ET");

  // Draw visual QR Code block simulator using PDF vector rectangles (re)
  // Draw outer borders and mock modules
  lines.push("0.1 w");
  lines.push("0 0 0 RG");
  lines.push("0 0 0 rg");
  
  // QR Finder pattern 1 (Top Left)
  lines.push("350 700 80 80 re B");
  lines.push("360 710 60 60 re W n"); // Inner clear
  lines.push("370 720 40 40 re B");
  
  // QR Finder pattern 2 (Top Right)
  lines.push("460 700 80 80 re B");
  lines.push("470 710 60 60 re W n");
  lines.push("480 720 40 40 re B");

  // QR Finder pattern 3 (Bottom Left)
  lines.push("350 610 80 80 re B");
  lines.push("360 620 60 60 re W n");
  lines.push("370 630 40 40 re B");

  // Mock internal QR noise pixels
  lines.push("460 660 15 15 re B");
  lines.push("490 640 20 20 re B");
  lines.push("520 620 15 25 re B");
  lines.push("400 660 30 10 re B");
  lines.push("440 610 15 15 re B");

  // Footer separator
  lines.push("30 100 m 565 100 l S");
  lines.push("BT");
  lines.push("/F1 10 Tf");
  lines.push("30 80 Td");
  lines.push("(WARNING: Do not separate this cover sheet from the document bundle. Verification required at counter.) Tj");
  lines.push("ET");

  const contentStream = lines.join("\n") + "\n";
  const contentStreamLength = contentStream.length;

  // Build basic PDF objects structure
  const pdfHeader = "%PDF-1.4\n";
  
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const obj5 = `5 0 obj\n<< /Length ${contentStreamLength} >>\nstream\n${contentStream}endstream\nendobj\n`;

  // Concatenate parts
  const pdfText = pdfHeader + obj1 + obj2 + obj3 + obj4 + obj5 + "xref\n0 6\n0000000000 65535 f \n" + "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n10\n%%EOF";
  
  // Convert string to Uint8Array bytes
  const encoder = new TextEncoder();
  return encoder.encode(pdfText);
}
