import { describe, expect, test } from 'vitest';
import {
  ATTRIBUTION_STORAGE_KEY,
  captureAttribution,
  toAnalyticsProperties,
} from '../src/lib/analytics-attribution';

function storage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
  };
}

describe('analytics attribution', () => {
  test('parses only supported UTM values and rejects empty or oversized values', () => {
    const result = captureAttribution(
      `?utm_source=qr&utm_medium=offline&utm_campaign=2026-talk&utm_content=slide-cta&email=person%40example.com&utm_term=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
      storage(),
    );

    expect(result.hasIncoming).toBe(true);
    expect(result.state.firstTouch).toEqual({
      utm_source: 'qr',
      utm_medium: 'offline',
      utm_campaign: '2026-talk',
      utm_content: 'slide-cta',
    });
    expect(result.state.lastTouch).toEqual(result.state.firstTouch);
  });

  test('preserves first touch and updates last touch across tagged visits', () => {
    const store = storage();
    const first = captureAttribution('?utm_source=qr&utm_campaign=talk', store);
    const untagged = captureAttribution('/links', store);
    const later = captureAttribution('?utm_source=threads&utm_medium=social', store);

    expect(first.state.firstTouch).toEqual({ utm_source: 'qr', utm_campaign: 'talk' });
    expect(untagged.hasIncoming).toBe(false);
    expect(untagged.state).toEqual(first.state);
    expect(later.state.firstTouch).toEqual(first.state.firstTouch);
    expect(later.state.lastTouch).toEqual({
      utm_source: 'threads',
      utm_medium: 'social',
    });
  });

  test('ignores malformed or unavailable storage without throwing', () => {
    const brokenStorage = {
      getItem: () => '{not-json',
      setItem: () => { throw new Error('storage blocked'); },
    };

    expect(() => captureAttribution('?utm_source=qr', brokenStorage)).not.toThrow();
    expect(captureAttribution('?utm_source=qr', brokenStorage).state.firstTouch).toEqual({
      utm_source: 'qr',
    });
  });

  test('flattens first and last touch state into analytics properties', () => {
    const state = captureAttribution(
      '?utm_source=qr&utm_medium=offline&utm_content=badge',
      storage(),
    ).state;

    expect(toAnalyticsProperties(state)).toEqual({
      attribution_first_source: 'qr',
      attribution_first_medium: 'offline',
      attribution_first_content: 'badge',
      attribution_last_source: 'qr',
      attribution_last_medium: 'offline',
      attribution_last_content: 'badge',
    });
  });

  test('uses the namespaced storage key', () => {
    const writes: string[] = [];
    const store = {
      getItem: (key: string) => {
        expect(key).toBe(ATTRIBUTION_STORAGE_KEY);
        return null;
      },
      setItem: (key: string, value: string) => {
        expect(key).toBe(ATTRIBUTION_STORAGE_KEY);
        writes.push(value);
      },
    };

    captureAttribution('?utm_source=qr', store);
    expect(writes).toHaveLength(1);
  });
});
