// ── Window Lab shader ─────────────────────────────────────────────────────────
// A pane of glass in front of a scene (a mipmapped 2D texture). The glass can
// be frosted (rough), fogged by condensation (a mask the viewer wipes with the
// pointer) and covered in rain: static drops, and drops that slide down in
// jerks leaving trails of droplets behind. Drops act as lenses: the
// background is sampled at an offset given by the gradient of the drop
// "height" field, sharp through the drops and blurred elsewhere.
//
// The rain technique follows Martijn Steinrucken's (BigWIngs) “Heartfelt”
// Shadertoy (2017): layers of grid cells, a sawtooth fall, a wiggle, trails
// and mip-level blur. This is a re-derivation written for the lesson, not a
// copy of his code.

export type WindowParams = {
  rain: number;          // 0 … 1
  speed: number;
  size: number;          // drop scale (bigger = larger drops, fewer of them)
  staticDrops: number;   // 0 … 1
  trails: number;        // 0 … 1
  fog: number;           // condensation 0 … 1
  blur: number;          // blur behind fogged glass (mip levels)
  frost: number;         // roughness of frosted glass 0 … 1
  refraction: number;
  dispersion: number;
  reflection: number;
  tint: [number, number, number];
  view: number;          // 0 final, 1 drop mask, 2 drop normals, 3 trails, 4 condensation
};

export const DEFAULT_WINDOW: WindowParams = {
  rain: 0.75, speed: 1, size: 1, staticDrops: 0.8, trails: 1, fog: 0.8, blur: 4.5, frost: 0,
  refraction: 1, dispersion: 0.12, reflection: 0.25, tint: [1, 1, 1], view: 0,
};

export const WINDOW_PRESETS: { id: string; label: string; p: Partial<WindowParams> }[] = [
  { id: "rain", label: "Rainy night", p: { rain: 0.75, fog: 0.8, frost: 0, staticDrops: 0.8, trails: 1 } },
  { id: "storm", label: "Downpour", p: { rain: 1, speed: 1.6, size: 0.8, fog: 0.9, staticDrops: 1, trails: 1 } },
  { id: "drizzle", label: "Drizzle, clear glass", p: { rain: 0.3, fog: 0, staticDrops: 1, trails: 0.4, blur: 0 } },
  { id: "fogged", label: "Fogged window", p: { rain: 0, fog: 1, staticDrops: 0, blur: 5 } },
  { id: "frosted", label: "Frosted glass", p: { rain: 0, fog: 0, frost: 0.6, staticDrops: 0 } },
];

export const WINDOW_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
uniform sampler2D uScene, uMask;
uniform vec2  uRes;
uniform float uT, uRain, uSpeed, uSize, uStatic, uTrails, uFog, uBlur, uFrost, uRefr, uDisp, uRefl;
uniform vec3  uTint;
uniform int   uView;

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
vec3 hash31(float p) {
  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}
float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// Sawtooth that rises for a short part b of the period and falls for the rest:
// the drop waits (surface tension holds it), then lets go and slides.
float saw(float b, float t) { return smoothstep(0.0, b, t) * smoothstep(1.0, b, t); }

// One layer of sliding drops. Returns (drop mask, trail mask).
vec2 slidingLayer(vec2 uv, float t) {
  vec2 UV = uv;
  const vec2 aspect = vec2(6.0, 1.0);                 // cells are 6× taller than wide
  vec2 grid = aspect * 2.0;
  uv.y += t * 0.75;                                   // the whole grid scrolls down…
  float colShift = hash11(floor(uv.x * grid.x));      // …each column offset differently
  uv.y += colShift;
  vec2 id = floor(uv * grid);
  vec3 n = hash31(id.x * 35.2 + id.y * 2376.1);       // three random numbers per cell
  vec2 st = fract(uv * grid) - vec2(0.5, 0.0);        // cell coords: x −0.5…0.5, y 0…1

  // Where the drop is inside its cell
  float x = n.x - 0.5;
  float wy = UV.y * 20.0;
  x += sin(wy + sin(wy)) * (0.5 - abs(x)) * (n.z - 0.5);   // wiggle while sliding
  x *= 0.7;
  float ti = fract(t + n.z);                          // this drop's own clock
  float y = (saw(0.85, ti) - 0.5) * 0.9 + 0.5;        // wait, then slide

  float d = length((st - vec2(x, y)) * aspect.yx);    // distance in round (not stretched) units
  float drop = smoothstep(0.4, 0.0, d);

  // Trail: a vertical strip above the drop, thinner the higher it goes
  float r = sqrt(smoothstep(1.0, y, st.y));
  float cd = abs(st.x - x);
  float trailFront = smoothstep(-0.02, 0.02, st.y - y);     // only above the drop
  float trail = smoothstep(0.23 * r, 0.15 * r * r, cd) * trailFront * r * r;

  // Droplets left behind along the trail
  float ly = fract(UV.y * 10.0) + (st.y - 0.5);
  float droplets = smoothstep(0.3, 0.0, length(st - vec2(x, ly))) * r * trailFront;

  return vec2(drop + droplets * uTrails, trail * uTrails);
}

// Small static drops that appear and slowly evaporate
float staticLayer(vec2 uv, float t) {
  uv *= 40.0;
  vec2 id = floor(uv);
  uv = fract(uv) - 0.5;
  vec3 n = hash31(id.x * 107.45 + id.y * 3543.654);
  vec2 p = (n.xy - 0.5) * 0.7;
  float fade = saw(0.025, fract(t + n.z));            // appear fast, dry slowly
  return smoothstep(0.3, 0.0, length(uv - p)) * fract(n.z * 10.0) * fade;
}

// All drop layers: (height-ish mask, trail mask)
vec2 drops(vec2 uv, float t) {
  float s = staticLayer(uv, t) * uStatic * smoothstep(0.0, 0.3, uRain);
  vec2 m1 = slidingLayer(uv, t) * smoothstep(0.25, 0.75, uRain);
  vec2 m2 = slidingLayer(uv * 1.85, t) * smoothstep(0.0, 0.5, uRain);
  float c = smoothstep(0.3, 1.0, s + m1.x + m2.x);
  return vec2(c, max(m1.y, m2.y));
}

// Blurred background: the mip chain plus a few rotated taps to hide its blockiness
vec3 scene(vec2 uv, float lod) {
  if (lod < 0.5) return texture(uScene, uv).rgb;
  vec3 c = textureLod(uScene, uv, lod).rgb;
  float r = exp2(lod) / uRes.y * 0.6;
  for (int i = 0; i < 6; i++) {
    float a = float(i) * 1.0472 + 0.4;
    c += textureLod(uScene, uv + vec2(cos(a), sin(a)) * r, lod).rgb;
  }
  return c / 7.0;
}

void main() {
  vec2 UV = vUV;
  vec2 uv = (vUV - 0.5) * vec2(uRes.x / uRes.y, 1.0) / uSize;
  float t = uT * 0.2 * uSpeed;

  // Drops and their normals: the gradient of the drop mask, by finite differences
  vec2 c = drops(uv, t);
  vec2 e = vec2(0.001, 0.0);
  float cx = drops(uv + e, t).x, cy = drops(uv + e.yx, t).x;
  vec2 n = vec2(cx - c.x, cy - c.x);

  // Condensation: the wiped mask, cleared further by the trails of sliding drops
  float mask = texture(uMask, UV).r;
  float fogged = uFog * mask * (1.0 - c.y);
  // Frosted glass: a rough surface scatters every ray a little, i.e. blur, plus grain
  float grain = (hash21(gl_FragCoord.xy) - 0.5) * uFrost * 0.004;
  float lod = max(fogged * uBlur, uFrost * 5.0);
  lod = mix(lod, 0.0, smoothstep(0.1, 0.2, c.x));      // sharp through a drop

  vec2 off = n * uRefr + grain;
  vec3 col;
  if (uDisp > 0.0) {
    col.r = scene(UV + off * (1.0 + 0.3 * uDisp), lod).r;
    col.g = scene(UV + off, lod).g;
    col.b = scene(UV + off * (1.0 - 0.3 * uDisp), lod).b;
  } else col = scene(UV + off, lod);

  // Condensation scatters light: fogged glass is lighter and greyer
  col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * 0.8 + 0.1, fogged * 0.35);
  // A faint reflection of the room behind the viewer, stronger on fogged glass
  vec2 q = UV - vec2(0.7, 0.75);
  col += uRefl * (vec3(1.0, 0.85, 0.6) * exp(-dot(q, q) * 40.0) * 0.25 + vec3(0.02, 0.025, 0.03));
  col *= uTint * 1.6;                                  // exposure: the night scene is painted dark

  if (uView == 1) col = vec3(c.x);
  if (uView == 2) col = vec3(n * 30.0 + 0.5, 0.5);
  if (uView == 3) col = vec3(c.y);
  if (uView == 4) col = vec3(fogged);
  FragColor = vec4(col, 1.0);
}`;

/** Paints the scene behind the window: a rainy city at night. */
export function paintCity(w = 1280, h = 720): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#101830"); sky.addColorStop(0.55, "#2a3048"); sky.addColorStop(1, "#3a2c38");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  // far buildings, then near ones, each with lit windows
  for (const [layer, base, shade] of [[0, 0.55, "#141828"], [1, 0.7, "#0d0f18"]] as const) {
    let x = -20;
    while (x < w) {
      const bw = 40 + rnd() * (layer ? 140 : 90), bh = h * (0.15 + rnd() * (layer ? 0.45 : 0.3));
      const top = h * base - bh + (layer ? h * 0.25 : 0);
      g.fillStyle = shade; g.fillRect(x, top, bw, h);
      for (let wy = top + 8; wy < h * 0.95; wy += 14) for (let wx = x + 6; wx < x + bw - 8; wx += 12) {
        if (rnd() < 0.35) {
          g.fillStyle = rnd() < 0.7 ? `rgba(255,${190 + rnd() * 50},${110 + rnd() * 60},${0.5 + rnd() * 0.5})` : `rgba(170,210,255,${0.4 + rnd() * 0.4})`;
          g.fillRect(wx, wy, 6, 8);
        }
      }
      x += bw + rnd() * 10;
    }
  }
  // street lights and car lights: soft glowing discs (they become bokeh when blurred)
  const glow = (x: number, y: number, r: number, col: string) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (let i = 0; i < 20; i++) glow(rnd() * w, h * (0.55 + rnd() * 0.15), 22 + rnd() * 20, "rgba(255,200,120,0.95)");
  for (let i = 0; i < 10; i++) glow(rnd() * w, h * (0.3 + rnd() * 0.3), 14 + rnd() * 16, ["rgba(90,200,255,0.9)", "rgba(255,90,180,0.9)", "rgba(140,255,160,0.8)"][i % 3]);
  for (let i = 0; i < 36; i++) glow(rnd() * w, h * (0.84 + rnd() * 0.08), 8 + rnd() * 10, rnd() < 0.5 ? "rgba(255,60,50,0.95)" : "rgba(255,250,230,0.95)");
  // wet street reflections
  const street = g.createLinearGradient(0, h * 0.8, 0, h);
  street.addColorStop(0, "rgba(40,35,45,0.0)"); street.addColorStop(1, "rgba(60,45,40,0.6)");
  g.fillStyle = street; g.fillRect(0, h * 0.8, w, h * 0.2);
  return c;
}
