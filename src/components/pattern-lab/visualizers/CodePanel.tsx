import type { CodeLine } from '../types';

export function CodePanel({ lines, activeKey }: { lines: CodeLine[]; activeKey: string }) {
  return (
    <div className="pl-code-panel">
      {lines.map((l, i) =>
        l.t === '' ? (
          <div className="pl-code-line pl-pale" key={i}>&nbsp;</div>
        ) : (
          <div className={l.k === activeKey ? 'pl-code-line pl-active' : 'pl-code-line'} key={i}>
            {l.t}
          </div>
        )
      )}
    </div>
  );
}
