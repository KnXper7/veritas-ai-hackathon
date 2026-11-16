"use strict";
/* Screens and state. Model output is only ever inserted as text (never innerHTML). */

/* ---------- small helpers ---------- */
const $ = id => document.getElementById(id);
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs){
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)){
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
function svg(paths){   // tiny icon made of round bars, same family as the nav icons
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", "i"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
  s.style.width = s.style.height = "20px";
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", paths); s.append(p);
  return s;
}
const ICON_PLUS = "M12 6v12M6 12h12", ICON_X = "M7 7l10 10M17 7L7 17";
const lang = c => LANG[c] || LANG.other;
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
let toastTimer;
function toast(msg){ const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 2200); }

/* signal-strength meter, 1 to 5 bars: used for level and for how common a phrase is */
function sig(n, label){ return h("span", {class:"sig", role:"img", "aria-label":label}, [1,2,3,4,5].map(i => h("i", {class:i <= n ? "on" : ""}))); }

/* ---------- saved state (this device only) ---------- */
const KEY = "mixed-signals-v2";
let S = {bank:[], log:[], xp:0, set:{key:"", model:"gemini-3.6-flash", target:"en", script:"both", speech:"en-US"}};
try {
  const p = JSON.parse(localStorage.getItem(KEY) || "null");
  if (p && Array.isArray(p.bank) && Array.isArray(p.log)) S = {bank:p.bank, log:p.log, xp:+p.xp || 0, set:Object.assign(S.set, p.set || {})};
} catch(e){}
if (S.set.model === "gemini-3.8-flash") S.set.model = "gemini-3.6-flash";   // old default was not a real model name
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }

function levelFor(xp){
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i+1][0]) i++;
  const next = LEVELS[i+1] || null;
  return {n:i+1, name:LEVELS[i][1], next, pct: next ? Math.round((xp - LEVELS[i][0]) / (next[0] - LEVELS[i][0]) * 100) : 100};
}
function addXp(n){
  const before = levelFor(S.xp).n; S.xp += n; const after = levelFor(S.xp);
  return after.n > before ? "Level " + after.n + ": " + after.name : "";
}

/* ---------- Telugu display: script, English letters, or both ---------- */
function te(text, block){
  if (!hasTelugu(text) || S.set.script === "script") return [text];
  const r = translit(text);
  if (S.set.script === "letters") return [r];
  return [text, h("span", {class:"tr" + (block ? " block" : "")}, block ? r : " · " + r)];
}
/* Telugu words inside an English sentence: "నువ్వు (nuvvu)" */
function teMixed(text){
  if (!hasTelugu(text) || S.set.script === "script") return [text];
  return text.split(/([\u0C00-\u0C7F]+(?:\s+[\u0C00-\u0C7F]+)*)/).map(part =>
    !hasTelugu(part) ? part : S.set.script === "letters" ? translit(part) : [part, h("span", {class:"tr"}, " (" + translit(part) + ")")]);
}
function segNode(s){
  const L = lang(s.lang), seg = t => h("span", {class:"seg " + L.cls, lang:L.html || null, title:L.name}, t);
  if (!hasTelugu(s.text) || S.set.script === "script") return seg(s.text);
  if (S.set.script === "letters") return seg(translit(s.text));
  // both: each Telugu word is a small stack, script on top and English letters underneath
  return s.text.split(/(\s+)/).filter(Boolean).map(w => hasTelugu(w) ? h("span", {class:"w"}, seg(w), h("span", {class:"r"}, translit(w))) : w);
}
/* how much of the sentence is in each language, by letters */
function mixParts(a){
  const tot = {}; let sum = 0;
  a.segments.forEach(s => { const n = s.text.replace(/[\s.,!?;:'"()-]/g, "").length; tot[s.lang] = (tot[s.lang] || 0) + n; sum += n; });
  return Object.keys(tot).sort((x, y) => tot[y] - tot[x]).map(k => ({lang:k, n:tot[k], pct:sum ? Math.round(tot[k] / sum * 100) : 0}));
}
const mixOf = a => [...new Set(a.segments.map(s => s.lang))].sort().join(" + ");
const inBank = p => S.bank.some(b => b.text.toLowerCase() === p.text.toLowerCase());

/* ---------- translate ---------- */
let cur = null;    // {input, a, source:"example"|"gemini", target, rated}
let openPhrase = 0;

function renderResult(){
  const box = $("result"); box.replaceChildren();
  if (!cur){ box.hidden = true; return; }
  box.hidden = false;
  const a = cur.a, live = cur.source !== "example", parts = mixParts(a);

  box.append(h("div", {class:"row", style:"flex-wrap:nowrap"},
    h("div", {class:"mix", role:"img", "aria-label":parts.map(p => lang(p.lang).name + " " + p.pct + "%").join(", ")}, parts.map(p => h("i", {class:lang(p.lang).cls, style:"flex:" + Math.max(p.n, 1)}))),
    h("span", {class:"tag" + (live ? " live" : "")}, live ? "Live" : "Example")));
  box.append(h("p", {class:"strip"}, a.segments.map(segNode)));
  box.append(h("div", {class:"legend"}, parts.map(p => h("span", null, h("span", {class:"key " + lang(p.lang).cls}), lang(p.lang).name + " " + p.pct + "%"))));

  box.append(h("div", null, h("span", {class:"label"}, "Means"), h("p", {class:"means"}, a.meaning)));
  const tl = live ? cur.target : a.tlang;
  if (a.translation && tl && tl !== "en") box.append(h("div", null, h("span", {class:"label"}, "In " + TARGET[tl]), h("p", {class:"means", lang:tl}, te(a.translation, true))));
  if (a.literal) box.append(h("div", null, h("span", {class:"label"}, "Word for word"), h("p", {class:"lit"}, a.literal)));
  if (a.note || a.confidence !== "high") box.append(h("p", {class:"small"}, h("b", null, a.confidence === "high" ? "Note: " : "Not sure: "), teMixed(a.note || "check this one with a speaker.")));

  if (a.phrases.length){
    box.append(h("span", {class:"label"}, "Learn"));
    a.phrases.forEach((p, i) => {
      const saved = inBank(p);
      box.append(h("details", {class:"ph", open:i === openPhrase, ontoggle:ev => { if (ev.target.open) openPhrase = i; }},
        h("summary", null, h("span", null, h("b", {lang:lang(p.lang).html || null}, te(p.text)), h("br"), h("span", {class:"muted"}, p.meaning)), svg(ICON_PLUS)),
        h("div", {class:"body"},
          h("dl", null,
            h("dt", null, "Heard"), h("dd", null, sig(p.common, COMMON[p.common]), " " + COMMON[p.common]),
            h("dt", null, "Level"), h("dd", null, cap(p.level) + " · " + p.type),
            p.tone ? [h("dt", null, "Tone"), h("dd", null, teMixed(p.tone))] : null,
            p.where ? [h("dt", null, "When"), h("dd", null, teMixed(p.where))] : null,
            p.similar.length ? [h("dt", null, "Like"), h("dd", null, p.similar.map((s, j) => [j ? ", " : "", teMixed(s)]))] : null),
          h("button", {class:"btn wide", type:"button", disabled:saved, onclick:() => addToBank(p)}, saved ? "Saved" : "Save to words"))));
    });
  }

  if (live){
    if (cur.rated) box.append(h("p", {class:"small muted"}, "Rated: " + cur.rated));
    else {
      const should = h("input", {id:"should", placeholder:"Should say… (optional)", "aria-label":"What it should say"});
      box.append(h("span", {class:"label"}, "Right meaning?"),
        h("div", {class:"row"}, ["Right","Partly","Wrong"].map(v => h("button", {class:"ghost", type:"button", onclick:() => rate(v, should.value.trim())}, v))), should);
    }
  }
}
function setStatus(msg, settingsLink, busy){
  const s = $("status"); s.hidden = !msg; s.replaceChildren(); s.classList.toggle("busy", !!busy);
  if (msg) s.append(msg);
  if (msg && settingsLink) s.append(" ", h("a", {href:"#settings"}, "Open Settings"));
}
function show(input, a, source, target){ cur = {input, a, source, target, rated:""}; openPhrase = 0; renderResult(); }

$("form").addEventListener("submit", async ev => {
  ev.preventDefault();
  const text = $("utterance").value.trim(), target = $("target").value;
  if (!text){ setStatus("Type a sentence first."); return; }
  if (!S.set.key){
    const ex = EXAMPLES.find(e => e.input === text);
    if (ex){ setStatus(""); show(ex.input, ex.a, "example", target); }
    else setStatus("Your own sentences need a Gemini key.", true);
    return;
  }
  const btn = $("go"); btn.disabled = true; btn.textContent = "Decoding"; setStatus("Asking the model…", false, true);
  try {
    const raw = await askGemini(buildPrompt(text, target), S.set.key, S.set.model || "gemini-3.6-flash");
    setStatus(""); show(text, normalize(raw, text), "gemini", target); $("result").scrollIntoView({block:"start", behavior:"smooth"});
  } catch(e){ setStatus((e && e.message) || "Something went wrong. Try again.", e && e.code === "http"); }
  finally { btn.disabled = false; btn.textContent = "Decode"; }
});
$("utterance").addEventListener("keydown", ev => { if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); $("form").requestSubmit(); } });
$("target").addEventListener("change", () => { S.set.target = $("target").value; save(); });
EXAMPLES.forEach(ex => $("examples").append(h("button", {class:"ghost", type:"button",
  onclick:() => { $("utterance").value = ex.input; setStatus(""); show(ex.input, ex.a, "example", $("target").value); }}, ex.label)));

/* ---------- microphone (Web Speech API, in the browser) ---------- */
/* Not our AI: the browser turns speech into text, then Gemini decodes the text. One language per recording. */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false;
function micState(on){
  listening = on; $("mic").setAttribute("aria-pressed", on ? "true" : "false"); $("mic-label").textContent = on ? "Listening" : "Speak";
}
if (SR){
  $("speech").hidden = false;
  $("speechlang").value = S.set.speech || "en-US";
  $("speechlang").addEventListener("change", () => { S.set.speech = $("speechlang").value; save(); });
  $("mic").addEventListener("click", () => {
    if (listening && rec){ rec.stop(); return; }
    rec = new SR(); rec.lang = $("speechlang").value; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    const box = $("utterance"), before = box.value.trim();
    rec.onstart = () => { micState(true); setStatus("Listening…", false, true); };
    rec.onresult = ev => {
      let t = ""; for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      box.value = (before ? before + " " : "") + t.trim();
    };
    rec.onerror = ev => {
      const m = {"not-allowed":"Microphone is blocked. Allow it in the address bar, then try again.", "service-not-allowed":"Microphone is blocked. Allow it in the address bar, then try again.",
        "no-speech":"Didn't hear anything. Try again, closer to the mic.", "audio-capture":"No microphone found.", "network":"The speech service could not be reached.", "language-not-supported":"This browser can't listen in that language."};
      setStatus(m[ev.error] || "Microphone stopped (" + ev.error + ").");
    };
    rec.onend = () => { micState(false); if ($("status").classList.contains("busy")) setStatus(""); };
    try { rec.start(); } catch(e){ micState(false); setStatus("Could not start the microphone."); }
  });
}

/* ---------- words ---------- */
function addToBank(p){
  if (inBank(p)) return;
  S.bank.push(Object.assign({}, p, {id:Date.now() + "-" + Math.floor(Math.random() * 1e6), streak:0, learned:false, from:cur ? cur.input : ""}));
  const up = addXp(10); save(); renderAll(); toast(up || "Saved · +10 XP");
}
function renderBank(){
  const L = levelFor(S.xp), pr = $("progress"), box = $("bank");
  pr.replaceChildren(
    h("div", {class:"row between"}, h("h2", null, sig(L.n, "Level " + L.n), "  " + L.name), h("b", null, S.xp + " XP")),
    h("div", {class:"bar"}, h("i", {style:"width:" + L.pct + "%"})),
    h("p", {class:"small muted"}, L.next ? (L.next[0] - S.xp) + " XP to " + L.next[1] : "Top level"));
  box.replaceChildren();
  if (!S.bank.length){ box.append(h("p", {class:"muted"}, "Nothing saved yet. ", h("a", {href:"#translate"}, "Decode a sentence"), " and save a phrase.")); return; }
  [...S.bank].sort((x, y) => (x.learned - y.learned) || (y.common - x.common)).forEach(b => box.append(h("div", {class:"item"},
    h("div", {class:"main"}, h("b", {lang:lang(b.lang).html || null}, te(b.text)), h("span", null, b.meaning),
      h("span", {class:"small muted"}, sig(b.common, COMMON[b.common]), "  " + (b.learned ? "Learned" : b.streak + "/3"))),
    h("button", {class:"x", type:"button", "aria-label":"Remove " + b.text, onclick:() => { S.bank = S.bank.filter(x => x.id !== b.id); save(); renderAll(); }}, svg(ICON_X)))));
}

/* ---------- practice ---------- */
let card = null, revealed = false;
function nextCard(){
  const pool = S.bank.filter(b => !b.learned);
  if (!pool.length){ card = null; return; }
  const min = Math.min(...pool.map(b => b.streak));
  const c = pool.filter(b => b.streak === min && (!card || pool.length === 1 || b.id !== card.id));
  const from = c.length ? c : pool;
  card = from[Math.floor(Math.random() * from.length)]; revealed = false;
}
function renderPractice(){
  const box = $("practice"); box.replaceChildren();
  if (card && !S.bank.some(b => b.id === card.id && !b.learned)) card = null;
  if (!card) nextCard();
  if (!S.bank.length){ box.append(h("h2", null, "No cards yet"), h("p", {class:"muted"}, "Saved phrases show up here."), h("a", {class:"btn", href:"#translate", style:"text-decoration:none;display:inline-grid;place-items:center"}, "Decode a sentence")); return; }
  if (!card){ box.append(h("h2", null, "All learned"), h("p", {class:"muted"}, "Go find harder sentences.")); return; }
  box.append(h("span", {class:"label"}, lang(card.lang).name), h("p", {class:"big", lang:lang(card.lang).html || null}, te(card.text, true)));
  if (!revealed) box.append(h("button", {class:"btn", type:"button", onclick:() => { revealed = true; renderPractice(); }}, "Show meaning"));
  else box.append(h("p", {class:"means"}, card.meaning),
    h("div", {class:"row", style:"justify-content:center"},
      h("button", {class:"btn", type:"button", onclick:() => answer(true)}, "Knew it"),
      h("button", {class:"ghost", type:"button", onclick:() => answer(false)}, "Not yet")));
}
function answer(ok){
  const b = S.bank.find(x => x.id === card.id); if (!b) return;
  let msg = "";
  if (ok){ b.streak++; msg = addXp(15); if (b.streak >= 3){ b.learned = true; msg = msg || "Learned: " + b.text; } } else b.streak = 0;
  save(); nextCard(); renderAll(); if (msg) toast(msg);
}

/* ---------- speaker check ---------- */
function rate(verdict, should){
  if (!cur || cur.source === "example" || cur.rated) return;
  S.log.push({input:cur.input, mix:mixOf(cur.a), engine:S.set.model, target:cur.target, meaning:cur.a.meaning, translation:cur.a.translation, verdict, should});
  cur.rated = verdict; save(); renderAll(); toast("Logged: " + verdict);
}
function csv(){
  const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  return [["input","input_in_english_letters","languages","model","listener_language","system_meaning","system_translation","verdict","should_say"].join(",")]
    .concat(S.log.map(r => [r.input, hasTelugu(r.input) ? translit(r.input) : "", r.mix, r.engine, r.target, r.meaning, r.translation, r.verdict, r.should].map(q).join(","))).join("\n");
}
function renderCheck(){
  const t = $("tally"), l = $("log"); t.replaceChildren(); l.replaceChildren();
  if (!S.log.length){
    t.append(h("p", {class:"muted"}, "Nothing rated yet."));
    l.append(h("p", {class:"muted"}, "Decode a live sentence, then rate it."));
    return;
  }
  const by = {};
  S.log.forEach(r => { const g = by[r.mix] || (by[r.mix] = {n:0, Right:0, Partly:0, Wrong:0}); g.n++; g[r.verdict]++; });
  t.append(h("table", null,
    h("thead", null, h("tr", null, h("th", null, "Languages"), ["Rated","Right","Partly","Wrong"].map(x => h("th", {class:"num"}, x)))),
    h("tbody", null, Object.keys(by).sort().map(k => { const g = by[k]; return h("tr", null,
      h("td", null, k.split(" + ").map(c => lang(c).name).join(" + ")),
      [g.n, g.Right + " (" + Math.round(g.Right / g.n * 100) + "%)", g.Partly, g.Wrong].map(x => h("td", {class:"num"}, x))); }))));
  l.append(h("table", null,
    h("thead", null, h("tr", null, ["Sentence","Model said","Should say",""].map(x => h("th", null, x)))),
    h("tbody", null, [...S.log].reverse().map(r => h("tr", null, h("td", null, te(r.input, true)), h("td", null, r.meaning), h("td", null, r.should || "—"), h("td", null, h("b", null, r.verdict)))))));
}
$("copycsv").addEventListener("click", async () => {
  const text = csv(), btn = $("copycsv");
  try { await navigator.clipboard.writeText(text); toast("CSV copied"); }
  catch(e){ const ta = $("csv"); ta.hidden = false; ta.value = text; ta.rows = Math.min(12, S.log.length + 2); ta.select(); btn.textContent = "Copy from below"; }
});

/* ---------- settings ---------- */
function renderSettings(){
  const t = $("engine-tag"); t.textContent = S.set.key ? "Live" : "Examples only"; t.className = "tag" + (S.set.key ? " live" : "");
}
$("gkey").addEventListener("input", () => { S.set.key = $("gkey").value.trim(); save(); renderSettings(); });
$("gmodel").addEventListener("input", () => { S.set.model = $("gmodel").value.trim(); save(); });
$("script").addEventListener("change", () => { S.set.script = $("script").value; save(); renderAll(); });
let wipeArmed = false;
$("wipe").addEventListener("click", () => {
  const b = $("wipe"), label = "Clear words and results";
  if (!wipeArmed){ wipeArmed = true; b.textContent = "Tap again to clear"; setTimeout(() => { wipeArmed = false; b.textContent = label; }, 4000); return; }
  S.bank = []; S.log = []; S.xp = 0; card = null; wipeArmed = false; b.textContent = label; save(); renderAll(); toast("Cleared");
});

/* ---------- shell ---------- */
function renderAll(){
  const L = levelFor(S.xp), chip = $("lvl-chip");
  chip.replaceChildren(sig(L.n, ""), "Lv " + L.n); chip.setAttribute("aria-label", "Level " + L.n + ", " + L.name + ", " + S.xp + " XP");
  $("n-bank").textContent = S.bank.length || ""; $("n-check").textContent = S.log.length || "";
  renderResult(); renderBank(); renderPractice(); renderCheck(); renderSettings();
}
const SCREENS = ["translate","bank","practice","check","settings"];
function route(){
  let s = location.hash.slice(1); if (!SCREENS.includes(s)) s = "translate";
  SCREENS.forEach(x => { $("s-" + x).hidden = x !== s; });
  document.querySelectorAll("[data-s]").forEach(a => { if (a.dataset.s === s) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  document.title = (s === "translate" ? "" : cap(s === "bank" ? "words" : s) + " · ") + "Mixed Signals";
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* start: settings into the form, first example on screen so the app never opens empty */
$("gkey").value = S.set.key; $("gmodel").value = S.set.model; $("script").value = S.set.script; $("target").value = S.set.target;
$("utterance").value = EXAMPLES[0].input;
cur = {input:EXAMPLES[0].input, a:EXAMPLES[0].a, source:"example", target:S.set.target, rated:""};
renderAll(); route();
