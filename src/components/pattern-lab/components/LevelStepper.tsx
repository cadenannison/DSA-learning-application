import type { Difficulty } from '../types';

const TIERS: Difficulty[] = ['simple', 'easy', 'medium', 'hard'];
const TIER_LABEL: Record<Difficulty, string> = { simple: 'Simple', easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export { TIERS, TIER_LABEL };

export function LevelStepper({
  caption, levelIdx, subFor, onSelect,
}: {
  caption: string;
  levelIdx: number;
  /** Short text shown under each step's label (problem name(s), or a depth tag). */
  subFor: (tierIndex: number) => string;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="pl-level-bar">
      <div className="pl-stepper-caption">{caption}</div>
      <div className="pl-stepper">
        {TIERS.map((t, gi) => (
          <button
            key={t}
            type="button"
            className={`pl-step-item ${gi === levelIdx ? 'pl-active' : gi < levelIdx ? 'pl-done' : ''}`}
            onClick={() => onSelect(gi)}
          >
            <div className="pl-step-line" />
            <div className="pl-step-dot">{gi + 1}</div>
            <div className="pl-step-label">{TIER_LABEL[t]}</div>
            <div className="pl-step-sub">{subFor(gi)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
