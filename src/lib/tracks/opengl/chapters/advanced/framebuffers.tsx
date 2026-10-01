// src/lib/tracks/opengl/chapters/advanced/framebuffers.tsx
"use client";

// Framebuffers & post-processing (explanation pass 2026-10-01): what an FBO
// is (attachment points, no memory of its own), texture vs renderbuffer, the
// memory of a 1080p target, completeness, the two passes and the viewport,
// the fullscreen triangle bit by bit (FullscreenTriFigure), the 3×3 kernel as
// a formula with one pixel worked through, choices and mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FullscreenTriFigure } from "@/components/lesson/figures/advgl/FullscreenTriFigure";

const r = String.raw;

// ── Framebuffers & Post-Processing ───────────────────────────────────────────

export function FramebuffersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglFbo_intro",
          "Everything so far rendered into the default framebuffer — the one the window system gave you, the one that ends up on screen. A framebuffer object lets you render into a texture instead. That one capability unlocks post-processing, shadow maps, deferred shading, reflections, picking and minimaps. It is the most leveraged object in the API.")}
      </Lead>

      <H2>{tx(t, "oglFbo_whatTitle", "What a framebuffer is")}</H2>
      <p>
        {tx(t, "oglFbo_whatBody",
          "A framebuffer is a list of destinations for the output of a draw. The fragment shader's out variables go to colour attachments (GL_COLOR_ATTACHMENT0, 1, 2…, at least 8 of them), the depth test reads and writes the depth attachment, and the stencil test the stencil attachment. The default framebuffer's destinations are memory owned by the window system. A framebuffer object you create owns no memory at all: it only points at images you allocated yourself, textures or renderbuffers, and you can re-point it at any time.")}
      </p>

      <H2>{tx(t, "oglFbo_attachTitle", "Attachments")}</H2>
      <p>
        {tx(t, "oglFbo_attachBody",
          "An FBO is a container with slots. You attach either a texture — when you intend to sample the result later — or a renderbuffer, which is write-only, cannot be sampled, and is cheaper. Depth and stencil are usually a renderbuffer unless you need to read them.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglFbo_tKind", "Attach a…"), tx(t, "oglFbo_tCan", "Can be sampled later"), tx(t, "oglFbo_tUse", "Typical use")]}
        rows={[
          [tx(t, "oglFbo_k1", "texture"), tx(t, "oglFbo_yes", "yes, with texture() in a later pass"), tx(t, "oglFbo_k1u", "the scene colour for post-processing, a shadow map's depth, G-buffer layers")],
          [tx(t, "oglFbo_k2", "renderbuffer"), tx(t, "oglFbo_no", "no; only copied with glBlitFramebuffer"), tx(t, "oglFbo_k2u", "depth/stencil that only the depth test needs; multisampled colour that will be resolved")],
        ]}
      />

      <CodeBlock lang="cpp" filename="fbo.cpp" t={t}>{`unsigned int fbo;
glGenFramebuffers(1, &fbo);
glBindFramebuffer(GL_FRAMEBUFFER, fbo);

// Colour attachment — a texture, because the post pass will sample it
unsigned int colorTex;
glGenTextures(1, &colorTex);
glBindTexture(GL_TEXTURE_2D, colorTex);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0,
             GL_RGBA, GL_FLOAT, nullptr);          // 16F so HDR values survive
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);   // no mipmaps: must not ask for them
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                       GL_TEXTURE_2D, colorTex, 0);   // last 0: mip level 0

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
      <p>
        {tx(t, "oglFbo_memBody",
          "What this costs at 1920 × 1080 = 2 073 600 pixels: RGBA16F is 4 channels × 2 bytes = 8 bytes per pixel, so 16.6 MB for the colour; GL_DEPTH24_STENCIL8 packs 24 bits of depth and 8 of stencil into 4 bytes, another 8.3 MB. About 25 MB for one full-screen target. At 4K every number is four times larger, which is why bloom and blur passes usually run on half- or quarter-size targets.")}
      </p>

      <Callout type="warn" t={t}>
        {tx(t, "oglFbo_completeWarn",
          "Always call glCheckFramebufferStatus right after building a framebuffer. Drawing into an incomplete one does raise GL_INVALID_FRAMEBUFFER_OPERATION, but without the debug callback or glGetError nobody sees it: the draws are simply dropped and you spend an hour debugging a shader that was never the problem. The status names the cause. The usual ones are a framebuffer with no attachments at all, an attachment whose storage was never allocated (glTexImage2D with a zero size, or a renderbuffer without glRenderbufferStorage), an internal format that cannot be rendered to, attachments with different sample counts, or a glDrawBuffers entry pointing at an empty slot. Attachments of different sizes are allowed since OpenGL 3.0: rendering is limited to the smallest one.")}
      </Callout>

      <H2>{tx(t, "oglFbo_passTitle", "The two-pass structure")}</H2>
      <CodeBlock lang="cpp" filename="post_pass.cpp" t={t}>{`// Pass 1 — scene into the texture
glBindFramebuffer(GL_FRAMEBUFFER, fbo);
glViewport(0, 0, width, height);   // the FBO's size, not necessarily the window's
glEnable(GL_DEPTH_TEST);
glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
drawScene();

// Pass 2 — a fullscreen quad, sampling that texture
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glViewport(0, 0, windowWidth, windowHeight);
glDisable(GL_DEPTH_TEST);          // nothing to occlude
glClear(GL_COLOR_BUFFER_BIT);
postShader.use();
glBindVertexArray(quadVAO);
glBindTexture(GL_TEXTURE_2D, colorTex);
glDrawArrays(GL_TRIANGLES, 0, 6);`}</CodeBlock>
      <p>
        {tx(t, "oglFbo_passBody",
          "Pass 1 is the ordinary scene render; only the destination changed. Pass 2 draws one shape that covers the whole window, and its fragment shader runs once per screen pixel, reading the matching texel of the scene texture. Depth testing is off because there is a single layer, nothing to hide. glViewport is part of the pattern: it maps clip space to pixels of the current framebuffer, it is not stored in the FBO, and it must be set again whenever you switch to a target of a different size.")}
      </p>

      <H2>{tx(t, "oglFbo_triTitle", "One triangle instead of a quad")}</H2>
      <Callout type="tip" t={t}>
        {tx(t, "oglFbo_triangleTip2",
          "You can skip the quad entirely. Draw a single oversized triangle that covers the screen and generate its vertices from gl_VertexID in the shader — no VBO, no vertex data, only an empty VAO bound (the core profile requires one). It is also marginally faster. GPUs shade pixels in 2×2 blocks, and along the diagonal where a quad's two triangles meet, each block is shaded once for each triangle, with half the results thrown away. One triangle has no inner edge, so nothing is wasted.")}
      </Callout>

      <CodeBlock lang="glsl" filename="fullscreen.vert" t={t}>{`#version 460 core
out vec2 TexCoord;

void main() {
    // Emits (-1,-1), (3,-1), (-1,3) — one triangle covering the whole screen
    TexCoord = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(TexCoord * 2.0 - 1.0, 0.0, 1.0);
}
// draw with: glDrawArrays(GL_TRIANGLES, 0, 3);  and an empty VAO bound`}</CodeBlock>
      <p>
        {tx(t, "oglFbo_bitsBody",
          "The two bit tricks, for gl_VertexID 0, 1, 2. (id << 1) & 2 shifts the id left one bit and keeps only the bit worth 2: 0 → 0, 1 → 2, 2 → 4 & 2 = 0. id & 2 keeps the bit worth 2 of the id itself: 0, 0, 2. So TexCoord is (0,0), (2,0), (0,2), and × 2 − 1 turns that into positions (−1,−1), (3,−1), (−1,3). The long edge runs along x + y = 2 in clip space and passes exactly through the screen's corner (1, 1), where TexCoord is (1, 1). Inside the screen TexCoord goes from 0 to 1, as a quad's would; everything outside is clipped before any fragment is created.")}
      </p>

      <FullscreenTriFigure t={t} />

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
    vec2 o = 1.0 / vec2(textureSize(uScene, 0));   // one texel, at any resolution
    vec2 offsets[9] = vec2[](
        vec2(-o.x, o.y), vec2(0.0, o.y), vec2(o.x, o.y),
        vec2(-o.x, 0.0), vec2(0.0, 0.0), vec2(o.x, 0.0),
        vec2(-o.x,-o.y), vec2(0.0,-o.y), vec2(o.x,-o.y));
    float kernel[9] = float[](
        -1, -1, -1,
        -1,  9, -1,
        -1, -1, -1);                       // sharpen

    vec3 sum = vec3(0.0);
    for (int i = 0; i < 9; ++i)
        sum += texture(uScene, TexCoord + offsets[i]).rgb * kernel[i];

    FragColor = vec4(sum, 1.0);
}`}</CodeBlock>
      <p>
        {tx(t, "oglFbo_grayBody",
          "The grayscale weights are the Rec. 709 luminance coefficients: they say how bright each primary looks to the eye. Green contributes 72%, red 21%, blue 7%, so pure blue (0, 0, 1) becomes a dark 0.07 and pure green a bright 0.72. A flat average (r + g + b) / 3 would make both 0.33 and the image would look wrong.")}
      </p>
      <Equation label={tx(t, "oglFbo_convLabel", "A 3×3 convolution")}
        where={[
          [r`p`, tx(t, "oglFbo_wP", "the texture coordinate of the output pixel")],
          [r`i,\ j`, tx(t, "oglFbo_wIJ", "the neighbour's column and row offset, each −1, 0 or 1")],
          [r`k_{ij}`, tx(t, "oglFbo_wK", "the kernel weight for that neighbour, the 3×3 table in the shader")],
          [r`\Delta`, tx(t, "oglFbo_wDelta", "one texel in UV units, 1 / textureSize: 1/1920 ≈ 0.00052 across a 1080p image")],
        ]}>
        {r`\text{out}(p) = \sum_{j=-1}^{1}\sum_{i=-1}^{1} k_{ij}\;\text{in}\big(p + (i\,\Delta_x,\ j\,\Delta_y)\big)`}
      </Equation>

      <H3>{tx(t, "oglFbo_workedTitle", "Worked example: one bright pixel")}</H3>
      <p>
        {tx(t, "oglFbo_workedBody",
          "Take a grey pixel of 0.5 whose eight neighbours are all 0.4. Sharpen (centre 9, neighbours −1): 9 × 0.5 − 8 × 0.4 = 4.5 − 3.2 = 1.3, so the difference to its neighbours grows from 0.1 to 0.9. On a flat area of value v the same kernel gives 9v − 8v = v, unchanged: the weights sum to 1, which keeps overall brightness. Box blur (all weights 1/9): (0.5 + 8 × 0.4) / 9 = 3.7 / 9 ≈ 0.411, the spike almost flattened. Edge detection (centre −8, neighbours 1): 8 × 0.4 − 8 × 0.5 = −0.8, and 0 on any flat area, because its weights sum to 0. That is the general rule: weights summing to 1 preserve brightness, weights summing to 0 respond only to change. The Post-processing chapter has an interactive kernel lab to try these on an image.")}
      </p>

      <Callout type="warn" t={t}>
        {tx(t, "oglFbo_resizeWarn",
          "Attachments do not resize with the window. When the framebuffer size callback fires you must recreate — or reallocate — every attachment at the new size, or your post pass keeps sampling a stale, wrongly-sized texture and the image stretches.")}
      </Callout>

      <H2>{tx(t, "oglFbo_choicesTitle", "Choices in the code")}</H2>
      <LessonTable
        headers={[tx(t, "oglFbo_tChoice", "Choice"), tx(t, "oglFbo_tReason", "Reason")]}
        rows={[
          [tx(t, "oglFbo_c1", "GL_RGBA16F colour"), tx(t, "oglFbo_c1b", "lighting can exceed 1.0 before tone mapping; RGBA8 would clamp it (HDR chapter). Use RGBA8 when the pass is already display-ready.")],
          [tx(t, "oglFbo_c2", "GL_LINEAR min filter, not a mipmap filter"), tx(t, "oglFbo_c2b", "the texture has only level 0; a mipmap filter would make it incomplete and it would sample black.")],
          [tx(t, "oglFbo_c3", "GL_CLAMP_TO_EDGE"), tx(t, "oglFbo_c3b", "kernels sample one texel past the border; REPEAT would pull in pixels from the opposite edge of the screen.")],
          [tx(t, "oglFbo_c4", "depth/stencil as a renderbuffer"), tx(t, "oglFbo_c4b", "only the depth test reads it; a texture costs the same memory and is only needed if a later pass samples depth (SSAO, fog, soft particles).")],
          [tx(t, "oglFbo_c5", "depth test off in pass 2"), tx(t, "oglFbo_c5b", "one fullscreen layer has nothing to occlude, and the default framebuffer's depth may hold anything.")],
        ]}
      />

      <H2>{tx(t, "oglFbo_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglFbo_tMistake", "Mistake"), tx(t, "oglFbo_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglFbo_e1", "Viewport left at the window size for a smaller FBO"), tx(t, "oglFbo_e1b", "only the bottom-left part of the scene lands in the texture, magnified. Call glViewport on every framebuffer switch.")],
          [tx(t, "oglFbo_e2", "Sampling a texture that is attached to the framebuffer being drawn"), tx(t, "oglFbo_e2b", "a feedback loop: the result is undefined, often flickering garbage. Ping-pong between two textures instead.")],
          [tx(t, "oglFbo_e3", "Forgetting glBindFramebuffer(GL_FRAMEBUFFER, 0) before pass 2"), tx(t, "oglFbo_e3b", "the fullscreen pass draws into the FBO itself, and the screen stays black.")],
          [tx(t, "oglFbo_e4", "Default min filter on the colour texture"), tx(t, "oglFbo_e4b", "it is GL_NEAREST_MIPMAP_LINEAR, which needs mipmaps the texture does not have: sampling returns black. Set GL_LINEAR or GL_NEAREST.")],
          [tx(t, "oglFbo_e5", "Clearing only GL_COLOR_BUFFER_BIT in pass 1"), tx(t, "oglFbo_e5b", "the FBO's depth keeps last frame's values and the scene fails the depth test. Clear depth too.")],
          [tx(t, "oglFbo_e6", "Gamma-encoding in the scene shader and again in the post pass"), tx(t, "oglFbo_e6b", "a washed-out image. Scene passes write linear values; only the last pass encodes.")],
        ]}
      />

      <KeyIdeas t={t} id="oglFbo" items={[
        "A framebuffer object owns no memory; it points at textures and renderbuffers.",
        "Attach a texture to sample the result later, a renderbuffer when only the GPU's tests need it.",
        "Check completeness after building, and set the viewport on every framebuffer switch.",
        "A 1080p RGBA16F + D24S8 target costs about 25 MB.",
        "One triangle at (−1,−1), (3,−1), (−1,3) covers the screen with TexCoord 0–1 and needs no vertex buffer.",
        "A kernel whose weights sum to 1 keeps brightness; summing to 0, it detects change.",
      ]} />
    </Article>
  );
}
