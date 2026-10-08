// src/lib/tracks/opengl/chapters/lighting-basics/light-color.tsx
"use client";

// Light & Color. Code-along (2026-10-04) continuing the main.cpp from the end
// of "Depth Testing": what light is (a spectrum) and why three numbers are
// enough; light × surface channel by channel, worked by hand (ColorMix
// figure); why multiply and why surfaces stay ≤ 1; step 1, the object shader
// (uObjectColor × uLightColor, the depth view modes removed, the unused
// texture explained); step 2, the lamp (a second program reusing the vertex
// shader and the VAO, uniforms belong to a program, lightPos checked in NDC);
// step 3, the table's lights and a light brighter than 1; the checkpoint;
// going further, the RGB product as an approximation of the spectral integral
// (Spectrum figure); mistakes.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { ColorMixFigure } from "@/components/lesson/figures/lighting/ColorMixFigure";
import { SpectrumFigure } from "@/components/lesson/figures/lighting/SpectrumFigure";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

const r = String.raw;

export function LightColorContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglLC_intro",
          "Before lighting a scene we need to agree on what colour even is. An object is not \"red\" by itself — it is red because, of all the light that hits it, it throws back mostly the red part and swallows the rest. Computer graphics models that with one multiplication.")}
      </Lead>

      <Goals t={t} id="oglLC" items={[
        "Explain why a colour is three numbers, and what multiplying light by a surface means.",
        "Write the shader for the lit object and the shader for the lamp.",
        "Predict the colour of a lit surface and check it in the scene.",
      ]} />

      {/* ── WHAT CHANGES ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "oglLC_alongBody",
          "It continues the main.cpp from the end of the Depth Testing chapter: five spinning cubes and a camera you fly with W A S D and the mouse. The Lighting section keeps growing this same file, one chapter at a time. First comes a little theory: what colour is, and why light and surface are multiplied. Then three steps:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglLC_along1", "Step 1: the cubes get a plain colour, coral, multiplied by the colour of the light.")}</li>
        <li>{tx(t, "oglLC_along2", "Step 2: a lamp, a small cube with its own shader, so it is never lit itself.")}</li>
        <li>{tx(t, "oglLC_along3", "Step 3: change the light's colour and check the results against the worked table.")}</li>
      </ol>
      <p>
        {tx(t, "oglLC_alongNote",
          "At the end of this chapter the cubes are still flat: every face has the same colour. Making faces brighter when they turn toward the lamp is the next chapter, Basic Lighting.")}
      </p>

      {/* ── WHAT LIGHT IS ───────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_whatTitle", "What light is, and why three numbers")}</H2>
      <p>
        {tx(t, "oglLC_whatBody",
          "Visible light is electromagnetic radiation with wavelengths between about 400 nm (violet) and 700 nm (red). A light source is described by its spectrum: how much power it emits at each wavelength. Daylight has some of everything; a sodium street lamp puts almost all of its power into one yellow line at 589 nm. A full spectrum is a whole curve, but the eye does not see curves. The retina has three kinds of colour-sensitive cells (cones), most sensitive to long, medium and short wavelengths, and each reports a single number: how strongly it was stimulated. Everything we perceive as colour is those three numbers.")}
      </p>
      <p>
        {tx(t, "oglLC_whatRgb",
          "That is why a screen can fake any colour with only three kinds of sub-pixel, red, green and blue: it only needs to excite the three cones in the same proportions as the real light would. Two different spectra that excite the cones the same way look identical (they are called metamers). So graphics describes every light and every surface with three numbers, R, G and B, and does all its arithmetic on those.")}
      </p>

      {/* ── LIGHT × SURFACE ─────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_mulTitle", "Light times surface")}</H2>
      <p>
        {tx(t, "oglLC_mulBody",
          "We describe both the light and the surface with three numbers between 0 and 1: how much red, green and blue. For the light that is how much it emits; for the surface, the fraction of each channel it reflects. The colour that reaches the eye is the product, channel by channel:")}
      </p>

      <Equation label={tx(t, "oglLC_eqLabel", "Reflected colour")}
        where={[
          [r`\mathbf{L}`, tx(t, "oglLC_wL", "light colour (what the source emits)")],
          [r`\mathbf{S}`, tx(t, "oglLC_wS", "surface colour (fraction of each channel it reflects)")],
          [r`\odot`, tx(t, "oglLC_wOdot", "component-wise product — what vec3 * vec3 does in GLSL")],
        ]}>
        {r`\mathbf{c} \;=\; \mathbf{L} \odot \mathbf{S} \;=\; \begin{pmatrix} \red{L_r S_r} \\ \green{L_g S_g} \\ \blue{L_b S_b} \end{pmatrix}`}
      </Equation>

      <H3>{tx(t, "oglLC_workedTitle", "Worked example: one coral surface, three lights")}</H3>
      <p>
        {tx(t, "oglLC_workedIntro",
          "Take the coral surface S = (1.0, 0.5, 0.31): it reflects all of the red, half of the green and 31% of the blue that reaches it.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglLC_tLight", "Light L"), tx(t, "oglLC_tProduct", "L ⊙ S"), tx(t, "oglLC_tLooks", "What we see")]}
        rows={[
          [tx(t, "oglLC_l1", "white (1, 1, 1)"), "(1.0, 0.5, 0.31)", tx(t, "oglLC_l1r", "coral: the surface's own colour, because white light has every channel at full strength")],
          [tx(t, "oglLC_l2", "warm bulb (1, 0.78, 0.5)"), "(1.0, 0.39, 0.155)", tx(t, "oglLC_l2r", "a deeper orange: the light has less blue and green to give")],
          [tx(t, "oglLC_l3", "pure green (0, 1, 0)"), "(0, 0.5, 0)", tx(t, "oglLC_l3r", "a dark green: the only channel the light contains is one the surface reflects half of")],
          [tx(t, "oglLC_l4", "pure blue (0, 0, 1)"), "(0, 0, 0.31)", tx(t, "oglLC_l4r", "a dim navy, nearly black: coral is a poor reflector of blue")],
        ]}
      />
      <p>
        {tx(t, "oglLC_mulTry",
          "Try it below. A coral surface under white light looks coral. Under a pure green light it turns almost black: it reflects only half of the green channel and there is no red or blue left in the light for it to reflect.")}
      </p>

      <ColorMixFigure t={t} />

      <H3>{tx(t, "oglLC_whyMulTitle", "Why multiply, and why surfaces stay at or below 1")}</H3>
      <p>
        {tx(t, "oglLC_whyMulBody",
          "A surface cannot create light; it can only send back part of what arrives. The part it does not send back is absorbed and turns into heat. A fraction of something is a multiplication by a number between 0 and 1, so surface colours live in [0, 1] per channel. Adding the two colours instead would make a white wall under a dim red lamp brighter than the lamp itself, which is impossible. Light colours have no such limit: a lamp can be twice as bright as another, so L = (2, 2, 2) is perfectly valid, as long as the result is computed in floating point before it reaches the screen (the HDR chapter uses exactly that).")}
      </p>

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_s1Title", "Step 1: the object shader")}</H2>
      <p>
        {tx(t, "oglLC_s1a",
          "Now put the product into main.cpp. Replace the fragment shader with this one. The vertex shader does not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (replaces fragmentShaderSource)" t={t}>{`const char* fragmentShaderSource = R"(#version 460 core
out vec4 FragColor;
uniform vec3 uObjectColor;   // the surface: the fraction of each channel it reflects
uniform vec3 uLightColor;    // the light: how much of each channel it emits

void main() {
    FragColor = vec4(uLightColor * uObjectColor, 1.0);   // channel by channel
})";`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglLC_tLine", "Line"), tx(t, "oglLC_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"uniform vec3 uObjectColor"}</IC>, tx(t, "oglLC_sl1", "S in the formula: three numbers from 0 to 1, one per channel.")],
          [<IC key="2">{"uniform vec3 uLightColor"}</IC>, tx(t, "oglLC_sl2", "L in the formula. It may go above 1 (step 3 tries it).")],
          [<IC key="3">{"uLightColor * uObjectColor"}</IC>, tx(t, "oglLC_sl3", "in GLSL, vec3 * vec3 multiplies red by red, green by green and blue by blue: exactly L ⊙ S.")],
          [<IC key="4">{"vec4(…, 1.0)"}</IC>, tx(t, "oglLC_sl4", "adds alpha = 1, fully opaque, because FragColor is a vec4.")],
        ]}
      />
      <p>
        {tx(t, "oglLC_s1b",
          "The new shader has no view modes, so the Depth Testing extras go too. Delete these lines. If you forget one, nothing breaks; \"What about the texture?\" below says why.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglLC_tWhere", "Where"), tx(t, "oglLC_tDelete", "Delete")]}
        rows={[
          [tx(t, "oglLC_d1", "camera state"), <IC key="1">{"int viewMode = 0;"}</IC>],
          [tx(t, "oglLC_d2", "processInput"), tx(t, "oglLC_d2b", "the three lines for keys 1, 2 and 3")],
          [tx(t, "oglLC_d3", "step 4d"), tx(t, "oglLC_d3b", "the two glUniform1f lines (uNear, uFar) and the viewModeLoc line. Keep zNear and zFar: the projection uses them.")],
          [tx(t, "oglLC_d4", "render loop"), <IC key="4">{"glUniform1i(viewModeLoc, viewMode);"}</IC>],
        ]}
      />
      <p>
        {tx(t, "oglLC_s1c",
          "Then set the two colours, in step 4d, under zNear and zFar. The program is still in use from step 4c, so the glUniform calls go to it. The colours do not change from frame to frame, so they are sent once:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`glm::vec3 objectColor(1.0f, 0.5f, 0.31f);   // coral
glm::vec3 lightColor (1.0f, 1.0f, 1.0f);    // white
glUniform3fv(glGetUniformLocation(shaderProgram, "uObjectColor"), 1, glm::value_ptr(objectColor));
glUniform3fv(glGetUniformLocation(shaderProgram, "uLightColor"),  1, glm::value_ptr(lightColor));`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglLC_tArg", "Argument"), tx(t, "oglLC_tMeans", "Meaning")]}
        rows={[
          [<IC key="1">{"glUniform3fv"}</IC>, tx(t, "oglLC_u1", "3 = three components, f = floats, v = passed as a pointer to them (a \"vector\"). It fills one vec3 uniform.")],
          [<IC key="2">{"glGetUniformLocation(…)"}</IC>, tx(t, "oglLC_u2", "which uniform, as in the Transformations chapter. Here it is looked up inline, because it is used only once.")],
          [<IC key="3">{"1"}</IC>, tx(t, "oglLC_u3", "how many vec3s: one. (A uniform array would take more.)")],
          [<IC key="4">{"glm::value_ptr(objectColor)"}</IC>, tx(t, "oglLC_u4", "a pointer to the three floats inside the glm::vec3, like value_ptr for the matrices.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglLC_s1Run",
          "Run it: five coral cubes on the dark background. They look flat, like paper cut-outs. Every fragment gets the same colour, (1, 1, 1) × (1, 0.5, 0.31), so the edges between faces vanish and only the outline is left. That is correct for now.")}
      </Callout>
      <H3>{tx(t, "oglLC_texTitle", "What about the texture?")}</H3>
      <p>
        {tx(t, "oglLC_tex1",
          "Leave the texture lines in step 4c and in the loop. The texture comes back in the Lighting Maps chapter, as the colour of the surface. Until then nothing uses it, and that is safe. The new shader has no uTexture, so glGetUniformLocation(shaderProgram, \"uTexture\") returns −1, meaning \"no such uniform\". OpenGL ignores any glUniform call with location −1, with no error.")}
      </p>
      <p>
        {tx(t, "oglLC_tex2",
          "The same rule covers the deleted view-mode lines: with the new shader their locations are −1 too, so a forgotten line does nothing. The other side of the rule: a misspelled uniform name fails just as silently. If a colour stays black, check the spelling first.")}
      </p>

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_s2Title", "Step 2: the lamp")}</H2>
      <p>
        {tx(t, "oglLC_s2a",
          "The next chapters light the cubes with a lamp at a position in the world. To see where it is, we draw it: a small cube. But the lamp is the light; it must not be shaded like the other cubes, or its far side would turn dark. So it gets its own fragment shader, which paints it in the light's colour and nothing else. Add it next to the other shader sources:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (shaders, under fragmentShaderSource)" t={t}>{`const char* lampFragmentShaderSource = R"(#version 460 core
out vec4 FragColor;
uniform vec3 uLightColor;

void main() {
    FragColor = vec4(uLightColor, 1.0);   // the light itself: never lit
})";`}</CodeBlock>
      <p>
        {tx(t, "oglLC_s2b",
          "A program is one vertex shader plus one fragment shader. The lamp moves and projects exactly like a cube, so it can reuse vertexShaderSource. In step 4a, make a second program:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4a)" t={t}>{`GLuint lampProgram = makeProgram(vertexShaderSource, lampFragmentShaderSource);
if (lampProgram == 0) { glfwTerminate(); return 1; }`}</CodeBlock>
      <p>
        {tx(t, "oglLC_s2c",
          "Each program has its own uniforms. The uModel in shaderProgram and the uModel in lampProgram are two separate slots, even though the name is the same. So the lamp needs its own locations, and its own values. Add this at the end of step 4d:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`glm::vec3 lightPos(1.2f, 1.0f, 0.0f);      // where the lamp is, in world space
glUseProgram(lampProgram);                  // glUniform* now goes to the lamp
GLint lampModelLoc      = glGetUniformLocation(lampProgram, "uModel");
GLint lampViewLoc       = glGetUniformLocation(lampProgram, "uView");
GLint lampProjectionLoc = glGetUniformLocation(lampProgram, "uProjection");
glUniform3fv(glGetUniformLocation(lampProgram, "uLightColor"), 1, glm::value_ptr(lightColor));`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglLC_tLine", "Line"), tx(t, "oglLC_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"glm::vec3 lightPos"}</IC>, tx(t, "oglLC_p1", "the lamp's place: a little up and to the right of cube 0. The next chapter reads it to light the cubes.")],
          [<IC key="2">{"glUseProgram(lampProgram)"}</IC>, tx(t, "oglLC_p2", "glUniform* always writes to the program in use. Without this line, the last glUniform3fv would set shaderProgram's uLightColor again, and the lamp's would stay black.")],
          [<IC key="3">{"lampModelLoc …"}</IC>, tx(t, "oglLC_p3", "the lamp's own locations. With the same vertex shader they are often the same numbers as modelLoc and the others, but nothing guarantees it.")],
          [<IC key="4">{"glUniform3fv(… uLightColor …)"}</IC>, tx(t, "oglLC_p4", "the same white as the cubes' light, so the lamp shows the colour it gives.")],
        ]}
      />
      <p>
        {tx(t, "oglLC_s2d",
          "In the render loop, after the for loop of cubes, switch to the lamp program and draw the cube one more time. The view and projection change every frame, so they are sent every frame, to this program too:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, after the cube loop)" t={t}>{`// The lamp: the same cube, moved to the light and shrunk
glUseProgram(lampProgram);
glUniformMatrix4fv(lampViewLoc,       1, GL_FALSE, glm::value_ptr(view));
glUniformMatrix4fv(lampProjectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
glm::mat4 lampModel = glm::translate(glm::mat4(1.0f), lightPos);
lampModel = glm::scale(lampModel, glm::vec3(0.2f));
glUniformMatrix4fv(lampModelLoc, 1, GL_FALSE, glm::value_ptr(lampModel));
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglLC_tChoice", "Choice"), tx(t, "oglLC_tReason", "Reason")]}
        rows={[
          [tx(t, "oglLC_c1", "the same VAO as the cubes"), tx(t, "oglLC_c1n", "it is still bound from the cube loop, so there is no glBindVertexArray. The lamp's shader reads only aPos and aTexCoord, which the VAO already describes. A lamp with a different mesh (a sphere, say) would need its own VAO.")],
          [tx(t, "oglLC_c3", "translate, then scale"), tx(t, "oglLC_c3b", "GLM multiplies on the right, so the scale is applied to the vertices first: the cube shrinks around its own centre and is then moved to the light, not shrunk toward the world origin.")],
          [tx(t, "oglLC_c5", "scale 0.2"), tx(t, "oglLC_c5b", "the cube's corners at ±0.5 become ±0.1: a lamp 0.2 units wide, small next to the unit cubes.")],
          [tx(t, "oglLC_c6", "no rotate"), tx(t, "oglLC_c6b", "the lamp is a marker for a point, so it stays still.")],
          [tx(t, "oglLC_c4", "a separate shader for the lamp"), tx(t, "oglLC_c4b", "the lamp is the light; lighting it with its own light would darken its far side and make it look like an ordinary object.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglLC_s2Run",
          "Run it: a small white cube near the top-right corner of the window, up and to the right of the first coral cube. Fly around it with the mouse and W A S D. It does not light anything yet; for now it only marks where the light is.")}
      </Callout>
      <p>
        {tx(t, "oglLC_s2e",
          "Why there? Check it with the Transformations chapter. From the start position (0, 0, 3), the view matrix moves the lamp to (1.2, 1.0, −3): 3 units ahead. The projection (45°, 1280 / 720) gives x = 1.2 / (3 × 0.4142 × 1.778) = 0.54 and y = 1.0 / (3 × 0.4142) = 0.80 in NDC: right of centre and near the top. The textbook position (1.2, 1, 2) would be only 1 unit ahead, at x = 1.63 and y = 2.41: outside the window, which ends at 1.")}
      </p>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_s3Title", "Step 3: check the table")}</H2>
      <p>
        {tx(t, "oglLC_s3a",
          "Now test the worked example on the real cubes. Change the lightColor line in step 4d to each light of the table, run, and compare. Both programs get the new value, because both glUniform3fv calls read the same variable.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`glm::vec3 lightColor(0.0f, 1.0f, 0.0f);    // experiment: pure green`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglLC_tLightColor", "lightColor"), tx(t, "oglLC_tCubes", "Cubes"), tx(t, "oglLC_tLamp", "Lamp")]}
        rows={[
          ["(1.0, 0.78, 0.5)", tx(t, "oglLC_x1", "(1.0, 0.39, 0.155): a deeper orange"), tx(t, "oglLC_x1b", "warm white")],
          ["(0.0, 1.0, 0.0)", tx(t, "oglLC_x2", "(0, 0.5, 0): dark green"), tx(t, "oglLC_x2b", "bright green")],
          ["(0.0, 0.0, 1.0)", tx(t, "oglLC_x3", "(0, 0, 0.31): navy, almost black"), tx(t, "oglLC_x3b", "bright blue")],
          ["(2.0, 2.0, 2.0)", tx(t, "oglLC_x4", "(2.0, 1.0, 0.62), shown as (1.0, 1.0, 0.62): pale yellow"), tx(t, "oglLC_x4b", "white")],
        ]}
      />
      <p>
        {tx(t, "oglLC_s3b",
          "The last row deserves a look. The shader computes 2.0 for red and 1.0 for green without complaint: inside the shader they are ordinary floats. But the window's colour buffer stores each channel as a number from 0 to 1. On the way in, 2.0 is clipped to 1.0, so red and green are both at full strength and the coral turns pale yellow. The colour information above 1 is lost. The HDR chapter keeps it, by drawing into a buffer of floats first.")}
      </p>
      <p>{tx(t, "oglLC_s3c", "Set lightColor back to white (1.0f, 1.0f, 1.0f) before going on.")}</p>

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglLC_soFarBody",
          "The whole file after step 3, with the light back to white. Compared with the Depth Testing version, the changes are marked NEW: the object's fragment shader, the lamp's fragment shader, the lamp program in step 4a, the colours, lightPos and the lamp's locations in step 4d, the lamp's draw in the loop and its glDeleteProgram. The view-mode lines are gone. The helpers and the vertex data are shortened because they did not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>
#include "stb_image.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// ── Shaders ─────────────────────────────────────────────────────────────────
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
out vec4 FragColor;
uniform vec3 uObjectColor;                                      // NEW
uniform vec3 uLightColor;                                       // NEW
void main() {
    FragColor = vec4(uLightColor * uObjectColor, 1.0);          // NEW
})";

const char* lampFragmentShaderSource = R"(#version 460 core
out vec4 FragColor;
uniform vec3 uLightColor;
void main() {
    FragColor = vec4(uLightColor, 1.0);
})";                                                            // NEW: the whole lamp shader

// ── Camera state ────────────────────────────────────────────────────────────
glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);
float yaw   = -90.0f;
float pitch =   0.0f;
float fov   =  45.0f;
float lastX = 0.0f, lastY = 0.0f;
bool  firstMouse = true;
// (viewMode removed)

// ── Helpers (unchanged since First Shaders and Textures) ────────────────────
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }
GLuint loadTexture(const char* path) { /* ... */ }

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

// ── Input ───────────────────────────────────────────────────────────────────
void mouseCallback(GLFWwindow*, double xpos, double ypos) { /* ... unchanged ... */ }
void scrollCallback(GLFWwindow*, double, double yoffset) { /* ... unchanged ... */ }

void processInput(GLFWwindow* window, float dt) {
    glm::vec3 right = glm::normalize(glm::cross(cameraFront, cameraUp));
    glm::vec3 move(0.0f);
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) move += cameraFront;
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) move -= cameraFront;
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) move += right;
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) move -= right;
    if (glm::length(move) > 0.0f)
        cameraPos += glm::normalize(move) * 2.5f * dt;
    // (keys 1, 2, 3 removed)
}

int main() {
    // ── 1–3. Window, GLAD, viewport, input (unchanged) ──────────────────────
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
    glfwSetCursorPosCallback(window, mouseCallback);
    glfwSetScrollCallback(window, scrollCallback);
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → programs
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }
    GLuint lampProgram = makeProgram(vertexShaderSource, lampFragmentShaderSource); // NEW
    if (lampProgram == 0) { glfwTerminate(); return 1; }                           // NEW

    // 4b. Vertex data → VAO + VBO + EBO (unchanged: the cube's 24 vertices, 36 indices)
    float vertices[] = { /* ... as in Transformations + GLM ... */ };
    GLuint indices[]  = { /* ... */ };
    GLuint vao, vbo, ebo;
    // ... glGen*, glBindVertexArray, glBufferData, the two attributes, the EBO ...

    // 4c. Texture + sampler (unchanged; unused until Lighting Maps)
    GLuint texture = loadTexture(ASSET_DIR "wall.jpg");
    if (texture == 0) { glfwTerminate(); return 1; }
    glUseProgram(shaderProgram);
    glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0);   // location −1 for now: ignored

    // 4d. Matrices, depth and colours
    GLint modelLoc      = glGetUniformLocation(shaderProgram, "uModel");
    GLint viewLoc       = glGetUniformLocation(shaderProgram, "uView");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "uProjection");
    glEnable(GL_DEPTH_TEST);
    const float zNear = 0.1f;
    const float zFar  = 100.0f;
    glm::vec3 objectColor(1.0f, 0.5f, 0.31f);                                    // NEW
    glm::vec3 lightColor (1.0f, 1.0f, 1.0f);                                     // NEW
    glUniform3fv(glGetUniformLocation(shaderProgram, "uObjectColor"), 1, glm::value_ptr(objectColor)); // NEW
    glUniform3fv(glGetUniformLocation(shaderProgram, "uLightColor"),  1, glm::value_ptr(lightColor));  // NEW
    glm::vec3 cubePositions[] = {
        glm::vec3( 0.0f,  0.0f,  0.0f),
        glm::vec3( 2.0f,  1.0f, -5.0f),
        glm::vec3(-1.5f, -1.0f, -2.5f),
        glm::vec3(-3.0f,  1.5f, -6.0f),
        glm::vec3( 1.5f, -0.5f, -1.5f),
    };

    glm::vec3 lightPos(1.2f, 1.0f, 0.0f);                                        // NEW
    glUseProgram(lampProgram);                                                   // NEW
    GLint lampModelLoc      = glGetUniformLocation(lampProgram, "uModel");       // NEW
    GLint lampViewLoc       = glGetUniformLocation(lampProgram, "uView");        // NEW
    GLint lampProjectionLoc = glGetUniformLocation(lampProgram, "uProjection");  // NEW
    glUniform3fv(glGetUniformLocation(lampProgram, "uLightColor"), 1, glm::value_ptr(lightColor)); // NEW
    float lastFrame = (float)glfwGetTime();

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        float time = (float)glfwGetTime();
        float dt   = time - lastFrame;
        lastFrame  = time;
        processInput(window, dt);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glm::mat4 view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);
        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        float aspect = height > 0 ? (float)width / (float)height : 1.0f;
        glm::mat4 projection = glm::perspective(glm::radians(fov), aspect, zNear, zFar);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
        glBindVertexArray(vao);

        for (int i = 0; i < 5; ++i) {
            glm::mat4 model = glm::translate(glm::mat4(1.0f), cubePositions[i]);
            model = glm::rotate(model, time * glm::radians(50.0f) + (float)i,
                                glm::vec3(0.5f, 1.0f, 0.0f));
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
            glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
        }

        // NEW: the lamp, the same cube moved to the light and shrunk
        glUseProgram(lampProgram);
        glUniformMatrix4fv(lampViewLoc,       1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(lampProjectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
        glm::mat4 lampModel = glm::translate(glm::mat4(1.0f), lightPos);
        lampModel = glm::scale(lampModel, glm::vec3(0.2f));
        glUniformMatrix4fv(lampModelLoc, 1, GL_FALSE, glm::value_ptr(lampModel));
        glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
        //                                                  <<< end of NEW

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glDeleteTextures(1, &texture);
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);
    glDeleteProgram(lampProgram);                                                // NEW
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "oglLC_soFarRun",
          "Run it: five flat coral cubes spinning, and a small white lamp at the top right that stays still.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglLC_tSee", "What you see"), tx(t, "oglLC_tCause", "Likely cause")]}
        rows={[
          [tx(t, "oglLC_r1", "the cubes are black"), tx(t, "oglLC_r1b", "uObjectColor or uLightColor was never set, so it is (0, 0, 0). Check the spelling, and that the two glUniform3fv calls come while shaderProgram is in use (before glUseProgram(lampProgram)).")],
          [tx(t, "oglLC_r2", "the lamp is black"), tx(t, "oglLC_r2b", "the lamp's uLightColor was set while shaderProgram was in use: glUseProgram(lampProgram) is missing before it.")],
          [tx(t, "oglLC_r3", "the lamp is coral"), tx(t, "oglLC_r3b", "it was drawn with shaderProgram: glUseProgram(lampProgram) is missing in the loop.")],
          [tx(t, "oglLC_r4", "no lamp at all"), tx(t, "oglLC_r4b", "one of the lamp's three matrices never reached lampProgram (sent before glUseProgram(lampProgram), or its location looked up in shaderProgram). An unset matrix is all zeros, every corner becomes (0, 0, 0, 0), and nothing is drawn. Or the camera has turned away: the lamp is at (1.2, 1, 0).")],
          [tx(t, "oglLC_r5", "the lamp is as big as a cube"), tx(t, "oglLC_r5b", "the glm::scale line is missing, or its result was not stored back into lampModel.")],
          [tx(t, "oglLC_r6", "the cubes are pale yellow"), tx(t, "oglLC_r6b", "lightColor is above 1 in some channel (step 3's last row). Set it back to (1, 1, 1).")],
          [tx(t, "oglLC_r7", "the window closes at once, with a shader error"), tx(t, "oglLC_r7b", "a typo in lampFragmentShaderSource; makeProgram prints the compiler's message.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglLC_try",
          "Try it: give each cube its own colour. Make an array glm::vec3 cubeColors[5] next to cubePositions, and in the for loop, before glDrawElements, send cubeColors[i] to uObjectColor (look up its location once, in step 4d). Then make the light change over time: in the loop, set lightColor.r = sin(time * 2.0f) * 0.5f + 0.5f, and send lightColor to both programs every frame (keep both uLightColor locations in variables in step 4d, and call glUseProgram before each send). sin goes from −1 to 1, so × 0.5 + 0.5 keeps it between 0 and 1.")}
      </Callout>

      <Callout type="info" t={t}>
        {tx(t, "oglLC_linearNote",
          "These numbers are linear intensities, not the values a colour picker shows. Multiplying them is physically meaningful only in linear space — a subtlety that returns in the Gamma Correction chapter, where it explains why naive lighting looks too dark.")}
      </Callout>

      {/* ── GOING FURTHER: SPECTRAL ─────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_specTitle2", "Going further: the RGB product is an approximation")}</H2>
      <p>
        {tx(t, "oglLC_specBody",
          "Physically, the multiplication happens at every wavelength, and only afterwards does the eye reduce the result to three numbers:")}
      </p>
      <Equation label={tx(t, "oglLC_eqSpec", "The spectral version of \"light × surface\"")}
        where={[
          [r`E(\lambda)`, tx(t, "oglLC_wE", "the light's power at wavelength λ (its spectrum)")],
          [r`\rho(\lambda)`, tx(t, "oglLC_wRho", "the surface's reflectance at λ: the fraction it sends back, between 0 and 1")],
          [r`s_k(\lambda)`, tx(t, "oglLC_wSk", "the sensitivity of channel k (R, G or B) to wavelength λ")],
          [r`\int \ldots\, d\lambda`, tx(t, "oglLC_wInt", "the sum over all visible wavelengths, 400 to 700 nm")],
        ]}>
        {r`c_k \;=\; \int_{400}^{700} E(\lambda)\,\rho(\lambda)\,s_k(\lambda)\,d\lambda, \qquad k \in \{R, G, B\}`}
      </Equation>
      <p>
        {tx(t, "oglLC_specWhy",
          "The shader instead first reduces E to three numbers L, and ρ to three numbers S, and then multiplies them. The two orders give the same answer only when the spectra are smooth inside each channel's band. Where a light or a surface has sharp peaks, the three numbers forget where inside the band the energy sits, and the shortcut drifts from the truth. With the simplified sensitivities in the figure below:")}
      </p>
      <ul className="list-disc pl-6 space-y-1.5">
        <li>{tx(t, "oglLC_s1", "Coral under daylight: spectral (0.58, 0.31, 0.12), shortcut (0.59, 0.32, 0.12). The largest error is 0.009, invisible.")}</li>
        <li>{tx(t, "oglLC_s2", "Coral under a sodium lamp: spectral (0.67, 0.35, 0.02), shortcut (0.67, 0.21, 0.02). The green channel is off by 0.14: the lamp's one yellow line falls where coral reflects well, and the shortcut does not know that.")}</li>
        <li>{tx(t, "oglLC_s3", "A grey card, ρ = 0.5 at every wavelength, is exact under every light: a constant reflectance comes out of the integral as a plain factor, so multiplying before or after makes no difference.")}</li>
      </ul>
      <SpectrumFigure t={t} />
      <Callout type="info" t={t}>
        {tx(t, "oglLC_specNote",
          "Games and real-time engines accept this approximation almost everywhere; the errors are small for natural light and materials. Film renderers that must match real photographs (and anything simulating prisms, rainbows or fluorescence) render spectrally, carrying many wavelengths per ray.")}
      </Callout>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglLC_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglLC_tMistake", "Mistake"), tx(t, "oglLC_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglLC_e1", "Colours written as 0–255"), tx(t, "oglLC_e1b", "vec3(255, 127, 80) is 255 times too bright and everything turns white. Divide by 255: (1.0, 0.5, 0.31).")],
          [tx(t, "oglLC_e2", "Adding light and surface colours"), tx(t, "oglLC_e2b", "surfaces glow brighter than the light and dark lights no longer darken. Reflection is a product.")],
          [tx(t, "oglLC_e3", "A light with a channel at exactly 0"), tx(t, "oglLC_e3b", "every surface is black in that channel, however bright it is: pure-colour lights look harsh. Real coloured lights keep a little of every channel.")],
          [tx(t, "oglLC_e4", "Lighting the lamp with the object shader"), tx(t, "oglLC_e4b", "the lamp is shaded like any cube and stops looking like a light. Give it its own unlit shader.")],
          [tx(t, "oglLC_e6", "Setting a uniform while the other program is in use"), tx(t, "oglLC_e6b", "glUniform* writes to the program in use, so the value lands in the wrong program and the right one keeps (0, 0, 0). Call glUseProgram first.")],
          [tx(t, "oglLC_e5", "Mixing picker (sRGB) values into lighting maths"), tx(t, "oglLC_e5b", "results come out too dark and hues shift. Convert to linear first (Gamma Correction chapter).")],
        ]}
      />
      <p>
        {tx(t, "oglLC_next",
          "Next, Basic Lighting gives the cube faces a direction, the normal, and makes each face brighter the more it turns toward lightPos. The flat coral cubes get their shape back.")}
      </p>

      <KeyIdeas t={t} id="oglLC" items={[
        "The colour we see is light × surface, one channel at a time.",
        "A surface can only reflect channels the light actually contains.",
        "Light sources get their own simple shader so they are never lit themselves.",
        "Light is a spectrum; three numbers suffice because the eye has three kinds of cone.",
        "Surface colours are fractions in [0, 1]; light colours can exceed 1 when computed in floating point.",
        "The RGB product approximates a per-wavelength product; it is exact for flat reflectances and off for spiky lights like sodium lamps.",
        "Each shader program has its own uniforms. glUniform* writes to the program in use, and a location of −1 is silently ignored.",
      ]} />
    </Article>
  );
}
