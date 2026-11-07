# DSSSB TGT Computer Science mocks

Ten full-length mock tests and topic practice for the DSSSB TGT Computer Science exam
(Post Code 41/26, Advertisement 03/2026, shifts from 27 Nov to 4 Dec 2026). It is a static React site for GitHub Pages.
There is no server or login, and it works on phones and laptops.

## What you get

- **10 full mocks** on the official pattern: 200 questions, 2 hours, +1 and -0.25.
  - Low level: Mocks 1 to 3
  - Same level as the paper: Mocks 4 to 7
  - High level: Mocks 8 to 10
- **A console that behaves like the real one:** Save & Next, Mark for Review & Next, Clear Response, the same palette shapes, and an unsaved choice is lost if you jump away.
- **Results:** marks by section, an answer-sheet view, the qualifying check from Advt. 03/2026, and every answer explained.
- **Practice:** by section, topic and level, with the answer shown after each question. Mocks 6 and 7 are kept out so you always have unseen rehearsals.
- **Progress:** score trend, accuracy by section, weakest topics, and a backup file for moving between devices.

## Put it on GitHub Pages

This folder is already a git repository with its first commit on `main`.

1. Create a new, empty repository on GitHub, without a README or licence. Public is simplest, because Pages on a private repository needs a paid plan.
2. In this folder, run:

   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   ```

   ```bash
   git push -u origin main
   ```

3. On GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**. If the first run failed because Pages was not switched on yet, open the **Actions** tab and re-run it.
4. The workflow in `.github/workflows/deploy.yml` runs the tests, builds the site and publishes it. Pushing again republishes it.
   Your site will be at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

The site uses relative paths and hash routes, so it works under any repository name.

`past-papers/` holds local copies of the papers and official PDFs. It is in `.gitignore`, because the papers belong to their publishers. The site links to the originals instead.

## Work on it locally

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

## Add or fix questions

Questions are in `content/bank/*.json`, and `content/AUTHORING.md` describes the format and rules. To fix a key, edit the question file, then run:

```bash
npm run check
```

`npm run build` assembles the mocks from the bank using `content/blueprint.json`. Each question lands in exactly one mock, with no repeats. The build is deterministic, so the same bank always gives the same mocks. Changing the bank can reshuffle which mock a question lands in, and an unfinished mock from an older version restarts.

## Where the pattern comes from

Everything was checked against DSSSB's own documents on 7 Nov 2026. The links are on the site's Syllabus page.

- Syllabus: the official list for Post Code 41/26, which matches 56/24.
- Scheme: official I-T-T one-tier scheme and Advt. 03/2026, including the Section B qualifying rule and the tie-break.
- Topic weightage: my own classification of every Section B question in 5 official papers of 2021 and 2 of 2023. See the Syllabus page for the table.
- The 2024 paper follows the separate NDMC syllabus, so it is not used for weightage.

All questions are newly written. None are copied from past papers. Past papers are linked on the site for real practice.

## How the answers were checked

Writers computed numeric answers and traced code as they wrote. Then every question was solved again by separate reviewers who could not see the key, with options and order shuffled. Disagreements and flagged questions were reviewed one by one, and history, geography, polity, economics, science, culture, teaching methodology and part of Hindi had a further pass by a stronger model. Current affairs was checked against the web.

This caught real errors, but it cannot promise none remain, because the reviewers are AI models too and can share a misconception. If an answer looks wrong, trust your textbook, note the ID shown beside the question, and correct it in `content/bank/`.
