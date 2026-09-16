import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import type { PatternLessonRepository } from "@/server/interfaces/pattern-lesson-repository"
import type { DsaPattern, PatternLesson, PatternLessonSummary } from "@/server/models/domain"

const ALL_PATTERNS: DsaPattern[] = [
  "arrays-two-pointers",
  "sliding-window",
  "binary-search",
  "linked-list",
  "trees",
  "bfs-dfs",
  "heaps",
  "backtracking",
  "intervals",
  "graphs",
  "dynamic-programming",
  "greedy",
  "tries",
  "stacks-queues",
]

const PATTERN_LABELS: Record<DsaPattern, string> = {
  "arrays-two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  "binary-search": "Binary Search",
  "linked-list": "Linked List",
  trees: "Trees",
  "bfs-dfs": "BFS / DFS",
  heaps: "Heaps",
  backtracking: "Backtracking",
  intervals: "Intervals",
  graphs: "Graphs",
  "dynamic-programming": "Dynamic Programming",
  greedy: "Greedy",
  tries: "Tries",
  "stacks-queues": "Stacks / Queues",
}

export class FilePatternLessonRepository implements PatternLessonRepository {
  private cache: Map<DsaPattern, PatternLesson> | null = null

  constructor(private readonly lessonsDir: string) {}

  private async loadAll(): Promise<Map<DsaPattern, PatternLesson>> {
    if (this.cache) return this.cache

    const files = await readdir(this.lessonsDir)
    const jsonFiles = files.filter((file) => file.endsWith(".json"))

    const lessons = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await readFile(path.join(this.lessonsDir, file), "utf-8")
        return JSON.parse(raw) as PatternLesson
      })
    )

    this.cache = new Map(lessons.map((lesson) => [lesson.pattern, lesson]))
    return this.cache
  }

  async getByPattern(pattern: DsaPattern): Promise<PatternLesson | null> {
    const lessons = await this.loadAll()
    return lessons.get(pattern) ?? null
  }

  async list(): Promise<PatternLessonSummary[]> {
    const lessons = await this.loadAll()

    return ALL_PATTERNS.map((pattern) => {
      const lesson = lessons.get(pattern)
      if (lesson) {
        return {
          pattern,
          title: lesson.title,
          summary: lesson.summary,
          hasInteractiveDemo: lesson.demoKind !== "none",
          relatedProblemCount: lesson.relatedProblemIds.length,
        }
      }

      return {
        pattern,
        title: PATTERN_LABELS[pattern],
        summary: "Coming soon.",
        hasInteractiveDemo: false,
        relatedProblemCount: 0,
      }
    })
  }
}
