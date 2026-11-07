import { useState } from 'react';
import { StatusLegend } from '../components/Marks.jsx';
import { LoadError, Loading } from '../components/Status.jsx';
import { fetchMock } from '../lib/data.js';
import { go } from '../lib/router.js';
import { clearAttempt, loadAttempt } from '../lib/storage.js';
import { duration } from '../lib/format.js';
import { useLoad } from '../lib/useLoad.js';
import { LEVEL_INFO } from '../data/levels.js';

export function Instructions({ manifest, mockId }) {
  const { data: mock, error, retry } = useLoad(() => fetchMock(mockId), mockId);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(() => {
    const a = loadAttempt(mockId);
    return a && a.v === manifest.v ? a : null;
  });

  if (error) return <LoadError what="This mock" onRetry={retry} />;
  if (!mock) return <Loading what="Loading the paper" />;

  const startOver = () => {
    clearAttempt(mockId);
    setActive(null);
  };

  return (
    <article className="prose">
      <h1>{mock.title}: read before you start</h1>
      <p className="lead">{LEVEL_INFO[mock.level].name} level. {LEVEL_INFO[mock.level].blurb}</p>

      <h2>The paper</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Section</th>
              <th scope="col">Questions</th>
              <th scope="col">Marks</th>
            </tr>
          </thead>
          <tbody>
            {mock.sections.map((s) => (
              <tr key={s.key}>
                <td>{s.part}</td>
                <td>{s.name}</td>
                <td>{s.questions.length}</td>
                <td>{s.questions.length}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total, in one sitting of 2 hours
              </th>
              <td>{mock.sections.reduce((n, s) => n + s.questions.length, 0)}</td>
              <td>{mock.sections.reduce((n, s) => n + s.questions.length, 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <h2>Marking</h2>
      <p>A correct answer earns 1 mark, a wrong answer loses 0.25, and a skipped question scores nothing. You can move between sections at any time.</p>

      <h2>The console</h2>
      <ul>
        <li>
          <strong>Save &amp; Next</strong> saves your choice and opens the next question.
        </li>
        <li>
          <strong>Mark for Review &amp; Next</strong> flags the question to come back to. If you picked an option, it still
          counts when you submit.
        </li>
        <li>
          <strong>Clear Response</strong> removes your choice.
        </li>
        <li>
          If you pick an option and then jump to another question or section without saving, your choice is lost. The real
          exam works this way, so build the habit here.
        </li>
      </ul>
      <h3>Question palette</h3>
      <StatusLegend />

      <h2>On this site</h2>
      <ul>
        <li>The timer pauses when you leave this page or lock your phone, and your answers are saved in this browser. The real exam has no pause.</li>
        <li>Questions are in English, except the Hindi section. The real paper is bilingual.</li>
      </ul>

      {active ? (
        <div className="start-box">
          <p>
            You have this mock in progress, with {duration(active.remaining)} left.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href={`#/exam/${mockId}`}>
              Resume {mock.title}
            </a>
            <button type="button" className="btn" onClick={startOver}>
              Discard and start over
            </button>
          </div>
        </div>
      ) : (
        <div className="start-box">
          <label className="check">
            <input type="checkbox" checked={ready} onChange={(e) => setReady(e.target.checked)} />
            <span>I have read the instructions and I have 2 hours free.</span>
          </label>
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={() => go(`/exam/${mockId}`)}>
            Start {mock.title}
          </button>
        </div>
      )}
    </article>
  );
}
