import { useMemo, useRef, useState } from 'react';
import { duration, marks, percent, shortDate } from '../lib/format.js';
import { exportProgress, importProgress, loadHistory, loadPracticeLog } from '../lib/storage.js';
import { LEVEL_INFO } from '../data/levels.js';

function ScoreTrend({ history }) {
  if (history.length < 2) return null;
  const width = 640;
  const height = 180;
  const pad = { left: 36, right: 16, top: 16, bottom: 22 };
  const ticks = [0, 50, 100, 150, 200];
  const x = (i) => pad.left + (i * (width - pad.left - pad.right)) / (history.length - 1);
  const y = (v) => pad.top + ((200 - Math.max(0, v)) / 200) * (height - pad.top - pad.bottom);
  const best = history.reduce((a, h) => Math.max(a, h.overall.marks), -Infinity);
  return (
    <figure className="trend">
      <figcaption className="chart-title">Marks out of 200, oldest attempt on the left</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg" role="img" aria-label={`Marks in ${history.length} attempts. Full list in the table below.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? 'chart-axis' : 'chart-grid'} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
              {t}
            </text>
          </g>
        ))}
        <polyline
          points={history.map((h, i) => `${x(i).toFixed(1)},${y(h.overall.marks).toFixed(1)}`).join(' ')}
          fill="none"
          stroke="var(--pen)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {history.map((h, i) => {
          const isEnd = i === history.length - 1;
          const isBest = h.overall.marks === best;
          return (
            <g key={h.id}>
              <circle cx={x(i)} cy={y(h.overall.marks)} r="4" fill="var(--pen)" stroke="var(--paper)" strokeWidth="2">
                <title>
                  {h.title}: {marks(h.overall.marks)}
                </title>
              </circle>
              <circle cx={x(i)} cy={y(h.overall.marks)} r="12" fill="transparent">
                <title>
                  {h.title}: {marks(h.overall.marks)}
                </title>
              </circle>
              {(isEnd || isBest) && (
                <text x={x(i)} y={y(h.overall.marks) - 10} textAnchor={isEnd ? 'end' : i === 0 ? 'start' : 'middle'} className="trend-label">
                  {marks(h.overall.marks)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function BarRow({ label, value, detail, action, lang }) {
  return (
    <li className="meter-row">
      <div className="meter-head">
        <span lang={lang}>{label}</span>
        <b>{value === null ? 'None attempted' : `${Math.round(value * 100)}%`}</b>
      </div>
      <span className="meter" aria-hidden="true">
        <span style={{ width: `${(value ?? 0) * 100}%` }} />
      </span>
      <div className="meter-foot">
        <span className="small">{detail}</span>
        {action}
      </div>
    </li>
  );
}

function Backup({ onRestored }) {
  const [message, setMessage] = useState(null);
  const input = useRef(null);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsssb-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: 'Backup downloaded. Open this page on your other device and restore it there.' });
  };

  const restore = async (file) => {
    try {
      const added = importProgress(await file.text());
      setMessage({ ok: true, text: `Backup restored. ${added} new mock ${added === 1 ? 'attempt' : 'attempts'} added.` });
      onRestored();
    } catch (error) {
      setMessage({ ok: false, text: error.message });
    }
    if (input.current) input.current.value = '';
  };

  return (
    <section className="block">
      <h2>Move your progress to another device</h2>
      <p>Progress is saved only in this browser, with no account or server. To carry it over, download a backup here and restore it on the other device.</p>
      <div className="btn-row">
        <button type="button" className="btn" onClick={download}>
          Download backup
        </button>
        <label className="btn">
          Restore from a backup
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.[0]) restore(e.target.files[0]);
            }}
          />
        </label>
      </div>
      {message && (
        <p className={message.ok ? 'notice' : 'notice notice-error'} role="status">
          {message.text}
        </p>
      )}
    </section>
  );
}

export function Progress({ manifest }) {
  const [revision, setRevision] = useState(0);
  const history = useMemo(() => loadHistory(), [revision]);
  const practice = useMemo(() => loadPracticeLog(), [revision]);

  const sections = useMemo(() => {
    const totals = {};
    for (const h of history) {
      for (const s of h.sections) {
        totals[s.key] ??= { key: s.key, short: s.short, attempted: 0, correct: 0, total: 0 };
        totals[s.key].attempted += s.attempted;
        totals[s.key].correct += s.correct;
        totals[s.key].total += s.total;
      }
    }
    return Object.values(totals);
  }, [history]);

  const topics = useMemo(() => {
    const totals = {};
    const add = (key, attempted, correct) => {
      totals[key] ??= { attempted: 0, correct: 0 };
      totals[key].attempted += attempted;
      totals[key].correct += correct;
    };
    for (const h of history) for (const [key, t] of Object.entries(h.topics)) add(key, t.attempted, t.correct);
    for (const [key, t] of Object.entries(practice)) add(key, t.attempted, t.correct);
    const rows = [];
    for (const s of manifest.sections) {
      for (const t of s.topics) {
        const row = totals[t.key];
        if (row && row.attempted >= 3) rows.push({ key: t.key, name: t.name, section: s.key, short: s.short, ...row, accuracy: row.correct / row.attempted });
      }
    }
    return rows.sort((a, b) => a.accuracy - b.accuracy);
  }, [history, practice, manifest]);

  const attempted = history.length > 0 || Object.keys(practice).length > 0;

  return (
    <>
      <header className="page-head">
        <h1>Your progress</h1>
      </header>

      {!attempted && (
        <div className="notice">
          <p>Nothing here yet. Finish a mock or a practice set, and your scores and weak topics will show up on this page.</p>
          <a className="btn btn-primary" href="#/">
            Choose a mock
          </a>
        </div>
      )}

      {history.length > 0 && (
        <section className="block">
          <h2>Mock scores</h2>
          <ScoreTrend history={history} />
          <div className="table-scroll">
            <table className="data-table table-numbers">
              <thead>
                <tr>
                  <th scope="col">Mock</th>
                  <th scope="col">Level</th>
                  <th scope="col">Date</th>
                  <th scope="col">Marks</th>
                  <th scope="col">Section B</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h) => (
                  <tr key={h.id}>
                    <th scope="row">
                      <a href={`#/result/${h.id}`}>{h.title}</a>
                    </th>
                    <td>{LEVEL_INFO[h.level]?.name}</td>
                    <td>{shortDate(h.finishedAt)}</td>
                    <td>{marks(h.overall.marks)}</td>
                    <td>{marks(h.marksB)}</td>
                    <td>{percent(h.overall.accuracy)}</td>
                    <td>{duration(h.timeUsed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sections.length > 0 && (
        <section className="block">
          <h2>Accuracy by section, across all mocks</h2>
          <ul className="meter-list">
            {sections.map((s) => (
              <BarRow
                key={s.key}
                label={s.short}
                value={s.attempted ? s.correct / s.attempted : null}
                detail={`${s.correct} right of ${s.attempted} attempted, out of ${s.total} seen`}
              />
            ))}
          </ul>
        </section>
      )}

      {topics.length > 0 && (
        <section className="block">
          <h2>Weakest topics first</h2>
          <p className="small">Includes mocks and practice, for topics with at least 3 questions attempted.</p>
          <ul className="meter-list">
            {topics.slice(0, 15).map((t) => (
              <BarRow
                key={t.key}
                label={t.name}
                lang={t.section === 'hindi' ? 'hi' : undefined}
                value={t.accuracy}
                detail={`${t.short}: ${t.correct} right of ${t.attempted}`}
                action={<a href={`#/practice?section=${t.section}&topic=${t.key}`}>Practise</a>}
              />
            ))}
          </ul>
        </section>
      )}

      <Backup onRestored={() => setRevision((r) => r + 1)} />
    </>
  );
}
