export interface ParsedSource {
  dayNumber: number;
  subtitle: string;
  body: string;
}

const TITLE_RE = /^#?\s*Day (\d+)(?:[\s:：｜]+(.+?))?\s*$/i;
const SUBTITLE_MAX = 60;
const TITLE_SCAN_LINES = 3;

export function parseSource(raw: string, fallbackDayNumber?: number): ParsedSource {
  const lines = raw.split('\n');

  const titleHit = findTitleLine(lines, TITLE_SCAN_LINES);

  let dayNumber: number;
  let subtitle: string;
  let bodyStart: number;

  if (titleHit) {
    dayNumber = titleHit.dayNumber;
    subtitle = titleHit.subtitle;
    bodyStart = titleHit.lineIndex + 1;
  } else if (fallbackDayNumber !== undefined) {
    dayNumber = fallbackDayNumber;
    subtitle = lines[0].replace(/^#+\s*/, '').trim();
    bodyStart = 1;
  } else {
    throw new Error('source.md must start with a "Day N <subtitle>" title line');
  }

  const body = lines.slice(bodyStart).join('\n').trim();

  if (!subtitle) {
    subtitle = firstMeaningfulLine(body);
  }

  return { dayNumber, subtitle, body };
}

function findTitleLine(
  lines: string[],
  scanLimit: number,
): { dayNumber: number; subtitle: string; lineIndex: number } | null {
  let seen = 0;
  for (let i = 0; i < lines.length && seen < scanLimit; i++) {
    if (!lines[i].trim()) continue;
    seen++;
    const match = lines[i].match(TITLE_RE);
    if (match) {
      return {
        dayNumber: parseInt(match[1], 10),
        subtitle: (match[2] ?? '').trim(),
        lineIndex: i,
      };
    }
  }
  return null;
}

function firstMeaningfulLine(body: string): string {
  const line = body
    .split('\n')
    .map(l => l.replace(/^#+\s*/, '').trim())
    .find(l => l.length > 0) ?? '';
  if (line.length <= SUBTITLE_MAX) return line;
  return line.slice(0, SUBTITLE_MAX).trimEnd() + '…';
}
