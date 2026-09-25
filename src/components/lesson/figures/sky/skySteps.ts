// ── Building the sky layers one step at a time ────────────────────────────────
// For each layer, a list of steps. Every step has the GLSL a reader would
// write at that point (shown in the figure) and the matching branch of
// BUILDER_FS (what is rendered). The last step of each layer calls the real
// function from proceduralSky.ts, so the walkthrough ends exactly where the
// full sky is.

import { PROC_SKY_GLSL } from "./proceduralSky";

export type SkyPart = "stars" | "clouds" | "milky";
export type SkyStep = { title: string; code: string; text: string };

export const STEPS: Record<SkyPart, SkyStep[]> = {
  stars: [
    {
      title: "Every pixel has a direction",
      code: `// skybox.vert passes the cube corner; interpolated, it is the view direction
vec3 d = normalize(vDir);
FragColor = vec4(d * 0.5 + 0.5, 1.0);   // show it: x → red, y → green, z → blue`,
      text: "A sky shader never sees a position, only a direction d: the unit vector from the eye through this pixel. Everything that follows is a function of d. Drag to look around: the colour is fixed to directions, not to the screen, so it does not change as you turn. That is what stays still in the sky.",
    },
    {
      title: "Cut the sky into cells",
      code: `vec3 p = d * SCALE;          // SCALE = cells across one unit of direction
vec3 cell = floor(p);        // integer id of the cell p falls in
vec3 f = fract(p);           // position inside that cell, 0…1 per axis
FragColor = vec4(vec3(hash13(cell), hash13(cell + 7.1), hash13(cell + 3.3)), 1.0);`,
      text: "Scaling d and rounding it down with floor() gives a 3D integer id per region of the sky. A hash turns that id into a number that looks random but is always the same for the same cell, which is how thousands of stars can exist without storing any of them. Each cell here is painted with three hashes as a colour. Use the scale slider: small values give big cells.",
    },
    {
      title: "Most cells stay empty",
      code: `float h = hash13(cell);
bool hasStar = h < density * 0.35;   // keep a fraction of the cells
FragColor = vec4(vec3(hasStar ? 0.7 : 0.04), 1.0);`,
      text: "A star in every cell would look like a grid. Comparing the hash with a threshold keeps a fraction of them: with density 0.5 about 17% of the cells get a star. Since h is uniform in 0…1, the chance of keeping a cell is exactly the threshold.",
    },
    {
      title: "A soft dot in each kept cell",
      code: `vec3 c = cell + 0.5;                   // the cell's centre
float r = length(p - c);               // distance to it, in cell units
float star = hasStar ? exp(-r * r * 90.0) : 0.0;`,
      text: "The star is a Gaussian spot: exp(−90 r²) is 1 at the centre, falls to half at r ≈ 0.09 and is negligible beyond 0.25, so it never touches the cell's edges (where it would be cut in half). It is smooth, which means it has no jagged pixel edges. But every star sits exactly in the middle of its cell, so a regular lattice still shows.",
    },
    {
      title: "Jitter the position",
      code: `vec3 c = cell + 0.5 + (hash33(cell) - 0.5) * 0.6;   // up to ±0.3 cells off-centre
float r = length(p - c);
float star = hasStar ? exp(-r * r * 90.0) : 0.0;`,
      text: "hash33 gives three more random numbers per cell, from 0 to 1. Minus 0.5 and times 0.6 they become an offset of up to ±0.3 cells. The bright core of the dot (r < 0.15) plus the largest offset is 0.45, still inside the cell, so no star is cut by a border. The lattice is gone.",
    },
    {
      title: "Brightness and colour",
      code: `float mag  = pow(hash13(cell + 7.1), 6.0);           // most stars faint, a few bright
vec3  tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.85, 0.65), hash13(cell + 3.3));
vec3  star = tint * exp(-r * r * 90.0) * (0.3 + 6.0 * mag);`,
      text: "A uniform random number raised to the 6th power piles up near 0: 68% of the results fall below 0.1, and only 11% are above 0.5. That gives many dim stars and a few bright ones, the same distribution as the real sky. Different hash offsets (+7.1, +3.3) make the brightness and the colour independent of each other and of the keep test.",
    },
    {
      title: "Twinkle, horizon, night",
      code: `float twinkle = 0.75 + 0.25 * sin(uTime * (2.0 + 6.0 * h) + h * 60.0);
float horizon = smoothstep(0.0, 0.25, d.y);           // thick air hides low stars
float night   = 1.0 - smoothstep(-0.18, 0.04, sun.y); // gone once the sun is up
return star * twinkle * horizon * night;`,
      text: "The hash also sets each star's twinkle speed and phase, so they flicker out of step. Low stars fade out behind thick air, and the whole layer fades as the sun rises. With SCALE = 70 this is exactly stars() in the full sky. In the layer-by-layer figure above, drag the sun elevation to watch it switch off.",
    },
  ],
  clouds: [
    {
      title: "Where does the ray meet the cloud layer?",
      code: `// the layer is the plane y = 1; along d the height grows as t·d.y
float t = 1.0 / d.y;          // distance to reach y = 1
vec2  p = d.xz * t;           // the hit point's horizontal position
float checker = mod(floor(p.x) + floor(p.y), 2.0);`,
      text: "Clouds are drawn on a flat ceiling at height 1. A point on the view ray is t·d, and its height is t·d.y. Setting that to 1 gives t = 1/d.y, so the hit point is (d.x, d.z)·t. The checkerboard makes those coordinates visible: squares look big overhead and shrink toward the horizon, where t grows without bound. Below the horizon (d.y ≤ 0) the ray never reaches the layer.",
    },
    {
      title: "Value noise",
      code: `// random values at integer points, smoothly interpolated in between
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);                  // smoothstep curve
    return mix(mix(hash(i),              hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float n = noise(p * 0.7);`,
      text: "Value noise gives every integer grid point a random value, which is the hash again. Between points it blends the four corners, first along x and then along y. The blend weight is not f but u = 3f² − 2f³. That curve starts and ends with zero slope, which removes the creases a straight mix would leave along the grid lines.",
    },
    {
      title: "Fractal noise (fBm)",
      code: `float fbm(vec2 p) {
    float sum = 0.0, amp = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);             // turn each octave by 37°
    for (int i = 0; i < 6; i++) {
        sum += amp * noise(p);
        p = rot * p * 2.02 + 3.7;                      // double the frequency
        amp *= 0.5;                                    // halve the amplitude
    }
    return sum;
}`,
      text: "One octave of noise is a blurry blob. fBm (fractional Brownian motion) adds copies at double the frequency and half the amplitude: big shapes, then medium ones on top, then fine detail. Six octaves give detail across a 32× range of sizes. Each octave is rotated and shifted so that the grids of different octaves never line up. Otherwise faint straight lines appear, the classic value-noise artefact.",
    },
    {
      title: "Coverage: a threshold",
      code: `float edge = mix(0.7, 0.3, cover);          // cover 0 … 1
float a = smoothstep(edge, edge + 0.2, n);  // 0 = clear sky, 1 = cloud
col = mix(sky, vec3(1.0), a);`,
      text: "fBm mostly lands between 0.3 and 0.75. Everything above the edge becomes cloud, and the 0.2 margin of smoothstep makes the borders soft instead of cut out. Lowering the edge lets more noise through, which is exactly what the cover slider does.",
    },
    {
      title: "Wind",
      code: `vec2 p = d.xz * t * 0.7 + vec2(0.02, 0.007) * uTime;   // slide the noise
float n = fbm(p);`,
      text: "Adding a constant velocity times the time slides the noise across the ceiling, so the clouds drift, faster overhead and slower near the horizon, just as real ones seem to. Nothing is stored between frames: it is the same function, looked up at a moving position.",
    },
    {
      title: "Light: one step toward the sun",
      code: `vec2  toSun = normalize(sun.xz) * 0.12;
float n2  = fbm(p + toSun);                     // density a bit closer to the sun
float lit = exp(-max(n2 - n + 0.05, 0.0) * 8.0);   // more cloud that way = shadow
vec3 col = ambient + sunColor * lit;`,
      text: "Real cloud lighting integrates sunlight through the volume (the Volumetrics chapter does that). One noise lookup offset toward the sun is a cheap estimate. If the noise is denser there, the light had to cross more cloud to reach this point, so Beer–Lambert (exp of minus the density difference) darkens it. The sides facing the sun stay bright and the far sides fall into shadow.",
    },
    {
      title: "Thick bellies and silver linings",
      code: `col *= 1.0 - 0.65 * smoothstep(0.0, 0.3, n - edge);      // deep inside = darker
float silver = phaseHG(dot(d, sun), 0.6) * 2.0;          // bright rims toward the sun
col += sunColor * silver * lit;`,
      text: "n − edge says how far inside the cloud a point is. The thick middles let little light through, so they are darkened. Looking toward the sun, the thin edges glow, because water droplets scatter light forward. The Henyey–Greenstein phase function with g = 0.6 models that. It is small unless d points near the sun.",
    },
    {
      title: "Fade with distance",
      code: `float fade = exp(-t * 0.12);               // t = 1/d.y, the distance to the layer
return vec4(col, a * fade);                 // colour + coverage
// in sky(): c = mix(c, cloud.rgb, cloud.a);`,
      text: "Near the horizon, t is huge and a single pixel covers kilometres of noise, which shows up as flickering grain. Fading the coverage with distance hides it and matches reality, where far clouds melt into the haze. That is the complete clouds() of the full sky.",
    },
  ],
  milky: [
    {
      title: "Distance from a great circle",
      code: `const vec3 G = normalize(vec3(0.35, 0.55, 0.76));   // normal of the galaxy's plane
float x = dot(d, G);          // 0 on the band, ±1 at its poles`,
      text: "The Milky Way is a band around the sky: a great circle, the intersection of the sky sphere with a plane through the eye. Every direction on that circle is perpendicular to the plane's normal G, so dot(d, G) = 0 there, and its absolute value grows with the angle off the band (it is the sine of that angle). Red is positive and blue negative.",
    },
    {
      title: "A soft band",
      code: `float band = exp(-x * x / (2.0 * 0.12 * 0.12));   // Gaussian, σ = 0.12 ≈ 7°`,
      text: "A Gaussian of x is 1 on the circle and fades smoothly on both sides. σ sets the width: at x = σ it is still 61%, at 2σ it is 14%. Nothing here is noisy yet: it is a perfect glowing ring.",
    },
    {
      title: "Clumps from 3D noise",
      code: `float clump = fbm3(d * 6.0);           // noise over the sphere of directions
float glow = band * (0.2 + 0.8 * clump);`,
      text: "3D fBm evaluated at d, a point on the unit sphere, is noise painted on the sky, and it has no seams because d never jumps. Multiplying breaks the ring into star clouds. Adding 0.2 keeps a faint floor so the band never disappears completely.",
    },
    {
      title: "The dust lane",
      code: `float lane = exp(-pow((x - 0.02) / 0.07, 2.0));      // a narrower band
float dust = 1.0 - 0.6 * lane * (0.35 + 0.65 * smoothstep(0.35, 0.7, fbm3(d * 7.0 + 5.0)));
glow *= dust;`,
      text: "A dark lane of dust runs along our galaxy. It is a second, narrower Gaussian, slightly off-centre, that subtracts light instead of adding it. Noise makes it ragged. The lane is continuous but uneven, as in long-exposure photographs.",
    },
    {
      title: "The core, and night only",
      code: `const vec3 CORE = normalize(vec3(0.8, 0.25, -0.55));
float core = exp(-pow(acos(dot(d, CORE)) / 0.9, 2.0));     // near the galactic centre
vec3 col = mix(vec3(0.55, 0.6, 0.85), vec3(1.0, 0.85, 0.65), core);
return col * glow * (0.12 + 0.4 * core) * horizon * night;`,
      text: "acos(dot(d, CORE)) is the angle to the galactic centre. A Gaussian of that angle brightens and warms the band there. The same horizon and night factors as the stars finish it. This is milkyWay() in the full sky.",
    },
  ],
};

export const BUILDER_FS = `#version 300 es
precision highp float;
in vec3 vDir;
out vec4 FragColor;
${PROC_SKY_GLSL}
uniform int   uPart, uStep;
uniform float uScale;

vec3 gridLines(vec3 p) {
  vec3 f = fract(p);
  vec3 e = min(f, 1.0 - f);
  // on the sphere the two smallest of the three distances matter
  float m = min(min(max(e.x, e.y), max(e.y, e.z)), max(e.x, e.z));
  float w = fwidth(m) * 1.2;
  return vec3(1.0 - smoothstep(0.0, w, m));
}

vec3 starsStep(vec3 d, vec3 sun) {
  if (uStep == 0) return d * 0.5 + 0.5;
  if (uStep >= 6) return display(stars(d, sun) + baseSky(d, sun));
  vec3 p = d * uScale;
  vec3 cell = floor(p);
  float h = hash13(cell);
  vec3 grid = gridLines(p) * 0.25;
  if (uStep == 1) return vec3(hash13(cell), hash13(cell + 7.1), hash13(cell + 3.3)) * 0.8 + grid;
  bool keep = h < uDensity * 0.35;
  if (uStep == 2) return vec3(keep ? 0.7 : 0.04) + grid;
  vec3 c = cell + 0.5;
  if (uStep >= 4) c += (hash33(cell) - 0.5) * 0.6;
  float r = length(p - c);
  float s = keep ? exp(-r * r * 90.0) : 0.0;
  if (uStep <= 4) return vec3(s) + grid;
  float mag = pow(hash13(cell + 7.1), 6.0);
  vec3 tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.85, 0.65), hash13(cell + 3.3));
  return display(tint * s * (0.3 + 6.0 * mag)) + grid * 0.5;
}

vec3 cloudsStep(vec3 d, vec3 sun) {
  vec3 base = baseSky(d, sun);
  if (d.y <= 0.0) return uStep == 0 ? vec3(0.0) : display(ground(d, sun, baseSky(normalize(vec3(d.x, 0.0, d.z)), sun)));
  float t = 1.0 / d.y;
  vec2 p0 = d.xz * t;
  if (uStep == 0) {
    float ch = mod(floor(p0.x) + floor(p0.y), 2.0);
    return mix(vec3(0.15), vec3(0.85), ch) * exp(-t * 0.02) + vec3(0.05);
  }
  vec2 p = d.xz * t * 0.7;
  if (uStep >= 4) p += vec2(uTime * 0.02, uTime * 0.007);
  if (uStep == 1) return vec3(noise3(vec3(p, 0.5)));
  float n = fbm2(p);
  if (uStep == 2) return vec3(n);
  float edge = mix(0.7, 0.3, uCover);
  float a = smoothstep(edge, edge + 0.2, n);
  vec3 sunCol = uModel == 0 ? srgb(mix(vec3(1.0, 0.6, 0.35), vec3(1.0), smoothstep(0.0, 0.4, sun.y))) * 3.0 : sunLight(sun) * 0.15;
  if (uStep <= 4) return display(mix(base, vec3(0.9), a));
  if (uStep >= 7) { vec4 cl = clouds(d, sun, base); return display(mix(base, cl.rgb, cl.a)); }
  vec2 toSun = normalize(sun.xz + 1e-5) * 0.12;
  float lit = exp(-max(fbm2(p + toSun) - n + 0.05, 0.0) * 8.0);
  vec3 col = base * 0.6 + vec3(0.02) + sunCol * lit * 0.6 * max(smoothstep(-0.15, 0.1, sun.y), 0.05);
  if (uStep == 6) {
    col *= 1.0 - 0.65 * smoothstep(0.0, 0.3, n - edge);
    col += sunCol * phaseHG(dot(d, sun), 0.6) * 2.0 * lit * max(smoothstep(-0.15, 0.1, sun.y), 0.05);
  }
  return display(mix(base, col, a));
}

vec3 milkyStep(vec3 d, vec3 sun) {
  const vec3 G = normalize(vec3(0.35, 0.55, 0.76));
  float x = dot(d, G);
  if (uStep == 0) {
    float line = 1.0 - smoothstep(0.0, fwidth(x) * 1.5, abs(x));
    return mix(x > 0.0 ? vec3(0.9, 0.25, 0.2) : vec3(0.2, 0.35, 0.9), vec3(0.08), 1.0 - abs(x)) + line;
  }
  float band = exp(-x * x / (2.0 * 0.12 * 0.12));
  if (uStep == 1) return vec3(band);
  float glow = band * (0.2 + 0.8 * fbm3(d * 6.0));
  if (uStep == 2) return vec3(glow);
  float lane = exp(-pow((x - 0.02) / 0.07, 2.0));
  glow *= 1.0 - 0.6 * lane * (0.35 + 0.65 * smoothstep(0.35, 0.7, fbm3(d * 7.0 + 5.0)));
  if (uStep == 3) return vec3(glow);
  return display(milkyWay(d, sun) + stars(d, sun) + baseSky(d, sun));
}

void main() {
  vec3 d = normalize(vDir);
  vec3 sun = normalize(uSun);
  vec3 c = uPart == 0 ? starsStep(d, sun) : uPart == 1 ? cloudsStep(d, sun) : milkyStep(d, sun);
  FragColor = vec4(c, 1.0);
}`;
