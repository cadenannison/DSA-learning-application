import type { Pattern } from '../types';
import { coinChangeTrace, climbingStairsTrace, houseRobberTrace, lcsTrace, editDistanceTrace } from '../traceBuilders';

export const dpPattern: Pattern = {
  id: 'dp',
  label: 'Dynamic Programming',
  short: 'DP',
  accent: '#6d5bd0',
  accentDark: '#a394ff',
  blurb: 'Break a problem into overlapping subproblems, solve each one once, and reuse the stored result instead of recomputing it.',
  recurrenceGeneral: 'dp[state] = combine( dp[smaller state 1], dp[smaller state 2], … )',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What DP actually is',
      learnBody:
        'Dynamic programming solves a problem by breaking it into smaller copies of the same problem, solving each copy exactly once, and reusing that answer instead of recalculating it — like writing down your work on a math problem so you never redo the same step twice. Whenever you catch yourself about to answer a question you already answered a minute ago, that\'s the moment DP applies.',
      learnFocus: [
        'A subproblem is just a smaller version of the original question.',
        'Store each answer the first time you compute it.',
        'Look it up instead of recomputing it, every time after.',
      ],
      cues: [
        'asks for the minimum / maximum / fewest / longest / most',
        'asks to count the number of ways to do something',
      ],
      examples: [
        { snippet: '"...find the <b>minimum number of coins</b> needed to make up that amount."', tell: '<b>"minimum / fewest"</b> over a set of choices → you\'re optimizing, and each choice affects what\'s left to solve → DP.' },
        { snippet: '"Return the <b>number of distinct ways</b> you can climb to the top."', tell: '<b>"count the ways"</b> is the clearest DP counting signal — sum up the ways to reach each smaller step.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'the 3-part shape',
      learnHeading: 'The three-part skeleton',
      learnBody:
        'Every DP solution has the same shape: a <b>state</b> — what dp[i] actually means, in one sentence; a <b>base case</b> — the answer for the smallest possible input; and a <b>recurrence</b> — how a bigger state is built only from smaller states you\'ve already solved. Get those three sentences right on paper before you write a line of code, and the implementation mostly writes itself.',
      learnFocus: [
        'State: "dp[i] = the fewest coins to make amount i."',
        'Base case: dp[0] = 0.',
        'Recurrence: dp[i] = min(dp[i-c] + 1) over every coin c.',
      ],
      cues: [
        'at each item you either take it or skip it',
        'there\'s a constraint like "not two adjacent" tying a decision to the one before it',
      ],
      examples: [
        { snippet: '"...you may not rob <b>two adjacent</b> houses."', tell: 'An exclusion/adjacency constraint on a sequence means today\'s decision depends on yesterday\'s — classic 1D DP state.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'designing state',
      learnHeading: 'Designing the state, not just the recurrence',
      learnBody:
        'The hard part usually isn\'t the recurrence — it\'s picking what the state needs to track. If two different histories lead to the same future decisions, they should collapse into the same state. If the order you fill the table in changes the answer (looping coins outside amount, vs. amount outside coins), that\'s usually the line between allowing an item once and allowing it unlimited times. This is also where space optimization lives: if dp[i] only ever reads dp[i−1] and dp[i−2], you don\'t need the whole array — two variables are enough.',
      learnFocus: [
        'Same future ⇒ same state, even from different pasts.',
        'Loop order changes 0/1 vs. unbounded behavior.',
        'Only reading the last k rows? Drop the rest and save space.',
      ],
      cues: [
        'two sequences or strings being compared at once',
        'n is small-ish (≤ 10⁴–10⁵), not a hint toward O(n log n) greedy',
      ],
      confuse:
        '<b>Greedy trap:</b> if the locally-best choice is always safe to make and never needs revisiting, that\'s greedy, not DP. If you can find a counterexample where the greedy choice backfires, you need DP\'s "remember every option" table instead.',
      examples: [
        { snippet: '"Given two strings, return the length of their <b>longest common subsequence</b>."', tell: 'Two sequences being compared at once pushes the state from one index to two → 2D DP table.' },
      ],
    },
    {
      tier: 'hard',
      tag: 'the hard parts',
      learnHeading: 'Where it actually gets hard',
      learnBody:
        'Past a basic 1D/2D table, three things make DP genuinely difficult: the state needs an extra dimension you don\'t spot immediately (a "k transactions left" counter, a "previous choice" flag, a bitmask of which items are used); the transition is expensive enough that each cell needs a second data structure to compute (a monotonic deque, a segment tree, binary search on a sorted dp array); or the table is only conceptually 2D — the real state lives on a tree or graph, and the recurrence has to respect that structure. When brute force times out and the state space still explodes, look for what invariant lets you drop a dimension rather than add one.',
      learnFocus: [
        'Extra dimensions hide in phrases like "at most k" or "previous action was...".',
        'Some transitions need a smarter data structure, not just a bigger table.',
        'DP on trees/graphs still needs state + base case + recurrence — just walked in traversal order.',
      ],
      cues: [
        'the constraint includes a small extra number like "at most k" — a hidden dimension',
        'a set of ≤ ~20 items and a question about subsets — bitmask DP',
      ],
      examples: [
        { snippet: '"...you may complete at most <b>two</b> transactions."', tell: 'A small bound like "at most k" is almost always an extra dimension on your state: dp[day][k][holding].' },
        { snippet: '"...determine if there is a <b>subset</b> of nums that sums to target."', tell: 'A target sum over subsets of numbers is DP along a value axis: dp[i][sum].' },
      ],
    },
  ],

  variants: [
    {
      id: 'coin-change',
      label: 'Coin Change',
      short: '1D · unbounded',
      difficulty: 'medium',
      statement: 'Given coin denominations <b>[1, 4, 5]</b> and target amount <b>8</b>, find the fewest coins that sum to it.',
      recurrence: 'dp[a] = min over coins c≤a of ( dp[a − c] + 1 ),  dp[0] = 0',
      complexity: 'O(amount × coins) time · O(amount) space',
      twist: 'Greedy would grab 5+1+1+1 = 4 coins. DP finds 4+4 = 2 — proof that "take the biggest coin first" isn\'t safe here.',
      viz: 'array',
      trace: () => coinChangeTrace([1, 4, 5], 8),
    },
    {
      id: 'climbing-stairs',
      label: 'Climbing Stairs',
      short: '1D · counting',
      difficulty: 'simple',
      statement: 'You can climb <b>1</b> or <b>2</b> steps at a time. How many distinct ways are there to reach step <b>5</b>?',
      recurrence: 'dp[i] = dp[i − 1] + dp[i − 2],  dp[0] = dp[1] = 1',
      complexity: 'O(n) time · O(n) space (O(1) with two variables)',
      twist: 'Same recurrence as Fibonacci — "count the ways" + "last move was one of a few fixed choices" is a strong DP signal.',
      viz: 'array',
      trace: () => climbingStairsTrace(5),
    },
    {
      id: 'house-robber',
      label: 'House Robber',
      short: '1D · adjacency constraint',
      difficulty: 'easy',
      statement: 'Houses hold <b>[2, 7, 9, 3, 1]</b>. Rob the most money possible without robbing two adjacent houses.',
      recurrence: 'dp[i] = max( dp[i − 1], dp[i − 2] + nums[i] )',
      complexity: 'O(n) time · O(n) space (O(1) with two variables)',
      twist: 'The "can\'t pick two neighbors" constraint is the tell — it forces every decision to depend on what you decided one step back.',
      viz: 'array',
      trace: () => houseRobberTrace([2, 7, 9, 3, 1]),
    },
    {
      id: 'lcs',
      label: 'Longest Common Subsequence',
      short: '2D · two strings',
      difficulty: 'hard',
      statement: 'Find the length of the longest subsequence common to <b>"ABCDE"</b> and <b>"ACE"</b> (not necessarily contiguous).',
      recurrence: 'dp[i][j] = dp[i-1][j-1]+1 if a[i-1]===b[j-1], else max(dp[i-1][j], dp[i][j-1])',
      complexity: 'O(m × n) time · O(m × n) space',
      twist: 'The state jumps from one index to two — "comparing two sequences" is the signal that pushes DP from a 1D array to a 2D table.',
      viz: 'matrix',
      trace: () => lcsTrace('ABCDE', 'ACE'),
    },
    {
      id: 'edit-distance',
      label: 'Edit Distance',
      short: '2D · three-way min',
      difficulty: 'hard',
      statement: 'Fewest single-character insert / delete / replace operations to turn <b>"horse"</b> into <b>"ros"</b>.',
      recurrence: 'dp[i][j] = dp[i-1][j-1] if match, else 1 + min(diag, up, left)',
      complexity: 'O(m × n) time · O(m × n) space',
      twist: 'Same 2D shape as LCS, but now the "else" branch has three neighbors instead of two — one dp[i][j] value has to model three different edits.',
      viz: 'matrix',
      trace: () => editDistanceTrace('horse', 'ros'),
    },
  ],

  syntax: [
    { title: '2D table allocation', code: 'const dp = Array.from(\n  {length: m + 1},\n  () => new Array(n + 1).fill(0)\n);', note: 'Never new Array(n).fill(new Array(m)) — that shares one inner array by reference across every row.' },
    { title: 'Space-optimized rolling row', code: 'let prev = new Array(n + 1).fill(0);\nfor (let i = 1; i <= m; i++) {\n  const curr = new Array(n + 1).fill(0);\n  // fill curr from prev...\n  prev = curr;\n}', note: 'Most 2D DPs only ever read the row directly above — drop the full table to O(n) space once you\'ve confirmed that.' },
    { title: 'Top-down memoization', code: 'function solve(i, memo = new Map()) {\n  if (memo.has(i)) return memo.get(i);\n  if (i <= 1) return i;\n  const r = solve(i-1, memo) + solve(i-2, memo);\n  memo.set(i, r);\n  return r;\n}', note: 'Same recurrence, written recursively. Reach for this when the reachable states are sparse — you only ever compute what\'s actually needed.' },
    { title: 'String DP index shift', code: '// dp[i][j] = answer using the first i\n// chars of a, first j chars of b\nif (a[i - 1] === b[j - 1]) {\n  dp[i][j] = dp[i - 1][j - 1] + 1;\n}', note: 'dp[0][*] and dp[*][0] represent an empty prefix — that\'s why the table is (m+1)×(n+1), not m×n.' },
    { title: 'Bitmask state for subsets', code: '// mask is a bitset of which items\n// have been used so far\ndp[mask][i] = bestWayToEnd(mask, i);\n// dp size: 2^itemCount × itemCount', note: 'When "state" means a subset of up to ~20 items rather than a position, encode it as an integer bitmask instead of an array index.' },
    { title: 'Reconstructing the actual answer', code: 'let i = m, j = n, out = [];\nwhile (i > 0 && j > 0) {\n  if (a[i-1] === b[j-1]) {\n    out.push(a[i-1]); i--; j--;\n  } else if (dp[i-1][j] >= dp[i][j-1]) i--;\n  else j--;\n}', note: 'The table gives you a number. To return the actual subsequence or path, walk it backwards through the choices that produced it.' },
  ],
};
