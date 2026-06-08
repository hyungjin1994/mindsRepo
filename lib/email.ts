import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `minds <no-reply@localhost>`;

let transporter: nodemailer.Transporter | null = null;
if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  if (!transporter) {
    console.warn('SMTP transporter not configured; skipping email to', to);
    return;
  }

  await transporter.sendMail({ from, to, subject, text, html });
}
