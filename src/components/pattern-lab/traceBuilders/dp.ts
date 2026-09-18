import type { Trace, CodeLine } from '../types';

/**
 * DP trace builders — run the real algorithm, record a step at every
 * meaningful moment. See ../../README.md for the authoring checklist.
 */
export function coinChangeTrace(coins: number[], amount: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function coinChange(coins, amount) {' },
    { k: 'alloc', t: '  const dp = new Array(amount + 1).fill(Infinity);' },
    { k: 'base', t: '  dp[0] = 0;' },
    { k: 'loopA', t: '  for (let a = 1; a <= amount; a++) {' },
    { k: 'loopC', t: '    for (const c of coins) {' },
    { k: 'check', t: '      if (c <= a) {' },
    { k: 'update', t: '        dp[a] = Math.min(dp[a], dp[a - c] + 1);' },
    { k: 'endif', t: '      }' },
    { k: 'endloopC', t: '    }' },
    { k: 'endloopA', t: '  }' },
    { k: 'ret', t: '  return dp[amount] === Infinity ? -1 : dp[amount];' },
    { k: 'end', t: '}' },
  ];
  const dp = new Array(amount + 1).fill(Infinity);
  const snap = () => dp.map((v) => (v === Infinity ? null : v));
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: snap(), note: `Allocate dp[0..${amount}]. Every slot starts "unknown" — dp[a] will end up holding the fewest coins that make amount a.` });
  dp[0] = 0;
  steps.push({ kind: 'array', line: 'base', cells: snap(), current: 0, note: 'Base case: dp[0] = 0 — zero coins are needed to make amount 0.' });
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) {
        const before = dp[a];
        const candidate = dp[a - c] === Infinity ? Infinity : dp[a - c] + 1;
        steps.push({ kind: 'array', line: 'check', cells: snap(), current: a, source: a - c, note: `a = ${a}, try coin ${c}: look at dp[${a - c}] (${dp[a - c] === Infinity ? '∞' : dp[a - c]}) + 1 = ${candidate === Infinity ? '∞' : candidate}. Current best for a=${a} is ${before === Infinity ? '∞' : before}.` });
        dp[a] = Math.min(dp[a], candidate);
        if (dp[a] !== before) {
          steps.push({ kind: 'array', line: 'update', cells: snap(), current: a, source: a - c, note: `${candidate} < ${before === Infinity ? '∞' : before} → dp[${a}] improves to ${dp[a]}.` });
        }
      }
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells: snap(), current: amount, note: dp[amount] === Infinity ? 'No combination of coins reaches this amount → return -1.' : `dp[${amount}] = ${dp[amount]} → fewest coins needed is ${dp[amount]}.` });
  return { lines, steps, colLabels: dp.map((_: number, i: number) => i) };
}

export function climbingStairsTrace(n: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function climbStairs(n) {' },
    { k: 'alloc', t: '  const dp = new Array(n + 1).fill(0);' },
    { k: 'base', t: '  dp[0] = 1; dp[1] = 1;' },
    { k: 'loop', t: '  for (let i = 2; i <= n; i++) {' },
    { k: 'update', t: '    dp[i] = dp[i - 1] + dp[i - 2];' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return dp[n];' },
    { k: 'end', t: '}' },
  ];
  const dp: (number | null)[] = new Array(n + 1).fill(null);
  const snap = () => dp.slice();
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: snap(), note: `Allocate dp[0..${n}]. dp[i] will hold the number of distinct ways to reach step i.` });
  dp[0] = 1; dp[1] = 1;
  steps.push({ kind: 'array', line: 'base', cells: snap(), current: 1, note: 'Base cases: 1 way to stand at step 0 (start), 1 way to reach step 1 (one single step).' });
  for (let i = 2; i <= n; i++) {
    dp[i] = (dp[i - 1] as number) + (dp[i - 2] as number);
    steps.push({ kind: 'array', line: 'update', cells: snap(), current: i, source: i - 1, note: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. (Last hop was either a 1-step from ${i - 1}, or a 2-step from ${i - 2}.)` });
  }
  steps.push({ kind: 'array', line: 'ret', cells: snap(), current: n, note: `dp[${n}] = ${dp[n]} distinct ways to climb ${n} stairs.` });
  return { lines, steps, colLabels: dp.map((_, i) => i) };
}

export function houseRobberTrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function rob(nums) {' },
    { k: 'alloc', t: '  const dp = new Array(nums.length).fill(0);' },
    { k: 'base0', t: '  dp[0] = nums[0];' },
    { k: 'base1', t: '  dp[1] = Math.max(nums[0], nums[1]);' },
    { k: 'loop', t: '  for (let i = 2; i < nums.length; i++) {' },
    { k: 'update', t: '    dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return dp[nums.length - 1];' },
    { k: 'end', t: '}' },
  ];
  const n = nums.length;
  const dp: (number | null)[] = new Array(n).fill(null);
  const snap = () => dp.slice();
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: snap(), note: `Allocate dp[0..${n - 1}]. dp[i] will hold the max loot possible using only houses 0..i.` });
  dp[0] = nums[0];
  steps.push({ kind: 'array', line: 'base0', cells: snap(), current: 0, note: `Only one house so far → dp[0] = nums[0] = ${nums[0]}.` });
  dp[1] = Math.max(nums[0], nums[1]);
  steps.push({ kind: 'array', line: 'base1', cells: snap(), current: 1, note: `With two houses, rob whichever is bigger (can't rob adjacent) → dp[1] = max(${nums[0]}, ${nums[1]}) = ${dp[1]}.` });
  for (let i = 2; i < n; i++) {
    dp[i] = Math.max(dp[i - 1] as number, (dp[i - 2] as number) + nums[i]);
    steps.push({ kind: 'array', line: 'update', cells: snap(), current: i, source: i - 2, note: `dp[${i}] = max(skip house ${i} → dp[${i - 1}]=${dp[i - 1]}, rob house ${i} → dp[${i - 2}]+${nums[i]}=${(dp[i - 2] as number) + nums[i]}) = ${dp[i]}.` });
  }
  steps.push({ kind: 'array', line: 'ret', cells: snap(), current: n - 1, note: `dp[${n - 1}] = ${dp[n - 1]} → maximum take without robbing two adjacent houses.` });
  return { lines, steps, colLabels: nums.map((v, i) => `n${i}:${v}`) };
}

export function lcsTrace(a: string, b: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function longestCommonSubsequence(a, b) {' },
    { k: 'alloc', t: '  const dp = Array.from({length: a.length + 1}, () => new Array(b.length + 1).fill(0));' },
    { k: 'loopI', t: '  for (let i = 1; i <= a.length; i++) {' },
    { k: 'loopJ', t: '    for (let j = 1; j <= b.length; j++) {' },
    { k: 'match', t: '      if (a[i - 1] === b[j - 1]) {' },
    { k: 'diag', t: '        dp[i][j] = dp[i - 1][j - 1] + 1;' },
    { k: 'else', t: '      } else {' },
    { k: 'best', t: '        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);' },
    { k: 'endif', t: '      }' },
    { k: 'endJ', t: '    }' },
    { k: 'endI', t: '  }' },
    { k: 'ret', t: '  return dp[a.length][b.length];' },
    { k: 'end', t: '}' },
  ];
  const m = a.length, n = b.length;
  const dp: (number | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
  for (let j = 0; j <= n; j++) dp[0][j] = 0;
  for (let i = 0; i <= m; i++) dp[i][0] = 0;
  const snap = () => dp.map((row) => row.slice());
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'matrix', line: 'alloc', cells: snap(), current: null, note: `Allocate a (${m + 1})×(${n + 1}) table. Row 0 and column 0 are the empty-prefix base case, already 0.` });
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = (dp[i - 1][j - 1] as number) + 1;
        steps.push({ kind: 'matrix', line: 'diag', cells: snap(), current: [i, j], sources: [[i - 1, j - 1]], note: `'${a[i - 1]}' === '${b[j - 1]}' → extend the match from the diagonal: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}.` });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j] as number, dp[i][j - 1] as number);
        steps.push({ kind: 'matrix', line: 'best', cells: snap(), current: [i, j], sources: [[i - 1, j], [i, j - 1]], note: `'${a[i - 1]}' ≠ '${b[j - 1]}' → carry forward the better of the cell above and the cell to the left: dp[${i}][${j}] = ${dp[i][j]}.` });
      }
    }
  }
  steps.push({ kind: 'matrix', line: 'ret', cells: snap(), current: [m, n], note: `dp[${m}][${n}] = ${dp[m][n]} → longest common subsequence of "${a}" and "${b}" has length ${dp[m][n]}.` });
  return { lines, steps, rowLabels: ['', ...a.split('')], colLabels: ['', ...b.split('')] };
}

export function editDistanceTrace(a: string, b: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function minDistance(a, b) {' },
    { k: 'alloc', t: '  const dp = Array.from({length: a.length + 1}, () => new Array(b.length + 1).fill(0));' },
    { k: 'base', t: '  for (let i = 0; i <= a.length; i++) dp[i][0] = i;\n  for (let j = 0; j <= b.length; j++) dp[0][j] = j;' },
    { k: 'loopI', t: '  for (let i = 1; i <= a.length; i++) {' },
    { k: 'loopJ', t: '    for (let j = 1; j <= b.length; j++) {' },
    { k: 'match', t: '      if (a[i - 1] === b[j - 1]) {' },
    { k: 'diag', t: '        dp[i][j] = dp[i - 1][j - 1];   // no edit needed' },
    { k: 'else', t: '      } else {' },
    { k: 'best', t: '        dp[i][j] = 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);' },
    { k: 'endif', t: '      }' },
    { k: 'endJ', t: '    }' },
    { k: 'endI', t: '  }' },
    { k: 'ret', t: '  return dp[a.length][b.length];' },
    { k: 'end', t: '}' },
  ];
  const m = a.length, n = b.length;
  const dp: (number | null)[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  const snap = () => dp.map((row) => row.slice());
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'matrix', line: 'base', cells: snap(), current: null, note: `Base rows/columns: turning "${a}" into "" (or "" into "${b}") costs one deletion/insertion per character.` });
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({ kind: 'matrix', line: 'diag', cells: snap(), current: [i, j], sources: [[i - 1, j - 1]], note: `'${a[i - 1]}' === '${b[j - 1]}' → no edit needed here, carry the diagonal: dp[${i}][${j}] = ${dp[i][j]}.` });
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1] as number, dp[i - 1][j] as number, dp[i][j - 1] as number);
        steps.push({ kind: 'matrix', line: 'best', cells: snap(), current: [i, j], sources: [[i - 1, j - 1], [i - 1, j], [i, j - 1]], note: `'${a[i - 1]}' ≠ '${b[j - 1]}' → cheapest of replace (${dp[i - 1][j - 1]}), delete (${dp[i - 1][j]}), insert (${dp[i][j - 1]}), plus 1 → dp[${i}][${j}] = ${dp[i][j]}.` });
      }
    }
  }
  steps.push({ kind: 'matrix', line: 'ret', cells: snap(), current: [m, n], note: `dp[${m}][${n}] = ${dp[m][n]} → minimum edits to turn "${a}" into "${b}".` });
  return { lines, steps, rowLabels: ['', ...a.split('')], colLabels: ['', ...b.split('')] };
}
