import { test, expect } from 'vitest';
import { isTopPerformer } from '../src/lib/metrics';

test('isTopPerformer returns false for unflagged day', () => {
  expect(isTopPerformer(99999)).toBe(false);
});

// Add a real flagged day before this test passes.
// Update the test once TOP_PERFORMERS has at least one entry.
