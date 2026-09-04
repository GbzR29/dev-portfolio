// src/lib/tracks/opengl/chapters/advanced.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Blending & Transparency ──────────────────────────────────────────────────

export function BlendingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglBlend_intro",
          "Blending is how a fragment combines with what is already in the framebuffer instead of replacing it. The equation is fixed-function and simple. What is genuinely hard is the ordering problem it creates, and that problem has no cheap correct solution — which is why transparency is still a research topic."
        )}
      </p>

      <H2>{tx(t, "oglBlend_equationTitle", "The blend equation")}</H2>
      <p>
        {tx(t, "oglBlend_equationBody",
          "Every fragment produces a source colour. The framebuffer already holds a destination colour. glBlendFunc picks a factor for each, and the results are added."
        )}
      </p>

      <CodeBlock lang="cpp" filename="blend.cpp" t={t}>{`glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

// result = src.rgb * src.a  +  dst.rgb * (1 - src.a)
// An alpha of 0.3 means 30% of the new fragment and 70% of what was there.`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "oglBlend_h0", "Mode"), tx(t, "oglBlend_h1", "glBlendFunc"), tx(t, "oglBlend_h2", "Use for")]}
        rows={[
          [tx(t, "oglBlend_m1", "Alpha blend"),  "SRC_ALPHA, ONE_MINUS_SRC_ALPHA", tx(t, "oglBlend_u1", "Glass, foliage, UI. The default.")],
          [tx(t, "oglBlend_m2", "Additive"),     "SRC_ALPHA, ONE",                 tx(t, "oglBlend_u2", "Fire, sparks, magic. Order-independent — it just accumulates.")],
          [tx(t, "oglBlend_m3", "Multiplicative"), "DST_COLOR, ZERO",              tx(t, "oglBlend_u3", "Darkening, stained glass, shadow decals.")],
          [tx(t, "oglBlend_m4", "Premultiplied"), "ONE, ONE_MINUS_SRC_ALPHA",      tx(t, "oglBlend_u4", "Correct filtering and correct compositing of layers.")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "oglBlend_premulTip",
          "Premultiplied alpha is worth understanding. Storing colour already multiplied by its alpha makes linear filtering and mipmapping correct — with straight alpha, a texel that is fully transparent still contributes its RGB to the filtered average, which is where black or white halos around cut-out sprites come from."
        )}
      </Callout>

      <H2>{tx(t, "oglBlend_discardTitle", "Cut-out transparency needs no blending")}</H2>
      <p>
        {tx(t, "oglBlend_discardBody",
          "If a texel is either fully opaque or fully invisible — grass, chain-link fence, leaves — do not blend. Discard the fragment instead. It keeps depth writes correct, needs no sorting, and is much faster."
        )}
      </p>

      <CodeBlock lang="glsl" filename="cutout.frag" t={t}>{`vec4 texel = texture(uTexture, TexCoord);
if (texel.a < 0.1) discard;      // never reaches the depth or colour buffer
FragColor = texel;`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglBlend_discardWarn",
          "discard disables early depth testing for the whole shader on most hardware, because the GPU can no longer know a fragment's depth before running it. On a fill-heavy scene that is a real cost. Use it where it belongs and not as a general habit."
        )}
      </Callout>

      <H2>{tx(t, "oglBlend_orderTitle", "The ordering problem")}</H2>
      <p>
        {tx(t, "oglBlend_orderBody",
          "Blending reads the destination, so the result depends on draw order. If a near transparent window is drawn before a far one and writes depth, the far one is rejected and simply vanishes. The classic workaround is three rules applied together."
        )}
      </p>

      <CodeBlock lang="cpp" filename="sorted_transparency.cpp" t={t}>{`// 1. Draw all opaque geometry first, with depth writes on
glDisable(GL_BLEND);
glDepthMask(GL_TRUE);
drawOpaque();

// 2. Sort transparent objects back to front, by distance to the camera
std::sort(transparents.begin(), transparents.end(),
    [&](const Object& a, const Object& b) {
        return glm::length2(camera.position - a.position)
             > glm::length2(camera.position - b.position);
    });

// 3. Draw them with blending on and depth WRITES off (depth test stays on)
glEnable(GL_BLEND);
glDepthMask(GL_FALSE);
for (const auto& obj : transparents) obj.draw();
glDepthMask(GL_TRUE);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglBlend_sortWarn",
          "Per-object sorting is an approximation and it fails in ways you will see: two intersecting transparent surfaces have no correct global order, and a large object sorted by its centre can be both in front of and behind another. The correct-but-expensive answers are depth peeling and order-independent transparency; most games instead arrange their art so the failure never shows."
        )}
      </Callout>

    </article>
  );
}

// ── Framebuffers & Post-Processing ───────────────────────────────────────────

export function FramebuffersContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglFbo_intro",
          "Everything so far rendered into the default framebuffer — the one the window system gave you, the one that ends up on screen. A framebuffer object lets you render into a texture instead. That one capability unlocks post-processing, shadow maps, deferred shading, reflections, picking and minimaps. It is the most leveraged object in the API."
        )}
      </p>

      <H2>{tx(t, "oglFbo_attachTitle", "Attachments")}</H2>
      <p>
        {tx(t, "oglFbo_attachBody",
          "An FBO is a container with slots. You attach either a texture — when you intend to sample the result later — or a renderbuffer, which is write-only, cannot be sampled, and is cheaper. Depth and stencil are usually a renderbuffer unless you need to read them."
        )}
      </p>

      <CodeBlock lang="cpp" filename="fbo.cpp" t={t}>{`unsigned int fbo;
glGenFramebuffers(1, &fbo);
glBindFramebuffer(GL_FRAMEBUFFER, fbo);

// Colour attachment — a texture, because the post pass will sample it
unsigned int colorTex;
glGenTextures(1, &colorTex);
glBindTexture(GL_TEXTURE_2D, colorTex);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0,
             GL_RGBA, GL_FLOAT, nullptr);          // 16F so HDR values survive
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                       GL_TEXTURE_2D, colorTex, 0);

// Depth + stencil — a renderbuffer, never sampled
unsigned int rbo;
glGenRenderbuffers(1, &rbo);
glBindRenderbuffer(GL_RENDERBUFFER, rbo);
glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, width, height);
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT,
                          GL_RENDERBUFFER, rbo);

if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE)
    std::cerr << "framebuffer incomplete\\n";

glBindFramebuffer(GL_FRAMEBUFFER, 0);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglFbo_completeWarn",
          "Always call glCheckFramebufferStatus. An incomplete framebuffer does not error — it silently discards everything you draw into it, and you spend an hour debugging a shader that was never the problem. The usual causes are a missing colour attachment, mismatched attachment sizes, or an unsupported internal format."
        )}
      </Callout>

      <H2>{tx(t, "oglFbo_passTitle", "The two-pass structure")}</H2>
      <CodeBlock lang="cpp" filename="post_pass.cpp" t={t}>{`// Pass 1 — scene into the texture
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
glEnable(GL_DEPTH_TEST);
glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
drawScene();

// Pass 2 — a fullscreen quad, sampling that texture
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glDisable(GL_DEPTH_TEST);          // nothing to occlude
glClear(GL_COLOR_BUFFER_BIT);
postShader.use();
glBindVertexArray(quadVAO);
glBindTexture(GL_TEXTURE_2D, colorTex);
glDrawArrays(GL_TRIANGLES, 0, 6);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglFbo_triangleTip",
          "You can skip the quad entirely. Draw a single oversized triangle that covers the screen and generate its vertices from gl_VertexID in the shader — no VBO, no VAO data, and it avoids the diagonal seam where a two-triangle quad's edges meet, which costs you a strip of doubly-shaded pixels."
        )}
      </Callout>

      <CodeBlock lang="glsl" filename="fullscreen.vert" t={t}>{`#version 460 core
out vec2 TexCoord;

void main() {
    // Emits (-1,-1), (3,-1), (-1,3) — one triangle covering the whole screen
    TexCoord = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(TexCoord * 2.0 - 1.0, 0.0, 1.0);
}
// draw with: glDrawArrays(GL_TRIANGLES, 0, 3);  and an empty VAO bound`}</CodeBlock>

      <H2>{tx(t, "oglFbo_effectsTitle", "Effects are just fragment shaders")}</H2>
      <CodeBlock lang="glsl" filename="post.frag" t={t}>{`#version 460 core
in  vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uScene;

void main() {
    vec3 c = texture(uScene, TexCoord).rgb;

    // Grayscale — weighted by perceived luminance, not a flat average
    // float g = dot(c, vec3(0.2126, 0.7152, 0.0722));

    // 3x3 kernel — edge detection, blur, sharpen all share this shape
    const float o = 1.0 / 300.0;
    vec2 offsets[9] = vec2[](
        vec2(-o, o), vec2(0.0, o), vec2(o, o),
        vec2(-o,0.0), vec2(0.0,0.0), vec2(o,0.0),
        vec2(-o,-o), vec2(0.0,-o), vec2(o,-o));
    float kernel[9] = float[](
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1);                       // sharpen

    vec3 sum = vec3(0.0);
    for (int i = 0; i < 9; ++i)
        sum += texture(uScene, TexCoord + offsets[i]).rgb * kernel[i];

    FragColor = vec4(sum, 1.0);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglFbo_resizeWarn",
          "Attachments do not resize with the window. When the framebuffer size callback fires you must recreate — or reallocate — every attachment at the new size, or your post pass keeps sampling a stale, wrongly-sized texture and the image stretches."
        )}
      </Callout>

    </article>
  );
}

// ── Cubemaps & Skybox ────────────────────────────────────────────────────────

export function CubemapsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglCube_intro",
          "A cubemap is six square textures treated as the inside faces of a cube, sampled with a direction vector rather than a UV pair. You hand it a vec3 and it returns whatever colour lies that way. That single property makes it the natural representation for a sky, for environment reflections, and for omnidirectional shadow maps."
        )}
      </p>

      <H2>{tx(t, "oglCube_loadTitle", "Loading the six faces")}</H2>
      <CodeBlock lang="cpp" filename="cubemap.cpp" t={t}>{`// The order is fixed by the enum, and the enum values are consecutive:
// +X, -X, +Y, -Y, +Z, -Z  →  right, left, top, bottom, front, back
const std::array<std::string, 6> faces = {
    "right.jpg", "left.jpg", "top.jpg", "bottom.jpg", "front.jpg", "back.jpg"
};

unsigned int texID;
glGenTextures(1, &texID);
glBindTexture(GL_TEXTURE_CUBE_MAP, texID);

int w, h, channels;
for (unsigned i = 0; i < faces.size(); ++i) {
    unsigned char* data = stbi_load(faces[i].c_str(), &w, &h, &channels, 0);
    if (!data) { std::cerr << "missing face: " << faces[i] << "\\n"; continue; }
    glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_SRGB8,
                 w, h, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
    stbi_image_free(data);
}

glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);  // note R`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglCube_flipWarn",
          "Do not flip cubemap faces vertically. The cubemap convention comes from RenderMan and has the opposite Y orientation to normal OpenGL textures, so the usual stbi_set_flip_vertically_on_load(true) produces an upside-down sky. Turn it off for these six loads specifically."
        )}
      </Callout>

      <H2>{tx(t, "oglCube_skyTitle", "The skybox trick")}</H2>
      <p>
        {tx(t, "oglCube_skyBody",
          "A skybox must appear infinitely distant. You get that by stripping the translation out of the view matrix so the cube never moves relative to the camera, and by forcing its depth to the maximum so it loses every depth test against real geometry."
        )}
      </p>

      <CodeBlock lang="glsl" filename="skybox.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
out vec3 TexDir;

uniform mat4 uView;         // translation already removed on the CPU
uniform mat4 uProjection;

void main() {
    TexDir = aPos;                             // position IS the sample direction
    vec4 pos = uProjection * uView * vec4(aPos, 1.0);
    gl_Position = pos.xyww;                    // forces z/w == 1.0 → max depth
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="draw_skybox.cpp" t={t}>{`// Draw the skybox LAST so early-z rejects every pixel already covered
glDepthFunc(GL_LEQUAL);                            // depth is exactly 1.0
skyShader.use();
skyShader.setMat4("uView", glm::mat4(glm::mat3(camera.view())));  // drop translation
skyShader.setMat4("uProjection", projection);
glBindVertexArray(skyVAO);
glBindTexture(GL_TEXTURE_CUBE_MAP, texID);
glDrawArrays(GL_TRIANGLES, 0, 36);
glDepthFunc(GL_LESS);                              // restore`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglCube_lequalTip",
          "GL_LEQUAL is mandatory here. The cleared depth buffer holds 1.0 and the skybox writes exactly 1.0, so the default GL_LESS rejects every single fragment and you get no sky at all — with no error and nothing to debug. Drawing it last rather than first is a pure performance win: the depth buffer is already full, so almost all sky fragments die before the fragment shader runs."
        )}
      </Callout>

      <H2>{tx(t, "oglCube_reflectTitle", "Environment mapping")}</H2>
      <CodeBlock lang="glsl" filename="reflect.frag" t={t}>{`uniform samplerCube uSkybox;
uniform vec3 uCameraPos;

void main() {
    vec3 I = normalize(FragPos - uCameraPos);

    // Mirror
    vec3 R = reflect(I, normalize(Normal));

    // Glass — the ratio is airIOR / materialIOR
    // vec3 R = refract(I, normalize(Normal), 1.0 / 1.52);

    FragColor = vec4(texture(uSkybox, R).rgb, 1.0);
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglCube_pbrNote",
          "This is a static reflection: the object mirrors the sky but never other objects, and it does not update as the scene changes. Rendering the scene into a dynamic cubemap fixes that at six times the cost. The same structure, pre-filtered by roughness, is what feeds image-based lighting in a PBR renderer — so this chapter is the foundation of that one."
        )}
      </Callout>

    </article>
  );
}

// ── Instancing ───────────────────────────────────────────────────────────────

export function InstancingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglInst_intro",
          "Drawing ten thousand asteroids with ten thousand draw calls is slow, and the bottleneck is not the GPU — it is the CPU-side validation and command submission per call. Instancing sends the geometry once and tells the GPU to draw it N times, with each copy pulling its own per-instance data from a buffer."
        )}
      </p>

      <H2>{tx(t, "oglInst_basicTitle", "The simplest form")}</H2>
      <CodeBlock lang="cpp" filename="instanced_draw.cpp" t={t}>{`glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, nullptr, 100);`}</CodeBlock>

      <CodeBlock lang="glsl" filename="offset.vert" t={t}>{`#version 460 core
layout (location = 0) in vec2 aPos;

uniform vec2 uOffsets[100];    // fine for 100, useless for 100000

void main() {
    gl_Position = vec4(aPos + uOffsets[gl_InstanceID], 0.0, 1.0);
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglInst_uniformWarn",
          "gl_InstanceID with a uniform array is the textbook example and it does not scale. Uniform storage is limited to a few thousand vec4s, and you hit that wall fast. Instance arrays are the real technique — everything below."
        )}
      </Callout>

      <H2>{tx(t, "oglInst_arraysTitle", "Instance arrays")}</H2>
      <p>
        {tx(t, "oglInst_arraysBody",
          "glVertexAttribDivisor changes how often an attribute advances. A divisor of 0 — the default — means advance per vertex. A divisor of 1 means advance once per instance, which turns a vertex attribute into per-instance data."
        )}
      </p>

      <CodeBlock lang="cpp" filename="instance_array.cpp" t={t}>{`// A full mat4 per instance: 64 bytes, so four consecutive vec4 attributes
std::vector<glm::mat4> models(100000);
// ... fill with transforms ...

unsigned int instanceVBO;
glGenBuffers(1, &instanceVBO);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferData(GL_ARRAY_BUFFER, models.size() * sizeof(glm::mat4),
             models.data(), GL_STATIC_DRAW);

glBindVertexArray(meshVAO);
for (unsigned i = 0; i < 4; ++i) {
    glEnableVertexAttribArray(3 + i);
    glVertexAttribPointer(3 + i, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4),
                          (void*)(i * sizeof(glm::vec4)));
    glVertexAttribDivisor(3 + i, 1);      // ← advance once per INSTANCE
}
glBindVertexArray(0);`}</CodeBlock>

      <CodeBlock lang="glsl" filename="instanced.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;
layout (location = 3) in mat4 aInstanceModel;   // consumes locations 3,4,5,6

uniform mat4 uView;
uniform mat4 uProjection;

void main() {
    gl_Position = uProjection * uView * aInstanceModel * vec4(aPos, 1.0);
}`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglInst_mat4Note",
          "A mat4 attribute silently occupies four attribute locations, because a vertex attribute can be at most a vec4. Declaring it at location 3 means 4, 5 and 6 are taken too — put your next attribute at 7. Forgetting this produces geometry that reads garbage from an overlapping slot."
        )}
      </Callout>

      <H2>{tx(t, "oglInst_dynamicTitle", "Updating per frame")}</H2>
      <CodeBlock lang="cpp" filename="dynamic_instances.cpp" t={t}>{`// Allocate once with a dynamic hint
glBufferData(GL_ARRAY_BUFFER, capacity * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW);

// Then per frame, upload only what is actually visible
const auto visible = cullFrustum(allTransforms, camera);
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferSubData(GL_ARRAY_BUFFER, 0, visible.size() * sizeof(glm::mat4), visible.data());
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT,
                        nullptr, (GLsizei)visible.size());`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglInst_whenTip",
          "Instancing only helps when the draw call itself is the bottleneck — many copies of the same mesh with the same material. It does nothing for one huge mesh, and it cannot batch objects with different geometry. If the instances are heavy, combine it with frustum culling: drawing a hundred thousand instances that are all off screen is still a hundred thousand vertex shader invocations."
        )}
      </Callout>

    </article>
  );
}

// ── Uniform Buffer Objects ───────────────────────────────────────────────────

export function UBOContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglUbo_intro",
          "Uniforms belong to a program. Ten shaders that all need the view and projection matrices means ten glUniformMatrix4fv calls every frame with identical data. A uniform buffer object stores that data once in GPU memory and binds it to a binding point that any number of shaders can read from."
        )}
      </p>

      <H2>{tx(t, "oglUbo_blockTitle", "Declaring a block")}</H2>
      <CodeBlock lang="glsl" filename="shared.glsl" t={t}>{`#version 460 core

layout (std140, binding = 0) uniform Matrices {
    mat4 uProjection;   // offset   0
    mat4 uView;         // offset  64
};                      // total  128 bytes

// The members are used exactly like ordinary uniforms — no prefix.
void main() { gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0); }`}</CodeBlock>

      <H2>{tx(t, "oglUbo_std140Title", "std140 and its padding rules")}</H2>
      <p>
        {tx(t, "oglUbo_std140Body",
          "std140 guarantees a layout you can predict from the C++ side, at the cost of aggressive padding. The rule that catches everyone: a vec3 is aligned and padded to 16 bytes, exactly like a vec4. Mirroring a GLSL block with a naive C++ struct is where UBO bugs come from."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglUbo_h0", "Type"), tx(t, "oglUbo_h1", "Size"), tx(t, "oglUbo_h2", "Alignment")]}
        rows={[
          ["float / int / bool", "4",  "4"],
          ["vec2",               "8",  "8"],
          ["vec3",               "12", tx(t, "oglUbo_a3", "16 — padded")],
          ["vec4",               "16", "16"],
          ["mat4",               "64", tx(t, "oglUbo_a5", "16 per column")],
          [tx(t, "oglUbo_t6", "array of anything"), "—", tx(t, "oglUbo_a6", "Each element rounded up to 16")],
        ]}
      />

      <CodeBlock lang="cpp" filename="std140_struct.cpp" t={t}>{`// WRONG — 28 bytes in C++, but GLSL expects 48
struct BadLights { glm::vec3 position; float intensity; glm::vec3 color; };

// RIGHT — mirror the padding explicitly, and static_assert it
struct alignas(16) LightBlock {
    glm::vec3 position;  float _pad0;
    glm::vec3 color;     float intensity;   // packs into the padding slot
};
static_assert(sizeof(LightBlock) == 32, "std140 layout mismatch");`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_vec4Tip",
          "The practical rule: only ever put vec4s and mat4s in a uniform block, and pack scalars into the spare w components. It wastes a few bytes and saves you from an entire class of silent misalignment bugs that show up as one shader reading another's data."
        )}
      </Callout>

      <H2>{tx(t, "oglUbo_bindTitle", "Creating and binding")}</H2>
      <CodeBlock lang="cpp" filename="ubo.cpp" t={t}>{`unsigned int ubo;
glGenBuffers(1, &ubo);
glBindBuffer(GL_UNIFORM_BUFFER, ubo);
glBufferData(GL_UNIFORM_BUFFER, 2 * sizeof(glm::mat4), nullptr, GL_DYNAMIC_DRAW);
glBindBuffer(GL_UNIFORM_BUFFER, 0);

// Attach the buffer to binding point 0 — the same 0 as in the shader layout
glBindBufferRange(GL_UNIFORM_BUFFER, 0, ubo, 0, 2 * sizeof(glm::mat4));

// Once per frame, for every shader at once
glBindBuffer(GL_UNIFORM_BUFFER, ubo);
glBufferSubData(GL_UNIFORM_BUFFER, 0,                  sizeof(glm::mat4), &projection[0][0]);
glBufferSubData(GL_UNIFORM_BUFFER, sizeof(glm::mat4),  sizeof(glm::mat4), &view[0][0]);
glBindBuffer(GL_UNIFORM_BUFFER, 0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglUbo_legacyNote",
          "layout(binding = 0) in the shader requires GLSL 4.20 or later. On older versions you look the block up by name and assign the binding from C++: glUniformBlockBinding(program, glGetUniformBlockIndex(program, \"Matrices\"), 0). Targeting 4.6, the layout qualifier is simpler and removes a step that is easy to forget."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "oglUbo_ssboTip",
          "A UBO is limited to roughly 16 KB and its size is fixed at compile time. When you need more — thousands of lights, a bone palette, arbitrary-length arrays — the answer is a shader storage buffer object. SSBOs are larger, dynamically sized, writable from the shader, and use the tighter std430 layout where a vec3 array is not padded to 16."
        )}
      </Callout>

    </article>
  );
}
