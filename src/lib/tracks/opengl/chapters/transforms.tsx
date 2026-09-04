// src/lib/tracks/opengl/chapters/transforms.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Camera & View Matrix ──────────────────────────────────────────────────────

export function CameraContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglCam_intro",
          "There is no camera in OpenGL. Nothing in the API moves a viewpoint around a scene. What exists is the view matrix, and the trick behind it is that moving the camera one unit to the right is mathematically identical to moving the entire world one unit to the left. A camera is a matrix you build and a convention you stick to."
        )}
      </p>

      <H2>{tx(t, "oglCam_lookatTitle", "The LookAt matrix")}</H2>
      <p>
        {tx(t, "oglCam_lookatBody",
          "Three vectors define a camera: where it is, what it is looking at, and which way is up. glm::lookAt builds an orthonormal basis from them and combines it with a translation, producing a matrix that transforms world space into view space — a space where the camera sits at the origin looking down -Z."
        )}
      </p>

      <CodeBlock lang="cpp" filename="lookat.cpp" t={t}>{`glm::vec3 cameraPos    = glm::vec3(0.0f, 0.0f,  3.0f);
glm::vec3 cameraTarget = glm::vec3(0.0f, 0.0f,  0.0f);
glm::vec3 worldUp      = glm::vec3(0.0f, 1.0f,  0.0f);

glm::mat4 view = glm::lookAt(cameraPos, cameraTarget, worldUp);

// What lookAt does internally:
//   forward = normalize(target - position)      // the direction we face
//   right   = normalize(cross(forward, worldUp))
//   up      = cross(right, forward)             // re-orthogonalized, no drift
// then packs right/up/-forward into the rows and applies -dot(axis, position).`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglCam_handedNote",
          "OpenGL's view space is right-handed with the camera looking down NEGATIVE Z. That minus sign is the source of endless confusion: a target 'in front of' the camera has a smaller Z than the camera. NDC, on the other hand, is left-handed — the projection matrix performs that flip for you, which is why you almost never think about it."
        )}
      </Callout>

      <H2>{tx(t, "oglCam_eulerTitle", "Yaw, pitch and the direction vector")}</H2>
      <p>
        {tx(t, "oglCam_eulerBody",
          "For a first-person camera you do not store a target — you store two angles and derive the forward vector from them every frame. Yaw rotates around the world Y axis, pitch around the camera's right axis."
        )}
      </p>

      <CodeBlock lang="cpp" filename="euler.cpp" t={t}>{`float yaw   = -90.0f;   // -90 so the default direction is -Z, not +X
float pitch =   0.0f;

glm::vec3 direction;
direction.x = cos(glm::radians(yaw)) * cos(glm::radians(pitch));
direction.y = sin(glm::radians(pitch));
direction.z = sin(glm::radians(yaw)) * cos(glm::radians(pitch));

glm::vec3 cameraFront = glm::normalize(direction);
glm::mat4 view = glm::lookAt(cameraPos, cameraPos + cameraFront, worldUp);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCam_gimbalWarn",
          "Clamp pitch to roughly ±89 degrees. At exactly ±90 the forward vector becomes parallel to worldUp, the cross product that builds the right vector collapses to zero, and lookAt produces a degenerate matrix — the view flips inside out. This is the practical face of gimbal lock, and the clamp is the standard fix for an FPS camera."
        )}
      </Callout>

      <H2>{tx(t, "oglCam_classTitle", "A usable camera class")}</H2>
      <CodeBlock lang="cpp" filename="Camera.hpp" t={t}>{`class Camera {
public:
    glm::vec3 position{0.0f, 0.0f, 3.0f};
    float yaw   = -90.0f;
    float pitch =   0.0f;
    float speed = 2.5f;          // world units per second
    float sensitivity = 0.1f;    // degrees per pixel
    float fov = 45.0f;

    glm::mat4 view() const {
        return glm::lookAt(position, position + front(), up());
    }

    glm::vec3 front() const {
        return glm::normalize(glm::vec3{
            cos(glm::radians(yaw)) * cos(glm::radians(pitch)),
            sin(glm::radians(pitch)),
            sin(glm::radians(yaw)) * cos(glm::radians(pitch))});
    }
    glm::vec3 right() const {
        return glm::normalize(glm::cross(front(), glm::vec3{0.0f, 1.0f, 0.0f}));
    }
    glm::vec3 up() const { return glm::normalize(glm::cross(right(), front())); }

    void processMouse(float dx, float dy) {
        yaw   += dx * sensitivity;
        pitch += dy * sensitivity;
        pitch  = glm::clamp(pitch, -89.0f, 89.0f);
    }

    void processScroll(float dy) { fov = glm::clamp(fov - dy, 1.0f, 90.0f); }

    // dt in seconds — never move by a fixed amount per frame
    void move(glm::vec3 localDir, float dt) {
        const float v = speed * dt;
        position += front() * localDir.z * v;
        position += right() * localDir.x * v;
        position += glm::vec3{0.0f, 1.0f, 0.0f} * localDir.y * v;
    }
};`}</CodeBlock>

      <H2>{tx(t, "oglCam_inputTitle", "Wiring up input")}</H2>
      <CodeBlock lang="cpp" filename="input.cpp" t={t}>{`// Capture the cursor so the mouse can move without hitting the screen edge
glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

void mouseCallback(GLFWwindow* w, double xpos, double ypos) {
    static float lastX = 640.0f, lastY = 360.0f;
    static bool  first = true;
    if (first) { lastX = (float)xpos; lastY = (float)ypos; first = false; }

    const float dx = (float)xpos - lastX;
    const float dy = lastY - (float)ypos;   // inverted: screen Y grows downward
    lastX = (float)xpos; lastY = (float)ypos;

    camera.processMouse(dx, dy);
}

// Per frame
glm::vec3 dir{0.0f};
if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS) dir.z += 1.0f;
if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS) dir.z -= 1.0f;
if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS) dir.x += 1.0f;
if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS) dir.x -= 1.0f;
if (dir != glm::vec3{0.0f}) camera.move(glm::normalize(dir), deltaTime);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCam_firstFrameWarn",
          "The first guard in the mouse callback is not cosmetic. The first callback fires with whatever coordinate the cursor happened to be at when the window gained focus, producing a delta of several hundred pixels and snapping the camera to a random orientation. Every FPS camera tutorial that skips it has this bug."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "oglCam_dtTip",
          "Multiply movement by delta time, always. Without it, movement speed is tied to frame rate: the same code walks twice as fast on a 120 Hz monitor as on a 60 Hz one. Normalize the input direction too, or diagonal movement is 41% faster than cardinal movement."
        )}
      </Callout>

      <H2>{tx(t, "oglCam_fovTitle", "FOV and the projection matrix")}</H2>
      <CodeBlock lang="cpp" filename="projection.cpp" t={t}>{`glm::mat4 projection = glm::perspective(
    glm::radians(camera.fov),           // vertical field of view
    (float)width / (float)height,       // aspect — recompute on resize
    0.1f,                               // near plane
    100.0f);                            // far plane

shader.setMat4("uView",       camera.view());
shader.setMat4("uProjection", projection);`}</CodeBlock>

      <p>
        {tx(t, "oglCam_fovBody",
          "Rebuild the projection matrix whenever the window resizes, not once at startup. A stale aspect ratio stretches everything horizontally the moment the user drags the window edge — and it is a bug people stare at for an hour before checking the projection."
        )}
      </p>

    </article>
  );
}

// ── Depth Testing ─────────────────────────────────────────────────────────────

export function DepthTestingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglDepth_intro",
          "Draw two cubes without depth testing and the second one always covers the first, regardless of which is closer. The GPU has no idea what is in front of what — it just writes fragments in the order they arrive. The depth buffer fixes this by remembering, for every pixel, how far away the nearest fragment written so far was."
        )}
      </p>

      <H2>{tx(t, "oglDepth_enableTitle", "Turning it on")}</H2>
      <CodeBlock lang="cpp" filename="depth.cpp" t={t}>{`glEnable(GL_DEPTH_TEST);          // off by default in Core profile

// The depth buffer must be cleared every frame, exactly like the colour buffer
while (running) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    // ... draw ...
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglDepth_clearWarn",
          "Forgetting GL_DEPTH_BUFFER_BIT in glClear is the classic symptom: the first frame looks correct and every frame after it is progressively more broken, because last frame's depth values are still in the buffer rejecting this frame's fragments."
        )}
      </Callout>

      <H2>{tx(t, "oglDepth_funcTitle", "The depth function")}</H2>
      <p>
        {tx(t, "oglDepth_funcBody",
          "glDepthFunc decides what 'passes'. The default, GL_LESS, keeps a fragment when its depth is smaller than what is already stored — smaller meaning closer. The others are situational but each has a real use."
        )}
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

      <H2>{tx(t, "oglDepth_maskTitle", "Testing versus writing")}</H2>
      <p>
        {tx(t, "oglDepth_maskBody",
          "These are two separate switches, and confusing them causes most transparency bugs. The test decides whether a fragment survives; the mask decides whether a surviving fragment updates the depth buffer. Transparent surfaces should be tested against opaque geometry but must not write depth, or the transparent object in front hides the one behind it."
        )}
      </p>

      <CodeBlock lang="cpp" filename="depth_mask.cpp" t={t}>{`// 1. Opaque pass — test and write
glEnable(GL_DEPTH_TEST);
glDepthMask(GL_TRUE);
drawOpaque();

// 2. Transparent pass — test against opaque, but do not write
glDepthMask(GL_FALSE);
drawTransparent();
glDepthMask(GL_TRUE);    // restore, or the next frame's opaque pass breaks`}</CodeBlock>

      <H2>{tx(t, "oglDepth_precisionTitle", "Z-fighting and why it happens")}</H2>
      <p>
        {tx(t, "oglDepth_precisionBody",
          "Depth is not stored linearly. The perspective divide compresses distant depth values into a tiny slice of the buffer's range, so two surfaces a centimetre apart are perfectly distinguishable near the camera and indistinguishable at 500 units. When their quantized depths collide, the winner varies per pixel and per frame — the flickering stripes known as z-fighting."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglDepth_z0", "Fix"), tx(t, "oglDepth_z1", "Effect")]}
        rows={[
          [tx(t, "oglDepth_zf1", "Push the near plane out"), tx(t, "oglDepth_ze1", "By far the biggest win. 0.1 instead of 0.001 buys enormous precision — precision loss scales with far/near.")],
          [tx(t, "oglDepth_zf2", "Pull the far plane in"),   tx(t, "oglDepth_ze2", "Helps, but much less than the near plane. Do not obsess over it.")],
          [tx(t, "oglDepth_zf3", "Separate the geometry"),   tx(t, "oglDepth_ze3", "Do not model coplanar surfaces. A decal needs an offset or polygon offset.")],
          [tx(t, "oglDepth_zf4", "Use a 32-bit depth buffer"), tx(t, "oglDepth_ze4", "More bits, more range. Costs bandwidth and is not always available.")],
          [tx(t, "oglDepth_zf5", "Reversed-Z"),              tx(t, "oglDepth_ze5", "Map near to 1.0 and far to 0.0 with a float buffer. Distributes precision almost perfectly.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="polygon_offset.cpp" t={t}>{`// Decals and coplanar detail: nudge the depth without moving the geometry
glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(-1.0f, -1.0f);   // pull slightly toward the camera
drawDecals();
glDisable(GL_POLYGON_OFFSET_FILL);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_visTip",
          "To see the depth buffer, output gl_FragCoord.z as a greyscale colour. It will look almost entirely white, which is the point — that is the non-linear distribution making itself visible. Linearize it back to view-space distance to get a readable image, and you will understand z-fighting immediately."
        )}
      </Callout>

      <CodeBlock lang="glsl" filename="visualize_depth.frag" t={t}>{`#version 460 core
out vec4 FragColor;

uniform float uNear;
uniform float uFar;

float linearizeDepth(float d) {
    float ndc = d * 2.0 - 1.0;                       // [0,1] back to [-1,1]
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
}

void main() {
    float depth = linearizeDepth(gl_FragCoord.z) / uFar;
    FragColor = vec4(vec3(depth), 1.0);
}`}</CodeBlock>

    </article>
  );
}
