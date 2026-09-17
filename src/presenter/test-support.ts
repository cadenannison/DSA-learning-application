/** Records every value passed to a view setter, in call order, and exposes the latest one as
 * `.current`. Presenters mutate view state through method calls, not property assignment, so a
 * plain object literal can't observe updates after construction — this wraps each field in a
 * getter backed by shared state instead. */
export function recordedField<T>() {
  const calls: T[] = []
  return {
    get calls() {
      return calls
    },
    get current(): T | undefined {
      return calls[calls.length - 1]
    },
    push(value: T) {
      calls.push(value)
    },
  }
}
