import type { Trace, CodeLine, NodePanel } from '../types';

/**
 * Two Pointers trace builders — run the real algorithm, record a step at
 * every meaningful pointer move/comparison. See ../../README.md for the
 * authoring checklist.
 */

// ---- Two Sum II — Input Array Is Sorted (simple, opposite-end pointers) --

export function twoSumSortedTrace(numbers: number[], target: number): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function twoSum(numbers, target) {' },
    { k: 'setup', t: '  let left = 0, right = numbers.length - 1;' },
    { k: 'loop', t: '  while (left < right) {' },
    { k: 'sum', t: '    const sum = numbers[left] + numbers[right];' },
    { k: 'found', t: '    if (sum === target) return [left + 1, right + 1];' },
    { k: 'toosmall', t: '    else if (sum < target) left++;' },
    { k: 'toobig', t: '    else right--;' },
    { k: 'endloop', t: '  }' },
    { k: 'end', t: '}' },
  ];
  const cells = numbers.slice();
  const steps: Trace['steps'] = [];
  let left = 0, right = numbers.length - 1;
  steps.push({ kind: 'array', line: 'setup', cells, left, right, note: `Array is sorted, so start pointers at opposite ends: left=0 (value ${numbers[left]}), right=${right} (value ${numbers[right]}).` });
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    steps.push({ kind: 'array', line: 'sum', cells, left, right, note: `sum = numbers[${left}] + numbers[${right}] = ${numbers[left]} + ${numbers[right]} = ${sum}. Target is ${target}.` });
    if (sum === target) {
      steps.push({ kind: 'array', line: 'found', cells, left, right, note: `${sum} === ${target} → found the pair. 1-indexed answer: [${left + 1}, ${right + 1}].` });
      return { lines, steps, colLabels: numbers.map((_, i) => i) };
    } else if (sum < target) {
      left++;
      steps.push({ kind: 'array', line: 'toosmall', cells, left, right, note: `${sum} < ${target} → sum is too small. Only moving left can increase it (array is sorted) → left advances to ${left}.` });
    } else {
      right--;
      steps.push({ kind: 'array', line: 'toobig', cells, left, right, note: `${sum} > ${target} → sum is too big. Only moving right can decrease it (array is sorted) → right retreats to ${right}.` });
    }
  }
  steps.push({ kind: 'array', line: 'endloop', cells, left, right, note: 'Pointers crossed with no match found.' });
  return { lines, steps, colLabels: numbers.map((_, i) => i) };
}

// ---- Valid Palindrome (easy, close-inward with a filtering preprocess) --

export function validPalindromeTrace(s: string): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function isPalindrome(s) {' },
    { k: 'filter', t: '  const f = s.toLowerCase().replace(/[^a-z0-9]/g, "");' },
    { k: 'setup', t: '  let left = 0, right = f.length - 1;' },
    { k: 'loop', t: '  while (left < right) {' },
    { k: 'cmp', t: '    if (f[left] !== f[right]) return false;' },
    { k: 'advance', t: '    left++; right--;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return true;' },
    { k: 'end', t: '}' },
  ];
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cells = filtered.split('').map((c) => c.charCodeAt(0));
  const steps: Trace['steps'] = [];
  steps.push({ kind: 'array', line: 'filter', cells, note: `Preprocess once: lowercase "${s}" and strip everything that isn't a letter or digit → "${filtered}". Two pointers only ever run on this cleaned string.` });
  let left = 0, right = filtered.length - 1;
  steps.push({ kind: 'array', line: 'setup', cells, left, right, note: `Start left=0 ('${filtered[left]}') and right=${right} ('${filtered[right]}') and close inward.` });
  while (left < right) {
    const a = filtered[left], b = filtered[right];
    if (a !== b) {
      steps.push({ kind: 'array', line: 'cmp', cells, left, right, note: `'${a}' ≠ '${b}' at positions ${left} and ${right} → mismatch, return false.` });
      return { lines, steps, colLabels: filtered.split('') };
    }
    steps.push({ kind: 'array', line: 'cmp', cells, left, right, note: `'${a}' === '${b}' → this pair matches, keep closing in.` });
    left++; right--;
    steps.push({ kind: 'array', line: 'advance', cells, left: left <= right ? left : undefined, right: left <= right ? right : undefined, note: left <= right ? `Advance left to ${left}, right to ${right}.` : `Pointers meet/cross (left=${left}, right=${right}) — every pair matched.` });
  }
  steps.push({ kind: 'array', line: 'ret', cells, note: `left and right met/crossed with every pair matching → "${s}" is a palindrome once non-alphanumeric characters and case are ignored.` });
  return { lines, steps, colLabels: filtered.split('') };
}

// ---- 3Sum (medium, fix one + inner opposite-end two-pointer, skip dupes) --

export function threeSumTrace(nums: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function threeSum(nums) {' },
    { k: 'sort', t: '  nums = [...nums].sort((a, b) => a - b);' },
    { k: 'loopI', t: '  for (let i = 0; i < nums.length - 2; i++) {' },
    { k: 'skipI', t: '    if (i > 0 && nums[i] === nums[i - 1]) continue;' },
    { k: 'setup', t: '    let left = i + 1, right = nums.length - 1;' },
    { k: 'loop', t: '    while (left < right) {' },
    { k: 'sum', t: '      const sum = nums[i] + nums[left] + nums[right];' },
    { k: 'found', t: '      if (sum === 0) { result.push([nums[i], nums[left], nums[right]]);' },
    { k: 'skipdupe', t: '        while (nums[left] === nums[left+1]) left++;\n        while (nums[right] === nums[right-1]) right--;\n        left++; right--; }' },
    { k: 'toosmall', t: '      else if (sum < 0) left++;' },
    { k: 'toobig', t: '      else right--;' },
    { k: 'endloop', t: '    }' },
    { k: 'endloopI', t: '  }' },
    { k: 'end', t: '}' },
  ];
  const a = [...nums].sort((x, y) => x - y);
  const cells = a.slice();
  const steps: Trace['steps'] = [];
  const result: number[][] = [];
  steps.push({ kind: 'array', line: 'sort', cells, note: `Sort first: [${nums.join(', ')}] → [${a.join(', ')}]. Sortedness is what makes the inner two-pointer scan valid.` });
  for (let i = 0; i < a.length - 2; i++) {
    if (i > 0 && a[i] === a[i - 1]) {
      steps.push({ kind: 'array', line: 'skipI', cells, current: i, note: `nums[${i}]=${a[i]} equals the previous fixed value nums[${i - 1}]=${a[i - 1]} → skip it, or we'd re-emit the same triplets.` });
      continue;
    }
    let left = i + 1, right = a.length - 1;
    steps.push({ kind: 'array', line: 'setup', cells, current: i, left, right, note: `Fix i=${i} (nums[${i}]=${a[i]}). Inner scan: left=${left}, right=${right}, opposite-end two pointers on the remainder.` });
    while (left < right) {
      const sum = a[i] + a[left] + a[right];
      steps.push({ kind: 'array', line: 'sum', cells, current: i, left, right, note: `sum = ${a[i]} + ${a[left]} + ${a[right]} = ${sum}.` });
      if (sum === 0) {
        result.push([a[i], a[left], a[right]]);
        steps.push({ kind: 'array', line: 'found', cells, current: i, left, right, note: `sum === 0 → triplet [${a[i]}, ${a[left]}, ${a[right]}] found.` });
        const oldLeft = left, oldRight = right;
        while (left < right && a[left] === a[left + 1]) left++;
        while (left < right && a[right] === a[right - 1]) right--;
        left++; right--;
        steps.push({ kind: 'array', line: 'skipdupe', cells, current: i, left: left <= right ? left : undefined, right: left <= right ? right : undefined, note: `Skip duplicate values so the same triplet isn't emitted twice (left ${oldLeft}→${left}, right ${oldRight}→${right}).` });
      } else if (sum < 0) {
        left++;
        steps.push({ kind: 'array', line: 'toosmall', cells, current: i, left, right, note: `${sum} < 0 → sum too small, advance left to ${left}.` });
      } else {
        right--;
        steps.push({ kind: 'array', line: 'toobig', cells, current: i, left, right, note: `${sum} > 0 → sum too big, retreat right to ${right}.` });
      }
    }
  }
  steps.push({ kind: 'array', line: 'endloopI', cells, note: `Every fixed index tried → triplets found: ${JSON.stringify(result)}.` });
  return { lines, steps, colLabels: a.map((_, i) => i) };
}

// ---- Container With Most Water (medium/hard, greedy move-the-shorter-side) --

export function containerWithMostWaterTrace(height: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function maxArea(height) {' },
    { k: 'setup', t: '  let left = 0, right = height.length - 1, best = 0;' },
    { k: 'loop', t: '  while (left < right) {' },
    { k: 'area', t: '    const area = Math.min(height[left], height[right]) * (right - left);' },
    { k: 'update', t: '    best = Math.max(best, area);' },
    { k: 'move', t: '    if (height[left] < height[right]) left++; else right--;' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return best;' },
    { k: 'end', t: '}' },
  ];
  const cells = height.slice();
  const steps: Trace['steps'] = [];
  const bestPanel = (best: number): NodePanel[] => [{ label: 'best so far', items: [{ text: `${best}`, hot: true }] }];
  let left = 0, right = height.length - 1, best = 0;
  steps.push({ kind: 'array', line: 'setup', cells, left, right, panels: bestPanel(best), note: `Start pointers at the two ends: left=0 (height ${height[left]}), right=${right} (height ${height[right]}). Width starts as wide as possible.` });
  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    const before = best;
    best = Math.max(best, area);
    steps.push({ kind: 'array', line: 'area', cells, left, right, panels: bestPanel(best), note: `area = min(${height[left]}, ${height[right]}) × (${right} − ${left}) = ${Math.min(height[left], height[right])} × ${right - left} = ${area}.${best !== before ? ` New best = ${best}.` : ` Best stays ${best}.`}` });
    if (height[left] < height[right]) {
      const shorter = left;
      left++;
      steps.push({ kind: 'array', line: 'move', cells, left, right, panels: bestPanel(best), note: `height[${shorter}]=${height[shorter]} is the shorter side. Moving the taller side could only ever shrink the water level, never help — so advance left to ${left}.` });
    } else {
      const shorter = right;
      right--;
      steps.push({ kind: 'array', line: 'move', cells, left, right, panels: bestPanel(best), note: `height[${shorter}]=${height[shorter]} is the shorter (or equal) side → retreat right to ${right}, for the same reason.` });
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells, panels: bestPanel(best), note: `Pointers met → maximum water area is ${best}.` });
  return { lines, steps, colLabels: height.map((_, i) => i) };
}

// ---- Trapping Rain Water (hard, O(1)-space two-pointer with running maxes) --

export function trappingRainWaterTrace(height: number[]): Trace {
  const lines: CodeLine[] = [
    { k: 'init', t: 'function trap(height) {' },
    { k: 'setup', t: '  let left = 0, right = height.length - 1;\n  let maxLeft = 0, maxRight = 0, total = 0;' },
    { k: 'loop', t: '  while (left < right) {' },
    { k: 'cmp', t: '    if (height[left] < height[right]) {' },
    { k: 'updateleftmax', t: '      if (height[left] >= maxLeft) maxLeft = height[left];' },
    { k: 'addleft', t: '      else total += maxLeft - height[left];\n      left++;' },
    { k: 'else', t: '    } else {' },
    { k: 'updaterightmax', t: '      if (height[right] >= maxRight) maxRight = height[right];' },
    { k: 'addright', t: '      else total += maxRight - height[right];\n      right--;' },
    { k: 'endif', t: '    }' },
    { k: 'endloop', t: '  }' },
    { k: 'ret', t: '  return total;' },
    { k: 'end', t: '}' },
  ];
  const cells = height.slice();
  const steps: Trace['steps'] = [];
  const maxPanels = (maxLeft: number, maxRight: number): NodePanel[] => [
    { label: 'maxLeft', items: [{ text: `${maxLeft}`, hot: true }] },
    { label: 'maxRight', items: [{ text: `${maxRight}`, hot: true }] },
  ];
  let left = 0, right = height.length - 1, maxLeft = 0, maxRight = 0, total = 0;
  steps.push({ kind: 'array', line: 'setup', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `O(1)-space two-pointer version: track the running max height seen from each side instead of precomputing two full arrays. left=0, right=${right}, maxLeft=0, maxRight=0, total trapped=0.` });
  while (left < right) {
    if (height[left] < height[right]) {
      steps.push({ kind: 'array', line: 'cmp', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${left}]=${height[left]} < height[${right}]=${height[right]} → the left side has the smaller bound, so process it (its trapped water only ever depends on maxLeft).` });
      if (height[left] >= maxLeft) {
        maxLeft = height[left];
        steps.push({ kind: 'array', line: 'updateleftmax', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${left}]=${height[left]} ≥ maxLeft → no water traps here, this becomes the new maxLeft = ${maxLeft}.` });
      } else {
        const water = maxLeft - height[left];
        total += water;
        steps.push({ kind: 'array', line: 'addleft', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${left}]=${height[left]} < maxLeft=${maxLeft} → water traps above this bar: ${maxLeft} − ${height[left]} = ${water}. total = ${total}.` });
      }
      left++;
      steps.push({ kind: 'array', line: 'addleft', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `left advances to ${left}.` });
    } else {
      steps.push({ kind: 'array', line: 'cmp', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${left}]=${height[left]} ≥ height[${right}]=${height[right]} → the right side has the smaller (or equal) bound, so process it instead (depends only on maxRight).` });
      if (height[right] >= maxRight) {
        maxRight = height[right];
        steps.push({ kind: 'array', line: 'updaterightmax', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${right}]=${height[right]} ≥ maxRight → no water traps here, this becomes the new maxRight = ${maxRight}.` });
      } else {
        const water = maxRight - height[right];
        total += water;
        steps.push({ kind: 'array', line: 'addright', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `height[${right}]=${height[right]} < maxRight=${maxRight} → water traps above this bar: ${maxRight} − ${height[right]} = ${water}. total = ${total}.` });
      }
      right--;
      steps.push({ kind: 'array', line: 'addright', cells, left, right, panels: maxPanels(maxLeft, maxRight), note: `right retreats to ${right}.` });
    }
  }
  steps.push({ kind: 'array', line: 'ret', cells, panels: maxPanels(maxLeft, maxRight), note: `Pointers met → total trapped water = ${total}.` });
  return { lines, steps, colLabels: height.map((_, i) => i) };
}
