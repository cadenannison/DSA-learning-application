import type { Pattern } from '../types';
import { dpPattern } from './dp';
import { graphsPattern } from './graphs';
import { backtrackingPattern } from './backtracking';
import { bfsDfsPattern } from './bfsDfs';
import { binarySearchPattern } from './binarySearch';
import { greedyPattern } from './greedy';
import { heapsPattern } from './heaps';
import { intervalsPattern } from './intervals';
import { linkedListPattern } from './linkedList';
import { slidingWindowPattern } from './slidingWindow';
import { stacksQueuesPattern } from './stacksQueues';
import { treesPattern } from './trees';
import { triesPattern } from './tries';
import { twoPointersPattern } from './twoPointers';

export const PATTERNS: Pattern[] = [
  dpPattern,
  graphsPattern,
  backtrackingPattern,
  bfsDfsPattern,
  binarySearchPattern,
  greedyPattern,
  heapsPattern,
  intervalsPattern,
  linkedListPattern,
  slidingWindowPattern,
  stacksQueuesPattern,
  treesPattern,
  triesPattern,
  twoPointersPattern,
];

// All 14 patterns are now content-complete — nothing left "soon".
export const SOON_PATTERNS: string[] = [];
