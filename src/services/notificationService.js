/**
 * Email notifications — sends when SMTP_* env vars are set; otherwise logs stub.
 */

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

async function sendEmail({ to, subject, text, html }) {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient) {
    return { sent: false, reason: 'No recipient email.' };
  }

  if (!smtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log('[notification-stub]', { to: recipient, subject });
    return { sent: false, stub: true, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  }

  try {
    // Optional: npm install nodemailer when SMTP is ready
    // eslint-disable-next-line global-require, import/no-unresolved
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: String(subject || ''),
      text: String(text || ''),
      html: html || undefined,
    });
    return { sent: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('sendEmail error:', error?.message || error);
    return { sent: false, reason: error?.message || 'Email send failed.' };
  }
}

async function sendVendorApprovedEmail(seller) {
  const name = seller.businessName || seller.vendorCode;
  return sendEmail({
    to: seller.email,
    subject: 'Your Blaunk vendor application has been approved',
    text: `Hello ${name},\n\nYour vendor account (${seller.vendorCode}) has been approved. You can now list products on the Blaunk platform.\n\n— Blaunk Team`,
  });
}

async function sendVendorRejectedEmail(seller, reason) {
  const name = seller.businessName || seller.vendorCode;
  return sendEmail({
    to: seller.email,
    subject: 'Update on your Blaunk vendor application',
    text: `Hello ${name},\n\nYour vendor application (${seller.vendorCode}) was not approved at this time.\n\nReason: ${reason || 'Not specified'}\n\nYou may contact support for more information.\n\n— Blaunk Team`,
  });
}

module.exports = {
  sendEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  smtpConfigured,
};
