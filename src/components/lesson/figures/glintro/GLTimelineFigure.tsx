"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, C, T } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// OpenGL's versions on a timeline. Selecting one redraws the pipeline as it was
// in that version: which stages existed, which were fixed-function (configured
// with switches) and which were programmable (you write a shader), and how
// vertex data reached the GPU. The code panel shows how a triangle was drawn
// in that era.

type Kind = "fixed" | "prog" | "none";
type Ver = {
  v: string; year: number; key: string; en: string;
  stages: [Kind, Kind, Kind, Kind, Kind, Kind, Kind];   // vertex, tess, geom, raster, fragment, tests/blend, compute
  feed: "immediate" | "arrays" | "vbo" | "vbo-only";
  legacy: boolean;
  code: string;
};

const STAGES: [string, string][] = [
  ["figGlTime_sVertex", "vertex"], ["figGlTime_sTess", "tessellation"], ["figGlTime_sGeom", "geometry"],
  ["figGlTime_sRaster", "rasterizer"], ["figGlTime_sFrag", "fragment"], ["figGlTime_sTests", "tests & blending"], ["figGlTime_sCompute", "compute"],
];

const IMM = `glBegin(GL_TRIANGLES);
  glColor3f(1, 0, 0); glVertex2f(-0.5f, -0.5f);
  glColor3f(0, 1, 0); glVertex2f( 0.5f, -0.5f);
  glColor3f(0, 0, 1); glVertex2f( 0.0f,  0.5f);
glEnd();`;
const ARR = `float pos[] = { -0.5f,-0.5f,  0.5f,-0.5f,  0.0f,0.5f };
glEnableClientState(GL_VERTEX_ARRAY);
glVertexPointer(2, GL_FLOAT, 0, pos);   // points at CPU memory
glDrawArrays(GL_TRIANGLES, 0, 3);       // one call, 3 vertices`;
const VBO = `glGenBuffers(1, &vbo);
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof pos, pos, GL_STATIC_DRAW);
glVertexPointer(2, GL_FLOAT, 0, 0);     // 0 = offset into the buffer
glDrawArrays(GL_TRIANGLES, 0, 3);`;
const GLSL = `glUseProgram(program);                  // your vertex + fragment shader
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);
glEnableVertexAttribArray(0);
glDrawArrays(GL_TRIANGLES, 0, 3);       // glBegin still works too`;
const CORE = `glUseProgram(program);
glBindVertexArray(vao);                 // VAO: required in Core
glDrawArrays(GL_TRIANGLES, 0, 3);       // glBegin no longer exists`;
const DSA = `glCreateBuffers(1, &vbo);               // DSA: no binding needed
glNamedBufferData(vbo, sizeof pos, pos, GL_STATIC_DRAW);
glCreateVertexArrays(1, &vao);
glVertexArrayVertexBuffer(vao, 0, vbo, 0, 2 * sizeof(float));
glUseProgram(program); glBindVertexArray(vao);
glDrawArrays(GL_TRIANGLES, 0, 3);`;

const F: Kind = "fixed", P: Kind = "prog", N: Kind = "none";
const VERSIONS: Ver[] = [
  { v: "1.0", year: 1992, key: "v10", en: "Immediate mode: every vertex is a function call between glBegin and glEnd. The whole pipeline is fixed-function: you switch lighting, fog and texturing on and set their parameters.", stages: [F, N, N, F, F, F, N], feed: "immediate", legacy: true, code: IMM },
  { v: "1.1", year: 1997, key: "v11", en: "Vertex arrays: point OpenGL at an array in your own memory and draw it with one glDrawArrays call. The data is still read from CPU memory at every draw.", stages: [F, N, N, F, F, F, N], feed: "arrays", legacy: true, code: ARR },
  { v: "1.5", year: 2003, key: "v15", en: "Vertex Buffer Objects: the array is copied once into a buffer the driver owns, usually in GPU memory, and stays there between frames.", stages: [F, N, N, F, F, F, N], feed: "vbo", legacy: true, code: VBO },
  { v: "2.0", year: 2004, key: "v20", en: "GLSL: the vertex and fragment stages become programmable. Everything old still works alongside.", stages: [P, N, N, F, P, F, N], feed: "vbo", legacy: true, code: GLSL },
  { v: "3.2", year: 2009, key: "v32", en: "Core profile: the legacy API (glBegin, fixed lighting, client-memory arrays) is gone. Shaders, VBOs and VAOs are mandatory. The geometry shader arrives.", stages: [P, N, P, F, P, F, N], feed: "vbo-only", legacy: false, code: CORE },
  { v: "4.0", year: 2010, key: "v40", en: "Tessellation: two new programmable stages that subdivide patches into many triangles on the GPU.", stages: [P, P, P, F, P, F, N], feed: "vbo-only", legacy: false, code: CORE },
  { v: "4.3", year: 2012, key: "v43", en: "Compute shaders and the debug output callback: general GPU programs outside the drawing pipeline, and readable error messages.", stages: [P, P, P, F, P, F, P], feed: "vbo-only", legacy: false, code: CORE },
  { v: "4.5", year: 2014, key: "v45", en: "Direct State Access: objects are created and edited by name, without binding them first.", stages: [P, P, P, F, P, F, P], feed: "vbo-only", legacy: false, code: DSA },
  { v: "4.6", year: 2017, key: "v46", en: "The last version: SPIR-V shader binaries, anisotropic filtering in core. The API is finished; Vulkan continues from here.", stages: [P, P, P, F, P, F, P], feed: "vbo-only", legacy: false, code: DSA },
];

const FEED: Record<Ver["feed"], [string, string]> = {
  immediate: ["figGlTime_fImm", "one call per vertex attribute, every frame"],
  arrays: ["figGlTime_fArr", "one call per draw, data read from CPU memory every frame"],
  vbo: ["figGlTime_fVbo", "uploaded once to a buffer, reused every frame"],
  "vbo-only": ["figGlTime_fCore", "buffers only: the other paths are removed"],
};

const W = 620, TY = 34, X0 = 30, X1 = 590, Y0 = 1990, Y1 = 2019;
const yx = (y: number) => X0 + ((y - Y0) / (Y1 - Y0)) * (X1 - X0);
const SW = 76, SH = 34, SY = 104;

export function GLTimelineFigure({ t }: { t?: TrackTranslations }) {
  const [i, setI] = useState(0);
  const ver = VERSIONS[i];
  const colour = (k: Kind) => (k === "prog" ? C.green : k === "fixed" ? C.sky : C.axis);

  return (
    <Figure
      title={tx(t, "figGlTime_title", "OpenGL through the versions")}
      controls={<>
        <Row>
          <Readout color={C.red}>OpenGL {ver.v} · {ver.year}</Readout>
          <Readout color={ver.legacy ? C.amber : C.green}>{ver.legacy ? tx(t, "figGlTime_legacyYes", "legacy API available") : tx(t, "figGlTime_legacyNo", "Core profile: legacy removed")}</Readout>
        </Row>
        <p className="text-[13px] text-[var(--text-main)] leading-relaxed">{tx(t, `figGlTime_${ver.key}`, ver.en)}</p>
        <pre className="text-[11.5px] leading-snug font-mono p-3 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] overflow-x-auto text-[var(--text-main)]">{ver.code}</pre>
      </>}
      note={tx(t, "figGlTime_note", "Click a version on the timeline. Blue stages are fixed-function: built into the hardware or driver, configured with switches and parameters. Green stages are programmable: you supply a shader. The rasterizer and the tests and blending at the end are still fixed today, in every API. 3.0 (2008) marked the old API as deprecated and 3.1 removed it; 3.2 then made the split official as the Core and Compatibility profiles.")}
    >
      <svg viewBox={`0 0 ${W} 190`} className="w-full h-auto" role="img">
        <line x1={X0} y1={TY} x2={X1} y2={TY} stroke={C.axis} strokeWidth={2} />
        {[1990, 1995, 2000, 2005, 2010, 2015].map(y => (
          <g key={y}>
            <line x1={yx(y)} y1={TY - 4} x2={yx(y)} y2={TY + 4} stroke={C.axis} />
            <T x={yx(y)} y={TY + 16} size={8} anchor="middle">{y}</T>
          </g>
        ))}
        {VERSIONS.map((v, k) => (
          <g key={v.v} onClick={() => setI(k)} style={{ cursor: "pointer" }}>
            <circle cx={yx(v.year)} cy={TY} r={k === i ? 8 : 6} fill={k === i ? C.red : v.legacy ? C.amber : C.green} stroke="var(--card)" strokeWidth={2} />
            <T x={yx(v.year)} y={TY - 13 - (k % 2) * 0} size={9} anchor="middle" bold={k === i} color={k === i ? C.red : C.fg}>{v.v}</T>
            <rect x={yx(v.year) - 12} y={TY - 26} width={24} height={36} fill="transparent" />
          </g>
        ))}
        <T x={X0} y={SY - 26} size={8.5}>{tx(t, "figGlTime_feed", "vertex data")}: <tspan fill={C.fg}>{tx(t, FEED[ver.feed][0], FEED[ver.feed][1])}</tspan></T>
        {ver.stages.map((k, s) => {
          const x = 20 + s * (SW + 8);
          return (
            <g key={s}>
              {s > 0 && s < 6 && <line x1={x - 8} y1={SY + SH / 2} x2={x} y2={SY + SH / 2} stroke={C.axis} />}
              <rect x={x} y={SY} width={SW} height={SH} rx={6} fill={colour(k)} fillOpacity={k === "none" ? 0.06 : 0.22}
                stroke={colour(k)} strokeDasharray={k === "none" ? "4 3" : undefined} />
              <T x={x + SW / 2} y={SY + 15} size={8.5} anchor="middle" bold color={k === "none" ? C.muted : C.fg}>{tx(t, STAGES[s][0], STAGES[s][1])}</T>
              <T x={x + SW / 2} y={SY + 27} size={7.5} anchor="middle" color={colour(k)}>
                {k === "prog" ? tx(t, "figGlTime_prog", "shader") : k === "fixed" ? tx(t, "figGlTime_fixed", "fixed") : tx(t, "figGlTime_none", "—")}
              </T>
            </g>
          );
        })}
        <T x={20} y={SY + SH + 26} size={8} color={C.sky}>■ {tx(t, "figGlTime_legFixed", "fixed-function")}</T>
        <T x={130} y={SY + SH + 26} size={8} color={C.green}>■ {tx(t, "figGlTime_legProg", "programmable")}</T>
        <T x={240} y={SY + SH + 26} size={8}>┆ {tx(t, "figGlTime_legNone", "does not exist yet")}</T>
      </svg>
    </Figure>
  );
}
