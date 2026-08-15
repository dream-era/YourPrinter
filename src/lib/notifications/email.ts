/**
 * lib/notifications/email.ts
 * Sends transactional email via Resend's HTTP API directly (no SDK
 * dependency needed for something this simple — one fetch call).
 * Swap the fetch URL/payload shape if you'd rather use a different
 * provider (Postmark, SES, etc.) — the interface below is what
 * lib/notifications/create.ts calls, so that's the only contract to keep.
 *
 * Env vars:
 *   RESEND_API_KEY
 *   EMAIL_FROM   — e.g. "YourPrinter <notifications@yourdomain.com>"
 *                  (must be a domain verified in your Resend account)
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    // Email is a nice-to-have, not a hard requirement — log and move on
    // rather than throwing, so a missing config doesn't break order flow.
    console.warn("RESEND_API_KEY or EMAIL_FROM not set — skipping email notification.");
    return;
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Failed to send email to ${params.to}: ${res.status} ${body}`);
  }
}

/** Never email a synthetic staff address — it doesn't exist and will just bounce. */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith("@printq.internal");
}
