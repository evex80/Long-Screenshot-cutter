import JSZip from 'jszip';
import { SliceItem } from '../types';

export interface EmailTemplateOptions {
  emailSubject: string;
  senderTitle?: string;
  maxWidthPx: number; // e.g. 640 or 700
  includeBorder: boolean;
  inlineBase64: boolean;
}

/**
 * Builds bulletproof, zero-gap email table HTML compatible with:
 * Microsoft Outlook (2016-2024, 365, Web), Gmail (Web, iOS, Android), Apple Mail, Yahoo
 */
export function generateEmailHtml(
  slices: SliceItem[],
  options: EmailTemplateOptions
): string {
  const maxWidth = options.maxWidthPx || 650;
  
  // Table rows with zero padding, zero line height, display: block to prevent gaps
  const imageRows = slices
    .map((slice) => {
      const imgSrc = options.inlineBase64 ? slice.dataUrl : `cid:slice_${slice.index}`;
      // Calculate aspect ratio height for desktop Outlook
      const displayHeight = Math.round((slice.height / slice.width) * maxWidth);

      return `
    <!-- Slice ${slice.index} -->
    <tr>
      <td align="center" valign="top" style="padding: 0; margin: 0; font-size: 0px; line-height: 0px; border-collapse: collapse; mso-line-height-rule: exactly;">
        <img src="${imgSrc}" 
             alt="Report Section ${slice.index}" 
             width="${maxWidth}" 
             height="${displayHeight}"
             style="display: block; width: 100%; max-width: ${maxWidth}px; height: auto; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; margin: 0; padding: 0; vertical-align: bottom;" />
      </td>
    </tr>`;
    })
    .join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(options.emailSubject || 'Executive Field Technical Report')}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }
    img {
      -ms-interpolation-mode: bicubic;
      display: block;
      border: 0;
      outline: none;
      text-decoration: none;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Centering Outer Wrapper -->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F1F5F9" style="background-color: #F1F5F9; width: 100% !important; margin: 0; padding: 20px 0;">
    <tr>
      <td align="center" valign="top">
        <!-- Main Report Container with Seamless Image Stacking -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${maxWidth}" style="width: 100%; max-width: ${maxWidth}px; background-color: #FFFFFF; ${options.includeBorder ? 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E2E8F0;' : ''} border-collapse: collapse;">
          ${imageRows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Copies rich HTML to clipboard so the user can directly paste into Gmail/Outlook/Apple Mail
 */
export async function copyRichHtmlToClipboard(
  slices: SliceItem[],
  options: EmailTemplateOptions
): Promise<boolean> {
  const maxWidth = options.maxWidthPx || 650;
  
  // Compact rich HTML snippet specifically for direct clipboard paste into email composer
  const richHtml = `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${maxWidth}" style="width: 100%; max-width: ${maxWidth}px; background-color: #FFFFFF; border-collapse: collapse; margin: 0 auto;">
  ${slices
    .map(
      (slice) => `
  <tr>
    <td style="padding: 0; margin: 0; font-size: 0; line-height: 0; border-collapse: collapse;">
      <img src="${slice.dataUrl}" alt="Report Section ${slice.index}" width="${maxWidth}" style="display: block; width: 100%; max-width: ${maxWidth}px; height: auto; border: 0; outline: none; margin: 0; padding: 0; vertical-align: bottom;" />
    </td>
  </tr>`
    )
    .join('')}
</table>
`;

  try {
    const textBlob = new Blob([richHtml], { type: 'text/html' });
    const plainBlob = new Blob(['[Executive Report Images Attached Seamlessly]'], { type: 'text/plain' });
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': textBlob,
        'text/plain': plainBlob,
      }),
    ]);
    return true;
  } catch (err) {
    console.warn('Rich clipboard write failed, falling back to plain text:', err);
    try {
      await navigator.clipboard.writeText(richHtml);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Packs all slice images and ready-to-use HTML into a structured ZIP file
 */
export async function downloadSlicesZip(
  slices: SliceItem[],
  reportTitle: string = 'Executive_Report',
  options: EmailTemplateOptions
): Promise<void> {
  const zip = new JSZip();
  const folderName = reportTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const imgFolder = zip.folder(`${folderName}_slices`);

  // Add each slice image with zero-padded numbers
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const pad = String(i + 1).padStart(2, '0');
    const ext = slice.dataUrl.includes('image/png') ? 'png' : slice.dataUrl.includes('image/webp') ? 'webp' : 'jpg';
    const filename = `${pad}_${folderName}_part${i + 1}.${ext}`;

    if (slice.blob) {
      imgFolder?.file(filename, slice.blob);
    } else {
      const base64Data = slice.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      imgFolder?.file(filename, base64Data, { base64: true });
    }
  }

  // Add the email template file
  const emailHtml = generateEmailHtml(slices, { ...options, inlineBase64: true });
  zip.file(`${folderName}_email_template.html`, emailHtml);

  // Add a quick README for executive senders
  const readme = `LONG SCREENSHOT SEAMLESS SLICING - EMAIL PACKAGE
=====================================================
Report: ${reportTitle}
Total Slices: ${slices.length}
Target Width: ${options.maxWidthPx}px (Retina Optimized)

HOW TO USE IN EMAIL:
1. Quick Paste Method:
   Open the web app and click "Copy for Email (Ctrl+V)".
   In Outlook / Gmail / Apple Mail compose window, press Paste (Ctrl+V).
   The report will render big, crisp, and 100% seamless!

2. HTML Template Method:
   Open '${folderName}_email_template.html' in your browser, or insert into your email client's HTML source.

3. Image Attachment Method:
   The '${folderName}_slices' folder contains sequentially numbered images (01_..., 02_...).
   Insert them in numerical order.

Zero-gap guarantee enabled: display:block, font-size:0, line-height:0 table structure.
Generated with Long Screenshot Slicer & Email Optimizer.
`;
  zip.file('README_EMAIL_INSTRUCTIONS.txt', readme);

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipContent);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${folderName}_slices_email_bundle.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
