"use client";

// OpenGL track — "Transformations + GLM". Code-along continuation of the
// textured square from "Textures": what the chapter adds to main.cpp; the GLM
// includes; step 1, one uTransform matrix (glUniformMatrix4fv argument by
// argument, call order vs. the order the vertex sees, worked corner, the
// order figure, spinning with glfwGetTime); the coordinate spaces and MVP
// (journey figure, why perspective needs w, worked numbers); the view matrix
// as "moving the world"; perspective (frustum figure, matrix, near plane) and
// orthographic projection; step 2, three matrices and the aspect ratio; step
// 3, a textured cube with the depth test; the code-along checkpoint; mistakes.
// The numbers in the worked examples were checked with GLM 1.0.1.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TransformOrderFigure } from "@/components/lesson/figures/TransformOrderFigure";
import { FrustumFigure } from "@/components/lesson/figures/FrustumFigure";
import { VertexJourneyFigure } from "@/components/lesson/figures/VertexJourneyFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function TransformationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTr_intro",
          "Until now, every vertex you wrote went straight to the screen. Its x and y were already NDC coordinates, from −1 to 1. This chapter puts the matrices from the previous two chapters between the vertex and the screen. First the textured square moves and spins. Then it is seen in perspective, and then it becomes a spinning 3D cube.")}
      </Lead>

      <Goals t={t} id="oglTr" items={[
        "Move a shape with a matrix in the vertex shader.",
        "Follow a vertex through model, view and projection space.",
        "Choose between perspective and orthographic projection.",
      ]} />

      {/* ── WHAT CHANGES ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "oglTr_alongBody",
          "It continues the main.cpp from the end of the Textures chapter, in three steps. Run the program after each one; each step says what you should see. The checkpoint at the end shows the whole file.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglTr_along1", "Step 1: one matrix uniform in the vertex shader, rebuilt every frame, so the square shrinks, moves and spins.")}</li>
        <li>{tx(t, "oglTr_along2", "Step 2: three matrices (model, view and projection), so the square is seen through a camera, in perspective.")}</li>
        <li>{tx(t, "oglTr_along3", "Step 3: the square becomes a cube with the image on all six faces, and the depth test is turned on.")}</li>
      </ol>

      {/* ── GLM ─────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_glmTitle", "GLM in your project")}</H2>
      <p>
        {tx(t, "oglTr_glm1",
          "GLM is already in your project. The Window & Context chapter added it to CMakeLists.txt (glm::glm in target_link_libraries), and the math lab used it in the last two chapters. main.cpp only needs three includes, at the top, under the others:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (top of the file)" t={t}>{`#include <glm/glm.hpp>                    // glm::vec3, glm::vec4, glm::mat4
#include <glm/gtc/matrix_transform.hpp>   // glm::translate, rotate, scale, perspective, lookAt
#include <glm/gtc/type_ptr.hpp>           // glm::value_ptr`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglTr_tLine", "Line"), tx(t, "oglTr_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"glm/glm.hpp"}</IC>, tx(t, "oglTr_g1", "the types: vectors and matrices with the same names as in GLSL (vec3, mat4…).")],
          [<IC key="2">{"glm/gtc/matrix_transform.hpp"}</IC>, tx(t, "oglTr_g2", "the functions that build matrices: the three from the Matrices chapter, plus perspective, ortho and lookAt, new in this one.")],
          [<IC key="3">{"glm/gtc/type_ptr.hpp"}</IC>, tx(t, "oglTr_g3", "glm::value_ptr, which gives OpenGL a pointer to the 16 floats inside a glm::mat4.")],
        ]}
      />

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_s1Title", "Step 1: one matrix in the vertex shader")}</H2>
      <p>
        {tx(t, "oglTr_s1a",
          "The vertex shader gets a new uniform: a mat4 called uTransform. It multiplies every position by it. This is the line from the Matrices chapter, now in the real program:")}
      </p>
      <CodeBlock lang="glsl" filename="vertex shader (in main.cpp)" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;
out vec2 TexCoord;
uniform mat4 uTransform;                          // NEW

void main() {
    gl_Position = uTransform * vec4(aPos, 1.0);   // NEW: was vec4(aPos, 1.0)
    TexCoord = aTexCoord;
}`}</CodeBlock>
      <p>
        {tx(t, "oglTr_s1b",
          "vec4(aPos, 1.0) makes the position a point with w = 1, so the 4×4 matrix can move it. The matrix is the same for every vertex of the draw. That is what a uniform is for. The texture coordinate is not touched: the image stays glued to the square wherever the square goes.")}
      </p>
      <p>
        {tx(t, "oglTr_s1c",
          "Next, the C++ side. Look up where the uniform lives once, in step 4, right after the program is made:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4, after makeProgram)" t={t}>{`GLint transformLoc = glGetUniformLocation(shaderProgram, "uTransform");`}</CodeBlock>
      <p>
        {tx(t, "oglTr_s1d",
          "A location is a small number OpenGL gives each uniform. It does not change while the program exists, so there is no need to ask for it every frame. If the name is misspelled, or the shader never uses the uniform, the location is −1. Setting location −1 does nothing and reports no error, so a typo here shows up only as \"nothing moves\".")}
      </p>
      <p>
        {tx(t, "oglTr_s1e",
          "Then, in the render loop, build the matrix and send it, between glUseProgram and the draw call:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, in the render loop)" t={t}>{`float time = (float)glfwGetTime();               // seconds since glfwInit

glm::mat4 transform(1.0f);                       // start from the identity
transform = glm::translate(transform, glm::vec3(0.5f, -0.5f, 0.0f));   // 3. move
transform = glm::rotate(transform, time, glm::vec3(0.0f, 0.0f, 1.0f)); // 2. spin around z
transform = glm::scale(transform, glm::vec3(0.5f));                     // 1. halve the size

glUseProgram(shaderProgram);
glUniformMatrix4fv(transformLoc, 1, GL_FALSE, glm::value_ptr(transform));
glBindVertexArray(vao);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, (void*)0);`}</CodeBlock>
      <p>{tx(t, "oglTr_uniIntro", "glUniformMatrix4fv sends one or more 4×4 matrices of floats. Its four arguments:")}</p>
      <LessonTable
        headers={[tx(t, "oglTr_tArg", "Argument"), tx(t, "oglTr_tMeaning", "Meaning")]}
        rows={[
          ["transformLoc", tx(t, "oglTr_u1", "which uniform to set, in the program currently in use. That is why glUseProgram comes first.")],
          ["1", tx(t, "oglTr_u2", "how many matrices. More than 1 is for uniform arrays such as mat4 uBones[64].")],
          ["GL_FALSE", tx(t, "oglTr_u3", "\"do not transpose\" (do not swap rows and columns). GLM already stores a matrix column by column, the order OpenGL expects, so the 16 floats can go as they are.")],
          ["glm::value_ptr(transform)", tx(t, "oglTr_u4", "a pointer to the first of the 16 floats. OpenGL copies them during the call.")],
        ]}
      />

      <H3>{tx(t, "oglTr_orderTitle", "Why the calls look backwards")}</H3>
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
      <p>
        {tx(t, "oglTr_orderMath",
          "In the code above, that gives transform = T × R × S. The vertex meets S first, then R, then T: the M = T R S order from the Matrices chapter. Follow the top-right corner of the square, (0.5, 0.5, 0), at the moment the angle is 90° (π/2 radians):")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTr_tStep", "Step"), tx(t, "oglTr_tCorner", "The corner"), tx(t, "oglTr_tWhy", "Why")]}
        rows={[
          [tx(t, "oglTr_c0", "start"), "(0.5, 0.5, 0)", tx(t, "oglTr_c0b", "the corner as written in vertices[]")],
          [tx(t, "oglTr_c1", "1. S: scale 0.5"), "(0.25, 0.25, 0)", tx(t, "oglTr_c1b", "each part halved")],
          [tx(t, "oglTr_c2", "2. R: turn 90° around z"), "(−0.25, 0.25, 0)", tx(t, "oglTr_c2b", "(x, y) becomes (−y, x) for a quarter turn")],
          [tx(t, "oglTr_c3", "3. T: move by (0.5, −0.5, 0)"), "(0.25, −0.25, 0)", tx(t, "oglTr_c3b", "the offset is added")],
        ]}
      />
      <p>
        {tx(t, "oglTr_orderSwap",
          "Now swap the first two calls, so rotate is written before translate. The corner is scaled to (0.25, 0.25), then moved to (0.75, −0.25), and only then turned around the origin, to (0.25, 0.75). The square no longer spins in place: it circles around the centre of the window, like the second half of the figure.")}
      </p>
      <p>
        {tx(t, "oglTr_time",
          "glfwGetTime() returns the seconds since glfwInit as a double, so (float) turns it into a float. Used directly as the angle, it is in radians: 1 radian per second, which is about 57° per second, or one full turn (2π) every 6.28 seconds. Multiply it to spin faster, for example time * 2.0f. No variable has to remember the angle between frames: it is computed from the clock each time.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglTr_s1Run",
          "Run it: the image, at half its size, spins counter-clockwise in the lower-right quarter of the window. It still looks stretched sideways, because x = 1 is the right edge of a 1280-pixel-wide window and y = 1 the top of a 720-pixel-high one. Step 2 fixes that.")}
      </Callout>

      {/* ── SPACES / MVP ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_spacesTitle", "From one matrix to three: the coordinate spaces")}</H2>
      <p>
        {tx(t, "oglTr_spaces1",
          "One matrix is enough to move one square. A 3D scene needs more. Each object must be placed in the scene, a camera must look at the scene, and far things must look smaller. Each of these jobs gets its own matrix. Each matrix takes the coordinates from one \"space\" to the next. A space is just a choice of where (0, 0, 0) is and which way the axes point.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTr_tSpace", "Space"), tx(t, "oglTr_tSpaceMeans", "What the coordinates mean"), tx(t, "oglTr_tSpaceTo", "Next matrix")]}
        rows={[
          [tx(t, "oglTr_sp1", "local (model) space"), tx(t, "oglTr_sp1b", "relative to the object's own centre: the numbers you typed in vertices[], or that a modelling program saved"), tx(t, "oglTr_sp1c", "model matrix")],
          [tx(t, "oglTr_sp2", "world space"), tx(t, "oglTr_sp2b", "relative to the centre of the whole scene; every object shares it"), tx(t, "oglTr_sp2c", "view matrix")],
          [tx(t, "oglTr_sp3", "view (camera) space"), tx(t, "oglTr_sp3b", "relative to the camera: the camera is at (0, 0, 0) and looks down −z, with +y up"), tx(t, "oglTr_sp3c", "projection matrix")],
          [tx(t, "oglTr_sp4", "clip space"), tx(t, "oglTr_sp4b", "what gl_Position holds: (x, y, z, w), with the distance stored in w"), tx(t, "oglTr_sp4c", "the GPU divides by w")],
          [tx(t, "oglTr_sp5", "NDC"), tx(t, "oglTr_sp5b", "the −1 to 1 cube you have used since the triangle; then the viewport turns it into pixels"), "—"],
        ]}
      />
      <p>
        {tx(t, "oglTr_spaces2",
          "So the vertex shader computes gl_Position = projection × view × model × position. Read it from right to left, as always: the model matrix acts first. The three are called MVP, for Model, View, Projection.")}
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
      <p>
        {tx(t, "ch08_journeyIntro",
          "Watch all three happen to one vertex. Each step moves the whole scene into the next space, and the table tracks the same vertex's coordinates along the way. After the projection, the GPU divides x, y and z by w on its own; you never write that step.")}
      </p>

      <VertexJourneyFigure t={t} />

      <H3>{tx(t, "oglTr_wTitle", "Why perspective needs w")}</H3>
      <p>
        {tx(t, "oglTr_w1",
          "Far things look smaller because they are divided by their distance. A matrix can only multiply and add, it cannot divide. So the projection matrix does the next best thing: it copies the distance in front of the camera into w. After the vertex shader, the GPU divides x, y and z by w. That divide is called the perspective divide.")}
      </p>
      <p>
        {tx(t, "oglTr_w2",
          "With numbers: a camera with a 45° field of view, and two points at the same height, y = 0.5. One is 2 units in front of the camera (z = −2), the other 4 units (z = −4). The projection multiplies y by 2.414 (that is 1 / tan 22.5°, explained with the projection matrix below) and puts the distance in w:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTr_tPoint", "View-space point"), tx(t, "oglTr_tClip", "Clip y, w"), tx(t, "oglTr_tNdc", "NDC y = y / w")]}
        rows={[
          ["(0, 0.5, −2)", "1.207, 2", "0.604"],
          ["(0, 0.5, −4)", "1.207, 4", "0.302"],
        ]}
      />
      <p>
        {tx(t, "oglTr_w3",
          "Twice as far, half as high on the screen. That is perspective. Until now w was always 1, so the divide changed nothing, and that is why it never mattered before.")}
      </p>

      {/* ── VIEW ────────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_viewTitle", "The view matrix: moving the world, not the camera")}</H2>
      <p>
        {tx(t, "oglTr_view1",
          "OpenGL has no camera object. The \"camera\" is always at (0, 0, 0), looking down −z. To see the scene from somewhere else, you move the whole scene the opposite way. A camera 3 units back from the square is the same picture as the square pushed 3 units away from the camera.")}
      </p>
      <CodeBlock lang="cpp" filename="view_matrix.cpp" t={t}>{`// The camera stands at z = +3 and looks at the origin:
// move the whole world 3 units the other way, toward −z.
glm::mat4 view = glm::translate(glm::mat4(1.0f), glm::vec3(0.0f, 0.0f, -3.0f));

// The same matrix, written as "where the camera is and what it looks at":
glm::mat4 view2 = glm::lookAt(
    glm::vec3(0.0f, 0.0f, 3.0f),   // eye: where the camera stands
    glm::vec3(0.0f, 0.0f, 0.0f),   // center: the point it looks at
    glm::vec3(0.0f, 1.0f, 0.0f));  // up: which way is up`}</CodeBlock>
      <p>
        {tx(t, "oglTr_view2",
          "Both give exactly the same 16 numbers here. glm::lookAt is the general tool: it also turns the world when the camera looks sideways or down. This chapter uses the simple translate. The next chapter, Camera & View Matrix, explains how lookAt is built and lets you fly around with the keyboard and mouse.")}
      </p>

      {/* ── PERSPECTIVE ─────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08_projTitle", "Projection matrix — perspective")}</H2>
      <p>{tx(t, "oglTr_proj1", "glm::perspective builds the projection matrix from four numbers:")}</p>
      <CodeBlock lang="cpp" filename="projection_matrix.cpp" t={t}>{`float aspect = (float)width / (float)height;   // the window's framebuffer size

glm::mat4 projection = glm::perspective(
    glm::radians(45.0f),  // vertical FOV
    aspect,               // width / height
    0.1f,                 // near plane (do not set to 0)
    100.0f                // far plane
);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglTr_tArg", "Argument"), tx(t, "oglTr_tMeaning", "Meaning")]}
        rows={[
          ["glm::radians(45.0f)", tx(t, "oglTr_p1", "the field of view (FOV): the angle from the bottom to the top of what the camera sees. Larger is wider, like a wide-angle lens; 45° to 60° looks natural. In radians, like every GLM angle.")],
          ["aspect", tx(t, "oglTr_p2", "width ÷ height of the window: 1280 / 720 ≈ 1.78. The horizontal view is made this much wider, so a square stays square on a wide window.")],
          ["0.1f", tx(t, "oglTr_p3", "the near plane: anything closer to the camera than 0.1 units is cut away.")],
          ["100.0f", tx(t, "oglTr_p4", "the far plane: anything farther than 100 units is cut away too.")],
        ]}
      />
      <p>
        {tx(t, "ch08_frustumBody",
          "Those four numbers describe a volume called the view frustum: a pyramid with its tip cut off. Anything inside it ends up on screen, anything outside is clipped. Orbit the figure below, then switch to orthographic to see the pyramid become a box."
        )}
      </p>

      <FrustumFigure t={t} />

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
      <p>
        {tx(t, "oglTr_projRows",
          "Row by row. Row 2 multiplies y by 1 / tan(fov / 2). With a 45° FOV, tan 22.5° ≈ 0.414, so y is multiplied by 2.414: the number in the worked example above. Row 1 does the same to x and also divides by the aspect, which squeezes x on a wide window. Row 3 prepares the depth value for the depth test. Row 4 is (0, 0, −1, 0), so w = −z: the distance in front of the camera, since z is negative there.")}
      </p>

      <Callout type="warn" t={t}>
        {tx(t, "ch08_nearWarn",
          "Never set the near plane to 0. Put n = 0 into the matrix above and the third row becomes (0, 0, −1, 0): z_clip = −z = w, so after the divide every point lands on z_ndc = 1 and the depth buffer can no longer tell anything apart. Even a small positive near plane is costly, because depth precision is concentrated right in front of the camera. Push it out as far as the scene allows (0.1 is a common default); the Depth Testing chapter shows why."
        )}
      </Callout>

      {/* ── ORTHOGRAPHIC ────────────────────────────────────────────────── */}
      <H2>{tx(t, "ch08_orthoTitle", "Projection matrix — orthographic")}</H2>
      <p>
        {tx(t, "ch08_orthoBody",
          "An orthographic projection has no perspective: an object keeps its size however far away it is, and parallel lines stay parallel. Its frustum is a box instead of a pyramid, given by six planes: left, right, bottom, top, near and far. glm::ortho maps that box onto the NDC cube with nothing but a scale and a shift per axis. It is what 2D games and UI use, what CAD and editor views use, and what a directional light's shadow map uses."
        )}
      </p>
      <CodeBlock lang="cpp" filename="ortho.cpp" t={t}>{`// 2D / UI: one unit = one pixel, origin at the bottom-left of the window
glm::mat4 ui = glm::ortho(0.0f, (float)width, 0.0f, (float)height, -1.0f, 1.0f);

// Same, but y grows downward like screen coordinates: swap bottom and top
glm::mat4 uiTopDown = glm::ortho(0.0f, (float)width, (float)height, 0.0f, -1.0f, 1.0f);

// 3D scene seen without perspective: a 20 × 20 unit box, 0.1 to 100 deep
glm::mat4 box = glm::ortho(-10.0f, 10.0f, -10.0f, 10.0f, 0.1f, 100.0f);`}</CodeBlock>

      <Equation label={tx(t, "ch08_orthoEqLabel", "glm::ortho(l, r, b, t, n, f)")}
        where={[
          [String.raw`l,\ r`, tx(t, "ch08_wLR", "x of the box's left and right sides, in view space")],
          [String.raw`b,\ t`, tx(t, "ch08_wBT", "y of its bottom and top sides")],
          [String.raw`n,\ f`, tx(t, "ch08_wNF2", "distances to the near and far planes in front of the camera (view-space z = −n and −f)")],
        ]}
        note={tx(t, "ch08_orthoEqNote", "Each diagonal term squeezes one side length of the box into the 2 units of NDC, and the last column moves the box's centre to 0. The bottom row is (0, 0, 0, 1), so w stays 1 and the divide changes nothing: that is why there is no perspective. Unlike the perspective case, depth is stored linearly and n = 0 is allowed.")}>
        {String.raw`O \;=\; \begin{bmatrix}
\dfrac{2}{r-l} & 0 & 0 & -\dfrac{r+l}{r-l} \\[6pt]
0 & \dfrac{2}{t-b} & 0 & -\dfrac{t+b}{t-b} \\[6pt]
0 & 0 & -\dfrac{2}{f-n} & -\dfrac{f+n}{f-n} \\[6pt]
0 & 0 & \purple{0} & \purple{1}
\end{bmatrix}`}
      </Equation>

      <p>
        {tx(t, "ch08_orthoCheck",
          "Check one corner: x = r gives (2r − r − l) / (r − l) = 1, the right edge of NDC, and x = l gives −1. The z row does the same for depth: view-space z = −n lands on −1 and z = −f on +1, with the minus sign turning 'in front of the camera' (negative z) into increasing depth."
        )}
      </p>

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_s2Title", "Step 2: three matrices in main.cpp")}</H2>
      <p>
        {tx(t, "oglTr_s2a",
          "Back to the program. In the vertex shader, uTransform becomes three uniforms, multiplied in the MVP order:")}
      </p>
      <CodeBlock lang="glsl" filename="vertex shader (in main.cpp)" t={t}>{`uniform mat4 uModel;         // NEW: replaces uTransform
uniform mat4 uView;          // NEW
uniform mat4 uProjection;    // NEW

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    TexCoord = aTexCoord;
}`}</CodeBlock>
      <p>
        {tx(t, "oglTr_s2b",
          "In step 4, one location per uniform replaces transformLoc. In the loop, three matrices replace transform:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, in the render loop)" t={t}>{`// Model: tilt the square back by 55° around x, like a floor tile
glm::mat4 model = glm::rotate(glm::mat4(1.0f), glm::radians(-55.0f), glm::vec3(1.0f, 0.0f, 0.0f));

// View: the camera 3 units back
glm::mat4 view = glm::translate(glm::mat4(1.0f), glm::vec3(0.0f, 0.0f, -3.0f));

// Projection: the window's current shape
int width, height;
glfwGetFramebufferSize(window, &width, &height);
float aspect = height > 0 ? (float)width / (float)height : 1.0f;
glm::mat4 projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);

glUseProgram(shaderProgram);
glUniformMatrix4fv(modelLoc,      1, GL_FALSE, glm::value_ptr(model));
glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));
glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglTr_tLine", "Line"), tx(t, "oglTr_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"glm::radians(-55.0f), (1, 0, 0)"}</IC>, tx(t, "oglTr_m1", "turns around the x axis. By the right-hand rule, a negative angle tips the top of the square away from the camera, so it lies back like a floor.")],
          [<IC key="2">{"glfwGetFramebufferSize"}</IC>, tx(t, "oglTr_m2", "the window's size in pixels, read every frame, so the aspect stays right when the user resizes the window.")],
          [<IC key="3">{"height > 0 ? … : 1.0f"}</IC>, tx(t, "oglTr_m3", "a minimised window has height 0, and dividing by 0 would fill the matrix with infinities. Then any aspect will do, since nothing is visible.")],
        ]}
      />
      <p>
        {tx(t, "oglTr_s2Worked",
          "Follow the top-right corner, (0.5, 0.5, 0), through all four steps, with the 1280 × 720 window. The model matrix tilts it to (0.5, 0.287, −0.410): lower, and pushed back. The view matrix moves it to (0.5, 0.287, −3.410). The projection gives the clip coordinates (0.679, 0.692, 3.216, 3.410), with w = 3.410, the distance. The divide gives NDC (0.199, 0.203, 0.943): a bit right of and above the centre of the window. The z of 0.943 is what the depth test will compare.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglTr_s2Run",
          "Run it: the image lies back like a tile on the floor, its far edge narrower than its near edge. It is no longer stretched: resize the window and it keeps its shape.")}
      </Callout>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_s3Title", "Step 3: a spinning cube")}</H2>
      <p>
        {tx(t, "oglTr_s3a",
          "A cube has 8 corners, but the vertex array needs 24 vertices: 4 per face, 6 faces. Why not 8? A vertex is the whole set of its attributes, not just a position. Each corner touches three faces, and on each face it needs a different (u, v), so the image sits right on every face. So each corner appears three times, with three different texture coordinates.")}
      </p>
      <p>
        {tx(t, "oglTr_s3b",
          "Each face is written like the square: top-left, bottom-left, bottom-right, top-right, as seen from outside the cube. Its indices follow the same 0 1 2, 0 2 3 pattern, plus 4 for each face before it. Writing every face counter-clockwise from outside does not matter yet. It will once the GPU is told to skip faces that point away from the camera, in the Face Winding & Culling chapter.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4b)" t={t}>{`float vertices[] = {
//    x      y      z     u     v
    // front (+z)
    -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
     0.5f, -0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
    // back (−z)
     0.5f,  0.5f, -0.5f, 0.0f, 1.0f,    0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
    -0.5f, -0.5f, -0.5f, 1.0f, 0.0f,   -0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // right (+x)
     0.5f,  0.5f,  0.5f, 0.0f, 1.0f,    0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
     0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // left (−x)
    -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
    -0.5f, -0.5f,  0.5f, 1.0f, 0.0f,   -0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
    // top (+y)
    -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f,  0.5f,  0.5f, 0.0f, 0.0f,
     0.5f,  0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
    // bottom (−y)
    -0.5f, -0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
     0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f, -0.5f,  0.5f, 1.0f, 1.0f,
};
GLuint indices[] = {
     0,  1,  2,   0,  2,  3,    // front
     4,  5,  6,   4,  6,  7,    // back
     8,  9, 10,   8, 10, 11,    // right
    12, 13, 14,  12, 14, 15,    // left
    16, 17, 18,  16, 18, 19,    // top
    20, 21, 22,  20, 22, 23,    // bottom
};`}</CodeBlock>
      <p>
        {tx(t, "oglTr_s3c",
          "Everything else in step 4b stays: sizeof(vertices) and sizeof(indices) follow the new arrays by themselves, and the layout is still x y z u v. Only the draw call changes, from 6 indices to 36: 6 faces × 2 triangles × 3 corners.")}
      </p>
      <p>
        {tx(t, "oglTr_s3d",
          "Now the faces overlap on screen, and the nearest one must win. By default it does not: OpenGL simply paints each triangle over whatever is there, so a back face drawn after the front face covers it. The depth test fixes that. For each pixel it keeps the depth (the z from the divide) of the nearest surface drawn so far, and throws away fragments that are farther. One line in step 4 turns it on. The glClear call already clears the depth values every frame (the GL_DEPTH_BUFFER_BIT part, there since the Window & Context chapter).")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4, and the loop)" t={t}>{`glEnable(GL_DEPTH_TEST);     // step 4: keep the nearest surface per pixel

// in the loop: spin around a slanted axis, 50° per second
glm::mat4 model = glm::rotate(glm::mat4(1.0f), time * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
// ...
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);   // was 6`}</CodeBlock>
      <p>
        {tx(t, "oglTr_s3e",
          "The axis (0.5, 1, 0) leans to the side, so the cube tumbles and shows all its faces. glm::rotate normalizes it to length 1 by itself. The Depth Testing chapter, two chapters on, explains how the depth test works and what else it can do.")}
      </p>

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglTr_soFarBody",
          "The whole file after step 3. Compared with the Textures chapter's version, the changes are marked NEW: the GLM includes, the three uniforms in the vertex shader, the cube's vertices and indices, the depth test and the uniform locations in step 4, and the matrices and 36 indices in the loop. The helpers are shortened because they did not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>
#include "stb_image.h"
#include <glm/glm.hpp>                    // NEW
#include <glm/gtc/matrix_transform.hpp>   // NEW
#include <glm/gtc/type_ptr.hpp>           // NEW

// ── Shaders ─────────────────────────────────────── NEW: the MVP matrices
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;
out vec2 TexCoord;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
    TexCoord = aTexCoord;
})";

const char* fragmentShaderSource = R"(#version 460 core
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
void main() {
    FragColor = texture(uTexture, TexCoord);
})";

// ── Helpers (unchanged since First Shaders and Textures) ────────────────────
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }
GLuint loadTexture(const char* path) { /* ... */ }

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1–3. Window, GLAD, viewport (unchanged) ─────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO            >>> NEW: a cube, 24 vertices
    float vertices[] = {
    //    x      y      z     u     v
        // front (+z)
        -0.5f,  0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
         0.5f, -0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
        // back (−z)
         0.5f,  0.5f, -0.5f, 0.0f, 1.0f,    0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
        -0.5f, -0.5f, -0.5f, 1.0f, 0.0f,   -0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // right (+x)
         0.5f,  0.5f,  0.5f, 0.0f, 1.0f,    0.5f, -0.5f,  0.5f, 0.0f, 0.0f,
         0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // left (−x)
        -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
        -0.5f, -0.5f,  0.5f, 1.0f, 0.0f,   -0.5f,  0.5f,  0.5f, 1.0f, 1.0f,
        // top (+y)
        -0.5f,  0.5f, -0.5f, 0.0f, 1.0f,   -0.5f,  0.5f,  0.5f, 0.0f, 0.0f,
         0.5f,  0.5f,  0.5f, 1.0f, 0.0f,    0.5f,  0.5f, -0.5f, 1.0f, 1.0f,
        // bottom (−y)
        -0.5f, -0.5f,  0.5f, 0.0f, 1.0f,   -0.5f, -0.5f, -0.5f, 0.0f, 0.0f,
         0.5f, -0.5f, -0.5f, 1.0f, 0.0f,    0.5f, -0.5f,  0.5f, 1.0f, 1.0f,
    };
    GLuint indices[] = {
         0,  1,  2,   0,  2,  3,    // front
         4,  5,  6,   4,  6,  7,    // back
         8,  9, 10,   8, 10, 11,    // right
        12, 13, 14,  12, 14, 15,    // left
        16, 17, 18,  16, 18, 19,    // top
        20, 21, 22,  20, 22, 23,    // bottom
    };
    //                                               <<< end of NEW
    GLuint vao, vbo, ebo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    glBindVertexArray(0);

    // 4c. Texture + sampler (unchanged)
    GLuint texture = loadTexture(ASSET_DIR "wall.jpg");
    if (texture == 0) { glfwTerminate(); return 1; }
    glUseProgram(shaderProgram);
    glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0);

    // 4d. Matrices and depth                        >>> NEW
    GLint modelLoc      = glGetUniformLocation(shaderProgram, "uModel");
    GLint viewLoc       = glGetUniformLocation(shaderProgram, "uView");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "uProjection");
    glEnable(GL_DEPTH_TEST);
    //                                               <<< end of NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // >>> NEW: model, view and projection, rebuilt every frame
        float time = (float)glfwGetTime();
        glm::mat4 model = glm::rotate(glm::mat4(1.0f), time * glm::radians(50.0f),
                                      glm::vec3(0.5f, 1.0f, 0.0f));
        glm::mat4 view  = glm::translate(glm::mat4(1.0f), glm::vec3(0.0f, 0.0f, -3.0f));
        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        float aspect = height > 0 ? (float)width / (float)height : 1.0f;
        glm::mat4 projection = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);
        // <<< end of NEW

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(modelLoc,      1, GL_FALSE, glm::value_ptr(model));        // NEW
        glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));         // NEW
        glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));   // NEW
        glBindVertexArray(vao);
        glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);                  // NEW: 36

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up (unchanged) ──────────────────────────────────────────────
    glDeleteTextures(1, &texture);
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglTr_soFarRun",
          "Run it: a cube with your image on every face tumbles slowly in the middle of the window, in perspective. Its near faces hide its far ones.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTr_tSee", "What you see"), tx(t, "oglTr_tCause", "Likely cause")]}
        rows={[
          [tx(t, "oglTr_r1", "nothing at all, only the clear colour"), tx(t, "oglTr_r1b", "a matrix that was never set is all zeros, which squashes every vertex to one point. Check that every location is not −1 (print them) and that every glUniformMatrix4fv runs after glUseProgram.")],
          [tx(t, "oglTr_r2", "the cube's far faces show through its near ones"), tx(t, "oglTr_r2b", "glEnable(GL_DEPTH_TEST) is missing, or glClear lacks GL_DEPTH_BUFFER_BIT.")],
          [tx(t, "oglTr_r3", "only one face, or half the cube, is drawn"), tx(t, "oglTr_r3b", "the draw call still says 6 instead of 36.")],
          [tx(t, "oglTr_r4", "the cube spins far too fast"), tx(t, "oglTr_r4b", "the angle was given in degrees: time * 50.0f without glm::radians.")],
          [tx(t, "oglTr_r5", "the cube looks squashed or stretched"), tx(t, "oglTr_r5b", "the aspect is wrong: integer division ((float) missing), or width and height swapped.")],
          [tx(t, "oglTr_r6", "the cube is huge and clipped, or not there"), tx(t, "oglTr_r6b", "the view matrix moves by +3 instead of −3, which puts the cube behind the camera.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglTr_try",
          "Try it: draw the same cube several times. One VAO is enough; only the model matrix changes. Put a few positions in an array, and in the loop, for each one, build model = translate(position) × rotate(…), send it, and call glDrawElements again. Then remove glEnable(GL_DEPTH_TEST) to see what the depth test was doing.")}
      </Callout>
      <CodeBlock lang="cpp" filename="many_cubes.cpp" t={t}>{`glm::vec3 positions[] = {
    glm::vec3( 0.0f,  0.0f,  0.0f),
    glm::vec3( 2.0f,  1.0f, -5.0f),
    glm::vec3(-1.5f, -1.0f, -2.5f),
};
for (int i = 0; i < 3; ++i) {
    glm::mat4 model = glm::translate(glm::mat4(1.0f), positions[i]);   // acts last: move into place
    model = glm::rotate(model, time + i, glm::vec3(0.5f, 1.0f, 0.0f)); // acts first: spin around its centre
    glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
    glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
}`}</CodeBlock>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglTr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglTr_tMistake", "Mistake"), tx(t, "oglTr_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglTr_e1", "Multiplying in the wrong order in the shader"), tx(t, "oglTr_e1b", "uModel * uView * uProjection * pos gives nonsense. The matrix that acts first sits next to the vector: uProjection * uView * uModel * pos.")],
          [tx(t, "oglTr_e2", "GL_TRUE for transpose"), tx(t, "oglTr_e2b", "rows and columns are swapped: the translation lands in the bottom row and everything is distorted. GLM's layout already matches OpenGL; pass GL_FALSE.")],
          [tx(t, "oglTr_e3", "Setting a uniform before glUseProgram"), tx(t, "oglTr_e3b", "glUniform* changes the program currently in use, which may be another one or none (an error). Call glUseProgram first.")],
          [tx(t, "oglTr_e4", "(float)(width / height)"), tx(t, "oglTr_e4b", "the division is done on integers first: 1280 / 720 = 1, so the picture is stretched. Convert before dividing: (float)width / (float)height.")],
          [tx(t, "oglTr_e5", "Near plane 0, or a huge far plane"), tx(t, "oglTr_e5b", "the depth test can no longer tell surfaces apart and they flicker through each other. Keep near as large and far as small as the scene allows.")],
          [tx(t, "oglTr_e6", "Asking for uniform locations every frame"), tx(t, "oglTr_e6b", "it works, but it searches the program by name each time. Look them up once in step 4.")],
        ]}
      />
      <p>
        {tx(t, "oglTr_next",
          "Next, Camera & View Matrix replaces the fixed translate(0, 0, −3) with a real camera: glm::lookAt, the mouse to look around and the keyboard to move.")}
      </p>

      <KeyIdeas t={t} id="oglTr" items={[
        "A mat4 uniform in the vertex shader moves every vertex: gl_Position = matrix * vec4(aPos, 1.0). Send it with glUniformMatrix4fv(location, 1, GL_FALSE, glm::value_ptr(m)).",
        "GLM calls multiply on the right, so the call written last acts first: write translate, rotate, scale to get M = T R S.",
        "Each matrix takes coordinates from one space to the next: model (local → world), view (world → camera), projection (camera → clip).",
        "The projection puts the distance into w; the GPU then divides by w, so far things shrink. That divide is the perspective divide.",
        "OpenGL has no camera: the view matrix moves the whole world the opposite way. glm::lookAt builds it from a position and a target.",
        "glm::perspective takes the FOV in radians, the aspect width / height, and near and far planes; never a near plane of 0.",
        "A textured cube needs 24 vertices (each face its own uv) and 36 indices, and the depth test so near faces hide far ones.",
      ]} />
    </Article>
  );
}
