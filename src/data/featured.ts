export interface FeaturedPost {
  dayNumber: number;
  customLabel: string;       // Short zh-TW label for the homepage card
}

// Hand-picked posts shown in the homepage "Featured" section.
// Pick 4-6 posts that best represent the work and convert visitors.
// Reorder freely; the array order = display order.
export const FEATURED_POSTS: FeaturedPost[] = [
  // { dayNumber: 121, customLabel: '在 Claude Code 裡直接呼叫 Codex' },
  // ...filled in launch-prep
];

// Day numbers manually flagged as "top performers" — engagement above the bar.
// Only flagged days display the metrics block on /day/[n].
export const TOP_PERFORMERS = new Set<number>([
  // 121, 100, 50, ...filled in launch-prep
]);
