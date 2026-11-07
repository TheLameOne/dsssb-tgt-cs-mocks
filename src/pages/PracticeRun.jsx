import { useState } from 'react';
import { QuestionBody } from '../components/QuestionBody.jsx';
import { RichText } from '../components/RichText.jsx';
import { CORRECT_MARKS, WRONG_MARKS } from '../lib/exam.js';
import { marks, percent } from '../lib/format.js';
import { clearPracticeRun, loadPracticeRun, logPractice, recordAnswers, savePracticeRun } from '../lib/storage.js';
import { DIFFICULTY_NAMES } from '../lib/practice.js';
import { AnsweredOptions, Explanation } from './Review.jsx';

export function PracticeRun({ manifest }) {
  const [run, setRun] = useState(loadPracticeRun);

  if (!run || !run.questions?.length) {
    return (
      <div className="notice">
        <p>There is no practice set in progress.</p>
        <a className="btn btn-primary" href="#/practice">
          Choose a practice set
        </a>
      </div>
    );
  }

  const section = manifest.sections.find((s) => s.key === run.section);
  const hindi = run.section === 'hindi';
  const total = run.questions.length;
  const answered = run.questions.filter((q) => run.answers[q.id] !== undefined);
  const correct = answered.filter((q) => run.answers[q.id] === q.a).length;
  const wrong = answered.length - correct;
  const score = correct * CORRECT_MARKS - wrong * WRONG_MARKS;

  const update = (next) => {
    savePracticeRun(next);
    setRun(next);
  };

  if (run.cur >= total) {
    return (
      <article className="prose">
        <h1>Practice finished</h1>
        <p className="lead">
          {correct} right and {wrong} wrong out of {total}. Accuracy {percent(answered.length ? correct / answered.length : null)}. With exam marking that is{' '}
          {marks(score)} marks.
        </p>
        <h2>Questions you got wrong</h2>
        {wrong === 0 && <p>None. Try a higher level next.</p>}
        <ol className="review-list">
          {run.questions
            .filter((q) => run.answers[q.id] !== q.a)
            .map((q) => (
              <li className="review-item" key={q.id}>
                <QuestionBody question={q} passage={q.group ? run.passages[q.group] : null} hindi={hindi} />
                <AnsweredOptions question={q} given={run.answers[q.id]} hindi={hindi} />
                <Explanation question={q} hindi={hindi} />
              </li>
            ))}
        </ol>
        <div className="btn-row">
          <a
            className="btn btn-primary"
            href={`#/practice?section=${run.section}`}
            onClick={() => {
              clearPracticeRun();
            }}
          >
            Practise again
          </a>
          <a
            className="btn"
            href="#/progress"
            onClick={() => {
              clearPracticeRun();
            }}
          >
            See your progress
          </a>
        </div>
      </article>
    );
  }

  const q = run.questions[run.cur];
  const given = run.answers[q.id];
  const done = given !== undefined;
  const topicName = section?.topics.find((t) => t.key === q.topic)?.name ?? q.topic;

  const choose = (option) => {
    const isRight = option === q.a;
    recordAnswers([{ id: q.id, correct: isRight }]);
    logPractice(q.topic, isRight);
    update({ ...run, answers: { ...run.answers, [q.id]: option } });
  };

  const next = () => {
    window.scrollTo(0, 0);
    update({ ...run, cur: run.cur + 1 });
  };

  return (
    <article className="practice-run">
      <div className="practice-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={run.cur + 1} aria-label="Question">
        <span style={{ width: `${((run.cur + 1) / total) * 100}%` }} />
      </div>
      <div className="q-head">
        <h1 className="q-number">
          Question {run.cur + 1} of {total}
        </h1>
        <span className="q-marks">
          {correct} right, {wrong} wrong
        </span>
      </div>
      <p className="small">
        <span lang={hindi ? 'hi' : undefined}>{topicName}</span>, {DIFFICULTY_NAMES[q.d]}, ID {q.id}
      </p>

      <QuestionBody question={q} passage={q.group ? run.passages[q.group] : null} hindi={hindi} />

      {!done ? (
        <fieldset className="options" lang={hindi ? 'hi' : undefined}>
          <legend className="sr-only">Options</legend>
          {q.o.map((text, i) => (
            <label className="option" key={i}>
              <input type="radio" name={`p-${q.id}`} onChange={() => choose(i)} />
              <span className="option-bubble" aria-hidden="true">
                {i + 1}
              </span>
              <span className="option-text">
                <RichText text={text} />
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <>
          <AnsweredOptions question={q} given={given} hindi={hindi} />
          <Explanation question={q} hindi={hindi} />
        </>
      )}

      <div className="btn-row practice-actions">
        {done ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            {run.cur + 1 === total ? 'See how you did' : 'Next question'}
          </button>
        ) : (
          <p className="small">Choose an option to see the answer.</p>
        )}
        <a href="#/practice">Leave this set</a>
      </div>
    </article>
  );
}
