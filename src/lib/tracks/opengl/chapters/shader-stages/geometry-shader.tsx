"use client";

// Geometry Shader (Advanced OpenGL): the optional stage between the vertex (and tessellation) stages and the rasterizer.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { edgeNumbers, faceNumbers } from "@/lib/tracks/opengl/live/geometry-shader";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GsEmitFigure } from "@/components/lesson/figures/advgl/GsEmitFigure";
import { GsEffectsFigure } from "@/components/lesson/figures/advgl/GsEffectsFigure";

const r = String.raw;

// ── Geometry shader ──────────────────────────────────────────────────────────

export function GeometryShaderContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglGs_intro",
          "A vertex shader sees one vertex and cannot create or destroy anything. A geometry shader sees a whole primitive (a point, a line or a triangle, all its vertices at once) and decides what comes out: nothing, the same primitive, or several new ones. It sits after the vertex (and tessellation) stages and before the rasterizer.")}
      </Lead>

      <Goals t={t} id="oglGs" items={[
        "Write a geometry shader that emits new vertices.",
        "Do per-triangle work, such as exploding a mesh or drawing its normals.",
        "Render to several layers at once.",
        "Explain why geometry shaders fell out of favour.",
      ]} />

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
        note={tx(t, "oglGs_faceNote", "The order of the cross product follows the winding: for counter-clockwise front faces, (b − a) × (c − a) points out of the front side. Swap it and every normal points inwards.")}
        words={tx(t, "oglGs_faceWords", "The cross product of two edges is perpendicular to the triangle; divided by its length it is the face normal. The centroid is the average of the three corners. Each vertex is slid towards the centroid by the share s, then pushed m units along the face normal.")}>
        {r`\begin{gathered} \hat{\mathbf{n}}_f = \frac{(b - a) \times (c - a)}{\lVert (b - a) \times (c - a) \rVert} \qquad g = \frac{a + b + c}{3} \\[6pt] p' = \operatorname{mix}(p,\ g,\ s) + m\,\hat{\mathbf{n}}_f \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglGs_faceDer", "One triangle worked through")}
        steps={[
          { full: true, tex: r`a = (0, 0, 0) \qquad b = (3, 0, 0) \qquad c = (0, 3, 0)`,
            why: tx(t, "oglGs_fd1", "a right triangle in the xy plane, its corners counter-clockwise when seen from +z") },
          { full: true, tex: r`\begin{aligned} (b - a) \times (c - a) &= (3, 0, 0) \times (0, 3, 0) \\ &= (0 \cdot 0 - 0 \cdot 3,\ 0 \cdot 0 - 3 \cdot 0,\ 3 \cdot 3 - 0 \cdot 0) \\ &= (0, 0, 9) \end{aligned}`,
            why: tx(t, "oglGs_fd2", "the cross product, component by component: it points along +z, out of the side the corners turn counter-clockwise on") },
          { full: true, tex: r`\hat{\mathbf{n}}_f = \frac{(0, 0, 9)}{9} = (0, 0, 1) \qquad g = \frac{(3, 3, 0)}{3} = (1, 1, 0)`,
            why: tx(t, "oglGs_fd3", "its length is 9 (twice the triangle's area of 4.5), so the unit normal is (0, 0, 1). The centroid is the average of the corners") },
          { full: true, tex: r`(c - a) \times (b - a) = (0, 0, -9)`,
            why: tx(t, "oglGs_fd4", "swap the two edges and the normal flips to −z: the explode would push the triangle into the mesh instead of out of it") },
        ]} />
      <LiveFormula label={tx(t, "oglGs_liveFace", "Try it: shrink and explode that triangle")}
        tex={r`p' = \operatorname{mix}(p,\ g,\ s) + m\,\hat{\mathbf{n}}_f`}
        vars={[
          { id: "s", label: "s", min: 0, max: 1, step: 0.05, value: 0.5 },
          { id: "m", label: "m", min: 0, max: 2, step: 0.1, value: 0.5 },
        ]}
        compute={faceNumbers()}
        note={tx(t, "oglGs_liveFaceNote", "At s = 0.5 every corner moves halfway to the centroid: the triangle keeps its shape at half the size. At s = 1 all three corners meet at (1, 1, 0) and the triangle vanishes. m lifts all three by the same amount along z, so the face moves without turning.")} />
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
        note={tx(t, "oglGs_wireNote", "The geometry shader gives vertex a the distances (hₐ, 0, 0), b (0, h_b, 0) and c (0, 0, h_c). Interpolated, the smallest component is the pixel distance to the nearest edge. A smoothstep turns that into an anti-aliased line drawn over the shaded surface, in the same pass. Barycentrics with fwidth, as in the figure below, give the same result without a geometry stage.")}
        words={tx(t, "oglGs_wireWords", "Give each corner its distance to the opposite edge, in pixels. After interpolation, every pixel knows how far it is from each edge; the smallest of the three is the distance to the nearest edge. Pixels closer than the line width get the line colour, with a soft two-pixel border.")}>
        {r`\begin{gathered} h_a = \frac{2A}{\lVert c - b \rVert} \qquad d = \min(d_a, d_b, d_c) \\[6pt] \text{edge} = 1 - \operatorname{smoothstep}(w - 1,\ w + 1,\ d) \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglGs_hDer", "Where hₐ = 2A / ‖c − b‖ comes from")}
        steps={[
          { full: true, tex: r`A = \tfrac12 \cdot \text{${tx(t, "oglGs_hd1t", "base")}} \cdot \text{${tx(t, "oglGs_hd1u", "height")}} = \tfrac12\,\lVert c - b \rVert\,h_a`,
            why: tx(t, "oglGs_hd1", "a triangle's area is half its base times its height. Take bc as the base: the height is then the distance from a to that edge") },
          { full: true, tex: r`h_a = \frac{2A}{\lVert c - b \rVert}`,
            why: tx(t, "oglGs_hd2", "solve for the height. A comes from the cross product of two screen-space edges, so one cross product gives all three heights") },
          { full: true, tex: r`A = 200,\ \lVert c - b \rVert = 40 \;\Rightarrow\; h_a = \frac{400}{40} = 10\ \text{px}`,
            why: tx(t, "oglGs_hd3", "a triangle of 200 pixels with a 40-pixel edge bc: a is 10 pixels from it. The distance falls linearly to 0 along the way to b and c, which is why interpolating it gives each pixel its exact distance") },
        ]} />
      <LiveFormula label={tx(t, "oglGs_liveEdge", "Try it: how much line does a pixel this far from the edge get?")}
        tex={r`\text{edge} = 1 - \operatorname{smoothstep}(w - 1,\ w + 1,\ d)`}
        vars={[
          { id: "d", label: "d", min: 0, max: 6, step: 0.1, value: 1.5, fmt: v => `${v.toFixed(1)} px` },
          { id: "w", label: "w", min: 1, max: 4, step: 0.5, value: 1.5, fmt: v => `${v} px` },
        ]}
        where={[[r`\operatorname{smoothstep}(e_0, e_1, x)`, tx(t, "oglGs_wSmooth", "0 below e₀, 1 above e₁, and the smooth S-curve 3x² − 2x³ of the fraction in between")]]}
        compute={edgeNumbers(t)}
        note={tx(t, "oglGs_liveEdgeNote", "Inside w − 1 the pixel is fully line; beyond w + 1 it is fully surface. In between, the two-pixel ramp is the anti-aliasing: exactly at d = w the pixel is half line, half surface.")} />
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
          [tx(t, "oglGs_w3", "Rendering to 6 cube faces or N cascades"), tx(t, "oglGs_b3", "gl_Layer from the vertex shader (ARB_shader_viewport_layer_array extension) + instancing")],
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