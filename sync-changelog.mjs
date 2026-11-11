// Haalt alle commits + CHANGELOG.md van MHVwork op en schrijft changelog-data.json.
// Lokaal:  node scripts/sync-changelog.mjs      (Node 18+)
// Zonder internet/API-limiet: SRC_LOCAL=pad/naar/MHVwork-kloon node scripts/sync-changelog.mjs
// Handmatige wijzigingen staan NIET hier, maar in changelog-edits.json en worden nooit overschreven.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
const REPO = process.env.SRC_REPO || "adminmossel/MHVwork";
const OUT = "changelog-data.json";
// e-mailadressen worden nooit publiek gezet, ook niet als ze in een commitbericht staan
const redact = x => (x || "").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[e-mailadres]");
const H = { "User-Agent": "companywork-sync", Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {}) };
const get = async (u, json = true) => { const r = await fetch(u, { headers: H }); if (!r.ok) throw new Error(u + " → " + r.status); return json ? r.json() : r.text(); };

function localCommits(dir) {
  const raw = execFileSync("git", ["-C", dir, "log", "--format=%H%x1f%ad%x1f%an%x1f%s%x1f%b%x1e", "--date=short"], { encoding: "utf8", maxBuffer: 1 << 26 });
  return raw.split("\x1e").map(x => x.trim()).filter(Boolean).map(x => { const [full, d, a, t, b] = x.split("\x1f"); return { h: full.slice(0, 7), full, d, t: redact(t.trim()), b: redact((b || "").trim()), a }; });
}

async function commits() {
  if (process.env.SRC_LOCAL) return localCommits(process.env.SRC_LOCAL);
  const out = [];
  for (let p = 1; ; p++) {
    const a = await get(`https://api.github.com/repos/${REPO}/commits?per_page=100&page=${p}`);
    for (const c of a) {
      const m = c.commit.message, i = m.indexOf("\n");
      // bewust alleen de naam, nooit het e-mailadres van de auteur
      out.push({ h: c.sha.slice(0, 7), full: c.sha, d: c.commit.author.date.slice(0, 10), t: redact((i < 0 ? m : m.slice(0, i)).trim()), b: redact((i < 0 ? "" : m.slice(i)).trim()), a: c.commit.author.name });
    }
    if (a.length < 100) break;
  }
  return out;
}

export function parse(md) {
  const E = []; let e = null, g = null, fence = false, lastDate = "";
  for (const raw of md.split("\n")) {
    const l = raw.replace(/\s+$/, ""); let m;
    if (/^```/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    if ((m = l.match(/^#{1,2} (.+)/))) {
      let title = m[1].replace(/^CHANGELOG\s+—\s+/, "").trim(), date = "";
      const d = title.match(/\s*\(([^)]*\d{4})\)\s*$/), mj = title.match(/(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december) \d{4}/i);
      if (d) { date = d[1]; title = title.replace(d[0], ""); }
      else if (mj) date = mj[0];
      else if (l.startsWith("## ")) date = lastDate;
      if (l.startsWith("# ")) lastDate = (date.match(/[a-z]+ \d{4}$/i) || [""])[0] || date;
      e = { id: "e" + E.length, title, date, doc: null, intro: [], groups: [] }; E.push(e); g = null; continue;
    }
    if (!e || /^---+$/.test(l)) continue;
    if ((m = l.match(/^### (.+)/))) { g = { name: m[1].trim(), items: [] }; e.groups.push(g); continue; }
    if ((m = l.match(/^(?:[-*]|\d+\.) (.+)/))) { if (!g) { g = { name: "", items: [] }; e.groups.push(g); } g.items.push(m[1]); continue; }
    if (/^\s+\S/.test(l) && g && g.items.length) { g.items[g.items.length - 1] += " " + l.trim(); continue; }
    if (l.trim()) { const d = l.match(/\(\.?\/?([^)]+\.md)\)/); if (d) e.doc = d[1]; else if (!g) e.intro.push(l.trim()); }
  }
  return E;
}

const X = s => String(s).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
function rss(d) {
  const items = d.commits.slice(0, 40).map(c => `<item><title>${X(c.t)}</title><link>https://github.com/${d.repo}/commit/${c.full}</link><guid isPermaLink="true">https://github.com/${d.repo}/commit/${c.full}</guid><pubDate>${new Date(c.d + "T12:00:00Z").toUTCString()}</pubDate><description>${X(c.b || c.t)}</description></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>companywork changelog</title><link>https://adminmossel.github.io/companywork/changelog.html</link><description>Alle wijzigingen van MHVwork, de basis van companywork.</description><language>nl</language><lastBuildDate>${new Date(d.commits[0].d + "T12:00:00Z").toUTCString()}</lastBuildDate>${items}</channel></rss>\n`;
}
const cs = await commits();
const md = process.env.SRC_LOCAL ? fs.readFileSync(process.env.SRC_LOCAL + "/CHANGELOG.md", "utf8") : await get(`https://raw.githubusercontent.com/${REPO}/main/CHANGELOG.md`, false);
const next = { repo: REPO, entries: JSON.parse(redact(JSON.stringify(parse(md)))), commits: cs };
let old = {}; try { old = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
fs.writeFileSync("changelog.xml", rss(next));
const dts = next.commits.map(c => c.d).sort();
fs.writeFileSync("changelog-summary.json", JSON.stringify({ commits: next.commits.length, versions: next.entries.length, first: dts[0], last: dts[dts.length - 1] }) + "\n");
const same = JSON.stringify({ ...old, synced: 0 }) === JSON.stringify({ ...next, synced: 0 });
if (same) console.log("Geen wijzigingen.");
else { fs.writeFileSync(OUT, JSON.stringify({ ...next, synced: new Date().toISOString() }, null, 1)); console.log(`Gesynchroniseerd: ${cs.length} commits, ${next.entries.length} versies.`); }
