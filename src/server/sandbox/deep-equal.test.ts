import { describe, expect, it } from "vitest"
import { deepEqual } from "@/server/sandbox/deep-equal"

describe("deepEqual", () => {
  it("treats NaN as equal to NaN", () => {
    expect(deepEqual(NaN, NaN)).toBe(true)
  })

  it("treats -0 and 0 as distinct", () => {
    expect(deepEqual(-0, 0)).toBe(false)
    expect(deepEqual(0, 0)).toBe(true)
    expect(deepEqual(-0, -0)).toBe(true)
  })

  it("is independent of object key order", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  })

  it("detects differing object key sets", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it("compares arrays element-wise and by length", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it("compares nested structures", () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true)
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false)
  })

  it("distinguishes different primitive types", () => {
    expect(deepEqual(1, "1")).toBe(false)
    expect(deepEqual(null, undefined)).toBe(false)
  })
})
