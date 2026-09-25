"use client";

// OpenGL track — "Linear Algebra for 3D".

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { InteractiveBasis2D } from "@/components/lesson/InteractiveBasis2D";
import { HomogeneousFigure } from "@/components/lesson/figures/HomogeneousFigure";
import { VertexJourneyFigure } from "@/components/lesson/figures/VertexJourneyFigure";
import { VectorOpsFigure } from "@/components/lesson/figures/VectorOpsFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function LinearAlgebraContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch08la_intro",
          "3D graphics code is just linear algebra on a GPU. Every transformation — moving an object, rotating a camera, projecting to a 2D screen — is a matrix multiplication. This chapter bridges the gap between the math you see on paper and the C++/GLSL code you write."
        )}
      </p>

      {/* ── VECTORS ─────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_vectorsTitle", "Vectors")}</H2>
      <p>
        {tx(t, "ch08la_vectorsBody",
          "A vector is a quantity with direction and magnitude. In 3D graphics, vec3 can represent a position in world space, a direction (like a surface normal), a color (RGB), or UV coordinates — context determines meaning."
        )}
      </p>

      <Equation label={tx(t, "ch08la_addLabel", "Addition")} glsl="vec3 r = a + b;" glm="glm::vec3 r = a + b;"
        notes={[tx(t, "ch08la_addNote", "Use: displacement, moving a point by an offset, combining forces")]}>
        {String.raw`\blue{\mathbf{a}} + \amber{\mathbf{b}} \;=\; \begin{pmatrix} \blue{a_x} + \amber{b_x} \\ \blue{a_y} + \amber{b_y} \\ \blue{a_z} + \amber{b_z} \end{pmatrix}`}
      </Equation>

      <Equation label={tx(t, "ch08la_dotLabel", "Dot product")} glsl="float d = dot(a, b);" glm="float d = glm::dot(a, b);"
        notes={[
          tx(t, "ch08la_dotNote1", "→ result = 1: vectors parallel (same direction)"),
          tx(t, "ch08la_dotNote2", "→ result = 0: vectors perpendicular (90°)"),
          tx(t, "ch08la_dotNote3", "→ result < 0: vectors opposing (> 90°)"),
          tx(t, "ch08la_dotUse", "Use: Phong diffuse lighting — dot(normal, lightDir) gives brightness"),
        ]}>
        {String.raw`\blue{\mathbf{a}} \cdot \amber{\mathbf{b}} \;=\; \blue{a_x}\amber{b_x} + \blue{a_y}\amber{b_y} + \blue{a_z}\amber{b_z} \;=\; \lVert\blue{\mathbf{a}}\rVert\,\lVert\amber{\mathbf{b}}\rVert\cos\theta`}
      </Equation>

      <Equation label={tx(t, "ch08la_lenLabel", "Length / normalize")}
        glsl="float l = length(a);  vec3 u = normalize(a);" glm="float l = glm::length(a);  glm::vec3 u = glm::normalize(a);"
        notes={[tx(t, "ch08la_lenNote", "Unit vectors are essential for lighting — dot(normalize(normal), normalize(lightDir))")]}>
        {String.raw`\lVert\blue{\mathbf{a}}\rVert = \sqrt{a_x^2 + a_y^2 + a_z^2} \qquad \hat{\mathbf{a}} = \frac{\blue{\mathbf{a}}}{\lVert\blue{\mathbf{a}}\rVert} \;\;\Rightarrow\;\; \lVert\hat{\mathbf{a}}\rVert = 1`}
      </Equation>

      <Equation label={tx(t, "ch08la_crossLabel", "Cross product")} glsl="vec3 n = cross(a, b);" glm="glm::vec3 n = glm::cross(a, b);"
        notes={[
          tx(t, "ch08la_crossNote", "Result is perpendicular to both a and b (right-hand rule). Use: computing surface normals from two edge vectors"),
          tx(t, "ch08la_crossLen", "Its length is |a| |b| sin θ — the area of the parallelogram the two vectors span."),
        ]}>
        {String.raw`\blue{\mathbf{a}} \times \amber{\mathbf{b}} \;=\; \begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ \blue{a_x} & \blue{a_y} & \blue{a_z} \\ \amber{b_x} & \amber{b_y} & \amber{b_z} \end{vmatrix} \;=\; \begin{pmatrix} \blue{a_y}\amber{b_z} - \blue{a_z}\amber{b_y} \\ \blue{a_z}\amber{b_x} - \blue{a_x}\amber{b_z} \\ \blue{a_x}\amber{b_y} - \blue{a_y}\amber{b_x} \end{pmatrix}`}
      </Equation>

      <CodeBlock lang="cpp" filename="normal_from_edges.cpp" t={t}>{`// Compute face normal from two edges — cross product in practice
glm::vec3 edge1 = B - A;           // vector along one edge
glm::vec3 edge2 = C - A;           // vector along adjacent edge
glm::vec3 normal = glm::normalize(glm::cross(edge1, edge2));
// normal is now perpendicular to the triangle face`}</CodeBlock>

      <p>
        {tx(t, "ch08la_vecFig",
          "The two products you will use constantly are easier to trust once you have seen them. The dot product is a shadow; the cross product is an area standing up."
        )}
      </p>

      <VectorOpsFigure t={t} />

      {/* ── MATRIX INTUITION ────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_basisTitle", "What a matrix actually does")}</H2>
      <p>
        {tx(t, "ch08la_basisBody",
          "Before the 4×4 formulas, one idea makes all of them readable: a matrix only records where the basis vectors land. In 2D, î = (1, 0) and ĵ = (0, 1). The first column of the matrix is the new î, the second column is the new ĵ. Every other point is built from those two — the vector (x, y) is x steps of î plus y steps of ĵ, so M · (x, y) = x·î + y·ĵ."
        )}
      </p>
      <p>
        {tx(t, "ch08la_basisTry",
          "Drag the red î and green ĵ below and watch the whole grid follow. The numbers in each matrix column are just the coordinates of the arrow of the same colour."
        )}
      </p>

      <InteractiveBasis2D />

      <Callout type="tip" t={t}>
        {tx(t, "ch08la_basisTip",
          "The shaded square is the original 1×1 square after the transform. Its area is the determinant: det = 2 means areas doubled, det < 0 means space was mirrored (the F reads backwards), and det = 0 means everything was squashed onto a line — information was lost, which is why that matrix has no inverse. 3D works the same way, with a third column for k̂."
        )}
      </Callout>

      {/* ── MATRICES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_matricesTitle", "4×4 Matrices")}</H2>
      <p>
        {tx(t, "ch08la_matricesBody",
          "A matrix transforms a vector: multiply M × v and you get a new vector. The 4×4 size (instead of 3×3) is deliberate — the extra row and column make translation possible in matrix form (the w component trick)."
        )}
      </p>

      <Equation label={tx(t, "ch08la_basicMatsLabel", "Identity, translation and scale")}
        glm="glm::translate(glm::mat4(1.0f), glm::vec3(tx, ty, tz));   glm::scale(glm::mat4(1.0f), glm::vec3(sx, sy, sz));">
        {String.raw`\underset{\text{Identity}}{\begin{bmatrix} 1&\muted{0}&\muted{0}&\muted{0} \\ \muted{0}&1&\muted{0}&\muted{0} \\ \muted{0}&\muted{0}&1&\muted{0} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}
\qquad
\underset{\text{Translate}}{\begin{bmatrix} 1&\muted{0}&\muted{0}&\amber{t_x} \\ \muted{0}&1&\muted{0}&\amber{t_y} \\ \muted{0}&\muted{0}&1&\amber{t_z} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}
\qquad
\underset{\text{Scale}}{\begin{bmatrix} \green{s_x}&\muted{0}&\muted{0}&\muted{0} \\ \muted{0}&\green{s_y}&\muted{0}&\muted{0} \\ \muted{0}&\muted{0}&\green{s_z}&\muted{0} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}`}
      </Equation>

      <Equation label={tx(t, "ch08la_rotMatsLabel", "Rotations by θ around each axis")}
        glm="glm::rotate(glm::mat4(1.0f), glm::radians(angle), glm::vec3(0, 1, 0));   // axis as the last argument">
        {String.raw`\underset{R_x(\theta)}{\begin{bmatrix} 1&\muted{0}&\muted{0}&\muted{0} \\ \muted{0}&\purple{\cos\theta}&\purple{-\sin\theta}&\muted{0} \\ \muted{0}&\purple{\sin\theta}&\purple{\cos\theta}&\muted{0} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}
\quad
\underset{R_y(\theta)}{\begin{bmatrix} \purple{\cos\theta}&\muted{0}&\purple{\sin\theta}&\muted{0} \\ \muted{0}&1&\muted{0}&\muted{0} \\ \purple{-\sin\theta}&\muted{0}&\purple{\cos\theta}&\muted{0} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}
\quad
\underset{R_z(\theta)}{\begin{bmatrix} \purple{\cos\theta}&\purple{-\sin\theta}&\muted{0}&\muted{0} \\ \purple{\sin\theta}&\purple{\cos\theta}&\muted{0}&\muted{0} \\ \muted{0}&\muted{0}&1&\muted{0} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}}`}
      </Equation>

      <p>
        {tx(t, "ch08la_matVecIntro",
          "Multiplying a translation matrix by a position shows why the fourth row and column exist: the w = 1 of the vector picks up the last column and adds it to x, y and z."
        )}
      </p>

      <Equation label={tx(t, "ch08la_matVecLabel", "A translation, worked out")}>
        {String.raw`\begin{bmatrix} 1&\muted{0}&\muted{0}&\amber{t_x} \\ \muted{0}&1&\muted{0}&\amber{t_y} \\ \muted{0}&\muted{0}&1&\amber{t_z} \\ \muted{0}&\muted{0}&\muted{0}&1 \end{bmatrix}
\begin{pmatrix} x \\ y \\ z \\ \purple{1} \end{pmatrix}
=
\begin{pmatrix} x + \amber{t_x}\cdot\purple{1} \\ y + \amber{t_y}\cdot\purple{1} \\ z + \amber{t_z}\cdot\purple{1} \\ \purple{1} \end{pmatrix}`}
      </Equation>

      <p className="text-sm">
        {tx(t, "ch08la_matrixNote",
          "These matrices are column-major in OpenGL/GLM. GLM constructs them for you — glm::translate, glm::rotate, glm::scale all return a mat4 you can multiply directly."
        )}
      </p>

      <CodeBlock lang="cpp" filename="matrix_ops.cpp" t={t}>{`// GLM generates these matrices for you — no manual construction needed
glm::mat4 T = glm::translate(glm::mat4(1.0f), glm::vec3(2.0f, 0.0f, 0.0f));
glm::mat4 S = glm::scale(glm::mat4(1.0f),     glm::vec3(0.5f));
glm::mat4 R = glm::rotate(glm::mat4(1.0f),    glm::radians(45.0f), glm::vec3(0,1,0));

// glm::mat4(1.0f) is the identity — the starting point for all transforms
// glm::radians converts degrees to radians (all trig in OpenGL uses radians)`}</CodeBlock>

      {/* ── HOMOGENEOUS ─────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_homogTitle", "Homogeneous Coordinates — why vec4?")}</H2>
      <p>
        {tx(t, "ch08la_homogBody",
          "You cannot represent translation with a 3×3 matrix. The trick: add a 4th component w. A 4×4 matrix multiplied by a vec4(position, 1.0) correctly applies translation. A vec4(direction, 0.0) is immune to translation — directions should not move when the world does."
        )}
      </p>

      <Equation label={tx(t, "ch08la_wLabel", "The w trick")}
        where={[
          [String.raw`\purple{w = 1}`, tx(t, "ch08la_wPos", "position — translation applies")],
          [String.raw`\red{w = 0}`, tx(t, "ch08la_wDir", "direction / normal — translation does NOT apply")],
        ]}>
        {String.raw`T\begin{pmatrix} p_x\\p_y\\p_z\\ \purple{1} \end{pmatrix} = \begin{pmatrix} p_x+\amber{t_x}\\p_y+\amber{t_y}\\p_z+\amber{t_z}\\ \purple{1} \end{pmatrix}
\qquad
T\begin{pmatrix} d_x\\d_y\\d_z\\ \red{0} \end{pmatrix} = \begin{pmatrix} d_x\\d_y\\d_z\\ \red{0} \end{pmatrix}`}
      </Equation>

      <p>
        {tx(t, "ch08la_homogFig",
          "Why does adding a component make translation possible? It is easiest to see one dimension down: 2D points with a third coordinate w. Step through the figure below."
        )}
      </p>

      <HomogeneousFigure t={t} />

      <CodeBlock lang="glsl" filename="homogeneous.glsl" t={t}>{`// In the vertex shader — all positions are vec4
layout (location = 0) in vec3 aPos;  // 3-component input
// ...
gl_Position = uMVP * vec4(aPos, 1.0);  // ← w=1 makes translation work
//                   ^^^^^^^^^^^^^^^^^
//                   vec3 → vec4 expansion, w=1.0

// For normals (directions):
vec3 transformedNormal = mat3(uModel) * aNormal;
// mat3() strips the 4th row/column — applies rotation/scale but NOT translation`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch08la_wNote",
          "After the vertex shader, the GPU automatically divides x, y, z by w (perspective divide). For regular geometry w=1 so nothing changes. For perspective projection, the projection matrix sets w to the original z value — the divide then makes far objects appear smaller. This is how perspective works mathematically."
        )}
      </Callout>

      {/* ── MVP ─────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08la_mvpTitle", "From local space to the screen — MVP step by step")}</H2>
      <p>
        {tx(t, "ch08la_mvpBody",
          "Every vertex in your model starts in local (object) space. To get it to the screen it passes through three matrix multiplications. Here is exactly what each step does, with the numbers:"
        )}
      </p>

      <div className="my-6 space-y-4">
        {[
          {
            step: "1", label: tx(t, "ch08la_step1Title", "Model matrix (M)"),
            from: tx(t, "ch08la_step1From", "Local space"), to: tx(t, "ch08la_step1To", "World space"),
            desc: tx(t, "ch08la_step1Desc", "Places the object in the world. Applies your translate/rotate/scale transforms."),
            code: "glm::mat4 M = glm::translate(I, pos) * glm::rotate(I, angle, axis) * glm::scale(I, size);",
            color: "blue",
          },
          {
            step: "2", label: tx(t, "ch08la_step2Title", "View matrix (V)"),
            from: tx(t, "ch08la_step2From", "World space"), to: tx(t, "ch08la_step2To", "Camera space"),
            desc: tx(t, "ch08la_step2Desc", "Simulates a camera. Moves and rotates the entire world so the camera is at the origin looking down -Z."),
            code: "glm::mat4 V = glm::lookAt(cameraPos, cameraTarget, upVector);",
            color: "emerald",
          },
          {
            step: "3", label: tx(t, "ch08la_step3Title", "Projection matrix (P)"),
            from: tx(t, "ch08la_step3From", "Camera space"), to: tx(t, "ch08la_step3To", "Clip space → NDC"),
            desc: tx(t, "ch08la_step3Desc", "Creates perspective (or orthographic). Sets w = original z so the GPU divide makes far objects smaller."),
            code: "glm::mat4 P = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);",
            color: "purple",
          },
        ].map(({ step, label, from, to, desc, code, color }) => (
          <div key={step} className={`p-4 rounded-xl border ${
            color === "blue"   ? "border-blue-500/20 bg-blue-500/5"   :
            color === "emerald"? "border-emerald-500/20 bg-emerald-500/5" :
                                 "border-purple-500/20 bg-purple-500/5"
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                color === "blue"   ? "bg-blue-500/20 text-blue-400"   :
                color === "emerald"? "bg-emerald-500/20 text-emerald-400" :
                                     "bg-purple-500/20 text-purple-400"
              }`}>{step}</span>
              <div>
                <div className="font-semibold text-[var(--text-main)] text-sm">{label}</div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                  {from} <span className="text-[var(--text-muted)]">→</span> {to}
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-2 ml-9">{desc}</p>
            <div className="ml-9 font-mono text-[10px] bg-[var(--code-bg)] border border-[var(--code-border)] rounded-lg px-3 py-2 text-[var(--code-text)] overflow-x-auto">
              {code}
            </div>
          </div>
        ))}
      </div>

      <p>
        {tx(t, "ch08la_journeyIntro",
          "Now watch all three happen to one vertex. Each step moves the whole scene into the next space, and the table tracks the same vertex's coordinates along the way."
        )}
      </p>

      <VertexJourneyFigure t={t} />

      <Equation label={tx(t, "ch08la_fullMVP", "Complete MVP formula")}
        glsl="gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);"
        notes={[tx(t, "ch08la_divideNote", "The divide by w happens automatically after the vertex shader — the GPU does it, you never write it.")]}>
        {String.raw`\begin{aligned}
\mathbf{v}_{\text{clip}} &= \purple{P}\;\green{V}\;\blue{M}\;\mathbf{v}_{\text{local}} \\[4pt]
\mathbf{v}_{\text{ndc}} &= \frac{\mathbf{v}_{\text{clip}}.xyz}{\mathbf{v}_{\text{clip}}.w}
\end{aligned}`}
      </Equation>

      <CodeBlock lang="glsl" filename="mvp_vertex.glsl" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

uniform mat4 uModel;       // M: local → world
uniform mat4 uView;        // V: world → camera
uniform mat4 uProjection;  // P: camera → clip

void main() {
    // Right-to-left: apply M first, then V, then P
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    //            ─────────── order matters! ───────────
    //            Matrix multiplication is NOT commutative: A×B ≠ B×A
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "ch08la_orderWarn",
          "Matrix multiplication order is RIGHT-TO-LEFT in both GLSL and GLM. P × V × M × v means: apply M first (local→world), then V (world→camera), then P (camera→clip). Writing them left-to-right would produce wrong results with no error or warning."
        )}
      </Callout>

    </article>
  );
}
