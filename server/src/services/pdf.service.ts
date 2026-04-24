// PDF generation for prescriptions and dispensing labels
// In production, use puppeteer or @react-pdf/renderer

export class PdfService {
  // Generate a private prescription PDF
  static async generatePrescription(data: {
    prescriberName: string;
    prescriberReg: string;
    patientName: string;
    patientDob: string;
    patientAddress: string;
    drugName: string;
    dose: string;
    directions: string;
    quantity: string;
    pharmacyName: string;
    pharmacyGphc: string;
    date: string;
  }): Promise<Buffer> {
    // HTML-to-PDF approach using a simple template
    const html = `
    <!DOCTYPE html>
    <html>
    <head><style>
      body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; color: #111; }
      .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
      .header h1 { font-size: 18px; color: #0d9488; margin: 0; }
      .header p { color: #666; margin: 4px 0 0; font-size: 11px; }
      .rx-symbol { font-size: 24px; font-weight: bold; color: #0d9488; margin-bottom: 16px; }
      .field { margin-bottom: 12px; }
      .field label { font-weight: bold; color: #374151; display: block; margin-bottom: 2px; font-size: 10px; text-transform: uppercase; }
      .field .value { font-size: 14px; padding: 4px 0; border-bottom: 1px solid #e5e7eb; }
      .drug-box { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px; margin: 20px 0; }
      .drug-name { font-size: 16px; font-weight: bold; color: #0f766e; }
      .signature { margin-top: 40px; border-top: 1px solid #333; width: 250px; padding-top: 8px; }
      .footer { margin-top: 40px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    </style></head>
    <body>
      <div class="header">
        <h1>${data.pharmacyName}</h1>
        <p>GPhC Registration: ${data.pharmacyGphc}</p>
        <p>PRIVATE PRESCRIPTION</p>
      </div>
      <div class="rx-symbol">Rx</div>
      <div style="display:flex;gap:40px">
        <div style="flex:1">
          <div class="field"><label>Patient Name</label><div class="value">${data.patientName}</div></div>
          <div class="field"><label>Date of Birth</label><div class="value">${data.patientDob}</div></div>
          <div class="field"><label>Address</label><div class="value">${data.patientAddress}</div></div>
        </div>
        <div style="flex:1">
          <div class="field"><label>Date</label><div class="value">${data.date}</div></div>
          <div class="field"><label>Prescriber</label><div class="value">${data.prescriberName}</div></div>
          <div class="field"><label>Registration</label><div class="value">${data.prescriberReg}</div></div>
        </div>
      </div>
      <div class="drug-box">
        <div class="drug-name">${data.drugName} ${data.dose}</div>
        <p style="margin:8px 0 0;font-size:13px"><strong>Directions:</strong> ${data.directions}</p>
        <p style="margin:4px 0 0;font-size:13px"><strong>Quantity:</strong> ${data.quantity}</p>
      </div>
      <div class="signature">
        <strong>${data.prescriberName}</strong><br>
        ${data.prescriberReg}<br>
        <em style="font-size:10px">Digitally signed ${data.date}</em>
      </div>
      <div class="footer">
        This is a private prescription issued by ${data.pharmacyName} (GPhC: ${data.pharmacyGphc}).
        This document is for the named patient only and is not transferable.
      </div>
    </body>
    </html>`;

    // In production, convert HTML to PDF using puppeteer:
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4' });
    // await browser.close();
    // return pdf;

    // Stub: return HTML as buffer for dev
    console.log('[PDF] Generated prescription for', data.patientName);
    return Buffer.from(html, 'utf-8');
  }

  // Generate a dispensing label (ZPL for thermal printers + PDF fallback)
  static async generateDispensingLabel(data: {
    patientName: string;
    drugName: string;
    dose: string;
    directions: string;
    warnings: string[];
    pharmacyName: string;
    pharmacyGphc: string;
    dispensingDate: string;
  }): Promise<{ pdf: Buffer; zpl: string }> {
    // ZPL (Zebra Programming Language) for thermal label printers
    const zpl = `^XA
^FO20,20^A0N,30,30^FD${data.patientName}^FS
^FO20,60^A0N,25,25^FD${data.drugName} ${data.dose}^FS
^FO20,95^A0N,20,20^FD${data.directions}^FS
^FO20,125^A0N,16,16^FD${data.warnings.join(' | ')}^FS
^FO20,160^A0N,16,16^FD${data.pharmacyName} | GPhC: ${data.pharmacyGphc}^FS
^FO20,185^A0N,14,14^FDDispensed: ${data.dispensingDate}^FS
^XZ`;

    const labelHtml = `<div style="font-family:monospace;width:300px;padding:10px;border:1px solid #000;font-size:11px">
      <div style="font-weight:bold;font-size:14px;margin-bottom:4px">${data.patientName}</div>
      <div style="font-weight:bold;font-size:12px;color:#0f766e">${data.drugName} ${data.dose}</div>
      <div style="margin:4px 0">${data.directions}</div>
      <div style="font-size:10px;color:#666">${data.warnings.join(' | ')}</div>
      <hr style="margin:6px 0">
      <div style="font-size:9px">${data.pharmacyName} | GPhC: ${data.pharmacyGphc} | ${data.dispensingDate}</div>
    </div>`;

    console.log('[Label] Generated dispensing label for', data.patientName);
    return { pdf: Buffer.from(labelHtml, 'utf-8'), zpl };
  }
}
