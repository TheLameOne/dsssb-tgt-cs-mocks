import { useState } from 'react';
import { AnswerSheet } from '../components/AnswerSheet.jsx';
import { LoadError, Loading } from '../components/Status.jsx';
import { fetchManifest, fetchMock } from '../lib/data.js';
import { CATEGORIES, qualifyingCheck } from '../lib/exam.js';
import { duration, marks, percent, shortDate } from '../lib/format.js';
import { go } from '../lib/router.js';
import { findInHistory, loadSettings, saveSettings } from '../lib/storage.js';
import { useLoad } from '../lib/useLoad.js';

function Check({ ok, label, need, got }) {
  return (
    <li className={ok ? 'check-pass' : 'check-fail'}>
      <span className="check-icon" aria-hidden="true">
        {ok ? '✓' : '✕'}
      </span>
      <span>
        <b>{label}:</b> {marks(got)} of the {need} needed. {ok ? 'Cleared.' : 'Not cleared.'}
      </span>
    </li>
  );
}

function Qualifying({ summary }) {
  const [category, setCategory] = useState(() => loadSettings().category ?? 'general');
  const check = qualifyingCheck(summary, category);
  const change = (key) => {
    setCategory(key);
    saveSettings({ ...loadSettings(), category: key });
  };
  return (
    <section className="block">
      <h2>Would this qualify?</h2>
      <label className="inline-field">
        <span>Your category</span>
        <select value={category} onChange={(e) => change(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label} ({c.percent}%)
            </option>
          ))}
        </select>
      </label>
      <ul className="checks">
        <Check ok={check.passB} label="Section B" need={check.needB} got={summary.marksB} />
        <Check ok={check.passTotal} label="Both sections together" need={check.needTotal} got={summary.overall.marks} />
      </ul>
      <p className="small">
        Advertisement 03/2026 sets no minimum for Section A alone. These are minimums only. The cut-off for selection is
        usually higher, and multi-shift scores may be normalised. Ties go to whoever has more marks in Section B.
      </p>
    </section>
  );
}

export function Result({ attemptId }) {
  const summary = findInHistory(attemptId);
  const { data, error, retry } = useLoad(
    () => (summary ? Promise.all([fetchMock(summary.mockId), fetchManifest()]) : Promise.resolve(null)),
    attemptId,
  );

  if (!summary) {
    return (
      <div className="notice">
        <p>This result is not saved in this browser. Results stay on the device where you took the mock, unless you restore a backup.</p>
        <a className="btn" href="#/progress">
          Open your progress
        </a>
      </div>
    );
  }
  if (error) return <LoadError what="This result" onRetry={retry} />;
  if (!data) return <Loading what="Loading your result" />;
  const [mock, manifest] = data;

  const topicNames = {};
  for (const s of manifest.sections) for (const t of s.topics) topicNames[t.key] = { name: t.name, section: s.key };
  const weak = Object.entries(summary.topics)
    .filter(([, t]) => t.total >= 2)
    .map(([key, t]) => ({ key, ...t, lost: t.total - t.correct, name: topicNames[key]?.name ?? key, section: topicNames[key]?.section }))
    .sort((a, b) => b.lost / b.total - a.lost / a.total || b.lost - a.lost)
    .slice(0, 6);

  const o = summary.overall;
  const changed = summary.v !== mock.v;

  return (
    <>
      <section className="result-head">
        <p className="kicker">
          {summary.title}, finished {shortDate(summary.finishedAt)}
        </p>
        <h1 className="result-score">
          <span>{marks(o.marks)}</span> out of 200
        </h1>
        <p className="lead">
          {o.correct} correct, {o.wrong} wrong, {o.skipped} skipped. Accuracy {percent(o.accuracy)}. Time used {duration(summary.timeUsed)}.
        </p>
        <div className="btn-row">
          <a className="btn btn-primary" href={`#/review/${summary.id}?show=wrong`}>
            Review wrong answers
          </a>
          <a className="btn" href={`#/review/${summary.id}`}>
            Review the whole paper
          </a>
          <a className="btn" href={`#/mock/${summary.mockId}`}>
            Retake
          </a>
        </div>
      </section>

      {changed && <p className="notice">The questions in this mock have been updated since you took it, so the review may not match exactly.</p>}

      <Qualifying summary={summary} />

      <section className="block">
        <h2>By section</h2>
        <div className="table-scroll">
          <table className="data-table table-numbers">
            <thead>
              <tr>
                <th scope="col">Section</th>
                <th scope="col">Marks</th>
                <th scope="col">Correct</th>
                <th scope="col">Wrong</th>
                <th scope="col">Skipped</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Time</th>
              </tr>
            </thead>
            <tbody>
              {summary.sections.map((s) => (
                <tr key={s.key}>
                  <th scope="row">{s.short}</th>
                  <td>
                    {marks(s.marks)} / {s.total}
                  </td>
                  <td>{s.correct}</td>
                  <td>{s.wrong}</td>
                  <td>{s.skipped}</td>
                  <td>{s.accuracy === null ? 'None' : percent(s.accuracy)}</td>
                  <td>{duration(s.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="block">
        <h2>Your answer sheet</h2>
        <p className="small">Select a bubble to read that question and its explanation.</p>
        <AnswerSheet mock={mock} answers={summary.answers} onPick={(id) => go(`/review/${summary.id}?q=${id}`)} />
      </section>

      <section className="block">
        <h2>Where you lost the most</h2>
        <ul className="weak-list">
          {weak.map((t) => (
            <li key={t.key}>
              <span className="weak-name">{t.name}</span>
              <span className="weak-score">
                {t.correct} of {t.total}
              </span>
              <a href={`#/practice?section=${t.section}&topic=${t.key}`}>Practise</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
