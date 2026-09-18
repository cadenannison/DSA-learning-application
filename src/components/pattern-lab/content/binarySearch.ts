import type { Pattern } from '../types';
import {
  classicBinarySearchTrace,
  rotatedSearchTrace,
  firstLastPositionTrace,
  kokoEatingBananasTrace,
  medianTwoSortedArraysTrace,
} from '../traceBuilders';

export const binarySearchPattern: Pattern = {
  id: 'binary-search',
  label: 'Binary Search',
  short: 'Binary Search',
  accent: '#a67c1a',
  accentDark: '#eec267',
  blurb: 'Cut a sorted space in half at every step instead of scanning it — works on a literal sorted array, and just as well on any range of candidate answers with a monotonic yes/no test.',
  recurrenceGeneral: 'while (lo <= hi): mid = lo + (hi-lo)/2\n  if condition(mid) fits → shrink toward mid\n  else → shrink away from mid',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What binary search actually does',
      learnBody:
        'Binary search finds something in a <b>sorted</b> collection by repeatedly checking the middle element and throwing away the half that can\'t contain the answer. Look at the middle: if it\'s the target, you\'re done. If it\'s too small, the answer (if it exists) must be to the right, so forget the left half entirely. If it\'s too big, forget the right half. Each check halves the remaining space, so a million items takes only ~20 checks instead of up to a million.',
      learnFocus: [
        'Only works when the collection is sorted (or can be treated as sorted).',
        'Every comparison throws away roughly half of what\'s left.',
        'Stop when you find the target, or when the space is empty — lo has crossed hi.',
      ],
      cues: [
        'the array or list is explicitly sorted',
        'the problem hints at O(log n) — "can you do better than linear?"',
      ],
      examples: [
        { snippet: '"Given a <b>sorted array</b> of integers, return the index of target, or -1."', tell: '<b>"sorted array"</b> plus "find a value" is the textbook binary-search setup — halve the range every step.' },
        { snippet: '"...beating <b>O(n)</b> time complexity."', tell: 'An explicit call-out for better-than-linear time on a sorted input is a strong nudge toward O(log n) binary search.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'the loop invariant',
      learnHeading: 'The lo/hi/mid invariant — and when the array only "sort of" looks sorted',
      learnBody:
        'The whole algorithm rests on one invariant: at every iteration, if the target exists, it\'s somewhere in <b>[lo, hi]</b>. mid = lo + Math.floor((hi - lo) / 2) picks the middle without overflow, you compare nums[mid] to the target, and you move lo or hi to shrink [lo, hi] — never both, and never past mid without excluding it. That invariant still holds even when the array isn\'t plainly increasing, like a sorted array that\'s been rotated at some pivot. The trick: at every mid, <b>one of the two halves [lo, mid] or [mid, hi] is always plainly sorted</b> — compare nums[lo] to nums[mid] to figure out which one, then check whether the target falls inside that sorted half.',
      learnFocus: [
        'Invariant: if the target exists, it\'s in [lo, hi] — always.',
        'mid = lo + Math.floor((hi - lo) / 2) is the overflow-safe form.',
        'Rotated array: one half is always sorted — figure out which, then check if target is in it.',
      ],
      cues: [
        'the array was "rotated at some pivot" but is otherwise sorted',
        'you need to shrink lo or hi based on a comparison, not just index arithmetic',
      ],
      examples: [
        { snippet: '"...a sorted array is <b>rotated at an unknown pivot</b>. Given target, return its index."', tell: '"rotated" + "otherwise sorted" is the exact rotated-binary-search signal — one half is still plainly sorted at every mid.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'template variants',
      learnHeading: 'Biasing the boundary, and searching the answer instead of the array',
      learnFocus: [
        'Find-first: on a match, don\'t stop — record it and keep shrinking hi (search left).',
        'Find-last: on a match, record it and keep shrinking lo (search right).',
        '"Binary search on the answer": the array is a red herring — a candidate ANSWER range is what actually gets searched.',
      ],
      learnBody:
        'So far every match ended the search. Two closely related templates change what happens on a match: to find the <b>first</b> occurrence of a duplicated value, on a match you record the index but keep searching left (hi = mid - 1); to find the <b>last</b> occurrence, you keep searching right (lo = mid + 1) instead. Same skeleton, one line flipped. The bigger leap at this level: binary search doesn\'t require an array at all. It only needs a range of candidate values and a <b>monotonic</b> yes/no question — "does this candidate work?" — where every candidate past the threshold works and every one before it doesn\'t (or vice versa). Minimum eating speed, minimum days to ship packages, smallest capacity — all binary search over the space of possible answers, checking feasibility at each candidate instead of comparing array values.',
      cues: [
        'the problem says "first" or "last" occurrence of a possibly-duplicated value',
        'the problem asks to "minimize the maximum" or "find the minimum x such that..." over a range of numbers, with no sorted array in sight',
      ],
      confuse:
        '<b>Binary search on the array vs. binary search on the answer:</b> if you\'re comparing array elements to a target, you\'re searching the array. If the phrasing is "minimize the maximum..." or "find the minimum x such that [some check] holds", there may be no sorted data at all — you\'re binary searching a range of candidate numbers, and the giveaway is that the check is monotonic (if speed s works, every speed greater than s also works).',
      examples: [
        { snippet: '"...find the <b>minimum eating speed</b> such that she can finish all the bananas within h hours."', tell: '"minimum eating speed such that..." names a candidate answer range (1..max pile) and a feasibility check — binary search on the answer, not on the piles.' },
        { snippet: '"Given a sorted array with duplicates, find the <b>first and last position</b> of a given target."', tell: '"first and last position" of a duplicated value is the two-template signal — one lower-bound search, one upper-bound search.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'the hard parts',
      learnHeading: 'Combining structures, and invariants that are easy to get subtly wrong',
      learnBody:
        'The hardest binary-search problems combine it with a second structure, or push the invariant reasoning further than a single lo/hi/mid loop. Finding the median of two sorted arrays in O(log(min(m,n))) means binary searching a <b>partition point</b> in the smaller array, then deriving the matching partition in the other array algebraically — the "target" you\'re searching for isn\'t a value at all, it\'s a split point where every element on the left side of both arrays combined is ≤ every element on the right. This is also where off-by-one bugs live: using lo < hi vs. lo <= hi inconsistently with how mid is computed can infinite-loop (mid = lo + Math.floor((hi-lo)/2) never changes when lo = hi - 1 and you set lo = mid without a +1), or silently miss the boundary element entirely.',
      learnFocus: [
        'Partition search: binary search a split point, not a value — matching cut in the second array is derived, not searched.',
        'A boundary condition ("valid" partition) can be a full stopping condition, not just a comparison.',
        'Mismatched loop condition (lo < hi vs lo <= hi) and mid formula is the #1 source of infinite loops — verify by hand on a 2-element case.',
      ],
      cues: [
        'two sorted structures need to be combined into one answer, not just one array searched',
        'the "target" being searched for is a split point, threshold, or property — not a literal array value',
      ],
      examples: [
        { snippet: '"Given two sorted arrays, return the <b>median</b> of the two combined, in O(log(m+n)) time."', tell: 'The time bound rules out merging; needing the combined median in log time is the median-of-two-sorted-arrays partition-search signature.' },
      ],
    },
  ],

  variants: [
    {
      id: 'classic-binary-search',
      label: 'Classic Binary Search',
      short: '1D · sorted array',
      difficulty: 'simple',
      statement: 'Given the sorted array <b>[-1, 0, 3, 5, 9, 12]</b>, find the index of target <b>9</b> (or -1 if absent).',
      recurrence: 'mid = lo + floor((hi-lo)/2); compare nums[mid] to target; shrink [lo, hi] accordingly',
      complexity: 'O(log n) time · O(1) space',
      twist: 'The baseline template every other variant on this page is a variation of — get this loop exactly right first.',
      viz: 'array',
      trace: () => classicBinarySearchTrace([-1, 0, 3, 5, 9, 12], 9),
    },
    {
      id: 'rotated-search',
      label: 'Search in Rotated Sorted Array',
      short: '1D · rotated array',
      difficulty: 'easy',
      statement: 'A sorted array was rotated at an unknown pivot: <b>[4, 5, 6, 7, 0, 1, 2]</b>. Find the index of target <b>0</b>.',
      recurrence: 'At each mid, one of [lo,mid] / [mid,hi] is plainly sorted — check which, then whether target is inside it',
      complexity: 'O(log n) time · O(1) space',
      twist: 'The array never looks fully sorted, but one half always does — the loop invariant just needs one extra check to figure out which half.',
      viz: 'array',
      trace: () => rotatedSearchTrace([4, 5, 6, 7, 0, 1, 2], 0),
    },
    {
      id: 'first-last-position',
      label: 'Find First and Last Position of Element',
      short: '1D · lower/upper bound',
      difficulty: 'medium',
      statement: 'In the sorted array <b>[5, 7, 7, 8, 8, 10]</b> (with duplicates), find the first and last index of target <b>8</b>.',
      recurrence: 'Two searches: on a match, bias hi = mid - 1 for the first occurrence, lo = mid + 1 for the last',
      complexity: 'O(log n) time · O(1) space',
      twist: 'A match no longer ends the search — which direction you keep narrowing after a hit is the entire trick.',
      viz: 'array',
      trace: () => firstLastPositionTrace([5, 7, 7, 8, 8, 10], 8),
    },
    {
      id: 'koko-eating-bananas',
      label: 'Koko Eating Bananas',
      short: 'binary search on the answer',
      difficulty: 'hard',
      statement: 'Piles of bananas <b>[3, 6, 7, 11]</b>, <b>h = 8</b> hours. Find the minimum constant eating speed so all piles are finished within h hours.',
      recurrence: 'lo=1, hi=max(piles); feasible(speed) = total ceil(pile/speed) hours <= h; binary search the speed range',
      complexity: 'O(n log(max(piles))) time · O(1) space',
      twist: 'There\'s no array to search at all — the search space is candidate eating speeds, and the "comparison" is a feasibility check, not an equality test.',
      viz: 'array',
      trace: () => kokoEatingBananasTrace([3, 6, 7, 11], 8),
    },
    {
      id: 'median-two-sorted-arrays',
      label: 'Median of Two Sorted Arrays',
      short: 'partition search',
      difficulty: 'hard',
      statement: 'Two sorted arrays <b>[1, 2]</b> and <b>[3, 4]</b>. Find the median of the combined 4 elements in O(log(min(m,n))) time.',
      recurrence: 'Binary search partition i in the smaller array; derive j in the other so left/right halves split evenly; valid when max(left) <= min(right)',
      complexity: 'O(log(min(m, n))) time · O(1) space',
      twist: 'The hardest classic binary search: you\'re not searching for a value in either array, you\'re searching for a split point where the combined left and right halves balance.',
      viz: 'array',
      trace: () => medianTwoSortedArraysTrace([1, 2], [3, 4]),
    },
  ],

  syntax: [
    {
      title: 'Classic loop (overflow-safe mid)',
      code: 'let lo = 0, hi = nums.length - 1;\nwhile (lo <= hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  if (nums[mid] === target) return mid;\n  else if (nums[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}\nreturn -1;',
      note: 'lo + Math.floor((hi - lo) / 2) avoids the (lo + hi) / 2 overflow trap and is the form to default to.',
    },
    {
      title: 'Lower bound (find-first bias)',
      code: 'let lo = 0, hi = nums.length - 1, ans = -1;\nwhile (lo <= hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  if (nums[mid] === target) { ans = mid; hi = mid - 1; }\n  else if (nums[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}',
      note: 'On a match, don\'t return — record it and keep shrinking hi to look for an earlier one.',
    },
    {
      title: 'Upper bound (find-last bias)',
      code: 'let lo = 0, hi = nums.length - 1, ans = -1;\nwhile (lo <= hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  if (nums[mid] === target) { ans = mid; lo = mid + 1; }\n  else if (nums[mid] < target) lo = mid + 1;\n  else hi = mid - 1;\n}',
      note: 'Same skeleton as lower bound with one line flipped: on a match, push lo up instead of hi down.',
    },
    {
      title: 'Binary search on the answer',
      code: 'let lo = MIN_ANSWER, hi = MAX_ANSWER;\nwhile (lo < hi) {\n  const mid = lo + Math.floor((hi - lo) / 2);\n  if (feasible(mid)) hi = mid;   // mid works — try smaller\n  else lo = mid + 1;              // mid fails — need bigger\n}\nreturn lo;   // smallest feasible candidate',
      note: 'Needs `feasible` to be monotonic (false...false, true...true) over [lo, hi] — no monotonicity, no binary search.',
    },
    {
      title: 'Rotated array: which half is sorted',
      code: 'const mid = lo + Math.floor((hi - lo) / 2);\nif (nums[lo] <= nums[mid]) {\n  // left half [lo, mid] is plainly sorted\n} else {\n  // right half [mid, hi] is plainly sorted\n}',
      note: 'Check this first at every mid, then test whether target falls inside that sorted half before deciding which way to move.',
    },
    {
      title: 'Partition search (median of two arrays)',
      code: 'let lo = 0, hi = m;   // m = smaller array\'s length\nwhile (lo <= hi) {\n  const i = lo + Math.floor((hi - lo) / 2);\n  const j = Math.floor((m + n + 1) / 2) - i;\n  // compare edges: nums1[i-1]/nums1[i] vs nums2[j-1]/nums2[j]\n}',
      note: 'i is searched; j is always derived from i so the left half stays exactly half (or one more) of the combined length.',
    },
  ],
};
