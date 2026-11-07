// Turns the blueprint into exact numbers: how many low, same and high questions each
// topic needs in total, and how many of each difficulty a given mock takes from a topic.

export const LEVELS = ['low', 'same', 'high'];

/** Rounds fractional counts so they add up to `total`, giving spare units to the largest remainders. */
export function apportion(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (sum === 0 ? 0 : (total * w) / sum));
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => [x - Math.floor(x), i])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length) {
    out[order[k][1]] += 1;
    left -= 1;
  }
  return out;
}

export function mixFor(blueprint, section, level) {
  return level === 'same' ? section.sameMix : blueprint.mix[level];
}

/**
 * Plans, for one topic, the [easy, medium, hard] slots of every mock.
 * Rounding error is carried from mock to mock, so totals across a level stay on target
 * even when a topic has only one question per mock. `rotation` starts each topic on a
 * different mock, otherwise every topic's leftover medium question lands in the same paper.
 */
export function planTopic(blueprint, section, perMock, rotation = 0) {
  const plan = {};
  for (const level of LEVELS) {
    const inLevel = blueprint.mocks.filter((m) => m.level === level);
    const shift = inLevel.length ? rotation % inLevel.length : 0;
    const mocks = [...inLevel.slice(shift), ...inLevel.slice(0, shift)];
    const mix = mixFor(blueprint, section, level);
    const totals = apportion(perMock * mocks.length, mix);
    const given = [0, 0, 0];
    mocks.forEach((mock, i) => {
      const remainingMocks = mocks.length - i;
      const remaining = totals.map((t, d) => t - given[d]);
      const slots = apportion(perMock, remaining.map((r) => r / remainingMocks));
      slots.forEach((s, d) => {
        given[d] += s;
      });
      plan[mock.id] = slots;
    });
  }
  return plan;
}

/** Total [easy, medium, hard] a topic needs across all mocks. */
export function topicTargets(blueprint, section, perMock) {
  const plan = planTopic(blueprint, section, perMock);
  const totals = [0, 0, 0];
  for (const slots of Object.values(plan)) slots.forEach((s, d) => (totals[d] += s));
  return totals;
}
