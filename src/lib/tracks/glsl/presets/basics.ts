// Playground presets for the language, shapes, patterns and colour chapters.
import type { PlaygroundPreset } from "@/components/lesson/glsl/ShaderPlayground";
import { pickTexture } from "@/components/lesson/glsl/textures";

const TILES = pickTexture("mat:squareceramicglossytile-aqua-blue:albedo", "mat:squarestackedpavertexture-grey:albedo", "uvgrid");
const WOOD = pickTexture("mat:wood-texture:albedo", "clouds");
const PAVER = pickTexture("mat:squarestackedpavertexture-grey:albedo", "checker");

// ── The playground itself ─────────────────────────────────────────────────────
export const INTRO_PRESETS: PlaygroundPreset[] = [
  {
    id: "hello", label: "hello, gradient",
    note: "One function, run once per pixel. uv goes from 0 to 1 across the canvas; the cosine turns it (and time) into colour.",
    frag: `// Runs once for every pixel of the canvas.
void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;     // 0..1 across the canvas

    // Three cosines, phase-shifted per channel, drifting with time
    vec3 col = 0.5 + 0.5 * cos(uTime + uv.xyx + vec3(0.0, 2.0, 4.0));

    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "controls", label: "sliders & mouse",
    note: "The comments after the uniforms create the controls above. Click and drag on the canvas to move the circle (uMouse.xy, in pixels).",
    frag: `uniform float uRadius;   // @slider 0.02 0.6 0.2
uniform float uSoft;     // @slider 0.001 0.3 0.01
uniform vec3  uColor;    // @color 1.0 0.55 0.1
uniform float uRings;    // @toggle 1

void main() {
    // Centred, aspect-correct: y in [-0.5, 0.5]
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec2 m  = (uMouse.xy       - 0.5 * uResolution) / uResolution.y;
    if (uMouse.x + uMouse.y == 0.0)                       // never clicked: wander
        m = vec2(0.35 * cos(uTime), 0.2 * sin(uTime * 1.3));

    float d = length(uv - m) - uRadius;                   // signed distance to the circle
    float shape = 1.0 - smoothstep(0.0, uSoft, d);

    vec3 bg = vec3(0.07, 0.08, 0.1);
    if (uRings > 0.5) bg += 0.04 * sin(80.0 * d);          // iso-distance rings
    FragColor = vec4(mix(bg, uColor, shape), 1.0);
}`,
  },
  {
    id: "texture", label: "texture + time",
    channels: [TILES],
    note: "uTex0 is bound to a texture from the library (pick another one above). The UV is pushed around by two sines before sampling.",
    frag: `uniform float uWarp;     // @slider 0.0 0.1 0.02
uniform float uFreq;     // @slider 1.0 30.0 10.0

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;          // square texels
    uv += uWarp * vec2(sin(uv.y * uFreq + uTime * 2.0),
                       cos(uv.x * uFreq + uTime * 1.7));
    FragColor = vec4(texture(uTex0, uv).rgb, 1.0);
}`,
  },
  {
    id: "shadertoy", label: "ShaderToy code",
    note: "Code pasted from shadertoy.com works as is: mainImage(), iTime, iResolution, iMouse and iChannel0..3 are mapped onto the playground's uniforms.",
    frag: `// A ShaderToy-style shader: no main(), no FragColor.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x), r = length(uv);

    float stripes = sin(10.0 * a + 8.0 / (r + 0.1) - 4.0 * iTime);
    vec3 col = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + r * 4.0 - iTime + stripes);
    fragColor = vec4(col * smoothstep(0.0, 0.3, r), 1.0);
}`,
  },
  {
    id: "mesh", label: "lit mesh (vertex + fragment)",
    mode: "mesh", mesh: "torus", channels: [PAVER],
    note: "Mesh mode: a real vertex shader (tab 'vertex') feeds vWorld, vNormal, vUV and vTangent to this fragment shader. Drag to orbit, scroll to zoom.",
    frag: `uniform vec3  uAlbedo;   // @color 0.9 0.45 0.2
uniform float uShine;    // @slider 4 256 48
uniform float uUseTex;   // @toggle 0

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorld);
    vec3 H = normalize(uLightDir + V);                 // Blinn-Phong half vector

    vec3 base = mix(uAlbedo, texture(uTex0, vUV * vec2(4.0, 1.0)).rgb, uUseTex);
    float diff = max(dot(N, uLightDir), 0.0);
    float spec = pow(max(dot(N, H), 0.0), uShine) * 0.5;

    vec3 col = base * (0.12 + diff) + spec;
    FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);   // gamma encode
}`,
  },
];

// ── Types & swizzling ─────────────────────────────────────────────────────────
export const SWIZZLE_PRESETS: PlaygroundPreset[] = [
  {
    id: "swizzle", label: "swizzles on a colour",
    channels: [TILES],
    note: "Each band applies a different swizzle to the same texture colour: .rgb, .bgr, .grb, .rrr, .ggg, vec3(c.b), c.rgb * c.a.",
    frag: `uniform int uMode;   // @slider 0 6 1

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    vec4 c  = texture(uTex0, uv);

    vec3 col;
    if      (uMode == 0) col = c.rgb;          // unchanged
    else if (uMode == 1) col = c.bgr;          // reversed channels
    else if (uMode == 2) col = c.grb;          // red and green swapped
    else if (uMode == 3) col = c.rrr;          // red channel as grey
    else if (uMode == 4) col = c.ggg;          // green channel as grey
    else if (uMode == 5) col = vec3(c.b);      // same thing, written as a constructor
    else                 col = c.rgb * c.a;    // premultiplied

    // the left strip always shows the original, for comparison
    if (gl_FragCoord.x < uResolution.x * 0.15) col = c.rgb;
    FragColor = vec4(col, 1.0);
}`,
  },
];

// ── Signed distance functions ─────────────────────────────────────────────────
const SD_COMMON = `float sdCircle(vec2 p, float r) { return length(p) - r; }

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// IQ's distance-field colouring: orange outside, blue inside,
// bands every 0.04 units, white on the zero line
vec3 shade(float d) {
    vec3 col = (d > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-6.0 * abs(d));
    col *= 0.8 + 0.2 * cos(150.0 * d);
    return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.01, abs(d)));
}`;

export const SDF_PRESETS: PlaygroundPreset[] = [
  {
    id: "field", label: "distance field explorer",
    note: "Click and drag: the yellow circle has radius |d| at the pointer, the largest circle that touches no surface. Shape 0–4: circle, box, segment, triangle, star. Rounding and onion work on any of them.",
    frag: `uniform int   uShape;   // @slider 0 4 1
uniform float uRound;   // @slider 0.0 0.3 0.0
uniform float uOnion;   // @slider 0.0 0.1 0.0

${SD_COMMON}

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float sdTriangle(vec2 p, float r) {                  // equilateral
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}

float sdStar5(vec2 p, float r, float rf) {
    const vec2 k1 = vec2(0.809016994, -0.587785252);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float scene(vec2 p) {
    float d;
    if      (uShape == 0) d = sdCircle(p, 0.5);
    else if (uShape == 1) d = sdBox(p, vec2(0.6, 0.35));
    else if (uShape == 2) d = sdSegment(p, vec2(-0.5, -0.3), vec2(0.5, 0.3));
    else if (uShape == 3) d = sdTriangle(p, 0.55);
    else                  d = sdStar5(p, 0.6, 0.45);
    d -= uRound;                               // grow by r: rounded corners for free
    if (uOnion > 0.0) d = abs(d) - uOnion;     // hollow shell of thickness 2w
    return d;
}

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec3 col = shade(scene(p));

    if (uMouse.x + uMouse.y > 0.0) {
        vec2 m = (2.0 * uMouse.xy - uResolution) / uResolution.y;
        float dm = scene(m);
        float ring = abs(length(p - m) - abs(dm));
        col = mix(col, vec3(1.0, 0.9, 0.1), 1.0 - smoothstep(0.003, 0.009, ring));
        col = mix(col, vec3(1.0, 0.9, 0.1), 1.0 - smoothstep(0.012, 0.02, length(p - m)));
    }
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "ops", label: "boolean & smooth operations",
    note: "Green outline: the moving circle a. Pink: the box b. uOp 0–4: union min(a,b), intersection max(a,b), subtraction max(b,−a), smooth subtraction, smooth union. uK is the blend radius.",
    frag: `uniform int   uOp;   // @slider 0 4 4
uniform float uK;    // @slider 0.0 0.5 0.2

${SD_COMMON}

// Polynomial smooth minimum (IQ): blends within distance k
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
float smax(float a, float b, float k) { return -smin(-a, -b, k); }

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    float a = sdCircle(p - vec2(0.45 * sin(uTime * 0.8), 0.0), 0.42);
    float b = sdBox(p - vec2(-0.15, 0.05), vec2(0.4, 0.28));
    float k = max(uK, 1e-4);

    float d;
    if      (uOp == 0) d = min(a, b);
    else if (uOp == 1) d = max(a, b);
    else if (uOp == 2) d = max(b, -a);
    else if (uOp == 3) d = smax(b, -a, k);
    else               d = smin(a, b, k);

    vec3 col = shade(d);
    col = mix(col, vec3(0.2, 1.0, 0.4), 0.7 * (1.0 - smoothstep(0.0, 0.008, abs(a))));
    col = mix(col, vec3(1.0, 0.3, 0.6), 0.7 * (1.0 - smoothstep(0.0, 0.008, abs(b))));
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "icon", label: "a UI icon from SDFs",
    note: "A rounded button with a drop shadow, a glow and a play symbol. Every edge is anti-aliased with fwidth, so it stays crisp at any size. This is how SDF-based UI and text renderers work.",
    frag: `uniform float uGlow;    // @slider 0.0 1.0 0.5
uniform float uCorner;  // @slider 0.0 0.4 0.14
uniform vec3  uTint;    // @color 0.25 0.55 1.0

float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdTriangle(vec2 p, float r) {
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
}
// Anti-aliased fill: 1 inside, 0 outside, one pixel of blend
float fill(float d) { float w = fwidth(d); return 1.0 - smoothstep(-w, w, d); }

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    p *= 1.0 + 0.05 * sin(uTime * 2.0);                      // gentle pulse

    float box    = sdRoundBox(p, vec2(0.6, 0.42), uCorner);
    float shadow = sdRoundBox(p - vec2(0.04, -0.07), vec2(0.6, 0.42), uCorner);
    float play   = sdTriangle(vec2(-p.y, p.x - 0.04), 0.22); // rotated to point right

    vec3 col = vec3(0.09, 0.1, 0.13);
    col = mix(col, vec3(0.0), 0.5 * (1.0 - smoothstep(-0.05, 0.12, shadow)));
    col += uGlow * uTint * exp(-10.0 * max(box, 0.0)) * step(0.0, box) * 0.6;
    col = mix(col, uTint, fill(box));
    col = mix(col, vec3(1.0), fill(abs(box) - 0.008) * 0.6);   // thin border
    col = mix(col, vec3(1.0), fill(play));
    FragColor = vec4(col, 1.0);
}`,
  },
];

// ── Patterns & transformations ────────────────────────────────────────────────
const HASH = `float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}`;

export const PATTERN_PRESETS: PlaygroundPreset[] = [
  {
    id: "tiling", label: "tiling with cell ids",
    note: "fract() gives each tile its own local coordinates; floor() gives it an integer id. Hashing the id gives every tile its own colour, size and spin, from the same few lines.",
    frag: `uniform float uTiles;   // @slider 1 20 6
uniform float uSpin;    // @slider 0 4 1.5

${HASH}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec2 g  = uv * uTiles;
    vec2 id = floor(g);                 // which tile
    vec2 f  = fract(g) - 0.5;           // where inside it, centred

    float r = hash21(id);               // one random number per tile
    f = rot(uTime * (r - 0.5) * uSpin) * f;
    float d = sdBox(f, vec2(0.18 + 0.12 * r));

    vec3 tile = 0.5 + 0.5 * cos(6.2832 * (r + vec3(0.0, 0.33, 0.67)));
    vec2 e = abs(fract(g) - 0.5);
    vec3 bg = vec3(0.07, 0.08, 0.1) + 0.05 * step(0.48, max(e.x, e.y));
    float w = fwidth(d);
    FragColor = vec4(mix(bg, tile, 1.0 - smoothstep(-w, w, d)), 1.0);
}`,
  },
  {
    id: "kaleido", label: "polar kaleidoscope",
    channels: [TILES],
    note: "Convert to polar (angle, radius), fold the angle into one wedge with mod and mirror it with abs, then convert back. Any texture becomes a kaleidoscope.",
    frag: `uniform float uSegments;  // @slider 2 16 6
uniform float uTwist;     // @slider -3.0 3.0 0.6
uniform float uZoom;      // @slider 0.2 3.0 0.8

const float TAU = 6.2831853;

void main() {
    vec2 p = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    float r = length(p);
    float a = atan(p.y, p.x) + uTwist * r + uTime * 0.15;

    float seg = TAU / uSegments;
    a = mod(a, seg);                   // every wedge sees the same angles…
    a = abs(a - 0.5 * seg);            // …and mirrors them, so seams match

    vec2 q = r * vec2(cos(a), sin(a)); // back to Cartesian
    vec3 col = texture(uTex0, q * uZoom + vec2(uTime * 0.03, 0.0)).rgb;
    col *= smoothstep(1.3, 0.3, r);    // vignette
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "truchet", label: "Truchet tiles",
    note: "Each tile holds two quarter-circle arcs; a random mirror per tile picks one of two orientations. The arcs always meet their neighbours, so random choices still form continuous curves.",
    frag: `uniform float uTiles;   // @slider 2 30 9
uniform float uWidth;   // @slider 0.02 0.3 0.09

${HASH}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y * uTiles;
    uv += uTime * 0.3;
    vec2 id = floor(uv);
    vec2 f  = fract(uv) - 0.5;
    float flip = step(0.5, hash21(id));
    if (flip > 0.5) f.x = -f.x;                          // the second orientation

    // distance to the two arcs centred on opposite corners
    float d = min(abs(length(f - 0.5) - 0.5), abs(length(f + 0.5) - 0.5));
    float w = fwidth(d);
    float line = 1.0 - smoothstep(uWidth - w, uWidth + w, d);

    // colour flows along the curves: checkerboard parity
    float parity = mod(id.x + id.y, 2.0);
    vec3 col = mix(vec3(0.95, 0.55, 0.2), vec3(0.2, 0.6, 0.95), abs(parity - flip));
    FragColor = vec4(mix(vec3(0.06, 0.07, 0.09), col, line), 1.0);
}`,
  },
];

// ── Colour ────────────────────────────────────────────────────────────────────
export const COLOR_PRESETS: PlaygroundPreset[] = [
  {
    id: "palette", label: "cosine palette in use",
    note: "A cosine palette indexed by distance and time, layered over fract()-repeated space (after kishimisu). Change the four vectors in palette() to restyle everything.",
    frag: `uniform float uLayers;   // @slider 1 6 4

vec3 palette(float t) {
    vec3 a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d = vec3(0.26, 0.42, 0.56);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv  = (2.0 * gl_FragCoord.xy - uResolution) / uResolution.y;
    vec2 uv0 = uv;
    vec3 col = vec3(0.0);
    for (float i = 0.0; i < 6.0; i++) {
        if (i >= uLayers) break;
        uv = fract(uv * 1.5) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        vec3  c = palette(length(uv0) + i * 0.4 + uTime * 0.4);
        d = abs(sin(d * 8.0 + uTime) / 8.0);
        d = pow(0.01 / d, 1.2);                       // bright thin rings
        col += c * d;
    }
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "hsv", label: "HSV: hue shift & saturation",
    channels: [WOOD],
    note: "Left: the HSV colour wheel (angle = hue, radius = saturation). Right: the texture converted to HSV, its hue rotated and saturation scaled, then converted back.",
    frag: `uniform float uHue;     // @slider 0.0 1.0 0.0
uniform float uSat;     // @slider 0.0 2.0 1.0
uniform float uVal;     // @slider 0.0 2.0 1.0

vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 col;
    if (uv.x < 0.42) {
        vec2 p = (gl_FragCoord.xy - vec2(0.21, 0.5) * uResolution) / (0.19 * uResolution.x);
        float h = atan(p.y, p.x) / 6.2832 + 0.5 + uHue;
        col = hsv2rgb(vec3(h, clamp(length(p), 0.0, 1.0) * min(uSat, 1.0), uVal));
        col *= 1.0 - smoothstep(0.99, 1.01, length(p));
    } else {
        vec3 hsv = rgb2hsv(texture(uTex0, gl_FragCoord.xy / uResolution.y).rgb);
        hsv.x = fract(hsv.x + uHue);
        hsv.y = clamp(hsv.y * uSat, 0.0, 1.0);
        hsv.z *= uVal;
        col = hsv2rgb(hsv);
    }
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "gamma", label: "linear vs sRGB mixing",
    note: "Top: red→green mixed directly on sRGB values, which gives a muddy dark middle. Middle: converted to linear light, mixed, converted back. Bottom: a 1-pixel black/white checker, flat 0.5 and flat 0.73. From a distance the checker (50% light) matches 0.73, not 0.5.",
    frag: `uniform vec3 uA;   // @color 1.0 0.0 0.0
uniform vec3 uB;   // @color 0.0 1.0 0.0

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSRGB(vec3 c)   { return pow(c, vec3(1.0 / 2.2)); }

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 col;
    if (uv.y > 0.667)
        col = mix(uA, uB, uv.x);                                  // wrong: mixing encoded values
    else if (uv.y > 0.333)
        col = toSRGB(mix(toLinear(uA), toLinear(uB), uv.x));     // right: mix light, then encode
    else {
        float checker = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y), 2.0);
        col = uv.x < 0.333 ? vec3(checker) : uv.x < 0.667 ? vec3(0.5) : vec3(0.73);
    }
    float band = min(abs(uv.y - 0.667), abs(uv.y - 0.333));
    col = mix(vec3(0.05), col, smoothstep(0.0, 0.004, band));
    FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: "blend", label: "blend modes",
    channels: [TILES, WOOD],
    note: "The same two layers combined with the blend modes from image editors. Modes 0–5: normal, multiply, screen, overlay, soft light, add. Each is a line of GLSL.",
    frag: `uniform int   uMode;    // @slider 0 5 3
uniform float uOpacity; // @slider 0.0 1.0 1.0

vec3 overlay(vec3 a, vec3 b)   { return mix(2.0 * a * b, 1.0 - 2.0 * (1.0 - a) * (1.0 - b), step(0.5, a)); }
vec3 softLight(vec3 a, vec3 b) { return (1.0 - 2.0 * b) * a * a + 2.0 * b * a; }   // Pegtop

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.y;
    vec3 base = texture(uTex0, uv).rgb;          // bottom layer
    vec3 top  = texture(uTex1, uv * 0.7).rgb;    // top layer

    vec3 r;
    if      (uMode == 0) r = top;
    else if (uMode == 1) r = base * top;                          // multiply: only darkens
    else if (uMode == 2) r = 1.0 - (1.0 - base) * (1.0 - top);    // screen: only lightens
    else if (uMode == 3) r = overlay(base, top);                  // contrast
    else if (uMode == 4) r = softLight(base, top);
    else                 r = min(base + top, 1.0);                // linear dodge (add)

    vec3 col = mix(base, r, uOpacity);
    if (gl_FragCoord.x < uResolution.x * 0.15) col = base;       // original on the left
    FragColor = vec4(col, 1.0);
}`,
  },
];
