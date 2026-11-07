# How to write questions for this bank

The bank powers 10 full DSSSB TGT Computer Science mocks (Post Code 41/26, exam from 27 Nov 2026).
A candidate will trust these answers on exam day, so a wrong key is the worst possible bug.
A smaller number of correct questions beats hitting a count with doubtful ones.

## Rules

1. **Original only.** Write every question yourself. Never copy or lightly reword a question from a
   past paper, coaching site or book. Testing the same underlying fact is fine, since facts recur.
2. **One defensible answer.** Exactly one option must be correct under any standard textbook. DSSSB
   annuls ambiguous questions and so do we. If textbooks disagree, drop the question or name the
   convention in the stem ("According to Pressman, ...").
3. **Only write what you are sure of.** Before writing the key, work the answer out in full.
4. **Verify anything computable** by running it. Use `python -c "..."` for arithmetic, statistics,
   numeric methods, base conversion, and brute-forcing puzzles. Java can be compiled and run with
   `javac` and `java`. There is no C compiler here, so C snippets must be short enough to trace
   by hand, with defined behaviour only: no `i = i++`, no signed overflow, no unspecified evaluation
   order. Assume a 32-bit `int` and say so in the stem whenever size matters. Keep temp files in the
   scratch folder named in your task, never in the project.
5. **No figures unless structured.** Stems cannot show images. State a gate, tree or graph in words,
   or use the `table`, `chart` or `code` fields.
6. **Options are shuffled at build time.** So explanations must never say "option B" or "the first
   option", and "(a) and (b)" style options must not point at other options by position. "All of the
   above" and "None of these" are allowed but rare, under 3%, and they stay in last place automatically.
7. **Unicode for maths**, like x², √2, ∫₀¹ x dx, Σ, π, ≤, ≠, ¬, ∧, ∨, ⊕. No LaTeX, no HTML.
8. **Inline code** goes in backticks inside `q`, `o` or `e`. Multi-line code goes in the `code` field.
9. **Do not repeat yourself.** Within a topic, cover the whole range of subtopics, and no two questions
   may test the same fact. Use a different `sub` label for each distinct subtopic, and spread them out.
10. Write in plain Indian-exam English. British spelling. No trick wording that a real paper would not use.

## JSON format

Write `content/bank/<prefix>-<topic>.<n>.json` (for example `cs-cn.1.json`). Use several numbered files
of 25-40 questions each rather than one huge file. Every file is an object:

```json
{
  "questions": [
    {
      "id": "cn-001",
      "sec": "cs",
      "topic": "cn",
      "sub": "transport layer",
      "d": 1,
      "q": "Which protocol provides reliable, connection-oriented delivery at the transport layer?",
      "o": ["UDP", "TCP", "IP", "ICMP"],
      "a": 1,
      "e": "TCP sets up a connection and uses acknowledgements and retransmission. UDP is connectionless, while IP and ICMP work at the network layer."
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `id` | `<topic>-<3 digits>`, numbered from 001, unique across all your files for that topic |
| `sec` | Section key, given in your task |
| `topic` | Topic key, given in your task |
| `sub` | Short subtopic label of your own |
| `d` | Difficulty: 1 easy, 2 medium, 3 hard (see below) |
| `q` | Stem. A newline `\n` starts a new line, which is how I/II statements are laid out |
| `code` | Optional multi-line code block shown under the stem |
| `lang` | Optional language name for `code`, such as `c` or `java` |
| `table` | Optional `{ "head": ["List I", "List II"], "rows": [["a. FTP", "1. Port 25"], ...] }` |
| `chart` | Optional `{ "type": "bar"\|"pie"\|"line", "title": "...", "unit": "...", "labels": [...], "series": [{ "name": "...", "values": [...] }] }` |
| `o` | Exactly 4 distinct options |
| `a` | Index of the correct option, 0 to 3 |
| `e` | Explanation in 1-2 sentences, under 60 words: why the answer is right and, if useful, why the tempting wrong answer is wrong. A reader who got it wrong should learn the fact from this |
| `group` | Passage id, for comprehension questions only |
| `src` | Source URL, required for current affairs only |

Passages go in the same file, in a top-level `passages` object. Each passage has exactly 5 questions:
`"passages": { "en-p01": { "title": "...", "text": "...", "level": "low" } }`, where `level` is `low`,
`same` or `high`. Paragraphs are separated by `\n\n`.

## Difficulty

Judge as a candidate with a BCA or B.Tech background, in an exam with 36 seconds per question.

- **1 easy:** direct recall of a commonly taught fact, or one trivial step. Under 30 seconds.
  It is what a Low-level mock is mostly made of.
- **2 medium:** a concept applied, or a less common fact, or a short single-formula calculation.
  30-60 seconds. This is the real paper's typical non-trivial question.
- **3 hard:** a multi-step numeric or code trace, close distractors requiring exact knowledge, or a
  genuinely less common but still in-syllabus fact. 60-120 seconds. Tougher than most of the real paper,
  yet always solvable without a calculator and never a matter of luck. Hard does not mean obscure trivia
  only. At least half of the hard questions must require working something out or careful reasoning
  when the topic allows it.

Hit the easy/medium/hard targets in your task exactly. `node scripts/validate-bank.mjs <prefix>`
prints what you have against the target.

## Match the real paper's question shapes

Read the style notes in `content/style/` first (`section-b-2021.md` and `section-b-2023.md` for Section B,
`section-a.md` for Section A). For Section B, aim for roughly this mix across a topic:

- 40-45% one-line recall ("Which of the following ...", "What is the full form of ...")
- about 15% fill in the blank, using `______` as the gap
- about 20% statement items, with statements on their own lines and fixed options:
  `"q": "Consider the following statements about ...\nI. ...\nII. ...\nWhich of the above is/are correct?"`,
  `"o": ["Only I", "Only II", "Both I and II", "Neither I nor II"]`
- about 10% negative stems ("Which of the following is NOT ...")
- 10-15% numeric or code items where the topic allows: tiny, one quirk each
- 2-3% match-the-following, using `table`, with options like `a-2, b-1, c-4, d-3`
- Expand acronyms in some questions, where wrong options differ by a swapped word.
  Distractors must be real, same-category terms rather than obvious nonsense.
- In statement items, vary which outcome is right, so "Both I and II" is not always the answer.

## Before you finish

From `D:\dsssb`, run `node scripts/validate-bank.mjs <your-prefix>` for each topic and fix every ERROR.
Read each warning and fix genuine duplicates. Then re-read your hard questions once more, checking each
key. Your final message must be under 120 words: topics finished, counts, and anything you could not
complete or are unsure of. Do not paste questions in your final message.
