// Tiny CSV reader/writer (handles quotes, commas and line breaks inside fields).
export function parse(text){
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (q){ if (c === '"'){ if (text[i+1] === '"'){ f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r"){ if (c === "\r" && text[i+1] === "\n") i++; row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else f += c;
  }
  if (f !== "" || row.length){ row.push(f); rows.push(row); }
  const head = rows.shift();
  return {head, rows: rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])))};
}
export function stringify(head, rows){
  const q = v => /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  return [head.map(q).join(",")].concat(rows.map(r => head.map(h => q(String(r[h] ?? ""))).join(","))).join("\n") + "\n";
}
