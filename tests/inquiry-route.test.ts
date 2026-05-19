import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const { pagesCreateMock, emailsSendMock } = vi.hoisted(() => ({
  pagesCreateMock: vi.fn(),
  emailsSendMock: vi.fn(),
}));

vi.mock('@notionhq/client', () => ({
  Client: class {
    pages = { create: pagesCreateMock };
  },
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: emailsSendMock };
  },
}));

import { POST } from '../src/pages/api/inquiry';

function buildRequest(overrides: Record<string, string> = {}, ip = '1.2.3.4'): Request {
  const body = new URLSearchParams({
    name: '王小明',
    email: 'wang@example.com',
    company: 'Acme',
    goal: '想把客服流程串 AI',
    team_size: '6-30',
    budget: '300k-800k',
    timeline: 'this_quarter',
    hp_field: '',
    ...overrides,
  });
  return new Request('https://www.dawsonwang.com/api/inquiry', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-forwarded-for': ip,
      origin: 'https://www.dawsonwang.com',
    },
    body: body.toString(),
  });
}

describe('POST /api/inquiry — Notion payload', () => {
  beforeEach(() => {
    pagesCreateMock.mockReset().mockResolvedValue({ id: 'notion-page-id' });
    emailsSendMock.mockReset().mockResolvedValue({ id: 'resend-id' });
    vi.stubEnv('RESEND_API_KEY', 'test_key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'from@test.com');
    vi.stubEnv('RESEND_TO_EMAIL', 'to@test.com');
    vi.stubEnv('NOTION_API_KEY', 'ntn_test');
    vi.stubEnv('NOTION_INQUIRY_DB_ID', 'db_test');
    vi.stubEnv('INQUIRY_RATE_LIMIT_PER_HOUR', '1000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('writes to Notion using the actual DB property names (with spaces) and types', async () => {
    const res = await POST({ request: buildRequest({}, '1.1.1.1') } as any);

    expect(res.status).toBe(303);
    expect(pagesCreateMock).toHaveBeenCalledTimes(1);

    const call = pagesCreateMock.mock.calls[0][0];
    expect(call.parent).toEqual({ database_id: 'db_test' });

    const props = call.properties;
    expect(Object.keys(props).sort()).toEqual(
      ['Budget', 'Company', 'Email', 'Goal', 'Name', 'Received At', 'Team Size', 'Timeline'].sort()
    );

    // Title property MUST be Email (the Notion DB has Email as its title column).
    // Putting `Name` as title or `Email` as email-typed property is the original bug.
    expect(props.Email).toMatchObject({ title: [{ text: { content: 'wang@example.com' } }] });
    expect(props.Email.email).toBeUndefined();

    expect(props.Name).toMatchObject({ rich_text: [{ text: { content: '王小明' } }] });
    expect(props.Name.title).toBeUndefined();

    expect(props.Company).toMatchObject({ rich_text: [{ text: { content: 'Acme' } }] });
    expect(props['Team Size']).toEqual({ select: { name: '6-30' } });
    expect(props.Budget).toEqual({ select: { name: '30-80 萬' } });
    expect(props.Timeline).toEqual({ select: { name: '本季' } });
    expect(props.Goal).toMatchObject({ rich_text: [{ text: { content: '想把客服流程串 AI' } }] });
    expect(props['Received At']).toMatchObject({ date: { start: expect.any(String) } });
  });

  test('does not send the legacy (broken) property names', async () => {
    await POST({ request: buildRequest({}, '2.2.2.2') } as any);
    const props = pagesCreateMock.mock.calls[0][0].properties;
    expect(props).not.toHaveProperty('TeamSize');
    expect(props).not.toHaveProperty('ReceivedAt');
  });

  test('sends Resend email and returns 303 even when Notion throws', async () => {
    pagesCreateMock.mockRejectedValueOnce(new Error('notion down'));
    const res = await POST({ request: buildRequest({}, '3.3.3.3') } as any);
    expect(res.status).toBe(303);
    expect(emailsSendMock).toHaveBeenCalledTimes(1);
  });

  test('rejects payload with empty goal', async () => {
    const res = await POST({ request: buildRequest({ goal: '' }, '4.4.4.4') } as any);
    expect(res.status).toBe(400);
    expect(pagesCreateMock).not.toHaveBeenCalled();
  });

  test('accepts short non-empty goal', async () => {
    const res = await POST({ request: buildRequest({ goal: 'hi' }, '5.5.5.5') } as any);
    expect(res.status).toBe(303);
    expect(pagesCreateMock).toHaveBeenCalledTimes(1);
  });
});
