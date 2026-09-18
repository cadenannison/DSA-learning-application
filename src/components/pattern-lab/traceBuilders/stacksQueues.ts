import type { Trace, CodeLine, ArrayStep, NodePanel } from '../types';

/**
 * Stacks / Queues trace builders — run the real algorithm, record a step at
 * every meaningful push/pop. See ../../README.md for the authoring checklist.
 */

// ---- Valid Parentheses --------------------------------------------------

export function validParenthesesTrace(s: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function isValid(s) {' },
    { k: 'alloc', t: '  const stack = [];' },
    { k: 'loop', t: '  for (const c of s) {' },
    { k: 'open', t: '    if (c === "(" || c === "[" || c === "{") stack.push(c);' },
    { k: 'close', t: '    else {' },
    { k: 'match', t: '      if (stack.pop() !== pairOf(c)) return false;' },
    { k: 'endif', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return stack.length === 0;' },
    { k: 'end', t: '}' },
  ];
  const map: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];
  const codes = s.split('').map((c) => c.charCodeAt(0));
  const panel = (hot = false): NodePanel[] => [{ label: 'stack (open brackets)', items: stack.map((c) => ({ text: c, hot })) }];
  const steps: ArrayStep[] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: codes.map(() => null), panels: panel(), note: `Scan "${s}" character by character, using a stack to remember every bracket that's still open.` });
  let failed = false;
  let failIdx = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[' || c === '{') {
      stack.push(c);
      steps.push({ kind: 'array', line: 'open', cells: codes.map((code, j) => (j <= i ? code : null)), current: i, panels: panel(true), note: `'${c}' is an opening bracket → push it. Stack is now [${stack.join(' ')}].` });
    } else {
      const top = stack.pop();
      if (top !== map[c]) {
        failed = true;
        failIdx = i;
        steps.push({ kind: 'array', line: 'match', cells: codes.map((code, j) => (j <= i ? code : null)), current: i, panels: panel(true), note: `'${c}' needs to match '${map[c]}', but the top of the stack was ${top ? `'${top}'` : 'empty'} → mismatch, return false.` });
        break;
      }
      steps.push({ kind: 'array', line: 'match', cells: codes.map((code, j) => (j <= i ? code : null)), current: i, panels: panel(), note: `'${c}' closes '${top}' correctly → pop it. Stack is now [${stack.join(' ')}].` });
    }
  }
  if (!failed) {
    steps.push({ kind: 'array', line: 'ret', cells: codes, panels: panel(), note: stack.length === 0 ? `Every bracket was matched and the stack is empty → "${s}" is valid.` : `Stack still has [${stack.join(' ')}] open at the end → "${s}" is not valid (unclosed brackets).` });
  } else {
    steps.push({ kind: 'array', line: 'ret', cells: codes.map((code, j) => (j <= failIdx ? code : null)), current: failIdx, panels: panel(true), note: `Returned false at index ${failIdx} — "${s}" is not valid.` });
  }
  return { lines, steps, colLabels: s.split('') };
}

// ---- Min Stack -----------------------------------------------------------

type MinStackOp =
  | { op: 'push'; v: number }
  | { op: 'pop' }
  | { op: 'top' }
  | { op: 'getMin' };

export function minStackTrace(ops: MinStackOp[] = [
  { op: 'push', v: -2 },
  { op: 'push', v: 0 },
  { op: 'push', v: -3 },
  { op: 'getMin' },
  { op: 'pop' },
  { op: 'top' },
  { op: 'getMin' },
]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'class MinStack {' },
    { k: 'alloc', t: '  stack = []; mins = [];' },
    { k: 'push', t: '  push(v) {\n    stack.push(v);\n    mins.push(Math.min(v, mins.at(-1) ?? v));\n  }' },
    { k: 'pop', t: '  pop() { stack.pop(); mins.pop(); }' },
    { k: 'top', t: '  top() { return stack.at(-1); }' },
    { k: 'getMin', t: '  getMin() { return mins.at(-1); }' },
    { k: 'end', t: '}' },
  ];
  const stack: number[] = [];
  const mins: number[] = [];
  const cells: (number | null)[] = new Array(7).fill(null);
  const panel = (hot = false): NodePanel[] => [
    { label: 'stack (values)', items: stack.map((v) => ({ text: String(v), hot })) },
    { label: 'min so far (per depth)', items: mins.map((v) => ({ text: String(v), hot: false })) },
  ];
  const steps: ArrayStep[] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: cells.slice(), panels: panel(), note: 'Two parallel stacks: `stack` holds every pushed value, `mins` holds the running minimum at that same depth.' });
  let cellIdx = 0;
  for (const o of ops) {
    if (o.op === 'push') {
      stack.push(o.v);
      const m = Math.min(o.v, mins.length ? mins[mins.length - 1] : o.v);
      mins.push(m);
      cells[cellIdx] = o.v;
      steps.push({ kind: 'array', line: 'push', cells: cells.slice(), current: cellIdx, panels: panel(true), note: `push(${o.v}) → stack = [${stack.join(', ')}]. New running min = min(${o.v}, previous min) = ${m}, pushed onto mins too.` });
      cellIdx++;
    } else if (o.op === 'pop') {
      const popped = stack.pop();
      mins.pop();
      cellIdx--;
      cells[cellIdx] = null;
      steps.push({ kind: 'array', line: 'pop', cells: cells.slice(), panels: panel(true), note: `pop() removes ${popped} from both stacks in lockstep → stack = [${stack.join(', ')}], min so far now ${mins.length ? mins[mins.length - 1] : 'undefined'}.` });
    } else if (o.op === 'top') {
      const t = stack[stack.length - 1];
      steps.push({ kind: 'array', line: 'top', cells: cells.slice(), current: cellIdx - 1, panels: panel(true), note: `top() → ${t} (the last value pushed that hasn't been popped).` });
    } else {
      const m = mins[mins.length - 1];
      steps.push({ kind: 'array', line: 'getMin', cells: cells.slice(), panels: panel(true), note: `getMin() → ${m}, read directly off the top of the mins stack — O(1), no rescanning.` });
    }
  }
  return { lines, steps, colLabels: cells.map((_, i) => i) };
}

// ---- Daily Temperatures ---------------------------------------------------

export function dailyTemperaturesTrace(temps: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function dailyTemperatures(temps) {' },
    { k: 'alloc', t: '  const res = new Array(temps.length).fill(0);' },
    { k: 'stack', t: '  const stack = [];   // indices, decreasing temps' },
    { k: 'loop', t: '  for (let i = 0; i < temps.length; i++) {' },
    { k: 'while', t: '    while (stack.length && temps[stack.at(-1)] < temps[i]) {' },
    { k: 'pop', t: '      const j = stack.pop();\n      res[j] = i - j;' },
    { k: 'endwhile', t: '    }' },
    { k: 'push', t: '    stack.push(i);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const n = temps.length;
  const res: (number | null)[] = new Array(n).fill(null);
  const stack: number[] = [];
  const panel = (hot = false): NodePanel[] => [{ label: 'stack (indices, temp)', items: stack.map((j) => ({ text: `i${j}:${temps[j]}°`, hot })) }];
  const steps: ArrayStep[] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: res.slice(), panels: panel(), note: `res[i] will hold how many days until a warmer temperature. Stack holds indices whose "days until warmer" answer is still unknown, kept in decreasing-temperature order.` });
  for (let i = 0; i < n; i++) {
    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
      const j = stack.pop() as number;
      res[j] = i - j;
      steps.push({ kind: 'array', line: 'pop', cells: res.slice(), current: i, source: j, panels: panel(true), note: `temps[${i}]=${temps[i]}° is warmer than temps[${j}]=${temps[j]}° sitting on the stack → pop day ${j}, its answer resolves now: res[${j}] = ${i} − ${j} = ${res[j]}.` });
    }
    stack.push(i);
    steps.push({ kind: 'array', line: 'push', cells: res.slice(), current: i, panels: panel(true), note: `Push day ${i} (${temps[i]}°) — it isn't beaten yet, so its answer stays unknown for now. Stack = [${stack.map((j) => `${j}:${temps[j]}°`).join(', ')}].` });
  }
  steps.push({ kind: 'array', line: 'ret', cells: res.map((v) => v ?? 0), panels: panel(), note: `Any index left on the stack never found a warmer day → its res stays 0. Final answer: [${res.map((v) => v ?? 0).join(', ')}].` });
  return { lines, steps, colLabels: temps.map((t) => `${t}°`) };
}

// ---- Next Greater Element II (circular) -----------------------------------

export function nextGreaterElementIITrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function nextGreaterElements(nums) {' },
    { k: 'alloc', t: '  const n = nums.length;\n  const res = new Array(n).fill(-1);' },
    { k: 'stack', t: '  const stack = [];   // pending indices' },
    { k: 'loop', t: '  for (let i = 0; i < 2 * n; i++) {' },
    { k: 'idx', t: '    const idx = i % n;   // wrap around' },
    { k: 'while', t: '    while (stack.length && nums[stack.at(-1)] < nums[idx]) {' },
    { k: 'pop', t: '      res[stack.pop()] = nums[idx];' },
    { k: 'endwhile', t: '    }' },
    { k: 'push', t: '    if (i < n) stack.push(idx);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const n = nums.length;
  const res: (number | null)[] = new Array(n).fill(null);
  const stack: number[] = [];
  const panel = (hot = false): NodePanel[] => [{ label: 'stack (pending indices)', items: stack.map((j) => ({ text: `i${j}:${nums[j]}`, hot })) }];
  const steps: ArrayStep[] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: res.slice(), panels: panel(), note: `nums = [${nums.join(', ')}] is treated as circular. Iterating i from 0 to 2n−1 and mapping idx = i % n lets each index "see" one lap of wraparound without physically doubling the array.` });
  for (let i = 0; i < 2 * n; i++) {
    const idx = i % n;
    steps.push({ kind: 'array', line: 'idx', cells: res.map((v) => v ?? null), current: idx, panels: panel(), note: `i=${i} → idx=${idx} (pass ${i < n ? '1' : '2, wraparound'}), value nums[${idx}]=${nums[idx]}.` });
    while (stack.length && nums[stack[stack.length - 1]] < nums[idx]) {
      const j = stack.pop() as number;
      res[j] = nums[idx];
      steps.push({ kind: 'array', line: 'pop', cells: res.map((v) => v ?? null), current: idx, source: j, panels: panel(true), note: `nums[${idx}]=${nums[idx]} beats the pending index ${j} (nums[${j}]=${nums[j]}) → pop it, res[${j}] = ${nums[idx]}.` });
    }
    if (i < n) {
      stack.push(idx);
      steps.push({ kind: 'array', line: 'push', cells: res.map((v) => v ?? null), current: idx, panels: panel(true), note: `First pass only: push index ${idx} — still waiting for something bigger. Stack = [${stack.map((j) => `${j}:${nums[j]}`).join(', ')}].` });
    }
  }
  const finalRes = res.map((v) => v ?? -1);
  steps.push({ kind: 'array', line: 'ret', cells: finalRes, panels: panel(), note: `Any index still on the stack after both passes never found a bigger circular neighbor → stays -1. Final answer: [${finalRes.join(', ')}].` });
  return { lines, steps, colLabels: nums.map((v, i) => `i${i}:${v}`) };
}

// ---- Largest Rectangle in Histogram ----------------------------------------

export function largestRectangleTrace(heights: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function largestRectangleArea(heights) {' },
    { k: 'alloc', t: '  const h = [...heights, 0];   // sentinel flushes the stack' },
    { k: 'stack', t: '  const stack = [];   // increasing heights\n  let max = 0;' },
    { k: 'loop', t: '  for (let i = 0; i < h.length; i++) {' },
    { k: 'while', t: '    while (stack.length && h[stack.at(-1)] > h[i]) {' },
    { k: 'pop', t: '      const top = stack.pop();\n      const width = stack.length ? i - stack.at(-1) - 1 : i;\n      max = Math.max(max, h[top] * width);' },
    { k: 'endwhile', t: '    }' },
    { k: 'push', t: '    stack.push(i);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return max;' },
    { k: 'end', t: '}' },
  ];
  const h = [...heights, 0]; // sentinel bar of height 0 flushes everything left on the stack
  const stack: number[] = [];
  let max = 0;
  const cells: (number | null)[] = heights.slice();
  const panel = (hot = false): NodePanel[] => [{ label: 'stack (indices, height)', items: stack.map((j) => ({ text: `i${j}:${h[j]}`, hot })) }];
  const steps: ArrayStep[] = [];
  steps.push({ kind: 'array', line: 'alloc', cells: cells.slice(), panels: panel(), note: `heights = [${heights.join(', ')}]. Append a sentinel bar of height 0 so the final pass forces every remaining bar on the stack to be popped and priced.` });
  for (let i = 0; i < h.length; i++) {
    while (stack.length && h[stack[stack.length - 1]] > h[i]) {
      const top = stack.pop() as number;
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      const area = h[top] * width;
      const before = max;
      max = Math.max(max, area);
      steps.push({ kind: 'array', line: 'pop', cells: cells.slice(), current: i < heights.length ? i : undefined, source: top, panels: panel(true), note: `${i < heights.length ? `height ${h[i]} at i=${i}` : 'end-of-array sentinel (height 0)'} is shorter than the top of the stack (i${top}:${h[top]}) → bar ${top}'s rectangle is finalized now: width = ${width}, area = ${h[top]}×${width} = ${area}.${area > before ? ` New max = ${max}.` : ` Max stays ${max}.`}` });
    }
    if (i < heights.length) {
      stack.push(i);
      steps.push({ kind: 'array', line: 'push', cells: cells.slice(), current: i, panels: panel(true), note: `Push i=${i} (height ${h[i]}) — taller than (or equal to) everything currently on the stack, so its rectangle can't be finalized yet. Stack = [${stack.map((j) => `${j}:${h[j]}`).join(', ')}].` });
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells: cells.slice(), panels: panel(), note: `Every bar has been popped and priced → largest rectangle area = ${max}.` });
  return { lines, steps, colLabels: heights.map((v, i) => `i${i}:${v}`) };
}
