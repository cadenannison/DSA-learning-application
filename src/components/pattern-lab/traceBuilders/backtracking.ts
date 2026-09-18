import type { Trace, CodeLine, GridCellState } from '../types';

const WORD_DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Backtracking trace builders — run the real algorithm, record a step at
 * every meaningful recursive choice/backtrack. See ../../README.md for the
 * authoring checklist.
 */

// ---- Subsets --------------------------------------------------------------

export function subsetsTrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function subsets(nums) {' },
    { k: 'res', t: '  const res = [];' },
    { k: 'bthead', t: '  function backtrack(i, path) {' },
    { k: 'base', t: '    if (i === nums.length) { res.push([...path]); return; }' },
    { k: 'include', t: '    path.push(nums[i]);   // choose: include nums[i]' },
    { k: 'recurseIn', t: '    backtrack(i + 1, path);' },
    { k: 'undoIn', t: '    path.pop();            // un-choose' },
    { k: 'recurseOut', t: '    backtrack(i + 1, path); // explore: skip nums[i]' },
    { k: 'endbt', t: '  }' },
    { k: 'call', t: '  backtrack(0, []);' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const steps: Trace['steps'] = [];
  const res: number[][] = [];
  const path: number[] = [];
  const snap = () => path.slice();

  steps.push({ kind: 'array', line: 'res', cells: [], note: `Start with an empty partial subset. We'll decide, index by index, whether to include or skip each of ${nums.length} numbers.` });

  function backtrack(i: number) {
    if (i === nums.length) {
      res.push(path.slice());
      steps.push({ kind: 'array', line: 'base', cells: snap(), current: path.length - 1, note: `i reached the end of nums → record this subset [${path.join(', ')}] (subset #${res.length}).` });
      return;
    }
    path.push(nums[i]);
    steps.push({ kind: 'array', line: 'include', cells: snap(), current: path.length - 1, note: `Choose: include nums[${i}]=${nums[i]} → path is now [${path.join(', ')}].` });
    backtrack(i + 1);
    path.pop();
    steps.push({ kind: 'array', line: 'undoIn', cells: snap(), note: `Un-choose: remove nums[${i}]=${nums[i]} → path back to [${path.join(', ')}]. Now explore the other branch — skip nums[${i}].` });
    backtrack(i + 1);
  }
  backtrack(0);

  steps.push({ kind: 'array', line: 'ret', cells: [], note: `Every index decided both ways → ${res.length} subsets total: ${res.map((s) => `[${s.join(',')}]`).join(', ')}.` });
  return { lines, steps };
}

// ---- Permutations -----------------------------------------------------

export function permutationsTrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function permute(nums) {' },
    { k: 'res', t: '  const res = [], used = new Array(nums.length).fill(false);' },
    { k: 'bthead', t: '  function backtrack(path) {' },
    { k: 'base', t: '    if (path.length === nums.length) { res.push([...path]); return; }' },
    { k: 'forloop', t: '    for (let i = 0; i < nums.length; i++) {' },
    { k: 'skipused', t: '      if (used[i]) continue;   // prune: already in this permutation' },
    { k: 'choose', t: '      used[i] = true; path.push(nums[i]);' },
    { k: 'recurse', t: '      backtrack(path);' },
    { k: 'unchoose', t: '      path.pop(); used[i] = false;' },
    { k: 'endfor', t: '    }' },
    { k: 'endbt', t: '  }' },
    { k: 'call', t: '  backtrack([]);' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const steps: Trace['steps'] = [];
  const res: number[][] = [];
  const used = new Array(nums.length).fill(false);
  const path: number[] = [];
  const snap = () => path.slice();

  steps.push({ kind: 'array', line: 'res', cells: [], note: `An empty path. Every recursive layer fills the next slot with any not-yet-used number — that's the "used[] array" shape for fixed-length permutations.` });

  function backtrack() {
    if (path.length === nums.length) {
      res.push(path.slice());
      steps.push({ kind: 'array', line: 'base', cells: snap(), current: path.length - 1, note: `Path filled all ${nums.length} slots → record permutation #${res.length}: [${path.join(', ')}].` });
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) {
        continue;
      }
      used[i] = true; path.push(nums[i]);
      steps.push({ kind: 'array', line: 'choose', cells: snap(), current: path.length - 1, note: `Choose nums[${i}]=${nums[i]} (unused) → path now [${path.join(', ')}].` });
      backtrack();
      path.pop(); used[i] = false;
      steps.push({ kind: 'array', line: 'unchoose', cells: snap(), note: `Un-choose nums[${i}]=${nums[i]}, mark it unused again → path back to [${path.join(', ')}]. Try the next candidate at this slot.` });
    }
  }
  backtrack();

  steps.push({ kind: 'array', line: 'ret', cells: [], note: `${res.length} permutations found: ${res.map((s) => `[${s.join(',')}]`).join(', ')}.` });
  return { lines, steps };
}

// ---- Combination Sum ----------------------------------------------------

export function combinationSumTrace(candidates: number[], target: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function combinationSum(candidates, target) {' },
    { k: 'res', t: '  const res = [];' },
    { k: 'bthead', t: '  function backtrack(start, remain, path) {' },
    { k: 'success', t: '    if (remain === 0) { res.push([...path]); return; }' },
    { k: 'forloop', t: '    for (let i = start; i < candidates.length; i++) {' },
    { k: 'prune', t: '      if (candidates[i] > remain) continue;   // prune: would overshoot' },
    { k: 'choose', t: '      path.push(candidates[i]);' },
    { k: 'recurse', t: '      backtrack(i, remain - candidates[i], path);   // i, not i+1: reuse allowed' },
    { k: 'unchoose', t: '      path.pop();' },
    { k: 'endfor', t: '    }' },
    { k: 'endbt', t: '  }' },
    { k: 'call', t: '  backtrack(0, target, []);' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const steps: Trace['steps'] = [];
  const res: number[][] = [];
  const path: number[] = [];
  const snap = () => path.slice();

  steps.push({ kind: 'array', line: 'res', cells: [], note: `Target is ${target}. At each step we either pick a candidate (candidates can repeat) or move on — and we stop a branch the instant it can't possibly work.` });

  function backtrack(start: number, remain: number) {
    if (remain === 0) {
      res.push(path.slice());
      steps.push({ kind: 'array', line: 'success', cells: snap(), current: path.length - 1, note: `Running sum hits exactly the target → record combination #${res.length}: [${path.join(', ')}].` });
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remain) {
        steps.push({ kind: 'array', line: 'prune', cells: snap(), note: `candidates[${i}]=${candidates[i]} > remaining ${remain} → adding it would overshoot the target. Prune this branch, don't even recurse.` });
        continue;
      }
      path.push(candidates[i]);
      steps.push({ kind: 'array', line: 'choose', cells: snap(), current: path.length - 1, note: `Pick candidates[${i}]=${candidates[i]} → path [${path.join(', ')}], remaining ${remain - candidates[i]}. Reuse is allowed, so the next call can pick index ${i} again.` });
      backtrack(i, remain - candidates[i]);
      path.pop();
      steps.push({ kind: 'array', line: 'unchoose', cells: snap(), note: `Backtrack: remove ${candidates[i]} → path back to [${path.join(', ')}]. Move on to the next candidate at this position.` });
    }
  }
  backtrack(0, target);

  steps.push({ kind: 'array', line: 'ret', cells: [], note: `${res.length} combinations sum to ${target}: ${res.map((s) => `[${s.join(',')}]`).join(', ')}.` });
  return { lines, steps };
}

// ---- N-Queens -------------------------------------------------------------

export function nQueensTrace(n: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function solveNQueens(n) {' },
    { k: 'sets', t: '  const cols = new Set(), diag1 = new Set(), diag2 = new Set();' },
    { k: 'placement', t: '  const placement = [];   // placement[row] = column of that row\'s queen' },
    { k: 'bthead', t: '  function backtrack(row) {' },
    { k: 'base', t: '    if (row === n) { record(placement); return; }' },
    { k: 'forloop', t: '    for (let c = 0; c < n; c++) {' },
    { k: 'conflict', t: '      if (cols.has(c) || diag1.has(row-c) || diag2.has(row+c)) continue;  // attacked' },
    { k: 'place', t: '      cols.add(c); diag1.add(row-c); diag2.add(row+c); placement.push(c);' },
    { k: 'recurse', t: '      backtrack(row + 1);' },
    { k: 'undo', t: '      cols.delete(c); diag1.delete(row-c); diag2.delete(row+c); placement.pop();' },
    { k: 'endfor', t: '    }' },
    { k: 'endbt', t: '  }' },
    { k: 'call', t: '  backtrack(0);' },
    { k: 'end', t: '}' },
  ];
  const steps: Trace['steps'] = [];
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();
  const placement: number[] = [];
  let solutionsFound = 0;

  const emptyGrid = (): GridCellState[][] => Array.from({ length: n }, () => new Array(n).fill('empty' as GridCellState));
  // g[r][c]: 'visited' for a queen already committed on an earlier row, otherwise
  // 'empty', with an optional single highlighted cell on the row being tried.
  const snap = (highlightRow: number | null, highlightCol: number | null, highlightState: GridCellState): GridCellState[][] => {
    const g = emptyGrid();
    for (let r = 0; r < placement.length; r++) g[r][placement[r]] = 'visited';
    if (highlightRow !== null && highlightCol !== null) g[highlightRow][highlightCol] = highlightState;
    return g;
  };

  steps.push({ kind: 'grid', line: 'placement', grid: emptyGrid(), note: `Place one queen per row, left to right. A placement is safe only if no earlier queen shares its column or either diagonal.` });

  function backtrack(row: number) {
    if (row === n) {
      solutionsFound++;
      steps.push({ kind: 'grid', line: 'base', grid: snap(null, null, 'empty'), note: `Row ${row}: all ${n} queens placed with no conflicts → solution #${solutionsFound} found, columns [${placement.join(', ')}].` });
      return;
    }
    for (let c = 0; c < n; c++) {
      const conflict = cols.has(c) || diag1.has(row - c) || diag2.has(row + c);
      if (conflict) {
        steps.push({ kind: 'grid', line: 'conflict', grid: snap(row, c, 'water'), note: `Row ${row}, column ${c}: shares a column or diagonal with a placed queen → attacked, skip.` });
        continue;
      }
      steps.push({ kind: 'grid', line: 'conflict', grid: snap(row, c, 'frontier'), note: `Row ${row}, column ${c}: no conflict with any placed queen → try it.` });
      cols.add(c); diag1.add(row - c); diag2.add(row + c); placement.push(c);
      steps.push({ kind: 'grid', line: 'place', grid: snap(row, c, 'land'), note: `Place a queen at (${row}, ${c}) and recurse into row ${row + 1}.` });
      backtrack(row + 1);
      cols.delete(c); diag1.delete(row - c); diag2.delete(row + c); placement.pop();
      steps.push({ kind: 'grid', line: 'undo', grid: snap(row, c, 'current'), note: `Backtrack: lift the queen from (${row}, ${c}) — its column/diagonals are free again — and try the next column in row ${row}.` });
    }
  }
  backtrack(0);

  steps.push({ kind: 'grid', line: 'call', grid: emptyGrid(), note: `Search exhausted every row-0 column → ${solutionsFound} total solution(s) for ${n}-queens.` });
  return { lines, steps };
}

// ---- Word Search ------------------------------------------------------

export function wordSearchTrace(board: string[][], word: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function exist(board, word) {' },
    { k: 'visited', t: '  const visited = board.map(row => row.map(() => false));' },
    { k: 'dfshead', t: '  function dfs(r, c, i) {' },
    { k: 'oob', t: '    if (outOfBounds(r, c) || visited[r][c] || board[r][c] !== word[i]) return false;' },
    { k: 'mark', t: '    visited[r][c] = true;' },
    { k: 'success', t: '    if (i === word.length - 1) return true;' },
    { k: 'explore', t: '    const found = DIRS.some(([dr, dc]) => dfs(r + dr, c + dc, i + 1));' },
    { k: 'unmark', t: '    if (!found) visited[r][c] = false;' },
    { k: 'ret', t: '    return found;' },
    { k: 'endbt', t: '  }' },
    { k: 'forstart', t: '  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)' },
    { k: 'trystart', t: '    if (dfs(r, c, 0)) return true;' },
    { k: 'retfalse', t: '  return false;' },
    { k: 'end', t: '}' },
  ];
  const rows = board.length, cols = board[0].length;
  const visited = board.map((row) => row.map(() => false));
  const path: [number, number][] = [];
  const steps: Trace['steps'] = [];

  const snap = (highlight: [number, number] | null, highlightState: GridCellState): GridCellState[][] => {
    const g: GridCellState[][] = board.map((row) => row.map(() => 'empty' as GridCellState));
    for (const [r, c] of path) g[r][c] = 'visited';
    if (highlight) g[highlight[0]][highlight[1]] = highlightState;
    return g;
  };

  steps.push({ kind: 'grid', line: 'visited', grid: snap(null, 'empty'), note: `Looking for "${word}" in the grid. DFS from each cell, marking cells 'current' while they're on the path and reverting the mark on backtrack.` });

  let done = false;
  function dfs(r: number, c: number, i: number): boolean {
    const oob = r < 0 || r >= rows || c < 0 || c >= cols;
    if (oob) return false;
    const conflict = visited[r][c] || board[r][c] !== word[i];
    if (conflict) {
      const reason = visited[r][c] ? 'already used on this path' : `board cell '${board[r][c]}' ≠ word[${i}]='${word[i]}'`;
      steps.push({ kind: 'grid', line: 'oob', grid: snap([r, c], 'water'), note: `Try (${r}, ${c}) for word[${i}]='${word[i]}': ${reason} → dead end, back off.` });
      return false;
    }
    visited[r][c] = true;
    path.push([r, c]);
    steps.push({ kind: 'grid', line: 'mark', grid: snap([r, c], 'current'), note: `(${r}, ${c}) = '${board[r][c]}' matches word[${i}] → mark it visited and add it to the path (length ${path.length}).` });
    if (i === word.length - 1) {
      steps.push({ kind: 'grid', line: 'success', grid: snap([r, c], 'current'), note: `Matched the final letter '${word[i]}' → the whole word "${word}" is on the board.` });
      return true;
    }
    let found = false;
    for (const [dr, dc] of WORD_DIRS) {
      if (dfs(r + dr, c + dc, i + 1)) { found = true; break; }
    }
    if (!found) {
      visited[r][c] = false;
      path.pop();
      steps.push({ kind: 'grid', line: 'unmark', grid: snap([r, c], 'current'), note: `None of the 4 directions continue "${word}" from (${r}, ${c}) → unmark it and backtrack to try a different path.` });
    }
    return found;
  }

  outer: for (let r = 0; r < rows && !done; r++) {
    for (let c = 0; c < cols && !done; c++) {
      if (dfs(r, c, 0)) { done = true; break outer; }
    }
  }

  steps.push({ kind: 'grid', line: 'retfalse', grid: snap(null, 'empty'), note: done ? `"${word}" found on the board → return true.` : `No starting cell led to a full match of "${word}" → return false.` });
  return { lines, steps };
}
