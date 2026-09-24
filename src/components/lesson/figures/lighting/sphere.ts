// ── A lit sphere, shaded on the CPU ───────────────────────────────────────────
// Small enough to redraw on every slider move, and it runs the exact Phong
// formula the chapters write in GLSL, so what you see is what the shader does.

export type RGB = [number, number, number];

export type PhongMaterial = { ambient: RGB; diffuse: RGB; specular: RGB; shininess: number };
export type PhongLight = { dir: [number, number, number]; ambient: RGB; diffuse: RGB; specular: RGB };

const norm3 = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Draws a sphere filling the canvas. The eye looks down −Z (V = +Z), light
 * `dir` points FROM the surface TOWARD the light, like the shader's lightDir.
 */
export function drawPhongSphere(canvas: HTMLCanvasElement, m: PhongMaterial, l: PhongLight) {
  const size = canvas.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(size, size);
  const L = norm3(l.dir);
  const r = size / 2 - 1.5;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px - size / 2 + 0.5) / r, y = -(py - size / 2 + 0.5) / r;
      const rr = x * x + y * y;
      const o = (py * size + px) * 4;
      if (rr > 1) { img.data[o + 3] = 0; continue; }
      const N: [number, number, number] = [x, y, Math.sqrt(1 - rr)];
      const ndl = N[0] * L[0] + N[1] * L[1] + N[2] * L[2];
      const diff = Math.max(ndl, 0);
      // reflect(-L, N) and V = (0, 0, 1)
      const Rz = 2 * ndl * N[2] - L[2];
      const spec = ndl > 0 ? Math.pow(Math.max(Rz, 0), Math.max(1, m.shininess)) : 0;
      const edge = Math.min(1, (1 - Math.sqrt(rr)) * r * 1.2);
      for (let c = 0; c < 3; c++) {
        const v = l.ambient[c] * m.ambient[c] + l.diffuse[c] * m.diffuse[c] * diff + l.specular[c] * m.specular[c] * spec;
        img.data[o + c] = Math.min(255, Math.round(v * 255));
      }
      img.data[o + 3] = Math.round(edge * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export const rgbCss = (c: RGB, k = 1) =>
  `rgb(${Math.round(Math.min(1, c[0] * k) * 255)},${Math.round(Math.min(1, c[1] * k) * 255)},${Math.round(Math.min(1, c[2] * k) * 255)})`;
