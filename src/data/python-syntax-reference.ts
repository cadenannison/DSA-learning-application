/** Static Python syntax/stdlib cheatsheet rendered by PythonSyntaxReference. Plain constant,
 * not loaded through a repository — this never varies per problem or user, so there's nothing
 * to fetch. */
export const PYTHON_SYNTAX_REFERENCE_MARKDOWN = `
## Lists

\`\`\`python
arr = [3, 1, 2]
arr.append(4)          # add to end
arr.pop()               # remove & return last
arr.pop(0)              # remove & return at index
arr.insert(1, 99)       # insert 99 at index 1
arr.remove(2)           # remove first matching value
arr.sort()              # sort in place, ascending
arr.sort(reverse=True)  # descending
arr.sort(key=lambda x: -x)  # custom key
sorted(arr)              # new sorted list (doesn't mutate)
arr.reverse()            # reverse in place
arr[::-1]                 # reversed copy (slicing)
len(arr)
max(arr); min(arr); sum(arr)
arr.index(2)              # first index of value (raises if missing)
2 in arr                  # membership test, O(n)
arr[1:3]                  # slice [start:end)
arr[:2]; arr[2:]           # from start / to end
\`\`\`

## Slicing & list comprehensions

\`\`\`python
squares = [x * x for x in range(10)]
evens = [x for x in arr if x % 2 == 0]
pairs = [(i, x) for i, x in enumerate(arr)]
zipped = list(zip(list1, list2))
transposed = list(zip(*matrix))
\`\`\`

## Strings

\`\`\`python
s = "Hello World"
s.lower(); s.upper()
s.strip()                 # trim whitespace
s.split()                  # split on whitespace -> list
s.split(",")                # split on delimiter
",".join(["a", "b"])         # -> "a,b"
s.replace("l", "L")
s[::-1]                      # reverse a string
s.startswith("He"); s.endswith("ld")
s.find("World")               # index or -1
s.isalpha(); s.isdigit(); s.isalnum()
ord("a"); chr(97)              # char <-> code point
\`\`\`

## Dictionaries (hashmaps)

\`\`\`python
d = {}
d["a"] = 1
d.get("a")                 # None if missing (no KeyError)
d.get("a", 0)               # default if missing
d.setdefault("a", []).append(1)  # init-then-append pattern
"a" in d                     # membership test, O(1)
del d["a"]
d.pop("a", None)              # remove, with default if missing
d.keys(); d.values(); d.items()
for k, v in d.items(): ...
{k: v for k, v in d.items() if v > 0}  # dict comprehension
\`\`\`

## collections module

\`\`\`python
from collections import defaultdict, Counter, deque, OrderedDict

dd = defaultdict(int)        # missing keys default to 0
dd = defaultdict(list)       # missing keys default to []
dd["x"] += 1

c = Counter(arr)             # count occurrences
c.most_common(3)              # top 3 (value, count) pairs

q = deque([1, 2, 3])
q.append(4); q.appendleft(0)
q.pop(); q.popleft()           # O(1) both ends
\`\`\`

## Sets

\`\`\`python
s = set()
s.add(1)
s.discard(1)               # remove, no error if missing
s.remove(1)                 # remove, raises if missing
s1 & s2                      # intersection
s1 | s2                      # union
s1 - s2                      # difference
s1 ^ s2                      # symmetric difference
frozenset([1, 2, 3])          # immutable/hashable set
\`\`\`

## Heaps (priority queues)

\`\`\`python
import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 1)
smallest = heapq.heappop(heap)   # min-heap by default
heapq.heapify(existing_list)      # in place, O(n)
heapq.nlargest(3, arr); heapq.nsmallest(3, arr)

# max-heap trick: push negatives
heapq.heappush(heap, -value)
largest = -heapq.heappop(heap)
\`\`\`

## itertools

\`\`\`python
from itertools import permutations, combinations, product, accumulate

list(permutations([1, 2, 3]))       # all orderings
list(combinations([1, 2, 3], 2))     # all size-2 subsets
list(product([0, 1], repeat=3))       # cartesian product
list(accumulate([1, 2, 3]))            # running prefix sums -> [1, 3, 6]
\`\`\`

## Tuples & unpacking

\`\`\`python
a, b = 1, 2
a, b = b, a                 # swap
first, *rest = [1, 2, 3]      # -> first=1, rest=[2,3]
for i, val in enumerate(arr): ...
for x, y in zip(list1, list2): ...
\`\`\`

## Common built-ins

\`\`\`python
abs(-5); pow(2, 10); divmod(7, 2)   # -> (3, 1)
float("inf"); float("-inf")          # unbounded sentinels
map(str, arr); filter(lambda x: x > 0, arr)
any(x > 0 for x in arr); all(x > 0 for x in arr)
\`\`\`

## Math module

\`\`\`python
import math
math.floor(3.7); math.ceil(3.2)
math.sqrt(16)
math.gcd(12, 18)
math.inf; -math.inf
\`\`\`

## String/number conversions

\`\`\`python
int("42"); str(42); float("3.14")
int("101", 2)               # parse binary -> 5
bin(5); oct(8); hex(255)      # -> "0b101", "0o10", "0xff"
\`\`\`
`
