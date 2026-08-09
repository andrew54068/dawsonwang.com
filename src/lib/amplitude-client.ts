import * as amplitude from '@amplitude/unified';
import type { AnalyticsEventProperties } from './analytics';

export const AMPLITUDE_API_KEY = '4999ee21afb5d662d56000007168ee7f';

export const AMPLITUDE_INIT_OPTIONS = {
  analytics: { autocapture: true },
  sessionReplay: { sampleRate: 1 },
  // initAll() also wires up Guides & Surveys, which unconditionally injects a
  // <script> from https://cdn.amplitude.com. This site does not use that
  // product, so skip it rather than open script-src to a third-party CDN.
  engagement: { skip: true },
};

interface AmplitudeClient {
  initAll(apiKey: string, options: typeof AMPLITUDE_INIT_OPTIONS): Promise<void>;
  track(eventName: string, properties?: AnalyticsEventProperties): unknown;
}

export interface AmplitudeBridge {
  initialize(): Promise<void>;
  event(name: string, properties?: AnalyticsEventProperties): void;
  pageview(path?: string, properties?: AnalyticsEventProperties): void;
}

export function createAmplitudeBridge(client: AmplitudeClient): AmplitudeBridge {
  let initializationPromise: Promise<void> | undefined;

  const initialize = () => {
    if (!initializationPromise) {
      initializationPromise = client.initAll(AMPLITUDE_API_KEY, AMPLITUDE_INIT_OPTIONS);
    }

    return initializationPromise;
  };

  return {
    initialize,

    event(name, properties) {
      const initialization = initialize();
      client.track(name, properties);
      void initialization.catch(() => undefined);
    },

    pageview() {
      // The required autocapture configuration already owns pageview tracking.
    },
  };
}

export const amplitudeBridge = createAmplitudeBridge(amplitude);

export function initializeAmplitude() {
  return amplitudeBridge.initialize();
}
