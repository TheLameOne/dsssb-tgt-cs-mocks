// Everything the app remembers lives in this browser's localStorage.
// Reads and writes never throw, so a private window still runs the app, just without memory.

const PREFIX = 'dsssb.';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

export const loadAttempt = (mockId) => read(`attempt.${mockId}`, null);
export const saveAttempt = (attempt) => write(`attempt.${attempt.mockId}`, attempt);
export const clearAttempt = (mockId) => remove(`attempt.${mockId}`);

export const loadHistory = () => read('history', []);

export function addToHistory(summary) {
  const history = loadHistory();
  history.push(summary);
  return write('history', history);
}

export const findInHistory = (id) => loadHistory().find((h) => h.id === id) ?? null;

export const loadSettings = () => read('settings', { category: 'general' });
export const saveSettings = (settings) => write('settings', settings);

// Per-question record: { s: times seen, c: times correct, l: last result (1 right, 0 wrong) }.
export const loadStats = () => read('stats', {});

export function recordAnswers(results) {
  const stats = loadStats();
  for (const { id, correct } of results) {
    const row = stats[id] ?? { s: 0, c: 0, l: 0 };
    row.s += 1;
    if (correct) row.c += 1;
    row.l = correct ? 1 : 0;
    stats[id] = row;
  }
  write('stats', stats);
}

export const loadPracticeRun = () => read('practice-run', null);
export const savePracticeRun = (run) => write('practice-run', run);
export const clearPracticeRun = () => remove('practice-run');

export const loadPracticeLog = () => read('practice-log', {});

/** Adds one answered practice question to the per-topic totals. */
export function logPractice(topic, correct) {
  const log = loadPracticeLog();
  const row = log[topic] ?? { attempted: 0, correct: 0 };
  row.attempted += 1;
  if (correct) row.correct += 1;
  log[topic] = row;
  write('practice-log', log);
}

// Moving progress between devices

const BACKUP_KIND = 'dsssb-tgt-cs-progress';

export function exportProgress() {
  return JSON.stringify({
    kind: BACKUP_KIND,
    exportedAt: new Date().toISOString(),
    history: loadHistory(),
    stats: loadStats(),
    practiceLog: loadPracticeLog(),
    settings: loadSettings(),
  });
}

/** Merges a backup into this browser. Returns how many mock attempts were new, or throws with a readable message. */
export function importProgress(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a progress backup from this site.');
  }
  if (data?.kind !== BACKUP_KIND || !Array.isArray(data.history)) {
    throw new Error('That file is not a progress backup from this site.');
  }
  const history = loadHistory();
  const known = new Set(history.map((h) => h.id));
  const fresh = data.history.filter((h) => !known.has(h.id));
  const merged = [...history, ...fresh].sort((a, b) => a.finishedAt - b.finishedAt);
  write('history', merged);

  // Keep the higher count for each question and topic, so restoring twice cannot inflate totals.
  const stats = loadStats();
  for (const [id, row] of Object.entries(data.stats ?? {})) {
    if (!stats[id] || row.s > stats[id].s) stats[id] = row;
  }
  write('stats', stats);

  const log = loadPracticeLog();
  for (const [topic, row] of Object.entries(data.practiceLog ?? {})) {
    if (!log[topic] || row.attempted > log[topic].attempted) log[topic] = row;
  }
  write('practice-log', log);

  if (data.settings) write('settings', data.settings);
  return fresh.length;
}
