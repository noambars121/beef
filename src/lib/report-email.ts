import nodemailer from "nodemailer";
import { legalConfig } from "@/lib/legal-config";

export interface ReportMailPayload {
  subject: string;
  message: string;
  replyTo?: string;
}

/**
 * Sends a report email via Gmail SMTP when REPORT_EMAIL_PASS is set.
 * Returns false when SMTP is not configured (report still saved in Convex).
 */
export async function sendReportEmail(
  payload: ReportMailPayload
): Promise<boolean> {
  const user =
    process.env.REPORT_EMAIL_USER?.trim() || legalConfig.contactEmail;
  const pass = process.env.REPORT_EMAIL_PASS?.replace(/\s+/g, "") ?? "";

  if (!pass) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `BEEF Reports <${user}>`,
    to: legalConfig.contactEmail,
    replyTo: payload.replyTo || undefined,
    subject: payload.subject,
    text: payload.message,
  });

  return true;
}
