#!/usr/bin/env node
// Checks the question bank and shows how far each topic is from its target.
// Usage: node scripts/validate-bank.mjs            whole bank
//        node scripts/validate-bank.mjs cs-cn      only files whose name starts with cs-cn
//        node scripts/validate-bank.mjs --targets  print the targets and stop

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBank, loadBankFiles } from './lib/bank.mjs';
import { topicTargets } from './lib/plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blueprint = JSON.parse(readFileSync(join(root, 'content/blueprint.json'), 'utf8'));
const args = process.argv.slice(2);

const targets = {};
for (const section of blueprint.sections) {
  for (const [topic, t] of Object.entries(section.topics)) {
    targets[topic] = { section: section.key, name: t.name, perMock: t.perMock, need: topicTargets(blueprint, section, t.perMock) };
  }
}

if (args.includes('--targets')) {
  for (const [topic, t] of Object.entries(targets)) {
    console.log(`${t.section.padEnd(11)} ${topic.padEnd(15)} easy ${String(t.need[0]).padStart(3)}  medium ${String(t.need[1]).padStart(3)}  hard ${String(t.need[2]).padStart(3)}  total ${t.need.reduce((a, b) => a + b, 0)}`);
  }
  process.exit(0);
}

const prefix = args[0];
const all = loadBankFiles(join(root, 'content/bank'));
const files = prefix ? all.filter((f) => f.file.startsWith(prefix)) : all;
if (files.length === 0) {
  console.error(prefix ? `No bank file starts with "${prefix}".` : 'The bank is empty.');
  process.exit(1);
}

const { questions, errors, warnings } = checkBank(files, blueprint);

const counts = {};
for (const q of questions) {
  counts[q.topic] ??= [0, 0, 0];
  if ([1, 2, 3].includes(q.d)) counts[q.topic][q.d - 1] += 1;
}

console.log(`${questions.length} questions in ${files.length} file(s)`);
for (const topic of Object.keys(counts).sort()) {
  const have = counts[topic];
  const need = targets[topic]?.need;
  const gap = need ? ` (target ${need.join('/')})` : '';
  console.log(`  ${topic.padEnd(15)} easy/medium/hard ${have.join('/')}${gap}`);
}
if (!prefix) {
  const missing = Object.keys(targets).filter((t) => !counts[t]);
  if (missing.length) console.log(`No questions yet: ${missing.join(', ')}`);
}
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`ERROR: ${e}`);
if (errors.length) {
  console.log(`${errors.length} error(s)`);
  process.exit(1);
}
console.log('No errors.');
