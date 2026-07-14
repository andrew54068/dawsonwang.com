export const ATTRIBUTION_STORAGE_KEY = 'dw_attribution';

const MAX_VALUE_LENGTH = 100;
const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type AttributionValues = Partial<Record<AttributionKey, string>>;

export interface AttributionState {
  firstTouch: AttributionValues;
  lastTouch: AttributionValues;
}

export interface AttributionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function clean(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_VALUE_LENGTH ? trimmed : undefined;
}

function parseValues(search: string): AttributionValues {
  const values: AttributionValues = {};

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return values;
  }

  for (const key of ATTRIBUTION_KEYS) {
    const value = clean(params.get(key));
    if (value) values[key] = value;
  }

  return values;
}

function isValues(value: unknown): value is AttributionValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, entry]) => (
    ATTRIBUTION_KEYS.includes(key as AttributionKey)
    && typeof entry === 'string'
    && clean(entry) !== undefined
  ));
}

function readState(storage?: AttributionStorage | null): AttributionState {
  if (!storage) return { firstTouch: {}, lastTouch: {} };

  try {
    const raw = storage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return { firstTouch: {}, lastTouch: {} };

    const parsed = JSON.parse(raw) as { firstTouch?: unknown; lastTouch?: unknown };
    return {
      firstTouch: isValues(parsed.firstTouch) ? parsed.firstTouch : {},
      lastTouch: isValues(parsed.lastTouch) ? parsed.lastTouch : {},
    };
  } catch {
    return { firstTouch: {}, lastTouch: {} };
  }
}

export function captureAttribution(
  search: string,
  storage?: AttributionStorage | null,
): { state: AttributionState; hasIncoming: boolean } {
  const incoming = parseValues(search);
  const hasIncoming = Object.keys(incoming).length > 0;
  const existing = readState(storage);

  if (!hasIncoming) {
    return { state: existing, hasIncoming: false };
  }

  const state: AttributionState = {
    firstTouch: Object.keys(existing.firstTouch).length > 0 ? existing.firstTouch : incoming,
    lastTouch: incoming,
  };

  try {
    storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }

  return { state, hasIncoming: true };
}

export function toAnalyticsProperties(state: AttributionState): Record<string, string> {
  const properties: Record<string, string> = {};

  for (const [prefix, values] of [
    ['first', state.firstTouch],
    ['last', state.lastTouch],
  ] as const) {
    for (const [key, value] of Object.entries(values)) {
      const shortKey = key.replace(/^utm_/, '');
      properties[`attribution_${prefix}_${shortKey}`] = value;
    }
  }

  return properties;
}
