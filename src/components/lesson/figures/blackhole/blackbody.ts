// ── Blackbody colour ──────────────────────────────────────────────────────────
// Planck's law integrated against the CIE 1931 colour-matching functions, then
// converted to linear sRGB. Used on the CPU by the SVG figures, and baked into
// a 256 × 1 texture over log(T) for the black-hole shader.

/** Temperatures the texture covers (K); the shader extrapolates above T_MAX. */
export const T_MIN = 800;
export const T_MAX = 80000;
export const BB_SIZE = 256;

// Wyman, Sloan & Shirley (2013): the CIE 1931 2° observer as sums of skewed Gaussians
const lobe = (l: number, mu: number, s1: number, s2: number) => {
  const d = (l - mu) / (l < mu ? s1 : s2);
  return Math.exp(-0.5 * d * d);
};
const xBar = (l: number) => 1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2);
const yBar = (l: number) => 0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1);
const zBar = (l: number) => 1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8);

/** Planck's spectral radiance up to a constant, λ in nm: λ⁻⁵ / (e^(c₂/λT) − 1), c₂ = hc/k. */
const planck = (l: number, T: number) => {
  const C2 = 1.4388e7;        // hc/k in nm·K
  return 1 / (Math.pow(l * 1e-3, 5) * (Math.exp(C2 / (l * T)) - 1));
};

function xyz(T: number): [number, number, number] {
  let X = 0, Y = 0, Z = 0;
  for (let l = 380; l <= 780; l += 5) {
    const p = planck(l, T);
    X += p * xBar(l); Y += p * yBar(l); Z += p * zBar(l);
  }
  return [X, Y, Z];
}

const Y_REF = xyz(6500)[1];

/** Linear sRGB of a blackbody at T kelvin, scaled so that 6500 K has luminance 1. */
export function blackbodyRGB(T: number): [number, number, number] {
  const [X, Y, Z] = xyz(T).map(v => v / Y_REF);
  return [
    Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z),
    Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z),
    Math.max(0, 0.0557 * X - 0.2040 * Y + 1.0570 * Z),
  ];
}

/** A CSS colour for a blackbody, brightness scaled by `gain`, tone-mapped so it never clips to a flat hue. */
export function blackbodyCss(T: number, gain = 1): string {
  const c = blackbodyRGB(T).map(v => v * gain);
  const enc = (v: number) => {
    const m = v / (1 + v);                     // Reinhard
    return Math.round(255 * (m <= 0.0031308 ? 12.92 * m : 1.055 * Math.pow(m, 1 / 2.4) - 0.055));
  };
  return `rgb(${enc(c[0])}, ${enc(c[1])}, ${enc(c[2])})`;
}

/** The blackbody table as an RGBA16F texture: texel i is T = T_MIN·(T_MAX/T_MIN)^(i/255). */
export function makeBlackbodyTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const data = new Float32Array(BB_SIZE * 4);
  for (let i = 0; i < BB_SIZE; i++) {
    const T = T_MIN * Math.pow(T_MAX / T_MIN, i / (BB_SIZE - 1));
    const c = blackbodyRGB(T);
    data.set([c[0], c[1], c[2], 1], i * 4);
  }
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, BB_SIZE, 1, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
