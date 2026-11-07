import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availableCount, buildPracticeSet } from '../src/lib/practice.js';

const make = (id, topic, d, group) => ({ id, topic, d, group, o: ['a', 'b', 'c', 'd'], a: 0 });

function pool() {
  const list = [];
  for (let i = 0; i < 40; i += 1) list.push(make(`e${i}`, 't1', 1));
  for (let i = 0; i < 40; i += 1) list.push(make(`m${i}`, 't1', 2));
  for (let i = 0; i < 40; i += 1) list.push(make(`h${i}`, 't1', 3));
  for (let i = 0; i < 10; i += 1) list.push(make(`x${i}`, 't2', 1));
  return list;
}

function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const count = (set, d) => set.filter((q) => q.d === d).length;
const base = { topics: ['t1'], count: 50, filter: 'all' };

test('the Low level is mostly easy with no hard questions', () => {
  const set = buildPracticeSet(pool(), { ...base, level: 'low' }, {}, seeded());
  assert.equal(set.length, 50);
  assert.equal(count(set, 1), 40);
  assert.equal(count(set, 2), 10);
  assert.equal(count(set, 3), 0);
});

test('the High level is half hard', () => {
  const set = buildPracticeSet(pool(), { ...base, level: 'high' }, {}, seeded());
  assert.equal(count(set, 3), 25);
  assert.equal(count(set, 2), 20);
  assert.equal(count(set, 1), 5);
});

test('the Same level follows the paper mix', () => {
  const set = buildPracticeSet(pool(), { ...base, level: 'same' }, {}, seeded());
  assert.equal(set.length, 50);
  assert.ok(count(set, 1) >= 24 && count(set, 1) <= 26);
  assert.ok(count(set, 3) >= 3 && count(set, 3) <= 4);
});

test('no question repeats in a set', () => {
  const set = buildPracticeSet(pool(), { ...base, level: 'same' }, {}, seeded());
  assert.equal(new Set(set.map((q) => q.id)).size, set.length);
});

test('a short pool tops up from the nearest difficulty', () => {
  const easyOnly = pool().filter((q) => q.d === 1 && q.topic === 't1');
  const set = buildPracticeSet(easyOnly, { ...base, level: 'high' }, {}, seeded());
  assert.equal(set.length, 40);
});

test('only chosen topics are used', () => {
  const set = buildPracticeSet(pool(), { ...base, topics: ['t2'], level: 'low' }, {}, seeded());
  assert.equal(set.length, 10);
  assert.ok(set.every((q) => q.topic === 't2'));
});

test('filters use the saved record', () => {
  const stats = { e0: { s: 1, c: 0, l: 0 }, e1: { s: 2, c: 2, l: 1 } };
  assert.equal(availableCount(pool(), { topics: ['t1'], filter: 'wrong' }, stats), 1);
  assert.equal(availableCount(pool(), { topics: ['t1'], filter: 'new' }, stats), 118);
  assert.equal(availableCount(pool(), { topics: ['t1'], filter: 'all' }, stats), 120);
  const wrong = buildPracticeSet(pool(), { ...base, filter: 'wrong', level: 'low' }, stats, seeded());
  assert.deepEqual(wrong.map((q) => q.id), ['e0']);
});

test('a passage stays whole and in order', () => {
  const list = [make('p-1', 't', 1, 'p'), make('p-2', 't', 1, 'p'), make('p-3', 't', 2, 'p'), make('p-4', 't', 1, 'p'), make('p-5', 't', 3, 'p')];
  for (let i = 0; i < 10; i += 1) list.push(make(`s${i}`, 't', 1));
  for (let seed = 1; seed < 30; seed += 1) {
    const set = buildPracticeSet(list, { topics: ['t'], level: 'low', count: 15, filter: 'all' }, {}, seeded(seed));
    const at = set.findIndex((q) => q.group === 'p');
    assert.ok(at >= 0);
    assert.deepEqual(set.slice(at, at + 5).map((q) => q.id), ['p-1', 'p-2', 'p-3', 'p-4', 'p-5']);
  }
});
