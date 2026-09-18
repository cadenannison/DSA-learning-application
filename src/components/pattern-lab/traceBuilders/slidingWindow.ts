import type { Trace, CodeLine, NodePanel } from '../types';

/**
 * Sliding Window trace builders — run the real algorithm, record a step at
 * every meaningful window expand/shrink. See ../../README.md for the
 * authoring checklist.
 */

// ---- Maximum Sum Subarray of Size K (simple, fixed-size window) ---------

export function maxSumSubarrayKTrace(nums: number[], k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function maxSumSubarray(nums, k) {' },
    { k: 'fill', t: '  let sum = 0;\n  for (let i = 0; i < k; i++) sum += nums[i];' },
    { k: 'max0', t: '  let best = sum;' },
    { k: 'loop', t: '  for (let right = k; right < nums.length; right++) {' },
    { k: 'slide', t: '    sum += nums[right] - nums[right - k];' },
    { k: 'update', t: '    best = Math.max(best, sum);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return best;' },
    { k: 'end', t: '}' },
  ];
  const cells = nums.slice();
  const steps: Trace['steps'] = [];

  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  steps.push({ kind: 'array', line: 'fill', cells, left: 0, right: k - 1, note: `Fill the first window of size ${k}: sum(nums[0..${k - 1}]) = ${sum}.` });
  let best = sum;
  steps.push({ kind: 'array', line: 'max0', cells, left: 0, right: k - 1, note: `Seed best with the first window's sum: best = ${best}.` });

  for (let right = k; right < nums.length; right++) {
    const left = right - k + 1;
    const dropped = nums[right - k];
    const added = nums[right];
    sum += added - dropped;
    const before = best;
    best = Math.max(best, sum);
    steps.push({
      kind: 'array', line: 'slide', cells, left, right,
      note: `Slide right to ${right}: add nums[${right}]=${added}, drop nums[${right - k}]=${dropped} (size stays ${k}) → sum = ${sum}.`,
    });
    steps.push({
      kind: 'array', line: 'update', cells, left, right,
      note: best !== before ? `${sum} > ${before} → best improves to ${best}.` : `${sum} ≤ ${before} → best stays ${best}.`,
    });
  }
  steps.push({ kind: 'array', line: 'ret', cells, note: `Every window of size ${k} checked → maximum sum is ${best}.` });
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}

// ---- Longest Substring Without Repeating Characters (easy, variable window) --

export function longestUniqueSubstringTrace(s: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function lengthOfLongestSubstring(s) {' },
    { k: 'setup', t: '  const lastSeen = new Map();\n  let left = 0, best = 0;' },
    { k: 'loop', t: '  for (let right = 0; right < s.length; right++) {' },
    { k: 'check', t: '    const c = s[right];' },
    { k: 'shrink', t: '    if (lastSeen.has(c) && lastSeen.get(c) >= left) {\n      left = lastSeen.get(c) + 1;\n    }' },
    { k: 'record', t: '    lastSeen.set(c, right);' },
    { k: 'update', t: '    best = Math.max(best, right - left + 1);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return best;' },
    { k: 'end', t: '}' },
  ];
  // Represent each cell as the character code so the array viz has numbers,
  // and spell out the actual character in the note.
  const cells = s.split('').map((c) => c.charCodeAt(0));
  const lastSeen = new Map<string, number>();
  let left = 0, best = 0;
  const steps: Trace['steps'] = [];

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (lastSeen.has(c) && (lastSeen.get(c) as number) >= left) {
      const oldLeft = left;
      left = (lastSeen.get(c) as number) + 1;
      steps.push({
        kind: 'array', line: 'shrink', cells, current: right, left: oldLeft, right,
        note: `'${c}' at index ${right} was already seen at index ${lastSeen.get(c)}, inside the window → shrink: left jumps to ${left}.`,
      });
    }
    lastSeen.set(c, right);
    const before = best;
    best = Math.max(best, right - left + 1);
    steps.push({
      kind: 'array', line: 'update', cells, current: right, left, right,
      note: best !== before
        ? `Window is now s[${left}..${right}] = "${s.slice(left, right + 1)}", length ${right - left + 1} → best improves to ${best}.`
        : `Window is s[${left}..${right}] = "${s.slice(left, right + 1)}", length ${right - left + 1} → best stays ${best}.`,
    });
  }
  steps.push({ kind: 'array', line: 'ret', cells, left: 0, right: cells.length - 1, note: `Longest substring without repeating characters in "${s}" has length ${best}.` });
  return { lines, steps, colLabels: s.split('') };
}

// ---- Minimum Window Substring (medium, expand-then-shrink + frequency map) --

export function minWindowSubstringTrace(s: string, t: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function minWindow(s, t) {' },
    { k: 'need', t: '  const need = new Map();\n  for (const c of t) need.set(c, (need.get(c) || 0) + 1);\n  let missing = t.length;' },
    { k: 'loop', t: '  let left = 0, start = 0, end = 0;\n  for (let right = 0; right < s.length; right++) {' },
    { k: 'expand', t: '    const c = s[right];\n    window.set(c, (window.get(c) || 0) + 1);\n    if (need.has(c) && window.get(c) <= need.get(c)) missing--;' },
    { k: 'shrinkwhile', t: '    while (missing === 0) {' },
    { k: 'record', t: '      if (end === 0 || right - left + 1 < end - start) { start = left; end = right + 1; }' },
    { k: 'contract', t: '      const lc = s[left];\n      window.set(lc, window.get(lc) - 1);\n      if (need.has(lc) && window.get(lc) < need.get(lc)) missing++;\n      left++;' },
    { k: 'endwhile', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return s.slice(start, end);' },
    { k: 'end', t: '}' },
  ];
  const cells = s.split('').map((c) => c.charCodeAt(0));
  const need = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let missing = t.length;
  const window = new Map<string, number>();
  let left = 0, start = 0, end = 0;
  const steps: Trace['steps'] = [];

  const needPanel = (): NodePanel => ({
    label: 'need remaining',
    items: [...need.entries()].map(([ch, cnt]) => {
      const have = window.get(ch) || 0;
      const remaining = Math.max(0, cnt - have);
      return { text: `${ch}:${remaining}`, hot: remaining > 0 };
    }),
  });

  steps.push({ kind: 'array', line: 'need', cells, panels: [needPanel()], note: `Build a "need" count from t="${t}": ${[...need.entries()].map(([c, n]) => `${c}=${n}`).join(', ')}. missing = ${missing} characters still required.` });

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) || 0) + 1);
    if (need.has(c) && (window.get(c) as number) <= (need.get(c) as number)) missing--;
    steps.push({
      kind: 'array', line: 'expand', cells, current: right, left, right, panels: [needPanel()],
      note: `Expand right to ${right}: add '${c}' (window now has ${window.get(c)} of it). missing = ${missing}.`,
    });
    while (missing === 0) {
      if (end === 0 || right - left + 1 < end - start) {
        start = left; end = right + 1;
        steps.push({
          kind: 'array', line: 'record', cells, left, right, panels: [needPanel()],
          note: `Window s[${left}..${right}] = "${s.slice(left, right + 1)}" covers all of t and is the smallest valid one seen so far → record it.`,
        });
      }
      const lc = s[left];
      window.set(lc, (window.get(lc) as number) - 1);
      if (need.has(lc) && (window.get(lc) as number) < (need.get(lc) as number)) missing++;
      left++;
      steps.push({
        kind: 'array', line: 'contract', cells, left, right, panels: [needPanel()],
        note: `Shrink from the left: drop '${lc}', left moves to ${left}. ${missing === 0 ? 'Window still valid — keep shrinking.' : `missing = ${missing} → window no longer covers t, stop shrinking.`}`,
      });
    }
  }
  const answer = end === 0 ? '' : s.slice(start, end);
  steps.push({ kind: 'array', line: 'ret', cells, left: end === 0 ? undefined : start, right: end === 0 ? undefined : end - 1, panels: [needPanel()], note: answer ? `Smallest window covering every character of "${t}" is "${answer}" (s[${start}..${end - 1}]).` : `No window of "${s}" covers all of "${t}" → return "".` });
  return { lines, steps, colLabels: s.split('') };
}

// ---- Longest Repeating Character Replacement (medium/hard, freq-in-window) --

export function characterReplacementTrace(s: string, k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function characterReplacement(s, k) {' },
    { k: 'setup', t: '  const count = new Map();\n  let left = 0, maxFreq = 0, best = 0;' },
    { k: 'loop', t: '  for (let right = 0; right < s.length; right++) {' },
    { k: 'expand', t: '    const c = s[right];\n    count.set(c, (count.get(c) || 0) + 1);\n    maxFreq = Math.max(maxFreq, count.get(c));' },
    { k: 'checkinvalid', t: '    while ((right - left + 1) - maxFreq > k) {' },
    { k: 'shrink', t: '      count.set(s[left], count.get(s[left]) - 1);\n      left++;' },
    { k: 'endwhile', t: '    }' },
    { k: 'update', t: '    best = Math.max(best, right - left + 1);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return best;' },
    { k: 'end', t: '}' },
  ];
  const cells = s.split('').map((c) => c.charCodeAt(0));
  const count = new Map<string, number>();
  let left = 0, maxFreq = 0, best = 0;
  const steps: Trace['steps'] = [];

  const freqPanel = (): NodePanel => ({
    label: 'window frequencies',
    items: [...count.entries()].filter(([, n]) => n > 0).map(([ch, n]) => ({ text: `${ch}:${n}`, hot: n === maxFreq })),
  });

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    count.set(c, (count.get(c) || 0) + 1);
    maxFreq = Math.max(maxFreq, count.get(c) as number);
    steps.push({
      kind: 'array', line: 'expand', cells, current: right, left, right, panels: [freqPanel()],
      note: `Expand right to ${right}: '${c}' count is now ${count.get(c)}. maxFreq (most frequent char in window) = ${maxFreq}.`,
    });
    while ((right - left + 1) - maxFreq > k) {
      const lc = s[left];
      count.set(lc, (count.get(lc) as number) - 1);
      left++;
      steps.push({
        kind: 'array', line: 'shrink', cells, left, right, panels: [freqPanel()],
        note: `Window size ${right - left + 2} minus maxFreq ${maxFreq} exceeds k=${k} (would need more than ${k} replacements) → shrink: drop '${lc}', left moves to ${left}.`,
      });
    }
    const before = best;
    best = Math.max(best, right - left + 1);
    steps.push({
      kind: 'array', line: 'update', cells, left, right, panels: [freqPanel()],
      note: best !== before
        ? `Window s[${left}..${right}] size ${right - left + 1} needs only ${(right - left + 1) - maxFreq} replacements (≤ k=${k}) → best improves to ${best}.`
        : `Window s[${left}..${right}] size ${right - left + 1} → best stays ${best}.`,
    });
  }
  steps.push({ kind: 'array', line: 'ret', cells, note: `With at most ${k} replacement(s), the longest run of a single repeated character achievable in "${s}" has length ${best}.` });
  return { lines, steps, colLabels: s.split('') };
}

// ---- Sliding Window Maximum (hard, monotonic deque) ----------------------

export function slidingWindowMaximumTrace(nums: number[], k: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function maxSlidingWindow(nums, k) {' },
    { k: 'setup', t: '  const dq = []; // stores indices, values decreasing\n  const res = [];' },
    { k: 'loop', t: '  for (let i = 0; i < nums.length; i++) {' },
    { k: 'popback', t: '    while (dq.length && nums[dq.at(-1)] <= nums[i]) dq.pop();' },
    { k: 'push', t: '    dq.push(i);' },
    { k: 'popfront', t: '    if (dq[0] <= i - k) dq.shift();' },
    { k: 'record', t: '    if (i >= k - 1) res.push(nums[dq[0]]);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];
  const cells = nums.slice();
  const dq: number[] = []; // indices, front-to-back, values decreasing
  const res: number[] = [];
  const steps: Trace['steps'] = [];

  const dqPanel = (): NodePanel => ({
    label: 'monotonic deque (idx:val)',
    items: dq.length ? dq.map((i, pos) => ({ text: `${i}:${nums[i]}`, hot: pos === 0 })) : [],
  });

  for (let i = 0; i < nums.length; i++) {
    const left = Math.max(0, i - k + 1);
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) {
      const popped = dq.pop() as number;
      steps.push({
        kind: 'array', line: 'popback', cells, current: i, left, right: i, panels: [dqPanel()],
        note: `nums[${popped}]=${nums[popped]} ≤ nums[${i}]=${nums[i]} → it can never be the max while ${i} is in the window, pop it from the back of the deque.`,
      });
    }
    dq.push(i);
    steps.push({
      kind: 'array', line: 'push', cells, current: i, left, right: i, panels: [dqPanel()],
      note: `Push index ${i} (value ${nums[i]}) onto the back of the deque — it's now the smallest-known value, kept in case nothing bigger arrives before it expires.`,
    });
    if (dq[0] <= i - k) {
      const expired = dq.shift() as number;
      steps.push({
        kind: 'array', line: 'popfront', cells, current: i, left, right: i, panels: [dqPanel()],
        note: `Front index ${expired} has fallen outside the window (< ${left}) → pop it from the front.`,
      });
    }
    if (i >= k - 1) {
      res.push(nums[dq[0]]);
      steps.push({
        kind: 'array', line: 'record', cells, current: i, left, right: i, panels: [dqPanel()],
        note: `Window [${left}, ${i}] is now full (size ${k}) → its maximum is the deque's front, nums[${dq[0]}]=${nums[dq[0]]}. Output so far: [${res.join(', ')}].`,
      });
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells, panels: [dqPanel()], note: `Sliding window maximum for every window of size ${k}: [${res.join(', ')}].` });
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}
