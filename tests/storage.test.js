import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

// A small stand-in for the browser's localStorage.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { addToHistory, exportProgress, importProgress, loadHistory, loadPracticeLog, loadStats, logPractice, recordAnswers, findInHistory } = await import('../src/lib/storage.js');

const attempt = (id, finishedAt) => ({ id, finishedAt, overall: { marks: 10 } });

beforeEach(() => store.clear());

test('history keeps attempts in order and finds them by id', () => {
  addToHistory(attempt('a', 1));
  addToHistory(attempt('b', 2));
  assert.deepEqual(loadHistory().map((h) => h.id), ['a', 'b']);
  assert.equal(findInHistory('b').finishedAt, 2);
  assert.equal(findInHistory('zzz'), null);
});

test('answers build up per question', () => {
  recordAnswers([{ id: 'q1', correct: true }]);
  recordAnswers([{ id: 'q1', correct: false }]);
  assert.deepEqual(loadStats().q1, { s: 2, c: 1, l: 0 });
});

test('a backup restores on a fresh device', () => {
  addToHistory(attempt('a', 1));
  recordAnswers([{ id: 'q1', correct: true }]);
  logPractice('cn', true);
  const backup = exportProgress();
  store.clear();
  assert.equal(importProgress(backup), 1);
  assert.deepEqual(loadHistory().map((h) => h.id), ['a']);
  assert.equal(loadStats().q1.c, 1);
  assert.equal(loadPracticeLog().cn.attempted, 1);
});

test('restoring the same backup twice changes nothing', () => {
  addToHistory(attempt('a', 1));
  logPractice('cn', true);
  const backup = exportProgress();
  assert.equal(importProgress(backup), 0);
  assert.equal(importProgress(backup), 0);
  assert.equal(loadHistory().length, 1);
  assert.equal(loadPracticeLog().cn.attempted, 1);
});

test('a restore merges with attempts already on this device, oldest first', () => {
  addToHistory(attempt('old', 1));
  const backup = exportProgress();
  store.clear();
  addToHistory(attempt('new', 5));
  assert.equal(importProgress(backup), 1);
  assert.deepEqual(loadHistory().map((h) => h.id), ['old', 'new']);
});

test('a file that is not a backup is refused and changes nothing', () => {
  addToHistory(attempt('a', 1));
  assert.throws(() => importProgress('not json'), /not a progress backup/);
  assert.throws(() => importProgress('{"hello":1}'), /not a progress backup/);
  assert.equal(loadHistory().length, 1);
});

test('broken storage does not crash reads', () => {
  store.set('dsssb.history', '{oops');
  assert.deepEqual(loadHistory(), []);
});
