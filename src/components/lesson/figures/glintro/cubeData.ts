// ── The cube of the "Drawing a Cube" chapter, in its three layouts ───────────
// Every array here matches the code in src/lib/tracks/opengl/chapters/cube.tsx
// number for number, so the figure can show the very data the reader types.
//   A  glDrawArrays: 36 vertices, every triangle corner written out
//   B  glDrawElements: 8 vertices (the corners) + 36 indices, position only
//   C  glDrawElements: 24 vertices (4 per face, each with its own uv) + 36 indices

import type { Vec3 } from "@/components/lesson/kit/vec3";

export type Layout = "A" | "B" | "C";
export type UV = [number, number];

/**
 * The 8 corners, numbered like the square of the EBO chapter: the front face
 * is 0 top-left, 1 bottom-left, 2 bottom-right, 3 top-right; 4–7 are the same
 * four pushed back to z = −0.5.
 */
export const CORNERS: Vec3[] = [
  [-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5],
  [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5],
];

export const FACE_NAMES = ["front", "back", "right", "left", "top", "bottom"] as const;
export type FaceName = (typeof FACE_NAMES)[number];

/** Outward normal of each face, in FACE_NAMES order. */
export const FACE_NORMALS: Vec3[] = [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];

/**
 * Each face as its 4 corners: top-left, bottom-left, bottom-right, top-right,
 * seen from outside the cube (so 0 1 2 / 0 2 3 runs counter-clockwise).
 */
export const FACE_CORNERS: [number, number, number, number][] = [
  [0, 1, 2, 3],   // front  (+z)
  [7, 6, 5, 4],   // back   (−z)
  [3, 2, 6, 7],   // right  (+x)
  [4, 5, 1, 0],   // left   (−x)
  [4, 0, 3, 7],   // top    (+y)
  [1, 5, 6, 2],   // bottom (−y)
];

/** Texture coordinates of a face's top-left, bottom-left, bottom-right, top-right. */
const QUAD_UV: UV[] = [[0, 1], [0, 0], [1, 0], [1, 1]];

/** Which of a face's 4 corners make its two triangles. */
const QUAD_TRIS = [0, 1, 2, 0, 2, 3];

export type Vertex = { corner: number; face: number; uv: UV | null };

/** The vertex array of each layout, in the order it sits in the VBO. */
export const VERTICES: Record<Layout, Vertex[]> = {
  A: FACE_CORNERS.flatMap((fc, f) => QUAD_TRIS.map(k => ({ corner: fc[k], face: f, uv: QUAD_UV[k] }))),
  B: CORNERS.map((_, c) => ({ corner: c, face: -1, uv: null })),
  C: FACE_CORNERS.flatMap((fc, f) => fc.map((c, k) => ({ corner: c, face: f, uv: QUAD_UV[k] }))),
};

/** The index list of each layout (A has none: the GPU reads 0, 1, 2 … 35). */
export const INDICES: Record<Layout, number[] | null> = {
  A: null,
  B: FACE_CORNERS.flatMap(fc => QUAD_TRIS.map(k => fc[k])),
  C: FACE_CORNERS.flatMap((_, f) => QUAD_TRIS.map(k => f * 4 + k)),
};

/** Floats per vertex: x y z u v, or only x y z for the 8-corner cube. */
export const FLOATS: Record<Layout, number> = { A: 5, B: 3, C: 5 };

/** The vertex numbers of triangle k (0…11) in a layout. */
export function triVertices(layout: Layout, k: number): [number, number, number] {
  const idx = INDICES[layout];
  return idx ? [idx[k * 3], idx[k * 3 + 1], idx[k * 3 + 2]] : [k * 3, k * 3 + 1, k * 3 + 2];
}

/** The corners of triangle k: the same in every layout. */
export function triCorners(k: number): [number, number, number] {
  const fc = FACE_CORNERS[Math.floor(k / 2)], o = (k % 2) * 3;
  return [fc[QUAD_TRIS[o]], fc[QUAD_TRIS[o + 1]], fc[QUAD_TRIS[o + 2]]];
}

/** Every vertex of a layout that sits on corner c. */
export const verticesAtCorner = (layout: Layout, c: number) =>
  VERTICES[layout].flatMap((v, i) => (v.corner === c ? [i] : []));

/** "−0.5" style, as written in the C++ arrays. */
export const fmtF = (n: number) => (n < 0 ? "−" : " ") + Math.abs(n).toFixed(1);
