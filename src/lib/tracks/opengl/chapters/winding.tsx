"use client";

// OpenGL track — "Face Winding & Culling".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { WindingFigure } from "@/components/lesson/figures/WindingFigure";
import { KeyIdeas } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function WindingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch10_intro",
          "The order in which you specify a triangle's vertices is not cosmetic — it tells OpenGL which side of the face is the 'front'. OpenGL uses this to skip drawing back-facing triangles entirely, cutting fragment shader work roughly in half on closed meshes."
        )}
      </p>

      <H2>{tx(t, "ch10_windingTitle", "What winding order means")}</H2>
      <p>
        {tx(t, "ch10_windingBody",
          "When you look at a triangle from the front, trace its vertices in order. If they go counter-clockwise (CCW), OpenGL treats it as front-facing. If they go clockwise (CW), it is back-facing. This is determined by the cross product of two edge vectors — it always points toward the viewer for a front face."
        )}
      </p>

      <WindingFigure t={t} />

      <H2>{tx(t, "ch10_cullingTitle", "Enabling face culling")}</H2>
      <p>
        {tx(t, "ch10_cullingBody",
          "Face culling is disabled by default. You enable it once during initialization. After that, every back-facing triangle is rejected before the fragment shader even runs."
        )}
      </p>
      <CodeBlock lang="cpp" filename="culling_setup.cpp" t={t}>{`// Call once during initialization, before the render loop
glEnable(GL_CULL_FACE);     // enable culling (disabled by default)
glCullFace(GL_BACK);        // cull back-facing triangles (default)
glFrontFace(GL_CCW);        // CCW = front face (default)

// If your faces are vanishing unexpectedly, try:
// glCullFace(GL_FRONT);    // temporarily cull front faces instead
// — if they appear, your winding order is reversed`}</CodeBlock>

      <LessonTable
        headers={["Function", "Options", "Default"]}
        rows={[
          ["glCullFace",  "GL_BACK, GL_FRONT, GL_FRONT_AND_BACK",  "GL_BACK"],
          ["glFrontFace", "GL_CCW, GL_CW",                          "GL_CCW"],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "ch10_perfNote",
          "On a closed mesh (like a sphere or cube) where no back face is ever visible, enabling culling eliminates roughly 50% of all fragment shader invocations. For complex scenes this is one of the cheapest performance wins available."
        )}
      </Callout>

      <H2>{tx(t, "ch10_normalsTitle", "Normals and winding order")}</H2>
      <p>
        {tx(t, "ch10_normalsBody",
          "The surface normal of a triangle — the vector perpendicular to it pointing outward — is implicitly defined by its winding order. Using the right-hand rule: curl your fingers from edge v0→v1 to edge v0→v2 and your thumb points in the direction of the outward normal. This is why consistent winding matters when you compute normals for lighting."
        )}
      </p>
      <CodeBlock lang="cpp" filename="normal_from_winding.cpp" t={t}>{`// For a triangle with vertices A, B, C in CCW order:
glm::vec3 edge1 = B - A;
glm::vec3 edge2 = C - A;
glm::vec3 normal = glm::normalize(glm::cross(edge1, edge2));
// normal now points toward the front face (outward)`}</CodeBlock>

      <H2>{tx(t, "ch10_debugTitle", "Debugging winding issues")}</H2>
      <p>
        {tx(t, "ch10_debugBody",
          "Missing faces on a 3D model almost always mean incorrect or inconsistent winding. Common causes:"
        )}
      </p>
      <ul className="space-y-2 ml-4 list-disc text-[var(--text-muted)] text-sm">
        <li>{tx(t, "ch10_debug1", "Mesh loaded from a file that uses CW winding — flip with glFrontFace(GL_CW) or fix in the exporter")}</li>
        <li>{tx(t, "ch10_debug2", "Non-uniform scale (negative scale on one axis mirrors faces, reversing winding) — multiply model matrix determinant, reverse if negative")}</li>
        <li>{tx(t, "ch10_debug3", "Manually defined quads where the two triangles have inconsistent vertex order")}</li>
      </ul>

      <Callout type="tip" t={t}>
        {tx(t, "ch10_debugTip",
          "When debugging winding issues, temporarily call glDisable(GL_CULL_FACE) to see all faces. If the mesh looks correct with culling disabled, the problem is winding order. If it still looks wrong, the issue is elsewhere (normals, shader, transform)."
        )}
      </Callout>

      <H2>{tx(t, "ch10_areaTitle", "How the GPU decides: the signed area")}</H2>
      <p>
        {tx(t, "ch10_areaBody",
          "The decision is made after the vertex shader and the perspective divide, on the triangle's window-space (screen) coordinates, just before rasterization. The rasterizer computes the triangle's signed area; its sign is the winding as seen on screen:"
        )}
      </p>
      <Equation label={tx(t, "ch10_areaLabel", "Signed area in window coordinates")}
        where={[
          [String.raw`(x_i, y_i)`, tx(t, "ch10_wXY", "the three vertices in window coordinates, in submission order")],
        ]}
        note={tx(t, "ch10_areaNote", "With glFrontFace(GL_CCW), a > 0 means front-facing. It is the z component of the cross product of two screen-space edges, the same test as in the figure above, done once per triangle. Zero-area (degenerate) triangles are discarded here too, which is why they are a cheap way to stitch strips.")}>
        {String.raw`a = \frac{1}{2}\sum_{i=0}^{2} \left(x_i\, y_{i \oplus 1} - x_{i \oplus 1}\, y_i\right) \qquad i \oplus 1 = (i + 1) \bmod 3`}
      </Equation>

      <H2>{tx(t, "ch10_savesTitle", "What culling saves, and what it does not")}</H2>
      <p>
        {tx(t, "ch10_savesBody",
          "Back faces are removed after vertex shading, so every vertex is still transformed. Culling saves rasterization and fragment work, which is usually most of the cost, but a vertex-bound scene gains little. To skip vertex work too, the test has to happen earlier, on groups of triangles: engines split meshes into clusters (meshlets) of about 64–128 triangles. They store a normal cone per cluster and reject whole clusters that face away from the camera, on the CPU or in a compute or mesh shader:"
        )}
      </p>
      <Equation label={tx(t, "ch10_coneLabel", "Cluster back-face culling with a normal cone")}
        where={[
          [String.raw`\mathbf a,\ \alpha`, tx(t, "ch10_wCone", "cone axis and half-angle containing every triangle normal of the cluster")],
          [String.raw`\mathbf c,\ \mathbf e`, tx(t, "ch10_wCE", "cluster centre and camera position")],
        ]}
        note={tx(t, "ch10_coneNote", "If the direction to the cluster is within 90° − α of the axis, every triangle faces away and the whole cluster can be skipped. In practice this removes 10–25% of the triangles before any vertex shading (meshoptimizer's meshopt_computeClusterBounds computes the cone).")}>
        {String.raw`\text{cull cluster} \iff \frac{\mathbf c - \mathbf e}{\lVert \mathbf c - \mathbf e \rVert}\cdot \mathbf a \;\ge\; \sin\alpha`}
      </Equation>

      <H2>{tx(t, "ch10_casesTitle", "Special cases")}</H2>
      <LessonTable
        headers={[tx(t, "ch10_thCase", "Case"), tx(t, "ch10_thDo", "What to do")]}
        rows={[
          [tx(t, "ch10_c1", "Mirrored objects (negative scale)"), tx(t, "ch10_c1d", "det(model) < 0 reverses the winding: switch glFrontFace(GL_CW) for those draws, or sort them into their own batch")],
          [tx(t, "ch10_c2", "Planar reflections"), tx(t, "ch10_c2d", "the reflection matrix mirrors the whole scene: flip glFrontFace while rendering the reflected pass")],
          [tx(t, "ch10_c3", "Foliage, cloth, paper (two-sided)"), tx(t, "ch10_c3d", "disable culling for that material and flip the normal in the fragment shader with gl_FrontFacing")],
          [tx(t, "ch10_c4", "Shadow depth pass"), tx(t, "ch10_c4d", "cull front faces instead: stored depth moves to the back side and shadow acne mostly disappears")],
          [tx(t, "ch10_c5", "Inside a closed mesh (skybox, room)"), tx(t, "ch10_c5d", "the camera sees the inside faces: cull front faces or build the mesh with inward winding")],
        ]}
      />
      <CodeBlock lang="glsl" filename="two_sided.frag" t={t}>{`// Two-sided material: culling disabled for this draw
void main() {
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;     // light the back side as if it were facing us
    // … shading with N
}`}</CodeBlock>

      <KeyIdeas t={t} id="ch10" items={[
        "Winding is decided on screen: the sign of the triangle's window-space area.",
        "glEnable(GL_CULL_FACE) removes back faces before rasterization, roughly halving fragment work on closed meshes.",
        "Vertex shading still runs; cluster cone culling skips whole groups before it.",
        "Negative scale and reflections flip winding; two-sided materials disable culling and use gl_FrontFacing.",
      ]} />

    </article>
  );
}
