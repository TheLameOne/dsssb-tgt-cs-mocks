import { useMemo } from 'react';
import { loadAttempt, loadHistory } from '../lib/storage.js';
import { LEVEL_INFO } from '../data/levels.js';
import { daysUntil, duration, marks, shortDate } from '../lib/format.js';

function Boxes({ label, value }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-boxes" aria-label={value}>
        {[...value].map((ch, i) => (
          <span className="field-box" key={i} aria-hidden="true">
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

function Countdown({ exam }) {
  const toFirst = daysUntil(exam.firstShift);
  const toLast = daysUntil(exam.lastShift);
  if (toLast < 0) return null;
  if (toFirst <= 0) return <Boxes label="Exam shifts" value="NOW" />;
  return <Boxes label="Days to first shift" value={String(toFirst)} />;
}

function MockRow({ mock, attempts, active }) {
  const best = attempts.length ? Math.max(...attempts.map((a) => a.overall.marks)) : null;
  const latest = attempts[attempts.length - 1];
  const state = active ? 'half' : attempts.length ? 'full' : 'empty';
  let detail = '200 questions, 2 hours';
  if (active) detail = `In progress, ${duration(active.remaining)} left`;
  else if (latest) {
    detail = `Best ${marks(best)} of 200. Last taken ${shortDate(latest.finishedAt)}`;
  }

  return (
    <li className="mock-row">
      <span className={`bubble-state bubble-${state}`} aria-hidden="true" />
      <div className="mock-name">
        <a href={`#/mock/${mock.id}`}>{mock.title}</a>{' '}
        <span className="mock-detail">{detail}</span>
      </div>
      <div className="mock-actions">
        {active && (
          <a className="btn btn-primary" href={`#/exam/${mock.id}`}>
            Resume
          </a>
        )}
        {!active && latest && (
          <>
            <a className="btn" href={`#/result/${latest.id}`}>
              See result
            </a>
            <a className="btn" href={`#/mock/${mock.id}`}>
              Retake
            </a>
          </>
        )}
        {!active && !latest && (
          <a className="btn btn-primary" href={`#/mock/${mock.id}`}>
            Start
          </a>
        )}
      </div>
    </li>
  );
}

export function Home({ manifest }) {
  const history = useMemo(loadHistory, []);
  const inProgress = useMemo(() => {
    const out = {};
    for (const m of manifest.mocks) {
      const a = loadAttempt(m.id);
      if (a && a.v === manifest.v) out[m.id] = a;
    }
    return out;
  }, [manifest]);

  const exam = manifest.exam;
  const levels = ['low', 'same', 'high'];
  const rehearsal = manifest.rehearsalMocks.map((id) => manifest.mocks.find((m) => m.id === id)?.title).filter(Boolean);

  return (
    <>
      <section className="hero">
        <h1>Ten full mock tests for DSSSB TGT Computer Science</h1>
        <p className="lead">
          Same paper as the real one: 200 questions in 2 hours, 1 mark each, minus 0.25 for a wrong answer, on a console
          that behaves like the real thing.
        </p>
        <div className="fields">
          <Boxes label="Post code" value={exam.postCode} />
          <div className="field">
            <div className="field-label">Exam shifts</div>
            <div className="field-text">27 Nov to 4 Dec 2026</div>
          </div>
          <Countdown exam={exam} />
        </div>
      </section>

      {levels.map((level) => {
        const mocks = manifest.mocks.filter((m) => m.level === level);
        return (
          <section className="level" key={level}>
            <h2>{LEVEL_INFO[level].name}</h2>
            <p className="level-blurb">{LEVEL_INFO[level].blurb}</p>
            <ul className="mock-list">
              {mocks.map((mock) => (
                <MockRow
                  key={mock.id}
                  mock={mock}
                  active={inProgress[mock.id]}
                  attempts={history.filter((h) => h.mockId === mock.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="plan">
        <h2>How to train with these</h2>
        <ol className="plan-steps">
          <li>
            <h3>Start low</h3>
            <p>
              Take Mocks 1 to 3. After each one, read every wrong answer, then drill your weakest topics in{' '}
              <a href="#/practice">Practice</a>.
            </p>
          </li>
          <li>
            <h3>Move to paper level</h3>
            <p>Take Mocks 4 and 5 under exam conditions. Section B decides qualifying and ties, so spend your practice there.</p>
          </li>
          <li>
            <h3>Stretch</h3>
            <p>Take Mocks 8 to 10. A low score is fine here. The aim is to stay calm and skip well when options are close.</p>
          </li>
          <li>
            <h3>Rehearse</h3>
            <p>
              In your final days take {rehearsal.join(' and ')}, at the time of your shift. Practice never uses these two, so
              they stay unseen.
            </p>
          </li>
        </ol>
      </section>
    </>
  );
}
