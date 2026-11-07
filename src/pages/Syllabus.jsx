import { CHECKED_ON, METHODOLOGY, OFFICIAL_LINKS, SHIFTS, SYLLABUS } from '../data/official.js';
import weightage from '../data/pyq-weightage.json';

function External({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

function WeightBar({ value, max }) {
  return (
    <span className="meter" aria-hidden="true">
      <span style={{ width: `${(value / max) * 100}%` }} />
    </span>
  );
}

export function Syllabus({ manifest }) {
  const cs = manifest.sections.find((s) => s.key === 'cs');
  const rows = cs.topics
    .map((t) => {
      const w = weightage.topics[t.key] ?? {};
      return { ...t, y2021: w.doe2021 ?? 0, y2023: w.doe2023 ?? 0 };
    })
    .sort((a, b) => b.perMock - a.perMock || a.name.localeCompare(b.name));
  const max = Math.max(...rows.flatMap((r) => [r.y2021, r.y2023, r.perMock]));

  return (
    <article className="prose prose-wide">
      <h1>Syllabus and exam pattern</h1>
      <p className="lead">
        Taken from DSSSB's own documents for Post Code 41/26, Directorate of Education, checked on {CHECKED_ON}.
      </p>
      <ul className="doc-links">
        <li>
          <External href={OFFICIAL_LINKS.syllabus}>Official syllabus for 41/26 (PDF)</External>
        </li>
        <li>
          <External href={OFFICIAL_LINKS.scheme}>Official exam scheme, one tier, 200 marks (PDF)</External>
        </li>
        <li>
          <External href={OFFICIAL_LINKS.advertisement}>Advertisement 03/2026 (PDF)</External>
        </li>
        <li>
          <External href={OFFICIAL_LINKS.schedule}>Exam schedule dated 7 Oct 2026 (PDF)</External>
        </li>
      </ul>

      <h2>What to know this cycle</h2>
      <ul>
        <li>
          <strong>The subject syllabus has not changed.</strong> The list for 41/26 reads the same as the one for the previous cycle, 56/24.
        </li>
        <li>
          <strong>Section A has no minimum of its own.</strong> The qualifying minimum applies to Section B and to your combined marks: 40% for General
          and EWS, 35% for OBC (Delhi), 30% for SC, ST and PwBD. Both sections count towards merit.
        </li>
        <li>
          <strong>Ties go to Section B.</strong> With equal marks, more marks in the subject section ranks higher. Then the older candidate ranks higher.
        </li>
        <li>
          <strong>Scores may be normalised,</strong> because the exam runs over many shifts. A hard shift is not automatically a disadvantage.
        </li>
        <li>
          <strong>Python is not on the list.</strong> It was in the 2024 paper because that paper follows the{' '}
          <External href={OFFICIAL_LINKS.ndmcSyllabus}>separate NDMC syllabus</External>. The DoE papers of 2021 and 2023 had none. Practice has a small optional
          set in case of surprises.
        </li>
      </ul>

      <h2>Pattern</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Subject</th>
              <th scope="col">Questions</th>
              <th scope="col">Marks</th>
            </tr>
          </thead>
          <tbody>
            {['General Awareness', 'General Intelligence and Reasoning Ability', 'Arithmetical and Numerical Ability', 'Hindi Language and Comprehension', 'English Language and Comprehension'].map((s) => (
              <tr key={s}>
                <td>A</td>
                <td>{s}</td>
                <td>20</td>
                <td>20</td>
              </tr>
            ))}
            <tr>
              <td>B</td>
              <td>The subject concerned, including teaching methodology</td>
              <td>100</td>
              <td>100</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total, 2 hours in one sitting, minus 0.25 per wrong answer
              </th>
              <td>200</td>
              <td>200</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p>
        The official text does not say how Section B divides. Every paper from 2021 to 2024 used about 90 subject questions and 10 on teaching methodology, so the mocks do too.
      </p>

      <h2>Shifts</h2>
      <p>Your admit card gives your date and shift. Shift 1 is 9 to 11 am, shift 2 is 1 to 3 pm, shift 3 is 5 to 7 pm.</p>
      <div className="table-scroll">
        <table className="data-table">
          <tbody>
            {SHIFTS.map((s) => (
              <tr key={s.date}>
                <th scope="row">{s.date}</th>
                <td>{s.shifts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>How the mocks split Computer Science</h2>
      <p>
        DSSSB gives no weightage, so I counted it. I sorted every Section B question of 7 DoE papers into the syllabus topics, by my own reading of each question. The mocks follow the average of the 2021 and 2023 cycles.
      </p>
      <div className="table-scroll">
        <table className="data-table weight-table">
          <thead>
            <tr>
              <th scope="col">Topic</th>
              <th scope="col">Each mock</th>
              <th scope="col">2021 average</th>
              <th scope="col">2023 average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.name}</th>
                <td>
                  <span className="weight-cell">
                    <b>{r.perMock}</b>
                    <WeightBar value={r.perMock} max={max} />
                  </span>
                </td>
                <td>{r.y2021}</td>
                <td>{r.y2023}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small">
        The averages are questions per paper, across 5 papers of 2021 and 2 of 2023. Difficulty in those papers: about 50% easy, 44% medium and 5% hard. A few questions are hard to place, so treat small differences as noise.
      </p>

      <h2>Official Computer Science topics</h2>
      <ol className="syllabus-list">
        {SYLLABUS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>

      <h2>Official Teaching Methodology topics</h2>
      <ol className="syllabus-list">
        {METHODOLOGY.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>

      <h2>What the mocks cannot copy</h2>
      <p>
        Real papers use figures for a few non-verbal reasoning items, about 1 to 3 per paper. These are written here as text-based cube, dice, clock and mirror questions. Current affairs covers events up to mid-October 2026, so also read the news up to your shift.
      </p>

      <h2>How far to trust the answers</h2>
      <p>
        Every question is newly written, and every answer was solved a second time with the options shuffled. Disagreements were reviewed one by one, and current affairs was checked against the web. Mistakes can still remain. If an answer looks wrong, check your textbook. Each question in review and practice shows an ID, so you can note it and fix it in the question bank.
      </p>
    </article>
  );
}
