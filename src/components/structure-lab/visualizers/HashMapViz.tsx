import type { HashMapDemoState } from '../types';

export function HashMapViz({ state }: { state: HashMapDemoState }) {
  return (
    <div className="sl-bucket-grid">
      {state.buckets.map((entries, i) => (
        <div className="sl-bucket-row" key={i}>
          <span className="sl-bucket-idx">{i}</span>
          <div className="sl-bucket-slots">
            {entries.length ? (
              entries.map((e) => {
                const isCurrent = state.hi?.bucket === i && state.hi?.key === e.k;
                const collide = entries.length > 1;
                return (
                  <span key={e.k} className={`sl-bucket-entry ${isCurrent ? 'sl-current' : collide ? 'sl-collide' : ''}`}>
                    {e.k}:{e.v}
                  </span>
                );
              })
            ) : (
              <span className="sl-bucket-empty">empty</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
