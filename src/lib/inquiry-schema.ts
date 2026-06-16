import { z } from 'zod';
import { EMAIL_PATTERN } from './email-pattern';

// CR/LF in single-line fields enables email-header injection if the SDK ever
// forwards them into a header. Reject up front.
const SingleLine = z.string().regex(/^[^\r\n]+$/, 'no newlines allowed');

export const InquirySchema = z.object({
  name: SingleLine.min(1).max(100),
  // Trim before validating so a pasted address with stray whitespace
  // (" a@b.co ") can't pass the client gate yet fail here. EMAIL_PATTERN is the
  // shared rule the client enforces too (see inquiry-client.ts) and is Zod's own
  // default email regex, so this stays behavior-identical apart from trimming.
  email: z.string().trim().pipe(z.email({ pattern: EMAIL_PATTERN }).max(254)),
  company: SingleLine.min(1).max(150),
  goal: z.string().min(1).max(300),
  team_size: z.enum(['1-5', '6-30', '31-100', '100+']),
  budget: z.enum(['lt100k', '100k-300k', '300k-800k', 'gt800k']),
  timeline: z.enum(['this_month', 'this_quarter', 'exploring']),
  hp_field: z.string().refine(v => v === '', { message: 'honeypot triggered' }),
});

export type Inquiry = z.infer<typeof InquirySchema>;
