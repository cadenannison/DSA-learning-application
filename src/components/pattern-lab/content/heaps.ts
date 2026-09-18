import type { Pattern } from '../types';
import { kthLargestTrace, topKFrequentTrace, findMedianTrace, mergeKListsTrace, kthSmallestMatrixTrace } from '../traceBuilders';

export const heapsPattern: Pattern = {
  id: 'heaps',
  label: 'Heaps',
  short: 'Heaps',
  accent: '#7d4fc9',
  accentDark: '#b79bff',
  blurb: 'Keep a changing collection\'s min or max always one peek away, instead of re-sorting every time something changes.',
  recurrenceGeneral: 'push(x): append x, then sift it up toward the root\npop(): swap root with the last leaf, drop the leaf, sift the new root down',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a heap is actually for',
      learnBody:
        'A heap is a data structure that keeps one specific value — the minimum, or the maximum — always available at the root, no matter how many items get added or removed. The trick is that it never fully sorts anything: it only keeps a loose "parent is smaller (or bigger) than its children" ordering, which is cheap to maintain. That\'s the whole trade: a heap answers "what\'s the smallest/largest right now?" in O(1), and stays that way after every insert or removal, for a fraction of the cost of re-sorting the whole collection each time.',
      learnFocus: [
        'A heap always keeps the min (or max) instantly available at the root.',
        'It maintains a loose parent/child ordering, not a full sort.',
        'Push and pop are both fast (O(log n)) — cheaper than re-sorting after every change.',
      ],
      cues: [
        'the problem repeatedly asks "what\'s the smallest/largest one left?"',
        'a collection changes over time (items added or removed) and you keep needing its current extreme',
      ],
      examples: [
        { snippet: '"Find the <b>k</b>th <b>largest</b> element in the array."', tell: 'Needing "the current largest/smallest" without fully sorting is the core heap signal.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'top-K',
      learnHeading: 'The classic signature: top-K',
      learnBody:
        'The most common heap pattern by far is "top-K": keep a heap of exactly size K, and every time a new item would improve it, push it and then evict the worst one you\'re currently holding. For the K <b>largest</b>, keep a <b>min</b>-heap of size K — the moment it grows past K, pop the minimum, since that\'s the weakest of your K best-so-far. The heap size is the whole trick: you never hold more than K items, so each operation costs O(log K), not O(log n).',
      learnFocus: [
        'Top-K largest → min-heap of size K (evict the min when it overflows).',
        'Top-K smallest → max-heap of size K (evict the max when it overflows).',
        'The heap only ever holds K items — that\'s what keeps it cheap.',
      ],
      cues: [
        '"the k most/least ..." or "the k closest/farthest ..."',
        'a running top-K that has to stay correct as more items arrive',
      ],
      confuse:
        '<b>Sort once vs. heap:</b> if the whole collection is static and you only need the answer once, just sort it — O(n log n) once beats building and maintaining a heap. Reach for a heap specifically when items arrive over time (one at a time, or in a stream) and you repeatedly need the current min or max without re-sorting from scratch on every arrival.',
      examples: [
        { snippet: '"Given a non-empty array of integers, return the <b>k most frequent</b> elements."', tell: '"the k most/least..." is the clearest top-K tell — keep a size-K heap over (frequency, value) pairs.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'two heaps',
      learnHeading: 'Two heaps at once: splitting a running middle',
      learnBody:
        'Some problems need two different extremes from the same growing collection simultaneously — most famously, a running median needs both "the largest of the smaller half" and "the smallest of the larger half" at the same time. One heap can\'t give you that; two can. Keep a <b>max-heap</b> for the lower half of the data and a <b>min-heap</b> for the upper half, and after every insert, rebalance so their sizes never differ by more than one. The median then falls right out of the two roots — no sorting, ever, of the full stream.',
      learnFocus: [
        'Max-heap holds the lower half; min-heap holds the upper half.',
        'Rebalance sizes (differ by at most 1) after every single insert.',
        'The two roots you already have are the answer — no scan needed.',
      ],
      cues: [
        '"find the median as numbers arrive" / "at any point, return the running X"',
        'the answer depends on comparing "the top of the small side" against "the bottom of the big side"',
      ],
      examples: [
        { snippet: '"Design a data structure that supports adding integers <b>and finding the median</b> of all integers so far."', tell: '"median... so far" as numbers stream in is the two-heap signature — one heap alone can\'t track both sides of the middle.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'the hard parts',
      learnHeading: 'Heaps of pointers, and heap vs. binary search',
      learnBody:
        'Two harder heap patterns show up repeatedly. First: merging K sorted structures. The heap doesn\'t hold the data — it holds a <b>pointer</b> per structure ("the current head of list i"), and you repeatedly pop the smallest pointer, output its value, and push that structure\'s next element. The heap stays at size K the whole time, no matter how large the K structures are combined. Second: matrix/grid problems that are sorted along both axes (like "kth smallest in a sorted matrix") can be solved with a heap-of-candidates expanding right/down from a seed — or, just as validly, with binary search over the <i>value range</i>, counting how many elements are ≤ a candidate value each guess. Both are real answers; the heap is usually simpler to write, binary search is usually better in asymptotic complexity when K is large.',
      learnFocus: [
        'Merging K sorted things: the heap holds "current head of structure i", not the data itself.',
        'A heap-of-pointers never grows past size K, however large the K inputs are.',
        'Sorted matrix/grid problems: heap-of-candidates and binary-search-on-value-range are both legitimate — know the trade-off.',
      ],
      cues: [
        '"merge k sorted lists/arrays/streams" → one heap entry per input, holding its current position',
        'a matrix or grid sorted along rows and columns, asked for the kth value → heap-of-candidates or binary search on value',
      ],
      examples: [
        { snippet: '"You are given an array of <b>k</b> linked-lists, each sorted... <b>merge</b> all the linked-lists into one sorted linked-list."', tell: '"merge k sorted..." is the heap-of-pointers signature — the heap tracks one candidate per input list, not every node.' },
        { snippet: '"Given an <b>n x n matrix</b> where each row and column is sorted... return the <b>kth</b> smallest element."', tell: 'Sorted-in-both-directions plus "kth smallest" signals a candidate heap seeded at the corner, or binary search over the value range.' },
      ],
    },
  ],

  variants: [
    {
      id: 'kth-largest',
      label: 'Kth Largest Element in an Array',
      short: 'array · min-heap size k',
      difficulty: 'simple',
      statement: 'Given <b>nums = [3, 2, 1, 5, 6, 4]</b>, find the <b>2nd</b> largest element.',
      recurrence: 'Keep a min-heap of size k: push every value; whenever the heap exceeds size k, pop the min.',
      complexity: 'O(n log k) time · O(k) space',
      twist: 'The heap never grows past size k — it forgets everything except "the k largest seen so far", which is exactly the point.',
      viz: 'array',
      trace: () => kthLargestTrace([3, 2, 1, 5, 6, 4], 2),
    },
    {
      id: 'top-k-frequent',
      label: 'Top K Frequent Elements',
      short: 'array · top-K by frequency',
      difficulty: 'easy',
      statement: 'Given <b>nums = [1, 1, 1, 2, 2, 3]</b> and <b>k = 2</b>, return the <b>2</b> most frequent elements.',
      recurrence: 'Count frequencies with a map, then keep a min-heap of size k over (count, value) pairs, evicting the least-frequent entry whenever it overflows.',
      complexity: 'O(n log k) time · O(n) space',
      twist: 'Two data structures, one job: the frequency map turns values into counts, and the size-k heap turns "count the top K" into the same eviction pattern as Kth Largest.',
      viz: 'array',
      trace: () => topKFrequentTrace([1, 1, 1, 2, 2, 3], 2),
    },
    {
      id: 'find-median',
      label: 'Find Median from Data Stream',
      short: 'array · two heaps',
      difficulty: 'medium',
      statement: 'Numbers arrive one at a time: <b>5, 15, 1, 3</b>. After each one, report the median of everything seen so far.',
      recurrence: 'Max-heap for the lower half, min-heap for the upper half; after every insert, rebalance so the sizes differ by at most 1.',
      complexity: 'O(log n) per insert · O(n) space',
      twist: 'Neither heap alone can answer this — the median sits exactly between them, so you need both roots at once, kept balanced after every single number.',
      viz: 'array',
      trace: () => findMedianTrace([5, 15, 1, 3]),
    },
    {
      id: 'merge-k-lists',
      label: 'Merge K Sorted Lists',
      short: 'nodes · heap of pointers',
      difficulty: 'hard',
      statement: 'Merge these <b>3</b> sorted lists into one sorted sequence: <b>[1,4,5]</b>, <b>[1,3,4]</b>, <b>[2,6]</b>.',
      recurrence: 'Seed a min-heap with each list\'s head; repeatedly pop the smallest, output it, and push its list\'s next node.',
      complexity: 'O(n log k) time · O(k) space, where n is the total number of nodes across all k lists',
      twist: 'The heap holds pointers, not data — exactly k candidates at any time, never all n nodes, no matter how long the lists get.',
      viz: 'nodes',
      trace: () => mergeKListsTrace([[1, 4, 5], [1, 3, 4], [2, 6]]),
    },
    {
      id: 'kth-smallest-matrix',
      label: 'Kth Smallest Element in a Sorted Matrix',
      short: 'matrix · heap of candidates',
      difficulty: 'hard',
      statement: 'In this matrix, sorted along every row and column, find the <b>8</b>th smallest value:\n<b>[[1,5,9],[10,11,13],[12,13,15]]</b>.',
      recurrence: 'Min-heap of candidates, seeded at the top-left; each pop expands its right and down neighbors (if not already visited) as new candidates.',
      complexity: 'O(k log k) time · O(k) space (binary search on the value range is an O((n log(max−min)) alternative)',
      twist: 'Sorted in two directions at once means the next-smallest value is always adjacent to something you\'ve already popped — you never need to look at the whole matrix.',
      viz: 'matrix',
      trace: () => kthSmallestMatrixTrace([[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8),
    },
  ],

  syntax: [
    { title: 'Manual array-heap: sift-up / sift-down', code: 'function push(a, val, cmp) {\n  a.push(val);\n  let i = a.length - 1;\n  while (i > 0) {\n    const p = (i - 1) >> 1;\n    if (cmp(a[i], a[p]) < 0) { [a[i],a[p]]=[a[p],a[i]]; i = p; }\n    else break;\n  }\n}', note: 'JS has no built-in priority queue — this comparator-driven sift-up is the whole "push" half of a real heap in ~8 lines.' },
    { title: 'Manual array-heap: pop', code: 'function pop(a, cmp) {\n  const top = a[0];\n  const last = a.pop();\n  if (a.length) {\n    a[0] = last;\n    let i = 0;\n    while (true) {\n      const l=2*i+1, r=2*i+2; let s=i;\n      if (l<a.length && cmp(a[l],a[s])<0) s=l;\n      if (r<a.length && cmp(a[r],a[s])<0) s=r;\n      if (s===i) break;\n      [a[i],a[s]]=[a[s],a[i]]; i=s;\n    }\n  }\n  return top;\n}', note: 'Move the last leaf to the root, then sift it down toward whichever child is smaller — that restores the heap property in O(log n).' },
    { title: 'Min-heap of size k, with eviction', code: 'const heap = [];\nfor (const x of items) {\n  push(heap, x, (a, b) => a - b);\n  if (heap.length > k) pop(heap, (a, b) => a - b);\n}\n// heap now holds the k LARGEST items seen', note: 'The top-K skeleton: a min-heap of size k always evicts its own minimum, so what survives is the k biggest values.' },
    { title: 'Two-heap running median skeleton', code: 'function addNum(num) {\n  if (!lo.length || num <= lo[0]) push(lo, num, (a,b)=>b-a);\n  else push(hi, num, (a,b)=>a-b);\n  if (lo.length > hi.length + 1) push(hi, pop(lo,(a,b)=>b-a), (a,b)=>a-b);\n  else if (hi.length > lo.length) push(lo, pop(hi,(a,b)=>a-b), (a,b)=>b-a);\n}', note: 'lo is a max-heap (comparator flipped: b - a), hi is a min-heap. Rebalancing after every insert is what keeps the median a peek, not a scan.' },
    { title: 'Heap-of-pointers into k lists', code: 'const heap = [];\nlists.forEach((list, i) =>\n  list.length && push(heap, {val: list[0], i, j: 0}, (a,b)=>a.val-b.val));\nwhile (heap.length) {\n  const {val, i, j} = pop(heap, (a,b)=>a.val-b.val);\n  out.push(val);\n  if (j + 1 < lists[i].length)\n    push(heap, {val: lists[i][j+1], i, j: j+1}, (a,b)=>a.val-b.val);\n}', note: 'The heap entry is {value, which list, which index} — a pointer, not the list itself. Size stays k the entire merge.' },
    { title: 'Comparator/tuple trick for object heaps', code: 'push(heap, {count, value}, (a, b) => a.count - b.count);\n// or, for a plain tuple:\npush(heap, [count, value], (a, b) => a[0] - b[0]);', note: 'A comparator is how you tell a heap "smaller" means for anything richer than a bare number — pass whichever field should drive ordering.' },
  ],
};
