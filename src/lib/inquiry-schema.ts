import { z } from 'zod';

export const InquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1).max(150),
  goal: z.string().min(5).transform(s => s.slice(0, 300)),
  team_size: z.enum(['1-5', '6-30', '31-100', '100+']),
  budget: z.enum(['lt100k', '100k-300k', '300k-800k', 'gt800k']),
  timeline: z.enum(['this_month', 'this_quarter', 'exploring']),
  hp_field: z.string().refine(v => v === '', { message: 'honeypot triggered' }),
});

export type Inquiry = z.infer<typeof InquirySchema>;
