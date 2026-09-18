import { apiClient } from "@/lib/api-client"
import { buildSubmissionStats } from "@/lib/submission-stats"
import type { ExecutionResult, PracticeMode, Problem, StrippedProblem } from "@/types"

export interface PracticeView {
  setLoading(loading: boolean): void
  setProblem(problem: Problem): void
  setError(message: string | null): void
  setRunning(running: boolean): void
  setResult(result: ExecutionResult | null): void
}

export interface BlindTestView {
  setLoading(loading: boolean): void
  setProblem(problem: StrippedProblem): void
  setError(message: string | null): void
  setRunning(running: boolean): void
  setResult(result: ExecutionResult | null): void
}

abstract class BaseAttemptPresenter<TProblem extends { id: string; functionName: string }> {
  protected problem: TProblem | null = null
  private hintsUsedCount = 0
  /** Fallback timing only — used when a caller doesn't supply a more accurate externally-
   * measured `activeMs` (e.g. from useActiveTime, which freezes while the tab is backgrounded)
   * to submit(). */
  private readonly startedAt = performance.now()

  protected abstract readonly mode: PracticeMode

  recordHintRevealed(): void {
    this.hintsUsedCount += 1
  }

  async runCode(code: string, testCaseIndices?: number[]): Promise<ExecutionResult> {
    if (!this.problem) {
      throw new Error("No problem loaded")
    }

    const result = await apiClient.execute(
      this.problem.id,
      { code, functionName: this.problem.functionName, language: "python" },
      this.mode,
      testCaseIndices
    )

    return result
  }

  /** `activeMs`, when supplied, overrides the presenter's own wall-clock timing with a more
   * accurate visibility-aware measurement taken by the calling page (see useActiveTime). */
  async submit(code: string, activeMs?: number): Promise<ExecutionResult> {
    const result = await this.runCode(code)

    if (!this.problem) {
      throw new Error("No problem loaded")
    }

    await apiClient.recordAttempt({
      problemId: this.problem.id,
      passed: result.allPassed,
      hintsUsed: this.hintsUsedCount,
      mode: this.mode,
      stats: buildSubmissionStats(code, result, activeMs ?? performance.now() - this.startedAt),
    })

    return result
  }
}

export class PracticePresenter extends BaseAttemptPresenter<Problem> {
  protected readonly mode: PracticeMode = "practice"

  constructor(private readonly view: PracticeView) {
    super()
  }

  async loadProblem(id: string): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const problem = await apiClient.getProblem(id)
      this.problem = problem
      this.view.setProblem(problem)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load problem")
    } finally {
      this.view.setLoading(false)
    }
  }

  async run(code: string, testCaseIndices?: number[]): Promise<void> {
    this.view.setRunning(true)
    try {
      const result = await this.runCode(code, testCaseIndices)
      this.view.setResult(result)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Execution failed")
    } finally {
      this.view.setRunning(false)
    }
  }

  async submitCode(code: string, activeMs?: number): Promise<void> {
    this.view.setRunning(true)
    try {
      const result = await this.submit(code, activeMs)
      this.view.setResult(result)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Execution failed")
    } finally {
      this.view.setRunning(false)
    }
  }
}

export class BlindTestPresenter extends BaseAttemptPresenter<StrippedProblem> {
  protected readonly mode: PracticeMode = "blind"

  constructor(private readonly view: BlindTestView) {
    super()
  }

  async loadProblem(id: string): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const problem = await apiClient.getBlindProblem(id)
      this.problem = problem
      this.view.setProblem(problem)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load problem")
    } finally {
      this.view.setLoading(false)
    }
  }

  async loadRandomFromSet(setId: string): Promise<void> {
    this.view.setLoading(true)
    this.view.setError(null)

    try {
      const problem = await apiClient.getRandomProblemFromSet(setId)
      this.problem = problem
      this.view.setProblem(problem)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to load problem")
    } finally {
      this.view.setLoading(false)
    }
  }

  async run(code: string): Promise<void> {
    this.view.setRunning(true)
    try {
      const result = await this.runCode(code)
      this.view.setResult(result)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Execution failed")
    } finally {
      this.view.setRunning(false)
    }
  }

  async submitCode(code: string, activeMs?: number): Promise<void> {
    this.view.setRunning(true)
    try {
      const result = await this.submit(code, activeMs)
      this.view.setResult(result)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Execution failed")
    } finally {
      this.view.setRunning(false)
    }
  }
}
