import type { Trace, CodeLine } from '../types';

/**
 * Binary Search trace builders — run the real algorithm, record a step at
 * every meaningful comparison/bounds update. See ../../README.md for the
 * authoring checklist.
 */

// ---- Classic binary search ------------------------------------------------

export function classicBinarySearchTrace(nums: number[], target: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function search(nums, target) {' },
    { k: 'bounds', t: '  let lo = 0, hi = nums.length - 1;' },
    { k: 'loop', t: '  while (lo <= hi) {' },
    { k: 'mid', t: '    const mid = lo + Math.floor((hi - lo) / 2);' },
    { k: 'found', t: '    if (nums[mid] === target) return mid;' },
    { k: 'goright', t: '    else if (nums[mid] < target) lo = mid + 1;' },
    { k: 'goleft', t: '    else hi = mid - 1;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return -1;' },
    { k: 'end', t: '}' },
  ];
  const cells = nums.slice();
  const steps: Trace['steps'] = [];
  let lo = 0, hi = nums.length - 1;
  steps.push({ kind: 'array', line: 'bounds', cells, left: lo, right: hi, note: `Search space starts as the whole array: lo = 0, hi = ${hi}. Target is ${target}.` });
  let found = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ kind: 'array', line: 'mid', cells, current: mid, left: lo, right: hi, note: `lo = ${lo}, hi = ${hi} → mid = ${mid} (nums[${mid}] = ${nums[mid]}).` });
    if (nums[mid] === target) {
      found = mid;
      steps.push({ kind: 'array', line: 'found', cells, current: mid, left: lo, right: hi, note: `nums[${mid}] = ${nums[mid]} === target ${target} → found it at index ${mid}.` });
      break;
    } else if (nums[mid] < target) {
      steps.push({ kind: 'array', line: 'goright', cells, current: mid, left: lo, right: hi, note: `nums[${mid}] = ${nums[mid]} < target ${target} → the answer (if any) is to the right. lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    } else {
      steps.push({ kind: 'array', line: 'goleft', cells, current: mid, left: lo, right: hi, note: `nums[${mid}] = ${nums[mid]} > target ${target} → the answer (if any) is to the left. hi = mid - 1 = ${mid - 1}.` });
      hi = mid - 1;
    }
  }
  if (found === -1) {
    steps.push({ kind: 'array', line: 'ret', cells, left: lo, right: hi, note: `lo (${lo}) > hi (${hi}) → search space is empty. Target ${target} is not in the array → return -1.` });
  }
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}

// ---- Search in Rotated Sorted Array ---------------------------------------

export function rotatedSearchTrace(nums: number[], target: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function search(nums, target) {' },
    { k: 'bounds', t: '  let lo = 0, hi = nums.length - 1;' },
    { k: 'loop', t: '  while (lo <= hi) {' },
    { k: 'mid', t: '    const mid = lo + Math.floor((hi - lo) / 2);' },
    { k: 'found', t: '    if (nums[mid] === target) return mid;' },
    { k: 'whichhalf', t: '    if (nums[lo] <= nums[mid]) {         // left half sorted' },
    { k: 'leftcheck', t: '      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;' },
    { k: 'leftelse', t: '      else lo = mid + 1;' },
    { k: 'rightcase', t: '    } else {                              // right half sorted' },
    { k: 'rightcheck', t: '      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;' },
    { k: 'rightelse', t: '      else hi = mid - 1;' },
    { k: 'endif', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return -1;' },
    { k: 'end', t: '}' },
  ];
  const cells = nums.slice();
  const steps: Trace['steps'] = [];
  let lo = 0, hi = nums.length - 1;
  steps.push({ kind: 'array', line: 'bounds', cells, left: lo, right: hi, note: `The array is rotated, but one of [lo, hi] is always plainly sorted. lo = 0, hi = ${hi}. Target is ${target}.` });
  let found = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ kind: 'array', line: 'mid', cells, current: mid, left: lo, right: hi, note: `lo = ${lo}, hi = ${hi} → mid = ${mid} (nums[${mid}] = ${nums[mid]}).` });
    if (nums[mid] === target) {
      found = mid;
      steps.push({ kind: 'array', line: 'found', cells, current: mid, left: lo, right: hi, note: `nums[${mid}] = ${nums[mid]} === target ${target} → found it at index ${mid}.` });
      break;
    }
    if (nums[lo] <= nums[mid]) {
      steps.push({ kind: 'array', line: 'whichhalf', cells, current: mid, left: lo, right: hi, note: `nums[lo]=${nums[lo]} ≤ nums[mid]=${nums[mid]} → the LEFT half [${lo}, ${mid}] is the plainly sorted one.` });
      if (nums[lo] <= target && target < nums[mid]) {
        steps.push({ kind: 'array', line: 'leftcheck', cells, current: mid, left: lo, right: hi, note: `target ${target} falls inside the sorted left half [${nums[lo]}, ${nums[mid]}) → search there. hi = mid - 1 = ${mid - 1}.` });
        hi = mid - 1;
      } else {
        steps.push({ kind: 'array', line: 'leftelse', cells, current: mid, left: lo, right: hi, note: `target ${target} is outside the sorted left half → it must be in the (unsorted-looking but still valid) right side. lo = mid + 1 = ${mid + 1}.` });
        lo = mid + 1;
      }
    } else {
      steps.push({ kind: 'array', line: 'rightcase', cells, current: mid, left: lo, right: hi, note: `nums[lo]=${nums[lo]} > nums[mid]=${nums[mid]} → the RIGHT half [${mid}, ${hi}] is the plainly sorted one.` });
      if (nums[mid] < target && target <= nums[hi]) {
        steps.push({ kind: 'array', line: 'rightcheck', cells, current: mid, left: lo, right: hi, note: `target ${target} falls inside the sorted right half (${nums[mid]}, ${nums[hi]}] → search there. lo = mid + 1 = ${mid + 1}.` });
        lo = mid + 1;
      } else {
        steps.push({ kind: 'array', line: 'rightelse', cells, current: mid, left: lo, right: hi, note: `target ${target} is outside the sorted right half → it must be on the left side. hi = mid - 1 = ${mid - 1}.` });
        hi = mid - 1;
      }
    }
  }
  if (found === -1) {
    steps.push({ kind: 'array', line: 'ret', cells, left: lo, right: hi, note: `lo (${lo}) > hi (${hi}) → search space is empty. Target ${target} is not in the array → return -1.` });
  }
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}

// ---- Find First and Last Position of Element in Sorted Array --------------

export function firstLastPositionTrace(nums: number[], target: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function searchRange(nums, target) {' },
    { k: 'lb', t: '  const first = lowerBound(nums, target);  // bias hi down on a match' },
    { k: 'ub', t: '  const last = upperBound(nums, target);   // bias lo up on a match' },
    { k: 'mid', t: '  // mid = lo + Math.floor((hi - lo) / 2)' },
    { k: 'match', t: '  // nums[mid] === target: record it, keep narrowing toward the boundary' },
    { k: 'lt', t: '  // nums[mid] < target: lo = mid + 1' },
    { k: 'gt', t: '  // nums[mid] > target: hi = mid - 1' },
    { k: 'ret', t: '  return [first, last];' },
    { k: 'end', t: '}' },
  ];
  const cells = nums.slice();
  const steps: Trace['steps'] = [];

  // ---- lower bound: find the first index equal to target ----
  let lo = 0, hi = nums.length - 1, first = -1;
  steps.push({ kind: 'array', line: 'lb', cells, left: lo, right: hi, note: `FIRST search (lower bound): find the leftmost index equal to target ${target}. lo = 0, hi = ${hi}.` });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ kind: 'array', line: 'mid', cells, current: mid, left: lo, right: hi, note: `[first search] lo = ${lo}, hi = ${hi} → mid = ${mid} (nums[${mid}] = ${nums[mid]}).` });
    if (nums[mid] === target) {
      first = mid;
      steps.push({ kind: 'array', line: 'match', cells, current: mid, left: lo, right: hi, note: `[first search] nums[${mid}] = ${target} — a match, but keep looking LEFT for an earlier one. Record ${mid}, hi = mid - 1 = ${mid - 1}.` });
      hi = mid - 1;
    } else if (nums[mid] < target) {
      steps.push({ kind: 'array', line: 'lt', cells, current: mid, left: lo, right: hi, note: `[first search] nums[${mid}] = ${nums[mid]} < target ${target} → lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    } else {
      steps.push({ kind: 'array', line: 'gt', cells, current: mid, left: lo, right: hi, note: `[first search] nums[${mid}] = ${nums[mid]} > target ${target} → hi = mid - 1 = ${mid - 1}.` });
      hi = mid - 1;
    }
  }

  // ---- upper bound: find the last index equal to target ----
  lo = 0; hi = nums.length - 1;
  let last = -1;
  steps.push({ kind: 'array', line: 'ub', cells, left: lo, right: hi, note: `LAST search (upper bound): find the rightmost index equal to target ${target}. lo = 0, hi = ${hi}.` });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    steps.push({ kind: 'array', line: 'mid', cells, current: mid, left: lo, right: hi, note: `[last search] lo = ${lo}, hi = ${hi} → mid = ${mid} (nums[${mid}] = ${nums[mid]}).` });
    if (nums[mid] === target) {
      last = mid;
      steps.push({ kind: 'array', line: 'match', cells, current: mid, left: lo, right: hi, note: `[last search] nums[${mid}] = ${target} — a match, but keep looking RIGHT for a later one. Record ${mid}, lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    } else if (nums[mid] < target) {
      steps.push({ kind: 'array', line: 'lt', cells, current: mid, left: lo, right: hi, note: `[last search] nums[${mid}] = ${nums[mid]} < target ${target} → lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    } else {
      steps.push({ kind: 'array', line: 'gt', cells, current: mid, left: lo, right: hi, note: `[last search] nums[${mid}] = ${nums[mid]} > target ${target} → hi = mid - 1 = ${mid - 1}.` });
      hi = mid - 1;
    }
  }

  steps.push({ kind: 'array', line: 'ret', cells, left: first === -1 ? undefined : first, right: last === -1 ? undefined : last, note: first === -1 ? `Target ${target} not found → return [-1, -1].` : `First occurrence at index ${first}, last occurrence at index ${last} → return [${first}, ${last}].` });
  return { lines, steps, colLabels: nums.map((_, i) => i) };
}

// ---- Koko Eating Bananas (binary search on the answer) --------------------

export function kokoEatingBananasTrace(piles: number[], h: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function minEatingSpeed(piles, h) {' },
    { k: 'bounds', t: '  let lo = 1, hi = Math.max(...piles);' },
    { k: 'loop', t: '  while (lo < hi) {' },
    { k: 'mid', t: '    const mid = lo + Math.floor((hi - lo) / 2);' },
    { k: 'hours', t: '    const hours = piles.reduce((s, p) => s + Math.ceil(p / mid), 0);' },
    { k: 'feasible', t: '    if (hours <= h) hi = mid;         // mid works — maybe slower also works' },
    { k: 'infeasible', t: '    else lo = mid + 1;               // mid too slow — need faster' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return lo;' },
    { k: 'end', t: '}' },
  ];
  const maxPile = Math.max(...piles);
  // cells represent candidate SPEEDS 1..maxPile, not the piles themselves.
  const cells: number[] = Array.from({ length: maxPile }, (_, i) => i + 1);
  const steps: Trace['steps'] = [];
  const hoursNeeded = (speed: number) => piles.reduce((s, p) => s + Math.ceil(p / speed), 0);

  let lo = 1, hi = maxPile;
  steps.push({ kind: 'array', line: 'bounds', cells, left: lo - 1, right: hi - 1, note: `Binary search on the ANSWER, not on piles: candidate eating speeds range from 1 to max(piles) = ${maxPile}. Cells here are speeds 1..${maxPile}, not the pile contents.` });
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const hrs = hoursNeeded(mid);
    steps.push({ kind: 'array', line: 'mid', cells, current: mid - 1, left: lo - 1, right: hi - 1, note: `lo = ${lo}, hi = ${hi} → candidate speed mid = ${mid}.` });
    steps.push({ kind: 'array', line: 'hours', cells, current: mid - 1, left: lo - 1, right: hi - 1, note: `Feasibility check at speed ${mid}: eating piles [${piles.join(',')}] takes ${hrs} hours (limit h = ${h}).` });
    if (hrs <= h) {
      steps.push({ kind: 'array', line: 'feasible', cells, current: mid - 1, left: lo - 1, right: hi - 1, note: `${hrs} ≤ ${h} → speed ${mid} is feasible. Since any speed > ${mid} is also feasible (monotonic), narrow the answer down: hi = mid = ${mid}.` });
      hi = mid;
    } else {
      steps.push({ kind: 'array', line: 'infeasible', cells, current: mid - 1, left: lo - 1, right: hi - 1, note: `${hrs} > ${h} → speed ${mid} is too slow. Need a faster speed: lo = mid + 1 = ${mid + 1}.` });
      lo = mid + 1;
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells, current: lo - 1, left: lo - 1, right: lo - 1, note: `lo === hi === ${lo} → minimum feasible eating speed is ${lo} bananas/hour.` });
  return { lines, steps, colLabels: cells.map((v) => v) };
}

// ---- Median of Two Sorted Arrays (partition binary search) ----------------

export function medianTwoSortedArraysTrace(nums1: number[], nums2: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function findMedianSortedArrays(nums1, nums2) {' },
    { k: 'swap', t: '  // ensure nums1 is the smaller array; binary search its partition' },
    { k: 'bounds', t: '  let lo = 0, hi = m;   // m = nums1.length' },
    { k: 'loop', t: '  while (lo <= hi) {' },
    { k: 'parts', t: '    const i = lo + Math.floor((hi - lo) / 2);   // cut in nums1' },
    { k: 'j', t: '    const j = Math.floor((m + n + 1) / 2) - i;    // matching cut in nums2' },
    { k: 'edges', t: '    // left1/right1 = nums1[i-1]/nums1[i], left2/right2 = nums2[j-1]/nums2[j]' },
    { k: 'valid', t: '    if (left1 <= right2 && left2 <= right1) return median;' },
    { k: 'toobig', t: '    else if (left1 > right2) hi = i - 1;   // i too far right' },
    { k: 'toosmall', t: '    else lo = i + 1;                      // i too far left' },
    { k: 'endloop', t: '  }' },
    { k: 'end', t: '}' },
  ];

  // Ensure nums1 is the smaller array (so the partition binary search stays bounded).
  let a = nums1, b = nums2;
  if (a.length > b.length) { a = nums2; b = nums1; }
  const m = a.length, n = b.length;
  const cells = a.concat(b);
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'swap', cells, left: 0, right: m - 1, note: `Binary search the partition point in the SMALLER array (${m} elements, cells [0..${m - 1}] here); the second array (cells [${m}..${m + n - 1}]) supplies the matching partition j, never searched directly.` });

  let lo = 0, hi = m;
  let resultNote = '';
  steps.push({ kind: 'array', line: 'bounds', cells, left: 0, right: m - 1, note: `lo = 0, hi = ${m}. i is how many elements of the smaller array go in the "left" half.` });

  while (lo <= hi) {
    const i = lo + Math.floor((hi - lo) / 2);
    const j = Math.floor((m + n + 1) / 2) - i;
    steps.push({ kind: 'array', line: 'parts', cells, left: 0, right: i > 0 ? i - 1 : undefined, note: `lo = ${lo}, hi = ${hi} → try cutting the smaller array after i = ${i} elements (left part has cells [0..${i - 1}]).` });
    steps.push({ kind: 'array', line: 'j', cells, current: m + Math.max(j - 1, 0), left: 0, right: i > 0 ? i - 1 : undefined, note: `Matching cut in the other array: j = floor((${m}+${n}+1)/2) - ${i} = ${j} (so together left has exactly half — or one more, for odd total — of all ${m + n} elements).` });

    const left1 = i === 0 ? -Infinity : a[i - 1];
    const right1 = i === m ? Infinity : a[i];
    const left2 = j === 0 ? -Infinity : b[j - 1];
    const right2 = j === n ? Infinity : b[j];

    steps.push({ kind: 'array', line: 'edges', cells, current: i === m ? undefined : i, source: j === n ? undefined : m + j, note: `Partition means max(left) ≤ min(right) across BOTH arrays combined: left1=${fmt(left1)}, right1=${fmt(right1)}, left2=${fmt(left2)}, right2=${fmt(right2)}.` });

    if (left1 <= right2 && left2 <= right1) {
      const total = m + n;
      const median = total % 2 === 0
        ? (Math.max(left1, left2) + Math.min(right1, right2)) / 2
        : Math.max(left1, left2);
      resultNote = `Valid partition found: max(left1, left2) = ${fmt(Math.max(left1, left2))} ≤ min(right1, right2) = ${fmt(Math.min(right1, right2))}. Combined length ${total} is ${total % 2 === 0 ? 'even' : 'odd'} → median = ${median}.`;
      steps.push({ kind: 'array', line: 'valid', cells, left: 0, right: i > 0 ? i - 1 : undefined, note: resultNote });
      break;
    } else if (left1 > right2) {
      steps.push({ kind: 'array', line: 'toobig', cells, left: 0, right: i > 0 ? i - 1 : undefined, note: `left1 = ${fmt(left1)} > right2 = ${fmt(right2)} → i = ${i} is too far right (too many small elements pulled from the smaller array). hi = i - 1 = ${i - 1}.` });
      hi = i - 1;
    } else {
      steps.push({ kind: 'array', line: 'toosmall', cells, left: 0, right: i > 0 ? i - 1 : undefined, note: `left2 = ${fmt(left2)} > right1 = ${fmt(right1)} → i = ${i} is too far left. lo = i + 1 = ${i + 1}.` });
      lo = i + 1;
    }
  }

  return { lines, steps, colLabels: cells.map((v, idx) => (idx < m ? `A${idx}` : `B${idx - m}`)) };
}

function fmt(v: number): string {
  return v === Infinity ? '+∞' : v === -Infinity ? '-∞' : String(v);
}
