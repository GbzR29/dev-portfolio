// src/lib/tracks/opengl/chapters/lighting-advanced/hdr.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { HdrFigure } from "@/components/lesson/figures/advlighting/HdrFigure";

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

      <H2>{tx(t, "oglHdr_fbTitle", "A floating-point framebuffer")}</H2>
      <p>
        {tx(t, "oglHdr_fbBody",
          "Render the scene into a texture whose format can hold values above 1: GL_RGBA16F is the usual choice — half floats reach 65504 with plenty of precision for colour. Then a fullscreen pass reads it and writes the tone-mapped result to the screen.")}
      </p>
      <CodeBlock lang="cpp" filename="hdr_fbo.cpp" t={t}>{`glBindTexture(GL_TEXTURE_2D, colorBuffer);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, width, height, 0, GL_RGBA, GL_FLOAT, nullptr);
glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colorBuffer, 0);
// + a depth renderbuffer, as for any 3D pass`}</CodeBlock>

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
        ]}>
        {r`\underbrace{\;\frac{x}{1 + x}\;}_{\text{Reinhard}}
\qquad
\underbrace{\;1 - e^{-e\,x}\;}_{\text{exposure}}
\qquad
\underbrace{\;\frac{x\,(2.51x + 0.03)}{x\,(2.43x + 0.59) + 0.14}\;}_{\text{ACES (Narkowicz fit)}}`}
      </Equation>
      <CodeBlock lang="glsl" filename="tonemap.frag" t={t}>{`vec3 hdr = texture(hdrBuffer, TexCoords).rgb;
vec3 mapped = vec3(1.0) - exp(-hdr * exposure);   // exposure tone mapping
mapped = pow(mapped, vec3(1.0 / 2.2));             // then gamma-encode
FragColor = vec4(mapped, 1.0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglHdr_autoNote",
          "Games usually pick the exposure automatically: compute the scene's average luminance (downsample the HDR buffer to 1×1, or use glGenerateMipmap and read the last level), then ease the exposure toward it over time. That is the \"eye adaptation\" you see when walking out of a dark tunnel.")}
      </Callout>

      <KeyIdeas t={t} id="oglHdr" items={[
        "Light in a float (RGBA16F) framebuffer so values above 1.0 survive.",
        "Tone mapping is a curve from [0, ∞) into [0, 1): Reinhard, exposure, ACES…",
        "Tone map first, gamma-encode last.",
      ]} />
    </Article>
  );
}
