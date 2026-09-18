import type { Pattern } from '../types';
import {
  mergeIntervalsTrace,
  insertIntervalTrace,
  eraseOverlapIntervalsTrace,
  meetingRoomsIITrace,
  intervalIntersectionTrace,
} from '../traceBuilders';

export const intervalsPattern: Pattern = {
  id: 'intervals',
  label: 'Intervals',
  short: 'Intervals',
  accent: '#c2701f',
  accentDark: '#ffb469',
  blurb: 'Ranges [start, end] that may overlap — sort them the right way first, then sweep once to merge, select, or count them.',
  recurrenceGeneral: 'sort(intervals, byStart | byEnd)\nsweep once, comparing each interval to what you\'re currently holding',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What an interval problem looks like',
      learnBody:
        'An interval is just a range — [start, end] — like a meeting from 2pm to 6pm, or a number line span [2, 6]. Interval problems give you a bunch of these ranges and ask something about how they relate: do any of them overlap? What do you get if you merge every overlap together? How many overlap at the same moment? Almost every one of these questions gets easier the instant the list is in order — so <b>sorting is step zero</b>, before any real logic runs. The only real choice is what to sort by (more on that soon).',
      learnFocus: [
        'An interval is a [start, end] pair — nothing more.',
        'The question is always some flavor of "how do these ranges relate?"',
        'Sort first — almost every interval algorithm reads left to right after that.',
      ],
      cues: [
        'the input is a list of [start, end] pairs, or "meetings"/"bookings"/"ranges"',
        'the problem mentions "overlap" or "conflict" directly',
      ],
      examples: [
        { snippet: '"You are given an array of <b>intervals</b> where intervals[i] = [start_i, end_i]."', tell: 'The literal shape [start, end] in the input signature is the clearest possible tell.' },
        { snippet: '"Given a list of <b>meeting time intervals</b>, determine if a person could attend all of them."', tell: '"Meeting time intervals" + a yes/no about attending all of them is an overlap-detection problem — sort by start and scan.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'merge & insert',
      learnHeading: 'The overlap check, and merging or inserting',
      learnBody:
        'Once sorted by start, the whole pattern reduces to one test, applied while holding a "current" interval as you scan: does the next interval overlap the one you\'re holding? Two intervals a and b overlap exactly when <b>a.start ≤ b.end AND b.start ≤ a.end</b> — each one starts before the other ends. If they overlap, merge them (grow your held interval to cover both: min of the starts, max of the ends) and keep scanning. If they don\'t, close out the interval you were holding, start holding the new one instead, and continue. Inserting a brand-new interval into an already-sorted, already-merged list is the same check — copy through everything that ends before the new interval starts, absorb everything that overlaps it, then copy through the rest.',
      learnFocus: [
        'Overlap test: a.start ≤ b.end && b.start ≤ a.end.',
        'On overlap: merge (min of starts, max of ends). On no overlap: close the group and start a new one.',
        'Insert = same scan, split into "before", "overlapping" (absorb), and "after".',
      ],
      cues: [
        'asks to merge all overlapping intervals into one list',
        'asks to insert a new interval into an already-sorted, non-overlapping list',
      ],
      examples: [
        { snippet: '"<b>Merge all overlapping intervals</b>, and return an array of the non-overlapping intervals that cover all the intervals in the input."', tell: '"Merge all overlapping" is the direct signal: sort by start, then scan-and-merge.' },
        { snippet: '"Insert <b>newInterval</b> into intervals such that intervals is still sorted... and does not have overlapping intervals."', tell: 'A single new interval dropped into an already-clean list means: find where it overlaps, absorb, done — no full re-sort needed.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'greedy selection',
      learnHeading: 'Greedy selection: sort by END, not start',
      learnBody:
        'A different family of questions asks you to pick the largest possible subset of intervals that don\'t overlap each other (equivalently: the fewest you need to remove so nothing overlaps). Here the right move is to <b>sort by END time</b> instead of start. Greedily walk through and keep an interval only if its start is ≥ the end of the last interval you kept; otherwise it conflicts, so discard it. Sorting by end and always keeping the earliest-ending option is provably optimal: whichever valid interval ends earliest leaves the most room on the number line for everything that comes after it, so there\'s never a reason to prefer a later-ending interval over an earlier-ending one that\'s also available.',
      learnFocus: [
        'Sort by end time, not start — the ordering itself is the algorithm.',
        'Keep an interval only if start ≥ last kept interval\'s end.',
        'Greedy is optimal here because "ends earliest" never closes off more future options than any other valid pick.',
      ],
      cues: [
        'asks for the maximum number of non-overlapping intervals you can keep',
        'asks for the minimum number of intervals to remove so none overlap',
      ],
      confuse:
        '<b>Sort by start vs. sort by end:</b> sort by start when you\'re merging or inserting into one growing timeline (Easy tier) — you need to encounter intervals in the order they begin. Sort by end when you\'re greedily selecting the max non-overlapping subset (this tier) — ending earlier always leaves more room for what\'s next, which is only true when the list is ordered by end.',
      examples: [
        { snippet: '"Return the <b>minimum number of intervals you need to remove</b> to make the rest of the intervals non-overlapping."', tell: '"Minimum removals so nothing overlaps" is the greedy-selection tell — sort by end, keep-or-discard.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'resource counting & two lists',
      learnHeading: 'Counting simultaneous resources, and sweeping two lists at once',
      learnBody:
        'A third family asks "how many overlap at once?" — how many meeting rooms, how many servers, how many lifeguards, at the busiest single moment. Pairwise overlap checks don\'t scale for this; instead, sweep through start times in order and track which resources are currently occupied with a <b>min-heap of end times</b> (or, equivalently, two sorted arrays of starts and ends walked with two pointers). Whenever the next meeting\'s start is ≥ the earliest end time in the heap, that room has freed up — pop it and reuse it instead of allocating a new one; otherwise you need a brand-new room. The heap\'s peak size across the whole sweep is the answer. A related hard variant sweeps <b>two separate, independently-sorted interval lists</b> at once with two pointers — one into each list — computing overlap = [max(startA, startB), min(endA, endB)] whenever it\'s valid, then advancing whichever interval ends first (it can\'t possibly overlap anything further along the other list).',
      learnFocus: [
        'Resource counting needs a heap or a start/end sweep, not pairwise comparisons.',
        'Min-heap of end times: reuse (pop) whenever the next start ≥ the heap\'s minimum.',
        'Two independent sorted lists → two pointers, advance whichever interval ends first.',
      ],
      cues: [
        'asks for the minimum number of conference rooms / resources needed simultaneously',
        'gives you two separate lists of intervals and asks for their pairwise intersections',
      ],
      examples: [
        { snippet: '"Find the <b>minimum number of conference rooms</b> required" given meeting time intervals.', tell: '"Minimum number of conference rooms" signals resource-counting over time — a min-heap of end times or a start/end sweep-line.' },
        { snippet: '"You are given two lists of closed intervals... Return <b>the intersection</b> of these two interval lists."', tell: 'Two separate, already-sorted interval lists asked to intersect is the two-pointer-across-two-lists signal.' },
      ],
    },
  ],

  variants: [
    {
      id: 'merge-intervals',
      label: 'Merge Intervals',
      short: 'array · sort by start',
      difficulty: 'simple',
      statement: 'Given intervals <b>[1,3], [2,6], [8,10], [15,18]</b>, merge all overlapping intervals and return the result.',
      recurrence: 'sort by start; if next.start ≤ held.end: held.end = max(held.end, next.end); else: close held, hold next',
      complexity: 'O(n log n) time (the sort dominates) · O(n) space',
      twist: 'The whole algorithm is "sort, then one pass" — no recursion, no table. Sorting by start is what makes a single left-to-right scan enough.',
      viz: 'array',
      trace: () => mergeIntervalsTrace([[1, 3], [2, 6], [8, 10], [15, 18]]),
    },
    {
      id: 'insert-interval',
      label: 'Insert Interval',
      short: 'array · overlap check',
      difficulty: 'easy',
      statement: 'Given the sorted, non-overlapping intervals <b>[1,3], [6,9]</b> and a new interval <b>[2,5]</b>, insert it and merge as needed.',
      recurrence: 'copy intervals ending before newInterval starts; absorb every interval that overlaps newInterval; copy the rest',
      complexity: 'O(n) time (single pass, list already sorted) · O(n) space',
      twist: 'The list is already sorted and merged, so there\'s no reason to re-sort — one linear scan with three phases (before / absorb / after) is enough.',
      viz: 'array',
      trace: () => insertIntervalTrace([[1, 3], [6, 9]], [2, 5]),
    },
    {
      id: 'non-overlapping-intervals',
      label: 'Non-overlapping Intervals',
      short: 'array · greedy, sort by end',
      difficulty: 'medium',
      statement: 'Given intervals <b>[1,2], [2,3], [3,4], [1,3]</b>, find the minimum number to remove so the rest don\'t overlap.',
      recurrence: 'sort by end; keep iv only if iv.start ≥ lastKeptEnd; else removals++',
      complexity: 'O(n log n) time (sort by end) · O(1) extra space',
      twist: 'Swap the sort key from start to end and the same "keep or discard" scan becomes provably optimal — the hard part is trusting that end-time-first is the right order.',
      viz: 'array',
      trace: () => eraseOverlapIntervalsTrace([[1, 2], [2, 3], [3, 4], [1, 3]]),
    },
    {
      id: 'meeting-rooms-ii',
      label: 'Meeting Rooms II',
      short: 'array · min-heap of end times',
      difficulty: 'hard',
      statement: 'Given meeting intervals <b>[0,30], [5,10], [15,20]</b>, find the minimum number of conference rooms required.',
      recurrence: 'sort starts; sweep starts; if heap-min end ≤ current start: pop (reuse room), else allocate; push this meeting\'s end; track peak heap size',
      complexity: 'O(n log n) time (heap push/pop per meeting) · O(n) space',
      twist: 'Pairwise overlap checks don\'t scale here — the real tool is a live min-heap of end times, and the answer is the heap\'s peak size, not its final size.',
      viz: 'array',
      trace: () => meetingRoomsIITrace([[0, 30], [5, 10], [15, 20]]),
    },
    {
      id: 'interval-list-intersections',
      label: 'Interval List Intersections',
      short: 'array · two-pointer, two lists',
      difficulty: 'hard',
      statement: 'Given <b>A = [0,2],[5,10],[13,23],[24,25]</b> and <b>B = [1,5],[8,12],[15,24],[25,26]</b>, return every pairwise intersection.',
      recurrence: 'lo = max(A[i].start, B[j].start); hi = min(A[i].end, B[j].end); if lo ≤ hi record [lo,hi]; advance whichever of i/j ends first',
      complexity: 'O(m + n) time (one pass across both lists) · O(m + n) space for the output',
      twist: 'Two pointers walk two independently-sorted lists at once — whichever interval ends first is fully "used up" and can never overlap anything later, so it\'s always safe to advance that pointer.',
      viz: 'array',
      trace: () => intervalIntersectionTrace(
        [[0, 2], [5, 10], [13, 23], [24, 25]],
        [[1, 5], [8, 12], [15, 24], [25, 26]],
      ),
    },
  ],

  syntax: [
    {
      title: 'Overlap check',
      code: 'function overlaps(a, b) {\n  return a[0] <= b[1] && b[0] <= a[1];\n}',
      note: 'True exactly when each interval starts before (or when) the other ends. This one formula underlies merge, insert, and overlap-detection problems.',
    },
    {
      title: 'Sort-by-start-then-merge skeleton',
      code: 'intervals.sort((a, b) => a[0] - b[0]);\nconst out = [intervals[0]];\nfor (let i = 1; i < intervals.length; i++) {\n  const last = out[out.length - 1];\n  if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n  else out.push(intervals[i]);\n}',
      note: 'The default shape for "merge all overlapping intervals." Sorting by start guarantees any overlap with the held interval shows up immediately next.',
    },
    {
      title: 'Sort-by-end greedy-keep skeleton',
      code: 'intervals.sort((a, b) => a[1] - b[1]);\nlet lastEnd = -Infinity, kept = 0;\nfor (const iv of intervals) {\n  if (iv[0] >= lastEnd) { lastEnd = iv[1]; kept++; }\n}\n// removals needed = intervals.length - kept',
      note: 'For "max non-overlapping subset" / "min removals" — note the sort key is index [1] (end), not [0] (start).',
    },
    {
      title: 'Min-heap of end times (room counting)',
      code: 'const starts = intervals.map(i => i[0]).sort((a,b)=>a-b);\nconst ends = intervals.map(i => i[1]).sort((a,b)=>a-b);\nlet rooms = 0, maxRooms = 0, s = 0, e = 0;\nwhile (s < starts.length) {\n  if (starts[s] < ends[e]) { rooms++; s++; maxRooms = Math.max(maxRooms, rooms); }\n  else { rooms--; e++; }\n}',
      note: 'A sorted-starts/sorted-ends two-pointer sweep is a lighter-weight stand-in for an actual min-heap of end times — same O(n log n), no heap class needed.',
    },
    {
      title: 'Two-pointer sweep across two interval lists',
      code: 'let i = 0, j = 0;\nconst res = [];\nwhile (i < A.length && j < B.length) {\n  const lo = Math.max(A[i][0], B[j][0]);\n  const hi = Math.min(A[i][1], B[j][1]);\n  if (lo <= hi) res.push([lo, hi]);\n  if (A[i][1] < B[j][1]) i++; else j++;\n}',
      note: 'Whichever interval ends first can\'t overlap anything further along the other list — that\'s the pointer to advance, unconditionally.',
    },
    {
      title: 'Insert-into-sorted-list skeleton',
      code: 'const res = [];\nlet i = 0;\nwhile (i < n && intervals[i][1] < newInterval[0]) res.push(intervals[i++]);\nwhile (i < n && intervals[i][0] <= newInterval[1]) {\n  newInterval = [Math.min(newInterval[0], intervals[i][0]),\n                 Math.max(newInterval[1], intervals[i][1])];\n  i++;\n}\nres.push(newInterval);\nwhile (i < n) res.push(intervals[i++]);',
      note: 'Three phases in one pass: copy what ends before newInterval starts, absorb every overlap into newInterval, then copy the rest.',
    },
  ],
};
