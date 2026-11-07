// Loads and checks the authored question files in content/bank.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEVANAGARI = /[ऀ-ॿ]/;
const OPTION_REFERENCE = /\b(option|choice)\s*\(?[a-d1-4]\)?(?![a-z])/i;
const FIGURE_REFERENCE = /\b(figure|diagram|image|picture|shown below|graph below|chart below)\b/i;

export function sectionOfTopic(blueprint) {
  const map = {};
  for (const s of blueprint.sections) for (const t of Object.keys(s.topics)) map[t] = s.key;
  for (const t of Object.keys(blueprint.extras.topics)) map[t] = blueprint.extras.key;
  return map;
}

export function loadBankFiles(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  return files.map((file) => ({ file, data: JSON.parse(readFileSync(join(dir, file), 'utf8')) }));
}

function normalise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text) {
  return new Set(normalise(text).split(' ').filter((w) => w.length > 2));
}

function jaccard(a, b) {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

/** Returns { questions, passages, errors, warnings }. Errors must be fixed; warnings deserve a look. */
export function checkBank(files, blueprint) {
  const topicToSection = sectionOfTopic(blueprint);
  const errors = [];
  const warnings = [];
  const questions = [];
  const passages = {};
  const ids = new Set();

  for (const { file, data } of files) {
    if (!data || !Array.isArray(data.questions)) {
      errors.push(`${file}: expected an object with a "questions" array`);
      continue;
    }
    for (const [id, p] of Object.entries(data.passages ?? {})) {
      if (passages[id]) errors.push(`${file}: passage id ${id} is used twice`);
      if (!p.text || p.text.length < 80) errors.push(`${file}: passage ${id} has no usable text`);
      if (!['low', 'same', 'high'].includes(p.level)) errors.push(`${file}: passage ${id} needs level low, same or high`);
      passages[id] = { ...p, file };
    }
    for (const q of data.questions) {
      const where = `${file}: ${q.id ?? '(no id)'}`;
      if (!q.id) errors.push(`${where}: missing id`);
      if (ids.has(q.id)) errors.push(`${where}: duplicate id`);
      ids.add(q.id);
      const expected = topicToSection[q.topic];
      if (!expected) errors.push(`${where}: unknown topic "${q.topic}"`);
      if (q.sec !== expected) errors.push(`${where}: sec should be "${expected}", found "${q.sec}"`);
      if (![1, 2, 3].includes(q.d)) errors.push(`${where}: d must be 1, 2 or 3`);
      if (typeof q.q !== 'string' || q.q.trim().length < 5) errors.push(`${where}: question text is missing`);
      if (!Array.isArray(q.o) || q.o.length !== 4) {
        errors.push(`${where}: needs exactly 4 options`);
      } else {
        if (q.o.some((o) => typeof o !== 'string' || o.trim() === '')) errors.push(`${where}: empty option`);
        if (new Set(q.o.map((o) => String(o).trim().toLowerCase())).size !== 4) errors.push(`${where}: options repeat`);
      }
      if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) errors.push(`${where}: a must be 0, 1, 2 or 3`);
      if (typeof q.e !== 'string' || q.e.trim().length < 8) errors.push(`${where}: explanation is missing`);
      if (typeof q.e === 'string' && OPTION_REFERENCE.test(q.e)) {
        errors.push(`${where}: explanation names an option by position, but options are shuffled at build time`);
      }
      if (q.group && !data.passages?.[q.group]) errors.push(`${where}: group ${q.group} has no passage in the same file`);
      if (expected === 'hindi' && !DEVANAGARI.test(q.q + q.o?.join(''))) errors.push(`${where}: Hindi question has no Devanagari text`);
      if (FIGURE_REFERENCE.test(q.q ?? '') && !q.table && !q.chart && !q.code) {
        warnings.push(`${where}: mentions a figure or chart but carries none`);
      }
      if (q.chart) {
        const c = q.chart;
        const sizes = (c.series ?? []).map((s) => s.values?.length);
        if (!['bar', 'pie', 'line'].includes(c.type)) errors.push(`${where}: chart type must be bar, pie or line`);
        if (!Array.isArray(c.labels) || sizes.length === 0 || sizes.some((n) => n !== c.labels.length)) {
          errors.push(`${where}: chart labels and series values must be the same length`);
        }
      }
      if (q.table && (!Array.isArray(q.table.head) || !Array.isArray(q.table.rows))) {
        errors.push(`${where}: table needs head and rows arrays`);
      }
      questions.push({ ...q, file });
    }
  }

  // Exact repeats are errors; close paraphrases are warnings for a person to judge.
  // A passage is not compared, because its questions legitimately share one short stem.
  const seen = new Map();
  for (const q of questions) {
    if (q.group) continue;
    const key = normalise(q.q + (q.code ?? ''));
    if (seen.has(key)) errors.push(`${q.file}: ${q.id}: same question as ${seen.get(key)}`);
    else seen.set(key, q.id);
  }
  const bySection = {};
  for (const q of questions) {
    if (!q.group && !q.code && !q.chart && !q.table) (bySection[q.topic] ??= []).push({ q, w: words(q.q) });
  }
  for (const list of Object.values(bySection)) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (list[i].w.size >= 5 && jaccard(list[i].w, list[j].w) >= 0.8) {
          warnings.push(`${list[i].q.id} and ${list[j].q.id} look alike: "${list[i].q.q.slice(0, 60)}"`);
        }
      }
    }
  }

  return { questions, passages, errors, warnings };
}
