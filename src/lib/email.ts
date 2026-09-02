import nodemailer from "nodemailer";
import { ORG, bankDetailsHtml, bankDetailsText } from "@/lib/org";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export interface SendEmailOptions {
  to: string;
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions) {
  const transport = getTransport();
  if (!transport) {
    throw new Error("E-Mail-Versand nicht konfiguriert (GMAIL_USER / GMAIL_APP_PASSWORD fehlen in .env).");
  }
  const fromName = process.env.MAIL_FROM_NAME || ORG.name;
  return transport.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to: opts.to,
    cc: opts.cc && opts.cc.length ? opts.cc : undefined,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount);
}

export interface EnrollmentEmailInput {
  studentName: string;
  courseName: string;
  fee: number;
  studentCode?: string;
}

export function buildEnrollmentEmail(input: EnrollmentEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { studentName, courseName, fee, studentCode } = input;
  const reference = studentCode
    ? `${studentCode} Kurs: ${courseName}`
    : `Kurs: ${courseName} - ${studentName}`;
  const subject = `Anmeldebestätigung – ${courseName}`;

  const idLine = studentCode
    ? `<p>Ihre Studenten-ID lautet <strong>${studentCode}</strong>. Bitte geben Sie diese bei jeder Zahlung an.</p>`
    : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;max-width:600px;">
      <p>Assalamu alaikum ${studentName},</p>
      <p>vielen Dank für Ihre Anmeldung zum Kurs <strong>${courseName}</strong> bei ${ORG.name}.</p>
      ${idLine}
      <p>Die Kursgebühr beträgt <strong>${formatEuro(fee)}</strong>. Bitte überweisen Sie den Betrag
      unter Angabe des unten stehenden Verwendungszwecks, damit wir Ihre Zahlung korrekt zuordnen können.</p>
      ${bankDetailsHtml(reference)}
      <p style="margin-top:16px;">Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
      <p>BarakAllahu feekum,<br/>${ORG.name} (${ORG.register})</p>
    </div>`;

  const text = [
    `Assalamu alaikum ${studentName},`,
    ``,
    `vielen Dank für Ihre Anmeldung zum Kurs "${courseName}" bei ${ORG.name}.`,
    studentCode ? `Ihre Studenten-ID: ${studentCode} (bitte bei jeder Zahlung angeben)` : ``,
    `Kursgebühr: ${formatEuro(fee)}`,
    ``,
    `Zahlungsinformationen:`,
    bankDetailsText(),
    `Verwendungszweck: ${reference}`,
    ``,
    `BarakAllahu feekum,`,
    `${ORG.name} (${ORG.register})`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { subject, html, text };
}
