export interface ParsedSource {
  dayNumber: number;
  subtitle: string;
  body: string;
}

const TITLE_RE = /^#?\s*Day (\d+)(?:[\s:：｜]+(.+?))?\s*$/i;

export function parseSource(raw: string): ParsedSource {
  const lines = raw.split('\n');
  const match = lines[0].match(TITLE_RE);
  if (!match) {
    throw new Error('source.md must start with a "Day N <subtitle>" title line');
  }
  const dayNumber = parseInt(match[1], 10);
  const subtitle = (match[2] ?? '').trim();
  const body = lines.slice(1).join('\n').trim();
  return { dayNumber, subtitle, body };
}
