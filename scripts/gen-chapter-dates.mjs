// Records when every lesson was created and last changed, from git history,
// and writes src/lib/generated/chapter-dates.json ({ "<track>/<chapter id>":
// { created, updated } }, dates as YYYY-MM-DD). The lesson page shows them.
// Runs automatically before `dev` and `build` (see package.json).
//
//   created  the first commit whose src/lib/tracks/<track>/index.tsx lists the
//            chapter id. The registry is the one file every chapter has been in
//            since March 2026, so this survives chapters being moved or split
//            into modules. Before that (Feb–Mar 2026) the OpenGL and C++ lessons
//            were listed inside src/app/learn/: those files count too.
//   updated  the last commit that touched the chapter's module
//            (src/lib/tracks/<track>/chapters/…); today if it has uncommitted changes.
//
// The file is committed: the deploy builds from a shallow clone, which has no
// history, so there (or without git) the script keeps the existing file.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tracksDir = join(root, "src", "lib", "tracks");
const outFile = join(root, "src", "lib", "generated", "chapter-dates.json");

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const today = new Date().toLocaleDateString("sv");        // local YYYY-MM-DD

try {
  if (git("rev-parse", "--is-shallow-repository").trim() === "true") throw new Error("shallow clone");
} catch (e) {
  console.log(`chapter-dates: no git history (${e.message.split("\n")[0]}), keeping ${existsSync(outFile) ? "the committed file" : "no dates"}`);
  process.exit(0);
}

// ── Last commit per file under src/lib/tracks (newest first) ────────────────
const lastChange = new Map();
let date = "";
for (const line of git("log", "--format=@@%ad", "--date=short", "--name-only", "--", "src/lib/tracks").split("\n")) {
  if (line.startsWith("@@")) date = line.slice(2);
  else if (line && !lastChange.has(line)) lastChange.set(line, date);
}
// Uncommitted edits and new files count as today
for (const line of git("status", "--porcelain", "--untracked-files=all", "--", "src/lib/tracks").split("\n")) {
  if (line.length > 3) lastChange.set(line.slice(3).trim().replace(/^.* -> /, ""), today);
}

// ── First date each `id: "…"` was added to a file's history ─────────────────
function firstSeenIn(path) {
  const seen = new Map();
  let when = "";
  for (const line of git("log", "--reverse", "--format=@@%ad", "--date=short", "-p", "-U0", "--", path).split("\n")) {
    if (line.startsWith("@@") && !line.startsWith("@@ ")) { when = line.slice(2); continue; }
    if (!line.startsWith("+") || line.startsWith("+++")) continue;
    for (const m of line.matchAll(/\bid:\s*["']([\w-]+)["']/g)) if (!seen.has(m[1])) seen.set(m[1], when);
  }
  return seen;
}

// ── Current chapters of every track: id → module file ───────────────────────
const tracks = {};
for (const track of readdirSync(tracksDir).sort()) {
  const index = join(tracksDir, track, "index.tsx");
  if (!existsSync(index)) continue;
  tracks[track] = [];
  for (const line of readFileSync(index, "utf8").split("\n")) {
    const m = line.match(/\bid:\s*"([\w-]+)".*import\("\.\/(chapters\/[^"]+)"\)/);
    if (m) tracks[track].push({ id: m[1], mod: m[2] });
  }
}

// The pre-registry lessons shared files between OpenGL and C++ (both had an
// "intro"): an old id only counts for a track when the other one has no
// chapter with that id today.
const LEGACY_TRACKS = ["opengl", "cpp"];
const legacySeen = firstSeenIn("src/app/learn");
const legacyDate = (track, id) =>
  LEGACY_TRACKS.includes(track) && !LEGACY_TRACKS.some(o => o !== track && tracks[o]?.some(c => c.id === id))
    ? legacySeen.get(id) : undefined;

const dates = {};
for (const [track, chapters] of Object.entries(tracks)) {
  const firstSeen = firstSeenIn(`src/lib/tracks/${track}/index.tsx`);
  for (const { id, mod } of chapters) {
    const created = [legacyDate(track, id), firstSeen.get(id)].filter(Boolean).sort()[0] ?? today;
    const changed = lastChange.get(`src/lib/tracks/${track}/${mod}.tsx`) ?? created;
    dates[`${track}/${id}`] = { created, updated: changed > created ? changed : created };
  }
}

const json = JSON.stringify(dates, null, 2) + "\n";
if (!existsSync(dirname(outFile))) mkdirSync(dirname(outFile), { recursive: true });
if (!existsSync(outFile) || readFileSync(outFile, "utf8") !== json) writeFileSync(outFile, json);
console.log(`chapter-dates: ${Object.keys(dates).length} chapters`);
