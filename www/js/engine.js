"use strict";
/* The AI part: build the prompt, call Gemini, and clean up what comes back.
   Everything the model returns is treated as untrusted text (see normalize). */

function buildPrompt(text, target){
  const name = TARGET[target] + (target === "te" ? " (written in Telugu script)" : "");
  return [
    "You are the engine of a translator for conversations that switch between languages mid-sentence.",
    "The listener understands " + name + ". Analyse the utterance below and reply with JSON only, no markdown.",
    "",
    "JSON shape:",
    "{",
    ' "segments": [{"text": string, "lang": "en"|"te"|"te-Latn"|"pl"|"other"}],',
    ' "literal": string,      // word-for-word reading in English, idioms kept literal',
    ' "meaning": string,      // what the speaker actually means, in plain English',
    ' "translation": string,  // the meaning in ' + name + ', natural, idioms replaced by an equivalent' + (target === "en" ? ' (use "" because the listener reads English)' : ""),
    ' "phrases": [{"text": string, "lang": same codes, "type": "idiom"|"slang"|"everyday"|"formal", "meaning": string, "tone": string, "where": string, "common": 1-5, "level": "beginner"|"intermediate"|"advanced", "similar": [string]}],',
    ' "confidence": "high"|"medium"|"low",',
    ' "note": string          // what you are unsure about, or ""',
    "}",
    "",
    "Rules:",
    "- Split segments wherever the language changes, even between single words. Joined together, the segment texts must reproduce the utterance exactly, spaces and punctuation included.",
    '- "te" is Telugu script. "te-Latn" is Telugu typed in English letters.',
    "- phrases: at most 4, the ones a learner most needs: idioms first, then everyday phrases. common: 5 = heard daily, 1 = rare.",
    "- Do not guess. If a word is unclear, say so in note and lower confidence.",
    "",
    'Utterance: """' + text + '"""'
  ].join("\n");
}

function parseJson(t){
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  const bad = {code:"bad_json", message:"The model did not answer in the expected format. Try again."};
  if (a < 0 || b <= a) throw bad;
  try { return JSON.parse(t.slice(a, b + 1)); } catch(e){ throw bad; }
}

/* Force the model's answer into the exact shape the screens expect. */
function normalize(raw, text){
  const a = raw && typeof raw === "object" ? raw : {};
  const str = v => typeof v === "string" ? v : "";
  let segs = Array.isArray(a.segments)
    ? a.segments.filter(s => s && str(s.text)).map(s => ({text:str(s.text), lang:LANG[s.lang] ? s.lang : "other"}))
    : [];
  if (!segs.length) segs = [{text, lang:"other"}];
  const phrases = (Array.isArray(a.phrases) ? a.phrases : [])
    .filter(p => p && str(p.text) && str(p.meaning)).slice(0, 4).map(p => ({
      text:str(p.text), lang:LANG[p.lang] ? p.lang : "other", type:str(p.type) || "everyday",
      meaning:str(p.meaning), tone:str(p.tone), where:str(p.where),
      common:Math.min(5, Math.max(1, Math.round(+p.common) || 3)),
      level:["beginner","intermediate","advanced"].includes(p.level) ? p.level : "intermediate",
      similar:(Array.isArray(p.similar) ? p.similar : []).filter(x => typeof x === "string").slice(0, 4)
    }));
  if (!str(a.meaning)) throw {code:"bad_json", message:"The model answered without a meaning. Try again."};
  return {segments:segs, literal:str(a.literal), meaning:str(a.meaning), translation:str(a.translation), phrases,
    confidence:["high","medium","low"].includes(a.confidence) ? a.confidence : "medium", note:str(a.note)};
}

async function askGemini(prompt, key, model){
  let r;
  try {
    r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
      method:"POST",
      headers:{"Content-Type":"application/json", "x-goog-api-key":key},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}], generationConfig:{responseMimeType:"application/json"}})
    });
  } catch(e){ throw {code:"network", message:"Could not reach Gemini. Check your internet connection."}; }
  if (r.status === 429) throw {code:"rate_limited", message:"The free tier is busy. Wait a minute, then try again."};
  if (!r.ok){
    let why = ""; try { const e = await r.json(); why = e && e.error && e.error.message ? " " + String(e.error.message).slice(0, 160) : ""; } catch(_){}
    throw {code:"http", message:"Gemini error " + r.status + "." + why};
  }
  const d = await r.json();
  const parts = d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts || [];
  return parseJson(parts.map(p => p.text || "").join(""));
}

if (typeof module !== "undefined") module.exports = {buildPrompt, parseJson, normalize};
