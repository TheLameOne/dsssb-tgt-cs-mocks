// Checks the real question bank and the real mocks, not sample data.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assembleMocks } from '../scripts/lib/assemble.mjs';
import { checkBank, loadBankFiles } from '../scripts/lib/bank.mjs';

const root = new URL('../', import.meta.url);
const blueprint = JSON.parse(readFileSync(new URL('content/blueprint.json', root), 'utf8'));
const files = loadBankFiles(fileURLToPath(new URL('content/bank/', root)));
const { questions, passages, errors } = checkBank(files, blueprint);
const { mocks, shortfalls } = assembleMocks(questions, passages, blueprint);
const original = Object.fromEntries(questions.map((q) => [q.id, q]));
const allOf = (mock) => mock.sections.flatMap((s) => s.questions);

test('the bank has no errors and every mock is complete', () => {
  assert.deepEqual(errors, []);
  assert.deepEqual(shortfalls, []);
  assert.equal(mocks.length, 10);
});

test('every mock follows the exact paper pattern', () => {
  for (const mock of mocks) {
    assert.equal(allOf(mock).length, 200, mock.id);
    assert.deepEqual(
      mock.sections.map((s) => [s.key, s.questions.length]),
      [['reasoning', 20], ['ga', 20], ['arithmetic', 20], ['english', 20], ['hindi', 20], ['cs', 90], ['method', 10]],
      mock.id,
    );
  }
});

test('every mock meets the topic quotas in the blueprint', () => {
  for (const mock of mocks) {
    for (const section of blueprint.sections) {
      const list = mock.sections.find((s) => s.key === section.key).questions;
      for (const [topic, spec] of Object.entries(section.topics)) {
        assert.equal(list.filter((q) => q.topic === topic).length, spec.perMock, `${mock.id} ${topic}`);
      }
    }
  }
});

test('no question appears in two mocks', () => {
  const ids = mocks.flatMap((m) => allOf(m).map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 2000);
});

test('shuffling keeps every answer pointing at the original correct option', () => {
  for (const q of mocks.flatMap(allOf)) {
    const source = original[q.id];
    assert.equal(q.o[q.a], source.o[source.a], q.id);
    assert.deepEqual([...q.o].sort(), [...source.o].sort(), q.id);
  }
});

test('correct answers are spread evenly across the four positions', () => {
  const positions = [0, 0, 0, 0];
  for (const q of mocks.flatMap(allOf)) positions[q.a] += 1;
  for (const count of positions) assert.ok(count > 420 && count < 590, positions.join());
});

test('each language section ends with one whole passage, and its text is in the mock', () => {
  for (const mock of mocks) {
    for (const key of ['english', 'hindi']) {
      const list = mock.sections.find((s) => s.key === key).questions;
      const lastFive = list.slice(-5);
      assert.ok(lastFive[0].group, `${mock.id} ${key}`);
      assert.ok(lastFive.every((q) => q.group === lastFive[0].group), `${mock.id} ${key}`);
      assert.ok(list.slice(0, 15).every((q) => !q.group), `${mock.id} ${key}`);
      assert.ok(mock.passages[lastFive[0].group]?.text.length > 80, `${mock.id} ${key}`);
    }
  }
});

test('passage titles never reach the app, because they give away "choose a title" questions', () => {
  for (const mock of mocks) {
    for (const p of Object.values(mock.passages)) assert.equal(p.title, undefined);
  }
});

function shareOfHard(mock) {
  const list = allOf(mock);
  return list.filter((q) => q.d === 3).length / list.length;
}

test('difficulty rises from Low to Same to High, and is even within a level', () => {
  const byLevel = (level) => mocks.filter((m) => m.level === level);
  for (const m of byLevel('low')) assert.equal(shareOfHard(m), 0, m.id);
  for (const m of byLevel('same')) assert.ok(shareOfHard(m) > 0.07 && shareOfHard(m) < 0.2, m.id);
  for (const m of byLevel('high')) assert.ok(shareOfHard(m) > 0.4 && shareOfHard(m) < 0.6, m.id);
  for (const level of ['low', 'same', 'high']) {
    const easy = byLevel(level).map((m) => allOf(m).filter((q) => q.d === 1).length);
    assert.ok(Math.max(...easy) - Math.min(...easy) <= 8, `${level}: ${easy}`);
  }
});

test('the mock order is stable for the same bank', () => {
  const again = assembleMocks(questions, passages, blueprint).mocks;
  assert.deepEqual(again.map((m) => allOf(m).map((q) => q.id)), mocks.map((m) => allOf(m).map((q) => q.id)));
});
