// src/lib/tracks/opengl/chapters/advanced/framebuffers.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

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
