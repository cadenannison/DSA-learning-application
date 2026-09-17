import type { Highlight } from '../types';

export function StackViz({ values }: { values: number[]; hi: Highlight | null }) {
  if (!values.length) return <div className="sl-op-note">Stack is empty.</div>;
  return (
    <div className="sl-stack-col">
      {[...values].reverse().map((v, revIdx) => {
        const i = values.length - 1 - revIdx;
        const isTop = i === values.length - 1;
        return (
          <div className={`sl-stack-cell ${isTop ? 'sl-top' : ''}`} key={i}>
            {isTop && <span className="sl-sc-tag">TOP →</span>}
            <span>{v}</span>
          </div>
        );
      })}
    </div>
  );
}
