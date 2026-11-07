// Builds a practice set from the pool: same level mixes as the mocks, grouped passages kept together.

export const LEVELS = {
  low: { label: 'Low', mix: [0.8, 0.2, 0] },
  same: { label: 'Same as paper', mix: [0.5, 0.43, 0.07] },
  high: { label: 'High', mix: [0.1, 0.4, 0.5] },
};

export const DIFFICULTY_NAMES = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function matchesFilter(q, filter, stats) {
  const row = stats[q.id];
  if (filter === 'new') return !row;
  if (filter === 'wrong') return Boolean(row) && row.l === 0;
  return true;
}

export function availableCount(pool, { topics, filter }, stats) {
  return pool.filter((q) => topics.includes(q.topic) && matchesFilter(q, filter, stats)).length;
}

/**
 * Picks up to `count` questions by level. A passage's questions stay together and in order, and
 * count as a block, so the set can run slightly over `count` rather than cut a passage in half.
 */
export function buildPracticeSet(pool, { topics, level, count, filter }, stats, random = Math.random) {
  const eligible = pool.filter((q) => topics.includes(q.topic) && matchesFilter(q, filter, stats));

  const units = [];
  const groups = new Map();
  for (const q of eligible) {
    if (q.group) {
      if (!groups.has(q.group)) {
        const unit = [];
        groups.set(q.group, unit);
        units.push(unit);
      }
      groups.get(q.group).push(q);
    } else {
      units.push([q]);
    }
  }

  const byDifficulty = [[], [], []];
  for (const unit of shuffle(units, random)) {
    byDifficulty[unit[0].d - 1].push(unit);
  }

  const mix = LEVELS[level].mix;
  const wanted = mix.map((share) => Math.round(share * count));
  const picked = [];
  let size = 0;

  const takeFrom = (d, limit) => {
    while (limit > 0 && byDifficulty[d].length > 0 && size < count) {
      const unit = byDifficulty[d].shift();
      picked.push(unit);
      size += unit.length;
      limit -= unit.length;
    }
  };

  wanted.forEach((n, d) => takeFrom(d, n));
  // Top up from whatever is closest to the chosen level.
  const fallback = level === 'high' ? [2, 1, 0] : level === 'low' ? [0, 1, 2] : [1, 0, 2];
  for (const d of fallback) takeFrom(d, count - size);

  return shuffle(picked, random).flat();
}
