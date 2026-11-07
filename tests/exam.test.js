import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countStatuses,
  flatten,
  newAttempt,
  qualifyingCheck,
  reduceAttempt,
  statusOf,
  STATUS,
  summarise,
  tally,
} from '../src/lib/exam.js';

const q = (id, a = 0, topic = 't') => ({ id, a, topic, o: ['1', '2', '3', '4'] });
const mock = {
  id: 'mock-x',
  v: 'test',
  title: 'Mock X',
  level: 'same',
  sections: [
    { key: 's1', short: 'One', part: 'A', questions: [q('a'), q('b', 1)] },
    { key: 's2', short: 'Two', part: 'B', questions: [q('c', 2), q('d', 3)] },
  ],
};
const order = flatten(mock);
const start = () => newAttempt(mock, 1000);
const act = (state, ...actions) => actions.reduce((s, a) => reduceAttempt(s, a, order), state);

test('a new attempt starts on the first question with two hours', () => {
  const s = start();
  assert.equal(s.remaining, 7200);
  assert.equal(s.cur, 0);
  assert.equal(statusOf(s, 'a'), STATUS.NOT_ANSWERED);
  assert.equal(statusOf(s, 'b'), STATUS.NOT_VISITED);
});

test('Save & Next stores the choice and moves on', () => {
  const s = act(start(), { type: 'select', option: 2 }, { type: 'saveNext' });
  assert.equal(s.saved.a, 2);
  assert.equal(s.cur, 1);
  assert.equal(statusOf(s, 'a'), STATUS.ANSWERED);
  assert.equal(statusOf(s, 'b'), STATUS.NOT_ANSWERED);
});

test('jumping away without saving discards the choice, as the real console does', () => {
  const s = act(start(), { type: 'select', option: 2 }, { type: 'goto', index: 2 });
  assert.equal(s.saved.a, undefined);
  assert.equal(s.discarded, true);
  assert.equal(statusOf(s, 'a'), STATUS.NOT_ANSWERED);
});

test('jumping away from an already saved answer keeps that answer', () => {
  const s = act(start(), { type: 'select', option: 2 }, { type: 'saveNext' }, { type: 'goto', index: 0 }, { type: 'select', option: 3 }, { type: 'goto', index: 1 });
  assert.equal(s.saved.a, 2);
  assert.equal(s.discarded, true);
});

test('jumping away with nothing changed raises no warning', () => {
  const s = act(start(), { type: 'goto', index: 2 });
  assert.equal(s.discarded, false);
});

test('returning to a saved question shows its saved choice', () => {
  const s = act(start(), { type: 'select', option: 1 }, { type: 'saveNext' }, { type: 'goto', index: 0 });
  assert.equal(s.draft, 1);
});

test('Mark for Review & Next with a choice counts as answered and marked', () => {
  const s = act(start(), { type: 'select', option: 0 }, { type: 'markNext' });
  assert.equal(statusOf(s, 'a'), STATUS.ANSWERED_MARKED);
  assert.equal(s.saved.a, 0);
});

test('Mark for Review & Next with no choice is marked only', () => {
  const s = act(start(), { type: 'markNext' });
  assert.equal(statusOf(s, 'a'), STATUS.MARKED);
  assert.equal(s.saved.a, undefined);
});

test('Save & Next removes a review mark', () => {
  const s = act(start(), { type: 'markNext' }, { type: 'goto', index: 0 }, { type: 'select', option: 1 }, { type: 'saveNext' });
  assert.equal(statusOf(s, 'a'), STATUS.ANSWERED);
});

test('Clear Response removes a saved answer', () => {
  const s = act(start(), { type: 'select', option: 1 }, { type: 'saveNext' }, { type: 'goto', index: 0 }, { type: 'clear' });
  assert.equal(s.saved.a, undefined);
  assert.equal(s.draft, null);
});

test('Save & Next on the last question wraps round to the first', () => {
  const s = act(start(), { type: 'goto', index: 3 }, { type: 'saveNext' });
  assert.equal(s.cur, 0);
});

test('Save & Next crosses into the next section', () => {
  const s = act(start(), { type: 'saveNext' }, { type: 'saveNext' });
  assert.equal(order[s.cur].sectionIndex, 1);
});

test('the clock counts down, stops at zero and charges the current question', () => {
  let s = act(start(), { type: 'tick', seconds: 5 });
  assert.equal(s.remaining, 7195);
  assert.equal(s.spent.a, 5);
  s = act(s, { type: 'tick', seconds: 10000 });
  assert.equal(s.remaining, 0);
});

test('status counts add up', () => {
  const s = act(start(), { type: 'select', option: 0 }, { type: 'saveNext' }, { type: 'markNext' });
  const counts = countStatuses(s, order.map((o) => o.question));
  assert.deepEqual(counts, { 'not-visited': 1, 'not-answered': 1, answered: 1, marked: 1, 'answered-marked': 0 });
});

test('marking: +1 correct, -0.25 wrong, 0 skipped', () => {
  const qs = [q('a', 0), q('b', 1), q('c', 2), q('d', 3)];
  const t = tally(qs, { a: 0, b: 0, c: 2 });
  assert.equal(t.correct, 2);
  assert.equal(t.wrong, 1);
  assert.equal(t.skipped, 1);
  assert.equal(t.marks, 1.75);
  assert.equal(t.accuracy, 2 / 3);
});

test('a skipped paper scores zero with no accuracy figure', () => {
  const t = tally([q('a')], {});
  assert.equal(t.marks, 0);
  assert.equal(t.accuracy, null);
});

test('option index 0 counts as an answer', () => {
  assert.equal(tally([q('a', 0)], { a: 0 }).correct, 1);
});

test('summary splits Section A and Section B marks', () => {
  const s = act(start(), { type: 'select', option: 0 }, { type: 'saveNext' }, { type: 'select', option: 0 }, { type: 'saveNext' }, { type: 'select', option: 2 }, { type: 'saveNext' });
  const summary = summarise(mock, s, 5000);
  assert.equal(summary.marksA, 0.75);
  assert.equal(summary.marksB, 1);
  assert.equal(summary.overall.marks, 1.75);
  assert.equal(summary.topics.t.correct, 2);
  assert.equal(summary.topics.t.attempted, 3);
});

test('qualifying check uses Section B and the combined marks, not Section A', () => {
  const pass = { marksA: 5, marksB: 76, overall: { marks: 81 } };
  assert.deepEqual(
    (({ passB, passTotal, needB, needTotal }) => ({ passB, passTotal, needB, needTotal }))(qualifyingCheck(pass, 'general')),
    { passB: true, passTotal: true, needB: 40, needTotal: 80 },
  );
  const lowB = { marksA: 95, marksB: 35, overall: { marks: 130 } };
  assert.equal(qualifyingCheck(lowB, 'general').passB, false);
  assert.equal(qualifyingCheck(lowB, 'general').passTotal, true);
  assert.equal(qualifyingCheck(lowB, 'obc').passB, true);
  assert.equal(qualifyingCheck(lowB, 'reserved').needTotal, 60);
});
