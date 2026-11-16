// Turns the rated CSV into per-language-mix results (eval/results.md) you can paste into the README.
//   node eval/score.mjs
// Rows whose notes contain "tuning" are left out (we changed the prompt for them, so they are not a fair test).
import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url"; import {parse} from "./csv.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const {rows} = parse(fs.readFileSync(path.join(here, "test-sentences.csv"), "utf8"));
const norm = v => ({right: "Right", partly: "Partly", wrong: "Wrong"})[String(v).trim().toLowerCase()] || "";
const tuning = rows.filter(r => /tuning/i.test(r.notes)), test = rows.filter(r => r.sentence && !/tuning/i.test(r.notes));
const rated = test.filter(r => norm(r.google_rating) && norm(r.app_rating));
const groups = {}; rated.forEach(r => (groups[r.languages.trim() || "?"] ||= []).push(r));
const pct = (n, t) => t ? Math.round(n / t * 100) + "%" : "-";
const cell = (g, col) => { const c = {Right: 0, Partly: 0, Wrong: 0}; g.forEach(r => c[norm(r[col])]++); return `${c.Right} / ${c.Partly} / ${c.Wrong} (${pct(c.Right, g.length)} right)`; };
let out = "# Results\n\n";
out += `${rated.length} rated test sentences (${test.length - rated.length} not rated yet, ${tuning.length} used for tuning and excluded). `;
out += `${rated.filter(r => /^yes/i.test(r.checked_by_speaker)).length} had their answer key checked by a speaker.\n\n`;
out += "Format: Right / Partly / Wrong\n\n| Languages | Sentences | Google Translate | Mixed Signals |\n|---|---|---|---|\n";
for (const k of Object.keys(groups).sort()) out += `| ${k} | ${groups[k].length} | ${cell(groups[k], "google_rating")} | ${cell(groups[k], "app_rating")} |\n`;
if (rated.length) out += `| **All** | ${rated.length} | ${cell(rated, "google_rating")} | ${cell(rated, "app_rating")} |\n`;
const bad = rated.filter(r => norm(r.app_rating) !== "Right");
out += "\n## Where it fails\n\n";
out += bad.length ? bad.map(r => `**${r.id}** (${r.languages}, app rated ${norm(r.app_rating)}, Google ${norm(r.google_rating)})\n- Sentence: ${r.sentence}\n- Correct: ${r.correct_meaning}\n- Google Translate: ${r.google_translate_output}\n- Mixed Signals: ${r.app_output}\n`).join("\n") : "No failures among rated sentences yet.\n";
fs.writeFileSync(path.join(here, "results.md"), out); console.log(out);
