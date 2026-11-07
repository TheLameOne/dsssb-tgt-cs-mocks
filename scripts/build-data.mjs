#!/usr/bin/env node
// Builds the files the app loads: 10 mocks, the practice pool, and a manifest.
// Usage: node scripts/build-data.mjs            fail if a mock is short of questions
//        node scripts/build-data.mjs --partial  build anyway (for development)

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleMocks, shuffleOptions } from './lib/assemble.mjs';
import { checkBank, loadBankFiles } from './lib/bank.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const partial = process.argv.includes('--partial');
const blueprint = JSON.parse(readFileSync(join(root, 'content/blueprint.json'), 'utf8'));

// These two rehearsal mocks stay out of practice, so there are always unseen papers left.
export const REHEARSAL_MOCKS = ['mock-06', 'mock-07'];

const files = loadBankFiles(join(root, 'content/bank'));
const { questions, passages, errors } = checkBank(files, blueprint);
if (errors.length) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  console.error(`${errors.length} error(s). Fix these before building.`);
  process.exit(1);
}

const { mocks, shortfalls, leftovers } = assembleMocks(questions, passages, blueprint);
for (const l of leftovers) console.log(`note: ${l}`);
if (shortfalls.length) {
  for (const s of shortfalls) console.log(`${partial ? 'short' : 'ERROR'}: ${s}`);
  if (!partial) {
    console.error(`${shortfalls.length} shortfall(s). Mocks must be complete for a production build.`);
    process.exit(1);
  }
}

// A version tag that changes when any question changes.
const version = createHash('sha1').update(JSON.stringify(mocks)).digest('hex').slice(0, 10);

const outDir = join(root, 'public/data');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'mocks'), { recursive: true });
mkdirSync(join(outDir, 'practice'), { recursive: true });

for (const mock of mocks) {
  writeFileSync(join(outDir, 'mocks', `${mock.id}.json`), JSON.stringify({ ...mock, v: version }));
}

// Practice pool: every question not reserved for the rehearsal mocks, plus the extras.
const reserved = new Set(
  mocks.filter((m) => REHEARSAL_MOCKS.includes(m.id)).flatMap((m) => m.sections.flatMap((s) => s.questions.map((q) => q.id))),
);
const assignedMock = new Map(mocks.flatMap((m) => m.sections.flatMap((s) => s.questions.map((q) => [q.id, m.id]))));
const practiceSections = {};
for (const q of questions) {
  if (reserved.has(q.id)) continue;
  const { sec, file, ...rest } = shuffleOptions(q);
  (practiceSections[sec] ??= { questions: [], passages: {} }).questions.push(rest);
  if (q.group) {
    practiceSections[sec].passages[q.group] = { text: passages[q.group].text };
  }
}
for (const [sec, data] of Object.entries(practiceSections)) {
  writeFileSync(join(outDir, 'practice', `${sec}.json`), JSON.stringify(data));
}

function difficultyCounts(list) {
  const c = [0, 0, 0];
  for (const q of list) c[q.d - 1] += 1;
  return c;
}

const allSections = [...blueprint.sections, { ...blueprint.extras, part: 'Extra', count: 0 }];
const manifest = {
  v: version,
  exam: blueprint.exam,
  rehearsalMocks: REHEARSAL_MOCKS,
  mocks: mocks.map((m) => {
    const list = m.sections.flatMap((s) => s.questions);
    return { id: m.id, title: m.title, level: m.level, total: list.length, difficulty: difficultyCounts(list) };
  }),
  sections: allSections.map((s) => ({
    key: s.key,
    name: s.name,
    short: s.short,
    part: s.part,
    count: s.count,
    topics: Object.entries(s.topics).map(([key, t]) => ({
      key,
      name: t.name,
      perMock: t.perMock ?? 0,
      syllabus: t.syllabus,
      practice: difficultyCounts((practiceSections[s.key]?.questions ?? []).filter((q) => q.topic === key)),
    })),
  })),
  totalQuestions: questions.length,
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest));

// Report: the mix each mock really got.
console.log(`Built ${mocks.length} mocks and a practice pool from ${questions.length} questions (data version ${version}).`);
for (const m of manifest.mocks) {
  const [e, md, h] = m.difficulty;
  console.log(`  ${m.title.padEnd(8)} ${m.level.padEnd(5)} ${String(m.total).padStart(3)} questions  easy ${String(e).padStart(3)}  medium ${String(md).padStart(3)}  hard ${String(h).padStart(3)}`);
}
const unassigned = questions.filter((q) => q.sec !== blueprint.extras.key && !assignedMock.has(q.id)).length;
if (unassigned) console.log(`${unassigned} question(s) are in practice only (more than the mocks need).`);
