export const DEFAULT_ANALYTICS_ENDPOINT = '/api/analytics';

export const ANALYTICS_PROVIDERS = ['none', 'vercel', 'self-hosted'] as const;
export type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[number];
export type AnalyticsEventProperties = Record<string, string | number | boolean | null>;

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  enabled: boolean;
  endpoint: string | null;
  enableSpeedInsights: boolean;
  autoTrackPageviews: boolean;
}

function normalizeProvider(raw: string | undefined): AnalyticsProvider {
  const candidate = raw?.trim().toLowerCase();
  if (candidate === 'none' || candidate === 'vercel' || candidate === 'self-hosted') {
    return candidate;
  }
  return 'vercel';
}

export function resolveAnalyticsConfig(
  env: Record<string, string | undefined> = {}
): AnalyticsConfig {
  const provider = normalizeProvider(env.PUBLIC_ANALYTICS_PROVIDER);

  if (provider === 'self-hosted') {
    return {
      provider,
      enabled: true,
      endpoint: env.PUBLIC_ANALYTICS_ENDPOINT?.trim() || DEFAULT_ANALYTICS_ENDPOINT,
      enableSpeedInsights: false,
      autoTrackPageviews: true,
    };
  }

  if (provider === 'none') {
    return {
      provider,
      enabled: false,
      endpoint: null,
      enableSpeedInsights: false,
      autoTrackPageviews: false,
    };
  }

  return {
    provider: 'vercel',
    enabled: true,
    endpoint: null,
    enableSpeedInsights: env.PUBLIC_VERCEL_SPEED_INSIGHTS !== 'false',
    autoTrackPageviews: false,
  };
}
