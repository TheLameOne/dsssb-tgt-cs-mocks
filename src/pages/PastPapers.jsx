import { CHECKED_ON, PAST_PAPERS } from '../data/official.js';

export function PastPapers() {
  return (
    <article className="prose">
      <h1>Past papers</h1>
      <p className="lead">
        DSSSB has not held this exam every year. In the last ten years it ran in 2017, 2021, 2023, 2024 and 2025, and your 2026 exam
        comes next. Here is every paper I could find, checked on {CHECKED_ON}.
      </p>
      <p>
        The mocks on this site are newly written and do not copy these papers. I measured their topics, difficulty and question
        styles, and wrote new questions to match. Attempt at least one real paper too. The June 2023 ones are the best choice.
      </p>

      <ol className="cycles">
        {PAST_PAPERS.map((c) => (
          <li className="cycle" key={c.cycle}>
            <h2>{c.cycle}</h2>
            <p className="cycle-meta">
              Post code {c.post}, {c.department}. {c.dates}.
            </p>
            <p>{c.note}</p>
            {c.papers.length > 0 && (
              <ul className="paper-links">
                {c.papers.map((p) => (
                  <li key={p.url}>
                    <a href={p.url} target="_blank" rel="noreferrer noopener">
                      {p.label}
                    </a>{' '}
                    <span className={p.official ? 'source source-official' : 'source'}>{p.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <p className="small">
        Copies marked Adda247 are hosted by a coaching site and labelled as official papers. They carry that site's branding and may
        move. Links marked DSSSB go to the Board's own question bank.
      </p>
    </article>
  );
}
