// Lists the optional lesson textures that exist under public/textures and
// writes src/lib/generated/assets.json. Figures only request files listed
// there, so a missing texture falls back to its procedural version without a
// 404. Runs automatically before `dev` and `build` (see package.json).
//
//   public/textures/prototype/<name>.png|jpg       cube textures
//   public/textures/icons/<name>.png|svg|webp      figure icons (sun, eye, camera…)
//   public/textures/maps/<name>.png|jpg             lighting maps (container_diffuse…)
//   public/textures/skybox/<set>/px|nx|py|ny|pz|nz.png|jpg   cubemap faces
//   public/textures/skybox/<set>/equirect.png|jpg             2:1 panorama

import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public", "textures");
const IMG = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

/** { name: "/textures/<dir>/<file>" } for every image directly inside dir. */
function images(dir) {
  const abs = join(pub, dir);
  if (!existsSync(abs)) return {};
  const out = {};
  for (const f of readdirSync(abs)) {
    if (!IMG.has(extname(f).toLowerCase())) continue;
    if (statSync(join(abs, f)).isFile()) out[basename(f, extname(f)).toLowerCase()] = `/textures/${dir}/${f}`;
  }
  return out;
}

const FACES = ["px", "nx", "py", "ny", "pz", "nz"];
const skybox = {};
const skyRoot = join(pub, "skybox");
if (existsSync(skyRoot)) {
  for (const set of readdirSync(skyRoot)) {
    if (!statSync(join(skyRoot, set)).isDirectory()) continue;
    const files = images(`skybox/${set}`);
    const entry = {};
    if (FACES.every(f => files[f])) entry.faces = FACES.map(f => files[f]);
    if (files.equirect) entry.equirect = files.equirect;
    if (entry.faces || entry.equirect) skybox[set] = entry;
  }
}

const manifest = { prototype: images("prototype"), icons: images("icons"), maps: images("maps"), skybox };
const outDir = join(root, "src", "lib", "generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "assets.json"), JSON.stringify(manifest, null, 2) + "\n");

const count = Object.keys(manifest.prototype).length + Object.keys(manifest.icons).length
  + Object.keys(manifest.maps).length + Object.keys(skybox).length;
console.log(`[assets] ${count} optional texture entr${count === 1 ? "y" : "ies"} found`);
