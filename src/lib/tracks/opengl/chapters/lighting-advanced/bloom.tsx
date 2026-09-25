// src/lib/tracks/opengl/chapters/lighting-advanced/bloom.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { BloomFigure } from "@/components/lesson/figures/advlighting/BloomFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Bloom
// ═════════════════════════════════════════════════════════════════════════════

export function BloomContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglBloom_intro",
          "Real lenses and eyes scatter a little of very bright light onto its surroundings, so a lamp glows. A monitor cannot actually be that bright, but reproducing the glow tells the brain it is. Bloom needs HDR: only with values above 1.0 do we know what is bright enough to bleed.")}
      </Lead>

      <BloomFigure t={t} />

      <H2>{tx(t, "oglBloom_brightTitle", "1. Extract the bright parts")}</H2>
      <p>
        {tx(t, "oglBloom_brightBody",
          "Measure each pixel's brightness as luminance — the eye is far more sensitive to green than blue — and keep only what exceeds a threshold. A soft knee instead of a hard cut avoids flickering pixels at the boundary.")}
      </p>
      <Equation label={tx(t, "oglBloom_lumLabel", "Luminance (Rec. 709 weights)")}>
        {r`Y = 0.2126\,R + 0.7152\,G + 0.0722\,B
\qquad
\text{bright} = \mathbf{c}\cdot\operatorname{smoothstep}(\tau,\; \tau + k,\; Y)`}
      </Equation>

      <H2>{tx(t, "oglBloom_blurTitle", "2. Blur it — separably")}</H2>
      <p>
        {tx(t, "oglBloom_blurBody",
          "A Gaussian blur weighs neighbours by a bell curve. Its key property: the 2D Gaussian is the product of two 1D Gaussians, so one expensive 2D pass can be replaced by a horizontal pass followed by a vertical one.")}
      </p>
      <Equation label={tx(t, "oglBloom_sepLabel", "Why the blur can be split")}
        note={tx(t, "oglBloom_sepNote", "With a 9-tap kernel that is 18 samples per pixel instead of 81 — and repeating the pair of passes widens the blur further at the same cost each time.")}>
        {r`G(x, y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}
= \underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{x^2}{2\sigma^2}}}_{\text{horizontal}}
\cdot
\underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{y^2}{2\sigma^2}}}_{\text{vertical}}
\qquad
N^2 \;\to\; 2N \text{ samples}`}
      </Equation>
      <CodeBlock lang="glsl" filename="blur.frag" t={t}>{`uniform bool horizontal;
uniform float weight[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {
    vec2 texel = 1.0 / textureSize(image, 0);
    vec2 dir = horizontal ? vec2(texel.x, 0.0) : vec2(0.0, texel.y);
    vec3 result = texture(image, TexCoords).rgb * weight[0];
    for (int i = 1; i < 5; ++i) {
        result += texture(image, TexCoords + dir * float(i)).rgb * weight[i];
        result += texture(image, TexCoords - dir * float(i)).rgb * weight[i];
    }
    FragColor = vec4(result, 1.0);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="ping_pong.cpp" t={t}>{`bool horizontal = true, first = true;
for (int i = 0; i < 10; ++i) {                  // 5 horizontal + 5 vertical passes
    glBindFramebuffer(GL_FRAMEBUFFER, pingpongFBO[horizontal]);
    blurShader.setInt("horizontal", horizontal);
    glBindTexture(GL_TEXTURE_2D, first ? brightTexture : pingpongTex[!horizontal]);
    renderQuad();
    horizontal = !horizontal;
    first = false;
}`}</CodeBlock>

      <H2>{tx(t, "oglBloom_combineTitle", "3. Add it back")}</H2>
      <Equation>{r`\mathbf{c}_{\text{out}} = \operatorname{tonemap}\big(\mathbf{c}_{\text{scene}} + s\cdot\mathbf{c}_{\text{bloom}}\big)`}</Equation>

      <Callout type="tip" t={t}>
        {tx(t, "oglBloom_tip",
          "Blurring at half (or quarter) resolution is almost free and looks the same, since the result is soft anyway. Modern engines go further: downsample the bright buffer into a chain of mip levels, blur each a little, then upsample and add them together — a wide, stable bloom at a fraction of the cost.")}
      </Callout>

      <KeyIdeas t={t} id="oglBloom" items={[
        "Bloom works on HDR values: keep only luminance above a threshold.",
        "A Gaussian is separable — two 1D passes replace one 2D pass (2N vs N² samples).",
        "Add the blurred glow back before tone mapping.",
      ]} />
    </Article>
  );
}
