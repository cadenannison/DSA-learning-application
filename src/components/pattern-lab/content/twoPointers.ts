import type { Pattern } from '../types';
import {
  twoSumSortedTrace,
  validPalindromeTrace,
  threeSumTrace,
  containerWithMostWaterTrace,
  trappingRainWaterTrace,
} from '../traceBuilders';

export const twoPointersPattern: Pattern = {
  id: 'two-pointers',
  label: 'Two Pointers',
  short: 'Two Pointers',
  accent: '#5a3fa8',
  accentDark: '#b09bf0',
  blurb: 'Walk two indices through a structure at once — often from opposite ends inward — to turn an O(n²) nested-loop scan into a single O(n) pass.',
  recurrenceGeneral: 'left = 0, right = n − 1\nwhile (left < right):\n  compare/combine cells[left], cells[right]\n  move left and/or right based on that comparison',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What two pointers actually is',
      learnBody:
        'Two pointers means tracking two indices into the same array (or string) at once instead of one, and moving them as you go — often starting from opposite ends and walking inward. The whole point is to avoid a nested loop: instead of checking every pair of positions (O(n²)), each pointer only ever moves forward through the data it hasn\'t looked at yet, so the total work stays O(n). Whenever a brute-force solution would check every pair with two nested loops, ask whether one smart pass with two indices can replace it.',
      learnFocus: [
        'Two indices into one array, moving as the scan progresses.',
        'Replaces checking every pair (O(n²)) with a single O(n) pass.',
        'Very often the two indices start at opposite ends and move inward.',
      ],
      cues: [
        'brute force would be "for each i, for each j" checking pairs',
        'a pair, span, or pairing question over an array or string',
      ],
      examples: [
        { snippet: '"Given a sorted array, return the <b>indices of the two numbers</b> that add up to target."', tell: 'A <b>pair</b> question over an array is the first tell — check whether a single pass with two indices can replace the nested-loop pair check.' },
        { snippet: '"Determine if the string <b>reads the same forwards and backwards</b>."', tell: 'Comparing the front of a sequence against its back is exactly what two pointers, started at opposite ends, are built for.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'close the gap',
      learnHeading: 'Closing the gap on sorted data',
      learnBody:
        'The classic shape: two pointers start at opposite ends of a <b>sorted</b> array, and at each step you compare the pair they point to against a target. If the current pair is too small, moving <b>left</b> forward is the only move that can increase it — every value to its right is ≥ the one it\'s leaving. If it\'s too big, moving <b>right</b> backward is the only move that can decrease it. Sortedness is what makes this safe: without it, moving a pointer could skip past the actual answer, because you\'d have no guarantee about which direction values change in.',
      learnFocus: [
        'Too small → move left pointer right (the only way to increase the sum).',
        'Too big → move right pointer left (the only way to decrease it).',
        'This only works because the array is sorted — that\'s the precondition, not a detail.',
      ],
      cues: [
        'the array is explicitly sorted (or you sort it yourself first)',
        'looking for a pair, or closing a gap, based on comparing to a target',
      ],
      examples: [
        { snippet: '"...numbers is sorted in <b>non-decreasing order</b>. Find two numbers such that they add up to target."', tell: '"sorted" plus "two numbers that add up to" is the canonical opposite-end, close-the-gap setup.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'fix one, scan two',
      learnHeading: 'Combining an outer loop with an inner two-pointer scan',
      learnBody:
        'The two-pointer idea composes with an outer loop: fix one element, then run the same opposite-end scan on everything after it (3Sum fixes index i, then two-pointers the remainder for a pair that cancels nums[i]). This turns an O(n³) triple-nested-loop problem into O(n²) — one O(n) outer loop around an O(n) inner scan. The other thing that shows up here for the first time is duplicate handling: once you\'ve recorded a match, you need to skip past any repeated values (both for the fixed index and for each inner pointer) or you\'ll emit the same answer more than once.',
      learnFocus: [
        'Fix one index with an outer loop; two-pointer the rest for each fixed value.',
        'O(n²) instead of O(n³) — one O(n) scan nested inside another O(n) loop.',
        'After a match, skip repeated values on the fixed index and on both inner pointers to avoid duplicate results.',
      ],
      cues: [
        'a k-sum variant: three or more numbers that combine to a target',
        'the problem explicitly warns against duplicate triplets/quadruplets in the output',
      ],
      confuse:
        '<b>Two pointers vs. sliding window:</b> both often look like a `left`/`right` pair moving through an array, but the mental model is different. Two pointers (this pattern) usually means two independent — sometimes fast-jumping — indices with no requirement that everything between them means anything as a group. A sliding window specifically maintains a <b>contiguous range</b> and some running aggregate over everything currently inside it (a sum, a character count). If you\'re not tracking "everything between left and right" as a unit, it\'s two pointers, not a window.',
      examples: [
        { snippet: '"Find all <b>unique triplets</b> in the array which give the sum of zero."', tell: '"triplets" + "unique" is the fix-one-then-two-pointer shape, with duplicate-skipping called out directly by "unique".' },
      ],
    },
    {
      tier: 'hard',
      tag: 'greedy pointer moves',
      learnHeading: 'When the move isn\'t a direct comparison to a target',
      learnBody:
        'The hardest two-pointer problems don\'t compare a pair to a fixed target at all — the move comes from a <b>local greedy argument</b> you have to prove to yourself first. In Container With Most Water, you always move the pointer at the <b>shorter</b> line inward, because keeping the shorter line in place can never beat what you\'ve already computed at this width: the water level is capped by the shorter side, and any wider container using it is strictly worse than the one you just measured, so moving the taller side inward could only ever throw away area for free. These problems also often carry extra running state alongside the two pointers themselves — Trapping Rain Water tracks a running maxLeft and maxRight as the pointers close in, because the water trapped at either pointer only ever depends on the max height already seen from that side, not on values yet to be visited.',
      learnFocus: [
        'The pointer move follows from a greedy proof, not a direct value-vs-target comparison.',
        'Container With Most Water: always advance the shorter side — the taller side could never have done better at this width.',
        'Some variants need extra state (maxLeft/maxRight) updated alongside the pointers as they close in.',
      ],
      cues: [
        '"container", "water", or "area between two lines/walls" phrasing',
        'the greedy choice needs a short proof before you trust it — not just "sorted, so obviously"',
      ],
      examples: [
        { snippet: '"...find two lines that together with the x-axis form a container that <b>holds the most water</b>."', tell: '"container/water/area between two lines" signals the greedy move-the-shorter-side variant, not a plain comparison to a target.' },
        { snippet: '"Given n non-negative integers representing an elevation map, compute how much water it can <b>trap</b> after raining."', tell: '"trap"/"rain water" is the running-maxLeft/maxRight two-pointer variant — O(1) space instead of precomputing two arrays.' },
      ],
    },
  ],

  variants: [
    {
      id: 'two-sum-ii',
      label: 'Two Sum II — Sorted Array',
      short: 'opposite-end · sorted',
      difficulty: 'simple',
      statement: 'Given the sorted array <b>[2, 7, 11, 15]</b> and target <b>9</b>, return the 1-indexed positions of the two numbers that add up to the target.',
      recurrence: 'while (left < right): sum too small → left++; too big → right--; equal → done',
      complexity: 'O(n) time · O(1) space',
      twist: 'Sortedness is what licenses moving just one pointer per step — a brute-force pair check would be O(n²).',
      viz: 'array',
      trace: () => twoSumSortedTrace([2, 7, 11, 15], 9),
    },
    {
      id: 'valid-palindrome',
      label: 'Valid Palindrome',
      short: 'close-inward · string',
      difficulty: 'easy',
      statement: 'Determine if <b>"A man, a plan, a canal: Panama"</b> is a palindrome, considering only alphanumeric characters and ignoring case.',
      recurrence: 'filter to lowercase alphanumeric once; then while (left < right): mismatch → false; else left++, right--',
      complexity: 'O(n) time · O(n) space (for the filtered string)',
      twist: 'The two-pointer scan is trivial once you do the real work up front: filtering and lowercasing the string exactly once, rather than re-checking characters inside the loop.',
      viz: 'array',
      trace: () => validPalindromeTrace('A man, a plan, a canal: Panama'),
    },
    {
      id: '3sum',
      label: '3Sum',
      short: 'fix-one · inner scan',
      difficulty: 'medium',
      statement: 'Given <b>[-1, 0, 1, 2, -1, -4]</b>, find all unique triplets that sum to zero.',
      recurrence: 'sort; for each i: left=i+1, right=n-1; while (left<right): too small → left++; too big → right--; match → record & skip dupes',
      complexity: 'O(n²) time · O(1) extra space (besides sort + output)',
      twist: 'An outer loop fixing one element wraps the exact same opposite-end scan from Two Sum II — plus duplicate-skipping so the same triplet doesn\'t get recorded twice.',
      viz: 'array',
      trace: () => threeSumTrace([-1, 0, 1, 2, -1, -4]),
    },
    {
      id: 'container-with-most-water',
      label: 'Container With Most Water',
      short: 'greedy · shorter side',
      difficulty: 'hard',
      statement: 'Given heights <b>[1, 8, 6, 2, 5, 4, 8, 3, 7]</b>, find two lines that, with the x-axis, form the container holding the most water.',
      recurrence: 'left=0, right=n-1; while (left<right): area = min(h[left],h[right]) × width; best = max(best, area); move the shorter side inward',
      complexity: 'O(n) time · O(1) space',
      twist: 'The pointer move isn\'t "closer to a target" — it\'s a greedy proof: the shorter side caps every container it\'s part of, so moving it is the only move that could possibly do better.',
      viz: 'array',
      trace: () => containerWithMostWaterTrace([1, 8, 6, 2, 5, 4, 8, 3, 7]),
    },
    {
      id: 'trapping-rain-water',
      label: 'Trapping Rain Water',
      short: 'greedy · running max',
      difficulty: 'hard',
      statement: 'Given elevation map <b>[0,1,0,2,1,0,1,3,2,1,2,1]</b>, compute how much water it traps after raining.',
      recurrence: 'left=0, right=n-1, maxLeft=maxRight=0; while (left<right): process whichever side has the smaller running max, add trapped water, advance that pointer',
      complexity: 'O(n) time · O(1) space',
      twist: 'The O(1)-space version tracks maxLeft/maxRight as running state alongside the pointers instead of precomputing two full max-so-far arrays.',
      viz: 'array',
      trace: () => trappingRainWaterTrace([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]),
    },
  ],

  syntax: [
    {
      title: 'Opposite-end pointer skeleton (sorted data)',
      code: 'let left = 0, right = arr.length - 1;\nwhile (left < right) {\n  const sum = arr[left] + arr[right];\n  if (sum === target) break;\n  else if (sum < target) left++;\n  else right--;\n}',
      note: 'The default shape for "find a pair in a sorted array" — each branch moves exactly one pointer.',
    },
    {
      title: 'Fix-one-then-two-pointer (k-sum)',
      code: 'for (let i = 0; i < a.length - 2; i++) {\n  if (i > 0 && a[i] === a[i - 1]) continue; // skip dupe\n  let l = i + 1, r = a.length - 1;\n  while (l < r) { /* opposite-end scan */ }\n}',
      note: 'Wraps the opposite-end skeleton in an outer loop. Requires the array sorted first — that\'s what makes both the inner scan and the duplicate-skip comparison (`a[i] === a[i-1]`) valid.',
    },
    {
      title: 'Skipping duplicates after a match',
      code: 'while (l < r && a[l] === a[l + 1]) l++;\nwhile (l < r && a[r] === a[r - 1]) r--;\nl++; r--;',
      note: 'Run this only after recording a match — skip past every repeat of the value that just matched, on both pointers, before moving on.',
    },
    {
      title: 'Greedy move-the-shorter-side',
      code: 'while (left < right) {\n  best = Math.max(best, Math.min(h[left], h[right]) * (right - left));\n  if (h[left] < h[right]) left++;\n  else right--;\n}',
      note: 'No comparison to a target — the move is always "advance whichever side is the current bottleneck," because that side can never produce a better result if left in place.',
    },
    {
      title: 'Running max-from-each-side (trapping rain water)',
      code: 'let maxLeft = 0, maxRight = 0;\n// at position left: water = max(0, maxLeft - h[left])\n// at position right: water = max(0, maxRight - h[right])\n// always advance the side with the SMALLER running max',
      note: 'O(1)-space alternative to precomputing leftMax[]/rightMax[] arrays — the pointer with the smaller running max is the only one whose water amount is already fully determined.',
    },
    {
      title: 'Same-direction pointers (in-place partition)',
      code: 'let slow = 0;\nfor (let fast = 0; fast < arr.length; fast++) {\n  if (keep(arr[fast])) {\n    arr[slow] = arr[fast];\n    slow++;\n  }\n}\n// arr[0..slow-1] is the compacted result',
      note: 'Not every two-pointer problem closes inward — removing/compacting elements in place uses two pointers moving in the <b>same</b> direction at different speeds instead.',
    },
  ],
};
