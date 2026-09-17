import type { Structure } from './types';

export function LearnSection({ structure }: { structure: Structure }) {
  return (
    <div className="sl-section-body">
      <div className="sl-concept-card">
        <h3>{structure.label}</h3>
        <div className="sl-lede">{structure.blurb}</div>
        <div className="sl-analogy">
          <b>Think of it like:</b> {structure.analogy}
        </div>
        <div className="sl-concept-block" dangerouslySetInnerHTML={{ __html: structure.coreIdea }} />
        {structure.recurrenceGeneral && (
          <div className="sl-recurrence-general">{structure.recurrenceGeneral}</div>
        )}
        <div>
          <h2 className="sl-eyebrow">Operations &amp; complexity</h2>
          <table className="sl-complexity-table">
            <thead>
              <tr>
                <th>Operation</th>
                <th>Time</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {structure.complexity.map((row, i) => (
                <tr key={i}>
                  <td className="sl-op-name">{row.op}</td>
                  <td><span className="sl-big-o">{row.big}</span></td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
