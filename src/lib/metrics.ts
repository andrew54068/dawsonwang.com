import { TOP_PERFORMERS } from '../data/featured';

export function isTopPerformer(dayNumber: number): boolean {
  return TOP_PERFORMERS.has(dayNumber);
}
