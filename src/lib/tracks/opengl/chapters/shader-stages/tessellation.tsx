"use client";

// Tessellation (Advanced OpenGL): control and evaluation shaders, levels, spacing, and screen-space LOD.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { SPACINGS, levelNumbers, spacingNumbers } from "@/lib/tracks/opengl/live/tessellation";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TessDomainFigure } from "@/components/lesson/figures/advgl/TessDomainFigure";
import { TessTerrainFigure } from "@/components/lesson/figures/advgl/TessTerrainFigure";

const r = String.raw;

// ── Tessellation ─────────────────────────────────────────────────────────────

export function TessellationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTess_intro",
          "Tessellation lets the GPU create the detail. You send coarse patches (a terrain made of 64 quads, a character made of a few thousand triangles), and for every patch the GPU decides, per frame, how finely to subdivide it, then places each new vertex wherever you like, typically on a heightmap. Detail goes where the camera is looking, and nowhere else.")}
      </Lead>

      <Goals t={t} id="oglTess" items={[
        "Name the three tessellation stages and what each one does.",
        "Set tessellation levels, and choose them so no cracks appear.",
        "Turn domain coordinates into points on a surface in the evaluation shader.",
        "Smooth a mesh with Phong tessellation.",
      ]} />

      <H2>{tx(t, "oglTess_stagesTitle", "Three stages, one of them fixed")}</H2>
      <LessonTable
        headers={[tx(t, "oglTess_thStage", "Stage"), tx(t, "oglTess_thRuns", "Runs"), tx(t, "oglTess_thJob", "Job")]}
        rows={[
          [tx(t, "oglTess_s1", "Tessellation Control Shader (TCS)"), tx(t, "oglTess_s1r", "once per output control point"), tx(t, "oglTess_s1j", "passes control points through (or modifies them) and writes gl_TessLevelOuter / gl_TessLevelInner for the patch")],
          [tx(t, "oglTess_s2", "Primitive generator (tessellator)"), tx(t, "oglTess_s2r", "fixed function"), tx(t, "oglTess_s2j", "subdivides an abstract domain (quad, triangle or isolines) according to the levels; never sees your vertices")],
          [tx(t, "oglTess_s3", "Tessellation Evaluation Shader (TES)"), tx(t, "oglTess_s3r", "once per generated vertex"), tx(t, "oglTess_s3j", "gets gl_TessCoord in the domain and computes the real position: interpolate, then displace")],
        ]}
      />
      <CodeBlock lang="cpp" filename="patches.cpp" t={t}>{`// No triangles any more: patches of N control points
glPatchParameteri(GL_PATCH_VERTICES, 4);          // quads: 4 corners per patch
glDrawArrays(GL_PATCHES, 0, 4 * patchCount);

GLint maxLevel;
glGetIntegerv(GL_MAX_TESS_GEN_LEVEL, &maxLevel);  // at least 64`}</CodeBlock>

      <H2>{tx(t, "oglTess_levelsTitle", "Tessellation levels")}</H2>
      <p>
        {tx(t, "oglTess_levelsBody",
          "Outer levels say how many segments each edge of the patch gets. Inner levels say how finely the interior is filled: a quad has two (one per direction), a triangle one. The tessellator builds concentric rings from the inner level, then replaces the outermost ring with the outer levels and stitches them together. Because each edge has its own outer level, two patches sharing an edge can agree on it even when their interiors differ.")}
      </p>
      <TessDomainFigure t={t} />
      <Equation label={tx(t, "oglTess_spacingLabel", "Spacing: how a real-valued level becomes segments")}
        where={[
          [r`f`, tx(t, "oglTess_wF", "the level written by the TCS (clamped to [1, 64], or [2, 64] for even)")],
          [r`n`, tx(t, "oglTess_wN", "segment count on the edge")],
        ]}
        notes={[
          tx(t, "oglTess_sp1", "equal_spacing: n = ⌈f⌉, all segments equal. Vertices pop in as f crosses an integer."),
          tx(t, "oglTess_sp2", "fractional_even / fractional_odd: n is f rounded up to the next even / odd integer; n − 2 segments have length 1/f, and two shorter ones take the rest. As f grows, the short pair grows smoothly from zero, so geometry morphs instead of popping."),
        ]}
        words={tx(t, "oglTess_spacingWords", "Round the level up to a whole number of segments: any whole number, the next even one, or the next odd one. With equal spacing all segments are the same. With fractional spacing all but two are 1/f long, and the last two share what is left of the edge.")}>
        {r`\begin{gathered} \ell_{long} = \frac{1}{f} \qquad \ell_{short} = \frac{1 - (n - 2)\,\ell_{long}}{2} \\[6pt] n = \begin{cases} \lceil f \rceil & \text{equal} \\ 2\lceil f/2 \rceil & \text{fractional\_even} \\ 2\lceil (f-1)/2 \rceil + 1 & \text{fractional\_odd} \end{cases} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglTess_liveSpacing", "Try it: how many segments, and how long?")}
        tex={r`\ell_{long} = \frac{1}{f} \qquad \ell_{short} = \frac{1 - (n - 2)\,\ell_{long}}{2}`}
        vars={[
          { id: "f", label: "f", min: 1, max: 10, step: 0.1, value: 3.5, fmt: v => v.toFixed(1) },
          { id: "mode", label: tx(t, "oglTess_liveMode", "spacing"), min: 0, max: 2, step: 1, value: 1, fmt: v => SPACINGS[v] },
        ]}
        compute={spacingNumbers(t)}
        note={tx(t, "oglTess_liveSpacingNote", "f = 3.5 with fractional_even: 4 segments, two of 0.286 and two short ones of 0.214. Move f towards 4 and the short pair grows until all four are 0.25; just past 4 the count jumps to 6, but the two new segments start at almost zero length, so nothing visibly pops.")} />

      <H2>{tx(t, "oglTess_tesTitle", "The TES: from domain coordinates to a surface")}</H2>
      <p>
        {tx(t, "oglTess_tesBody",
          "The TES receives all control points of the patch plus gl_TessCoord, the generated vertex's position in the abstract domain. For quads that is (u, v) in the unit square, so the position is a bilinear blend of the four corners. For triangles it is barycentric (u, v, w) with u + v + w = 1:")}
      </p>
      <Equation label={tx(t, "oglTess_interpLabel", "Interpolating the patch")}
        where={[
          [r`p_{00}, p_{10}, p_{11}, p_{01}`, tx(t, "oglTess_wQuad", "the quad patch's corners in the order the TCS passes them")],
          [r`h(\cdot)`, tx(t, "oglTess_wH", "the heightmap, sampled at the interpolated texture coordinate")],
          [r`k`, tx(t, "oglTess_wK", "displacement scale")],
        ]}
        words={tx(t, "oglTess_interpWords", "Quad: blend along the bottom edge by u, blend along the top edge by u, then blend those two results by v. Triangle: weight each corner by its own coordinate, the three weights adding up to 1. Either way, finish by lifting the point along the normal by the height read from the map.")}>
        {r`\begin{aligned}
p_{quad}(u, v) &= \operatorname{mix}\big(\operatorname{mix}(p_{00}, p_{10}, u),\ \operatorname{mix}(p_{01}, p_{11}, u),\ v\big) \\
p_{tri}(u, v, w) &= u\,p_0 + v\,p_1 + w\,p_2 \\
p' &= p + k\,h(uv)\,\hat{\mathbf{n}}
\end{aligned}`}
      </Equation>
      <CodeBlock lang="glsl" filename="terrain.tese" t={t}>{`#version 460 core
layout (quads, fractional_even_spacing, ccw) in;
in  vec2 tcUV[];                 // control points from the TCS
out vec2 uv;
out vec3 normal;
uniform sampler2D heightMap;
uniform float heightScale;
uniform float worldPerTexel;    // world distance between heightmap texels
uniform mat4 viewProj;

void main() {
    float u = gl_TessCoord.x, v = gl_TessCoord.y;
    vec4 p = mix(mix(gl_in[0].gl_Position, gl_in[1].gl_Position, u),
                 mix(gl_in[3].gl_Position, gl_in[2].gl_Position, u), v);
    uv     = mix(mix(tcUV[0], tcUV[1], u), mix(tcUV[3], tcUV[2], u), v);
    p.y   += texture(heightMap, uv).r * heightScale;

    // Displacement moved the surface, so the normal must come from the heightmap too
    vec2 texel = 1.0 / vec2(textureSize(heightMap, 0));
    float hL = texture(heightMap, uv - vec2(texel.x, 0)).r, hR = texture(heightMap, uv + vec2(texel.x, 0)).r;
    float hD = texture(heightMap, uv - vec2(0, texel.y)).r, hU = texture(heightMap, uv + vec2(0, texel.y)).r;
    normal = normalize(vec3((hL - hR) * heightScale, 2.0 * worldPerTexel, (hD - hU) * heightScale));

    gl_Position = viewProj * p;
}`}</CodeBlock>

      <H2>{tx(t, "oglTess_lodTitle", "Choosing levels without cracks")}</H2>
      <p>
        {tx(t, "oglTess_lodBody",
          "The TCS decides how much detail each patch deserves. A good metric targets a triangle size on screen, say 10–20 pixels: far patches get level 1, near ones up to 64. The trap is consistency. If a patch computes one level for all its edges, its neighbour may compute another for the shared edge. The two sides then have different vertex counts, their displaced vertices do not line up, and cracks open along the seam.")}
      </p>
      <Equation label={tx(t, "oglTess_edgeLabel", "Screen-space level for one edge")}
        where={[
          [r`a, b`, tx(t, "oglTess_wAb", "the edge's endpoints in world space")],
          [r`d`, tx(t, "oglTess_wD", "distance from the camera to the edge midpoint")],
          [r`H,\ \text{fov}`, tx(t, "oglTess_wHf", "viewport height in pixels, vertical field of view")],
          [r`T`, tx(t, "oglTess_wT", "target triangle edge length in pixels")],
        ]}
        note={tx(t, "oglTess_edgeNote", "The formula uses only the edge's own two endpoints, so both patches that share the edge compute the same number and the seam stays closed. Measuring a sphere around the edge instead of its projected length keeps the level from collapsing when the edge points at the camera. Inner levels are usually the max (or average) of the matching outer levels.")}
        words={tx(t, "oglTess_edgeWords", "Estimate how many pixels long the edge looks: its length divided by its distance, times how many pixels one unit covers at distance 1. Divide by the length you want each small triangle edge to have on screen, and keep the result between 1 and 64.")}>
        {r`\begin{gathered} \text{px}(a, b) \approx \frac{\lVert b - a \rVert}{d} \cdot \frac{H}{2\tan(\text{fov}/2)} \\[6pt] \text{level} = \operatorname{clamp}\!\left(\frac{\text{px}}{T},\ 1,\ 64\right) \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglTess_pxDer", "Where H / (2 tan(fov/2)) comes from")}
        steps={[
          { full: true, tex: r`\text{${tx(t, "oglTess_pd1t", "visible height at distance")}}\ d = 2\,d\,\tan(\text{fov}/2)`,
            why: tx(t, "oglTess_pd1", "the view frustum opens by fov/2 above and below the view direction, so at distance d it is 2·d·tan(fov/2) units tall") },
          { full: true, tex: r`\text{${tx(t, "oglTess_pd2t", "pixels per unit")}} = \frac{H}{2\,d\,\tan(\text{fov}/2)}`,
            why: tx(t, "oglTess_pd2", "those units are spread over the H pixels of the screen") },
          { full: true, tex: r`\text{px} \approx \lVert b - a \rVert \cdot \frac{H}{2\,d\,\tan(\text{fov}/2)}`,
            why: tx(t, "oglTess_pd3", "an edge facing the camera is its length times the pixels per unit. It is an estimate: an edge seen at an angle looks shorter, which the sphere trick in the note deliberately ignores") },
        ]} />
      <LiveFormula label={tx(t, "oglTess_liveLevel", "Try it: the level of one terrain edge")}
        tex={r`\text{level} = \operatorname{clamp}\!\left(\frac{\lVert b - a \rVert}{d} \cdot \frac{H}{2\tan(\text{fov}/2)} \cdot \frac{1}{T},\ 1,\ 64\right)`}
        vars={[
          { id: "L", label: "‖b − a‖", min: 1, max: 64, step: 1, value: 16, fmt: v => `${v} m` },
          { id: "d", label: "d", min: 5, max: 1000, step: 5, value: 100, fmt: v => `${v} m` },
          { id: "T", label: "T", min: 4, max: 32, step: 2, value: 12, fmt: v => `${v} px` },
        ]}
        compute={levelNumbers(t)}
        note={tx(t, "oglTess_liveLevelNote", "At 1080 pixels and fov 60°, one unit at distance 1 covers 935 pixels. A 16 m patch edge 100 m away looks 150 pixels long, so at T = 12 it gets level 12.5. At 1000 m it looks 15 pixels long and drops to level 1.25; within about 20 m it hits the cap of 64.")} />
      <CodeBlock lang="glsl" filename="terrain.tesc" t={t}>{`#version 460 core
layout (vertices = 4) out;
in  vec2 vUV[];   out vec2 tcUV[];
uniform vec3  camPos;
uniform float pxPerUnit;         // H / (2 tan(fov/2))
uniform float targetPx;

float edgeLevel(vec3 a, vec3 b) {
    float d = distance(camPos, 0.5 * (a + b));
    return clamp(distance(a, b) / d * pxPerUnit / targetPx, 1.0, 64.0);
}

void main() {
    gl_out[gl_InvocationID].gl_Position = gl_in[gl_InvocationID].gl_Position;
    tcUV[gl_InvocationID] = vUV[gl_InvocationID];

    if (gl_InvocationID == 0) {             // levels are per patch: write them once
        vec3 p0 = gl_in[0].gl_Position.xyz, p1 = gl_in[1].gl_Position.xyz;
        vec3 p2 = gl_in[2].gl_Position.xyz, p3 = gl_in[3].gl_Position.xyz;
        if (outsideFrustum(p0, p1, p2, p3)) {           // level 0 discards the whole patch
            gl_TessLevelOuter[0] = 0.0; gl_TessLevelOuter[1] = 0.0;
            gl_TessLevelOuter[2] = 0.0; gl_TessLevelOuter[3] = 0.0;
            return;
        }
        gl_TessLevelOuter[0] = edgeLevel(p3, p0);   // u = 0
        gl_TessLevelOuter[1] = edgeLevel(p0, p1);   // v = 0
        gl_TessLevelOuter[2] = edgeLevel(p1, p2);   // u = 1
        gl_TessLevelOuter[3] = edgeLevel(p2, p3);   // v = 1
        gl_TessLevelInner[0] = max(gl_TessLevelOuter[1], gl_TessLevelOuter[3]);
        gl_TessLevelInner[1] = max(gl_TessLevelOuter[0], gl_TessLevelOuter[2]);
    }
}`}</CodeBlock>
      <TessTerrainFigure t={t} />

      <H2>{tx(t, "oglTess_smoothTitle", "Smoothing instead of displacing: Phong tessellation")}</H2>
      <p>
        {tx(t, "oglTess_smoothBody",
          "Tessellation is also used to round off silhouettes of low-poly models without any heightmap. Phong tessellation (Boubekeur & Alexa, 2008) takes the flat interpolated point, projects it onto each corner's tangent plane, and blends those projections with the same barycentrics:")}
      </p>
      <Equation label={tx(t, "oglTess_phongLabel", "Phong tessellation")}
        where={[
          [r`p_i,\ \hat{\mathbf{n}}_i`, tx(t, "oglTess_wPi", "corner positions and their vertex normals")],
          [r`\pi_i(q)`, tx(t, "oglTess_wProj", "projection of q onto the plane through pᵢ perpendicular to nᵢ")],
          [r`\alpha`, tx(t, "oglTess_wAlpha", "shape factor; 0.75 is the usual default, 0 = flat")],
          [r`\lambda_i`, tx(t, "oglTess_wLambda", "the barycentric weights (u, v, w) of the generated vertex, one per corner")],
        ]}
        note={tx(t, "oglTess_phongNote", "It costs a handful of dot products per generated vertex and needs no extra data, which is why engines offered it as a one-click option. PN triangles (Vlachos et al., 2001) build a cubic Bézier patch from the same inputs for a slightly better shape.")}
        words={tx(t, "oglTess_phongWords", "Find the point on the flat triangle. Project it onto the tangent plane of each corner, the plane that corner's normal says the surface really has. Average the three projections with the same barycentric weights, and blend that with the flat point by α.")}>
        {r`\begin{gathered} p = u\,p_0 + v\,p_1 + w\,p_2 \qquad \pi_i(q) = q - \big((q - p_i)\cdot\hat{\mathbf{n}}_i\big)\,\hat{\mathbf{n}}_i \\[6pt] p^* = (1 - \alpha)\,p + \alpha \sum_i \lambda_i\,\pi_i(p) \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglTess_phongDer", "Two checks: the corners stay put, and flat stays flat")}
        steps={[
          { full: true, tex: r`(u, v, w) = (1, 0, 0) \;\Rightarrow\; p = p_0, \quad \pi_0(p_0) = p_0 - 0 = p_0`,
            why: tx(t, "oglTess_ph1", "at corner 0 the weights λ = (u, v, w) are (1, 0, 0), and p₀ lies on its own tangent plane, so projecting it changes nothing") },
          { full: true, tex: r`p^* = (1 - \alpha)\,p_0 + \alpha \cdot 1 \cdot p_0 = p_0`,
            why: tx(t, "oglTess_ph2", "only the corner's own projection has weight, so the corner stays where it was: neighbouring triangles still meet there, and no crack opens") },
          { full: true, tex: r`\hat{\mathbf{n}}_0 = \hat{\mathbf{n}}_1 = \hat{\mathbf{n}}_2 \perp \text{${tx(t, "oglTess_ph3t", "the triangle")}} \;\Rightarrow\; (p - p_i)\cdot\hat{\mathbf{n}}_i = 0 \;\Rightarrow\; p^* = p`,
            why: tx(t, "oglTess_ph3", "if all three normals are the face normal, every point of the triangle already lies on every tangent plane: a flat surface stays flat whatever α is. Only curved normals bend it") },
        ]} />
      <p>
        {tx(t, "oglTess_phongWhere", "where ")}
        <Tex>{r`(\lambda_0, \lambda_1, \lambda_2) = (u, v, w)`}</Tex>
        {tx(t, "oglTess_phongWhere2", ", the same gl_TessCoord used for the flat point.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglTess_sizeTip",
          "Do not tessellate below about 8 pixels per triangle. GPUs shade in 2×2 pixel quads, so a triangle covering one or two pixels still pays for four fragment invocations. Past that point extra triangles cost a lot and add nothing visible. Well-tuned terrain aims at 10–20 px per triangle edge.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglTess_pitfalls",
          "Forgetting glPatchParameteri, or drawing GL_TRIANGLES while a tessellation program is bound, is a GL_INVALID_OPERATION. Only invocation 0 should write the levels, and all invocations must agree if they read each other's outputs (use barrier()). Outside the fragment shader there are no derivatives, so texture() in the TES always reads mip level 0; far, coarsely tessellated patches then alias unless you pick a level yourself with textureLod. Displaced geometry needs its bounding volumes grown by the maximum height, or it gets culled while still visible. WebGL has no tessellation stages; the figures run a CPU model of the tessellator.")}
      </Callout>

      <KeyIdeas t={t} id="oglTess" items={[
        "Patches go in (GL_PATCHES); the TCS sets outer/inner levels; the fixed tessellator makes gl_TessCoord points; the TES turns them into positions.",
        "Outer levels control each edge, inner levels the interior rings; quads have 4 + 2, triangles 3 + 1.",
        "Fractional spacing morphs smoothly; equal spacing pops.",
        "Compute each edge's level only from that edge (screen-size metric) so neighbours match and no cracks appear.",
        "Displace in the TES along the normal, recompute normals from the heightmap, and cull patches by setting level 0.",
      ]} />
    </Article>
  );
}
