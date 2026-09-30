// src/lib/tracks/opengl/chapters/lighting-advanced/hdr.tsx
"use client";

// HDR & tone mapping (explanation pass 2026-09-30): the range of real scenes
// against the 0–1 framebuffer; float formats and what their bits buy; each
// operator explained term by term (slope at 0, value at 1, limit); exposure
// in stops; one pixel worked through three operators (hue shift); the
// ToneCurve probe; automatic exposure; choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { HdrFigure } from "@/components/lesson/figures/advlighting/HdrFigure";
import { ToneCurveFigure } from "@/components/lesson/figures/advlighting/ToneCurveFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// HDR
// ═════════════════════════════════════════════════════════════════════════════

export function HdrContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglHdr_intro",
          "The sun is thousands of times brighter than a lamp, which is brighter than a shaded wall — but a default framebuffer stores each channel in 8 bits clamped to [0, 1]. High dynamic range rendering keeps the real values while lighting and only squeezes them into the displayable range at the very end.")}
      </Lead>

      <H2>{tx(t, "oglHdr_problemTitle", "What clamping destroys")}</H2>
      <p>
        {tx(t, "oglHdr_problemBody",
          "Light a white wall with two lamps, each contributing 0.8. The true value is 1.6; an RGBA8 framebuffer stores 1.0. Add a third lamp: still 1.0. Everything above 1 becomes the same flat white, so the difference between a lit wall, a lamp shade and the bulb itself is gone, and any later pass (bloom, exposure, reflections) cannot get it back. Colours suffer too: an orange light of (2.0, 1.2, 0.4) is stored as (1.0, 1.0, 0.4), a pale yellow.")}
      </p>
      <p>
        {tx(t, "oglHdr_rangeBody",
          "The real world spans a far wider range. Typical luminances, in candela per square metre: a moonlit landscape about 0.01, an office wall about 100, an SDR monitor's white about 250, a clear sky about 8000, the disc of the sun about 1.6 billion. A scene with a window and a dark corner easily covers a ratio of 10 000 : 1, while an 8-bit display shows maybe 1000 : 1. Some squeezing is unavoidable; HDR rendering decides how, at the end, with all the information still available.")}
      </p>

      <H2>{tx(t, "oglHdr_fbTitle", "A floating-point framebuffer")}</H2>
      <p>
        {tx(t, "oglHdr_fbBody",
          "Render the scene into a texture whose format can hold values above 1: GL_RGBA16F is the usual choice — half floats reach 65504 with plenty of precision for colour. Then a fullscreen pass reads it and writes the tone-mapped result to the screen.")}
      </p>
      <CodeBlock lang="cpp" filename="hdr_fbo.cpp" t={t}>{`glBindTexture(GL_TEXTURE_2D, colorBuffer);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, nullptr);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colorBuffer, 0);
// + a depth renderbuffer, as for any 3D pass`}</CodeBlock>
      <p>
        {tx(t, "oglHdr_formatBody",
          "The third argument (the internal format) decides what the GPU stores. The last two only describe the data you pass in, here nothing (nullptr). A half float has 1 sign bit, 5 exponent bits and 10 mantissa bits: the exponent lets it cover 0.00006 to 65504, and the mantissa keeps about 3 significant digits at every scale, so 0.01 and 1000 are stored with the same relative precision. That is exactly what light needs.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglHdr_tFormat", "Format"), tx(t, "oglHdr_tBytes", "Bytes / pixel"), tx(t, "oglHdr_tRange", "Range"), tx(t, "oglHdr_tUse", "When")]}
        rows={[
          ["GL_RGBA8", "4", tx(t, "oglHdr_f1r", "0–1, 256 steps"), tx(t, "oglHdr_f1", "the final LDR image; useless for HDR")],
          ["GL_R11F_G11F_B10F", "4", tx(t, "oglHdr_f2r", "0–65000, no sign, no alpha"), tx(t, "oglHdr_f2", "HDR colour at half the memory; 6 and 5 mantissa bits, so smooth gradients may band slightly")],
          ["GL_RGBA16F", "8", "±65504", tx(t, "oglHdr_f3", "the default for HDR scene colour, bloom and post-processing")],
          ["GL_RGBA32F", "16", "±3.4 × 10³⁸", tx(t, "oglHdr_f4", "positions or simulation data; overkill for colour")],
        ]}
      />

      <HdrFigure t={t} />

      <H2>{tx(t, "oglHdr_toneTitle", "Tone mapping operators")}</H2>
      <p>
        {tx(t, "oglHdr_toneBody",
          "A tone-mapping operator is a curve from [0, ∞) to [0, 1). Each makes a different trade between keeping highlights and keeping contrast:")}
      </p>
      <Equation label={tx(t, "oglHdr_opsLabel", "Three classic operators")}
        where={[
          [r`x`, tx(t, "oglHdr_wX", "HDR colour, per channel, after multiplying by the exposure")],
          [r`e`, tx(t, "oglHdr_wE", "exposure — like a camera's, it picks which brightness becomes mid-grey")],
          [r`2.51,\ 0.03,\ 2.43,\ 0.59,\ 0.14`, tx(t, "oglHdr_wAces", "constants Krzysztof Narkowicz fitted so that this cheap rational curve follows the ACES film curve")],
        ]}>
        {r`\underbrace{\;\frac{x}{1 + x}\;}_{\text{Reinhard}}
\qquad
\underbrace{\;1 - e^{-e\,x}\;}_{\text{exposure}}
\qquad
\underbrace{\;\frac{x\,(2.51x + 0.03)}{x\,(2.43x + 0.59) + 0.14}\;}_{\text{ACES (Narkowicz fit)}}`}
      </Equation>
      <p>
        {tx(t, "oglHdr_whyNotScale",
          "Why a curve and not simply dividing by the brightest value? Dividing is linear: if the bulb is 150, the wall at 0.4 becomes 0.003 and the whole room goes black. A curve compresses the bright end hard and leaves the dark end almost untouched, the way film and our eyes do.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglHdr_tOp", "Operator"), tx(t, "oglHdr_tSlope", "Slope at 0"), tx(t, "oglHdr_tAt1", "Value at x = 1"), tx(t, "oglHdr_tLimit", "As x → ∞"), tx(t, "oglHdr_tChar", "Character")]}
        rows={[
          ["Reinhard", "1", "0.5", tx(t, "oglHdr_never", "1 (never reached)"), tx(t, "oglHdr_o1", "darks untouched, every value kept distinct, but flat, greyish highlights")],
          [tx(t, "oglHdr_o2n", "exposure"), "e", "1 − 1/e = 0.632 (e = 1)", tx(t, "oglHdr_never", "1 (never reached)"), tx(t, "oglHdr_o2", "one knob moves the whole curve; smooth roll-off")],
          ["ACES", "≈ 0.2", "0.804", tx(t, "oglHdr_o3l", "1.033: clamp it"), tx(t, "oglHdr_o3", "a toe that darkens shadows, contrasty mid-tones, a filmic shoulder")],
        ]}
      />
      <CodeBlock lang="glsl" filename="tonemap.frag" t={t}>{`vec3 hdr = texture(hdrBuffer, TexCoords).rgb;
vec3 mapped = vec3(1.0) - exp(-hdr * exposure);   // exposure tone mapping
mapped = pow(mapped, vec3(1.0 / 2.2));             // then gamma-encode
FragColor = vec4(mapped, 1.0);`}</CodeBlock>

      <H3>{tx(t, "oglHdr_stopsTitle", "Exposure in stops")}</H3>
      <p>
        {tx(t, "oglHdr_stopsBody",
          "Photographers count exposure in stops: one stop is a factor of 2. Exposing +1 stop doubles every value before the curve, −2 stops divides by 4. In code, exposure = 2^EV, so a slider over EV from −4 to +4 covers a factor of 256 evenly, while a slider directly over the factor would spend most of its travel on the bright end.")}
      </p>
      <ToneCurveFigure t={t} />

      <H2>{tx(t, "oglHdr_workedTitle", "Worked example: one orange pixel")}</H2>
      <p>
        {tx(t, "oglHdr_workedIntro",
          "A pixel lit by a strong orange lamp holds (4.0, 2.0, 0.5) in the HDR buffer, exposure 1. Its channels are in the ratio 8 : 4 : 1.")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglHdr_w1", "Clamping: (1, 1, 0.5). Red and green are both cut, so the orange turns into pale yellow and the ratio is gone.")}</li>
        <li>{tx(t, "oglHdr_w2", "Reinhard: 4/5, 2/3, 0.5/1.5 = (0.800, 0.667, 0.333), ratio 2.4 : 2 : 1. After the 1/2.2 encode: bytes (230, 212, 155).")}</li>
        <li>{tx(t, "oglHdr_w3", "Exposure: 1 − e^(−4), 1 − e^(−2), 1 − e^(−0.5) = (0.982, 0.865, 0.393), bytes (253, 239, 167).")}</li>
        <li>{tx(t, "oglHdr_w4", "ACES fit: (0.973, 0.915, 0.616), bytes (252, 245, 205).")}</li>
      </ol>
      <p>
        {tx(t, "oglHdr_workedRead",
          "Every operator applied per channel squeezes the largest channel most, so a very bright colour moves toward white. That desaturation is not a bug: film does the same and it reads as \"extremely bright\". But it also shifts hue (orange drifts toward yellow). If you want to keep the hue, tone map the luminance Y instead and scale the colour by Y_mapped / Y. Notice also that ACES lifted the dim blue channel from 0.5 to 0.616: the Narkowicz fit brightens mid-tones, and its author suggests multiplying the input by 0.6 first to match the reference exposure.")}
      </p>

      <Callout type="info" t={t}>
        {tx(t, "oglHdr_autoNote",
          "Games usually pick the exposure automatically: compute the scene's average luminance (downsample the HDR buffer to 1×1, or use glGenerateMipmap and read the last level), then ease the exposure toward it over time. That is the \"eye adaptation\" you see when walking out of a dark tunnel.")}
      </Callout>
      <p>
        {tx(t, "oglHdr_autoMath",
          "The average used is the geometric mean, exp(average of ln(Y + ε)), because it is not dragged up by a few very bright pixels: one bulb on screen should not darken the whole room. The exposure is then chosen so that this average lands on middle grey, about 0.18: e = 0.18 / Y_avg. The small ε (for example 0.0001) keeps ln from seeing a zero.")}
      </p>

      <LessonTable
        headers={[tx(t, "oglHdr_tChoice", "Choice"), tx(t, "oglHdr_tReason", "Reason")]}
        rows={[
          [tx(t, "oglHdr_c1", "tone mapping in its own fullscreen pass"), tx(t, "oglHdr_c1b", "the operator needs the finished HDR image; bloom, fog and transparent objects must all be added before it.")],
          [tx(t, "oglHdr_c2", "exposure multiplied before the curve"), tx(t, "oglHdr_c2b", "the curve's shape stays fixed and the exposure slides the scene along it, exactly like a camera's shutter.")],
          [tx(t, "oglHdr_c3", "pow(1/2.2) after the curve, not before"), tx(t, "oglHdr_c3b", "the operator is designed for linear light; the gamma encode is always the very last step (Gamma chapter).")],
          [tx(t, "oglHdr_c4", "GL_FLOAT in glTexImage2D"), tx(t, "oglHdr_c4b", "only describes the (empty) input data; the GL_RGBA16F internal format is what makes the buffer HDR.")],
        ]}
      />

      <H2>{tx(t, "oglHdr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglHdr_tMistake", "Mistake"), tx(t, "oglHdr_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglHdr_e1", "Internal format GL_RGBA with type GL_FLOAT"), tx(t, "oglHdr_e1b", "the buffer is still 8-bit and clamps at 1; the tone mapper receives nothing above 1 and everything looks dim. Use GL_RGBA16F as the internal format.")],
          [tx(t, "oglHdr_e2", "Gamma encoding in the scene shader and again after tone mapping"), tx(t, "oglHdr_e2b", "a washed-out image. Scene shaders output linear HDR; only the final pass encodes.")],
          [tx(t, "oglHdr_e3", "ACES fit without clamp"), tx(t, "oglHdr_e3b", "values up to 1.033 go to an RGBA8 target and clip anyway, or leak into later passes. Wrap it in clamp(…, 0.0, 1.0).")],
          [tx(t, "oglHdr_e4", "A NaN or infinity in the HDR buffer"), tx(t, "oglHdr_e4b", "a normalize() of a zero vector or a division by zero gives one black or white pixel that bloom then spreads into a square. Guard divisions; check with a debug view that paints isnan() pixels magenta.")],
          [tx(t, "oglHdr_e5", "Exposure 0 or negative"), tx(t, "oglHdr_e5b", "1 − e^0 = 0: a black screen. Clamp the auto-exposure result to a sensible range.")],
          [tx(t, "oglHdr_e6", "Light intensities still tuned for LDR"), tx(t, "oglHdr_e6b", "a sun of 1.0 and lamps of 1.0 give no contrast for the operator to work with. Give lights their real ratios (sun 10–100× a lamp) and let exposure bring them back.")],
        ]}
      />

      <KeyIdeas t={t} id="oglHdr" items={[
        "Light in a float (RGBA16F) framebuffer so values above 1.0 survive.",
        "Tone mapping is a curve from [0, ∞) into [0, 1): Reinhard, exposure, ACES…",
        "Tone map first, gamma-encode last.",
        "Clamping turns (4, 2, 0.5) orange into (1, 1, 0.5) pale yellow; a curve keeps it orange-ish.",
        "Exposure is counted in stops: e = 2^EV, each stop doubles the light.",
        "Auto-exposure aims the geometric-mean luminance at middle grey: e = 0.18 / Y_avg.",
      ]} />
    </Article>
  );
}
