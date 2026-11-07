import { useEffect, useMemo, useState } from 'react';
import { Passage, QuestionBody } from '../components/QuestionBody.jsx';
import { RichText } from '../components/RichText.jsx';
import { LoadError, Loading } from '../components/Status.jsx';
import { fetchMock } from '../lib/data.js';
import { duration } from '../lib/format.js';
import { DIFFICULTY_NAMES } from '../lib/practice.js';
import { findInHistory } from '../lib/storage.js';
import { useLoad } from '../lib/useLoad.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'wrong', label: 'Wrong' },
  { key: 'skipped', label: 'Skipped' },
  { key: 'right', label: 'Correct' },
  { key: 'marked', label: 'Marked for review' },
];

/** One answered question, with the answer and explanation shown. Practice reuses this. */
export function AnsweredOptions({ question, given, hindi }) {
  return (
    <ul className="review-options" lang={hindi ? 'hi' : undefined}>
      {question.o.map((text, i) => {
        const correct = i === question.a;
        const chosen = i === given;
        let state = '';
        if (correct) state = 'review-right';
        else if (chosen) state = 'review-wrong';
        return (
          <li key={i} className={`review-option ${state}`}>
            <span className="option-bubble" aria-hidden="true">
              {i + 1}
            </span>
            <span className="option-text">
              <RichText text={text} />
              {correct && <span className="review-tag">Correct answer{chosen ? ', your choice' : ''}</span>}
              {!correct && chosen && <span className="review-tag">Your choice</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Explanation({ question, hindi }) {
  return (
    <p className="explanation" lang={hindi ? 'hi' : undefined}>
      <b>{hindi ? 'व्याख्या: ' : 'Why: '}</b>
      <RichText text={question.e} />
      {question.src && (
        <>
          {' '}
          <a href={question.src} target="_blank" rel="noreferrer noopener">
            Source
          </a>
        </>
      )}
    </p>
  );
}

export function Review({ attemptId, focus, show }) {
  const summary = useMemo(() => findInHistory(attemptId), [attemptId]);
  const { data: mock, error, retry } = useLoad(() => (summary ? fetchMock(summary.mockId) : Promise.resolve(null)), attemptId);
  const [filter, setFilter] = useState(show && FILTERS.some((f) => f.key === show) ? show : 'all');
  const [section, setSection] = useState('all');

  useEffect(() => {
    if (!focus || !mock) return;
    const el = document.getElementById(`q-${focus}`);
    if (el) el.scrollIntoView({ block: 'start' });
  }, [focus, mock]);

  if (!summary) {
    return (
      <div className="notice">
        <p>This attempt is not saved in this browser.</p>
        <a className="btn" href="#/progress">
          Open your progress
        </a>
      </div>
    );
  }
  if (error) return <LoadError what="This review" onRetry={retry} />;
  if (!mock) return <Loading what="Loading the paper" />;

  let number = 0;
  const rows = [];
  const seenPassages = new Set();
  for (const s of mock.sections) {
    for (const q of s.questions) {
      number += 1;
      const given = summary.answers[q.id];
      const state = given === undefined ? 'skipped' : given === q.a ? 'right' : 'wrong';
      rows.push({ q, s, number, given, state, marked: Boolean(summary.marked?.[q.id]) });
    }
  }
  const counts = {
    all: rows.length,
    wrong: rows.filter((r) => r.state === 'wrong').length,
    skipped: rows.filter((r) => r.state === 'skipped').length,
    right: rows.filter((r) => r.state === 'right').length,
    marked: rows.filter((r) => r.marked).length,
  };
  const visible = rows.filter((r) => {
    if (section !== 'all' && r.s.key !== section) return false;
    if (filter === 'all') return true;
    if (filter === 'marked') return r.marked;
    return r.state === filter;
  });

  return (
    <>
      <header className="review-head">
        <h1>{summary.title}: review</h1>
        <a href={`#/result/${summary.id}`}>Back to the result</a>
      </header>
      <div className="filters">
        <div className="chips" role="group" aria-label="Show questions">
          {FILTERS.map((f) => (
            <button type="button" key={f.key} className="chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <label className="inline-field">
          <span>Section</span>
          <select value={section} onChange={(e) => setSection(e.target.value)}>
            <option value="all">All sections</option>
            {mock.sections.map((s) => (
              <option key={s.key} value={s.key}>
                {s.short}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 && <p className="notice">No questions match this filter. Choose another one above.</p>}

      <ol className="review-list">
        {visible.map(({ q, s, number: n, given, state }) => {
          const hindi = s.key === 'hindi';
          const firstOfPassage = q.group && !seenPassages.has(q.group);
          if (q.group) seenPassages.add(q.group);
          const verdict = { right: 'Correct, +1', wrong: 'Wrong, −0.25', skipped: 'Skipped, 0' }[state];
          return (
            <li className="review-item" id={`q-${q.id}`} key={q.id}>
              <div className="review-meta">
                <b>Question {n}</b>
                <span className={`verdict verdict-${state}`}>{verdict}</span>
                <span className="small">
                  {s.short}, {DIFFICULTY_NAMES[q.d]}
                  {summary.spent?.[q.id] ? `, ${duration(summary.spent[q.id])} spent` : ''}, ID {q.id}
                </span>
              </div>
              {firstOfPassage ? <Passage passage={mock.passages[q.group]} hindi={hindi} /> : q.group && <p className="small">Same passage as the question above.</p>}
              <QuestionBody question={q} hindi={hindi} />
              <AnsweredOptions question={q} given={given} hindi={hindi} />
              <Explanation question={q} hindi={hindi} />
            </li>
          );
        })}
      </ol>
    </>
  );
}
