import { useEffect, useMemo, useState } from 'react';
import { LoadError, Loading } from '../components/Status.jsx';
import { fetchPractice } from '../lib/data.js';
import { availableCount, buildPracticeSet, LEVELS } from '../lib/practice.js';
import { go } from '../lib/router.js';
import { clearPracticeRun, loadPracticeLog, loadPracticeRun, loadStats, savePracticeRun } from '../lib/storage.js';
import { useLoad } from '../lib/useLoad.js';

const COUNTS = [10, 25, 50];
const FILTERS = [
  { key: 'all', label: 'All questions' },
  { key: 'new', label: 'Not seen yet' },
  { key: 'wrong', label: 'Got wrong last time' },
];

function Bubbles({ legend, name, value, options, onChange }) {
  return (
    <fieldset className="bubbles">
      <legend>{legend}</legend>
      <div className="bubble-row">
        {options.map((o) => (
          <label className="bubble-choice" key={o.value}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span className="choice-bubble" aria-hidden="true" />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Practice({ manifest, preset }) {
  const sections = manifest.sections;
  const [sectionKey, setSectionKey] = useState(() => (sections.some((s) => s.key === preset.section) ? preset.section : 'cs'));
  const section = sections.find((s) => s.key === sectionKey);
  const allTopicKeys = useMemo(() => section.topics.map((t) => t.key), [section]);
  const [topics, setTopics] = useState(() => (preset.topic && allTopicKeys.includes(preset.topic) ? [preset.topic] : allTopicKeys));
  const [level, setLevel] = useState('same');
  const [count, setCount] = useState(25);
  const [filter, setFilter] = useState('all');
  const [running, setRunning] = useState(loadPracticeRun);
  const log = useMemo(loadPracticeLog, []);
  const stats = useMemo(loadStats, []);

  const { data: pool, error, retry } = useLoad(() => fetchPractice(sectionKey), sectionKey);

  useEffect(() => {
    if (preset.section && preset.section !== sectionKey && sections.some((s) => s.key === preset.section)) {
      setSectionKey(preset.section);
      const target = sections.find((s) => s.key === preset.section);
      setTopics(preset.topic ? [preset.topic] : target.topics.map((t) => t.key));
    }
    // Follow "Practise" links from other pages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.section, preset.topic]);

  const pickSection = (key) => {
    setSectionKey(key);
    setTopics(sections.find((s) => s.key === key).topics.map((t) => t.key));
  };
  const toggleTopic = (key) => {
    setTopics((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  };

  const available = pool ? availableCount(pool.questions, { topics, filter }, stats) : 0;

  const start = () => {
    const questions = buildPracticeSet(pool.questions, { topics, level, count, filter }, stats);
    const groups = new Set(questions.map((q) => q.group).filter(Boolean));
    const passages = Object.fromEntries([...groups].map((g) => [g, pool.passages[g]]));
    savePracticeRun({ section: sectionKey, level, questions, passages, cur: 0, answers: {} });
    go('/practice/run');
  };

  return (
    <>
      <header className="page-head">
        <h1>Practice by topic and level</h1>
        <p className="lead">You see the answer and the reason after every question, so this is for learning, not timing.</p>
      </header>

      {running && running.questions?.length > 0 && (
        <div className="notice">
          <p>
            You have a practice set in progress, at question {Math.min(running.cur + 1, running.questions.length)} of {running.questions.length}.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href="#/practice/run">
              Continue
            </a>
            <button
              type="button"
              className="btn"
              onClick={() => {
                clearPracticeRun();
                setRunning(null);
              }}
            >
              Discard it
            </button>
          </div>
        </div>
      )}

      <div className="form-grid">
        <label className="field-block">
          <span className="field-title">Section</span>
          <select value={sectionKey} onChange={(e) => pickSection(e.target.value)}>
            {sections.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="topic-field">
          <legend>Topics</legend>
          <div className="btn-row-tight">
            <button type="button" className="btn-link" onClick={() => setTopics(allTopicKeys)}>
              Select all
            </button>
            <button type="button" className="btn-link" onClick={() => setTopics([])}>
              Clear all
            </button>
          </div>
          <ul className="topic-list">
            {section.topics.map((t) => {
              const row = log[t.key];
              const accuracy = row && row.attempted ? Math.round((row.correct / row.attempted) * 100) : null;
              return (
                <li key={t.key}>
                  <label className="check">
                    <input type="checkbox" checked={topics.includes(t.key)} onChange={() => toggleTopic(t.key)} />
                    <span>
                      <span lang={section.key === 'hindi' ? 'hi' : undefined}>{t.name}</span>
                      {accuracy !== null && <span className="small"> ({accuracy}% right so far)</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <Bubbles
          legend="Level"
          name="level"
          value={level}
          onChange={setLevel}
          options={Object.entries(LEVELS).map(([value, l]) => ({ value, label: l.label }))}
        />
        <Bubbles
          legend="How many questions"
          name="count"
          value={String(count)}
          onChange={(v) => setCount(Number(v))}
          options={COUNTS.map((c) => ({ value: String(c), label: String(c) }))}
        />
        <Bubbles legend="Which questions" name="filter" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ value: f.key, label: f.label }))} />
      </div>

      {error && <LoadError what="The practice questions" onRetry={retry} />}
      {!error && !pool && <Loading what="Loading questions" />}
      {pool && (
        <div className="start-box">
          <p>
            {available === 0
              ? 'No questions match these choices. Add a topic or choose "All questions".'
              : `${available} questions match. You will get up to ${count}.`}
          </p>
          <button type="button" className="btn btn-primary" disabled={available === 0} onClick={start}>
            Start practice
          </button>
        </div>
      )}

      <p className="small">
        {manifest.rehearsalMocks.length} mocks ({manifest.rehearsalMocks.map((id) => manifest.mocks.find((m) => m.id === id)?.title).join(' and ')}) are kept out of
        practice, so you always have unseen papers for rehearsal. Other mocks share questions with this pool.
      </p>
      {sectionKey === 'bonus' && (
        <p className="small">
          These topics are not named in the official 41/26 syllabus and did not appear in the DoE papers we analysed. Python did appear in the
          NDMC paper of 2024, so they are here as cheap insurance and are not used in the mocks.
        </p>
      )}
    </>
  );
}
