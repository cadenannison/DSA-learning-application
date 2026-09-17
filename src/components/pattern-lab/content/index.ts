import type { Pattern } from '../types';
import { dpPattern } from './dp';
import { graphsPattern } from './graphs';

/** The finished patterns. Add to this array as more are authored (see README). */
export const PATTERNS: Pattern[] = [dpPattern, graphsPattern];

/**
 * Labels for patterns that exist in the app's curriculum but don't have
 * Pattern Lab content yet. Shown as disabled "soon" tabs so the full set is
 * visible from day one. Remove an entry here once its Pattern object is
 * added to PATTERNS above, in the same relative order.
 */
export const SOON_PATTERNS: string[] = [
  'Backtracking', 'BFS / DFS', 'Binary Search', 'Greedy', 'Heaps',
  'Intervals', 'Linked List', 'Sliding Window', 'Stacks / Queues',
  'Trees', 'Tries', 'Two Pointers',
];
