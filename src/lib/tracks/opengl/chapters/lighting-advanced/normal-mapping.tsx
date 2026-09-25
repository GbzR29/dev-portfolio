// src/lib/tracks/opengl/chapters/lighting-advanced/normal-mapping.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { NormalMapFigure } from "@/components/lesson/figures/advlighting/NormalMapFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Normal mapping
// ═════════════════════════════════════════════════════════════════════════════

export function NormalMappingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglNMap_intro",
          "Lighting depends on the normal, not on the geometry. So instead of modelling every groove in a brick wall with triangles, store how the normal would tilt at each texel and light a flat quad as if the grooves were there.")}
      </Lead>

      <NormalMapFigure t={t} />

      <H2>{tx(t, "oglNMap_encodeTitle", "Normals stored as colours")}</H2>
      <p>
        {tx(t, "oglNMap_encodeBody",
          "A unit normal has components in [−1, 1]; a texture stores [0, 1]. The mapping is a scale and a shift. Most texels point straight out of the surface, (0, 0, 1), which encodes to (0.5, 0.5, 1) — the reason normal maps look mostly lavender blue.")}
      </p>
      <Equation label={tx(t, "oglNMap_encLabel", "Encoding and decoding")}>
        {r`\text{rgb} = \tfrac12\,\mathbf{n} + \tfrac12 \qquad\Longleftrightarrow\qquad \mathbf{n} = 2\,\text{rgb} - 1`}
      </Equation>

      <H2>{tx(t, "oglNMap_tangentTitle", "Tangent space")}</H2>
      <p>
        {tx(t, "oglNMap_tangentBody",
          "The normals in the map are relative to the surface: z means \"out of the surface\", x points along the texture's u direction and y along v. To light with them we need, at each vertex, the world directions that u and v run in — the tangent T and bitangent B — alongside the normal N.")}
      </p>
      <p>
        {tx(t, "oglNMap_deriveBody",
          "Take a triangle with corners P0, P1, P2 and texture coordinates (u, v). Its two edges are some combination of T and B, weighted by how much u and v change along them:")}
      </p>
      <Equation label={tx(t, "oglNMap_deriveLabel", "Solving for the tangent and bitangent")}
        where={[
          [r`E_1, E_2`, tx(t, "oglNMap_wE", "triangle edges P1 − P0 and P2 − P0")],
          [r`\Delta u_i, \Delta v_i`, tx(t, "oglNMap_wUV", "the change in texture coordinates along each edge")],
        ]}>
        {r`\begin{aligned}
E_1 &= \Delta u_1\,\red{T} + \Delta v_1\,\green{B} \\
E_2 &= \Delta u_2\,\red{T} + \Delta v_2\,\green{B}
\end{aligned}
\;\;\Longrightarrow\;\;
\begin{bmatrix} \red{T} \\ \green{B} \end{bmatrix}
= \frac{1}{\Delta u_1 \Delta v_2 - \Delta u_2 \Delta v_1}
\begin{bmatrix} \Delta v_2 & -\Delta v_1 \\ -\Delta u_2 & \Delta u_1 \end{bmatrix}
\begin{bmatrix} E_1 \\ E_2 \end{bmatrix}`}
      </Equation>
      <CodeBlock lang="cpp" filename="tangents.cpp" t={t}>{`glm::vec3 e1 = p1 - p0, e2 = p2 - p0;
glm::vec2 d1 = uv1 - uv0, d2 = uv2 - uv0;
float f = 1.0f / (d1.x * d2.y - d2.x * d1.y);

glm::vec3 tangent   = f * (d2.y * e1 - d1.y * e2);
glm::vec3 bitangent = f * (-d2.x * e1 + d1.x * e2);
// Assimp computes these for you with aiProcess_CalcTangentSpace`}</CodeBlock>

      <H2>{tx(t, "oglNMap_tbnTitle", "The TBN matrix")}</H2>
      <p>
        {tx(t, "oglNMap_tbnBody",
          "Put the three world-space axes in the columns of a matrix and it converts any tangent-space vector into world space — exactly what the sampled normal needs. After interpolation T may no longer be perpendicular to N, so re-orthogonalize it with one Gram-Schmidt step and rebuild B with a cross product.")}
      </p>
      <Equation label={tx(t, "oglNMap_tbnLabel", "From the map to world space")}>
        {r`TBN = \begin{bmatrix} \red{T} & \green{B} & \blue{N} \end{bmatrix}
\qquad
\mathbf{n}_{\text{world}} = TBN\,(2\,\text{rgb} - 1)
\qquad
\red{T'} = \operatorname{normalize}\big(\red{T} - (\red{T}\cdot\blue{N})\,\blue{N}\big)`}
      </Equation>
      <CodeBlock lang="glsl" filename="normal_mapping.vert" t={t}>{`layout (location = 3) in vec3 aTangent;
out mat3 TBN;

void main() {
    vec3 T = normalize(normalMatrix * aTangent);
    vec3 N = normalize(normalMatrix * aNormal);
    T = normalize(T - dot(T, N) * N);     // Gram-Schmidt
    vec3 B = cross(N, T);
    TBN = mat3(T, B, N);
    // ...
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="normal_mapping.frag" t={t}>{`vec3 normal = texture(normalMap, TexCoords).rgb * 2.0 - 1.0;   // tangent space
normal = normalize(TBN * normal);                                // world space
// ...then use it exactly like the vertex normal before`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglNMap_warn",
          "Two conventions bite. Normal maps are data: load them as GL_RGBA8, never as sRGB. And the green channel's direction differs between tools — OpenGL-style maps have +y up, DirectX-style have +y down. If bumps look lit from the wrong side, flip green.")}
      </Callout>

      <KeyIdeas t={t} id="oglNMap" items={[
        "A normal map stores a tangent-space normal per texel: n = 2·rgb − 1.",
        "T and B come from solving the triangle's edges against its UV deltas.",
        "TBN = [T B N] turns the sampled normal into world space; re-orthogonalize T first.",
      ]} />
    </Article>
  );
}
