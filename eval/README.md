# Evaluation

`test-sentences.csv` is our test set: sentences the team wrote, each with the correct meaning.

## Columns

- `sentence`, `languages`, `correct_meaning`: the answer key. Written before any testing.
- `written_by`, `checked_by_speaker`: who wrote it, and whether a speaker of the language confirmed it (`yes` / `no`).
- `google_translate_output`, `google_rating`: the baseline. Paste what Google Translate returns, then rate it.
- `app_output`, `app_rating`: what Mixed Signals says the sentence means, then rate it.
- Ratings are `Right`, `Partly` or `Wrong`, given by someone who speaks the languages in the sentence.

## Rules we follow

1. Sentences are our own writing. No copied messages from other people.
2. If we change the prompt to fix a sentence, that sentence moves to a tuning set and does not count in the final score.
3. We report results separately for each language mix, and we show the failures.

## ID prefixes

`pl-` Polish + English, `te-` Telugu + English, `tl-` Telugu in English letters, `id-` English idioms.

## How to run it (tonight)

1. Everyone adds sentences to `test-sentences.csv` (fill `id`, `sentence`, `languages`, `correct_meaning`, `written_by`). Do this before looking at any output.
2. Paste each sentence into Google Translate and put its English output in `google_translate_output`.
3. On the Mac, in the project folder: `GEMINI_API_KEY=your_key node eval/run.mjs`. It fills `app_output` for every row and saves the raw replies in `eval/raw/`.
4. A speaker of each language fills `google_rating` and `app_rating` with Right, Partly or Wrong. Mark `checked_by_speaker` as `yes` once they confirm the answer key.
5. `node eval/score.mjs` writes `eval/results.md` with the per-language table and the failures. Paste it into the README.

If you change the prompt to fix a sentence, write `tuning` in that row's `notes`. Scoring leaves those rows out.
