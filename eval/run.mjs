// Runs every sentence in test-sentences.csv through the app's own prompt (www/js/engine.js)
// and writes the model's meaning into the app_output column. Rows that already have app_output are skipped.
//   GEMINI_API_KEY=... node eval/run.mjs            (add MODEL=name to override, TARGET=en|te|pl)
// Raw model replies are saved in eval/raw/<id>.json so every result can be checked.
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import {fileURLToPath} from "node:url";
import {parse, stringify} from "./csv.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)), www = path.join(here, "..", "www", "js");
const key = process.env.GEMINI_API_KEY; if (!key){ console.error("Set GEMINI_API_KEY first."); process.exit(1); }
const model = process.env.MODEL || "gemini-3.6-flash", target = process.env.TARGET || "en";
const src = fs.readFileSync(path.join(www, "data.js"), "utf8") + "\n" + fs.readFileSync(path.join(www, "engine.js"), "utf8") + "\n({buildPrompt, normalize, askGemini});";
const E = vm.runInNewContext(src, {fetch, module: undefined, console});
const file = path.join(here, "test-sentences.csv"); const {head, rows} = parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync(path.join(here, "raw"), {recursive: true});
let done = 0;
for (const r of rows){
  if (r.app_output || !r.sentence) continue;
  try {
    const raw = await E.askGemini(E.buildPrompt(r.sentence, target), key, model);
    fs.writeFileSync(path.join(here, "raw", r.id + ".json"), JSON.stringify(raw, null, 2));
    const a = E.normalize(raw, r.sentence);
    r.app_output = a.meaning + (a.confidence !== "high" ? " [model confidence: " + a.confidence + "]" : "");
    done++; console.log(r.id, "->", r.app_output);
  } catch (e){ console.error(r.id, "FAILED:", e.message || e); if (e.code === "http") break; }
  fs.writeFileSync(file, stringify(head, rows));      // save after every row
  await new Promise(ok => setTimeout(ok, 4000));       // stay under the free-tier rate limit
}
console.log("Done. " + done + " sentences run. Now have a speaker fill in app_rating and google_rating.");
