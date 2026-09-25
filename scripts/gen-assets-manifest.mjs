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
//   public/textures/prototype/<Colour>/texture_NN.png          per-colour prototype sets:
//                                                             texture_01 is the colour's default tile,
//                                                             every variant is listed under protoSets
//   public/textures/materials_textures/<set>/…                 PBR material sets; channels are detected
//                                                             from the file names (BaseColor/COL, Normal/NRM,
//                                                             Roughness, GLOSS, AmbientOcclusion/AO, Metallic,
//                                                             Displacement/DISP). Loose images become
//                                                             albedo-only materials. TIFFs are skipped.

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

// Prototype colour folders: prototype/<Colour>/texture_NN.png
const prototype = images("prototype");
const protoSets = {};
const protoRoot = join(pub, "prototype");
if (existsSync(protoRoot)) {
  for (const dir of readdirSync(protoRoot)) {
    if (!statSync(join(protoRoot, dir)).isDirectory()) continue;
    const files = images(`prototype/${dir}`);
    const list = Object.keys(files).sort().map(k => files[k]);
    if (!list.length) continue;
    const name = dir.toLowerCase();
    protoSets[name] = list;
    prototype[name] ??= files.texture_01 ?? list[0];         // a loose prototype/<name>.png still wins
  }
}

// PBR material sets
const CHANNELS = [
  ["albedo", /basecolor|albedo|diffuse|_col(_|\.)/i],
  ["normal", /normal|_nrm(_|\.)/i],
  ["roughness", /roughness/i],
  ["gloss", /_gloss(_|\.)/i],
  ["ao", /ambientocclusion|_ao(_|\.)/i],
  ["metallic", /metallic|metalness/i],
  ["height", /displacement|height|_disp(_|\.)/i],
];
const materials = {};
const matRoot = join(pub, "materials_textures");
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
if (existsSync(matRoot)) {
  for (const entry of readdirSync(matRoot)) {
    const abs = join(matRoot, entry);
    if (statSync(abs).isDirectory()) {
      const files = readdirSync(abs).filter(f => IMG.has(extname(f).toLowerCase()) && !/preview/i.test(f));
      const set = {};
      for (const [ch, re] of CHANNELS) {
        const hit = files.find(f => re.test(f) && !/16/.test(f.replace(/_\d{4}_/, "_")));
        if (hit) set[ch] = `/textures/materials_textures/${encodeURI(entry)}/${encodeURI(hit)}`;
      }
      if (set.albedo) materials[slug(entry)] = { label: entry, ...set };
    } else if (IMG.has(extname(entry).toLowerCase())) {
      const name = basename(entry, extname(entry));
      materials[slug(name)] = { label: name, albedo: `/textures/materials_textures/${encodeURI(entry)}` };
    }
  }
}

const manifest = { prototype, protoSets, icons: images("icons"), maps: images("maps"), skybox, materials };
const outDir = join(root, "src", "lib", "generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "assets.json"), JSON.stringify(manifest, null, 2) + "\n");

const count = Object.keys(manifest.prototype).length + Object.keys(manifest.icons).length
  + Object.keys(manifest.maps).length + Object.keys(skybox).length + Object.keys(materials).length;
console.log(`[assets] ${count} optional texture entr${count === 1 ? "y" : "ies"} found`);
