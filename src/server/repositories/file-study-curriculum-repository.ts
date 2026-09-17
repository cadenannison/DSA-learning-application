import { readFile } from "node:fs/promises"
import type { StudyCurriculumSeed } from "@/server/interfaces/study-plan-store"

interface CurriculumJson {
  globalCoachingNotes: string[]
  referenceLinks: { label: string; url: string }[]
  tracks: StudyCurriculumSeed["tracks"]
  patterns: StudyCurriculumSeed["patterns"]
}

/** Reads the seed curriculum from a single JSON file rather than hardcoding it into a
 * template — patterns/problems/priorities can be added or reordered by editing this file
 * (e.g. once Google sends an official post-OA topic list), with no code changes. Mutable
 * per-pattern progress (stage/confidence/notes) never lives here — only initial seed shape. */
export class FileStudyCurriculumRepository {
  private cache: StudyCurriculumSeed | null = null

  constructor(private readonly curriculumPath: string) {}

  async load(): Promise<StudyCurriculumSeed> {
    if (this.cache) return this.cache

    const raw = await readFile(this.curriculumPath, "utf-8")
    const parsed = JSON.parse(raw) as CurriculumJson

    this.cache = {
      tracks: parsed.tracks,
      patterns: parsed.patterns,
      globalCoachingNotes: parsed.globalCoachingNotes,
      referenceLinks: parsed.referenceLinks,
    }

    return this.cache
  }
}
