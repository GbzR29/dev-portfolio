// ── Textures the shader playground can bind to uTex0..uTex3 ───────────────────
// The user's textures come from the asset manifest (public/textures:
// prototype colour sets and PBR material sets). A few procedural textures are
// always available, so every preset works even when nothing ships.

import assets from "@/lib/generated/assets.json";

type Manifest = {
  prototype: Record<string, string>;
  protoSets?: Record<string, string[]>;
  materials?: Record<string, { label: string; albedo: string; normal?: string; roughness?: string; gloss?: string; ao?: string; metallic?: string; height?: string }>;
};
const M = assets as unknown as Manifest;

export type TexOption = { id: string; label: string; group: string; src: () => string | HTMLCanvasElement };

// ── Procedural fallbacks ──────────────────────────────────────────────────────
function canvas(size: number, paint: (g: CanvasRenderingContext2D, img: ImageData | null) => void, pixels = false) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  if (pixels) { const img = g.createImageData(size, size); paint(g, img); g.putImageData(img, 0, 0); }
  else paint(g, null);
  return c;
}
const cache = new Map<string, HTMLCanvasElement>();
const memo = (id: string, make: () => HTMLCanvasElement) => () => { if (!cache.has(id)) cache.set(id, make()); return cache.get(id)!; };

/** Tileable RGBA white noise: each channel independent — the classic "noise texture" for shaders. */
const noiseRGBA = memo("noise", () => canvas(256, (_, img) => {
  let s = 1234567;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s >>> 24; };
  for (let i = 0; i < img!.data.length; i++) img!.data[i] = rnd();
}, true));

/** Smooth tileable value-noise clouds (greyscale). */
const clouds = memo("clouds", () => canvas(256, (_, img) => {
  const N = 256, lat = (f: number) => {
    const g: number[] = [];
    let s = 99 + f;
    for (let i = 0; i < f * f; i++) { s = (s * 1664525 + 1013904223) >>> 0; g.push(s / 4294967296); }
    return (x: number, y: number) => {
      const fx = (x / N) * f, fy = (y / N) * f, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const at = (a: number, b: number) => g[((a % f) + f) % f + (((b % f) + f) % f) * f];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy;
    };
  };
  const octaves = [4, 8, 16, 32, 64].map(lat);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0, a = 0.5;
    for (const o of octaves) { v += o(x, y) * a; a *= 0.5; }
    const b = Math.max(0, Math.min(255, v * 270)), i = (y * N + x) * 4;
    img!.data.set([b, b, b, 255], i);
  }
}, true));

const checker = memo("checker", () => canvas(256, g => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#2a2d34" : "#d8d8d8"; g.fillRect(x * 32, y * 32, 32, 32); }
}));

const uvGrid = memo("uvgrid", () => canvas(512, g => {
  const img = g.createImageData(512, 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) img.data.set([x / 2, 255 - y / 2, 90, 255], (y * 512 + x) * 4);
  g.putImageData(img, 0, 0);
  g.strokeStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  g.fillStyle = "white"; g.font = "bold 22px monospace";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.fillText(`${String.fromCharCode(65 + x)}${8 - y}`, x * 64 + 14, y * 64 + 40);
}));

// ── The full list ─────────────────────────────────────────────────────────────
export function textureOptions(): TexOption[] {
  const out: TexOption[] = [
    { id: "noise", label: "RGBA noise", group: "procedural", src: noiseRGBA },
    { id: "clouds", label: "clouds (fBm)", group: "procedural", src: clouds },
    { id: "checker", label: "checker", group: "procedural", src: checker },
    { id: "uvgrid", label: "UV grid", group: "procedural", src: uvGrid },
  ];
  for (const [id, m] of Object.entries(M.materials ?? {})) {
    const nice = m.label.replace(/Texture|_/g, " ").replace(/\s+/g, " ").trim();
    (["albedo", "normal", "roughness", "gloss", "ao", "height"] as const).forEach(ch => {
      const url = m[ch];
      if (url) out.push({ id: `mat:${id}:${ch}`, label: `${nice} · ${ch}`, group: "materials", src: () => url });
    });
  }
  for (const [colour, list] of Object.entries(M.protoSets ?? {})) {
    list.forEach((url, i) => out.push({ id: `proto:${colour}:${i + 1}`, label: `${colour} ${String(i + 1).padStart(2, "0")}`, group: "prototype", src: () => url }));
  }
  return out;
}

/** First material id with the given channel, for presets that want "some albedo" / "some normal map". */
export function firstMaterial(channel: "albedo" | "normal" | "height" = "albedo", prefer?: string): string | null {
  const mats = Object.entries(M.materials ?? {});
  const hit = (prefer ? mats.find(([id, m]) => id.includes(prefer) && m[channel]) : undefined) ?? mats.find(([, m]) => m[channel]);
  return hit ? `mat:${hit[0]}:${channel}` : null;
}

// ── Loading, cached per context ───────────────────────────────────────────────
const loaded = new WeakMap<WebGL2RenderingContext, Map<string, Promise<WebGLTexture>>>();

export function loadOption(gl: WebGL2RenderingContext, id: string): Promise<WebGLTexture> {
  let per = loaded.get(gl);
  if (!per) { per = new Map(); loaded.set(gl, per); }
  const hit = per.get(id);
  if (hit) return hit;
  const opt = textureOptions().find(o => o.id === id) ?? textureOptions()[0];
  const p = (async () => {
    const src = opt.src();
    const im = typeof src === "string"
      ? await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; })
      : src;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);             // uv (0,0) = bottom-left, like OpenGL with stb_image flipped
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    return tex;
  })();
  per.set(id, p);
  return p;
}

const PROCEDURAL = new Set(["noise", "clouds", "checker", "uvgrid"]);

/** The first candidate that exists (checked against the manifest only, so it is safe at module load). */
export function pickTexture(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (!c) continue;
    if (PROCEDURAL.has(c)) return c;
    const [kind, a, b] = c.split(":");
    if (kind === "mat" && M.materials?.[a]?.[b as "albedo"]) return c;
    if (kind === "proto" && M.protoSets?.[a]?.[Number(b) - 1]) return c;
  }
  return "checker";
}
