import { TOP_PERFORMERS } from '../data/featured';

export function isTopPerformer(dayNumber: number): boolean {
  return TOP_PERFORMERS.has(dayNumber);
}

export type Point = { day: number; value: number };

export type DayLike = {
  data: { dayNumber: number; manifest?: any };
};

export type StatsSummary = {
  totalDays: number;
  threadsSeries: Point[];
  facebookSeries: Point[];
  totalThreadsViews: number;
  totalFacebookReach: number;
  totalLinkedInImpressions: number;
};

export function computeStatsSummary(days: DayLike[]): StatsSummary {
  const threadsSeries: Point[] = [];
  const facebookSeries: Point[] = [];
  let totalThreadsViews = 0;
  let totalFacebookReach = 0;
  let totalLinkedInImpressions = 0;

  for (const day of days) {
    const m = day.data.manifest;
    if (!m) continue;
    const tv = m.threads?.stats?.views;
    if (typeof tv === 'number' && tv > 0) {
      threadsSeries.push({ day: day.data.dayNumber, value: tv });
      totalThreadsViews += tv;
    }
    const fr = m.facebook?.stats?.reach;
    if (typeof fr === 'number' && fr > 0) {
      facebookSeries.push({ day: day.data.dayNumber, value: fr });
      totalFacebookReach += fr;
    }
    const li = m.linkedin?.stats?.impressions;
    if (typeof li === 'number') totalLinkedInImpressions += li;
  }

  threadsSeries.sort((a, b) => a.day - b.day);
  facebookSeries.sort((a, b) => a.day - b.day);

  return {
    totalDays: days.length,
    threadsSeries,
    facebookSeries,
    totalThreadsViews,
    totalFacebookReach,
    totalLinkedInImpressions,
  };
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}
