import type { Pattern } from '../types';
import {
  validParenthesesTrace,
  minStackTrace,
  dailyTemperaturesTrace,
  nextGreaterElementIITrace,
  largestRectangleTrace,
} from '../traceBuilders';

export const stacksQueuesPattern: Pattern = {
  id: 'stacks-queues',
  label: 'Stacks / Queues',
  short: 'Stacks/Queues',
  accent: '#5a6b8c',
  accentDark: '#a8b8e0',
  blurb: 'Two disciplines for order: a stack always hands back the item you added most recently (LIFO); a queue always hands back the item you added longest ago (FIFO).',
  recurrenceGeneral: 'stack.push(x) / stack.pop() → last in, first out   ·   queue.enqueue(x) / queue.dequeue() → first in, first out',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What a stack and a queue actually are',
      learnBody:
        'A <b>stack</b> is last-in, first-out (LIFO) — think of a stack of plates: you can only take the top one off, and you can only add a new one to the top. Whatever you added most recently is the first thing you get back. A <b>queue</b> is first-in, first-out (FIFO) — think of a checkout line: whoever got in line first gets served first, no matter how many people join behind them. Both only ever expose their one end (or two ends, for a queue) — no reaching into the middle.',
      learnFocus: [
        'Stack = LIFO: push and pop both happen at the same end.',
        'Queue = FIFO: enqueue at the back, dequeue from the front.',
        'Neither lets you peek or grab from the middle — that\'s the whole point.',
      ],
      cues: [
        'the problem needs to "undo" the most recent action, or reverse an order',
        'the problem processes things strictly in the order they arrived',
      ],
      examples: [
        { snippet: '"Implement an <b>undo</b> feature that reverts the most recent action."', tell: '"Most recent" is the LIFO tell — undo history is a textbook stack.' },
        { snippet: '"Process customers in the <b>order they arrive</b>."', tell: '"Order they arrive" with no reordering is the FIFO tell — a plain queue.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'matching & tracking',
      learnHeading: 'Matching pairs, and tracking a running value',
      learnBody:
        'The two classic beginner stack uses: <b>matching/balancing</b> — every closing thing (a bracket, a tag, a "back" button) needs to line up with the most recent still-open opening thing, which is exactly what a stack remembers for you; and <b>O(1) access to an auxiliary running value</b> alongside the data — like always knowing the current minimum of everything on the stack without rescanning it. Both work by keeping a second piece of state (a stack of open brackets, or a parallel stack of running minimums) perfectly in sync with every push and pop.',
      learnFocus: [
        'Matching: push on "open", pop-and-compare on "close".',
        'If a close arrives with nothing open (or the wrong thing open), it\'s invalid immediately.',
        'A second stack can track a running min/max/sum in lockstep — no rescanning needed.',
      ],
      cues: [
        'brackets, parentheses, tags, or "open X / close X" pairs need to balance',
        'the problem wants getMin()/getMax() to run in O(1), not O(n)',
      ],
      examples: [
        { snippet: '"Given a string of brackets, determine if it is <b>valid / balanced</b>."', tell: '"Valid brackets" is the canonical matching-stack signal — push opens, pop-and-check closes.' },
        { snippet: '"Design a stack that supports push, pop, top, and retrieving the <b>minimum element</b> in constant time."', tell: '"Constant time min/max alongside push/pop" means track it on a parallel stack, not by rescanning.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'monotonic stacks',
      learnHeading: 'The monotonic stack idea',
      learnBody:
        'A <b>monotonic stack</b> keeps its contents in sorted order at all times — increasing or decreasing, whichever the problem needs — by popping anything that would break that order <i>before</i> pushing the new element. That popping step isn\'t wasted work: each pop is the moment you learn something about the element being popped (e.g. "here is its next greater element"). Because every index is pushed once and popped at most once, the whole scan is O(n) — this is what turns a "for each element, find the next bigger one to its right" question from an O(n²) nested loop into a single O(n) pass.',
      learnFocus: [
        'Before pushing, pop off anything that violates the sort order — that pop IS the answer for the popped element.',
        'Decreasing stack of indices → each pop finds a "next greater" relationship.',
        'Each index is pushed once, popped once → O(n) total, not O(n²).',
      ],
      cues: [
        'the question is "for each element, what\'s the next bigger/smaller one to its right (or left)?"',
        'a naive solution would be a nested loop rescanning the rest of the array from each index',
      ],
      confuse:
        '<b>Monotonic stack vs. plain iteration:</b> the tell is a question that\'s secretly asking "for each element, what\'s the next one to its right (or left) that\'s bigger/smaller?" A naive nested loop checks every pair and is O(n²). A monotonic stack answers the same question in one O(n) pass, because each element is pushed and popped at most once — the moment it\'s popped IS the moment its answer is found.',
      examples: [
        { snippet: '"For each day, find the <b>number of days until a warmer temperature</b>."', tell: '"Next warmer/bigger to the right" is the monotonic-stack signal — a decreasing stack of indices, resolved on each pop.' },
        { snippet: '"Return the <b>next greater element</b> for every element in the array."', tell: '"Next greater element" is the name of the technique itself — always reach for a monotonic decreasing stack of indices.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'circular & area problems',
      learnHeading: 'Harder monotonic-stack applications',
      learnBody:
        'Two things make monotonic-stack problems genuinely hard. <b>Circular arrays</b>: when "next greater" can wrap from the last element back to the first, iterate the index range <i>twice</i> (i from 0 to 2n−1) and read the real element with <code>idx = i % n</code> — mentally, you\'re walking the array twice without physically doubling it. <b>Computing areas/spans</b> (Largest Rectangle in Histogram): keep a monotonic <i>increasing</i> stack of indices; when a shorter bar arrives, every taller bar popped off the stack has its rectangle "finalized" right there — its height is fixed (the popped bar\'s height) and its width is exactly the gap between the new stack top and the current index. A trailing sentinel of height 0 forces a final flush so nothing is left unpriced.',
      learnFocus: [
        'Circular: loop i from 0 to 2n−1, index with i % n, only push on the first pass.',
        'Area problems: a pop means "this bar\'s rectangle is now finalized — compute it now."',
        'Width on a pop = (current index) − (new stack top index) − 1, or just the current index if the stack is now empty.',
      ],
      cues: [
        'the array is explicitly circular / wraps around',
        'the problem asks for the largest rectangle, area, or span under a skyline-like sequence',
      ],
      examples: [
        { snippet: '"Given a <b>circular</b> array, return the next greater element for every element, wrapping around if needed."', tell: '"Circular" + "next greater" → iterate the index space twice with idx = i % n on a monotonic stack.' },
        { snippet: '"Given a histogram, find the area of the <b>largest rectangle</b>."', tell: '"Largest rectangle in a histogram" is the canonical monotonic-increasing-stack area problem — each pop prices one bar.' },
      ],
    },
  ],

  variants: [
    {
      id: 'valid-parentheses',
      label: 'Valid Parentheses',
      short: 'matching · balance check',
      difficulty: 'simple',
      statement: 'Determine whether the bracket string <b>"()[]{}"</b> is valid — every bracket closes the most recently opened bracket of the matching type.',
      recurrence: 'open bracket → push it.  close bracket → pop and check it matches.  valid iff stack ends empty.',
      complexity: 'O(n) time · O(n) space',
      twist: 'The stack IS the "most recently opened" memory — no matching logic needed beyond "does this close what\'s on top?"',
      viz: 'array',
      trace: () => validParenthesesTrace('()[]{}'),
    },
    {
      id: 'min-stack',
      label: 'Min Stack',
      short: 'auxiliary running min',
      difficulty: 'easy',
      statement: 'Design a stack supporting push, pop, top, and <b>getMin()</b> — all in O(1). Sequence: push(-2), push(0), push(-3), getMin(), pop(), top(), getMin().',
      recurrence: 'mins.push(min(v, mins.top())) alongside every stack.push(v); pop both together.',
      complexity: 'O(1) time per operation · O(n) space',
      twist: 'A second stack, updated in lockstep with the first, turns "what\'s the min so far" from an O(n) rescan into an O(1) lookup.',
      viz: 'array',
      trace: () => minStackTrace(),
    },
    {
      id: 'daily-temperatures',
      label: 'Daily Temperatures',
      short: 'monotonic · next greater',
      difficulty: 'medium',
      statement: 'temperatures = <b>[73,74,75,71,69,72,76,73]</b>. For each day, how many days until a warmer temperature (0 if never)?',
      recurrence: 'decreasing stack of indices; while temps[i] beats the stack top, pop it and set res[popped] = i − popped.',
      complexity: 'O(n) time · O(n) space',
      twist: 'A naive solution rescans forward from every day — O(n²). The monotonic stack resolves each day exactly once, when it finally gets beaten.',
      viz: 'array',
      trace: () => dailyTemperaturesTrace([73, 74, 75, 71, 69, 72, 76, 73]),
    },
    {
      id: 'next-greater-ii',
      label: 'Next Greater Element II',
      short: 'monotonic · circular',
      difficulty: 'hard',
      statement: 'nums = <b>[1,2,1]</b> is circular — return the next greater element for each, wrapping past the end if needed.',
      recurrence: 'iterate i from 0 to 2n−1, idx = i % n; decreasing stack of indices; only push while i < n.',
      complexity: 'O(n) time · O(n) space',
      twist: 'Two virtual laps around the array (via i % n) simulate wraparound without ever allocating a doubled array.',
      viz: 'array',
      trace: () => nextGreaterElementIITrace([1, 2, 1]),
    },
    {
      id: 'largest-rectangle',
      label: 'Largest Rectangle in Histogram',
      short: 'monotonic · area',
      difficulty: 'hard',
      statement: 'heights = <b>[2,1,5,6,2,3]</b>. Find the area of the largest rectangle that fits under the skyline.',
      recurrence: 'increasing stack of indices; on a shorter bar, pop and price: area = height[popped] × (i − newTop − 1).',
      complexity: 'O(n) time · O(n) space',
      twist: 'A trailing sentinel bar of height 0 forces every remaining bar on the stack to be popped and priced at the very end — nothing is left unresolved.',
      viz: 'array',
      trace: () => largestRectangleTrace([2, 1, 5, 6, 2, 3]),
    },
  ],

  syntax: [
    { title: 'Array-as-stack: push / pop', code: 'const stack = [];\nstack.push(x);   // add to top\nconst top = stack.pop();   // remove & return top\nconst peek = stack.at(-1);   // look without removing', note: 'A plain JS array used only from one end is a stack — push/pop are both O(1) at the end of the array.' },
    { title: 'Matching-brackets skeleton', code: 'const map = { ")": "(", "]": "[", "}": "{" };\nconst stack = [];\nfor (const c of s) {\n  if ("([{".includes(c)) stack.push(c);\n  else if (stack.pop() !== map[c]) return false;\n}\nreturn stack.length === 0;', note: 'Push on open, pop-and-compare on close. Also check the string didn\'t end with unmatched opens still on the stack.' },
    { title: 'Monotonic decreasing stack (next greater)', code: 'const stack = [];   // indices, decreasing values\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack.at(-1)] < nums[i]) {\n    const j = stack.pop();\n    res[j] = nums[i];   // resolved on pop\n  }\n  stack.push(i);\n}', note: 'Anything left on the stack when the loop ends never found a "next greater" — leave its answer as the default (-1, 0, etc).' },
    { title: 'Monotonic increasing stack (histogram area)', code: 'const h = [...heights, 0];   // sentinel flushes the stack\nconst stack = [];\nlet max = 0;\nfor (let i = 0; i < h.length; i++) {\n  while (stack.length && h[stack.at(-1)] > h[i]) {\n    const top = stack.pop();\n    const w = stack.length ? i - stack.at(-1) - 1 : i;\n    max = Math.max(max, h[top] * w);\n  }\n  stack.push(i);\n}', note: 'Each pop means "this bar\'s rectangle is finalized" — its height is fixed and its width spans back to the (now-exposed) next-shorter bar.' },
    { title: 'Queue via array shift/push', code: 'const queue = [];\nqueue.push(x);          // enqueue at the back\nconst front = queue.shift();   // dequeue from the front', note: 'Correct but shift() is O(n) — fine for small BFS-style queues here; a ring buffer or two-stack queue avoids that cost at scale.' },
    { title: 'Queue via two stacks', code: 'let inStack = [], outStack = [];\nfunction enqueue(x) { inStack.push(x); }\nfunction dequeue() {\n  if (!outStack.length) {\n    while (inStack.length) outStack.push(inStack.pop());\n  }\n  return outStack.pop();\n}', note: 'Reversing in→out once per "batch" amortizes to O(1) per operation — each element is moved between the two stacks at most once.' },
  ],
};
