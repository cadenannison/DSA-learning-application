import { useState } from 'react';
import type { Pattern } from '../types';

type LearnPage = 'concept' | 'syntax';

export function LearnSection({
  pattern, levelIdx, onJumpToPractice,
}: {
  pattern: Pattern;
  levelIdx: number;
  onJumpToPractice: (levelIdx: number, variantIdIdx: number) => void;
}) {
  const [page, setPage] = useState<LearnPage>('concept');
  const lvl = pattern.levels[levelIdx];

  return (
    <div className="pl-section-body">
      <div className="pl-subpage-pills">
        <button type="button" className={`pl-subpage-pill ${page === 'concept' ? 'pl-active' : ''}`} onClick={() => setPage('concept')}>Concept</button>
        <button type="button" className={`pl-subpage-pill ${page === 'syntax' ? 'pl-active' : ''}`} onClick={() => setPage('syntax')}>Syntax Reference</button>
      </div>

      {page === 'concept' ? (
        <div className="pl-concept-card">
          <div className="pl-lede"><b>{pattern.label}:</b> {pattern.blurb}</div>
          <h3>{lvl.learnHeading}</h3>
          <div className="pl-concept-block" dangerouslySetInnerHTML={{ __html: lvl.learnBody }} />
          <div className="pl-cue-list">
            {lvl.learnFocus.map((f, i) => <div className="pl-cue-chip" key={i}>{f}</div>)}
          </div>
          {levelIdx === 0 && <div className="pl-recurrence-general">{pattern.recurrenceGeneral}</div>}

          <div className="pl-path-preview">
            <h2 className="pl-eyebrow">Where this goes in Practice — simple to hard</h2>
            <div className="pl-path-row">
              {['simple', 'easy', 'medium', 'hard'].map((tier, gi) => {
                const vs = pattern.variants.filter((v) => v.difficulty === tier);
                return vs.map((v, vi) => (
                  <button type="button" className="pl-path-chip" key={v.id} onClick={() => onJumpToPractice(gi, vi)}>
                    <span className="pl-pc-tier">{tier}</span>
                    <span className="pl-pc-name">{v.label}</span>
                  </button>
                ));
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="pl-syntax-head">
            <h2>The idioms worth having memorized</h2>
            <p>How the state is actually allocated, indexed, and reconstructed once the table is full — a flat reference, independent of the depth slider above.</p>
          </div>
          <div className="pl-syntax-grid">
            {pattern.syntax.map((s, i) => (
              <div className="pl-syntax-card" key={i}>
                <h4>{s.title}</h4>
                <pre>{s.code}</pre>
                <div className="pl-note">{s.note}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
