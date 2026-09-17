import { useMemo, useState } from 'react';
import type { Pattern } from './types';
import { PatternStrip } from './components/PatternStrip';
import { MiniMenu, type Section } from './components/MiniMenu';
import { LevelStepper, TIERS, TIER_LABEL } from './components/LevelStepper';
import { LearnSection } from './components/LearnSection';
import { RecognizeSection } from './components/RecognizeSection';
import { PracticeSection } from './components/PracticeSection';
import { useAppTheme } from '@/lib/use-app-theme';
import './PatternLab.css';

export interface PatternLabProps {
  /** Finished patterns, in tab order. */
  patterns: Pattern[];
  /** Labels for patterns without content yet, shown as disabled tabs. */
  soonPatterns?: string[];
  /** Pattern id to open on first render. Defaults to patterns[0]. */
  initialPatternId?: string;
}

/**
 * Self-serve DSA lesson: pick a pattern, pick a section (Learn / Recognize It /
 * Practice), and a Simple→Hard depth ladder that applies across all three —
 * the reading, the recognition tells, and the practice problem all deepen together.
 *
 * All state is local to this component; it does not require a router or any
 * global store. Drop it in with content from src/content and it works.
 */
export function PatternLab({ patterns, soonPatterns = [], initialPatternId }: PatternLabProps) {
  const theme = useAppTheme();
  const [patternId, setPatternId] = useState(initialPatternId ?? patterns[0]?.id);
  const [section, setSection] = useState<Section>('learn');
  const [levelIdx, setLevelIdx] = useState(0);
  const [tierVariantIdx, setTierVariantIdx] = useState(0);

  const pattern = useMemo(
    () => patterns.find((p) => p.id === patternId) ?? patterns[0],
    [patterns, patternId],
  );

  const groupsForStepper = useMemo(
    () => (pattern ? TIERS.map((t) => pattern.variants.filter((v) => v.difficulty === t)) : []),
    [pattern],
  );

  if (!pattern) return null;

  function selectPattern(id: string) {
    if (id === pattern.id) return;
    setPatternId(id);
    setLevelIdx(0);
    setTierVariantIdx(0);
  }
  function selectSection(s: Section) {
    setSection(s);
  }
  function selectLevel(idx: number) {
    setLevelIdx(idx);
    setTierVariantIdx(0);
  }
  function jumpToPractice(idx: number, variantIdx: number) {
    setSection('practice');
    setLevelIdx(idx);
    setTierVariantIdx(variantIdx);
  }

  let caption: string;
  let subFor: (i: number) => string;
  if (section === 'practice') {
    caption = 'Depth — the practice problem gets harder at each level';
    subFor = (i) => groupsForStepper[i].map((v) => v.label).join(' · ');
  } else if (section === 'recognize') {
    caption = 'Depth — the tells get subtler at each level';
    subFor = (i) => pattern.levels[i].tag;
  } else {
    caption = 'Depth — the reading gets more advanced at each level';
    subFor = (i) => pattern.levels[i].tag;
  }

  return (
    <div
      className="pattern-lab"
      data-theme={theme}
      style={{ ['--pl-accent-light' as string]: pattern.accent, ['--pl-accent-dark' as string]: pattern.accentDark }}
    >
      <div className="pl-wrap">
        <div className="pl-masthead">
          <div className="pl-eyebrow-top">Pattern Lab · scan → recognize → trace</div>
          <h1>How the pattern actually runs</h1>
          <p>Step through real, instrumented code so you can see the mechanism behind each pattern — then use the recognition cues to spot it on a new problem.</p>
        </div>

        <PatternStrip patterns={patterns} soon={soonPatterns} activeId={pattern.id} onSelect={selectPattern} />
        <MiniMenu section={section} onSelect={selectSection} />
        <LevelStepper caption={caption} levelIdx={levelIdx} subFor={subFor} onSelect={selectLevel} />

        {section === 'learn' && (
          <LearnSection pattern={pattern} levelIdx={levelIdx} onJumpToPractice={jumpToPractice} />
        )}
        {section === 'recognize' && (
          <RecognizeSection pattern={pattern} levelIdx={levelIdx} />
        )}
        {section === 'practice' && (
          <PracticeSection
            pattern={pattern}
            levelIdx={levelIdx}
            tierVariantIdx={tierVariantIdx}
            onTierVariantChange={setTierVariantIdx}
          />
        )}
      </div>
    </div>
  );
}

export { TIER_LABEL };
export type { Pattern } from './types';
