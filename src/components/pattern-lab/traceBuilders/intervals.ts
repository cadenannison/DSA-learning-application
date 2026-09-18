import type { Trace, CodeLine, NodePanel } from '../types';

/**
 * Intervals trace builders — run the real algorithm, record a step at every
 * meaningful comparison/merge/decision. See ../../README.md for the
 * authoring checklist.
 *
 * Schema note: `ArrayStep.cells` only holds `(number | null)[]`, so an
 * interval pair [start, end] can't live in a cell directly. Every builder
 * below puts one meaningful number per interval into `cells` (its start
 * time, post-sort) and carries the FULL interval bounds — the actual
 * numbers a learner needs — in the step's `note` text.
 */

// ---- Merge Intervals -----------------------------------------------------

export function mergeIntervalsTrace(input: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function merge(intervals) {' },
    { k: 'sort', t: '  intervals.sort((a, b) => a[0] - b[0]);' },
    { k: 'alloc', t: '  const out = [intervals[0]];' },
    { k: 'loop', t: '  for (let i = 1; i < intervals.length; i++) {' },
    { k: 'check', t: '    const last = out[out.length - 1];' },
    { k: 'merge', t: '    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);' },
    { k: 'new', t: '    else out.push(intervals[i]);' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return out;' },
    { k: 'end', t: '}' },
  ];

  const sorted = input.slice().sort((a, b) => a[0] - b[0]);
  const cells = sorted.map((iv) => iv[0]);
  const steps: Trace['steps'] = [];

  steps.push({
    kind: 'array', line: 'sort', cells, note:
      `Sort by START time first: [${sorted.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}]. Once sorted, any interval that overlaps the one we're building must come immediately after it.`,
  });

  const out: [number, number][] = [sorted[0].slice() as [number, number]];
  steps.push({
    kind: 'array', line: 'alloc', cells, current: 0, note:
      `Start the merged output with the first interval: [${out[0][0]},${out[0][1]}].`,
  });

  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const iv = sorted[i];
    if (iv[0] <= last[1]) {
      const before = last[1];
      last[1] = Math.max(last[1], iv[1]);
      steps.push({
        kind: 'array', line: 'merge', cells, current: i, note:
          `[${iv[0]},${iv[1]}] starts at ${iv[0]}, which is ≤ the open group's end (${before}) → overlaps. Merge: extend the group to [${last[0]},${last[1]}].`,
      });
    } else {
      out.push(iv.slice() as [number, number]);
      steps.push({
        kind: 'array', line: 'new', cells, current: i, note:
          `[${iv[0]},${iv[1]}] starts at ${iv[0]}, which is past the open group's end (${last[1]}) → no overlap. Start a new group: [${iv[0]},${iv[1]}].`,
      });
    }
  }

  steps.push({
    kind: 'array', line: 'ret', cells, note:
      `Merged result: [${out.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}].`,
  });

  return { lines, steps, colLabels: sorted.map((iv) => `[${iv[0]},${iv[1]}]`) };
}

// ---- Insert Interval ------------------------------------------------------

export function insertIntervalTrace(input: [number, number][], newInterval: [number, number]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function insert(intervals, newInterval) {' },
    { k: 'before', t: '  while (i < n && intervals[i][1] < newInterval[0]) res.push(intervals[i++]);' },
    { k: 'overlap', t: '  while (i < n && intervals[i][0] <= newInterval[1]) {' },
    { k: 'expand', t: '    newInterval = [min(...), max(...)]; i++;' },
    { k: 'endoverlap', t: '  }' },
    { k: 'push', t: '  res.push(newInterval);' },
    { k: 'after', t: '  while (i < n) res.push(intervals[i++]);' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];

  const cells = input.map((iv) => iv[0]);
  const steps: Trace['steps'] = [];
  let ni: [number, number] = newInterval.slice() as [number, number];
  let i = 0;
  const n = input.length;

  steps.push({
    kind: 'array', line: 'init', cells, note:
      `intervals = [${input.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}], newInterval = [${ni[0]},${ni[1]}].`,
  });

  while (i < n && input[i][1] < ni[0]) {
    steps.push({
      kind: 'array', line: 'before', cells, current: i, note:
        `[${input[i][0]},${input[i][1]}] ends before newInterval [${ni[0]},${ni[1]}] starts → no overlap yet, copy it through unchanged.`,
    });
    i++;
  }

  while (i < n && input[i][0] <= ni[1]) {
    const before: [number, number] = [ni[0], ni[1]];
    ni = [Math.min(ni[0], input[i][0]), Math.max(ni[1], input[i][1])];
    steps.push({
      kind: 'array', line: 'expand', cells, current: i, note:
        `[${input[i][0]},${input[i][1]}] overlaps newInterval [${before[0]},${before[1]}] (start ${input[i][0]} ≤ ${before[1]}) → absorb it: newInterval becomes [${ni[0]},${ni[1]}].`,
    });
    i++;
  }

  steps.push({
    kind: 'array', line: 'push', cells, current: Math.min(i, n - 1), note:
      `No more overlaps → insert the (possibly expanded) newInterval as-is: [${ni[0]},${ni[1]}].`,
  });

  const result: [number, number][] = [];
  {
    // Re-run cleanly to assemble the final answer for the closing note —
    // same algorithm as the instrumented loops above, just uncluttered by
    // step-pushing so the result list is easy to read here.
    let j = 0;
    const res: [number, number][] = [];
    while (j < n && input[j][1] < newInterval[0]) res.push(input[j++]);
    let merged: [number, number] = newInterval.slice() as [number, number];
    while (j < n && input[j][0] <= merged[1]) {
      merged = [Math.min(merged[0], input[j][0]), Math.max(merged[1], input[j][1])];
      j++;
    }
    res.push(merged);
    while (j < n) res.push(input[j++]);
    result.push(...res);
  }

  while (i < n) {
    steps.push({
      kind: 'array', line: 'after', cells, current: i, note:
        `[${input[i][0]},${input[i][1]}] starts after newInterval → copy it through unchanged.`,
    });
    i++;
  }

  steps.push({
    kind: 'array', line: 'ret', cells, note:
      `Result: [${result.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}].`,
  });

  return { lines, steps, colLabels: input.map((iv) => `[${iv[0]},${iv[1]}]`) };
}

// ---- Non-overlapping Intervals (min removals) -----------------------------

export function eraseOverlapIntervalsTrace(input: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function eraseOverlapIntervals(intervals) {' },
    { k: 'sort', t: '  intervals.sort((a, b) => a[1] - b[1]);   // sort by END time' },
    { k: 'loop', t: '  for (const iv of intervals) {' },
    { k: 'keep', t: '    if (iv[0] >= lastEnd) { lastEnd = iv[1]; kept++; }' },
    { k: 'remove', t: '    else removals++;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return removals;' },
    { k: 'end', t: '}' },
  ];

  const sorted = input.slice().sort((a, b) => a[1] - b[1]);
  const cells = sorted.map((iv) => iv[0]);
  const steps: Trace['steps'] = [];

  steps.push({
    kind: 'array', line: 'sort', cells, note:
      `Sort by END time (not start!): [${sorted.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}]. Ending earliest always leaves the most room for what comes next — the greedy choice.`,
  });

  let lastEnd = -Infinity;
  let removals = 0;
  for (let i = 0; i < sorted.length; i++) {
    const iv = sorted[i];
    if (iv[0] >= lastEnd) {
      const prevEnd = lastEnd;
      lastEnd = iv[1];
      steps.push({
        kind: 'array', line: 'keep', cells, current: i, note:
          `[${iv[0]},${iv[1]}] starts at ${iv[0]}, which is ≥ the last kept interval's end (${prevEnd === -Infinity ? 'none yet' : prevEnd}) → keep it. Last kept end is now ${lastEnd}.`,
      });
    } else {
      removals++;
      steps.push({
        kind: 'array', line: 'remove', cells, current: i, note:
          `[${iv[0]},${iv[1]}] starts at ${iv[0]}, which is < the last kept interval's end (${lastEnd}) → it overlaps. Remove it (removals = ${removals}); last kept end stays ${lastEnd}.`,
      });
    }
  }

  steps.push({
    kind: 'array', line: 'ret', cells, note:
      `Minimum removals to make the rest non-overlapping: ${removals}.`,
  });

  return { lines, steps, colLabels: sorted.map((iv) => `[${iv[0]},${iv[1]}]`) };
}

// ---- Meeting Rooms II (min rooms needed) ----------------------------------

export function meetingRoomsIITrace(input: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function minMeetingRooms(intervals) {' },
    { k: 'sortstarts', t: '  const starts = intervals.map(i => i[0]).sort((a,b) => a-b);' },
    { k: 'heap', t: '  const heap = new MinHeap(); // end times of rooms in use' },
    { k: 'loop', t: '  for (const s of starts) {' },
    { k: 'reuse', t: '    if (heap.peek() !== undefined && heap.peek() <= s) heap.pop();  // room freed, reuse it' },
    { k: 'push', t: '    heap.push(matchingEnd(s));  // occupy a room (new or reused)' },
    { k: 'track', t: '    rooms = Math.max(rooms, heap.size());' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return rooms;' },
    { k: 'end', t: '}' },
  ];

  // Real binary min-heap over end times (array-backed, sift-up/sift-down).
  class MinHeap {
    a: number[] = [];
    get size() { return this.a.length; }
    peek() { return this.a[0]; }
    push(v: number) {
      this.a.push(v);
      let i = this.a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.a[p] <= this.a[i]) break;
        [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
        i = p;
      }
    }
    pop() {
      const top = this.a[0];
      const last = this.a.pop() as number;
      if (this.a.length) {
        this.a[0] = last;
        let i = 0;
        while (true) {
          const l = 2 * i + 1, r = 2 * i + 2;
          let smallest = i;
          if (l < this.a.length && this.a[l] < this.a[smallest]) smallest = l;
          if (r < this.a.length && this.a[r] < this.a[smallest]) smallest = r;
          if (smallest === i) break;
          [this.a[i], this.a[smallest]] = [this.a[smallest], this.a[i]];
          i = smallest;
        }
      }
      return top;
    }
    toChips(): NodePanel['items'] {
      return this.a.length ? this.a.slice().sort((x, y) => x - y).map((e) => ({ text: `end ${e}`, hot: e === this.peek() })) : [];
    }
  }

  // Match each sorted start back to *an* interval sharing that start, so we
  // can report its real end time (there are no duplicate starts in this
  // classic example, so this lookup is unambiguous).
  const byStart = new Map<number, number[]>();
  for (const [s, e] of input) {
    if (!byStart.has(s)) byStart.set(s, []);
    (byStart.get(s) as number[]).push(e);
  }
  const starts = input.map((iv) => iv[0]).sort((a, b) => a - b);
  const cells = starts;
  const steps: Trace['steps'] = [];

  steps.push({
    kind: 'array', line: 'sortstarts', cells, note:
      `Sort start times: [${starts.join(', ')}]. We sweep through them in order and use a min-heap of "rooms in use" end times to know the instant a room frees up.`,
  });

  const heap = new MinHeap();
  let rooms = 0;
  const usedEnds = new Map<number, number[]>(); // start -> which end we assigned, for bookkeeping

  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const candidateEnds = (byStart.get(s) as number[]).filter((e) => !(usedEnds.get(s) ?? []).includes(e));
    const end = candidateEnds[0];
    if (!usedEnds.has(s)) usedEnds.set(s, []);
    (usedEnds.get(s) as number[]).push(end);

    if (heap.size > 0 && heap.peek() <= s) {
      const freed = heap.pop();
      steps.push({
        kind: 'array', line: 'reuse', cells, current: i, panels: [{ label: 'rooms in use (end times)', items: heap.toChips() }], note:
          `Meeting starting at ${s}: the earliest room frees at ${freed} (${freed} ≤ ${s}) → reuse that room instead of adding a new one.`,
      });
    } else {
      steps.push({
        kind: 'array', line: 'reuse', cells, current: i, panels: [{ label: 'rooms in use (end times)', items: heap.toChips() }], note:
          `Meeting starting at ${s}: ${heap.size === 0 ? 'no rooms occupied yet' : `earliest room frees at ${heap.peek()}, which is after ${s}`} → no room to reuse.`,
      });
    }

    heap.push(end);
    rooms = Math.max(rooms, heap.size);
    steps.push({
      kind: 'array', line: 'push', cells, current: i, panels: [{ label: 'rooms in use (end times)', items: heap.toChips() }], note:
        `Occupy a room for [${s},${end}] (push end time ${end} onto the heap). Rooms in use right now: ${heap.size}. Max so far: ${rooms}.`,
    });
  }

  steps.push({
    kind: 'array', line: 'ret', cells, panels: [{ label: 'rooms in use (end times)', items: heap.toChips() }], note:
      `Peak simultaneous rooms in use: ${rooms}. That's the minimum number of conference rooms needed.`,
  });

  return { lines, steps, colLabels: starts.map((s) => `start ${s}`) };
}

// ---- Interval List Intersections ------------------------------------------

export function intervalIntersectionTrace(A: [number, number][], B: [number, number][]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function intervalIntersection(A, B) {' },
    { k: 'loop', t: '  while (i < A.length && j < B.length) {' },
    { k: 'bounds', t: '    const lo = Math.max(A[i][0], B[j][0]), hi = Math.min(A[i][1], B[j][1]);' },
    { k: 'valid', t: '    if (lo <= hi) res.push([lo, hi]);' },
    { k: 'advance', t: '    if (A[i][1] < B[j][1]) i++; else j++;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return res;' },
    { k: 'end', t: '}' },
  ];

  // Combined timeline: A's starts followed by B's starts. `current` points
  // into the A segment, `source` into the B segment — the two pointers of
  // the sweep, laid out side by side since cells can't hold two arrays.
  const cells = [...A.map((iv) => iv[0]), ...B.map((iv) => iv[0])];
  const steps: Trace['steps'] = [];

  steps.push({
    kind: 'array', line: 'init', cells, note:
      `A = [${A.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}], B = [${B.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}]. Both lists are already sorted and mutually exclusive within themselves — classic two-pointer sweep setup.`,
  });

  const res: [number, number][] = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length) {
    const lo = Math.max(A[i][0], B[j][0]);
    const hi = Math.min(A[i][1], B[j][1]);
    const current = i;
    const source = A.length + j;
    if (lo <= hi) {
      res.push([lo, hi]);
      steps.push({
        kind: 'array', line: 'valid', cells, current, source, note:
          `A[${i}]=[${A[i][0]},${A[i][1]}] ∩ B[${j}]=[${B[j][0]},${B[j][1]}] → overlap = [max(${A[i][0]},${B[j][0]}), min(${A[i][1]},${B[j][1]})] = [${lo},${hi}]. Record it.`,
      });
    } else {
      steps.push({
        kind: 'array', line: 'valid', cells, current, source, note:
          `A[${i}]=[${A[i][0]},${A[i][1]}] and B[${j}]=[${B[j][0]},${B[j][1]}] don't overlap (lo=${lo} > hi=${hi}) → nothing to record.`,
      });
    }
    if (A[i][1] < B[j][1]) {
      steps.push({
        kind: 'array', line: 'advance', cells, current, source, note:
          `A[${i}] ends at ${A[i][1]}, which is earlier than B[${j}]'s end (${B[j][1]}) → A[${i}] is exhausted, advance i to ${i + 1}.`,
      });
      i++;
    } else {
      steps.push({
        kind: 'array', line: 'advance', cells, current, source, note:
          `B[${j}] ends at ${B[j][1]}, which is ≤ A[${i}]'s end (${A[i][1]}) → B[${j}] is exhausted, advance j to ${j + 1}.`,
      });
      j++;
    }
  }

  steps.push({
    kind: 'array', line: 'ret', cells, note:
      `Intersections found: [${res.map((iv) => `[${iv[0]},${iv[1]}]`).join(', ')}].`,
  });

  return { lines, steps, colLabels: [...A.map((iv) => `A:[${iv[0]},${iv[1]}]`), ...B.map((iv) => `B:[${iv[0]},${iv[1]}]`)] };
}
