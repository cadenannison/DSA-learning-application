import type { Pattern } from '../types';
import {
  maxSumSubarrayKTrace,
  longestUniqueSubstringTrace,
  minWindowSubstringTrace,
  characterReplacementTrace,
  slidingWindowMaximumTrace,
} from '../traceBuilders';

export const slidingWindowPattern: Pattern = {
  id: 'sliding-window',
  label: 'Sliding Window',
  short: 'Window',
  accent: '#b0406e',
  accentDark: '#f088b4',
  blurb: 'Maintain a contiguous range that slides across an array or string, updating a running total instead of re-scanning from scratch each time.',
  recurrenceGeneral: 'window = nums[left..right]\nslide right → to grow/explore\nslide left  → to shrink/restore validity',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a sliding window actually is',
      learnBody:
        'A sliding window is a contiguous range <b>[left, right]</b> over an array or string that you move across the input one step at a time, instead of picking a new start point and re-scanning everything from there. Because the window only changes by one element at each end, you can update a running total (a sum, a count, a frequency map) in O(1) per step rather than recomputing it from scratch — which is what turns an O(n²) "try every subarray" scan into an O(n) pass.',
      learnFocus: [
        'The window is just two pointers, left and right, marking a contiguous range.',
        'Slide it forward — don\'t restart the scan from a new left index.',
        'A running total updated incrementally is what makes it O(n) instead of O(n²).',
      ],
      cues: [
        'asks about a <b>contiguous</b> subarray or substring',
        'brute force would be "try every start, scan to every end" — O(n²) or worse',
      ],
      examples: [
        { snippet: '"Find the <b>maximum sum of any contiguous subarray</b> of size k."', tell: '<b>"contiguous subarray"</b> + a fixed size is the cleanest sliding-window signal — no need to re-sum from scratch each time.' },
        { snippet: '"Find the length of the <b>longest substring</b> without repeating characters."', tell: '<b>"substring"</b> (contiguous) over a string, asking for a longest/shortest extent → sliding window territory.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'fixed vs. variable',
      learnHeading: 'Fixed-size vs. variable-size windows',
      learnBody:
        'This is the whole pattern in one distinction. A <b>fixed-size</b> window stays exactly size k the entire time: at every step you add the new right element and drop the element leaving on the left in the same motion — used whenever the problem hands you a literal "size k". A <b>variable-size</b> window instead grows right to explore new territory and shrinks left only when needed to restore some condition (no duplicates, sum ≤ target, fewer than k distinct characters) — the size itself is part of the answer, not a given.',
      learnFocus: [
        'Fixed size: add nums[right], subtract nums[right-k], every single step.',
        'Variable size: grow right freely; shrink left only when a condition breaks.',
        'If the problem states an exact window size up front, it\'s fixed. If it asks for the longest/shortest valid window, it\'s variable.',
      ],
      cues: [
        'a literal number k given as "window of size k" → fixed-size',
        '"longest / shortest / smallest" substring or subarray satisfying a condition → variable-size',
      ],
      examples: [
        { snippet: '"...the <b>average of each contiguous subarray of size k</b>."', tell: 'An explicit, constant size k that never changes → fixed-size window: slide by adding one, dropping one.' },
        { snippet: '"Return the length of the <b>longest substring</b> with <b>at most two distinct</b> characters."', tell: 'No fixed size given, but a condition on window contents ("at most two distinct") → variable-size window, shrink left when the condition breaks.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'expand, then shrink',
      learnHeading: 'The two-phase shape: expand until invalid (or valid), then shrink to optimize',
      learnBody:
        'Most variable-size window problems follow the same two-phase rhythm: <b>expand</b> right one step at a time, updating a frequency map or counter as each new element enters the window; then, once some condition is hit — the window becomes valid (covers everything required) or invalid (breaks a constraint) — <b>shrink</b> left, greedily, for as long as the window can still satisfy the condition, updating that same counter as each element leaves. The counter (usually a Map of character/value → count currently in the window) is what makes checking validity O(1) instead of re-scanning the window every time.',
      learnFocus: [
        'Expand right, updating a frequency map/counter as each element enters.',
        'Once the window crosses a validity threshold, shrink left while it\'s still valid (or until it becomes valid).',
        'The frequency map lets you check "is this window still OK?" in O(1) instead of rescanning it.',
      ],
      cues: [
        '"contains all of", "covers", "at least/at most k distinct" — a coverage condition tracked by a counter',
        'the answer requires both growing to explore and shrinking to optimize, not just one direction',
      ],
      confuse:
        '<b>Sliding window vs. two pointers:</b> sliding window specifically maintains a <b>contiguous</b> range and tracks some aggregate state (a running sum, a frequency map) as that range slides. General two-pointers — e.g. opposite-end pointers closing in on a sorted array for a target sum — don\'t require contiguity, and usually don\'t carry a running aggregate forward; each pointer move is evaluated independently.',
      examples: [
        { snippet: '"...the <b>minimum window substring</b> of s that contains every character in t."', tell: '"minimum window that contains/covers" is the two-phase signature: expand right until every required character is covered, then shrink left greedily to shrink the valid window.' },
        { snippet: '"...find the longest substring with <b>at most k distinct</b> characters."', tell: 'A distinct-character cap tracked live is a frequency-map-inside-a-window problem — expand freely, shrink only when distinct count exceeds k.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'the hard parts',
      learnHeading: 'When a counter isn\'t enough: the monotonic deque',
      learnBody:
        'Some window questions ask for the running <b>max or min</b> of the window itself, not just a sum or a coverage check — and a plain frequency counter can\'t answer "what\'s the max in the window right now" without rescanning it, which degrades back to O(n·k). The fix is a <b>monotonic deque</b> storing indices (not values): before pushing a new index, pop everything off the <b>back</b> whose value is ≤ the new value (they can never be the max again while the new, bigger element is still in play), then pop from the <b>front</b> once its index falls outside the window. The front of the deque is always the current window\'s maximum, and each index is pushed and popped at most once — O(n) total, O(1) amortized per step.',
      learnFocus: [
        'Rescanning the window for its max every step degrades to O(n·k) — that\'s the tell you need a smarter structure.',
        'Monotonic deque stores indices, kept in decreasing value order from front to back.',
        'Pop from the back on a bigger incoming value; pop from the front once the front index expires.',
      ],
      cues: [
        '"maximum / minimum of every window" — not a sum, not a coverage check, the actual extreme value',
        'a naive per-window scan for the max is offered as the "obvious but too slow" approach',
      ],
      examples: [
        { snippet: '"...return an array of the <b>maximum</b> of each window of size k."', tell: 'This is the monotonic-deque hard variant, explicitly — "maximum of each window" instead of a sum or a coverage condition means a plain counter can\'t answer it in O(1).' },
      ],
    },
  ],

  variants: [
    {
      id: 'max-sum-subarray-k',
      label: 'Maximum Sum Subarray of Size K',
      short: 'fixed size · sum',
      difficulty: 'simple',
      statement: 'Given <b>nums = [2, 1, 5, 1, 3, 2]</b> and <b>k = 3</b>, find the maximum sum of any contiguous subarray of size k.',
      recurrence: 'sum += nums[right] − nums[right − k]  (window always stays size k)',
      complexity: 'O(n) time · O(1) extra space',
      twist: 'The size is fixed at k, so every slide is the same two-step motion: add the new right element, drop the one leaving on the left.',
      viz: 'array',
      trace: () => maxSumSubarrayKTrace([2, 1, 5, 1, 3, 2], 3),
    },
    {
      id: 'longest-unique-substring',
      label: 'Longest Substring Without Repeating Characters',
      short: 'variable size · uniqueness',
      difficulty: 'easy',
      statement: 'Find the length of the longest substring of <b>"abcabcbb"</b> without repeating characters.',
      recurrence: 'if lastSeen[s[right]] ≥ left: left = lastSeen[s[right]] + 1',
      complexity: 'O(n) time · O(min(n, alphabet)) space',
      twist: 'No size is given up front — the window grows freely and only shrinks (left jumps forward) the moment a repeat shows up inside it.',
      viz: 'array',
      trace: () => longestUniqueSubstringTrace('abcabcbb'),
    },
    {
      id: 'min-window-substring',
      label: 'Minimum Window Substring',
      short: 'expand/shrink · frequency map',
      difficulty: 'medium',
      statement: 'Find the smallest substring of <b>s = "ADOBECODEBANC"</b> that contains every character of <b>t = "ABC"</b> (with at least their required counts).',
      recurrence: 'expand right until missing === 0 (all of t covered); then shrink left while still valid, tracking the smallest window seen',
      complexity: 'O(|s| + |t|) time · O(|t|) space',
      twist: 'The textbook two-phase shape: grow right until the window is valid, then greedily shrink left to shrink the valid window — powered by a "need" counter that turns validity checks into O(1) lookups.',
      viz: 'array',
      trace: () => minWindowSubstringTrace('ADOBECODEBANC', 'ABC'),
    },
    {
      id: 'longest-repeating-char-replacement',
      label: 'Longest Repeating Character Replacement',
      short: 'variable size · replacement budget',
      difficulty: 'medium',
      statement: 'Given <b>s = "AABABBA"</b> and <b>k = 1</b> character replacement allowed, find the length of the longest substring achievable where every character is the same.',
      recurrence: 'while (windowSize − maxFreq) > k: shrink left',
      complexity: 'O(n) time · O(alphabet) space',
      twist: 'The window never needs to shrink below its best-ever size — maxFreq only tracked, never recomputed from scratch, so an apparently "wrong" maxFreq after a shrink still gives the right answer.',
      viz: 'array',
      trace: () => characterReplacementTrace('AABABBA', 1),
    },
    {
      id: 'sliding-window-maximum',
      label: 'Sliding Window Maximum',
      short: 'monotonic deque · window max',
      difficulty: 'hard',
      statement: 'Given <b>nums = [1, 3, -1, -3, 5, 3, 6, 7]</b> and <b>k = 3</b>, return the maximum of every contiguous window of size k.',
      recurrence: 'pop back while nums[dq.back] ≤ nums[i]; push i; pop front once dq.front expires; front = window max',
      complexity: 'O(n) time (each index pushed/popped once) · O(k) space',
      twist: 'A plain per-window scan for the max is O(n·k). A monotonic deque of indices, kept in decreasing value order, answers "what\'s the current max" in O(1) — the front is always it.',
      viz: 'array',
      trace: () => slidingWindowMaximumTrace([1, 3, -1, -3, 5, 3, 6, 7], 3),
    },
  ],

  syntax: [
    {
      title: 'Fixed-size window skeleton',
      code: 'let sum = 0;\nfor (let i = 0; i < k; i++) sum += nums[i];\nlet best = sum;\nfor (let right = k; right < nums.length; right++) {\n  sum += nums[right] - nums[right - k];\n  best = Math.max(best, sum);\n}',
      note: 'Prime the window with the first k elements, then every later step is one add + one subtract — the window size never changes.',
    },
    {
      title: 'Variable-size window skeleton',
      code: 'let left = 0;\nfor (let right = 0; right < s.length; right++) {\n  // 1. add s[right] to the running state\n  while (/* window invalid */) {\n    // 2. remove s[left] from the running state\n    left++;\n  }\n  // 3. window [left, right] is valid here — update the answer\n}',
      note: 'Right only ever moves forward; left only ever moves forward. Each index enters and leaves the window at most once → O(n) total, even though it looks like nested loops.',
    },
    {
      title: 'Frequency map inside a window',
      code: 'const count = new Map();\ncount.set(c, (count.get(c) || 0) + 1);   // entering\n// ...\nconst n = count.get(c) - 1;\nif (n === 0) count.delete(c); else count.set(c, n); // leaving',
      note: 'Update the map as each element enters/leaves — never rebuild it by re-scanning the window, or you lose the O(n) guarantee.',
    },
    {
      title: 'Distinct-count tracked alongside a map',
      code: 'let missing = need.size; // # of distinct chars not yet satisfied\nif (need.has(c) && window.get(c) === need.get(c)) missing--;\n// ...\nif (need.has(c) && window.get(c) < need.get(c)) missing++;',
      note: 'A single integer counter tells you "is the window currently valid?" in O(1), instead of scanning the whole map every time.',
    },
    {
      title: 'Monotonic deque for window max',
      code: 'const dq = []; // indices, values strictly decreasing front→back\nwhile (dq.length && nums[dq.at(-1)] <= nums[i]) dq.pop();\ndq.push(i);\nif (dq[0] <= i - k) dq.shift();\n// dq[0] is the max of the current window',
      note: 'Flip every comparison (>= instead of <=) to track a running window minimum instead of a maximum.',
    },
    {
      title: 'Window bounds you can read off directly',
      code: 'const windowSize = right - left + 1;\nconst isValid = /* e.g. */ (windowSize - maxFreq) <= k;',
      note: '`right - left + 1` is the current window size — reach for it constantly when the shrink condition depends on the window\'s length.',
    },
  ],
};
