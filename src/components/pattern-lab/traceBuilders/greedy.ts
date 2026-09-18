import type { Trace, CodeLine } from '../types';

/**
 * Greedy trace builders — run the real algorithm, record a step at every
 * meaningful greedy decision. See ../../README.md for the authoring checklist.
 */

export function assignCookiesTrace(g: number[], s: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function findContentChildren(g, s) {' },
    { k: 'sort', t: '  g.sort((a, b) => a - b);\n  s.sort((a, b) => a - b);' },
    { k: 'loop', t: '  let i = 0, j = 0;\n  while (i < g.length && j < s.length) {' },
    { k: 'check', t: '    if (s[j] >= g[i]) i++;' },
    { k: 'advance', t: '    j++;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return i;' },
    { k: 'end', t: '}' },
  ];
  const gSorted = [...g].sort((a, b) => a - b);
  const sSorted = [...s].sort((a, b) => a - b);
  const n = gSorted.length, m = sSorted.length;
  // cells: kids first (greed factors), then a divider-free array of cookies appended
  const cells: (number | null)[] = [...gSorted, ...sSorted];
  const colLabels: (string | number)[] = [
    ...gSorted.map((_, idx) => `kid${idx}`),
    ...sSorted.map((_, idx) => `cookie${idx}`),
  ];
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'sort', cells: cells.slice(), note: `Sort greed factors g=[${g.join(',')}] → [${gSorted.join(',')}] and cookie sizes s=[${s.join(',')}] → [${sSorted.join(',')}]. Sorting both is what makes the greedy match valid — always try the smallest unsatisfied kid against the smallest unused cookie.` });
  let i = 0, j = 0;
  while (i < n && j < m) {
    const kidIdx = i, cookieIdx = n + j;
    if (sSorted[j] >= gSorted[i]) {
      steps.push({ kind: 'array', line: 'check', cells: cells.slice(), current: cookieIdx, source: kidIdx, note: `Cookie s[${j}]=${sSorted[j]} ≥ kid g[${i}]=${gSorted[i]} → this cookie satisfies this kid. Content kids so far: ${i + 1}.` });
      i++;
    } else {
      steps.push({ kind: 'array', line: 'check', cells: cells.slice(), current: cookieIdx, source: kidIdx, note: `Cookie s[${j}]=${sSorted[j]} < kid g[${i}]=${gSorted[i]} → too small for even the least-greedy remaining kid. Skip this cookie, move to the next (never revisit it).` });
    }
    j++;
  }
  steps.push({ kind: 'array', line: 'ret', cells: cells.slice(), note: `No more cookies or no more kids to try → ${i} content kid${i === 1 ? '' : 's'}. Greedy works here because giving the smallest sufficient cookie to the least-greedy kid never wastes a bigger cookie that a greedier kid might need later.` });
  return { lines, steps, colLabels };
}

export function jumpGameTrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function canJump(nums) {' },
    { k: 'alloc', t: '  let farthest = 0;' },
    { k: 'loop', t: '  for (let i = 0; i < nums.length; i++) {' },
    { k: 'stuck', t: '    if (i > farthest) return false;' },
    { k: 'update', t: '    farthest = Math.max(farthest, i + nums[i]);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return true;' },
    { k: 'end', t: '}' },
  ];
  const cells: (number | null)[] = nums.slice();
  const steps: Trace['steps'] = [];
  let farthest = 0;
  steps.push({ kind: 'array', line: 'alloc', cells: cells.slice(), note: 'farthest = 0. Scan left to right, greedily keeping track of the farthest index reachable so far — never backtrack to reconsider an earlier jump.' });
  for (let idx = 0; idx < nums.length; idx++) {
    if (idx > farthest) {
      steps.push({ kind: 'array', line: 'stuck', cells: cells.slice(), current: idx, note: `Index ${idx} is past the farthest reachable index (${farthest}) → this index is unreachable. Return false.` });
      return { lines, steps, colLabels: nums.map((_, i) => i) };
    }
    const before = farthest;
    farthest = Math.max(farthest, idx + nums[idx]);
    steps.push({ kind: 'array', line: 'update', cells: cells.slice(), current: idx, note: `At index ${idx} (jump length ${nums[idx]}): farthest = max(${before}, ${idx} + ${nums[idx]}) = ${farthest}. The greedy choice is simply "always take the max reach seen so far" — no need to remember which specific jump produced it.` });
  }
  steps.push({ kind: 'array', line: 'ret', cells: cells.slice(), note: `Reached the end of the scan without ever landing past farthest → the last index (${nums.length - 1}) is reachable. Return true.` });
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}

export function gasStationTrace(gas: number[], cost: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function canCompleteCircuit(gas, cost) {' },
    { k: 'alloc', t: '  let total = 0, tank = 0, start = 0;' },
    { k: 'loop', t: '  for (let i = 0; i < gas.length; i++) {' },
    { k: 'diff', t: '    const diff = gas[i] - cost[i];\n    total += diff;\n    tank += diff;' },
    { k: 'reset', t: '    if (tank < 0) { start = i + 1; tank = 0; }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return total >= 0 ? start : -1;' },
    { k: 'end', t: '}' },
  ];
  const n = gas.length;
  const diffs = gas.map((g, i) => g - cost[i]);
  const cells: (number | null)[] = diffs.slice();
  const steps: Trace['steps'] = [];
  let total = 0, tank = 0, start = 0;
  steps.push({ kind: 'array', line: 'alloc', cells: cells.slice(), note: `gas=[${gas.join(',')}], cost=[${cost.join(',')}] → net gain/loss at each station = [${diffs.join(',')}]. total=0, tank=0, start candidate=0.` });
  for (let i = 0; i < n; i++) {
    const diff = diffs[i];
    total += diff;
    tank += diff;
    steps.push({ kind: 'array', line: 'diff', cells: cells.slice(), current: i, note: `Station ${i}: diff=${diff}. Running tank = ${tank}, running total = ${total}.` });
    if (tank < 0) {
      steps.push({ kind: 'array', line: 'reset', cells: cells.slice(), current: i, note: `Tank went negative (${tank}) → no station from the current start through ${i} can be a valid starting point (arriving there would already be in debt). Reset: new start candidate = ${i + 1}, tank = 0.` });
      start = i + 1;
      tank = 0;
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells: cells.slice(), current: start < n ? start : undefined, note: total >= 0 ? `total = ${total} ≥ 0 → a full circuit is possible, and the greedy start candidate ${start} is guaranteed correct (if total gas ≥ total cost, exactly one starting point works, and this single pass finds it without testing every candidate).` : `total = ${total} < 0 → not enough gas overall, no starting point works. Return -1.` });
  return { lines, steps, colLabels: gas.map((_, i) => `s${i}`) };
}

export function candyTrace(ratings: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function candy(ratings) {' },
    { k: 'alloc', t: '  const c = new Array(ratings.length).fill(1);' },
    { k: 'left', t: '  for (let i = 1; i < ratings.length; i++)\n    if (ratings[i] > ratings[i - 1]) c[i] = c[i - 1] + 1;' },
    { k: 'right', t: '  for (let i = ratings.length - 2; i >= 0; i--)\n    if (ratings[i] > ratings[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);' },
    { k: 'sum', t: '  return c.reduce((a, b) => a + b, 0);' },
    { k: 'end', t: '}' },
  ];
  const n = ratings.length;
  const c: number[] = new Array(n).fill(1);
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: c.slice(), note: `Every child starts with 1 candy — the minimum any child could have. Ratings: [${ratings.join(',')}].` });
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) {
      c[i] = c[i - 1] + 1;
      steps.push({ kind: 'array', line: 'left', cells: c.slice(), current: i, source: i - 1, note: `LEFT PASS: rating[${i}]=${ratings[i]} > rating[${i - 1}]=${ratings[i - 1]} → child ${i} must beat their left neighbor: c[${i}] = c[${i - 1}] + 1 = ${c[i]}.` });
    } else {
      steps.push({ kind: 'array', line: 'left', cells: c.slice(), current: i, note: `LEFT PASS: rating[${i}]=${ratings[i]} ≤ rating[${i - 1}]=${ratings[i - 1]} → no left-neighbor requirement, c[${i}] stays ${c[i]} for now.` });
    }
  }
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) {
      const before = c[i];
      c[i] = Math.max(c[i], c[i + 1] + 1);
      steps.push({ kind: 'array', line: 'right', cells: c.slice(), current: i, source: i + 1, note: `RIGHT PASS: rating[${i}]=${ratings[i]} > rating[${i + 1}]=${ratings[i + 1]} → child ${i} must also beat their right neighbor: c[${i}] = max(${before}, c[${i + 1}]+1=${c[i + 1] + 1}) = ${c[i]}. Taking the max keeps whichever pass's requirement was stricter.` });
    } else {
      steps.push({ kind: 'array', line: 'right', cells: c.slice(), current: i, note: `RIGHT PASS: rating[${i}]=${ratings[i]} ≤ rating[${i + 1}]=${ratings[i + 1]} → no right-neighbor requirement, c[${i}] stays ${c[i]}.` });
    }
  }
  const total = c.reduce((a, b) => a + b, 0);
  steps.push({ kind: 'array', line: 'sum', cells: c.slice(), note: `Sum candies: [${c.join(',')}] = ${total} total candies. Two passes, each a simple greedy in one direction, together satisfy both neighbor constraints at once.` });
  return { lines, steps, colLabels: ratings.map((v, i) => `r${i}:${v}`) };
}

export function partitionLabelsTrace(s: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function partitionLabels(s) {' },
    { k: 'last', t: '  const last = {};\n  for (let i = 0; i < s.length; i++) last[s[i]] = i;' },
    { k: 'loop', t: '  const res = [];\n  let start = 0, end = 0;\n  for (let i = 0; i < s.length; i++) {' },
    { k: 'extend', t: '    end = Math.max(end, last[s[i]]);' },
    { k: 'cut', t: '    if (i === end) { res.push(end - start + 1); start = i + 1; }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const n = s.length;
  const last: Record<string, number> = {};
  for (let i = 0; i < n; i++) last[s[i]] = i;
  const codes = s.split('').map((ch) => last[ch]);
  const cells: (number | null)[] = codes.slice();
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'last', cells: cells.slice(), note: `Precompute each character's LAST occurrence index in "${s}" (shown per position). This lookup has to exist before the greedy scan can know how far a partition must stretch.` });
  const res: number[] = [];
  let start = 0, end = 0;
  for (let i = 0; i < n; i++) {
    const before = end;
    end = Math.max(end, last[s[i]]);
    if (end !== before) {
      steps.push({ kind: 'array', line: 'extend', cells: cells.slice(), current: i, left: start, right: end, note: `i=${i} ('${s[i]}'): its last occurrence is ${last[s[i]]} → partition boundary extends from ${before} to ${end}. The current partition can't close until every character seen so far has appeared for the last time.` });
    } else {
      steps.push({ kind: 'array', line: 'extend', cells: cells.slice(), current: i, left: start, right: end, note: `i=${i} ('${s[i]}'): last occurrence ${last[s[i]]} doesn't push the boundary past ${end} — no change.` });
    }
    if (i === end) {
      const size = end - start + 1;
      res.push(size);
      steps.push({ kind: 'array', line: 'cut', cells: cells.slice(), current: i, left: start, right: end, note: `i (${i}) reached the boundary (${end}) → every character in [${start}, ${end}] is fully contained here. Cut a partition of size ${size}. Start the next partition at ${i + 1}.` });
      start = i + 1;
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells: cells.slice(), note: `Partition sizes: [${res.join(', ')}]. Greedily extending the boundary to the farthest last-occurrence seen so far, and cutting the moment the scan catches up to it, guarantees the smallest possible partitions.` });
  return { lines, steps, colLabels: s.split('') };
}
