import { Marked, type Tokens } from 'marked';

// GFM autolinks bare URLs, but its boundary regex (/[^\s<]*/) keeps consuming
// CJK characters and fullwidth punctuation. A URL written inline in Chinese,
// e.g. "...介紹過：https://dawsonwang.com/day/141）測完...", therefore swallows
// the trailing fullwidth paren and the following text into the href (rendered
// as https://dawsonwang.com/day/141%EF%BC%89%E6%B8%AC...).
//
// Override the `url` inline tokenizer so a bare-URL autolink only consumes
// ASCII URL characters and ends at the first non-ASCII character. Returning
// `false` for anything else falls back to marked's default tokenizer, so email
// autolinks and explicit [text](url) links are untouched, and GFM (tables,
// etc.) stays enabled.

// Scheme + an ASCII-only body. The body class is an allow-list of RFC 3986 URL
// characters; because every listed character is ASCII, the match stops at the
// first CJK character or fullwidth punctuation mark.
const ASCII_URL = /^((?:ftp|https?):\/\/|www\.)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*/;

// Mirror GFM's trailing-punctuation backpedal, ASCII only: sentence punctuation
// and an unbalanced closing paren are dropped from the href and left as text.
function trimTrailingPunctuation(url: string): string {
  let prev: string;
  do {
    prev = url;
    url = url.replace(/[?!.,:;*_~]+$/, '');
    if (url.endsWith(')')) {
      const opens = (url.match(/\(/g) ?? []).length;
      const closes = (url.match(/\)/g) ?? []).length;
      if (closes > opens) url = url.slice(0, -1);
    }
  } while (url !== prev);
  return url;
}

const md = new Marked({
  tokenizer: {
    url(src: string): Tokens.Link | false {
      const cap = ASCII_URL.exec(src);
      if (!cap) return false; // emails / no URL here -> marked default
      const text = trimTrailingPunctuation(cap[0]);
      // Bail out if trimming left something that isn't URL-like; let the
      // default tokenizer decide rather than emitting a junk link.
      if (!/[a-zA-Z0-9/]$/.test(text)) return false;
      const href = cap[1] === 'www.' ? `http://${text}` : text;
      return {
        type: 'link',
        raw: text, // advance the lexer only past the URL; trailing chars stay text
        href,
        title: null,
        text,
        tokens: [{ type: 'text', raw: text, text } as Tokens.Text],
      };
    },
  },
});

// source.md embeds day-local assets with a relative path, e.g.
// ![合照](./attachments/photo.jpeg). Emitted verbatim the browser resolves it
// against /day/219 and 404s, so rewrite it to the same absolute /content/dayNN/
// prefix the slide carousel already uses. Remote and root-relative srcs are
// already resolvable and are left alone.
function absolutiseImageSrc(href: string, dayNumber: number): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(href)) return href;
  const pad = String(dayNumber).padStart(2, '0');
  return `/content/day${pad}/${href.replace(/^\.\//, '')}`;
}

// The image renderer is registered once on the shared instance and reads the
// day being rendered from here. Cloning the instance per call instead would
// re-wrap the custom `url` tokenizer and strip its rules binding, which blows
// up ("Cannot read properties of undefined (reading 'inline')") the moment a
// line has no URL and falls through to marked's default tokenizer.
// md.parse is synchronous, so this can't interleave between days.
let currentDayNumber: number | undefined;

md.use({
  renderer: {
    image({ href, title, text }: Tokens.Image): string {
      const src =
        currentDayNumber === undefined ? href : absolutiseImageSrc(href, currentDayNumber);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${src}" alt="${text}"${titleAttr}>`;
    },
  },
});

export function renderMarkdown(body: string, opts?: { dayNumber?: number }): string {
  currentDayNumber = opts?.dayNumber;
  try {
    return md.parse(body) as string;
  } finally {
    currentDayNumber = undefined;
  }
}
