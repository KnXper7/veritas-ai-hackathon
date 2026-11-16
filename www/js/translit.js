"use strict";
/* Telugu script -> English letters, by fixed rules (no AI involved).
   Spelling follows how Telugu speakers usually type in English letters:
   long vowels doubled (aa, ee, oo), త = th, ట = t, శ/ష = sh.
   A Telugu speaker on the team should tune this table if something reads wrong. */
const TE_VOWEL = {"అ":"a","ఆ":"aa","ఇ":"i","ఈ":"ee","ఉ":"u","ఊ":"oo","ఋ":"ru","ఎ":"e","ఏ":"e","ఐ":"ai","ఒ":"o","ఓ":"o","ఔ":"au"};
const TE_SIGN  = {"ా":"aa","ి":"i","ీ":"ee","ు":"u","ూ":"oo","ృ":"ru","ె":"e","ే":"e","ై":"ai","ొ":"o","ో":"o","ౌ":"au"};
const TE_CONS  = {
  "క":"k","ఖ":"kh","గ":"g","ఘ":"gh","ఙ":"ng",
  "చ":"ch","ఛ":"chh","జ":"j","ఝ":"jh","ఞ":"ny",
  "ట":"t","ఠ":"t","డ":"d","ఢ":"dh","ణ":"n",
  "త":"th","థ":"th","ద":"d","ధ":"dh","న":"n",
  "ప":"p","ఫ":"ph","బ":"b","భ":"bh","మ":"m",
  "య":"y","ర":"r","ఱ":"r","ల":"l","ళ":"l","వ":"v","శ":"sh","ష":"sh","స":"s","హ":"h"
};
const TE_VIRAMA = "్", TE_LABIALS = "పఫబభమ";
const hasTelugu = s => /[ఀ-౿]/.test(s || "");

function translit(text){
  const ch = [...(text || "")];
  let out = "";
  for (let i = 0; i < ch.length; i++){
    const c = ch[i], next = ch[i + 1];
    if (TE_CONS[c] !== undefined){
      if (next === TE_VIRAMA){ out += TE_CONS[c]; i++; }                 // consonant with no vowel
      else if (TE_SIGN[next] !== undefined){ out += TE_CONS[c] + TE_SIGN[next]; i++; }
      else out += TE_CONS[c] + "a";                                      // built-in "a"
    }
    else if (TE_VOWEL[c] !== undefined) out += TE_VOWEL[c];
    else if (c === "ం") out += (TE_CONS[next] !== undefined && !TE_LABIALS.includes(next)) ? "n" : "m";
    else if (c === "ః") out += "h";
    else if (c === "ఁ") out += "n";
    else if (c >= "౦" && c <= "౯") out += String(c.charCodeAt(0) - 0x0C66);
    else if (c === "‌" || c === "‍") continue;                 // invisible joiners
    else out += c;
  }
  return out;
}
if (typeof module !== "undefined") module.exports = {translit, hasTelugu};
