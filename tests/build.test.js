import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assembleMocks, shuffled, shuffleOptions } from '../scripts/lib/assemble.mjs';
import { checkBank } from '../scripts/lib/bank.mjs';
import { apportion, planTopic, topicTargets } from '../scripts/lib/plan.mjs';
import { readFileSync } from 'node:fs';

const blueprint = JSON.parse(readFileSync(new URL('../content/blueprint.json', import.meta.url), 'utf8'));

test('the blueprint is a 200-question paper with 100 in each part', () => {
  const total = blueprint.sections.reduce((sum, s) => sum + s.count, 0);
  assert.equal(total, 200);
  const partA = blueprint.sections.filter((s) => s.part === 'A').reduce((sum, s) => sum + s.count, 0);
  assert.equal(partA, 100);
});

test('every section\'s topic quotas add up to its question count', () => {
  for (const s of blueprint.sections) {
    const sum = Object.values(s.topics).reduce((a, t) => a + t.perMock, 0);
    assert.equal(sum, s.count, s.key);
  }
});

test('every official syllabus item is covered by a topic', () => {
  const cs = blueprint.sections.find((s) => s.key === 'cs');
  const covered = new Set(Object.values(cs.topics).flatMap((t) => t.syllabus));
  for (let n = 1; n <= 32; n += 1) assert.ok(covered.has(n), `syllabus item ${n}`);
  const method = blueprint.sections.find((s) => s.key === 'method');
  assert.equal(Object.keys(method.topics).length, 10);
});

test('apportion keeps the total exact', () => {
  assert.deepEqual(apportion(10, [0.5, 0.43, 0.07]), [5, 4, 1]);
  assert.equal(apportion(1, [0.1, 0.4, 0.5]).reduce((a, b) => a + b, 0), 1);
  assert.deepEqual(apportion(3, [0, 0, 0]).reduce((a, b) => a + b, 0), 3);
});

test('a topic plan gives every mock exactly its quota', () => {
  for (const section of blueprint.sections) {
    for (const t of Object.values(section.topics)) {
      const plan = planTopic(blueprint, section, t.perMock);
      for (const mock of blueprint.mocks) {
        assert.equal(plan[mock.id].reduce((a, b) => a + b, 0), t.perMock);
      }
      assert.equal(topicTargets(blueprint, section, t.perMock).reduce((a, b) => a + b, 0), t.perMock * blueprint.mocks.length);
    }
  }
});

test('shuffling is deterministic', () => {
  assert.deepEqual(shuffled([1, 2, 3, 4, 5], 'x'), shuffled([1, 2, 3, 4, 5], 'x'));
});

test('option shuffling keeps the answer pointing at the same text', () => {
  for (let i = 0; i < 200; i += 1) {
    const q = { id: `q${i}`, o: ['w', 'x', 'y', 'z'], a: i % 4 };
    const out = shuffleOptions(q);
    assert.equal(out.o[out.a], q.o[q.a]);
    assert.deepEqual([...out.o].sort(), ['w', 'x', 'y', 'z']);
  }
});

test('option shuffling is not biased towards one position', () => {
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < 4000; i += 1) {
    counts[shuffleOptions({ id: `n${i}`, o: ['a', 'b', 'c', 'd'], a: 1 }).a] += 1;
  }
  for (const c of counts) assert.ok(c > 800 && c < 1200, counts.join());
});

test('"None of these" and "No error" stay last', () => {
  for (let i = 0; i < 50; i += 1) {
    const out = shuffleOptions({ id: `k${i}`, o: ['None of these', 'x', 'y', 'z'], a: 0 });
    assert.equal(out.o[3], 'None of these');
    assert.equal(out.a, 3);
    assert.equal(shuffleOptions({ id: `e${i}`, o: ['No error', 'x', 'y', 'z'], a: 2 }).o[3], 'No error');
    assert.equal(shuffleOptions({ id: `h${i}`, o: ['इनमें से कोई नहीं', 'क', 'ख', 'ग'], a: 2 }).o[3], 'इनमें से कोई नहीं');
  }
});

test('"Both I and II" is not pinned, because real papers shuffle these too', () => {
  const positions = new Set();
  for (let i = 0; i < 100; i += 1) {
    const out = shuffleOptions({ id: `s${i}`, o: ['Only I', 'Only II', 'Both I and II', 'Neither I nor II'], a: 2 });
    positions.add(out.a);
  }
  assert.ok(positions.size > 1);
});

function fakeBlueprint() {
  return {
    mocks: [
      { id: 'm1', title: 'M1', level: 'low' },
      { id: 'm2', title: 'M2', level: 'same' },
      { id: 'm3', title: 'M3', level: 'high' },
    ],
    mix: { low: [1, 0, 0], high: [0, 0, 1] },
    sections: [
      {
        key: 'x',
        name: 'X',
        short: 'X',
        part: 'A',
        count: 7,
        sameMix: [0, 1, 0],
        topics: {
          t1: { name: 'T1', perMock: 2 },
          p: { name: 'Passage', perMock: 5, grouped: true },
        },
      },
    ],
    extras: { key: 'bonus', topics: {} },
  };
}

const item = (id, topic, d, group) => ({ id, sec: 'x', topic, d, q: `Question ${id}?`, o: ['a', 'b', 'c', 'd'], a: 1, e: 'Because it is.', group });

function fakeBank() {
  const questions = [
    ...['1', '2'].map((n) => item(`e${n}`, 't1', 1)),
    ...['1', '2'].map((n) => item(`m${n}`, 't1', 2)),
    ...['1', '2'].map((n) => item(`h${n}`, 't1', 3)),
  ];
  const passages = {};
  ['low', 'same', 'high'].forEach((level, i) => {
    const id = `p${i}`;
    passages[id] = { title: id, text: 'Passage text', level };
    for (let k = 0; k < 5; k += 1) questions.push(item(`${id}-${k}`, 'p', 1, id));
  });
  return { questions, passages };
}

test('assembly gives each mock its level, with no question used twice', () => {
  const { questions, passages } = fakeBank();
  const { mocks, shortfalls } = assembleMocks(questions, passages, fakeBlueprint());
  assert.deepEqual(shortfalls, []);
  const ids = mocks.flatMap((m) => m.sections.flatMap((s) => s.questions.map((q) => q.id)));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 21);
  const m1 = mocks[0].sections[0].questions.filter((q) => q.topic === 't1');
  assert.ok(m1.every((q) => q.d === 1));
  const m3 = mocks[2].sections[0].questions.filter((q) => q.topic === 't1');
  assert.ok(m3.every((q) => q.d === 3));
});

test('a passage stays whole, comes last, and matches the mock level', () => {
  const { questions, passages } = fakeBank();
  const { mocks } = assembleMocks(questions, passages, fakeBlueprint());
  const m = mocks[1];
  const list = m.sections[0].questions;
  assert.ok(list.slice(-5).every((q) => q.group === 'p1'));
  assert.ok(list.slice(0, 2).every((q) => !q.group));
  assert.deepEqual(Object.keys(m.passages), ['p1']);
});

test('a short pool is reported, and the nearest difficulty fills the gap', () => {
  const { questions, passages } = fakeBank();
  const noHard = questions.filter((q) => q.d !== 3);
  const { mocks, shortfalls } = assembleMocks(noHard, passages, fakeBlueprint());
  assert.ok(shortfalls.length > 0);
  const m3 = mocks[2].sections[0].questions.filter((q) => q.topic === 't1');
  assert.equal(m3.length, 2);
  assert.ok(m3.every((q) => q.d === 2));
});

const realBlueprintForCheck = {
  sections: [{ key: 'cs', topics: { cn: {} } }, { key: 'hindi', topics: { vilom: {} } }],
  extras: { key: 'bonus', topics: {} },
};
const good = { id: 'cn-001', sec: 'cs', topic: 'cn', d: 1, q: 'What is TCP?', o: ['a', 'b', 'c', 'd'], a: 0, e: 'Because TCP is a protocol.' };
const errorsFor = (q, extra = {}) => checkBank([{ file: 'f.json', data: { questions: [q], ...extra } }], realBlueprintForCheck).errors;

test('the checker accepts a good question', () => {
  assert.deepEqual(errorsFor(good), []);
});

test('the checker rejects broken questions', () => {
  assert.ok(errorsFor({ ...good, o: ['a', 'b', 'c'] }).length);
  assert.ok(errorsFor({ ...good, o: ['a', 'a', 'c', 'd'] }).length);
  assert.ok(errorsFor({ ...good, a: 4 }).length);
  assert.ok(errorsFor({ ...good, d: 5 }).length);
  assert.ok(errorsFor({ ...good, topic: 'nope' }).length);
  assert.ok(errorsFor({ ...good, sec: 'hindi' }).length);
  assert.ok(errorsFor({ ...good, e: '' }).length);
  assert.ok(errorsFor({ ...good, group: 'missing' }).length);
});

test('the checker rejects explanations that name a shuffled option', () => {
  assert.ok(errorsFor({ ...good, e: 'Option B is correct because of X.' }).length);
  assert.deepEqual(errorsFor({ ...good, e: 'The option list is long but TCP is right.' }), []);
});

test('the checker requires Devanagari in the Hindi section', () => {
  assert.ok(errorsFor({ ...good, id: 'vilom-001', sec: 'hindi', topic: 'vilom' }).length);
});

test('the checker catches the same question written twice', () => {
  const { errors } = checkBank([{ file: 'f.json', data: { questions: [good, { ...good, id: 'cn-002' }] } }], realBlueprintForCheck);
  assert.ok(errors.some((e) => e.includes('same question')));
});
