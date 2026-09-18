import type { Pattern } from '../types';
import { subsetsTrace, permutationsTrace, combinationSumTrace, nQueensTrace, wordSearchTrace } from '../traceBuilders';

export const backtrackingPattern: Pattern = {
  id: 'backtracking',
  label: 'Backtracking',
  short: 'Backtracking',
  accent: '#b8425f',
  accentDark: '#f2879e',
  blurb: 'Explore a decision tree one choice at a time, and undo a choice the moment it stops working — a systematic way to try everything without actually writing "everything" out by hand.',
  recurrenceGeneral: 'explore(state):  for each choice from here:\n    make the choice\n    explore(new state)\n    undo the choice  // backtrack',

  levels: [
    {
      tier: 'simple',
      tag: 'the basics',
      learnHeading: 'What backtracking actually does',
      learnBody:
        'Backtracking is trying a choice, recursing to see where it leads, and undoing it if it doesn\'t pan out — then trying the next choice instead. Picture a decision tree: every node is a partial answer, every edge is one more choice you add to it. You walk down a branch; if it dead-ends (or you\'ve gone far enough to record a full answer), you climb back up and try the sibling branch. Nothing is "known" in advance — you find every valid path by actually trying paths, and undoing the ones that don\'t work.',
      learnFocus: [
        'Try a choice, recurse into it, then undo it before trying the next one.',
        'It\'s a decision tree you explore branch by branch, not a formula.',
        '"Undo" is the whole trick — without it you\'d never get back to try sibling branches.',
      ],
      cues: [
        '"find all possible..." / "return every..." over a set of choices',
        'a puzzle with rules you check as you go (a board, a path, a arrangement)',
      ],
      examples: [
        { snippet: '"Given a set of distinct integers, return <b>all possible subsets</b>."', tell: '<b>"all possible"</b> over a small set of choices is the clearest backtracking signal — enumerate the whole decision tree.' },
      ],
    },
    {
      tier: 'easy',
      tag: 'choose / explore / un-choose',
      learnHeading: 'The three-step shape, and fixed vs. variable length',
      learnBody:
        'Every backtracking call has the same three moves: <b>choose</b> — add one option to the partial answer; <b>explore</b> — recurse with that choice in place; <b>un-choose</b> — remove it again before trying the next option at this level. The one thing that varies problem to problem is what "done" means. Permutations build a <b>fixed-length</b> answer — you stop exactly when every slot is filled, and the choices at each slot are "whichever elements are still unused". Subsets build a <b>variable-length</b> answer — every element gets an independent include/exclude decision, so the recursion depth is fixed (one call per element) but the resulting subset\'s length varies.',
      learnFocus: [
        'choose → explore (recurse) → un-choose, every single call.',
        'Fixed-length goal (permutations): stop when the path fills every slot.',
        'Variable-length goal (subsets): every element gets an independent in/out decision.',
      ],
      cues: [
        '"return all permutations/arrangements of..." → fixed-length, order matters',
        '"return all subsets/combinations of..." → variable-length, order usually doesn\'t matter',
      ],
      examples: [
        { snippet: '"Given an array of <b>distinct</b> integers, return all possible <b>permutations</b>."', tell: '"Permutations" + "distinct" is the used[]-array signature: track which elements are already placed, fill every slot exactly once.' },
      ],
    },
    {
      tier: 'medium',
      tag: 'pruning & duplicates',
      learnHeading: 'Pruning for efficiency, and reuse/duplicate rules',
      learnBody:
        'Trying every branch of the decision tree is correct but can be slow — <b>pruning</b> means noticing a branch can\'t possibly succeed and skipping it without recursing into it at all, e.g. stop the moment a running sum already exceeds the target. The other medium-level wrinkle is exactly which choices are legal at each step: can the same element be picked again (reuse — pass the same index forward instead of the next one), and if the input has duplicate values, how do you avoid generating the same combination twice (usually: sort first, then skip a candidate that equals its immediate sibling at the same recursion depth).',
      learnFocus: [
        'Prune the instant a partial answer can\'t possibly become valid — don\'t recurse into a doomed branch.',
        'Reuse an element: recurse with the same start index instead of index + 1.',
        'Duplicate values in the input: sort first, then skip a repeated value at the same tree depth.',
      ],
      cues: [
        '"the same number may be chosen an unlimited number of times" → reuse allowed, recurse on the same index',
        '"the input may contain duplicates" + "no duplicate results" → sort + same-depth skip',
      ],
      confuse:
        '<b>Backtracking vs. plain recursion vs. DP:</b> plain recursion just computes one answer top-down. Backtracking explores every path through a decision tree and explicitly undoes each choice to try the next one. DP also breaks a problem into subproblems, but instead of re-exploring, it recognizes when two different paths land on the same overlapping subproblem and reuses the stored answer instead of recomputing it — DP is backtracking\'s memoized, non-redundant cousin, and it only works when those subproblems actually overlap.',
      examples: [
        { snippet: '"...find all unique combinations where the candidate numbers sum to <b>target</b>. The same number may be <b>chosen unlimited times</b>."', tell: '"Sum to target" is a prune-as-you-go signal (stop once the running sum exceeds it), and "chosen unlimited times" means recursing on the same index, not the next one.' },
      ],
    },
    {
      tier: 'hard',
      tag: '2D backtracking',
      learnHeading: 'Backtracking over a grid, and why the runtime is what it is',
      learnBody:
        'The hard tier moves choices onto a 2D board: N-Queens places one queen per row and checks column/diagonal conflicts against every queen placed so far; Word Search walks the grid in a DFS, matching one letter of the target word per step. The discipline is the same three-step shape, just spatial — <b>mark</b> a cell as "in use" (a placed queen, a cell on the current path) before recursing into it, and <b>unmark</b> it on the way back out, every single time, or a later branch will incorrectly think that cell is unavailable. The other hard-tier idea: backtracking\'s runtime isn\'t a clean polynomial like O(n²) — it\'s bounded by the size of the decision tree you actually explore (e.g. roughly O(n!) for permutations, O(2ⁿ) for subsets), and pruning is what keeps that tree from being the full, un-prunable worst case in practice.',
      learnFocus: [
        'Mark a cell in use before recursing into it, unmark it on the way back out — every time, no exceptions.',
        'N-Queens: check column + both diagonals against every already-placed queen.',
        'Runtime is bounded by the decision tree\'s size, not a clean polynomial — that\'s why pruning matters so much here.',
      ],
      cues: [
        'an n×n board with a placement rule checked against everything already placed → N-Queens-shaped',
        '"search the grid for a path spelling out a word/sequence" → DFS-with-backtrack over cells',
      ],
      examples: [
        { snippet: '"...no two queens attack each other. Return <b>all distinct solutions</b> to the n-queens puzzle."', tell: '"All distinct solutions" to a placement-with-conflict-rules puzzle on a board is 2D backtracking: one choice per row, undo on conflict.' },
        { snippet: '"...the word must be constructed from letters of <b>sequentially adjacent</b> cells... the <b>same cell may not be used more than once</b>."', tell: '"Sequentially adjacent" + "not reused" is the DFS-with-backtrack signature — mark cells visited on the way down, unmark them on the way back up.' },
      ],
    },
  ],

  variants: [
    {
      id: 'subsets',
      label: 'Subsets',
      short: 'array · include/exclude',
      difficulty: 'simple',
      statement: 'Given <b>[1, 2, 3]</b>, return all possible subsets (the power set).',
      recurrence: 'backtrack(i, path): at i === n, record path; else recurse both with and without nums[i].',
      complexity: 'O(2ⁿ · n) time · O(n) space (recursion depth + path)',
      twist: 'No "done" check beyond running out of elements — every index gets an independent in/out decision, which is exactly why the result set has 2ⁿ entries.',
      viz: 'array',
      trace: () => subsetsTrace([1, 2, 3]),
    },
    {
      id: 'permutations',
      label: 'Permutations',
      short: 'array · used[] array',
      difficulty: 'easy',
      statement: 'Given <b>[1, 2, 3]</b>, return all possible permutations (orderings).',
      recurrence: 'backtrack(path): at path.length === n, record path; else try every unused nums[i] at this slot.',
      complexity: 'O(n! · n) time · O(n) space (used[] + recursion depth)',
      twist: 'Fixed-length goal this time — the recursion stops by slot count, not by index, and a used[] array (not an index cursor) tracks which choices remain legal.',
      viz: 'array',
      trace: () => permutationsTrace([1, 2, 3]),
    },
    {
      id: 'combination-sum',
      label: 'Combination Sum',
      short: 'array · pruning + reuse',
      difficulty: 'medium',
      statement: 'Given candidates <b>[2, 3, 6, 7]</b> and target <b>7</b>, find all unique combinations that sum to target. The same candidate may be reused.',
      recurrence: 'backtrack(start, remain, path): remain===0 → record; skip candidates that would overshoot; recurse from i (not i+1) to allow reuse.',
      complexity: 'O(2ᵗ) worst case (t = target) · O(target / min(candidates)) recursion depth',
      twist: 'Two new moves at once: prune the branch the instant a candidate would overshoot the remaining sum, and recurse on the same index instead of the next one so a candidate can be reused.',
      viz: 'array',
      trace: () => combinationSumTrace([2, 3, 6, 7], 7),
    },
    {
      id: 'n-queens',
      label: 'N-Queens',
      short: 'grid · 2D placement',
      difficulty: 'hard',
      statement: 'Place <b>4</b> queens on a 4×4 board so no two attack each other. How many distinct solutions exist?',
      recurrence: 'backtrack(row): try every column; skip if attacked by column/diagonal sets; place, recurse to row+1, then undo.',
      complexity: 'O(n!) worst case time · O(n) space (column/diagonal sets + placement)',
      twist: 'One queen per row turns an n×n search into an n-deep decision tree — column and diagonal sets let a conflict check run in O(1) instead of re-scanning every placed queen.',
      viz: 'grid',
      trace: () => nQueensTrace(4),
    },
    {
      id: 'word-search',
      label: 'Word Search',
      short: 'grid · DFS with backtrack',
      difficulty: 'hard',
      statement: 'Board <b>[[A,B,C,E],[S,F,C,S],[A,D,E,E]]</b> — does the path <b>"ABCCED"</b> exist through sequentially adjacent, non-reused cells?',
      recurrence: 'dfs(r, c, i): fail on out-of-bounds/visited/mismatch; mark visited, recurse to 4 neighbors for i+1; unmark on failure.',
      complexity: 'O(rows · cols · 4^L) worst case (L = word length) · O(L) recursion depth',
      twist: 'The mark-before-recursing / unmark-on-backtrack discipline is the entire pattern — skip the unmark and a later path would wrongly treat a free cell as already used.',
      viz: 'grid',
      trace: () => wordSearchTrace([['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCCED'),
    },
  ],

  syntax: [
    { title: 'Choose / explore / un-choose skeleton', code: 'function backtrack(path) {\n  if (isComplete(path)) { record(path); return; }\n  for (const choice of choicesFrom(path)) {\n    path.push(choice);       // choose\n    backtrack(path);         // explore\n    path.pop();               // un-choose\n  }\n}', note: 'Every backtracking function is this shape. Everything else — what a "choice" is, what "complete" means — is problem-specific.' },
    { title: 'used[] array for permutations', code: 'const used = new Array(n).fill(false);\nfor (let i = 0; i < n; i++) {\n  if (used[i]) continue;\n  used[i] = true; path.push(nums[i]);\n  backtrack(path);\n  path.pop(); used[i] = false;\n}', note: 'Track which elements are already placed instead of an index cursor — needed whenever the answer can use elements in any order.' },
    { title: 'Pruning on a running total', code: 'for (let i = start; i < candidates.length; i++) {\n  if (candidates[i] > remain) continue;  // prune\n  path.push(candidates[i]);\n  backtrack(i, remain - candidates[i]);  // reuse: pass i\n  path.pop();\n}', note: 'Sort candidates first and this prune can `break` instead of `continue` once one candidate overshoots — every later one will too.' },
    { title: 'Skipping duplicates at the same depth', code: 'candidates.sort((a, b) => a - b);\nfor (let i = start; i < candidates.length; i++) {\n  if (i > start && candidates[i] === candidates[i - 1]) continue;\n  // ...choose candidates[i], recurse from i + 1...\n}', note: '`i > start` is the key part — it only skips a duplicate that would be a sibling choice at this same tree depth, not a legitimate reuse deeper in the recursion.' },
    { title: '2D grid mark-and-revert', code: 'function dfs(r, c, i) {\n  if (!inBounds(r, c) || visited[r][c] || grid[r][c] !== word[i]) return false;\n  visited[r][c] = true;\n  const found = i === word.length - 1 || DIRS.some(([dr, dc]) => dfs(r + dr, c + dc, i + 1));\n  if (!found) visited[r][c] = false;   // revert only if this branch failed\n  return found;\n}', note: 'Mark on the way in, unmark on the way out — unconditionally on failure. Forgetting the unmark is the #1 2D-backtracking bug.' },
    { title: 'N-Queens conflict check in O(1)', code: 'const cols = new Set(), diag1 = new Set(), diag2 = new Set();\n// row - col is constant along a "\\" diagonal, row + col along a "/" diagonal\nif (cols.has(c) || diag1.has(row - c) || diag2.has(row + c)) continue; // attacked', note: 'Three sets replace re-scanning every placed queen on every candidate column — the diagonal-index trick (row±col) is worth memorizing on its own.' },
  ],
};
