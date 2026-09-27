// ── Camera-centred ring grid for the water surface ────────────────────────────
// The water is a real mesh: rest positions (x₀, z₀) on rings around the camera.
// Near the camera the radii grow geometrically, so the gap between rings keeps
// pace with the gap between neighbours on a ring (r·2π/segments). Far away a
// ring at distance r sits h/r radians below the horizon for a camera h metres
// up, and the next one dα = h·dr/r² lower: rings are spaced so dα never drops
// under ~0.06°, or a single row of pixels near the horizon would hold dozens
// of sliver triangles. That is what a projected grid or LOD rings achieve in
// engines. The vertex shader displaces each rest position by the waves; a
// last ring far out carries the flat sea to the horizon.

/** Vertex spacing at radius r: max(spacingK·r, spacingA·r²). */
export type WaterGrid = {
  vao: WebGLVertexArrayObject; buffers: WebGLBuffer[]; count: number;
  spacingK: number; spacingA: number; height: number;
};

const MIN_ANGLE = 0.001;          // radians between rings, seen from the camera

/**
 * Uploads the grid (attribute 0 = vec2 rest position) for a camera `height`
 * metres above the water. The vertex shader uses the spacing to drop waves
 * shorter than the mesh can carry.
 */
export function ringGrid(gl: WebGL2RenderingContext, height: number, segments = 256, rMin = 0.08, rMax = 3000, rFar = 1e5): WaterGrid {
  const k = (2 * Math.PI) / segments;
  const radii: number[] = [];
  for (let r = rMin; r < rMax; r += Math.max(r * k, (r * r * MIN_ANGLE) / Math.max(height, 0.5))) radii.push(r);
  radii.push(rMax, rFar);

  // Vertex 0 is the centre; ring i, segment j is 1 + i·segments + j
  const pos = new Float32Array((1 + radii.length * segments) * 2);
  radii.forEach((r, i) => {
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2, o = (1 + i * segments + j) * 2;
      pos[o] = r * Math.cos(a); pos[o + 1] = r * Math.sin(a);
    }
  });
  const idx = new Uint32Array(segments * 3 + (radii.length - 1) * segments * 6);
  let n = 0;
  const v = (i: number, j: number) => 1 + i * segments + (j % segments);
  for (let j = 0; j < segments; j++) { idx[n++] = 0; idx[n++] = v(0, j + 1); idx[n++] = v(0, j); }
  for (let i = 0; i + 1 < radii.length; i++) {
    for (let j = 0; j < segments; j++) {
      const a = v(i, j), b = v(i, j + 1), c = v(i + 1, j), d = v(i + 1, j + 1);
      idx[n++] = a; idx[n++] = b; idx[n++] = c;
      idx[n++] = b; idx[n++] = d; idx[n++] = c;
    }
  }

  const vao = gl.createVertexArray()!;
  const buffers = [gl.createBuffer()!, gl.createBuffer()!];
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[1]);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, buffers, count: n, spacingK: k, spacingA: MIN_ANGLE / Math.max(height, 0.5), height };
}

export function deleteGrid(gl: WebGL2RenderingContext, g: WaterGrid) {
  gl.deleteVertexArray(g.vao);
  g.buffers.forEach(b => gl.deleteBuffer(b));
}

export function drawGrid(gl: WebGL2RenderingContext, g: WaterGrid) {
  gl.bindVertexArray(g.vao);
  gl.drawElements(gl.TRIANGLES, g.count, gl.UNSIGNED_INT, 0);
}
