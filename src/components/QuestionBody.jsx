import { Chart } from './Chart.jsx';
import { RichText } from './RichText.jsx';

export function Passage({ passage, hindi }) {
  if (!passage) return null;
  return (
    <section className="passage" lang={hindi ? 'hi' : undefined} tabIndex={0} aria-label={hindi ? 'गद्यांश' : 'Passage'}>
      <p className="passage-lead">{hindi ? 'गद्यांश को ध्यान से पढ़िए और प्रश्न का उत्तर दीजिए।' : 'Read the passage and answer the question.'}</p>
      {passage.text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </section>
  );
}

export function QuestionBody({ question, passage, hindi }) {
  return (
    <div className="q-body">
      <Passage passage={passage} hindi={hindi} />
      <p className="q-text" lang={hindi ? 'hi' : undefined}>
        <RichText text={question.q} />
      </p>
      {question.code && (
        <pre className="q-code" tabIndex={0} aria-label={question.lang ? `${question.lang} code` : 'Code'}>
          <code>{question.code}</code>
        </pre>
      )}
      {question.table && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {question.table.head.map((h, i) => (
                  <th scope="col" key={i}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <RichText text={String(cell)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {question.chart && <Chart chart={question.chart} />}
    </div>
  );
}
