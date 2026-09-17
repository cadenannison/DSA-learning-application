"""Runs one submission against a list of test cases and prints a single JSON result line.

Invoked as a subprocess by PythonSubprocessSandbox (see python-subprocess-sandbox.ts for why
a subprocess, not an in-process eval): the parent enforces a wall-clock deadline by SIGKILLing
this process's entire process group, which is the only thing that reliably stops a submission
that spawns background threads/processes and returns control immediately (the same "never
yields back" failure mode the Node sandbox's worker-thread/vm.terminate() approach handles for
async/microtask spins) — killing just this PID would leave orphaned children running.

functionName is never interpolated into exec'd source; it's read from the JSON payload and
looked up via a dict lookup after exec, so a malicious functionName is just a failed lookup,
not a script-injection vector.
"""

import contextlib
import io
import json
import math
import sys


def deep_equal(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if isinstance(a, float) and math.isnan(a) and isinstance(b, float) and math.isnan(b):
            return True
        return a == b
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        if len(a) != len(b):
            return False
        return all(deep_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        if a.keys() != b.keys():
            return False
        return all(deep_equal(a[k], b[k]) for k in a)
    return a == b


def error_message(exc):
    return f"{type(exc).__name__}: {exc}"


def run_one(namespace, function_name, test_case, out_buffer):
    fn = namespace.get(function_name)
    try:
        actual = fn(*test_case["input"])
        passed = deep_equal(actual, test_case["expected"])
        return {
            "status": "passed" if passed else "wrong_answer",
            "input": test_case["input"],
            "expected": test_case["expected"],
            "actual": actual,
            "isHidden": test_case["isHidden"],
            "stdout": out_buffer.getvalue(),
            "errorMessage": None,
        }
    except Exception as exc:  # noqa: BLE001 - submission code, any exception is a runtime_error
        return {
            "status": "runtime_error",
            "input": test_case["input"],
            "expected": test_case.get("expected"),
            "actual": None,
            "isHidden": test_case["isHidden"],
            "stdout": out_buffer.getvalue(),
            "errorMessage": error_message(exc),
        }


def compile_error_result(test_cases, message):
    result = {
        "status": "runtime_error",
        "input": [],
        "expected": None,
        "actual": None,
        "isHidden": False,
        "stdout": "",
        "errorMessage": message,
    }
    return {
        "allPassed": False,
        "results": [result for _ in test_cases],
        "runtimeMs": 0,
    }


def main():
    payload = json.loads(sys.stdin.read())
    submission = payload["submission"]
    test_cases = payload["testCases"]
    function_name = submission["functionName"]

    namespace = {"__name__": "__submission__"}
    out_buffer = io.StringIO()

    try:
        with contextlib.redirect_stdout(out_buffer):
            exec(compile(submission["code"], "<submission>", "exec"), namespace)
    except BaseException as exc:  # noqa: BLE001 - report any compile/import-time failure
        print(json.dumps(compile_error_result(test_cases, error_message(exc))))
        return

    fn = namespace.get(function_name)
    if not callable(fn):
        message = f'"{function_name}" is not defined as a function'
        print(json.dumps(compile_error_result(test_cases, message)))
        return

    results = []
    for test_case in test_cases:
        out_buffer.seek(0)
        out_buffer.truncate(0)
        with contextlib.redirect_stdout(out_buffer):
            results.append(run_one(namespace, function_name, test_case, out_buffer))

    print(
        json.dumps(
            {
                "allPassed": all(r["status"] == "passed" for r in results),
                "results": results,
                "runtimeMs": 0,
            }
        )
    )


if __name__ == "__main__":
    main()
