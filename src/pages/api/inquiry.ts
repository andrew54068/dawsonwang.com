import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { Client as NotionClient } from '@notionhq/client';
import { InquirySchema } from '../../lib/inquiry-schema';

export const prerender = false;

const HITS = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function rateLimited(ip: string, limit: number): boolean {
  const now = Date.now();
  const arr = HITS.get(ip) ?? [];
  const recent = arr.filter(t => now - t < WINDOW_MS);
  if (recent.length >= limit) return true;
  recent.push(now);
  HITS.set(ip, recent);
  return false;
}

const BUDGET_LABELS: Record<string, string> = {
  lt100k: '< 10 萬',
  '100k-300k': '10-30 萬',
  '300k-800k': '30-80 萬',
  gt800k: '> 80 萬',
};

const TIMELINE_LABELS: Record<string, string> = {
  this_month: '本月內',
  this_quarter: '本季',
  exploring: '只是先了解',
};

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const limit = parseInt(import.meta.env.INQUIRY_RATE_LIMIT_PER_HOUR ?? '10', 10);
  if (rateLimited(ip, limit)) {
    return new Response('Too many requests', { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const raw = Object.fromEntries(formData.entries());

  let inquiry;
  try {
    inquiry = InquirySchema.parse(raw);
  } catch (err) {
    return new Response('Invalid payload', { status: 400 });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const fromEmail = import.meta.env.RESEND_FROM_EMAIL;
  const toEmail = import.meta.env.RESEND_TO_EMAIL;
  const notionKey = import.meta.env.NOTION_API_KEY;
  const notionDb = import.meta.env.NOTION_INQUIRY_DB_ID;

  if (!apiKey || !fromEmail || !toEmail || !notionKey || !notionDb) {
    console.error('[inquiry] Missing required env vars', {
      RESEND_API_KEY: !!apiKey,
      RESEND_FROM_EMAIL: !!fromEmail,
      RESEND_TO_EMAIL: !!toEmail,
      NOTION_API_KEY: !!notionKey,
      NOTION_INQUIRY_DB_ID: !!notionDb,
    });
    return new Response('Server misconfiguration', { status: 500 });
  }

  const resend = new Resend(apiKey);
  const notion = new NotionClient({ auth: notionKey });

  // Send notification email to Dawson
  const emailBody = `
    新諮詢來信：

    姓名：${inquiry.name}
    Email：${inquiry.email}
    公司：${inquiry.company}
    團隊規模：${inquiry.team_size}
    預算：${BUDGET_LABELS[inquiry.budget]}
    時程：${TIMELINE_LABELS[inquiry.timeline]}

    目標：
    ${inquiry.goal}
  `.trim();

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `[Inquiry] ${inquiry.company} - ${inquiry.name}`,
      text: emailBody,
      replyTo: inquiry.email,
    });
  } catch (err) {
    console.error('Resend failed', err);
    // Continue — Notion write is the primary record.
  }

  try {
    await notion.pages.create({
      parent: { database_id: notionDb },
      properties: {
        Email: { title: [{ text: { content: inquiry.email } }] },
        Name: { rich_text: [{ text: { content: inquiry.name } }] },
        Company: { rich_text: [{ text: { content: inquiry.company } }] },
        'Team Size': { select: { name: inquiry.team_size } },
        Budget: { select: { name: BUDGET_LABELS[inquiry.budget] } },
        Timeline: { select: { name: TIMELINE_LABELS[inquiry.timeline] } },
        Goal: { rich_text: [{ text: { content: inquiry.goal } }] },
        'Received At': { date: { start: new Date().toISOString() } },
      },
    });
  } catch (err) {
    // Last-chance recovery: log full inquiry so the lead is not lost
    // if both Resend and Notion failed. Recover from Vercel function logs.
    console.error('Notion write failed', err, { inquiry });
    // Even if both sinks fail, return 303 to user — we don't want them retrying.
  }

  return new Response('OK', {
    status: 303,
    headers: { Location: '/inquiry-received' },
  });
};
