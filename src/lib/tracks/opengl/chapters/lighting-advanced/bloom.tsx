// src/lib/tracks/opengl/chapters/lighting-advanced/bloom.tsx
"use client";

// Bloom (explanation pass 2026-09-30): the bright pass with luminance weights
// and the soft knee, worked on two pixels; the Gaussian term by term, where
// the five weights come from (binomial row 12, σ = √3), coverage and the 3σ
// rule (GaussKernel figure); separability; how repeated passes widen the blur
// (σ√n); the bilinear two-taps-per-fetch trick with its numbers; ping-pong;
// compositing; choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { BloomFigure } from "@/components/lesson/figures/advlighting/BloomFigure";
import { GaussKernelFigure } from "@/components/lesson/figures/advlighting/GaussKernelFigure";

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

      <p>
        {tx(t, "oglBloom_overview",
          "The whole effect is four passes: render the scene into an HDR buffer (previous chapter); copy out only the bright parts; blur that copy; add the blur back to the scene and tone map. The blur is where the time goes, so most of this chapter is about blurring cheaply.")}
      </p>

      <H2>{tx(t, "oglBloom_brightTitle", "1. Extract the bright parts")}</H2>
      <p>
        {tx(t, "oglBloom_brightBody",
          "Measure each pixel's brightness as luminance — the eye is far more sensitive to green than blue — and keep only what exceeds a threshold. A soft knee instead of a hard cut avoids flickering pixels at the boundary.")}
      </p>
      <Equation label={tx(t, "oglBloom_lumLabel", "Luminance (Rec. 709 weights)")}
        where={[
          [r`R, G, B`, tx(t, "oglBloom_wRGB", "the linear HDR colour of the pixel")],
          [r`0.2126,\ 0.7152,\ 0.0722`, tx(t, "oglBloom_wWeights", "how bright each primary looks to the eye; they add up to 1, so white (1, 1, 1) has Y = 1")],
          [r`\tau`, tx(t, "oglBloom_wTau", "the threshold: pixels with Y below it do not bloom at all (typically 1.0)")],
          [r`k`, tx(t, "oglBloom_wK", "the knee width: between τ and τ + k the pixel fades in smoothly instead of switching on (typically 0.5)")],
          [r`\operatorname{smoothstep}(a, b, Y)`, tx(t, "oglBloom_wSmooth", "0 below a, 1 above b, and an S-shaped ramp 3s² − 2s³ in between, with s = (Y − a)/(b − a)")],
        ]}>
        {r`Y = 0.2126\,R + 0.7152\,G + 0.0722\,B
\qquad
\text{bright} = \mathbf{c}\cdot\operatorname{smoothstep}(\tau,\; \tau + k,\; Y)`}
      </Equation>
      <p>
        {tx(t, "oglBloom_brightWorked",
          "Two pixels with τ = 1 and k = 0.5. A lamp shade at (3, 2.5, 1): Y = 0.638 + 1.788 + 0.072 = 2.498, above 1.5, so it is copied in full. A lit wall at (0.8, 0.6, 0.4): Y = 0.170 + 0.429 + 0.029 = 0.628, below 1, so it contributes nothing. With a hard cut, a pixel hovering around Y = 1 would switch its whole glow on and off from one frame to the next; the knee turns that into a gentle fade.")}
      </p>
      <CodeBlock lang="glsl" filename="bright.frag" t={t}>{`uniform sampler2D scene;        // the HDR buffer
uniform float threshold;        // τ, e.g. 1.0
uniform float knee;             // k, e.g. 0.5

void main() {
    vec3  c = texture(scene, TexCoords).rgb;
    float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));
    FragColor = vec4(c * smoothstep(threshold, threshold + knee, Y), 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "oglBloom_blurTitle", "2. Blur it — separably")}</H2>
      <p>
        {tx(t, "oglBloom_blurBody",
          "A Gaussian blur weighs neighbours by a bell curve. Its key property: the 2D Gaussian is the product of two 1D Gaussians, so one expensive 2D pass can be replaced by a horizontal pass followed by a vertical one.")}
      </p>
      <Equation label={tx(t, "oglBloom_sepLabel", "Why the blur can be split")}
        where={[
          [r`x, y`, tx(t, "oglBloom_wXY", "the offset of a neighbour from the centre pixel, in pixels")],
          [r`\sigma`, tx(t, "oglBloom_wSigma", "the standard deviation: the width of the bell in pixels; 68% of the weight lies within ±σ, 99.7% within ±3σ")],
          [r`\frac{1}{2\pi\sigma^2}`, tx(t, "oglBloom_wNormC", "the factor that makes all weights add up to 1, so a flat area keeps its brightness")],
          [r`N`, tx(t, "oglBloom_wN", "the number of taps across the kernel (9 in the shader below)")],
        ]}
        note={tx(t, "oglBloom_sepNote", "With a 9-tap kernel that is 18 samples per pixel instead of 81 — and repeating the pair of passes widens the blur further at the same cost each time.")}>
        {r`G(x, y) = \frac{1}{2\pi\sigma^2}\,e^{-\frac{x^2 + y^2}{2\sigma^2}}
= \underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{x^2}{2\sigma^2}}}_{\text{horizontal}}
\cdot
\underbrace{\frac{1}{\sqrt{2\pi}\sigma}e^{-\frac{y^2}{2\sigma^2}}}_{\text{vertical}}
\qquad
N^2 \;\to\; 2N \text{ samples}`}
      </Equation>
      <p>
        {tx(t, "oglBloom_sepWhy",
          "The split works because e^(a + b) = e^a · e^b: the exponent x² + y² separates into an x part and a y part. Blurring every row with the horizontal weights and then every column of that result with the vertical weights multiplies them together, giving each 2D neighbour exactly the weight w[x] · w[y].")}
      </p>
      <GaussKernelFigure t={t} />

      <H3>{tx(t, "oglBloom_weightsTitle", "Where the five weights come from")}</H3>
      <p>
        {tx(t, "oglBloom_weightsBody",
          "The weights in the shader below are not magic. Take row 12 of Pascal's triangle (1, 12, 66, 220, 495, 792, 924, 792, …, 1), which approaches a Gaussian as rows grow. Drop the two outer entries on each side, which are tiny, and divide the remaining nine by their sum, 4070: 924/4070 = 0.227027, 792/4070 = 0.1945946, 495/4070 = 0.1216216, 220/4070 = 0.054054, 66/4070 = 0.016216. Binomial row n matches a Gaussian with σ = √n / 2, here √12 / 2 = √3 ≈ 1.73 pixels. The weight array stores only one half because the kernel is symmetric: the loop uses weight[i] for both +i and −i.")}
      </p>
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
      <p>
        {tx(t, "oglBloom_texelBody",
          "Texture coordinates run from 0 to 1 across the whole image, so one pixel is 1 / width horizontally and 1 / height vertically; textureSize returns the size of mip level 0. dir is one pixel along the axis of this pass, and the loop steps 1 to 4 pixels each way.")}
      </p>

      <H3>{tx(t, "oglBloom_pingTitle", "Ping-pong: repeating the passes")}</H3>
      <CodeBlock lang="cpp" filename="ping_pong.cpp" t={t}>{`bool horizontal = true, first = true;
for (int i = 0; i < 10; ++i) {                  // 5 horizontal + 5 vertical passes
    glBindFramebuffer(GL_FRAMEBUFFER, pingpongFBO[horizontal]);
    blurShader.setInt("horizontal", horizontal);
    glBindTexture(GL_TEXTURE_2D, first ? brightTexture : pingpongTex[!horizontal]);
    renderQuad();
    horizontal = !horizontal;
    first = false;
}`}</CodeBlock>
      <p>
        {tx(t, "oglBloom_pingBody",
          "A pass cannot read the texture it is writing to (that is a feedback loop, with undefined results), so two framebuffers take turns: each pass reads the texture the previous pass wrote and writes into the other one. Blurring twice with σ is the same as blurring once with σ√2, and n times gives σ√n. So five pairs of passes with σ = 1.73 act like one Gaussian of 1.73 · √5 = 3.9 pixels, and at half resolution that is about 7.7 pixels of the full image.")}
      </p>
      <Equation label={tx(t, "oglBloom_repeatLabel", "Repeated blurs add up in quadrature")}
        where={[[r`n`, tx(t, "oglBloom_wReps", "the number of times the same blur is applied")]]}>
        {r`\sigma_{\text{total}} = \sqrt{\sigma_1^2 + \sigma_2^2 + \dots} = \sigma\sqrt{n}`}
      </Equation>

      <H3>{tx(t, "oglBloom_linearTitle", "Two taps per fetch")}</H3>
      <p>
        {tx(t, "oglBloom_linearBody",
          "With GL_LINEAR filtering, sampling halfway between two pixels returns a weighted blend of both, for the price of one fetch. So each pair of neighbouring taps can be read at once, at an offset between them that reproduces their two weights. Taps 1 and 2 (weights 0.1946 and 0.1216) become one fetch of weight 0.3162 at offset 1.385; taps 3 and 4 become weight 0.0703 at offset 3.231. The nine-tap pass drops to five fetches.")}
      </p>
      <Equation label={tx(t, "oglBloom_pairLabel", "Merging two taps")}
        where={[
          [r`w_1, w_2`, tx(t, "oglBloom_wW12", "the weights of two adjacent taps")],
          [r`o_1, o_2`, tx(t, "oglBloom_wO12", "their offsets from the centre, in pixels")],
        ]}>
        {r`w = w_1 + w_2 \qquad o = \frac{o_1 w_1 + o_2 w_2}{w_1 + w_2}`}
      </Equation>

      <H2>{tx(t, "oglBloom_combineTitle", "3. Add it back")}</H2>
      <Equation where={[
        [r`s`, tx(t, "oglBloom_wS", "bloom strength: around 0.5–1 after a thresholded bright pass; engines that skip the threshold and blur the whole image mix in only a small fraction, about 0.04")],
        [r`\operatorname{tonemap}`, tx(t, "oglBloom_wTone", "the operator from the HDR chapter, applied after the addition")],
      ]}>{r`\mathbf{c}_{\text{out}} = \operatorname{tonemap}\big(\mathbf{c}_{\text{scene}} + s\cdot\mathbf{c}_{\text{bloom}}\big)`}</Equation>
      <p>
        {tx(t, "oglBloom_combineBody",
          "The glow is added while the values are still HDR light, then the sum goes through the tone mapper and the gamma encode. Added after tone mapping, the glow would be clamped at 1 and would push already white pixels into flat white patches.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglBloom_tip",
          "Blurring at half (or quarter) resolution is almost free and looks the same, since the result is soft anyway. Modern engines go further: downsample the bright buffer into a chain of mip levels, blur each a little, then upsample and add them together — a wide, stable bloom at a fraction of the cost.")}
      </Callout>

      <LessonTable
        headers={[tx(t, "oglBloom_tChoice", "Choice"), tx(t, "oglBloom_tReason", "Reason")]}
        rows={[
          [tx(t, "oglBloom_c1", "GL_RGBA16F for the bright and ping-pong buffers"), tx(t, "oglBloom_c1b", "the glow of a bulb at 50 must stay 50 while it is spread out; an 8-bit buffer would clamp it to 1 and the bloom would be weak and grey.")],
          [tx(t, "oglBloom_c2", "GL_CLAMP_TO_EDGE on those textures"), tx(t, "oglBloom_c2b", "with GL_REPEAT, taps past the right edge read the left edge, and a lamp on one side glows on the other.")],
          [tx(t, "oglBloom_c3", "GL_LINEAR filtering"), tx(t, "oglBloom_c3b", "needed for the two-taps-per-fetch trick and when sampling a half-resolution buffer back at full size.")],
          [tx(t, "oglBloom_c4", "bright pass by luminance, not by max(R, G, B)"), tx(t, "oglBloom_c4b", "a pure blue light of 1.2 is not perceived as bright (Y = 0.09) and should not glow like a white one.")],
        ]}
      />

      <H2>{tx(t, "oglBloom_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglBloom_tMistake", "Mistake"), tx(t, "oglBloom_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglBloom_e1", "Bloom on an 8-bit scene buffer"), tx(t, "oglBloom_e1b", "nothing is above 1, so the threshold keeps white walls and paper along with the lamps. Render the scene to RGBA16F.")],
          [tx(t, "oglBloom_e2", "Reading and writing the same texture in a blur pass"), tx(t, "oglBloom_e2b", "undefined results: streaks, blocks or garbage that change from GPU to GPU. Ping-pong between two targets.")],
          [tx(t, "oglBloom_e3", "One NaN or huge pixel"), tx(t, "oglBloom_e3b", "the blur spreads it into a black or white square that grows with each pass. Clamp the bright pass output (min(c, 100.0)) and fix the NaN at its source.")],
          [tx(t, "oglBloom_e4", "Tiny, very bright pixels flickering"), tx(t, "oglBloom_e4b", "specular sparkles that cover one pixel one frame and none the next make the glow pulse. Use the soft knee, and when downsampling weight each sample by 1 / (1 + Y) (Karis average).")],
          [tx(t, "oglBloom_e5", "Viewport left at full size for a half-resolution target"), tx(t, "oglBloom_e5b", "only a quarter of the image gets blurred. Call glViewport with the target's size before each pass, and restore it afterwards.")],
          [tx(t, "oglBloom_e6", "Bloom added after tone mapping"), tx(t, "oglBloom_e6b", "the glow is clipped, highlights turn into flat patches. Add it to the HDR colour, then tone map.")],
        ]}
      />

      <KeyIdeas t={t} id="oglBloom" items={[
        "Bloom works on HDR values: keep only luminance above a threshold.",
        "A Gaussian is separable — two 1D passes replace one 2D pass (2N vs N² samples).",
        "Add the blurred glow back before tone mapping.",
        "The five classic weights are binomial row 12 normalised: a Gaussian with σ ≈ 1.73.",
        "Repeating a blur n times widens it by √n; bilinear filtering reads two taps per fetch.",
        "Ping-pong between two float buffers with CLAMP_TO_EDGE; never read the target you write.",
      ]} />
    </Article>
  );
}
