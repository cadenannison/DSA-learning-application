import type { Pattern } from '../types';
import { TIER_LABEL } from './LevelStepper';

export function RecognizeSection({ pattern, levelIdx }: { pattern: Pattern; levelIdx: number }) {
  const lvl = pattern.levels[levelIdx];

  return (
    <div className="pl-section-body">
      <div className="pl-concept-card">
        <h3>Scan for this — {TIER_LABEL[lvl.tier]} tells</h3>
        <div className="pl-cue-list">
          {lvl.cues.map((c, i) => <div className="pl-cue-chip" key={i}>{c}</div>)}
        </div>
        {lvl.confuse && <div className="pl-confuse" dangerouslySetInnerHTML={{ __html: lvl.confuse }} />}
      </div>
      <div>
        <h2 className="pl-eyebrow" style={{ marginBottom: 10 }}>Spot it in the wild — real problem-statement phrasing</h2>
        <div className="pl-example-grid">
          {lvl.examples.map((ex, i) => (
            <div className="pl-example-card" key={i}>
              <blockquote dangerouslySetInnerHTML={{ __html: ex.snippet }} />
              <div className="pl-tell" dangerouslySetInnerHTML={{ __html: ex.tell }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
