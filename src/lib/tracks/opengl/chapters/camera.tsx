"use client";

// OpenGL track — "Camera & View Matrix". Code-along continuation of the
// spinning cube from "Transformations + GLM": what the chapter adds to
// main.cpp; glm::lookAt (its three inputs, how it builds right/up/forward,
// the figure, the matrix, a worked camera at (3, 0, 3)); step 1, five cubes
// and a camera circling them; step 2, walking with WASD and delta time;
// step 3, looking around with the mouse (yaw/pitch from two triangles, the
// callback, the first-event guard, the pitch clamp); step 4, zoom with the
// scroll wheel; the code-along checkpoint; tidying up into a Camera class;
// mistakes. The numbers in the worked examples were checked with GLM 1.0.1.

import { CodeBlock, Callout, H2, H3, IC, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CameraLookAtFigure } from "@/components/lesson/figures/CameraLookAtFigure";
import { YawPitchFigure } from "@/components/lesson/figures/YawPitchFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function CameraContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCam_intro",
          "OpenGL has no camera. In the last chapter, the \"camera\" was one line: translate the whole world by (0, 0, −3). This chapter turns that line into a real camera. First it circles the scene on its own. Then you walk with the keyboard, look around with the mouse and zoom with the scroll wheel, like in a first-person game.")}
      </Lead>

      {/* ── WHAT CHANGES ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "oglCam_alongBody",
          "It continues the main.cpp from the end of the Transformations + GLM chapter, in four steps. Run the program after each one; each step says what you should see. The checkpoint at the end shows the whole file.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglCam_along1", "Step 1: five cubes instead of one, and glm::lookAt instead of the fixed translate. The camera circles the cubes by itself.")}</li>
        <li>{tx(t, "oglCam_along2", "Step 2: W, A, S and D move the camera, at the same speed on every computer.")}</li>
        <li>{tx(t, "oglCam_along3", "Step 3: the mouse turns the camera: left and right, up and down.")}</li>
        <li>{tx(t, "oglCam_along4", "Step 4: the scroll wheel zooms in and out.")}</li>
      </ol>

      {/* ── LOOKAT ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_lookatTitle", "glm::lookAt: a camera from a position and a target")}</H2>
      <p>
        {tx(t, "oglCam_lookat1",
          "The view matrix moves the world so that the camera ends up at (0, 0, 0), looking down −z. For a camera that only steps back, a translate is enough. A camera that turns needs the world to turn too. glm::lookAt builds that matrix from three vectors:")}
      </p>
      <CodeBlock lang="cpp" filename="lookat.cpp" t={t}>{`glm::mat4 view = glm::lookAt(
    glm::vec3(0.0f, 0.0f, 3.0f),   // eye:    where the camera stands
    glm::vec3(0.0f, 0.0f, 0.0f),   // center: the point it looks at
    glm::vec3(0.0f, 1.0f, 0.0f));  // up:     which way is up in the world`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCam_tArg", "Argument"), tx(t, "oglCam_tMeaning", "Meaning")]}
        rows={[
          ["eye", tx(t, "oglCam_a1", "the camera's position, in world space.")],
          ["center", tx(t, "oglCam_a2", "a point the camera looks at. A point, not a direction: lookAt computes the direction itself, as center − eye.")],
          ["up", tx(t, "oglCam_a3", "the world's \"up\", almost always (0, 1, 0). It tells lookAt which way to hold the camera, so the horizon stays level.")],
        ]}
      />
      <p>
        {tx(t, "oglCam_lookat2",
          "With these numbers it is the same matrix as last chapter's translate(0, 0, −3), number for number. So you can swap it in and nothing on screen changes. The difference shows up as soon as the camera is not straight in front of the scene.")}
      </p>

      <H3>{tx(t, "oglCam_insideTitle", "What lookAt computes")}</H3>
      <p>
        {tx(t, "oglCam_inside1",
          "lookAt first builds the camera's own three axes, each of length 1, in three lines:")}
      </p>
      <CodeBlock lang="cpp" filename="lookat_inside.cpp" t={t}>{`glm::vec3 forward = glm::normalize(center - eye);               // where the camera faces
glm::vec3 right   = glm::normalize(glm::cross(forward, worldUp)); // to its right
glm::vec3 up      = glm::cross(right, forward);                   // its own up`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCam_tLine", "Line"), tx(t, "oglCam_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"forward"}</IC>, tx(t, "oglCam_i1", "the arrow from the eye to the target, shortened to length 1 by normalize.")],
          [<IC key="2">{"right"}</IC>, tx(t, "oglCam_i2", "the cross product (Vectors chapter) gives a vector at right angles to both forward and the world's up. With forward first, the right-hand rule makes it point to the camera's right.")],
          [<IC key="3">{"up"}</IC>, tx(t, "oglCam_i3", "the camera's own up: at right angles to right and forward. It equals the world's up only when the camera looks level; tilt the camera down and its up tilts forward.")],
        ]}
      />
      <p>
        {tx(t, "oglCam_inside2",
          "Then it puts those axes into a matrix. Drag the figure to watch the three axes being built. The orbit, height and distance sliders move the camera; take it straight above the target and see what happens to right.")}
      </p>

      <CameraLookAtFigure t={t} />

      <Equation label={tx(t, "oglCam_lookatEqLabel", "The LookAt matrix")}
        where={[
          [String.raw`\red{\mathbf{r}}`, tx(t, "oglCam_wR", "right = normalize(cross(forward, worldUp))")],
          [String.raw`\green{\mathbf{u}}`, tx(t, "oglCam_wU", "up = cross(right, forward)")],
          [String.raw`\blue{\mathbf{f}}`, tx(t, "oglCam_wF", "forward = normalize(target − position)")],
          [String.raw`\mathbf{p}`, tx(t, "oglCam_wP", "camera position")],
        ]}
        note={tx(t, "oglCam_lookatEqNote", "Read right to left: first move the world so the camera sits at the origin, then rotate it so the camera's axes line up with x, y and −z. The rotation's rows are the camera's own axes.")}>
        {String.raw`\text{view} \;=\;
\underbrace{\begin{bmatrix} \red{r_x}&\red{r_y}&\red{r_z}&0 \\ \green{u_x}&\green{u_y}&\green{u_z}&0 \\ \blue{-f_x}&\blue{-f_y}&\blue{-f_z}&0 \\ 0&0&0&1 \end{bmatrix}}_{\text{rotate}}
\underbrace{\begin{bmatrix} 1&0&0&-p_x \\ 0&1&0&-p_y \\ 0&0&1&-p_z \\ 0&0&0&1 \end{bmatrix}}_{\text{translate}}`}
      </Equation>
      <p>
        {tx(t, "oglCam_rows",
          "Why the rows? Multiplying a vector by a row is a dot product, and the dot product with a unit axis measures how far the vector goes along that axis. So the first row gives \"how far to the camera's right\", the second \"how far up\". The third row is −forward, not forward, because in view space the camera looks down −z: a point straight ahead must get a negative z.")}
      </p>

      <H3>{tx(t, "oglCam_workedTitle", "Worked example: a camera at (3, 0, 3)")}</H3>
      <p>
        {tx(t, "oglCam_worked1",
          "Put the camera at eye = (3, 0, 3), looking at the origin. It stands to the front-right of the scene and looks diagonally back toward the centre.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCam_tVec", "Vector"), tx(t, "oglCam_tValue", "Value"), tx(t, "oglCam_tWhy", "Why")]}
        rows={[
          ["forward", "(−0.707, 0, −0.707)", tx(t, "oglCam_w1", "center − eye = (−3, 0, −3), divided by its length √18 ≈ 4.243")],
          ["right", "(0.707, 0, −0.707)", tx(t, "oglCam_w2", "cross(forward, (0, 1, 0)), already of length 1")],
          ["up", "(0, 1, 0)", tx(t, "oglCam_w3", "the camera looks level, so its up is the world's up")],
        ]}
      />
      <p>
        {tx(t, "oglCam_worked2",
          "Now send two world points through the view matrix. The origin, the target, lands at (0, 0, −4.243): straight ahead, 4.243 units away, exactly the distance from the eye. The point (3, 0, 0) lands at (2.121, 0, −2.121): to the right of the centre of the view, and 2.121 units in front. From where the camera stands, that point is indeed ahead and to the right.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCam_handedNote",
          "In view space, \"in front of the camera\" means negative z. That minus sign is behind many first bugs: a target in front of the camera has a smaller z than the camera. The projection matrix takes care of it afterwards (it puts −z in w, the distance), so most of the time you do not have to think about it.")}
      </Callout>

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_s1Title", "Step 1: five cubes and a circling camera")}</H2>
      <p>
        {tx(t, "oglCam_s1a",
          "One cube in the middle makes it hard to tell whether the camera moves or the cube does. So first, more cubes: five copies of the same cube, each with its own model matrix (the \"Try it\" of the last chapter). Add the positions in step 4, next to the uniform locations:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 4d)" t={t}>{`glm::vec3 cubePositions[] = {
    glm::vec3( 0.0f,  0.0f,  0.0f),
    glm::vec3( 2.0f,  1.0f, -5.0f),
    glm::vec3(-1.5f, -1.0f, -2.5f),
    glm::vec3(-3.0f,  1.5f, -6.0f),
    glm::vec3( 1.5f, -0.5f, -1.5f),
};`}</CodeBlock>
      <p>
        {tx(t, "oglCam_s1b",
          "In the loop, the single model matrix and draw call become a for loop. The view and projection are sent once, before it, because they are the same for every cube:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, in the render loop)" t={t}>{`// View: the camera circles the origin at a distance of 8, one lap every 12.6 s
const float radius = 8.0f;
float camX = glm::sin(time * 0.5f) * radius;
float camZ = glm::cos(time * 0.5f) * radius;
glm::mat4 view = glm::lookAt(glm::vec3(camX, 0.0f, camZ),     // eye
                             glm::vec3(0.0f, 0.0f, 0.0f),     // center
                             glm::vec3(0.0f, 1.0f, 0.0f));    // up

// ... projection, glUseProgram, view and projection uniforms, glBindVertexArray ...

for (int i = 0; i < 5; ++i) {
    glm::mat4 model = glm::translate(glm::mat4(1.0f), cubePositions[i]);   // acts last: move into place
    model = glm::rotate(model, time * glm::radians(50.0f) + (float)i,      // acts first: spin
                        glm::vec3(0.5f, 1.0f, 0.0f));
    glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
    glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCam_tLine", "Line"), tx(t, "oglCam_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"glm::sin(time * 0.5f) * radius"}</IC>, tx(t, "oglCam_o1", "sin and cos of the same angle trace a circle (as the angle grows, (sin, cos) walks around a circle of radius 1); multiplied by 8, a circle of radius 8 in the x–z plane, the floor. The angle grows by 0.5 radian per second, so one lap (2π) takes 12.6 seconds.")],
          [<IC key="2">{"glm::vec3(0.0f) as center"}</IC>, tx(t, "oglCam_o2", "wherever the camera is on the circle, it keeps looking at the origin, where the first cube is.")],
          [<IC key="3">{"+ (float)i"}</IC>, tx(t, "oglCam_o3", "each cube starts at a different angle (i radians more), so they do not all spin in step.")],
        ]}
      />
      <p>
        {tx(t, "oglCam_s1c",
          "Check one moment: at time = 2 s the angle is 1 radian, so the camera stands at (8 sin 1, 0, 8 cos 1) = (6.732, 0, 4.322), to the front-right of the scene, turned toward the centre.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCam_s1Run",
          "Run it: five spinning cubes, and the view slowly circles around them. The cubes behind pass behind the near ones and come out on the other side. Nothing in the cubes' code changed: only the view matrix moves.")}
      </Callout>

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_s2Title", "Step 2: walking with W, A, S, D")}</H2>
      <p>
        {tx(t, "oglCam_s2a",
          "To steer the camera yourself, it needs a state that lasts between frames: where it is and which way it faces. Store both as vectors, at file scope (outside every function), under the shaders. Step 3 needs the mouse callback to reach them, and a callback cannot see the variables inside main.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (file scope, under the shaders)" t={t}>{`// ── Camera state ─────────────────────────────────────
glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);   // where the camera stands
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);   // the direction it faces (length 1)
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);   // the world's up`}</CodeBlock>
      <p>
        {tx(t, "oglCam_s2b",
          "The view now looks from cameraPos toward cameraPos + cameraFront: the point one unit ahead. This line replaces the circling view of step 1:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5, replaces the circling view)" t={t}>{`glm::mat4 view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);`}</CodeBlock>
      <p>
        {tx(t, "oglCam_s2c",
          "The keys are read by a new function, processInput, written above main (next to framebufferSizeCallback). Each pressed key adds a direction; the sum is the way to go:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (above main)" t={t}>{`void processInput(GLFWwindow* window, float dt) {
    glm::vec3 right = glm::normalize(glm::cross(cameraFront, cameraUp));

    glm::vec3 move(0.0f);
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) move += cameraFront;   // forward
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) move -= cameraFront;   // back
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) move += right;         // right
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) move -= right;         // left

    if (glm::length(move) > 0.0f)
        cameraPos += glm::normalize(move) * 2.5f * dt;   // 2.5 units per second
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCam_tLine", "Line"), tx(t, "oglCam_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"glfwGetKey(window, GLFW_KEY_W)"}</IC>, tx(t, "oglCam_k1", "asks GLFW whether W is held down right now. Asked every frame, so holding the key keeps moving the camera (the Esc check works the same way).")],
          [<IC key="2">{"right"}</IC>, tx(t, "oglCam_k2", "the camera's right, built like inside lookAt. A and D move along it, so \"left\" is always the camera's left, wherever it faces.")],
          [<IC key="3">{"glm::length(move) > 0.0f"}</IC>, tx(t, "oglCam_k3", "no key, or W and S together, gives a zero vector, which normalize cannot handle (it would divide by 0). Then the camera simply stays.")],
          [<IC key="4">{"glm::normalize(move)"}</IC>, tx(t, "oglCam_k4", "W and D together give front + right, of length √2 ≈ 1.414. Without normalize, walking diagonally would be 41% faster.")],
          [<IC key="5">{"2.5f * dt"}</IC>, tx(t, "oglCam_k5", "speed × time = distance. dt is the time the last frame took, in seconds; see below.")],
        ]}
      />
      <H3>{tx(t, "oglCam_dtTitle", "Delta time: the same speed on every computer")}</H3>
      <p>
        {tx(t, "oglCam_dt1",
          "The loop runs once per frame, and with glfwSwapInterval(1) a frame lasts one refresh of the monitor. A 60 Hz monitor runs 60 frames per second, a 144 Hz one 144. Moving a fixed 0.05 units per frame would walk 2.4 times faster on the second (144 / 60). So each frame measures how long the last one took, and moves by speed × that time:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCam_tMonitor", "Monitor"), tx(t, "oglCam_tDt", "dt (seconds)"), tx(t, "oglCam_tStep", "Step per frame"), tx(t, "oglCam_tPerSec", "Per second")]}
        rows={[
          ["60 Hz", "0.0167", "2.5 × 0.0167 = 0.0417", "60 × 0.0417 = 2.5"],
          ["144 Hz", "0.0069", "2.5 × 0.0069 = 0.0174", "144 × 0.0174 = 2.5"],
        ]}
      />
      <p>
        {tx(t, "oglCam_dt2",
          "dt comes from the clock you already read. One variable remembers when the previous frame started. Set it right before the loop, so the first frame's dt is tiny instead of the whole start-up time:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (end of step 4, and the top of the loop)" t={t}>{`float lastFrame = (float)glfwGetTime();   // step 4: just before the loop

// in the loop, right after the Esc check (the time line moves up here from below glClear):
float time = (float)glfwGetTime();
float dt   = time - lastFrame;            // how long the last frame took
lastFrame  = time;
processInput(window, dt);`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglCam_s2Run",
          "Run it: the view starts where the last chapter's did, 3 units in front of the first cube. W walks toward it, S backs away, A and D step sideways. Walk past the cubes and they stay where they are, still spinning. You cannot turn yet: W always goes toward −z.")}
      </Callout>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_s3Title", "Step 3: looking around with the mouse")}</H2>
      <p>
        {tx(t, "oglCam_s3a",
          "To turn, cameraFront must change. Storing a direction vector and turning it directly is awkward. Instead, store two angles and rebuild the vector from them whenever the mouse moves:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCam_tAngle", "Angle"), tx(t, "oglCam_tTurns", "Turns the camera"), tx(t, "oglCam_tMouse", "Driven by")]}
        rows={[
          [tx(t, "oglCam_y1", "yaw"), tx(t, "oglCam_y1b", "left and right, around the world's vertical (y) axis, like shaking your head \"no\""), tx(t, "oglCam_y1c", "moving the mouse sideways")],
          [tx(t, "oglCam_y2", "pitch"), tx(t, "oglCam_y2b", "up and down, like nodding \"yes\""), tx(t, "oglCam_y2c", "moving the mouse forward and back")],
        ]}
      />
      <p>
        {tx(t, "oglCam_eulerSteps",
          "The direction d comes from the two angles through two right triangles, one per angle. Build it in two steps:")}
      </p>

      <Equation label={tx(t, "oglCam_eulerStep1", "Step 1 — pitch, seen from the side")}
        where={[
          [String.raw`\green{y}`, tx(t, "oglCam_eulerWy", "how high d points — the opposite side of the triangle")],
          [String.raw`\amber{h}`, tx(t, "oglCam_eulerWh", "the length left over for the ground plane — the adjacent side")],
        ]}
        note={tx(t, "oglCam_eulerStep1Note", "d has length 1, so it is the hypotenuse of a triangle with hypotenuse 1: its sides are the sine and the cosine of the angle.")}>
        {String.raw`\green{y} = \sin(\text{pitch}) \qquad \amber{h} = \cos(\text{pitch})`}
      </Equation>
      <Equation label={tx(t, "oglCam_eulerStep2", "Step 2 — yaw, seen from above: split h between X and Z")}
        note={tx(t, "oglCam_eulerStep2Note", "Same triangle idea, but the hypotenuse is now h instead of 1 — that is where the extra cos(pitch) in x and z comes from.")}>
        {String.raw`\red{x} = \amber{h}\cos(\text{yaw}) \qquad \blue{z} = \amber{h}\sin(\text{yaw})`}
      </Equation>

      <YawPitchFigure t={t} />

      <Equation label={tx(t, "oglCam_eulerEqLabel", "Direction from yaw and pitch")}
        note={tx(t, "oglCam_eulerEqNote", "Read it row by row: each row is one coordinate. y depends only on pitch; x and z are the yaw circle, shrunk by cos(pitch). It is always a unit vector, since cos²·(cos² + sin²) + sin² = 1.")}>
        {String.raw`\mathbf{d} = \begin{pmatrix} \red{x} \\ \green{y} \\ \blue{z} \end{pmatrix} = \begin{pmatrix} \cos(\text{yaw})\,\amber{\cos(\text{pitch})} \\ \sin(\text{pitch}) \\ \sin(\text{yaw})\,\amber{\cos(\text{pitch})} \end{pmatrix}`}
      </Equation>
      <p>
        {tx(t, "oglCam_yawStart",
          "Yaw = 0 gives d = (1, 0, 0): facing +x. The camera starts facing −z, which is yaw = −90°: cos(−90°) = 0 and sin(−90°) = −1, so d = (0, 0, −1), the same as the cameraFront you started with.")}
      </p>

      <H3>{tx(t, "oglCam_cbTitle", "The mouse callback")}</H3>
      <p>
        {tx(t, "oglCam_cb1",
          "Keys are asked for every frame, but the mouse is reported through a callback: a function GLFW calls, from inside glfwPollEvents, each time the cursor moves. It receives the cursor's position in pixels; the camera needs how far it moved since the last call. Add the angles and the last position to the camera state:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (camera state, at file scope)" t={t}>{`float yaw   = -90.0f;              // degrees; -90 faces -z, like cameraFront
float pitch =   0.0f;              // degrees; 0 looks level
float lastX = 0.0f, lastY = 0.0f;  // the cursor at the previous event
bool  firstMouse = true;           // no previous event yet`}</CodeBlock>
      <p>{tx(t, "oglCam_cb2", "Then the callback itself, above main:")}</p>
      <CodeBlock lang="cpp" filename="src/main.cpp (above main)" t={t}>{`void mouseCallback(GLFWwindow*, double xpos, double ypos) {
    if (firstMouse) {                       // first event: nothing to compare with
        lastX = (float)xpos;
        lastY = (float)ypos;
        firstMouse = false;
    }
    float dx = (float)xpos - lastX;         // > 0: the mouse moved right
    float dy = lastY - (float)ypos;         // > 0: the mouse moved up (screen y grows down)
    lastX = (float)xpos;
    lastY = (float)ypos;

    const float sensitivity = 0.1f;         // degrees per pixel
    yaw   += dx * sensitivity;
    pitch += dy * sensitivity;
    pitch  = glm::clamp(pitch, -89.0f, 89.0f);

    glm::vec3 d;
    d.x = glm::cos(glm::radians(yaw)) * glm::cos(glm::radians(pitch));
    d.y = glm::sin(glm::radians(pitch));
    d.z = glm::sin(glm::radians(yaw)) * glm::cos(glm::radians(pitch));
    cameraFront = glm::normalize(d);
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglCam_tLine", "Line"), tx(t, "oglCam_tDoes", "What it does")]}
        rows={[
          [<IC key="1">{"if (firstMouse)"}</IC>, tx(t, "oglCam_m1", "the first event has no previous position. Without this, lastX and lastY are 0, so the first dx would be the cursor's whole distance from the window's corner, hundreds of pixels, and the view would jump.")],
          [<IC key="2">{"lastY - ypos"}</IC>, tx(t, "oglCam_m2", "reversed on purpose: pixel rows count from the top of the window down, but a positive pitch looks up.")],
          [<IC key="3">{"sensitivity = 0.1f"}</IC>, tx(t, "oglCam_m3", "0.1° per pixel: moving the mouse 900 pixels turns the camera 90°. Raise it for a faster turn.")],
          [<IC key="4">{"glm::clamp(pitch, -89, 89)"}</IC>, tx(t, "oglCam_m4", "keeps pitch between −89° and 89°; see the warning below.")],
          [<IC key="5">{"d.x, d.y, d.z"}</IC>, tx(t, "oglCam_m5", "the direction formula above, in code. glm::radians because, like every GLM angle, sin and cos take radians.")],
        ]}
      />
      <p>
        {tx(t, "oglCam_cbWorked",
          "Worked: move the mouse 100 pixels to the right. dx = 100, so yaw goes from −90° to −80°, and d = (0.174, 0, −0.985): still mostly −z, a little toward +x. The camera has turned 10° to the right. Move it 100 pixels up instead: pitch becomes 10°, and d = (0, 0.174, −0.985), turned 10° up.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "oglCam_gimbalWarn",
          "Why ±89° and not ±90°? At exactly 90° the camera looks straight up, so cameraFront is parallel to cameraUp. Their cross product, which gives right, is then (0, 0, 0): there is no single \"right\" when you look straight up. lookAt divides by that zero length, the matrix fills with invalid numbers, and the picture vanishes or flips. Stopping at 89° keeps right well defined.")}
      </Callout>
      <p>
        {tx(t, "oglCam_cb3",
          "Last, register the callback and capture the cursor, in step 3 of main, next to glfwSetFramebufferSizeCallback:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 3)" t={t}>{`glfwSetCursorPosCallback(window, mouseCallback);
glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);`}</CodeBlock>
      <p>
        {tx(t, "oglCam_cb4",
          "GLFW_CURSOR_DISABLED hides the cursor and keeps it inside the window, and it no longer stops at the window's edge: you can turn around as many times as you like. To get the cursor back, press Esc, which still closes the program.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCam_s3Run",
          "Run it: the cursor disappears, and moving the mouse turns the view. W now walks wherever you look, even up into the air: cameraFront points there. The first small mouse move should turn the view a little, not throw it somewhere else.")}
      </Callout>

      {/* ── STEP 4 ──────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_s4Title", "Step 4: zoom with the scroll wheel")}</H2>
      <p>
        {tx(t, "oglCam_s4a",
          "Zooming is the projection's job, not the view's: a smaller field of view (FOV) shows a smaller part of the scene, stretched over the same window, like a telephoto lens. The FOV becomes one more variable in the camera state, changed by a second callback:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (camera state, and above main)" t={t}>{`float fov = 45.0f;                 // camera state: vertical field of view, in degrees

void scrollCallback(GLFWwindow*, double, double yoffset) {
    fov -= (float)yoffset;               // wheel forward: yoffset = +1, narrower view
    fov  = glm::clamp(fov, 1.0f, 45.0f);
}`}</CodeBlock>
      <p>
        {tx(t, "oglCam_s4b",
          "Register it in step 3 with glfwSetScrollCallback(window, scrollCallback), and use fov in the projection, instead of the fixed 45:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (step 5)" t={t}>{`glm::mat4 projection = glm::perspective(glm::radians(fov), aspect, 0.1f, 100.0f);`}</CodeBlock>
      <p>
        {tx(t, "oglCam_s4c",
          "Each notch of the wheel takes 1° off. The first callback argument is the window, the second the sideways scroll, which a normal wheel never sends. Worked: the projection multiplies y by 1 / tan(fov / 2). At 45° that is 2.414; scroll 15 notches to 30° and it is 3.732. Everything looks 3.732 / 2.414 ≈ 1.55 times larger. The clamp stops at 1° (very close zoom) and at 45°, where you started.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "oglCam_s4Run",
          "Run it: scroll forward to zoom in on a far cube, back to zoom out. Zoomed in, the mouse feels much faster, because the same 0.1° per pixel now covers more of the screen.")}
      </Callout>

      {/* ── CHECKPOINT ──────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "oglCam_soFarBody",
          "The whole file after step 4. Compared with the Transformations + GLM version, the changes are marked NEW: the camera state, three functions above main, three lines in step 3, the cube positions and lastFrame in step 4, and the timing, input, view, projection and cube loop in the render loop. The helpers are shortened because they did not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>
#include "stb_image.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

// ── Shaders (unchanged) ─────────────────────────────────────────────────────
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

// ── Camera state ────────────────────────────────────────────────── NEW
glm::vec3 cameraPos   = glm::vec3(0.0f, 0.0f,  3.0f);
glm::vec3 cameraFront = glm::vec3(0.0f, 0.0f, -1.0f);
glm::vec3 cameraUp    = glm::vec3(0.0f, 1.0f,  0.0f);
float yaw   = -90.0f;
float pitch =   0.0f;
float fov   =  45.0f;
float lastX = 0.0f, lastY = 0.0f;
bool  firstMouse = true;

// ── Helpers (unchanged since First Shaders and Textures) ────────────────────
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }
GLuint loadTexture(const char* path) { /* ... */ }

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

// ── Input ───────────────────────────────────────────────────────── NEW
void mouseCallback(GLFWwindow*, double xpos, double ypos) {
    if (firstMouse) {
        lastX = (float)xpos;
        lastY = (float)ypos;
        firstMouse = false;
    }
    float dx = (float)xpos - lastX;
    float dy = lastY - (float)ypos;
    lastX = (float)xpos;
    lastY = (float)ypos;

    const float sensitivity = 0.1f;
    yaw   += dx * sensitivity;
    pitch += dy * sensitivity;
    pitch  = glm::clamp(pitch, -89.0f, 89.0f);

    glm::vec3 d;
    d.x = glm::cos(glm::radians(yaw)) * glm::cos(glm::radians(pitch));
    d.y = glm::sin(glm::radians(pitch));
    d.z = glm::sin(glm::radians(yaw)) * glm::cos(glm::radians(pitch));
    cameraFront = glm::normalize(d);
}

void scrollCallback(GLFWwindow*, double, double yoffset) {
    fov -= (float)yoffset;
    fov  = glm::clamp(fov, 1.0f, 45.0f);
}

void processInput(GLFWwindow* window, float dt) {
    glm::vec3 right = glm::normalize(glm::cross(cameraFront, cameraUp));
    glm::vec3 move(0.0f);
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) move += cameraFront;
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) move -= cameraFront;
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) move += right;
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) move -= right;
    if (glm::length(move) > 0.0f)
        cameraPos += glm::normalize(move) * 2.5f * dt;
}

int main() {
    // ── 1–3. Window, GLAD, viewport, input ──────────────────────────────────
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
    glfwSetCursorPosCallback(window, mouseCallback);                 // NEW
    glfwSetScrollCallback(window, scrollCallback);                   // NEW
    glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);     // NEW

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO (unchanged: the cube's 24 vertices, 36 indices)
    float vertices[] = { /* ... as in Transformations + GLM ... */ };
    GLuint indices[]  = { /* ... */ };
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

    // 4d. Matrices and depth
    GLint modelLoc      = glGetUniformLocation(shaderProgram, "uModel");
    GLint viewLoc       = glGetUniformLocation(shaderProgram, "uView");
    GLint projectionLoc = glGetUniformLocation(shaderProgram, "uProjection");
    glEnable(GL_DEPTH_TEST);
    glm::vec3 cubePositions[] = {                                    // NEW
        glm::vec3( 0.0f,  0.0f,  0.0f),
        glm::vec3( 2.0f,  1.0f, -5.0f),
        glm::vec3(-1.5f, -1.0f, -2.5f),
        glm::vec3(-3.0f,  1.5f, -6.0f),
        glm::vec3( 1.5f, -0.5f, -1.5f),
    };
    float lastFrame = (float)glfwGetTime();                          // NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        // >>> NEW: frame time and input
        float time = (float)glfwGetTime();
        float dt   = time - lastFrame;
        lastFrame  = time;
        processInput(window, dt);
        // <<< end of NEW

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glm::mat4 view = glm::lookAt(cameraPos, cameraPos + cameraFront, cameraUp);   // NEW
        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        float aspect = height > 0 ? (float)width / (float)height : 1.0f;
        glm::mat4 projection = glm::perspective(glm::radians(fov), aspect, 0.1f, 100.0f); // NEW: fov

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);
        glUseProgram(shaderProgram);
        glUniformMatrix4fv(viewLoc,       1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(projectionLoc, 1, GL_FALSE, glm::value_ptr(projection));
        glBindVertexArray(vao);

        for (int i = 0; i < 5; ++i) {                                // NEW: five cubes
            glm::mat4 model = glm::translate(glm::mat4(1.0f), cubePositions[i]);
            model = glm::rotate(model, time * glm::radians(50.0f) + (float)i,
                                glm::vec3(0.5f, 1.0f, 0.0f));
            glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
            glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_INT, (void*)0);
        }

        glfwSwapBuffers(window);
        glfwPollEvents();          // the mouse and scroll callbacks run in here
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
        {tx(t, "oglCam_soFarRun",
          "Run it: five spinning cubes, a hidden cursor, and a camera you fly with W A S D, the mouse and the scroll wheel. Esc quits.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCam_tSee", "What you see"), tx(t, "oglCam_tCause", "Likely cause")]}
        rows={[
          [tx(t, "oglCam_r1", "the mouse does nothing and the cursor is still visible"), tx(t, "oglCam_r1b", "glfwSetCursorPosCallback or glfwSetInputMode is missing from step 3.")],
          [tx(t, "oglCam_r2", "the view jumps somewhere else at the first mouse move"), tx(t, "oglCam_r2b", "the firstMouse guard is missing, or firstMouse is never set to false.")],
          [tx(t, "oglCam_r3", "moving the mouse up looks down"), tx(t, "oglCam_r3b", "dy is ypos − lastY; it must be lastY − ypos.")],
          [tx(t, "oglCam_r4", "the first mouse move turns the view 90° to the side"), tx(t, "oglCam_r4b", "yaw starts at 0, which faces +x; it must start at −90 to match cameraFront.")],
          [tx(t, "oglCam_r5", "while walking, the camera keeps turning toward one spot"), tx(t, "oglCam_r5b", "lookAt was given cameraFront as the target instead of cameraPos + cameraFront: it stares at a fixed point near the origin.")],
          [tx(t, "oglCam_r6", "looking straight up or down, the picture flips or vanishes"), tx(t, "oglCam_r6b", "pitch is not clamped to ±89°.")],
          [tx(t, "oglCam_r7", "walking is far too fast, or too slow"), tx(t, "oglCam_r7b", "the step is not multiplied by dt, or lastFrame is never updated, so dt keeps growing.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglCam_try",
          "Try it: make it walk like a first-person game, where looking up does not lift you off the ground. In processInput, use a flat front for W and S: glm::normalize(glm::vec3(cameraFront.x, 0.0f, cameraFront.z)). Then add Space to go up (move += cameraUp) and Left Ctrl to go down. Finally hold Left Shift to run: multiply the 2.5f by 3.")}
      </Callout>

      {/* ── CAMERA CLASS ────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_classTitle", "Tidying up: a Camera class")}</H2>
      <p>
        {tx(t, "oglCam_class1",
          "Nine variables at file scope work, but they grow with every feature, and a second camera would need nine more. A class keeps them together, with the formulas above as its functions. This is optional; the next chapters keep the file as it is, so switch only if you want to.")}
      </p>
      <CodeBlock lang="cpp" filename="Camera.hpp" t={t}>{`#pragma once
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

class Camera {
public:
    glm::vec3 position{0.0f, 0.0f, 3.0f};
    float yaw   = -90.0f;           // degrees
    float pitch =   0.0f;
    float speed = 2.5f;             // world units per second
    float sensitivity = 0.1f;       // degrees per pixel
    float fov = 45.0f;

    glm::mat4 view() const {
        return glm::lookAt(position, position + front(), glm::vec3{0.0f, 1.0f, 0.0f});
    }

    glm::vec3 front() const {
        return glm::normalize(glm::vec3{
            glm::cos(glm::radians(yaw)) * glm::cos(glm::radians(pitch)),
            glm::sin(glm::radians(pitch)),
            glm::sin(glm::radians(yaw)) * glm::cos(glm::radians(pitch))});
    }
    glm::vec3 right() const {
        return glm::normalize(glm::cross(front(), glm::vec3{0.0f, 1.0f, 0.0f}));
    }

    void processMouse(float dx, float dy) {
        yaw   += dx * sensitivity;
        pitch += dy * sensitivity;
        pitch  = glm::clamp(pitch, -89.0f, 89.0f);
    }

    void processScroll(float dy) { fov = glm::clamp(fov - dy, 1.0f, 45.0f); }

    // dir: x = right, y = up, z = forward, already normalized; dt in seconds
    void move(glm::vec3 dir, float dt) {
        const float step = speed * dt;
        position += front() * dir.z * step;
        position += right() * dir.x * step;
        position += glm::vec3{0.0f, 1.0f, 0.0f} * dir.y * step;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "oglCam_class2",
          "In main.cpp, one global Camera camera; replaces the camera state, except lastX, lastY and firstMouse, which belong to the mouse and stay. The functions shrink to calls:")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp (with the class)" t={t}>{`#include "Camera.hpp"
Camera camera;

// mouseCallback, after computing dx and dy:
camera.processMouse(dx, dy);

// scrollCallback:
camera.processScroll((float)yoffset);

// processInput: build dir from the keys (W: dir.z += 1, A: dir.x -= 1, …), then
if (glm::length(dir) > 0.0f) camera.move(glm::normalize(dir), dt);

// render loop:
glm::mat4 view       = camera.view();
glm::mat4 projection = glm::perspective(glm::radians(camera.fov), aspect, 0.1f, 100.0f);`}</CodeBlock>
      <p>
        {tx(t, "oglCam_class3",
          "One difference: the class does not store front. It recomputes it from yaw and pitch whenever it is needed, so the angles are the only truth and the two can never disagree.")}
      </p>

      {/* ── MISTAKES ────────────────────────────────────────────────────── */}
      <H2>{tx(t, "oglCam_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglCam_tMistake", "Mistake"), tx(t, "oglCam_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglCam_e1", "A direction as lookAt's center"), tx(t, "oglCam_e1b", "center is a point. lookAt(cameraPos, cameraFront, up) looks at a spot one unit from the origin, wherever you walk. Pass cameraPos + cameraFront.")],
          [tx(t, "oglCam_e2", "Moving a fixed amount per frame"), tx(t, "oglCam_e2b", "the speed then depends on the monitor: 2.4 times faster at 144 Hz than at 60 Hz. Multiply by dt.")],
          [tx(t, "oglCam_e3", "No first-event guard"), tx(t, "oglCam_e3b", "the first dx is measured from (0, 0), so the view jumps. Keep the firstMouse check.")],
          [tx(t, "oglCam_e4", "Pitch allowed to reach ±90°"), tx(t, "oglCam_e4b", "right becomes the zero vector and the view breaks. Clamp to ±89°.")],
          [tx(t, "oglCam_e5", "Degrees passed to sin, cos or perspective"), tx(t, "oglCam_e5b", "GLM's trigonometry and glm::perspective take radians. glm::perspective(45.0f, …) means 45 radians, about 2578°, and the zoom you get has nothing to do with 45°. Wrap the angle in glm::radians.")],
          [tx(t, "oglCam_e6", "The camera state declared inside main"), tx(t, "oglCam_e6b", "the callbacks cannot see it and the program does not compile. Declare it at file scope (or use the Camera class).")],
        ]}
      />
      <p>
        {tx(t, "oglCam_next",
          "Next, Depth Testing looks closer at the line glEnable(GL_DEPTH_TEST): what the depth buffer stores, the rules for which fragment wins, and why far surfaces sometimes flicker through each other.")}
      </p>

      <KeyIdeas t={t} id="oglCam" items={[
        "OpenGL has no camera. The view matrix moves and turns the whole world so the camera ends up at the origin, looking down −z.",
        "glm::lookAt(eye, center, up) builds that matrix. center is a point; for a free camera, pass position + front.",
        "Inside lookAt: forward = normalize(center − eye), right = cross(forward, up), up = cross(right, forward). They are the rows of the matrix.",
        "Move by speed × dt, where dt is the time the last frame took. Then the camera walks at the same speed on every computer.",
        "Two angles drive the mouse look: yaw (sideways) and pitch (up and down). front = (cos yaw · cos pitch, sin pitch, sin yaw · cos pitch), with yaw = −90° facing −z.",
        "Ignore the first mouse event's delta, and clamp pitch to ±89° so right never becomes zero.",
        "Zoom changes the projection, not the view: a smaller FOV makes everything larger.",
      ]} />
    </Article>
  );
}
