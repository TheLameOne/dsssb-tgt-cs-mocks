// The finished paper drawn as an OMR sheet: one bubble per question, grouped by section.
// Filled green means correct, filled red with a stroke means wrong, an open circle means skipped.

export function AnswerSheet({ mock, answers, onPick }) {
  let number = 0;
  return (
    <div className="omr">
      {mock.sections.map((section) => (
        <section className="omr-section" key={section.key}>
          <h3 className="omr-title">{section.short}</h3>
          <div className="omr-grid">
            {section.questions.map((q) => {
              number += 1;
              const given = answers[q.id];
              const state = given === undefined ? 'skipped' : given === q.a ? 'right' : 'wrong';
              const stateWord = { skipped: 'skipped', right: 'correct', wrong: 'wrong' }[state];
              return (
                <button
                  type="button"
                  key={q.id}
                  className={`omr-bubble omr-${state}`}
                  onClick={() => onPick(q.id)}
                  aria-label={`Question ${number}, ${stateWord}. Open in review.`}
                  title={`Q${number}: ${stateWord}`}
                >
                  {number}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <ul className="omr-key">
        <li>
          <span className="omr-bubble omr-right" aria-hidden="true" /> Correct, +1
        </li>
        <li>
          <span className="omr-bubble omr-wrong" aria-hidden="true" /> Wrong, −0.25
        </li>
        <li>
          <span className="omr-bubble omr-skipped" aria-hidden="true" /> Skipped, 0
        </li>
      </ul>
    </div>
  );
}
