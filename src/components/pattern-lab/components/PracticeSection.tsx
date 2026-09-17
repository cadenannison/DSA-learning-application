import { useEffect, useMemo, useState } from 'react';
import type { Pattern, Trace } from '../types';
import { CodePanel } from '../visualizers/CodePanel';
import { ArrayViz } from '../visualizers/ArrayViz';
import { GridViz } from '../visualizers/GridViz';
import { MatrixViz } from '../visualizers/MatrixViz';
import { NodeViz } from '../visualizers/NodeViz';

const TIERS = ['simple', 'easy', 'medium', 'hard'] as const;

export function PracticeSection({
  pattern, levelIdx, tierVariantIdx, onTierVariantChange,
}: {
  pattern: Pattern;
  levelIdx: number;
  tierVariantIdx: number;
  onTierVariantChange: (idx: number) => void;
}) {
  const group = useMemo(
    () => pattern.variants.filter((v) => v.difficulty === TIERS[levelIdx]),
    [pattern, levelIdx],
  );
  const variant = group[tierVariantIdx] ?? group[0];

  // Trace results are cached per variant id so re-visiting a problem doesn't re-run it. Lives
  // in state (not a ref) so the lookup below can safely happen during render.
  const [traceCache] = useState<Map<string, Trace>>(() => new Map());
  const traceCacheKey = `${pattern.id}:${variant.id}`;
  if (!traceCache.has(traceCacheKey)) traceCache.set(traceCacheKey, variant.trace());
  const trace = traceCache.get(traceCacheKey)!;

  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  // Reset playback whenever the selected problem changes.
  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [pattern.id, variant.id]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStepIdx((i) => {
        if (i >= trace.steps.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [playing, speed, trace]);

  const step = trace.steps[stepIdx];
  const total = trace.steps.length;
  const pct = total > 1 ? Math.round((stepIdx / (total - 1)) * 100) : 100;

  return (
    <div className="pl-section-body">
      {group.length > 1 && (
        <div className="pl-tier-pick">
          {group.map((gv, gi) => (
            <button type="button" key={gv.id} className={gi === tierVariantIdx ? 'pl-active' : ''} onClick={() => onTierVariantChange(gi)}>
              {gv.label}
            </button>
          ))}
        </div>
      )}

      <div className="pl-board">
        <div className="pl-card">
          <div className="pl-pattern-title">
            <h3>{variant.label}</h3>
            <span className={`pl-diff pl-${variant.difficulty}`}>{variant.difficulty}</span>
          </div>
          <div>
            <h2 className="pl-eyebrow">Problem</h2>
            <div className="pl-statement" dangerouslySetInnerHTML={{ __html: variant.statement }} />
          </div>
          <div className="pl-badge" style={{ alignSelf: 'flex-start' }}>{variant.complexity}</div>
          <div className="pl-why-here"><b>Why it&rsquo;s here:</b> {variant.twist}</div>
        </div>

        <div className="pl-workbench">
          <div className="pl-wb-head"><h3>Trace it</h3></div>
          <div className="pl-recurrence">{variant.recurrence}</div>
          <CodePanel lines={trace.lines} activeKey={step.line} />
          <div className="pl-viz-panel">
            {step.kind === 'array' && <ArrayViz trace={trace} step={step} />}
            {step.kind === 'grid' && <GridViz step={step} />}
            {step.kind === 'matrix' && <MatrixViz trace={trace} step={step} />}
            {step.kind === 'nodes' && <NodeViz step={step} />}
          </div>
          <div className="pl-step-note">{step.note}</div>
          <div className="pl-controls">
            <button type="button" className="pl-ctrl-btn" disabled={stepIdx === 0 && !playing} onClick={() => { setPlaying(false); setStepIdx(0); }} title="Reset">⟲</button>
            <button type="button" className="pl-ctrl-btn" disabled={stepIdx === 0} onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(0, i - 1)); }} title="Step back">‹</button>
            <button type="button" className="pl-ctrl-btn pl-play" onClick={() => setPlaying((p) => { if (!p && stepIdx >= total - 1) setStepIdx(0); return !p; })}>
              {playing ? '❙❙ Pause' : '▶ Play'}
            </button>
            <button type="button" className="pl-ctrl-btn" disabled={stepIdx === total - 1} onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(total - 1, i + 1)); }} title="Step forward">›</button>
            <span className="pl-step-count">Step {stepIdx + 1} / {total}</span>
            <div className="pl-progress"><div style={{ width: `${pct}%` }} /></div>
            <div className="pl-speed-group">
              {[[1400, 'Slow'], [900, '1×'], [400, 'Fast']].map(([ms, label]) => (
                <button type="button" key={ms} className={`pl-speed-btn ${speed === ms ? 'pl-active' : ''}`} onClick={() => setSpeed(ms as number)}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
