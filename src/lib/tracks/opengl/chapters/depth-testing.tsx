"use client";

// OpenGL track — "Depth Testing". Code-along continuation of the five-cube
// camera scene from "Camera & View Matrix": what the depth buffer stores and
// the test step by step (one pixel, three fragments); step 1, breaking the
// test on purpose (no glEnable, no depth clear); the depth function and the
// depth mask, with the interactive figure; step 2, keys 1/2/3 that show the
// texture, the raw depth and the linear distance (why raw depth is nearly
// white); step 3, a twin cube that z-fights, fixed with glPolygonOffset;
// step 4, the twin a hair larger and the near plane 0.1 vs 0.001 (depth
// steps between two faces); the code-along checkpoint; early depth testing;
// mistakes. The depth values and 24-bit step counts were checked with GLM 1.0.1.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DepthTestFigure } from "@/components/lesson/figures/vulkan/DepthTestFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function DepthTestingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglDepth_intro",
          "In the Transformations chapter, one line made near faces hide far ones: glEnable(GL_DEPTH_TEST). This chapter opens that line up. You will break it on purpose, look at the depth buffer itself, make two surfaces flicker through each other, and see why the near plane matters so much.")}
      </Lead>

      {/* ── WHAT CHANGES ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "oglDepth_alongBody",
          "It continues the main.cpp from the end of the Camera chapter: five spinning cubes and a camera you fly with W A S D and the mouse. There are four steps. Steps 1, 3 and 4 are experiments that you undo afterwards; only step 2 stays in the file. The checkpoint at the end shows the whole file.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglDepth_along1", "Step 1: break the depth test on purpose, two ways, and put it back.")}</li>
        <li>{tx(t, "oglDepth_along2", "Step 2: keys 1, 2 and 3 switch the picture between the texture, the depth buffer itself, and a readable distance.")}</li>
        <li>{tx(t, "oglDepth_along3", "Step 3: a twin cube in exactly the same place makes the two flicker through each other (z-fighting); glPolygonOffset fixes it.")}</li>
        <li>{tx(t, "oglDepth_along4", "Step 4: the twin moves a hair outward, and you watch the depth buffer run out of precision as you walk away and as the near plane shrinks.")}</li>
      </ol>

      {/* ── WHAT IT STORES ──────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_storesTitle", "What the depth buffer stores")}</H2>
      <p>
        {tx(t, "oglDepth_stores1",
          "Next to the colour buffer, the window has a second image of the same size: the depth buffer. It holds one number per pixel, between 0.0 (on the near plane) and 1.0 (on the far plane). GLFW asks for 24 bits per number by default, so each pixel can store one of 2²⁴ ≈ 16.8 million values.")}
      </p>
      <p>
        {tx(t, "oglDepth_stores2",
          "Where does a fragment's depth come from? The Transformations chapter followed a corner through the perspective divide to NDC, where z runs from −1 (near plane) to +1 (far plane). The rasterizer interpolates that z across the triangle, then maps it to 0 to 1: depth = (z_ndc + 1) / 2. A fragment shader can read the result as gl_FragCoord.z.")}
      </p>
      <p>
        {tx(t, "oglDepth_stores3",
          "Each frame, glClear with GL_DEPTH_BUFFER_BIT sets every pixel to 1.0, the farthest value. Then the depth test does this for each fragment:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglDepth_algo1", "Compare the fragment's depth with the number stored at its pixel.")}</li>
        <li>{tx(t, "oglDepth_algo2", "If it is smaller (nearer), the fragment passes. Its colour is written, and its depth replaces the stored one.")}</li>
        <li>{tx(t, "oglDepth_algo3", "Otherwise it is thrown away, and neither buffer changes.")}</li>
      </ol>
      <p>
        {tx(t, "oglDepth_worked1",
          "Follow one pixel at the centre of the window, with the camera at its start position (3 units in front of cube 0). Three fragments land on it, in this order:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_tFrag", "Fragment"), tx(t, "oglDepth_tItsDepth", "Its depth"), tx(t, "oglDepth_tBefore", "Stored before"), tx(t, "oglDepth_tResult", "Result"), tx(t, "oglDepth_tAfter", "Stored after")]}
        rows={[
          [tx(t, "oglDepth_wf1", "cube 0's back face, 3.5 units away"), "0.9724", "1.0000", tx(t, "oglDepth_wr1", "passes: 0.9724 < 1"), "0.9724"],
          [tx(t, "oglDepth_wf2", "cube 0's front face, 2.5 units away"), "0.9610", "0.9724", tx(t, "oglDepth_wr2", "passes: nearer, overwrites the back face"), "0.9610"],
          [tx(t, "oglDepth_wf3", "a face of another cube, 7.5 units away"), "0.9877", "0.9610", tx(t, "oglDepth_wr3", "fails: farther, thrown away"), "0.9610"],
        ]}
      />
      <p>
        {tx(t, "oglDepth_worked2",
          "The pixel ends up showing the front face, the nearest one. Try the three in any other order: the result is the same. That is the whole point. Without the test, the last fragment would win, and the picture would depend on the order of the draw calls.")}
      </p>

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_s1Title", "Step 1: break it on purpose")}</H2>
      <p>
        {tx(t, "oglDepth_s1a",
          "The quickest way to understand a switch is to turn it off. Two experiments; undo each one before the next.")}
      </p>
      <H3>{tx(t, "oglDepth_s1aTitle", "1a. No depth test")}</H3>
      <p>{tx(t, "oglDepth_s1aBody", "In step 4d, comment out the line that turns the test on:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`// glEnable(GL_DEPTH_TEST);`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s1aRun",
          "Run it: the cubes look inside-out. Each pixel shows whatever was drawn last. A back face drawn after a front face covers it, and a far cube drawn after a near one covers it too. Turn the camera around: it does not help, because the order of the draw calls decides, not the distance.")}
      </Callout>
      <H3>{tx(t, "oglDepth_s1bTitle", "1b. No depth clear")}</H3>
      <p>{tx(t, "oglDepth_s1bBody", "Put glEnable back. Now remove the depth part of glClear, in the render loop:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5)" t={t}>{`glClear(GL_COLOR_BUFFER_BIT);   // GL_DEPTH_BUFFER_BIT removed`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s1bRun",
          "Run it. Depending on the driver, the cubes vanish at once (a depth buffer that was never cleared can hold anything), or they appear and then get eaten away as they spin. Each pixel now remembers the nearest depth it has ever seen, across all frames. Only fragments nearer still get through; everywhere else you see the background, because the colour is still cleared. Walk backwards with S and everything disappears: every surface is now farther than what the buffer remembers. Walk forward and the cubes come back.")}
      </Callout>
      <p>{tx(t, "oglDepth_s1c", "Put GL_DEPTH_BUFFER_BIT back before going on.")}</p>

      {/* ── DEPTH FUNC ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_funcTitle", "The depth function")}</H2>
      <p>
        {tx(t, "oglDepth_funcBody",
          "glDepthFunc chooses the comparison in the first line of the test. The default, GL_LESS, is \"smaller passes\", as above. Like glEnable, it is a setting that stays until you change it, so it is called once, in step 4.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_h0", "Function"), tx(t, "oglDepth_h1", "Passes when"), tx(t, "oglDepth_h2", "Used for")]}
        rows={[
          ["GL_LESS",    tx(t, "oglDepth_f1", "New depth is closer"),           tx(t, "oglDepth_u1", "The default. Normal opaque geometry.")],
          ["GL_LEQUAL",  tx(t, "oglDepth_f2", "New depth is closer or equal"),  tx(t, "oglDepth_u2", "Skyboxes drawn last at depth 1.0; multi-pass rendering.")],
          ["GL_ALWAYS",  tx(t, "oglDepth_f3", "Always"),                        tx(t, "oglDepth_u3", "Effectively disables the test but keeps depth writes.")],
          ["GL_GREATER", tx(t, "oglDepth_f4", "New depth is farther"),          tx(t, "oglDepth_u4", "Reversed-Z setups, and some occlusion tricks.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_funcTry",
          "Try it: add glDepthFunc(GL_GREATER); right after glEnable(GL_DEPTH_TEST). The window shows only the background. Every depth is below the cleared 1.0, so none is greater, and nothing passes. Then try GL_ALWAYS: the inside-out look of step 1a is back, because every fragment passes and the last one drawn wins. Remove the line afterwards; GL_LESS is the default.")}
      </Callout>

      {/* ── DEPTH MASK ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_maskTitle", "Testing versus writing: glDepthMask")}</H2>
      <p>
        {tx(t, "oglDepth_mask1",
          "A fragment that passes does two things: it writes its colour, and it writes its depth. glDepthMask(GL_FALSE) switches off the second one. The test still runs against what is already stored, but the stored depths no longer change.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_mH0", "Setting"), tx(t, "oglDepth_mH1", "Test runs?"), tx(t, "oglDepth_mH2", "Depth written?")]}
        rows={[
          [<IC key="1">{"glEnable(GL_DEPTH_TEST)"}</IC>, tx(t, "oglDepth_m1a", "yes"), tx(t, "oglDepth_m1b", "yes, when the fragment passes")],
          [<IC key="2">{"+ glDepthMask(GL_FALSE)"}</IC>, tx(t, "oglDepth_m2a", "yes"), tx(t, "oglDepth_m2b", "no")],
          [<IC key="3">{"+ glDepthFunc(GL_ALWAYS)"}</IC>, tx(t, "oglDepth_m3a", "every fragment passes"), tx(t, "oglDepth_m3b", "yes")],
          [<IC key="4">{"glDisable(GL_DEPTH_TEST)"}</IC>, tx(t, "oglDepth_m4a", "no"), tx(t, "oglDepth_m4b", "no: turning the test off also stops the writes")],
        ]}
      />
      <p>
        {tx(t, "oglDepth_mask2",
          "Why would you test but not write? For see-through things, like glass. Glass must be hidden by solid objects in front of it, so it is tested. But it must not hide what is behind it, or a window pane drawn first would block everything seen through it. So it does not write depth. The Blending & Transparency chapter does this for real; the order looks like this:")}
      </p>
      <CodeBlock lang="cpp" filename="depth_mask.cpp" t={t}>{`// 1. Solid objects: test and write
glDepthMask(GL_TRUE);
drawOpaque();

// 2. See-through objects: test against the solid ones, but do not write
glDepthMask(GL_FALSE);
drawTransparent();
glDepthMask(GL_TRUE);    // restore it before the next glClear`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglDepth_maskWarn",
          "glDepthMask also applies to glClear. With the mask off, glClear(GL_DEPTH_BUFFER_BIT) does nothing, and you get the eaten-away cubes of step 1b. That is why the last line turns writing back on.")}
      </Callout>
      <p>
        {tx(t, "oglDepth_figIntro",
          "The figure runs the test on a tiny 32 × 20 window, one cell per pixel. Two triangles cross each other, so no drawing order is right on its own. Untick the switches, change the function and the clear value, and check each rule of this section.")}
      </p>

      <DepthTestFigure t={t} api="gl" />

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_s2Title", "Step 2: look at the depth buffer")}</H2>
      <p>
        {tx(t, "oglDepth_s2a",
          "The depth buffer is never shown on screen, but the fragment shader can paint a fragment's depth as a colour: 0.0 black, 1.0 white. Replace the fragment shader with this one. It has three modes, chosen by a new uniform:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (replaces fragmentShaderSource)" t={t}>{`const char* fragmentShaderSource = R"(#version 460 core
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
uniform int   uViewMode;   // 0 = texture, 1 = raw depth, 2 = distance
uniform float uNear;       // the projection's near and far planes
uniform float uFar;

// depth (0..1) back to the distance in front of the camera, in world units
float linearDepth(float depth) {
    float ndc = depth * 2.0 - 1.0;                   // 0..1 back to -1..1
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
}

void main() {
    if (uViewMode == 1) {
        FragColor = vec4(vec3(gl_FragCoord.z), 1.0);   // raw depth as grey
    } else if (uViewMode == 2) {
        float d = linearDepth(gl_FragCoord.z);
        FragColor = vec4(vec3(d / 10.0), 1.0);         // 0 units black, 10 or more white
    } else {
        FragColor = texture(uTexture, TexCoord);
    }
})";`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglDepth_tLine", "Line"), tx(t, "oglDepth_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"uniform int uViewMode"}</IC>, tx(t, "oglDepth_l1", "which picture to draw. An int uniform is sent with glUniform1i.")],
          [<IC key="2">{"gl_FragCoord.z"}</IC>, tx(t, "oglDepth_l2", "this fragment's depth, 0 to 1: the very number the depth test compares.")],
          [<IC key="3">{"vec4(vec3(x), 1.0)"}</IC>, tx(t, "oglDepth_l3", "vec3(x) repeats x three times, so red = green = blue: a shade of grey.")],
          [<IC key="4">{"linearDepth"}</IC>, tx(t, "oglDepth_l4", "undoes the projection and gives the distance from the camera; the formula is explained below.")],
          [<IC key="5">{"d / 10.0"}</IC>, tx(t, "oglDepth_l5", "squeezes 0 to 10 units into 0 to 1. Colours above 1 are clamped, so anything 10 units or farther is white.")],
        ]}
      />
      <p>
        {tx(t, "oglDepth_s2b",
          "The mode lives in the camera state, at file scope, and three keys set it. Add the keys to processInput:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (camera state, and processInput)" t={t}>{`int viewMode = 0;   // camera state: 0 texture, 1 raw depth, 2 distance

// in processInput, under the W A S D lines:
if (glfwGetKey(window, GLFW_KEY_1) == GLFW_PRESS) viewMode = 0;
if (glfwGetKey(window, GLFW_KEY_2) == GLFW_PRESS) viewMode = 1;
if (glfwGetKey(window, GLFW_KEY_3) == GLFW_PRESS) viewMode = 2;`}</CodeBlock>
      <p>
        {tx(t, "oglDepth_s2c",
          "The shader needs the near and far planes, and so does the projection. Give them names in step 4d, so both use the same numbers. The program is still in use from step 4c, so the two glUniform1f calls go to it. A uniform keeps its value until it is set again, so near and far are sent once, here:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`const float zNear = 0.1f;     // the near and far planes, now with names
const float zFar  = 100.0f;
glUniform1f(glGetUniformLocation(shaderProgram, "uNear"), zNear);
glUniform1f(glGetUniformLocation(shaderProgram, "uFar"),  zFar);
GLint viewModeLoc = glGetUniformLocation(shaderProgram, "uViewMode");`}</CodeBlock>
      <p>{tx(t, "oglDepth_s2d", "In the render loop, the projection uses the names, and the mode is sent every frame, after glUseProgram:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5)" t={t}>{`glm::mat4 projection = glm::perspective(glm::radians(fov), aspect, zNear, zFar);
// ... glUseProgram(shaderProgram); the view and projection uniforms ...
glUniform1i(viewModeLoc, viewMode);`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s2Run",
          "Run it and press 2. Almost everything is nearly white. Cube 0, 3 units away, is about 0.968; a cube 8 units away is about 0.988. You can barely tell them apart. Press 1 to get the texture back.")}
      </Callout>

      <H3>{tx(t, "oglDepth_whyWhiteTitle", "Why is it almost white?")}</H3>
      <p>
        {tx(t, "oglDepth_whyWhite1",
          "Because depth is not proportional to distance. The perspective projection turns a distance d into NDC depth like this:")}
      </p>
      <Equation label={tx(t, "oglDepth_eqLabel", "Where a distance ends up in the depth buffer")}
        where={[
          [String.raw`d`, tx(t, "oglDepth_wD", "the distance in front of the camera (view-space −z), in world units")],
          [String.raw`n,\ f`, tx(t, "oglDepth_wNF", "the near and far planes: zNear and zFar")],
          [String.raw`z_{\text{ndc}}`, tx(t, "oglDepth_wNdc", "the depth after the perspective divide, −1 to +1")],
          [String.raw`z_{\text{buffer}}`, tx(t, "oglDepth_wBuf", "what is stored, 0 to 1: gl_FragCoord.z")],
        ]}>
        {String.raw`z_{\text{ndc}}(d) \;=\; \frac{f+n}{f-n} \;-\; \frac{2fn}{(f-n)\,d}
\qquad
z_{\text{buffer}} = \frac{z_{\text{ndc}} + 1}{2}`}
      </Equation>
      <p>
        {tx(t, "oglDepth_whyWhite2",
          "The first fraction is a constant. The second has d in the denominator: depth follows 1 / d, not d. Near the camera, 1 / d changes fast; far away it hardly changes at all. With zNear = 0.1 and zFar = 100:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_tDist", "Distance d"), tx(t, "oglDepth_tDepth", "Stored depth")]}
        rows={[
          ["0.1 (near plane)", "0.0000"],
          ["0.2", "0.5005"],
          ["0.5", "0.8008"],
          ["1", "0.9009"],
          ["3", "0.9676"],
          ["8", "0.9885"],
          ["30", "0.9977"],
          ["100 (far plane)", "1.0000"],
        ]}
      />
      <p>
        {tx(t, "oglDepth_whyWhite3",
          "Half of all depth values are used up between 0.1 and 0.2: the first 10 centimetres in front of the camera, if a unit is a metre. Everything from 1 unit to 100 shares the top tenth. That is the price of perspective: it spends precision where things look big, near the camera. Step 4 shows where that hurts.")}
      </p>

      <H3>{tx(t, "oglDepth_linTitle", "Mode 3: the distance back")}</H3>
      <p>
        {tx(t, "oglDepth_lin1",
          "linearDepth solves the formula above for d. First (depth × 2 − 1) undoes the map to 0..1, then:")}
      </p>
      <Equation label={tx(t, "oglDepth_linLabel", "Undoing it: linearized depth")}
        glsl="float d = (2.0 * n * f) / (f + n - ndc * (f - n));">
        {String.raw`d \;=\; \frac{2nf}{f + n - z_{\text{ndc}}\,(f - n)}`}
      </Equation>
      <p>
        {tx(t, "oglDepth_lin2",
          "Check it with cube 0's centre, 3 units away. Stored depth 0.9676 gives ndc = 0.9353. The denominator is 100.1 − 0.9353 × 99.9 = 6.667, and 2 × 0.1 × 100 = 20, so d = 20 / 6.667 = 3.0. The 3 units are back.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s2Run3",
          "Press 3. Now the shade follows the distance: cube 0 is dark grey (3 / 10 = 0.3), the cubes behind it lighter, and anything 10 units or farther white. Walk with W and S and watch the cubes darken as you get closer.")}
      </Callout>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_s3Title", "Step 3: z-fighting on purpose")}</H2>
      <p>
        {tx(t, "oglDepth_s3a",
          "What if two surfaces are in exactly the same place? To find out, draw a twin of cube 0. Same position, same spin, plus a quarter turn about its own z axis. A cube turned a quarter turn fills the same space, so every face of the twin lies exactly on a face of cube 0. But its texture is turned too, so its bricks run the other way. Add this after the for loop:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, after the cube loop)" t={t}>{`// Experiment: a twin of cube 0, a quarter turn about its own z axis
glm::mat4 twin = glm::translate(glm::mat4(1.0f), cubePositions[0]);
twin = glm::rotate(twin, time * glm::radians(50.0f), glm::vec3(0.5f, 1.0f, 0.0f));
twin = glm::rotate(twin, glm::radians(90.0f), glm::vec3(0.0f, 0.0f, 1.0f));
glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(twin));
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglDepth_tLine", "Line"), tx(t, "oglDepth_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"translate, rotate(time …)"}</IC>, tx(t, "oglDepth_t1", "exactly cube 0's model matrix. In the loop, cube 0 adds (float)i = 0 to the angle, so the angles match.")],
          [<IC key="2">{"rotate(90°, z)"}</IC>, tx(t, "oglDepth_t2", "the quarter turn. It is the last rotate in the code, so it acts first, on the cube's own axes.")],
          [<IC key="3">{"glDrawElements"}</IC>, tx(t, "oglDepth_t3", "the same VAO and the same 36 indices; only the model matrix differs.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s3Run",
          "Run it: cube 0 is covered in shimmering patches, some with level bricks, some with upright ones, changing every frame as it spins. That is z-fighting.")}
      </Callout>
      <p>
        {tx(t, "oglDepth_s3b",
          "In theory the two faces have the same depth at every pixel, and GL_LESS would keep the first one. In practice, each cube's depths are computed separately, with float rounding. In float, cos 90° is −0.0000000437, not 0. And each face is split into two triangles along a diagonal, which is not the same diagonal on the turned twin. So at each pixel the two depths differ in their last bits, sometimes one way, sometimes the other. The winner changes from pixel to pixel and frame to frame.")}
      </p>
      <H3>{tx(t, "oglDepth_offsetTitle", "The fix for surfaces that must touch: polygon offset")}</H3>
      <p>
        {tx(t, "oglDepth_offset1",
          "Sometimes surfaces really must lie on top of each other: a poster on a wall, a bullet hole, a road painted on the ground. Polygon offset leaves the geometry where it is, but shifts the depth used by the test. Wrap the twin's draw call:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, around the twin's draw call)" t={t}>{`glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(-1.0f, -1.0f);    // pull the twin's depth slightly toward the camera
glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
glDisable(GL_POLYGON_OFFSET_FILL);`}</CodeBlock>
      <Equation label={tx(t, "oglDepth_offsetLabel", "What glPolygonOffset(factor, units) adds to each depth")}
        where={[
          [String.raw`m`, tx(t, "oglDepth_offM", "how steeply the polygon's depth changes from one pixel to the next. A face seen edge-on is steep; a face looking straight at the camera is flat (m = 0).")],
          [String.raw`r`, tx(t, "oglDepth_offR", "the smallest step the depth buffer can store: 1 / 2²⁴ with 24 bits.")],
          [String.raw`\text{factor},\ \text{units}`, tx(t, "oglDepth_offFU", "the two arguments. Negative values pull toward the camera.")],
        ]}
        note={tx(t, "oglDepth_offNote", "Why two terms? On a steep face, neighbouring pixels differ a lot in depth, so one fixed step is not enough; the slope term grows with the steepness. On a flat face the slope term is 0, and the one step from units still separates the two.")}>
        {String.raw`\text{offset} \;=\; \text{factor} \cdot m \;+\; \text{units} \cdot r`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s3Run2",
          "Run it: the shimmering is gone. The twin now wins at every pixel, so cube 0 shows only the turned bricks. GL_POLYGON_OFFSET_FILL is turned off right after the draw, so the other cubes are not shifted.")}
      </Callout>

      {/* ── STEP 4 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_s4Title", "Step 4: precision runs out with distance")}</H2>
      <p>
        {tx(t, "oglDepth_s4a",
          "In real scenes, z-fighting is rarely about surfaces in exactly the same place. It is about surfaces very close together, far from the camera. Remove the polygon offset: the glEnable and glPolygonOffset lines before the twin's draw call, and the glDisable after it. Instead, make the twin a hair larger, with one more line after its rotates:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, the twin)" t={t}>{`twin = glm::scale(twin, glm::vec3(1.001f));   // each face 0.0005 outside cube 0's`}</CodeBlock>
      <p>
        {tx(t, "oglDepth_s4b",
          "The cube's corners are at ±0.5, so the twin's are at ±0.5005: each twin face sits 0.0005 units in front of a face of cube 0. That is half a millimetre, if a unit is a metre. It is a real gap now, not rounding.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s4Run1",
          "Run it: clean, the twin wins everywhere. Now walk backwards with S, keeping cube 0 in view. When it gets small, scroll to zoom in: zoom changes the field of view, not the distance, so it does not change the depth. At around 30 units the shimmering comes back.")}
      </Callout>
      <p>
        {tx(t, "oglDepth_s4c",
          "Why at 30? The depth buffer has a fixed number of steps, and step 2 showed that far away they are spread thin. The table counts how many of the 16.8 million steps lie between cube 0's face and the twin's, at different distances. Below about 1 step, the buffer cannot tell the two apart:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_tDist", "Distance d"), tx(t, "oglDepth_tNear01", "Steps, zNear = 0.1"), tx(t, "oglDepth_tNear0001", "Steps, zNear = 0.001")]}
        rows={[
          ["3", tx(t, "oglDepth_st1", "93: clean"), tx(t, "oglDepth_st1b", "0 or 1: flickers")],
          ["8", tx(t, "oglDepth_st2", "13: clean"), tx(t, "oglDepth_st2b", "0: flickers")],
          ["20", tx(t, "oglDepth_st3", "2: almost gone"), tx(t, "oglDepth_st3b", "0: flickers")],
          ["30", tx(t, "oglDepth_st4", "0 or 1: flickers"), tx(t, "oglDepth_st4b", "0: flickers")],
        ]}
      />
      <Equation label={tx(t, "oglDepth_resLabel", "The smallest gap the depth buffer can see at distance d")}
        where={[
          [String.raw`d^2`, tx(t, "oglDepth_resD", "the square of the distance: twice as far, four times coarser")],
          [String.raw`n`, tx(t, "oglDepth_resN", "the near plane. It divides: a larger near plane gives a finer depth buffer everywhere")],
          [String.raw`2^{24}`, tx(t, "oglDepth_resBits", "the number of steps in a 24-bit depth buffer")],
        ]}
        note={tx(t, "oglDepth_resNote", "The far plane hardly appears: as long as it is much larger than the near plane, moving it changes little. This comes from the 1 / d in the depth formula.")}>
        {String.raw`\Delta d \;\approx\; \frac{d^2}{n \cdot 2^{24}}`}
      </Equation>
      <p>
        {tx(t, "oglDepth_s4d",
          "Worked: at d = 30 with n = 0.1, Δd = 900 / (0.1 × 16 777 216) ≈ 0.00054. That is just above the 0.0005 gap: the buffer can no longer separate the faces. At d = 3 it is 9 / 1 677 722 ≈ 0.0000054, a hundred times finer than the gap.")}
      </p>
      <p>{tx(t, "oglDepth_s4e", "Now shrink the near plane in step 4d:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`const float zNear = 0.001f;   // experiment: 100 times smaller`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglDepth_s4Run2",
          "Run it: the shimmering is back right at the start, 3 units away. Dividing the near plane by 100 made Δd 100 times larger everywhere: at d = 3 it is now 0.00054. Press 2 too: the picture is even whiter, since the steep part of the curve is now crammed into the first millimetres.")}
      </Callout>
      <p>
        {tx(t, "oglDepth_s4f",
          "Put zNear back to 0.1f, then delete the twin: all its lines, from the comment to its glDrawElements. Step 2's view modes stay. When surfaces flicker in a real scene, these are the fixes, best first:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_z0", "Fix"), tx(t, "oglDepth_z1", "Effect")]}
        rows={[
          [tx(t, "oglDepth_zf1", "Push the near plane out"), tx(t, "oglDepth_ze1", "By far the biggest win: Δd shrinks in proportion. 0.1 instead of 0.001 is 100 times finer. Use the largest near plane the scene allows.")],
          [tx(t, "oglDepth_zf2", "Pull the far plane in"),   tx(t, "oglDepth_ze2", "Helps much less, as the formula shows. Do not obsess over it.")],
          [tx(t, "oglDepth_zf3", "Separate the geometry"),   tx(t, "oglDepth_ze3", "Do not model surfaces on top of each other. When they must touch (decals), use polygon offset, as in step 3.")],
          [tx(t, "oglDepth_zf4", "Use a 32-bit depth buffer"), tx(t, "oglDepth_ze4", "More steps. Costs memory and bandwidth, and the window may not offer one; framebuffers (a later chapter) can.")],
          [tx(t, "oglDepth_zf5", "Reversed-Z"),              tx(t, "oglDepth_ze5", "Store near as 1.0 and far as 0.0, in a float depth buffer, with GL_GREATER. Floats are densest near 0, which now cancels the 1 / d crowding. The result is almost even precision at every distance.")],
        ]}
      />

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglDepth_soFarBody",
          "The whole file after step 4, with the experiments undone. Compared with the Camera version, the changes are marked NEW: the fragment shader's view modes, viewMode in the camera state, three keys in processInput, zNear and zFar with their uniforms in step 4d, and two lines in the render loop. The helpers and the vertex data are shortened because they did not change.")}
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
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
uniform int   uViewMode;                                        // NEW
uniform float uNear;                                            // NEW
uniform float uFar;                                             // NEW

float linearDepth(float depth) {                                // NEW
    float ndc = depth * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
}

void main() {
    if (uViewMode == 1) {                                       // NEW
        FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
    } else if (uViewMode == 2) {                                // NEW
        float d = linearDepth(gl_FragCoord.z);
        FragColor = vec4(vec3(d / 10.0), 1.0);
    } else {
        FragColor = texture(uTexture, TexCoord);
    }
})";

// ── Camera state ────────────────────────────────────────────────────────────
glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);
float yaw   = -90.0f;
float pitch =   0.0f;
float fov   =  45.0f;
float lastX = 0.0f, lastY = 0.0f;
bool  firstMouse = true;
int   viewMode = 0;            // NEW: 0 texture, 1 raw depth, 2 distance

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

    if (glfwGetKey(window, GLFW_KEY_1) == GLFW_PRESS) viewMode = 0;   // NEW
    if (glfwGetKey(window, GLFW_KEY_2) == GLFW_PRESS) viewMode = 1;   // NEW
    if (glfwGetKey(window, GLFW_KEY_3) == GLFW_PRESS) viewMode = 2;   // NEW
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
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO (unchanged: the cube's 24 vertices, 36 indices)
    float vertices[] = { /* ... as in Transformations + GLM ... */ };
    GLuint indices[]  = { /* ... */ };
    GLuint vao, vbo, ebo;
    // ... glGen*, glBindVertexArray, glBufferData, the two attributes, the EBO ...

    // 4c. Texture + sampler (unchanged)
    GLuint texture = loadTexture(ASSET_DIR "wall.jpg");
    if (texture == 0) { glfwTerminate(); return 1; }
    glUseProgram(shaderProgram);
    glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0);

    // 4d. Matrices and depth
    GLint modelLoc      = glGetUniformLocation(shaderProgram, "uModel");
    GLint viewLoc       = glGetUniformLocation(shaderProgram, "uView");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "uProjection");
    glEnable(GL_DEPTH_TEST);
    const float zNear = 0.1f;                                            // NEW
    const float zFar  = 100.0f;                                          // NEW
    glUniform1f(glGetUniformLocation(shaderProgram, "uNear"), zNear);    // NEW
    glUniform1f(glGetUniformLocation(shaderProgram, "uFar"),  zFar);     // NEW
    GLint viewModeLoc = glGetUniformLocation(shaderProgram, "uViewMode"); // NEW
    glm::vec3 cubePositions[] = {
        glm::vec3( 0.0f,  0.0f,  0.0f),
        glm::vec3( 2.0f,  1.0f, -5.0f),
        glm::vec3(-1.5f, -1.0f, -2.5f),
        glm::vec3(-3.0f,  1.5f, -6.0f),
        glm::vec3( 1.5f, -0.5f, -1.5f),
    };
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
        glm::mat4 projection = glm::perspective(glm::radians(fov), aspect, zNear, zFar); // NEW: names

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
        glUniform1i(viewModeLoc, viewMode);                              // NEW
        glBindVertexArray(vao);

        for (int i = 0; i < 5; ++i) {
            glm::mat4 model = glm::translate(glm::mat4(1.0f), cubePositions[i]);
            model = glm::rotate(model, time * glm::radians(50.0f) + (float)i,
                                glm::vec3(0.5f, 1.0f, 0.0f));
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
            glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
        }

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
        {tx(t, "oglDepth_soFarRun",
          "Run it: the camera scene of the last chapter, plus three keys. 1 shows the texture, 2 the raw depth buffer, 3 the distance from the camera.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_tSee", "What you see"), tx(t, "oglDepth_tCause", "Likely cause")]}
        rows={[
          [tx(t, "oglDepth_r1", "the cubes look inside-out"), tx(t, "oglDepth_r1b", "glEnable(GL_DEPTH_TEST) is missing, or glDepthFunc(GL_ALWAYS) was left in.")],
          [tx(t, "oglDepth_r2", "the cubes get eaten away, and walking back hides everything"), tx(t, "oglDepth_r2b", "glClear lacks GL_DEPTH_BUFFER_BIT, or glDepthMask(GL_FALSE) was left on (it blocks the clear too).")],
          [tx(t, "oglDepth_r3", "only the background"), tx(t, "oglDepth_r3b", "glDepthFunc(GL_GREATER) was left in, or the depth is cleared to 0.0 (glClearDepth).")],
          [tx(t, "oglDepth_r4", "key 2 shows almost pure white"), tx(t, "oglDepth_r4b", "nothing is wrong: perspective depth is close to 1 for everything past the first unit. Press 3.")],
          [tx(t, "oglDepth_r5", "key 3 shows everything black"), tx(t, "oglDepth_r5b", "uNear and uFar were never sent, so they are 0, and 2 × 0 × 0 = 0. The glUniform1f calls must come after glUseProgram, with the names spelled as in the shader.")],
          [tx(t, "oglDepth_r6", "the keys do nothing"), tx(t, "oglDepth_r6b", "glUniform1i(viewModeLoc, viewMode) is missing from the loop, or \"uViewMode\" is misspelled, so viewModeLoc is −1.")],
          [tx(t, "oglDepth_r7", "far surfaces flicker through each other"), tx(t, "oglDepth_r7b", "the near plane is too small; zNear should be 0.1f.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_try",
          "Try it: add a mode 4 on key 4 that draws rings of distance. In the shader: FragColor = vec4(vec3(fract(linearDepth(gl_FragCoord.z))), 1.0). fract keeps only the part after the decimal point, so the shade climbs from black to white once per unit of distance and starts again. Each cube gets stripes, one per unit away from the camera. Then change zFar to 1000 and check with mode 2 how little it changes.")}
      </Callout>

      {/* ── EARLY DEPTH TESTING ─────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_earlyTitle", "Going further: early depth testing")}</H2>
      <p>
        {tx(t, "oglDepth_earlyPre",
          "This section is for later. It mentions discard, the stencil test and SSBOs, which come in later chapters; come back to it when performance starts to matter.")}
      </p>
      <p>
        {tx(t, "oglDepth_earlyBody",
          "The pipeline diagram puts the depth test after the fragment shader, and that is its official place. Real GPUs run it earlier when they can prove the result would be the same: a fragment that is already hidden is thrown away before its shader runs, so hidden surfaces cost almost nothing. This early-Z is the reason opaque objects are drawn roughly front to back. The near ones fill the depth buffer first, and most of what lies behind them is rejected unshaded. Three things in a fragment shader weaken or disable it:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_eH0", "Shader does"), tx(t, "oglDepth_eH1", "Effect on early-Z"), tx(t, "oglDepth_eH2", "Why")]}
        rows={[
          [tx(t, "oglDepth_e1", "writes gl_FragDepth"), tx(t, "oglDepth_e1b", "disabled"), tx(t, "oglDepth_e1c", "the real depth is only known after the shader has run")],
          [tx(t, "oglDepth_e2", "uses discard"), tx(t, "oglDepth_e2b", "weakened"), tx(t, "oglDepth_e2c", "the test can run early, but the depth write must wait until the shader decides whether the fragment survives")],
          [tx(t, "oglDepth_e3", "writes to images or SSBOs"), tx(t, "oglDepth_e3b", "disabled by default"), tx(t, "oglDepth_e3c", "skipping the shader would also skip its side effects")],
        ]}
      />
      <p>
        {tx(t, "oglDepth_earlyFix",
          "OpenGL 4.2 added two ways to give the GPU the guarantee it needs. layout(early_fragment_tests) forces the depth and stencil tests to run before the shader; any depth the shader writes is then ignored. Conservative depth keeps gl_FragDepth writable but promises a direction. depth_greater means the shader only ever pushes the fragment farther away, so with GL_LESS a fragment that already fails at its interpolated depth would fail anyway, and can be rejected early."
        )}
      </p>
      <CodeBlock lang="glsl" filename="early_z.frag" t={t}>{`#version 460 core
// Option 1: run the depth and stencil tests before this shader, always
layout (early_fragment_tests) in;

// Option 2 (instead of option 1): keep writing depth, but promise a direction
// layout (depth_greater) out float gl_FragDepth;   // only ever moves farther
// ...
// gl_FragDepth = gl_FragCoord.z + offset;          // offset >= 0 keeps the promise`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_prepassTip",
          "A depth pre-pass takes early-Z to its limit. First draw the opaque scene with a trivial shader and the colour writes off (glColorMask(GL_FALSE, …)), filling only the depth buffer. Then draw it again with the real shaders and glDepthFunc(GL_LEQUAL) or GL_EQUAL: now every pixel runs its expensive shader exactly once, for the surface that is actually visible. It costs a second geometry pass, so it pays off when fragment shading is expensive."
        )}
      </Callout>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglDepth_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglDepth_tMistake", "Mistake"), tx(t, "oglDepth_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglDepth_x1", "Clearing only the colour"), tx(t, "oglDepth_x1b", "last frame's depths keep rejecting this frame's fragments. Clear with GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT.")],
          [tx(t, "oglDepth_x2", "Leaving glDepthMask(GL_FALSE) on"), tx(t, "oglDepth_x2b", "the next glClear cannot clear the depth either. Turn it back to GL_TRUE after the pass that needed it.")],
          [tx(t, "oglDepth_x3", "glDisable(GL_DEPTH_TEST) to draw everything but keep depth"), tx(t, "oglDepth_x3b", "disabling the test also stops the writes. Keep it enabled with glDepthFunc(GL_ALWAYS).")],
          [tx(t, "oglDepth_x4", "A tiny near plane \"to get close to things\""), tx(t, "oglDepth_x4b", "Δd grows in proportion: 0.001 instead of 0.1 makes the depth buffer 100 times coarser everywhere. Use the largest near plane the scene allows.")],
          [tx(t, "oglDepth_x5", "Two surfaces modelled on top of each other"), tx(t, "oglDepth_x5b", "they z-fight at any distance. Move one, or draw it with glPolygonOffset.")],
          [tx(t, "oglDepth_x6", "Reading gl_FragCoord.z as a distance"), tx(t, "oglDepth_x6b", "it follows 1 / d, not d: 0.5 is at 0.2 units, not halfway to the far plane. Linearize it first.")],
        ]}
      />
      <p>
        {tx(t, "oglDepth_next",
          "That completes 3D & Transformations. Next, the Lighting section starts with Light & Color: the cubes get a lamp, and the depth test keeps doing its job in the background.")}
      </p>

      <KeyIdeas t={t} id="oglDepth" items={[
        "The depth buffer stores one number per pixel, 0.0 at the near plane and 1.0 at the far plane. glClear sets it to 1.0 every frame.",
        "With GL_LESS, a fragment passes only if it is nearer than what is stored; then it writes its colour and its depth. The order of the draw calls no longer matters.",
        "glDepthFunc picks the comparison; glDepthMask turns depth writes on and off (and also blocks the depth clear). Disabling the test also stops the writes.",
        "Depth follows 1 / d, not d: half the values lie between the near plane and twice the near plane. Linearize it to see distances.",
        "Surfaces in the same place z-fight. When they must touch, glPolygonOffset shifts one's depth without moving it.",
        "The smallest gap the buffer can resolve is about d² / (n · 2²⁴): it grows with the square of the distance and shrinks as the near plane grows.",
        "Fix flickering with the largest near plane the scene allows; the far plane matters much less.",
      ]} />
    </Article>
  );
}
