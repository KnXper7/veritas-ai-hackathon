# Mixed Signals: notes for Claude Code

## What this is

A hackathon entry by a team of three high school students (Koundinya, Aaron, Akshaj) for the
Veritas AI International High School Hackathon 2026, **AI + Languages** track.

**Deadline: Sunday Nov 15, 2026, 11:59 PM ET.** Prefer small, working steps over big rewrites.

The app decodes sentences that switch languages mid-sentence (Telugu + English, Polish + English,
Telugu typed in English letters) and English idioms. It shows what was said coloured by language,
what it means, and lets the user save phrases to a word bank and practise them.

The developer (Koundinya) is in 9th grade: strong in HTML/CSS/JS, learning the rest.
Keep answers short, lead with the next action, explain anything he will have to explain to judges.

## Hackathon rules that shape the code (from the official brief)

- **AI must be central.** An app built with AI coding tools does not count on its own.
- Every project must show: a named user, a real input and output, **a comparison with a simple
  baseline**, and **where it fails**. Results must come from sentences the system was not tuned on.
- Languages track: **report results separately for each language**, show **model output next to the
  correct output**, and get **checks by a real speaker**. Use only public data or the team's own writing.
  Do not record or use other people's voices or messages without permission.
- Report honest results, including weak ones. Never present hand-written examples as model output.
- Cite every dataset, model, tutorial and AI tool (Claude and Gemini included) in the write-up.
- Submission needs: code (public GitHub repo or Colab), a one-page write-up (README is fine),
  optional 2-minute demo video.
- The team must understand and be able to explain every part.

## How it is built

Plain HTML, CSS and JavaScript. No framework, no build step. Capacitor wraps `www/` for Android.

- `www/js/data.js`: `LANG`, `LEVELS`, `EXAMPLES` (hand-written, labelled "Example" in the UI).
- `www/js/translit.js`: rule-based Telugu script to English letters. Not AI. Tune the tables here.
- `www/js/engine.js`: `buildPrompt`, `askGemini`, `normalize`. The only place the model is called.
- `www/js/app.js`: all screens, state in `localStorage` under `mixed-signals-v2`.
- `www/css/app.css`: tokens at the top. Colour means language only (blue English, amber Telugu,
  red Polish). The look is quiet and serious: thin lines, one typeface (Geist), no heavy outlines,
  no drop shadows, nothing cartoonish. Signature elements: the mix bar, signal-strength meters
  (`.sig`), icons drawn from round bars with one "switch" bar (`.sw`).

- `index.html` (root): only redirects to `www/`, so the hosted link opens the app. Do not put app code here.
- `eval/test-sentences.csv`: the test set and results. `eval/README.md` explains the columns and rules.

The GitHub repo is `KnXper7/veritas-ai-hackathon`. It must contain this project only (an earlier
upload mixed in files from a different project: `src/`, `public/`, `test/`, `vite.config.ts`, `tsconfig.json`).

Commands: `npm run dev` (website on port 5173), `npm run android:sync` then `npm run android:open`.

## Conventions

- Model output goes into the page as text only. Use the `h()` helper. Never `innerHTML`.
- Telugu is never shown without English letters unless the user picks "తెలుగు only" in Settings.
  Use `te(text)` when showing any text that may contain Telugu.
- Keep the UI basic and low on text. One column. No new colours unless they mean a language.
- Classic `<script>` tags, shared globals, load order: data, translit, engine, app.
- The Gemini key is typed in Settings at runtime. Never commit a key.

## Status

- Works: all five screens, examples, word bank, XP and levels, flashcards, speaker-check log, CSV copy,
  transliteration, Android project creation (`cap add android` ran clean).
- Tested only against a fake reply: the live Gemini path. First real call may need a fix
  (model name, response shape, CORS in the browser; on Android `CapacitorHttp` sends it natively).
- Not checked by a speaker: Telugu and Polish in `EXAMPLES`, and the spelling choices in `translit.js`.
- Started: test set (8 Polish + English sentences so far, not yet checked by a speaker), write-up draft
  in README.md with `TODO` markers. No results measured yet.
- Not built: speech input.

## Next (in this order)

1. Put in a real Gemini key and fix whatever breaks on the first live sentence.
2. **Evaluation, the part judges score.** The team writes about 50 test sentences with the correct
   meaning for each (Telugu + English, Tenglish, Polish + English, idioms). Run each through a plain
   translator as the baseline and through this app's prompt. Speakers rate both. Report per language
   mix, show the worst failures side by side. The Check screen and its CSV are built for this.
3. Replace every `TODO` in README.md with real content and measured numbers. Never invent results.
4. Only then: polish, app icon, demo video.
