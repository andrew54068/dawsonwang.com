import { describe, expect, test, vi } from 'vitest';
import {
  AMPLITUDE_API_KEY,
  AMPLITUDE_INIT_OPTIONS,
  createAmplitudeBridge,
} from '../src/lib/amplitude-client';

describe('Amplitude browser bridge', () => {
  test('initializes once with the required options and dispatches events', async () => {
    const initAll = vi.fn().mockResolvedValue(undefined);
    const track = vi.fn();
    const bridge = createAmplitudeBridge({ initAll, track });

    bridge.event('link_click', { link_id: 'threads' });
    const firstInitialization = bridge.initialize();
    const secondInitialization = bridge.initialize();

    expect(secondInitialization).toBe(firstInitialization);
    await firstInitialization;
    await Promise.resolve();

    expect(initAll).toHaveBeenCalledTimes(1);
    expect(initAll).toHaveBeenCalledWith(AMPLITUDE_API_KEY, AMPLITUDE_INIT_OPTIONS);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('link_click', { link_id: 'threads' });
  });

  test('dispatches events immediately while initialization is still pending', () => {
    let resolveInitialization!: () => void;
    const initialization = new Promise<void>((resolve) => {
      resolveInitialization = resolve;
    });
    const initAll = vi.fn().mockReturnValue(initialization);
    const track = vi.fn();
    const bridge = createAmplitudeBridge({ initAll, track });

    bridge.event('link_click', { link_id: 'days' });

    expect(initAll).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('link_click', { link_id: 'days' });
    resolveInitialization();
  });

  test('does not send an explicit pageview because Amplitude autocapture owns pageviews', async () => {
    const initAll = vi.fn().mockResolvedValue(undefined);
    const track = vi.fn();
    const bridge = createAmplitudeBridge({ initAll, track });

    bridge.pageview('/links');
    await bridge.initialize();

    expect(track).not.toHaveBeenCalled();
  });
});
