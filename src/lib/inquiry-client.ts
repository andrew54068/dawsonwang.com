import { EMAIL_PATTERN, EMAIL_MAX_LENGTH } from './email-pattern';

// Decision logic for the inquiry form's client script, kept DOM-free so it can
// be unit-tested in the node test environment (the rest of the form is thin DOM
// glue in InquiryForm.astro). These two functions encode the behaviour the
// regression tests lock down: the email gate must agree with the server, and a
// submission must never surface as the 303 redirect page or a raw error body.

/**
 * Whether an email passes the same rule the server enforces (InquirySchema).
 * Trims first, then checks both length and pattern — mirroring the server's
 * `z.string().trim().pipe(z.email({ pattern }).max(EMAIL_MAX_LENGTH))` — so the
 * client gate and the server stay in agreement and a valid address never slips
 * past the button only to be rejected by the API.
 */
export function isValidInquiryEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}

/** The subset of a fetch Response we need to decide the UI outcome. */
export interface InquiryResponseLike {
  type: string;
  ok: boolean;
  status: number;
}

export const INQUIRY_EMAIL_HINT = '請輸入有效的 Email 地址，例如 name@example.com';
export const INQUIRY_NETWORK_ERROR = '網路連線有問題，請稍後再試。';

/**
 * Map the inquiry POST response to a UI outcome. Returns null on success — the
 * server answers a good submission with a 303, which `fetch(…, { redirect:
 * 'manual' })` surfaces as an opaqueredirect. Anything else returns a
 * user-facing string shown inline; the raw server body is never displayed.
 */
export function inquiryErrorMessage(res: InquiryResponseLike): string | null {
  if (res.type === 'opaqueredirect' || res.ok) return null;
  if (res.status === 429) return '送出太頻繁，請稍後再試。';
  return '送出失敗，請稍後再試，或直接寄信給我。';
}
