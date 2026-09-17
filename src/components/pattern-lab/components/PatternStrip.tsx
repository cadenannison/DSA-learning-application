import type { Pattern } from '../types';

export function PatternStrip({
  patterns, soon, activeId, onSelect,
}: {
  patterns: Pattern[];
  soon: string[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="pl-pattern-strip">
      {patterns.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`pl-pattern-tab ${p.id === activeId ? 'pl-active' : ''}`}
          style={{ ['--pl-tab-accent' as string]: p.accent, ['--pl-tab-accent-dark' as string]: p.accentDark }}
          onClick={() => onSelect(p.id)}
        >
          <span className="pl-dot" /> {p.label}
        </button>
      ))}
      {soon.map((label) => (
        <div className="pl-pattern-tab pl-soon" key={label}>
          <span className="pl-dot" /> {label} <span className="pl-mono pl-soon-tag">soon</span>
        </div>
      ))}
    </div>
  );
}
