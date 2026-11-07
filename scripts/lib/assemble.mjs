// Assembles mocks from the checked question bank. Everything here is deterministic:
// the same bank always gives the same mocks, so saved attempts stay meaningful.

import { LEVELS, planTopic } from './plan.mjs';

/** Small seeded generator (mulberry32) seeded from a string. */
export function rng(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function shuffled(list, seedText) {
  const random = rng(seedText);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Options that make sense only in last place.
const STAY_LAST = [
  /\b(all|none|any|neither|both) of (the )?(above|these|them|the given|the options)\b/i,
  /^(all|none) of these$/i,
  /^no (error|improvement|correction)\b/i,
  /cannot be (determined|concluded)|data (is |are )?(in)?sufficient|insufficient data/i,
  /इनमें से कोई|उपर्युक्त|उपरोक्त|कोई त्रुटि नहीं|कोई अशुद्धि नहीं/,
];
// Options that refer to other options by position pin the whole order.
const POSITIONAL = /\b(option|options)\s*\(?[a-d1-4]\)?|\(?\b[a-d]\)?\s*(and|or|&)\s*\(?\b[a-d]\)?\s*$/i;

/** Returns the question with options reordered and `a` adjusted. */
export function shuffleOptions(q) {
  if (q.o.some((o) => POSITIONAL.test(o))) return q;
  const indexed = q.o.map((text, index) => ({ text, index }));
  const last = indexed.filter((x) => STAY_LAST.some((re) => re.test(x.text)));
  const rest = indexed.filter((x) => !last.includes(x));
  const order = [...shuffled(rest, `options:${q.id}`), ...last];
  return { ...q, o: order.map((x) => x.text), a: order.findIndex((x) => x.index === q.a) };
}

function publicQuestion(q) {
  const { sec, file, ...rest } = q;
  return rest;
}

/**
 * Removes up to `slots[d]` questions of each difficulty from the pools.
 * When a pool runs short, the nearest difficulty fills in, so a topic that is one
 * question off target still gives complete mocks.
 */
function take(pools, slots, nearest) {
  const picked = [];
  slots.forEach((count, d) => {
    for (let i = 0; i < count; i += 1) {
      const from = nearest[d].find((alt) => pools[alt].length > 0);
      if (from === undefined) return;
      picked.push(pools[from].shift());
    }
  });
  return picked;
}

const NEAREST = { 0: [0, 1, 2], 1: [1, 0, 2], 2: [2, 1, 0] };

/**
 * Returns { mocks, shortfalls, leftovers }.
 * mocks: one object per blueprint mock, with sections holding full question objects.
 */
export function assembleMocks(questions, passages, blueprint) {
  const byMock = Object.fromEntries(
    blueprint.mocks.map((m) => [m.id, { ...m, sections: blueprint.sections.map((s) => ({ key: s.key, plain: [], grouped: [] })), passages: {} }]),
  );
  const shortfalls = [];
  const leftovers = [];
  let topicNumber = 0;

  blueprint.sections.forEach((section, sectionIndex) => {
    for (const [topic, spec] of Object.entries(section.topics)) {
      topicNumber += 1;
      const inTopic = questions.filter((q) => q.topic === topic);

      if (spec.grouped) {
        const groupIds = [...new Set(inTopic.map((q) => q.group))].filter(Boolean);
        const byLevel = Object.fromEntries(
          LEVELS.map((level) => [level, shuffled(groupIds.filter((g) => passages[g].level === level), `groups:${topic}:${level}`)]),
        );
        for (const mock of blueprint.mocks) {
          const fallback = [mock.level, ...LEVELS.filter((l) => l !== mock.level)];
          const source = fallback.find((l) => byLevel[l].length > 0);
          if (!source) {
            shortfalls.push(`${mock.id}: no passage left for ${topic}`);
            continue;
          }
          const groupId = byLevel[source].shift();
          const groupQuestions = inTopic.filter((q) => q.group === groupId);
          if (groupQuestions.length !== spec.perMock) {
            shortfalls.push(`${mock.id}: passage ${groupId} has ${groupQuestions.length} questions, expected ${spec.perMock}`);
          }
          byMock[mock.id].sections[sectionIndex].grouped.push(...groupQuestions);
          // Titles stay in the source only: showing one would give away "choose a title" questions.
          byMock[mock.id].passages[groupId] = { text: passages[groupId].text };
        }
        const left = Object.values(byLevel).flat();
        if (left.length) leftovers.push(`${topic}: ${left.length} unused passage(s)`);
        continue;
      }

      const pools = [1, 2, 3].map((d) => shuffled(inTopic.filter((q) => q.d === d).sort((a, b) => (a.id < b.id ? -1 : 1)), `pool:${topic}:${d}`));
      const plan = planTopic(blueprint, section, spec.perMock, topicNumber);
      // Hard-heavy mocks choose first so scarce hard questions go where they are needed.
      const order = [...blueprint.mocks].sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level));
      for (const mock of order) {
        const picked = take(pools, plan[mock.id], NEAREST);
        byMock[mock.id].sections[sectionIndex].plain.push(...picked);
        if (picked.length < spec.perMock) {
          shortfalls.push(`${mock.id}: ${topic} has ${picked.length} of ${spec.perMock}`);
        }
      }
      const left = pools.flat().length;
      if (left) leftovers.push(`${topic}: ${left} unused`);
    }
  });

  const mocks = blueprint.mocks.map((m) => {
    const built = byMock[m.id];
    return {
      id: m.id,
      title: m.title,
      level: m.level,
      passages: built.passages,
      sections: blueprint.sections.map((s, i) => {
        const { plain, grouped } = built.sections[i];
        // Real papers mix topics inside a section and end language sections with the passage.
        const ordered = [...shuffled(plain, `order:${m.id}:${s.key}`), ...grouped];
        return {
          key: s.key,
          name: s.name,
          short: s.short,
          part: s.part,
          questions: ordered.map((q) => publicQuestion(shuffleOptions(q))),
        };
      }),
    };
  });

  return { mocks, shortfalls, leftovers };
}
