"use client";

// OpenGL track — "Transformations + GLM".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { TransformOrderFigure } from "@/components/lesson/figures/TransformOrderFigure";
import { FrustumFigure } from "@/components/lesson/figures/FrustumFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function TransformationsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch08_intro",
          "Everything you have drawn so far lives at fixed coordinates in NDC space. To move, rotate, and scale objects — and to place a camera anywhere in the scene — you need matrix math. GLM is the header-only C++ library that mirrors GLSL math types and is the standard choice for OpenGL projects."
        )}
      </p>

      <H2>{tx(t, "ch08_glmTitle", "Adding GLM to your project")}</H2>
      <CodeBlock lang="cpp" filename="includes.cpp" t={t}>{`#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>  // for glm::value_ptr

// GLM mirrors GLSL types directly:
glm::vec3 position(0.0f, 0.0f, 0.0f);
glm::mat4 identity(1.0f);  // identity matrix`}</CodeBlock>

      <H2>{tx(t, "ch08_mvpTitle", "The MVP matrices")}</H2>
      <p>
        {tx(t, "ch08_mvpBody",
          "Every vertex goes through three transformations before reaching the screen. Each transformation is a 4×4 matrix, and you multiply them together in reverse order: gl_Position = Projection × View × Model × vertex."
        )}
      </p>

      <LessonTable
        headers={[
          tx(t, "mvpHeader0", "Matrix"),
          tx(t, "mvpHeader1", "Purpose"),
          tx(t, "mvpHeader2", "GLM function"),
        ]}
        rows={[
          ["Model",      tx(t, "mvpModel",      "Places the object in world space (translate / rotate / scale)"),   "glm::translate / rotate / scale"],
          ["View",       tx(t, "mvpView",       "Simulates a camera — transforms world space to camera space"),     "glm::lookAt"],
          ["Projection", tx(t, "mvpProjection", "Applies perspective — things far away appear smaller"),            "glm::perspective"],
        ]}
      />

      <H2>{tx(t, "ch08_modelTitle", "Model matrix — placing objects")}</H2>
      <p>
        {tx(t, "ch08_modelBody",
          "Start with an identity matrix and apply transformations. Order matters: scale first, then rotate, then translate. In code you write them in reverse (TRS applied right-to-left by the GPU)."
        )}
      </p>
      <p>
        {tx(t, "ch08_orderBody",
          "Why does the order matter so much? Because rotation and scaling always happen around the origin (0, 0, 0). Play the figure below: the same two operations, in opposite orders, give two very different results."
        )}
      </p>

      <TransformOrderFigure t={t} />

      <p>
        {tx(t, "ch08_orderCode",
          "Each glm call multiplies the new matrix on the right: model = model × M. So the call you write last is the one that touches the vertex first. To scale, then rotate, then translate, write them in the opposite order:"
        )}
      </p>
      <CodeBlock lang="cpp" filename="model_matrix.cpp" t={t}>{`glm::mat4 model(1.0f);  // start with identity

// Written top to bottom, applied to the vertex bottom to top.

// 3. (runs last) move 1 unit to the right
model = glm::translate(model, glm::vec3(1.0f, 0.0f, 0.0f));
// 2. rotate 45° around Z
model = glm::rotate(model, glm::radians(45.0f), glm::vec3(0.0f, 0.0f, 1.0f));
// 1. (runs first) scale by 0.5
model = glm::scale(model, glm::vec3(0.5f, 0.5f, 0.5f));

// model = T * R * S  →  vertex' = T * (R * (S * vertex))`}</CodeBlock>

      <H2>{tx(t, "ch08_viewTitle", "View matrix — camera")}</H2>
      <p>
        {tx(t, "ch08_viewBody",
          "glm::lookAt takes three vectors: the camera position (eye), the point it is looking at (center), and which direction is up. It returns a view matrix that transforms world space into camera space."
        )}
      </p>
      <CodeBlock lang="cpp" filename="view_matrix.cpp" t={t}>{`glm::mat4 view = glm::lookAt(
    glm::vec3(0.0f, 0.0f,  3.0f),  // camera at Z=3
    glm::vec3(0.0f, 0.0f,  0.0f),  // looking at origin
    glm::vec3(0.0f, 1.0f,  0.0f)   // Y is up
);`}</CodeBlock>

      <H2>{tx(t, "ch08_projTitle", "Projection matrix — perspective")}</H2>
      <p>
        {tx(t, "ch08_projBody",
          "glm::perspective creates a frustum where things farther away appear smaller. The arguments are the vertical field of view in radians, the aspect ratio of your window, and the near/far clip planes."
        )}
      </p>
      <p>
        {tx(t, "ch08_frustumBody",
          "Those four numbers describe a volume called the view frustum: a pyramid with its tip cut off. Anything inside it ends up on screen, anything outside is clipped. Orbit the figure below, then switch to orthographic to see the pyramid become a box."
        )}
      </p>

      <FrustumFigure t={t} />

      <CodeBlock lang="cpp" filename="projection_matrix.cpp" t={t}>{`float aspect = (float)windowWidth / (float)windowHeight;

glm::mat4 projection = glm::perspective(
    glm::radians(45.0f),  // vertical FOV
    aspect,               // width / height
    0.1f,                 // near plane (do not set to 0)
    100.0f                // far plane
);`}</CodeBlock>

      <Equation label={tx(t, "ch08_perspEqLabel", "glm::perspective(fov, aspect, n, f)")}
        where={[
          [String.raw`\amber{t}`, tx(t, "ch08_wT", "tan(fov / 2) — how wide the frustum opens")],
          [String.raw`a`, tx(t, "ch08_wA", "aspect = width / height")],
          [String.raw`n,\\ f`, tx(t, "ch08_wNF", "near and far planes")],
        ]}
        note={tx(t, "ch08_perspEqNote", "The bottom row is the whole trick: it copies −z into w. After the GPU divides by w, x and y shrink with distance — that is perspective — and z lands in [−1, 1].")}>
        {String.raw`P \;=\; \begin{bmatrix}
\dfrac{1}{a\,\amber{t}} & 0 & 0 & 0 \\[6pt]
0 & \dfrac{1}{\amber{t}} & 0 & 0 \\[6pt]
0 & 0 & -\dfrac{f+n}{f-n} & -\dfrac{2fn}{f-n} \\[6pt]
0 & 0 & \purple{-1} & 0
\end{bmatrix}`}
      </Equation>

      <Callout type="warn" t={t}>
        {tx(t, "ch08_nearWarn",
          "Never set the near plane to 0. It causes depth precision issues (z-fighting) because the depth buffer's precision is distributed between near and far — a near plane of 0 gives you no precision at all."
        )}
      </Callout>

      <H2>{tx(t, "ch08_shaderTitle", "Applying MVP in the vertex shader")}</H2>
      <CodeBlock lang="glsl" filename="mvp.vert" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="set_uniforms.cpp" t={t}>{`glUseProgram(shaderProgram);

glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uModel"),      1, GL_FALSE, glm::value_ptr(model));
glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uView"),       1, GL_FALSE, glm::value_ptr(view));
glUniformMatrix4fv(glGetUniformLocation(shaderProgram, "uProjection"), 1, GL_FALSE, glm::value_ptr(projection));`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "ch08_animTip",
          "To animate rotation, multiply the angle by glfwGetTime() every frame: glm::rotate(model, (float)glfwGetTime() * glm::radians(50.0f), glm::vec3(0,1,0)). The model will spin continuously without any extra state."
        )}
      </Callout>

    </article>
  );
}
