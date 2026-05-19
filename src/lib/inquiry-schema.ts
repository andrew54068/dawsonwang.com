import { z } from 'zod';

// CR/LF in single-line fields enables email-header injection if the SDK ever
// forwards them into a header. Reject up front.
const SingleLine = z.string().regex(/^[^\r\n]+$/, 'no newlines allowed');

export const InquirySchema = z.object({
  name: SingleLine.min(1).max(100),
  email: z.string().email().max(254),
  company: SingleLine.min(1).max(150),
  goal: z.string().min(1).max(300),
  team_size: z.enum(['1-5', '6-30', '31-100', '100+']),
  budget: z.enum(['lt100k', '100k-300k', '300k-800k', 'gt800k']),
  timeline: z.enum(['this_month', 'this_quarter', 'exploring']),
  hp_field: z.string().refine(v => v === '', { message: 'honeypot triggered' }),
});

export type Inquiry = z.infer<typeof InquirySchema>;
