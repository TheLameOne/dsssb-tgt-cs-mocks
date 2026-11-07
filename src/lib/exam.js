// The exam console's rules, kept free of React so they can be tested on their own.
// They copy the behaviour of the real DSSSB computer-based test:
// - An answer counts only once it is saved with "Save & Next" or "Mark for Review & Next".
// - Jumping to another question without saving throws the unsaved choice away.
// - Answered questions that are marked for review are still evaluated.

export const CORRECT_MARKS = 1;
export const WRONG_MARKS = 0.25;

export function flatten(mock) {
  const list = [];
  mock.sections.forEach((section, sectionIndex) => {
    section.questions.forEach((question, indexInSection) => {
      list.push({ question, sectionIndex, indexInSection, flatIndex: list.length });
    });
  });
  return list;
}

export function newAttempt(mock, now = Date.now()) {
  const first = mock.sections[0].questions[0].id;
  return {
    mockId: mock.id,
    v: mock.v,
    startedAt: now,
    remaining: (mock.durationMin ?? 120) * 60,
    cur: 0,
    draft: null,
    saved: {},
    marked: {},
    visited: { [first]: true },
    spent: {},
    discarded: false,
  };
}

function moveTo(state, order, index) {
  const q = order[index].question;
  return {
    ...state,
    cur: index,
    draft: state.saved[q.id] ?? null,
    visited: { ...state.visited, [q.id]: true },
  };
}

/** Pure reducer. `order` is the result of flatten(mock). */
export function reduceAttempt(state, action, order) {
  const q = order[state.cur].question;
  const nextIndex = state.cur + 1 < order.length ? state.cur + 1 : 0;

  switch (action.type) {
    case 'select':
      return { ...state, draft: action.option, discarded: false };

    case 'clear': {
      const saved = { ...state.saved };
      delete saved[q.id];
      return { ...state, draft: null, saved, discarded: false };
    }

    case 'saveNext': {
      const saved = { ...state.saved };
      if (state.draft !== null) saved[q.id] = state.draft;
      else delete saved[q.id];
      const marked = { ...state.marked };
      delete marked[q.id];
      return { ...moveTo({ ...state, saved, marked }, order, nextIndex), discarded: false };
    }

    case 'markNext': {
      const saved = { ...state.saved };
      if (state.draft !== null) saved[q.id] = state.draft;
      else delete saved[q.id];
      return { ...moveTo({ ...state, saved, marked: { ...state.marked, [q.id]: true } }, order, nextIndex), discarded: false };
    }

    case 'goto': {
      if (action.index === state.cur) return state;
      const unsaved = state.draft !== (state.saved[q.id] ?? null);
      return { ...moveTo(state, order, action.index), discarded: unsaved };
    }

    case 'tick': {
      const seconds = action.seconds;
      return {
        ...state,
        remaining: Math.max(0, state.remaining - seconds),
        spent: { ...state.spent, [q.id]: (state.spent[q.id] ?? 0) + seconds },
      };
    }

    default:
      return state;
  }
}

export const STATUS = {
  NOT_VISITED: 'not-visited',
  NOT_ANSWERED: 'not-answered',
  ANSWERED: 'answered',
  MARKED: 'marked',
  ANSWERED_MARKED: 'answered-marked',
};

export function statusOf(state, questionId) {
  const answered = state.saved[questionId] !== undefined;
  const marked = Boolean(state.marked[questionId]);
  if (answered && marked) return STATUS.ANSWERED_MARKED;
  if (marked) return STATUS.MARKED;
  if (answered) return STATUS.ANSWERED;
  if (state.visited[questionId]) return STATUS.NOT_ANSWERED;
  return STATUS.NOT_VISITED;
}

export function countStatuses(state, questions) {
  const counts = { 'not-visited': 0, 'not-answered': 0, answered: 0, marked: 0, 'answered-marked': 0 };
  for (const q of questions) counts[statusOf(state, q.id)] += 1;
  return counts;
}

/** Marks for a set of questions and answers: +1 for correct, -0.25 for wrong, 0 for skipped. */
export function tally(questions, answers) {
  let correct = 0;
  let wrong = 0;
  for (const q of questions) {
    const given = answers[q.id];
    if (given === undefined || given === null) continue;
    if (given === q.a) correct += 1;
    else wrong += 1;
  }
  const attempted = correct + wrong;
  return {
    total: questions.length,
    attempted,
    correct,
    wrong,
    skipped: questions.length - attempted,
    marks: correct * CORRECT_MARKS - wrong * WRONG_MARKS,
    accuracy: attempted === 0 ? null : correct / attempted,
  };
}

/** Turns a finished attempt into the record kept in history. */
export function summarise(mock, attempt, now = Date.now()) {
  const sections = mock.sections.map((s) => ({
    key: s.key,
    short: s.short,
    part: s.part,
    time: s.questions.reduce((sum, q) => sum + (attempt.spent[q.id] ?? 0), 0),
    ...tally(s.questions, attempt.saved),
  }));
  const all = mock.sections.flatMap((s) => s.questions);
  const topics = {};
  for (const q of all) {
    topics[q.topic] ??= { attempted: 0, correct: 0, total: 0 };
    topics[q.topic].total += 1;
    const given = attempt.saved[q.id];
    if (given !== undefined) {
      topics[q.topic].attempted += 1;
      if (given === q.a) topics[q.topic].correct += 1;
    }
  }
  const partA = sections.filter((s) => s.part === 'A');
  const partB = sections.filter((s) => s.part === 'B');
  return {
    id: `${mock.id}-${now}`,
    mockId: mock.id,
    title: mock.title,
    level: mock.level,
    v: mock.v,
    startedAt: attempt.startedAt,
    finishedAt: now,
    timeUsed: (mock.durationMin ?? 120) * 60 - attempt.remaining,
    answers: attempt.saved,
    marked: attempt.marked,
    spent: attempt.spent,
    overall: tally(all, attempt.saved),
    marksA: partA.reduce((sum, s) => sum + s.marks, 0),
    marksB: partB.reduce((sum, s) => sum + s.marks, 0),
    sections,
    topics,
  };
}

// Minimum qualifying percentages from Advertisement 03/2026, para 5(v).
export const CATEGORIES = [
  { key: 'general', label: 'General or EWS', percent: 40 },
  { key: 'obc', label: 'OBC (Delhi)', percent: 35 },
  { key: 'reserved', label: 'SC, ST or PwBD', percent: 30 },
];

/**
 * Advertisement 03/2026 applies the minimum to Section B and to the combined marks.
 * Section A has no minimum of its own.
 */
export function qualifyingCheck(summary, categoryKey) {
  const category = CATEGORIES.find((c) => c.key === categoryKey) ?? CATEGORIES[0];
  const needB = category.percent;
  const needTotal = category.percent * 2;
  return {
    category,
    needB,
    needTotal,
    passB: summary.marksB >= needB,
    passTotal: summary.overall.marks >= needTotal,
  };
}
