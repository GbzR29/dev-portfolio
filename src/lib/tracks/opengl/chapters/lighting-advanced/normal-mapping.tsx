// src/lib/tracks/opengl/chapters/lighting-advanced/normal-mapping.tsx
"use client";

// Normal mapping (explanation pass 2026-09-30): why detail goes into normals
// rather than triangles; the colour encoding with its 8-bit rounding; one
// texel decoded by hand (NormalDecode figure); tangent space and the tangent
// solve worked on a real triangle; the determinant and mirrored UVs
// (handedness); TBN and Gram-Schmidt; world vs tangent-space lighting;
// choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { NormalMapFigure } from "@/components/lesson/figures/advlighting/NormalMapFigure";
import { NormalDecodeFigure } from "@/components/lesson/figures/advlighting/NormalDecodeFigure";

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

      <p>
        {tx(t, "oglNMap_whyBody",
          "The saving is enormous. Modelling the bevels of the bricks on a 2 m wall with millimetre detail would take millions of triangles; the normal map version is two triangles and a 1024 × 1024 texture (4 MB uncompressed, 1 MB compressed). The illusion has limits, because the geometry is still flat: the silhouette stays a straight line, the bumps cast no shadows on each other, and at a grazing angle the wall looks painted. For those, later techniques move the texture lookup (parallax mapping) or the vertices themselves (tessellation and displacement).")}
      </p>

      <H2>{tx(t, "oglNMap_encodeTitle", "Normals stored as colours")}</H2>
      <p>
        {tx(t, "oglNMap_encodeBody",
          "A unit normal has components in [−1, 1]; a texture stores [0, 1]. The mapping is a scale and a shift. Most texels point straight out of the surface, (0, 0, 1), which encodes to (0.5, 0.5, 1) — the reason normal maps look mostly lavender blue.")}
      </p>
      <Equation label={tx(t, "oglNMap_encLabel", "Encoding and decoding")}
        where={[
          [r`\mathbf{n}`, tx(t, "oglNMap_wN", "the tangent-space normal, each component in [−1, 1]")],
          [r`\text{rgb}`, tx(t, "oglNMap_wRgb", "the texel as the shader samples it, each channel the byte divided by 255")],
          [r`\tfrac12\,\mathbf{n} + \tfrac12`, tx(t, "oglNMap_wMap", "halve the range [−1, 1] to [−0.5, 0.5], then shift it up to [0, 1]; decoding undoes both")],
        ]}>
        {r`\text{rgb} = \tfrac12\,\mathbf{n} + \tfrac12 \qquad\Longleftrightarrow\qquad \mathbf{n} = 2\,\text{rgb} - 1`}
      </Equation>
      <p>
        {tx(t, "oglNMap_roundBody",
          "Eight bits cannot store 0.5 exactly: byte 127 decodes to −0.004 and byte 128 to +0.004. Rounding, texture filtering (which averages neighbouring normals into a shorter vector) and mipmapping all change the length slightly, so the shader always normalises the decoded vector before using it.")}
      </p>
      <NormalDecodeFigure t={t} />

      <H3>{tx(t, "oglNMap_workedTitle", "Worked example: decoding one texel")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglNMap_w1", "The texel is (166, 128, 249). Divided by 255: (0.651, 0.502, 0.976).")}</li>
        <li>{tx(t, "oglNMap_w2", "×2 − 1: n = (0.302, 0.004, 0.953), length 0.9996, normalised to almost the same. It leans 17.6° toward +u, the texture's right.")}</li>
        <li>{tx(t, "oglNMap_w3", "The texel sits on a floor whose u runs along world +x and v along world −z, so T = (1, 0, 0), B = (0, 0, −1), N = (0, 1, 0). World normal = 0.302·T + 0.004·B + 0.953·N = (0.302, 0.953, −0.004).")}</li>
        <li>{tx(t, "oglNMap_w4", "A light 45° above the floor on the +x side, L = (0.707, 0.707, 0): the flat floor has N·L = 0.707, the mapped normal 0.302 · 0.707 + 0.953 · 0.707 = 0.887. Move the light to the −x side and the mapped value drops to 0.460. One side of the bump brighter, the other darker: that is what makes it look raised.")}</li>
      </ol>

      <H2>{tx(t, "oglNMap_tangentTitle", "Tangent space")}</H2>
      <p>
        {tx(t, "oglNMap_tangentBody",
          "The normals in the map are relative to the surface: z means \"out of the surface\", x points along the texture's u direction and y along v. To light with them we need, at each vertex, the world directions that u and v run in — the tangent T and bitangent B — alongside the normal N.")}
      </p>
      <p>
        {tx(t, "oglNMap_whyTangent",
          "Why not store world-space normals directly? Some engines do, for static, unique objects. But a tangent-space map is independent of where the surface is: the same brick map works on the floor, on every wall, on a rotating door and on a deforming character, and it can be tiled and mirrored. It also needs only two channels, since z is always positive and can be rebuilt as √(1 − x² − y²).")}
      </p>
      <p>
        {tx(t, "oglNMap_deriveBody",
          "Take a triangle with corners P0, P1, P2 and texture coordinates (u, v). Its two edges are some combination of T and B, weighted by how much u and v change along them:")}
      </p>
      <Equation label={tx(t, "oglNMap_deriveLabel", "Solving for the tangent and bitangent")}
        where={[
          [r`E_1, E_2`, tx(t, "oglNMap_wE", "triangle edges P1 − P0 and P2 − P0")],
          [r`\Delta u_i, \Delta v_i`, tx(t, "oglNMap_wUV", "the change in texture coordinates along each edge")],
          [r`\red{T}, \green{B}`, tx(t, "oglNMap_wTB", "how far you move in world space per unit of u, and per unit of v")],
          [r`\Delta u_1 \Delta v_2 - \Delta u_2 \Delta v_1`, tx(t, "oglNMap_wDet", "the determinant of the UV matrix: twice the signed area of the triangle in texture space")],
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
      <p>
        {tx(t, "oglNMap_solveWhy",
          "It is two equations with two unknown vectors, the same as solving a 2 × 2 linear system with numbers, done once for x, once for y and once for z. The 2 × 2 inverse swaps the diagonal, negates the other two entries and divides by the determinant.")}
      </p>
      <CodeBlock lang="cpp" filename="tangents.cpp" t={t}>{`glm::vec3 e1 = p1 - p0, e2 = p2 - p0;
glm::vec2 d1 = uv1 - uv0, d2 = uv2 - uv0;
float f = 1.0f / (d1.x * d2.y - d2.x * d1.y);

glm::vec3 tangent   = f * (d2.y * e1 - d1.y * e2);
glm::vec3 bitangent = f * (-d2.x * e1 + d1.x * e2);
// Assimp computes these for you with aiProcess_CalcTangentSpace`}</CodeBlock>
      <H3>{tx(t, "oglNMap_triTitle", "Worked example: the floor's tangent")}</H3>
      <p>
        {tx(t, "oglNMap_triBody",
          "The floor triangle P0 = (0, 0, 0), P1 = (2, 0, 0), P2 = (0, 0, −2) with UVs (0, 0), (1, 0), (0, 1). Then E1 = (2, 0, 0), E2 = (0, 0, −2), Δ1 = (1, 0), Δ2 = (0, 1), and the determinant is 1 · 1 − 0 · 0 = 1. T = 1 · (1 · E1 − 0 · E2) = (2, 0, 0) and B = 1 · (−0 · E1 + 1 · E2) = (0, 0, −2). Normalised, these are the T = +x and B = −z used above. The length 2 says the texture is stretched over 2 world units per repeat; only the direction matters for lighting.")}
      </p>
      <p>
        {tx(t, "oglNMap_detBody",
          "The determinant tells you two more things. If it is 0, the UVs of the triangle are degenerate (all on a line), and there is no tangent to find: guard the division. If it is negative, the texture is mirrored on this triangle, as artists often do to reuse one half of a map on both sides of a face. Then B points the other way from cross(N, T). Tools store that sign as a fourth tangent component, w = ±1, and the shader rebuilds B = cross(N, T) · w.")}
      </p>

      <H2>{tx(t, "oglNMap_tbnTitle", "The TBN matrix")}</H2>
      <p>
        {tx(t, "oglNMap_tbnBody",
          "Put the three world-space axes in the columns of a matrix and it converts any tangent-space vector into world space — exactly what the sampled normal needs. After interpolation T may no longer be perpendicular to N, so re-orthogonalize it with one Gram-Schmidt step and rebuild B with a cross product.")}
      </p>
      <Equation label={tx(t, "oglNMap_tbnLabel", "From the map to world space")}
        where={[
          [r`\red{T}, \green{B}, \blue{N}`, tx(t, "oglNMap_wCols", "the world-space tangent, bitangent and normal, as the three columns")],
          [r`TBN\,\mathbf{n}`, tx(t, "oglNMap_wMul", "x·T + y·B + z·N: each tangent-space component scales its world axis")],
          [r`(\red{T}\cdot\blue{N})\,\blue{N}`, tx(t, "oglNMap_wProj", "the part of T that points along N; subtracting it leaves only the part perpendicular to N")],
        ]}>
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
      <LessonTable
        headers={[tx(t, "oglNMap_tChoice", "Choice"), tx(t, "oglNMap_tReason", "Reason")]}
        rows={[
          [tx(t, "oglNMap_c1", "T goes through normalMatrix too"), tx(t, "oglNMap_c1b", "the tangent is a direction on the surface, so it must follow the model's rotation and scale just like the normal; with the model matrix alone it would drift off the surface under non-uniform scale.")],
          [tx(t, "oglNMap_c2", "B rebuilt with cross(N, T)"), tx(t, "oglNMap_c2b", "saves a vertex attribute and guarantees an orthonormal basis; multiply by the handedness w when the mesh has mirrored UVs.")],
          [tx(t, "oglNMap_c3", "Gram-Schmidt in the vertex shader"), tx(t, "oglNMap_c3b", "the tangents averaged per vertex from several triangles are rarely exactly perpendicular to the averaged normal.")],
          [tx(t, "oglNMap_c4", "normalize() after TBN · normal"), tx(t, "oglNMap_c4b", "interpolated T, B and N are no longer unit length, and the sampled normal was already slightly off.")],
          [tx(t, "oglNMap_c5", "World space rather than tangent space"), tx(t, "oglNMap_c5b", "the alternative sends L and V into tangent space in the vertex shader (multiply by the transpose of TBN, which is its inverse because the matrix is orthonormal), saving the per-fragment matrix product. Simpler to read in world space; cheaper with many fragments and one light in tangent space.")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "oglNMap_warn",
          "Two conventions bite. Normal maps are data: load them as GL_RGBA8, never as sRGB. And the green channel's direction differs between tools — OpenGL-style maps have +y up, DirectX-style have +y down. If bumps look lit from the wrong side, flip green.")}
      </Callout>

      <H2>{tx(t, "oglNMap_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglNMap_tMistake", "Mistake"), tx(t, "oglNMap_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglNMap_e1", "Normal map loaded as sRGB"), tx(t, "oglNMap_e1b", "the decode curve pulls every channel toward 0, so all normals lean toward −x and −y and the whole surface looks lit from one corner. Use a linear format.")],
          [tx(t, "oglNMap_e2", "DirectX map in an OpenGL renderer"), tx(t, "oglNMap_e2b", "bumps look like dents in one direction only (lit from above, shaded below, the wrong way round). Flip green: n.y = −n.y, or invert the channel on import.")],
          [tx(t, "oglNMap_e3", "Ignoring mirrored UVs"), tx(t, "oglNMap_e3b", "on the mirrored half the lighting is inverted along v. Store the handedness in tangent.w and multiply B by it.")],
          [tx(t, "oglNMap_e4", "Forgetting to decode (×2 − 1)"), tx(t, "oglNMap_e4b", "the \"normal\" is (0.5, 0.5, 1), always leaning diagonally: everything looks lit from one side. Decode before the TBN multiply.")],
          [tx(t, "oglNMap_e5", "Tangents missing from the mesh"), tx(t, "oglNMap_e5b", "aTangent reads as (0, 0, 0), T becomes NaN after normalize() and the surface goes black. Ask the loader for tangents (aiProcess_CalcTangentSpace) or compute them.")],
          [tx(t, "oglNMap_e6", "TBN built from the model matrix under non-uniform scale"), tx(t, "oglNMap_e6b", "normals tilt on stretched objects. Use normalMatrix for both N and T.")],
        ]}
      />

      <KeyIdeas t={t} id="oglNMap" items={[
        "A normal map stores a tangent-space normal per texel: n = 2·rgb − 1.",
        "T and B come from solving the triangle's edges against its UV deltas.",
        "TBN = [T B N] turns the sampled normal into world space; re-orthogonalize T first.",
        "Always normalise the decoded normal: 8-bit rounding and filtering shorten it.",
        "A negative UV determinant means mirrored texture: keep the sign in tangent.w.",
        "Normal maps are data (linear, never sRGB), and the green axis convention must match.",
      ]} />
    </Article>
  );
}
