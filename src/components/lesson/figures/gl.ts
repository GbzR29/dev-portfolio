// ── Small WebGL2 toolkit for lesson figures ───────────────────────────────────
// Column-major 4×4 matrices (same layout as GLM and glUniformMatrix4fv),
// shader compilation with readable errors, and a couple of meshes.

export type Mat4 = Float32Array;
export type Vec3 = [number, number, number];

export const mat4 = {
  identity(): Mat4 {
    const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m;
  },
  /** glm::perspective(fovy, aspect, near, far) */
  perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fovy / 2), m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f;
    m[10] = (far + near) / (near - far); m[11] = -1;
    m[14] = (2 * far * near) / (near - far);
    return m;
  },
  /** glm::lookAt(eye, center, up) */
  lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
    const f = norm(sub(center, eye)), s = norm(cross(f, up)), u = cross(s, f);
    const m = mat4.identity();
    m[0] = s[0]; m[4] = s[1]; m[8] = s[2];
    m[1] = u[0]; m[5] = u[1]; m[9] = u[2];
    m[2] = -f[0]; m[6] = -f[1]; m[10] = -f[2];
    m[12] = -dot(s, eye); m[13] = -dot(u, eye); m[14] = dot(f, eye);
    return m;
  },
  multiply(a: Mat4, b: Mat4): Mat4 {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = v;
    }
    return o;
  },
  /** glm::mat4(glm::mat3(m)) — keeps rotation, drops translation. */
  stripTranslation(m: Mat4): Mat4 {
    const o = new Float32Array(m); o[12] = o[13] = o[14] = 0; o[3] = o[7] = o[11] = 0; o[15] = 1; return o;
  },
  translation(x: number, y: number, z: number): Mat4 {
    const m = mat4.identity(); m[12] = x; m[13] = y; m[14] = z; return m;
  },
  scale(k: number): Mat4 {
    const m = mat4.identity(); m[0] = m[5] = m[10] = k; return m;
  },
};

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: Vec3): Vec3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Forward vector for a yaw/pitch camera. Yaw 0 looks down −Z, like OpenGL's default. */
export const forwardFrom = (yaw: number, pitch: number): Vec3 =>
  [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];

// ── Shaders ───────────────────────────────────────────────────────────────────
export function compileProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error(`${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader: ${log}`);
    }
    return sh;
  };
  const p = gl.createProgram()!;
  const v = make(gl.VERTEX_SHADER, vs), f = make(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v); gl.attachShader(p, f);
  gl.bindAttribLocation(p, 0, "aPos");
  gl.bindAttribLocation(p, 1, "aNormal");
  gl.bindAttribLocation(p, 2, "aColor");
  gl.linkProgram(p);
  gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  return p;
}

// ── Meshes ────────────────────────────────────────────────────────────────────
/** The classic 36-vertex skybox cube, positions only, ±1. */
export const SKYBOX_CUBE = new Float32Array([
  -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
  -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
  1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1,
  -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1,
  -1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, -1,
  -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1,
]);

/** UV sphere: interleaved position + normal (6 floats), as triangles. */
export function sphereMesh(rings = 32, segments = 48): Float32Array {
  const out: number[] = [];
  const p = (i: number, j: number) => {
    const th = (i / rings) * Math.PI, ph = (j / segments) * Math.PI * 2;
    const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
    return [x, y, z, x, y, z];
  };
  for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
    const a = p(i, j), b = p(i + 1, j), c = p(i + 1, j + 1), d = p(i, j + 1);
    out.push(...a, ...c, ...b, ...a, ...d, ...c);
  }
  return new Float32Array(out);
}

/** Unit cube with per-face normals: interleaved position + normal. */
export function boxMesh(): Float32Array {
  const faces: [Vec3, Vec3, Vec3][] = [   // normal, u, v  (u × v = normal)
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const out: number[] = [];
  for (const [n, u, v] of faces) {
    const c = (a: number, b: number) => [n[0] + u[0] * a + v[0] * b, n[1] + u[1] * a + v[1] * b, n[2] + u[2] * a + v[2] * b, ...n];
    out.push(...c(-1, -1), ...c(1, -1), ...c(1, 1), ...c(-1, -1), ...c(1, 1), ...c(-1, 1));
  }
  return new Float32Array(out.map((x, i) => (i % 6 < 3 ? x * 0.5 : x)));
}

/** Unit cube with normals and UVs: interleaved position + normal + uv (8 floats). */
export function boxMeshUV(): Float32Array {
  const faces: [Vec3, Vec3, Vec3][] = [   // normal, u, v  (u × v = normal)
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const out: number[] = [];
  for (const [n, u, v] of faces) {
    const c = (a: number, b: number) => [
      (n[0] + u[0] * a + v[0] * b) * 0.5, (n[1] + u[1] * a + v[1] * b) * 0.5, (n[2] + u[2] * a + v[2] * b) * 0.5,
      ...n, (a + 1) / 2, (1 - b) / 2,
    ];
    out.push(...c(-1, -1), ...c(1, -1), ...c(1, 1), ...c(-1, -1), ...c(1, 1), ...c(-1, 1));
  }
  return new Float32Array(out);
}

// ── Cubemap faces: OpenGL's selection rule ────────────────────────────────────
// For each face, the direction a texel at (s, t) ∈ [0,1]² stands for. This is
// the table from the OpenGL spec (sc, tc in [-1, 1], t grows downward):
//   +X: ( 1, -tc, -sc)   -X: (-1, -tc,  sc)
//   +Y: ( sc,  1,  tc)   -Y: ( sc, -1, -tc)
//   +Z: ( sc, -tc,  1)   -Z: (-sc, -tc, -1)
export const FACE_NAMES = ["+X", "−X", "+Y", "−Y", "+Z", "−Z"] as const;
export const FACE_FILES = ["px", "nx", "py", "ny", "pz", "nz"] as const;

export function faceDir(face: number, s: number, t: number): Vec3 {
  const sc = 2 * s - 1, tc = 2 * t - 1;
  switch (face) {
    case 0: return [1, -tc, -sc];
    case 1: return [-1, -tc, sc];
    case 2: return [sc, 1, tc];
    case 3: return [sc, -1, -tc];
    case 4: return [sc, -tc, 1];
    default: return [-sc, -tc, -1];
  }
}

/** The inverse: which face a direction hits, and where on it. */
export function dirToFace(d: Vec3): { face: number; s: number; t: number } {
  const [x, y, z] = d, ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  let face: number, sc: number, tc: number, ma: number;
  if (ax >= ay && ax >= az) { ma = ax; face = x > 0 ? 0 : 1; sc = x > 0 ? -z : z; tc = -y; }
  else if (ay >= az) { ma = ay; face = y > 0 ? 2 : 3; sc = x; tc = y > 0 ? z : -z; }
  else { ma = az; face = z > 0 ? 4 : 5; sc = z > 0 ? x : -x; tc = -y; }
  return { face, s: (sc / ma + 1) / 2, t: (tc / ma + 1) / 2 };
}

// ── The procedural environment ────────────────────────────────────────────────
// A simple sky: gradient, sun, a gridded ground and a hazy horizon. Every
// procedural texture (cubemap faces, equirect) is baked from this one function,
// so they all agree with each other and with the procedural-sky shader.
export const SUN_DIR = norm([0.55, 0.32, -0.77]);

export function environment(d: Vec3): Vec3 {
  const [x, y, z] = norm(d);
  if (y >= 0) {
    const k = Math.pow(y, 0.45);
    const col: Vec3 = [
      205 + (70 - 205) * k, 222 + (120 - 222) * k, 238 + (200 - 238) * k,
    ];
    const sd = Math.max(0, dot([x, y, z], SUN_DIR));
    const glow = Math.pow(sd, 64) * 0.9 + Math.pow(sd, 6) * 0.25;
    const disc = sd > 0.9985 ? 1 : 0;
    return [
      Math.min(255, col[0] + glow * 255 + disc * 255),
      Math.min(255, col[1] + glow * 225 + disc * 255),
      Math.min(255, col[2] + glow * 170 + disc * 255),
    ];
  }
  // Ground: a grid on the plane y = −1, fading into haze at the horizon
  const t = 1 / -y, gx = x * t, gz = z * t;
  // Soft-edged lines whose width tracks distance, so they do not stair-step
  const w = 0.012 * t;
  const line = (v: number) => { const f = Math.abs(v - Math.round(v)); return Math.max(0, Math.min(1, 1 - (f - w) / w)); };
  const grid = Math.max(line(gx), line(gz)) * Math.min(1, 3 / t);
  const base: Vec3 = [74 + grid * 60, 92 + grid * 60, 78 + grid * 60];
  const haze = Math.pow(1 - Math.min(1, -y * 4), 3);
  return [base[0] + (200 - base[0]) * haze, base[1] + (212 - base[1]) * haze, base[2] + (222 - base[2]) * haze];
}

/** Bakes one cubemap face of the procedural environment, with a readable label. */
export function proceduralFace(face: number, size = 256, label = true): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const col = environment(faceDir(face, (x + 0.5) / size, (y + 0.5) / size));
    const o = (y * size + x) * 4;
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if (label) drawFaceLabel(g, face, size);
  return c;
}

/**
 * Writes the face name so it reads correctly when seen from INSIDE the cube.
 * The cubemap convention is left-handed, so several faces are stored mirrored
 * or rotated relative to how you see them; the text transform undoes that by
 * aligning text-x with "screen right" and text-y with "screen down".
 */
function drawFaceLabel(g: CanvasRenderingContext2D, face: number, size: number) {
  // Where the viewer looks and which way is up on screen when facing this face
  const fwd: Vec3 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]][face] as Vec3;
  const up: Vec3 = face === 2 ? [0, 0, 1] : face === 3 ? [0, 0, -1] : [0, 1, 0];
  const right = cross(fwd, up), down: Vec3 = [-up[0], -up[1], -up[2]];
  // Image axes as world directions (derivative of faceDir along s and t)
  const c = faceDir(face, 0.5, 0.5);
  const ds = norm(sub(faceDir(face, 1, 0.5), c)), dt = norm(sub(faceDir(face, 0.5, 1), c));
  g.save();
  g.translate(size / 2, size / 2);
  g.transform(dot(right, ds), dot(right, dt), dot(down, ds), dot(down, dt), 0, 0);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.strokeStyle = "rgba(0,0,0,0.45)"; g.lineWidth = size / 64;
  g.font = `bold ${size / 5}px monospace`;
  g.strokeText(FACE_NAMES[face], 0, -size / 16);
  g.fillText(FACE_NAMES[face], 0, -size / 16);
  g.font = `${size / 14}px monospace`;
  g.strokeText(`${FACE_FILES[face]}.png`, 0, size / 7);
  g.fillText(`${FACE_FILES[face]}.png`, 0, size / 7);
  g.restore();
}

/** Bakes the procedural environment as a 2:1 equirectangular panorama. */
export function proceduralEquirect(w = 512): HTMLCanvasElement {
  const h = w / 2, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w, v = (y + 0.5) / h;
    const phi = (u - 0.5) * Math.PI * 2, theta = (0.5 - v) * Math.PI;   // same mapping as the shader
    const col = environment([Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi)]);
    const o = (y * w + x) * 4;
    img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Resolves once the image at `url` has loaded. */
export const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });

// ── Other sky formats ─────────────────────────────────────────────────────────
// A horizontal cross is an unfolded cube drawn as seen from INSIDE: four faces
// across the middle row (turning right as you go right), the top face above
// the second one and the bottom face below it. In this site's world the second
// column looks along +X, the same direction as the centre of a panorama, so a
// cross and the panorama of the same sky agree.
//
// Each cell is described by where it looks (fwd) and which world directions
// point to the right of and down the image (right, down).
export const CROSS_CELLS: { col: number; row: number; fwd: Vec3; right: Vec3; down: Vec3 }[] = [
  { col: 0, row: 1, fwd: [0, 0, -1], right: [1, 0, 0], down: [0, -1, 0] },
  { col: 1, row: 1, fwd: [1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  { col: 2, row: 1, fwd: [0, 0, 1], right: [-1, 0, 0], down: [0, -1, 0] },
  { col: 3, row: 1, fwd: [-1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  { col: 1, row: 0, fwd: [0, 1, 0], right: [0, 0, 1], down: [1, 0, 0] },
  { col: 1, row: 2, fwd: [0, -1, 0], right: [0, 0, 1], down: [-1, 0, 0] },
];

/** The cross cell that looks along a cube map face's axis. */
export const crossCellOf = (face: number) =>
  CROSS_CELLS.find(c => dot(c.fwd, faceDir(face, 0.5, 0.5)) > 0.99)!;

/**
 * Cuts a 4×3 horizontal cross into the six faces OpenGL expects. No pixel is
 * resampled: every face is its cell, rotated or mirrored by the 2×2 matrix
 * that maps the cell's image axes onto the face's (s, t) axes.
 */
export function crossToFaces(img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement[] {
  const cell = img.width / 4;
  return [0, 1, 2, 3, 4, 5].map(face => {
    const c = document.createElement("canvas");
    c.width = c.height = cell;
    const g = c.getContext("2d")!;
    const k = crossCellOf(face);
    // Unit world vectors along the face's s and t axes
    const mid = faceDir(face, 0.5, 0.5);
    const S = norm(sub(faceDir(face, 1, 0.5), mid)), T = norm(sub(faceDir(face, 0.5, 1), mid));
    // cell (a, b) → face (s, t):  s = (S·right) a + (S·down) b,  t = (T·right) a + (T·down) b
    g.translate(cell / 2, cell / 2);
    g.transform(dot(S, k.right), dot(T, k.right), dot(S, k.down), dot(T, k.down), 0, 0);
    g.drawImage(img, k.col * cell, k.row * cell, cell, cell, -cell / 2, -cell / 2, cell, cell);
    return c;
  });
}

const pixels = (img: HTMLImageElement | HTMLCanvasElement) => {
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
};

/** Bakes a 2:1 panorama from six faces, sampling each direction's face texel. */
export function facesToEquirect(faces: (HTMLImageElement | HTMLCanvasElement)[], w = 1024): HTMLCanvasElement {
  const data = faces.map(pixels);
  const h = w / 2, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const phi = ((x + 0.5) / w - 0.5) * Math.PI * 2, theta = (0.5 - (y + 0.5) / h) * Math.PI;
    const { face, s, t } = dirToFace([Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi)]);
    const src = data[face];
    const i = (Math.min(src.height - 1, Math.floor(t * src.height)) * src.width + Math.min(src.width - 1, Math.floor(s * src.width))) * 4;
    const o = (y * w + x) * 4;
    img.data[o] = src.data[i]; img.data[o + 1] = src.data[i + 1]; img.data[o + 2] = src.data[i + 2]; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Bakes six faces from a 2:1 panorama: each texel's direction → longitude/latitude → pixel. */
export function equirectToFaces(pano: HTMLImageElement | HTMLCanvasElement, size = 512): HTMLCanvasElement[] {
  const src = pixels(pano);
  return [0, 1, 2, 3, 4, 5].map(face => {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const [dx, dy, dz] = norm(faceDir(face, (x + 0.5) / size, (y + 0.5) / size));
      const u = Math.atan2(dz, dx) / (2 * Math.PI) + 0.5, v = 0.5 - Math.asin(dy) / Math.PI;
      const i = (Math.min(src.height - 1, Math.floor(v * src.height)) * src.width + Math.min(src.width - 1, Math.floor(u * src.width))) * 4;
      const o = (y * size + x) * 4;
      img.data[o] = src.data[i]; img.data[o + 1] = src.data[i + 1]; img.data[o + 2] = src.data[i + 2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
}

export type TexImage = HTMLImageElement | HTMLCanvasElement;

/** Uploads six decoded face images (+X, −X, +Y, −Y, +Z, −Z) as a cube map texture. */
export function makeCubemap(gl: WebGL2RenderingContext, imgs: TexImage[]): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);        // cubemaps are never flipped
  imgs.forEach((im, i) => gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im));
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Loads six face images (URLs or decoded images) into a cube map texture. */
export async function loadCubemap(gl: WebGL2RenderingContext, faces: (string | TexImage)[]): Promise<WebGLTexture> {
  return makeCubemap(gl, await Promise.all(faces.map(f => typeof f === "string" ? loadImage(f) : f)));
}

/** Uploads one decoded image as a texture; repeats on S, and on T too when `repeatT`. */
export function makeTexture2D(gl: WebGL2RenderingContext, im: TexImage, repeatT = false): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeatT ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  return tex;
}

/** Loads one 2D image (URL or decoded image) as a texture; repeats on S, and on T too when `repeatT`. */
export async function loadTexture2D(gl: WebGL2RenderingContext, src: string | TexImage, repeatT = false): Promise<WebGLTexture> {
  return makeTexture2D(gl, typeof src === "string" ? await loadImage(src) : src, repeatT);
}
