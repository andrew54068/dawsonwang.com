import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { Client as NotionClient } from '@notionhq/client';
import { InquirySchema } from '../../lib/inquiry-schema';
import { isAllowedOrigin, trustedClientIp } from '../../lib/origin-guard';

export const prerender = false;

// Best-effort per-instance rate limit. Vercel functions are stateless across
// cold starts and concurrent instances, so a determined attacker can bypass
// this. The real defenses are the Origin allowlist and the honeypot field.
// Upgrade to Vercel KV / Upstash if real abuse appears.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BODY_BYTES = 8 * 1024;

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

function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isAllowedOrigin(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413 });
  }

  const ip = trustedClientIp(clientAddress, request);
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
    // Redacted breadcrumb only — full inquiry payload doesn't belong in
    // function logs. Resend email is the recovery channel when Notion is down.
    console.error('Notion write failed', err, {
      email: redactEmail(inquiry.email),
      company: inquiry.company.slice(0, 40),
    });
  }

  return new Response('OK', {
    status: 303,
    headers: { Location: '/inquiry-received' },
  });
};
