"use client";

// The optional programmable stages between the vertex shader and the rasterizer: Geometry Shader → Tessellation.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { GsEmitFigure } from "@/components/lesson/figures/advgl/GsEmitFigure";
import { GsEffectsFigure } from "@/components/lesson/figures/advgl/GsEffectsFigure";
import { TessDomainFigure } from "@/components/lesson/figures/advgl/TessDomainFigure";
import { TessTerrainFigure } from "@/components/lesson/figures/advgl/TessTerrainFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Geometry shader
// ═════════════════════════════════════════════════════════════════════════════

export function GeometryShaderContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglGs_intro",
          "A vertex shader sees one vertex and cannot create or destroy anything. A geometry shader sees a whole primitive (a point, a line or a triangle, all its vertices at once) and decides what comes out: nothing, the same primitive, or several new ones. It sits after the vertex (and tessellation) stages and before the rasterizer.")}
      </Lead>

      <H2>{tx(t, "oglGs_ioTitle", "Inputs, outputs, EmitVertex")}</H2>
      <p>
        {tx(t, "oglGs_ioBody",
          "Two layout declarations define the shader's contract. The input type must match what the draw call sends (GL_POINTS → points, GL_TRIANGLES → triangles). The output is always one of three strip types, and max_vertices is a hard upper bound the driver uses to size its buffers:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglGs_thIn", "Input layout"), tx(t, "oglGs_thDraw", "Draw mode"), tx(t, "oglGs_thN", "gl_in.length()")]}
        rows={[
          ["points", "GL_POINTS", "1"],
          ["lines", "GL_LINES, GL_LINE_STRIP, GL_LINE_LOOP", "2"],
          ["lines_adjacency", "GL_LINES_ADJACENCY, GL_LINE_STRIP_ADJACENCY", "4"],
          ["triangles", "GL_TRIANGLES, GL_TRIANGLE_STRIP, GL_TRIANGLE_FAN", "3"],
          ["triangles_adjacency", "GL_TRIANGLES_ADJACENCY, GL_TRIANGLE_STRIP_ADJACENCY", "6"],
        ]}
      />
      <CodeBlock lang="glsl" filename="passthrough.geom" t={t}>{`#version 460 core
layout (triangles) in;
layout (triangle_strip, max_vertices = 3) out;   // or points / line_strip

in  VS_OUT { vec3 normal; vec2 uv; } gs_in[];     // arrays: one entry per input vertex
out GS_OUT { vec3 normal; vec2 uv; } gs_out;      // one value, set before each EmitVertex

void main() {
    for (int i = 0; i < 3; ++i) {
        gl_Position   = gl_in[i].gl_Position;     // built-in input block
        gs_out.normal = gs_in[i].normal;
        gs_out.uv     = gs_in[i].uv;
        EmitVertex();                             // snapshot every output variable
    }
    EndPrimitive();                               // close this strip, start a new one
}`}</CodeBlock>
      <p>
        {tx(t, "oglGs_stripBody",
          "EmitVertex copies the current values of all outputs into a new vertex. With triangle_strip output, each new vertex after the second forms a triangle with the two before it, so a quad is 4 emits in zig-zag order, not 6. EndPrimitive ends the current strip; anything emitted after it starts a fresh one.")}
      </p>
      <GsEmitFigure t={t} />

      <H2>{tx(t, "oglGs_mathTitle", "The per-triangle maths")}</H2>
      <p>
        {tx(t, "oglGs_mathBody",
          "Most classic geometry-shader effects need something only a whole-triangle view can give: the face normal and the centroid.")}
      </p>
      <Equation label={tx(t, "oglGs_faceLabel", "Face normal, centroid, explode and shrink")}
        where={[
          [r`a, b, c`, tx(t, "oglGs_wAbc", "the three vertex positions, in the same space (world or view)")],
          [r`m`, tx(t, "oglGs_wM", "explode distance; animate it with time")],
          [r`s`, tx(t, "oglGs_wS", "shrink amount: 0 = original, 1 = collapsed to the centroid")],
        ]}
        note={tx(t, "oglGs_faceNote", "The order of the cross product follows the winding: for counter-clockwise front faces, (b − a) × (c − a) points out of the front side. Swap it and every normal points inwards.")}>
        {r`\hat{\mathbf{n}}_f = \frac{(b - a) \times (c - a)}{\lVert (b - a) \times (c - a) \rVert} \qquad g = \frac{a + b + c}{3} \qquad p' = \operatorname{mix}(p,\ g,\ s) + m\,\hat{\mathbf{n}}_f`}
      </Equation>
      <CodeBlock lang="glsl" filename="explode.geom" t={t}>{`layout (triangles) in;
layout (triangle_strip, max_vertices = 3) out;
uniform float magnitude;
uniform mat4  projection;             // positions arrive in view space

void main() {
    vec3 a = gl_in[0].gl_Position.xyz, b = gl_in[1].gl_Position.xyz, c = gl_in[2].gl_Position.xyz;
    vec3 n = normalize(cross(b - a, c - a));
    for (int i = 0; i < 3; ++i) {
        gl_Position = projection * vec4(gl_in[i].gl_Position.xyz + n * magnitude, 1.0);
        EmitVertex();
    }
    EndPrimitive();
}`}</CodeBlock>
      <p>
        {tx(t, "oglGs_normalsBody",
          "Normal visualisation is the best debugging tool this stage offers. Draw the mesh once normally, then again with a geometry shader that turns every vertex into a short line along its normal. Wrong normal matrices, flipped winding and missing tangents become obvious at a glance.")}
      </p>
      <CodeBlock lang="glsl" filename="normals.geom" t={t}>{`layout (triangles) in;
layout (line_strip, max_vertices = 6) out;
in VS_OUT { vec3 normal; } gs_in[];     // view-space normals from the vertex shader
uniform float len;
uniform mat4  projection;

void main() {
    for (int i = 0; i < 3; ++i) {
        vec4 p = gl_in[i].gl_Position;
        gl_Position = projection * p;                                    EmitVertex();
        gl_Position = projection * (p + vec4(gs_in[i].normal * len, 0)); EmitVertex();
        EndPrimitive();                    // three separate 2-vertex lines
    }
}`}</CodeBlock>
      <Equation label={tx(t, "oglGs_wireLabel", "Single-pass wireframe: distance to the edges")}
        where={[
          [r`h_a`, tx(t, "oglGs_wHa", "screen-space height of the triangle from vertex a to the opposite edge bc")],
          [r`A`, tx(t, "oglGs_wA", "the triangle's area in pixels")],
          [r`w`, tx(t, "oglGs_wW", "line width in pixels")],
        ]}
        note={tx(t, "oglGs_wireNote", "The geometry shader gives vertex a the distances (hₐ, 0, 0), b (0, h_b, 0) and c (0, 0, h_c). Interpolated, the smallest component is the pixel distance to the nearest edge. A smoothstep turns that into an anti-aliased line drawn over the shaded surface, in the same pass. Barycentrics with fwidth, as in the figure below, give the same result without a geometry stage.")}>
        {r`h_a = \frac{2A}{\lVert c - b \rVert} \qquad d = \min(d_a, d_b, d_c) \qquad \text{edge} = 1 - \operatorname{smoothstep}(w - 1,\ w + 1,\ d)`}
      </Equation>
      <GsEffectsFigure t={t} />

      <H2>{tx(t, "oglGs_layerTitle", "Layered rendering and instancing")}</H2>
      <p>
        {tx(t, "oglGs_layerBody",
          "Writing gl_Layer chooses which layer of a layered framebuffer (a cube map or a texture array) the primitive goes to. That is how the point-shadows chapter renders all six cube faces in one draw, and how cascaded shadow maps fill every cascade at once. layout(invocations = N) runs the shader N times per primitive, with gl_InvocationID telling each copy which one it is. That is cheaper than a loop because the invocations run in parallel:")}
      </p>
      <CodeBlock lang="glsl" filename="cube_layers.geom" t={t}>{`layout (triangles, invocations = 6) in;          // one invocation per cube face
layout (triangle_strip, max_vertices = 3) out;
uniform mat4 faceViewProj[6];
out vec3 worldPos;

void main() {
    for (int i = 0; i < 3; ++i) {
        worldPos    = gl_in[i].gl_Position.xyz;      // world space from the VS
        gl_Position = faceViewProj[gl_InvocationID] * gl_in[i].gl_Position;
        gl_Layer    = gl_InvocationID;               // pick the cube face
        EmitVertex();
    }
    EndPrimitive();
}`}</CodeBlock>

      <H2>{tx(t, "oglGs_perfTitle", "Why it fell out of favour")}</H2>
      <p>
        {tx(t, "oglGs_perfBody",
          "Geometry shaders are known for being slow, and the reason is structural. Output must come out in the exact order it was emitted, so the GPU cannot freely interleave invocations. The worst-case output (max_vertices × components) must be buffered on chip for every invocation in flight, which limits how many can run at once. Amplifying geometry heavily, like one point turning into dozens of triangles, therefore starves the GPU.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglGs_thWant", "You want"), tx(t, "oglGs_thBetter", "Usually better")]}
        rows={[
          [tx(t, "oglGs_w1", "Billboards / particles from points"), tx(t, "oglGs_b1", "instanced quads (vertex ID picks the corner) — see Particles")],
          [tx(t, "oglGs_w2", "Thick lines"), tx(t, "oglGs_b2", "instanced quads per segment, expanded in the vertex shader")],
          [tx(t, "oglGs_w3", "Rendering to 6 cube faces or N cascades"), tx(t, "oglGs_b3", "gl_Layer from the vertex shader (GL 4.x ARB_shader_viewport_layer_array) + instancing")],
          [tx(t, "oglGs_w4", "Culling or generating lots of geometry"), tx(t, "oglGs_b4", "compute shader + indirect draw; mesh shaders on modern GPUs")],
          [tx(t, "oglGs_w5", "Debug views (normals, wireframe)"), tx(t, "oglGs_b5", "geometry shader is fine — clarity beats speed here")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglGs_meshNote",
          "Mesh shaders (NV_mesh_shader in OpenGL, core in Vulkan and D3D12) replace the whole vertex/tessellation/geometry front end with two compute-like stages. A task shader culls and decides how much work to launch; a mesh shader outputs small batches (meshlets) of vertices and triangles directly. Unreal's Nanite goes further and rasterizes tiny triangles in compute. The geometry shader's ideas survive, just in a form that scales.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglGs_pitfalls",
          "Outputs are undefined after EmitVertex, so set every output again before each call, including flat ones. A mismatch between the draw mode and the input layout is a GL_INVALID_OPERATION at draw time, not a compile error. Positions must be in clip space when they leave the last pre-raster stage: if the vertex shader already applied the projection, do not apply it again. WebGL and OpenGL ES 3.0 have no geometry stage at all; the figures here bake the per-triangle values into the vertex buffer instead.")}
      </Callout>

      <KeyIdeas t={t} id="oglGs" items={[
        "The geometry shader runs once per primitive and sees all its vertices (gl_in[]).",
        "It emits 0..max_vertices vertices as points, line strips or triangle strips; EmitVertex snapshots outputs, EndPrimitive cuts the strip.",
        "Per-triangle data (face normal, centroid) enables explode, shrink, normal debug lines and single-pass wireframe.",
        "gl_Layer + invocations render to cube faces or array layers in one draw.",
        "It is slow for amplification: prefer instancing, compute or mesh shaders for heavy work.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Tessellation
// ═════════════════════════════════════════════════════════════════════════════

export function TessellationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTess_intro",
          "Tessellation lets the GPU create the detail. You send coarse patches (a terrain made of 64 quads, a character made of a few thousand triangles), and for every patch the GPU decides, per frame, how finely to subdivide it, then places each new vertex wherever you like, typically on a heightmap. Detail goes where the camera is looking, and nowhere else.")}
      </Lead>

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
        ]}>
        {r`\ell_{long} = \frac{1}{f} \qquad \ell_{short} = \frac{1 - (n - 2)\,\ell_{long}}{2} \qquad n = \begin{cases} \lceil f \rceil & \text{equal} \\ 2\lceil f/2 \rceil & \text{fractional\_even} \\ 2\lceil (f-1)/2 \rceil + 1 & \text{fractional\_odd} \end{cases}`}
      </Equation>

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
        ]}>
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
        note={tx(t, "oglTess_edgeNote", "The formula uses only the edge's own two endpoints, so both patches that share the edge compute the same number and the seam stays closed. Measuring a sphere around the edge instead of its projected length keeps the level from collapsing when the edge points at the camera. Inner levels are usually the max (or average) of the matching outer levels.")}>
        {r`\text{px}(a, b) \approx \frac{\lVert b - a \rVert}{d} \cdot \frac{H}{2\tan(\text{fov}/2)} \qquad \text{level} = \operatorname{clamp}\!\left(\frac{\text{px}}{T},\ 1,\ 64\right)`}
      </Equation>
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
        ]}
        note={tx(t, "oglTess_phongNote", "It costs a handful of dot products per generated vertex and needs no extra data, which is why engines offered it as a one-click option. PN triangles (Vlachos et al., 2001) build a cubic Bézier patch from the same inputs for a slightly better shape.")}>
        {r`p = u\,p_0 + v\,p_1 + w\,p_2 \qquad \pi_i(q) = q - \big((q - p_i)\cdot\hat{\mathbf{n}}_i\big)\,\hat{\mathbf{n}}_i \qquad p^* = (1 - \alpha)\,p + \alpha \sum_i \lambda_i\,\pi_i(p)`}
      </Equation>
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
