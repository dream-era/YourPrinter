/**
 * lib/notifications/sms.ts
 * Sends SMS via Twilio's REST API directly (no SDK — one fetch call, same
 * philosophy as email.ts). Fail-open like email: missing config logs a
 * warning and no-ops rather than breaking the caller.
 *
 * Env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER   — e.g. "+15551234567", a number on your Twilio account
 *
 * Swap the fetch call for MSG91/another provider if you'd rather use an
 * India-specific SMS provider — the sendSms() contract below is all
 * create.ts depends on.
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01/Accounts";

export interface SendSmsParams {
  to: string; // E.164 format, e.g. "+919000000000"
  body: string;
}

export async function sendSms(params: SendSmsParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("Twilio env vars not set — skipping SMS notification.");
    return;
  }

  const url = `${TWILIO_API_BASE}/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: params.to,
    From: fromNumber,
    Body: params.body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`Failed to send SMS to ${params.to}: ${res.status} ${text}`);
  }
}

/**
 * Best-effort E.164 normalization for Indian 10-digit numbers stored
 * without a country code (the seed data and staff phone fields use bare
 * 10-digit numbers). Adjust if you store numbers differently.
 */
export function toE164India(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}
