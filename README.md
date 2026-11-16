# Mixed Signals

**Track:** Languages
**Team:** TODO (names as they should appear on the form)

> Draft write-up. Every `TODO` must be replaced with something real before we submit. No numbers go in here until we have measured them.

## The problem

People who live between two languages mix them in the same sentence: Telugu and English, Polish and English, Telugu typed in English letters. A listener who only knows one of the languages loses the meaning, and so does a translator that expects one language at a time or reads slang and idioms word for word.

TODO: name our one specific user and the moment they would open the app (2 sentences).

## What we built

You type a sentence you heard or read. Mixed Signals shows:

- the sentence coloured by language, with how much of it is in each language
- what the speaker actually means, next to the word-for-word reading
- Telugu script with English letters underneath, so people who can't read the script can follow
- phrases worth learning, which you can save to a word bank and practise as flashcards

A Check screen lets someone who speaks the languages rate each result Right, Partly or Wrong, so we can measure how often the model is correct.

## What we added

Our own idea.

## How it works

**Data:** `eval/test-sentences.csv`. Sentences the team wrote, each with the correct meaning. TODO: how many sentences, how many per language mix, who checked them.

**Model:** Google Gemini (TODO: exact model name used for the results), called from `www/js/engine.js`. We did not train a model. Our part is the prompt that asks for word-level language tags, the real meaning and the phrases to learn, the code that checks and cleans the answer, the rule-based Telugu-to-English-letters converter in `www/js/translit.js` (no AI), and the test.

**Baseline:** Google Translate on the same sentences.

## Results

TODO. Not measured yet. This section will have:

- baseline score and our score, on test sentences we did not tune on
- the scores split by language mix (Telugu + English, Telugu in English letters, Polish + English, idioms)
- three to five sentences the app got wrong, next to the correct meaning, and why we think it failed

## What we'd do next

TODO: one or two concrete next steps.

**Microphone (speech to text).** The Speak button uses the browser's built-in Web Speech API. The browser, not our code, turns the speech into text (Chrome sends the audio to Google's speech service for this). It listens in one language at a time, so mixed-language sentences are often misheard; we treat that as a known weakness and the typed text is always editable before decoding. It only works in browsers that have the API (Chrome, Edge, Safari) and not inside the Android app's WebView. We only record ourselves.

## Sources

**Datasets**
- None. We did not train on any dataset. The test sentences in `eval/test-sentences.csv` are written by the team (Aaron wrote the Polish + English ones) and the four built-in examples in `www/js/data.js` are hand-written and labelled "Example" in the app. They are never counted as results.

**Models (trained or retrained)**
- We did not train or retrain any model. The AI is a pre-trained model used through an API with our own prompt: [Gemini 3.6 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash) via the [Gemini API](https://ai.google.dev/gemini-api/docs).
- Baseline we compare against: [Google Translate](https://translate.google.com).
- The Telugu-to-English-letters step (`www/js/translit.js`) is a rule-based table, not AI. We wrote it by hand (with Claude's help) and a Telugu speaker still needs to check the spellings.

**Tutorials and documentation we followed**
- [Gemini API: generateContent reference](https://ai.google.dev/gemini-api/docs) for the request and response format.
- [Capacitor docs](https://capacitorjs.com/docs) for wrapping the website as an Android app.
- [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for the microphone button.
- [Fontsource](https://fontsource.org) for the bundled fonts: [Geist](https://fontsource.org/fonts/geist) and [Noto Sans Telugu](https://fontsource.org/fonts/noto-sans-telugu) (SIL Open Font License).

**AI tools used**
- [Claude](https://www.anthropic.com/claude) (Anthropic), including [Claude Code](https://claude.com/product/claude-code): helped write the code, the wireframe and this write-up. The team reviewed it and can explain each part.
- [Gemini](https://ai.google.dev/gemini-api/docs): the live model inside the app.
- [Figma](https://www.figma.com): the wireframe of the screens.
- TODO (team): add any other AI tool anyone used (for example Gemini chat or ChatGPT) with a link.

---

## Run the website

You need Node 22 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The four built-in examples work straight away.

For your own sentences: tap the sliders icon (Settings) and paste a free Gemini API key from Google AI Studio. The key is saved in the browser on your device and is never in this repo.

## Run it as an Android app (Capacitor)

You need Android Studio installed.

```bash
npm run android:add     # once: creates the android/ folder
npm run android:sync    # after every change in www/
npm run android:open    # opens Android Studio, then press Run
```

## What is in here

```
index.html          sends visitors to www/ (for the hosted link)
www/
  index.html        the five screens
  css/app.css       the look (thin lines, signal bars; colour = language)
  css/fonts.css     bundled fonts, so the app works offline
  js/data.js        language list, levels, built-in examples
  js/translit.js    Telugu script -> English letters, by fixed rules (no AI)
  js/engine.js      the AI part: prompt, Gemini call, cleaning the answer
  js/app.js         screens and saved state
eval/
  test-sentences.csv  our test set and results
  README.md           how we test
capacitor.config.json
CLAUDE.md           notes for Claude: rules, status, next steps
```

## Honest status

- The four built-in examples are written by hand. They are not model output and are never counted as results.
- The Telugu and Polish in the examples still need a check by a speaker.
- The live Gemini call has been tested against a fake reply only, not against the real API.
- The evaluation has not been run yet.
