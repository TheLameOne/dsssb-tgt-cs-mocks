import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { StatusLegend, StatusMark } from '../components/Marks.jsx';
import { QuestionBody } from '../components/QuestionBody.jsx';
import { RichText } from '../components/RichText.jsx';
import { LoadError, Loading } from '../components/Status.jsx';
import { fetchMock } from '../lib/data.js';
import { countStatuses, flatten, newAttempt, reduceAttempt, statusOf, summarise } from '../lib/exam.js';
import { clock } from '../lib/format.js';
import { replace } from '../lib/router.js';
import { addToHistory, clearAttempt, loadAttempt, recordAnswers, saveAttempt } from '../lib/storage.js';
import { useLoad } from '../lib/useLoad.js';

const LOW_TIME_SECONDS = 300;

function useCountdown(dispatch) {
  useEffect(() => {
    let last = Date.now();
    let banked = 0;
    const tick = () => {
      const now = Date.now();
      const gap = now - last;
      last = now;
      // A long gap means the phone slept or the tab was frozen. The clock does not charge for that.
      if (document.hidden || gap > 5000) return;
      banked += gap;
      const seconds = Math.floor(banked / 1000);
      if (seconds > 0) {
        banked -= seconds * 1000;
        dispatch({ type: 'tick', seconds });
      }
    };
    const timer = setInterval(tick, 500);
    const onVisibility = () => {
      last = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dispatch]);
}

function SubmitDialog({ mock, state, onCancel, onSubmit }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.showModal?.();
  }, []);
  const rows = mock.sections.map((s) => ({ s, c: countStatuses(state, s.questions) }));
  const sum = (key) => rows.reduce((n, r) => n + r.c[key], 0);
  const answered = sum('answered') + sum('answered-marked');
  return (
    <dialog ref={ref} className="dialog" onCancel={onCancel} aria-labelledby="submit-title">
      <h2 id="submit-title">Submit this paper?</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col">Answered</th>
              <th scope="col">Not answered</th>
              <th scope="col">Marked</th>
              <th scope="col">Not visited</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, c }) => (
              <tr key={s.key}>
                <th scope="row">{s.short}</th>
                <td>{c.answered + c['answered-marked']}</td>
                <td>{c['not-answered']}</td>
                <td>{c.marked + c['answered-marked']}</td>
                <td>{c['not-visited']}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{answered}</td>
              <td>{sum('not-answered')}</td>
              <td>{sum('marked') + sum('answered-marked')}</td>
              <td>{sum('not-visited')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p>You cannot change your answers after submitting. Time left: {clock(state.remaining)}.</p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={onCancel}>
          Go back to the paper
        </button>
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          Submit paper
        </button>
      </div>
    </dialog>
  );
}

function Palette({ section, state, currentFlat, firstFlat, onJump, onSubmit, counts }) {
  return (
    <div className="palette">
      <StatusLegend counts={counts} />
      <h2 className="palette-title">{section.short}</h2>
      <div className="palette-grid">
        {section.questions.map((q, i) => {
          const flatIndex = firstFlat + i;
          const status = statusOf(state, q.id);
          return (
            <button
              type="button"
              key={q.id}
              className="palette-btn"
              aria-current={flatIndex === currentFlat ? 'true' : undefined}
              aria-label={`Question ${flatIndex + 1}, ${status.replace('-', ' ')}`}
              onClick={() => onJump(flatIndex)}
            >
              <StatusMark status={status}>{flatIndex + 1}</StatusMark>
            </button>
          );
        })}
      </div>
      <button type="button" className="btn btn-submit" onClick={onSubmit}>
        Submit
      </button>
    </div>
  );
}

function ExamConsole({ mock }) {
  const order = useMemo(() => flatten(mock), [mock]);
  const reducer = useCallback((state, action) => reduceAttempt(state, action, order), [order]);
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadAttempt(mock.id);
    return saved && saved.v === mock.v ? saved : newAttempt(mock);
  });
  const [confirming, setConfirming] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const finished = useRef(false);
  const latest = useRef(state);
  latest.current = state;

  useCountdown(dispatch);

  // Every answer is saved at once. Timer ticks are saved every few seconds and on leaving.
  useEffect(() => {
    if (!finished.current) saveAttempt(latest.current);
  }, [state.cur, state.saved, state.marked, state.draft]);
  useEffect(() => {
    const persist = () => {
      if (!finished.current) saveAttempt(latest.current);
    };
    const timer = setInterval(persist, 5000);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persist);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persist);
      persist();
    };
  }, []);

  const submit = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const attempt = latest.current;
    const summary = summarise(mock, attempt);
    addToHistory(summary);
    recordAnswers(
      mock.sections.flatMap((s) => s.questions)
        .filter((q) => attempt.saved[q.id] !== undefined)
        .map((q) => ({ id: q.id, correct: attempt.saved[q.id] === q.a })),
    );
    clearAttempt(mock.id);
    replace(`/result/${summary.id}`);
  }, [mock]);

  useEffect(() => {
    if (state.remaining <= 0) submit();
  }, [state.remaining, submit]);

  const current = order[state.cur];
  const section = mock.sections[current.sectionIndex];
  const question = current.question;
  const hindi = section.key === 'hindi';
  const firstFlat = current.flatIndex - current.indexInSection;
  const counts = useMemo(() => countStatuses(state, section.questions), [state, section]);
  const scroller = useRef(null);
  const tabs = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo?.(0, 0);
    setPaletteOpen(false);
  }, [state.cur]);

  // On a phone the tabs scroll sideways, so keep the current section's tab in view.
  useEffect(() => {
    const active = tabs.current?.querySelector('[aria-current="true"]');
    if (active && tabs.current) {
      tabs.current.scrollLeft = active.offsetLeft - tabs.current.offsetLeft - 16;
    }
  }, [current.sectionIndex]);

  const jump = (index) => dispatch({ type: 'goto', index });
  const jumpToSection = (i) => {
    const first = order.find((o) => o.sectionIndex === i);
    if (first) jump(first.flatIndex);
  };

  return (
    <div className="console">
      <header className="console-top">
        <div className="console-title">
          <b>{mock.title}</b>
          <a className="console-exit" href="#/">
            Leave for now
          </a>
        </div>
        <div className={`timer${state.remaining <= LOW_TIME_SECONDS ? ' timer-low' : ''}`} role="timer" aria-label="Time left">
          <span className="timer-label">Time left</span>
          <span className="timer-value">{clock(state.remaining)}</span>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Sections" ref={tabs}>
        {mock.sections.map((s, i) => {
          const c = countStatuses(state, s.questions);
          const done = c.answered + c['answered-marked'];
          return (
            <button
              type="button"
              key={s.key}
              className="section-tab"
              aria-current={i === current.sectionIndex ? 'true' : undefined}
              onClick={() => jumpToSection(i)}
            >
              {s.short}
              <span className="section-count">
                {done}/{s.questions.length}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="console-body">
        <main className="console-main" ref={scroller}>
          <div className="q-head">
            <h1 className="q-number">Question {current.flatIndex + 1}</h1>
            <span className="q-marks">Correct +1, wrong −0.25</span>
          </div>
          {state.discarded && (
            <p className="discard-note" role="status">
              Your last choice was not saved, because you moved away without Save &amp; Next.
            </p>
          )}
          <QuestionBody question={question} passage={question.group ? mock.passages[question.group] : null} hindi={hindi} />
          <fieldset className="options" lang={hindi ? 'hi' : undefined}>
            <legend className="sr-only">Options for question {current.flatIndex + 1}</legend>
            {question.o.map((text, i) => (
              <label className="option" key={`${question.id}-${i}`}>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={state.draft === i}
                  onChange={() => dispatch({ type: 'select', option: i })}
                />
                <span className="option-bubble" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="option-text">
                  <RichText text={text} />
                </span>
              </label>
            ))}
          </fieldset>
        </main>

        <aside className={`console-side${paletteOpen ? ' console-side-open' : ''}`} aria-label="Question palette">
          <div className="side-head">
            <h2>Question palette</h2>
            <button type="button" className="btn" onClick={() => setPaletteOpen(false)}>
              Close
            </button>
          </div>
          <Palette
            section={section}
            state={state}
            currentFlat={current.flatIndex}
            firstFlat={firstFlat}
            onJump={jump}
            onSubmit={() => setConfirming(true)}
            counts={counts}
          />
        </aside>
      </div>

      <footer className="console-actions">
        <div className="actions-left">
          <button type="button" className="btn" onClick={() => dispatch({ type: 'markNext' })}>
            Mark for Review &amp; Next
          </button>
          <button type="button" className="btn" onClick={() => dispatch({ type: 'clear' })}>
            Clear Response
          </button>
        </div>
        <div className="actions-right">
          <button type="button" className="btn btn-palette" onClick={() => setPaletteOpen(true)}>
            Palette
          </button>
          <button type="button" className="btn" disabled={state.cur === 0} onClick={() => jump(state.cur - 1)}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={() => dispatch({ type: 'saveNext' })}>
            Save &amp; Next
          </button>
        </div>
      </footer>

      {confirming && <SubmitDialog mock={mock} state={state} onCancel={() => setConfirming(false)} onSubmit={submit} />}
    </div>
  );
}

export function Exam({ mockId }) {
  const { data: mock, error, retry } = useLoad(() => fetchMock(mockId), mockId);
  if (error) {
    return (
      <div className="sheet">
        <main className="page">
          <LoadError what="This mock" onRetry={retry} />
        </main>
      </div>
    );
  }
  if (!mock) {
    return (
      <div className="sheet">
        <main className="page">
          <Loading what="Loading the paper" />
        </main>
      </div>
    );
  }
  return <ExamConsole mock={mock} />;
}
