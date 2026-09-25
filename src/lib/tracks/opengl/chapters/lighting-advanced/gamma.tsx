// src/lib/tracks/opengl/chapters/lighting-advanced/gamma.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { GammaFigure } from "@/components/lesson/figures/advlighting/GammaFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Gamma correction
// ═════════════════════════════════════════════════════════════════════════════

export function GammaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglGamma_intro",
          "Every lighting formula so far assumed that doubling a colour value doubles the light it produces. Your monitor disagrees. Getting this wrong makes lighting look too harsh and too dark, falloff look wrong, and blending look muddy — and fixing it takes two lines.")}
      </Lead>

      <H2>{tx(t, "oglGamma_displayTitle", "What the display does")}</H2>
      <p>
        {tx(t, "oglGamma_displayBody",
          "A display turns the value it receives into light with a power curve: the light it emits is roughly the value raised to 2.2. This started as a property of CRT electron guns and was kept on purpose, because it spends more of the 256 available levels on dark tones, where human eyes are most sensitive. Run the test below on your own screen:")}
      </p>
      <GammaFigure t={t} />
      <Equation label={tx(t, "oglGamma_eqLabel", "The display and its inverse")}
        where={[[r`\gamma`, tx(t, "oglGamma_wG", "≈ 2.2 for sRGB displays")]]}>
        {r`L_{\text{emitted}} = V^{\gamma}
\qquad\Longrightarrow\qquad
V = L_{\text{wanted}}^{\,1/\gamma}
\qquad
0.5^{2.2} \approx 0.218,\;\; 0.5^{1/2.2} \approx 0.730`}
      </Equation>
      <p>
        {tx(t, "oglGamma_srgbBody",
          "The standard curve, sRGB, is a power of 2.4 with a short linear segment near black (so the curve has a finite slope at zero). 2.2 is the usual approximation:")}
      </p>
      <Equation label={tx(t, "oglGamma_srgbLabel", "The exact sRGB encoding")}>
        {r`C_{\text{sRGB}} = \begin{cases} 12.92\,C_{\text{lin}} & C_{\text{lin}} \le 0.0031308 \\[4pt] 1.055\,C_{\text{lin}}^{1/2.4} - 0.055 & \text{otherwise} \end{cases}`}
      </Equation>

      <H2>{tx(t, "oglGamma_workflowTitle", "The linear workflow")}</H2>
      <p>
        {tx(t, "oglGamma_workflowBody",
          "Light adds and multiplies linearly, so every lighting calculation must happen on linear values. That means decoding colour textures on the way in (artists paint in sRGB), and encoding the final colour once on the way out. Nothing else changes.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglAdvLight_g0", "Stage"), tx(t, "oglAdvLight_g1", "Space"), tx(t, "oglAdvLight_g2", "What to do")]}
        rows={[
          [tx(t, "oglAdvLight_gs1", "Colour textures (albedo)"), "sRGB", tx(t, "oglAdvLight_ga1", "Upload as GL_SRGB8_ALPHA8 — the GPU linearizes on sample, for free.")],
          [tx(t, "oglAdvLight_gs2", "Data textures (normal, roughness)"), tx(t, "oglAdvLight_gsp2", "Linear"), tx(t, "oglAdvLight_ga2", "Upload as GL_RGBA8. Never gamma-correct these — they are numbers, not colours.")],
          [tx(t, "oglAdvLight_gs3", "All lighting maths"), tx(t, "oglAdvLight_gsp3", "Linear"), tx(t, "oglAdvLight_ga3", "Nothing. This is where it must happen.")],
          [tx(t, "oglAdvLight_gs4", "Final output"), "sRGB", tx(t, "oglAdvLight_ga4", "Encode back with pow(color, 1/2.2), or enable GL_FRAMEBUFFER_SRGB.")],
        ]}
      />
      <CodeBlock lang="cpp" filename="gamma.cpp" t={t}>{`// Option A — let the hardware do both conversions
glTexImage2D(GL_TEXTURE_2D, 0, GL_SRGB8_ALPHA8, w, h, 0,
             GL_RGBA, GL_UNSIGNED_BYTE, data);   // linearized on sample
glEnable(GL_FRAMEBUFFER_SRGB);                   // encoded on write

// Option B — do the final encode yourself in the shader
//   FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);

// Pick ONE. Doing both washes the image out completely.`}</CodeBlock>

      <H2>{tx(t, "oglGamma_attTitle", "Why attenuation looked wrong")}</H2>
      <p>
        {tx(t, "oglGamma_attBody",
          "Remember the attenuation constants from Light Casters — the linear term was needed because pure 1/d² looked too dark. That was gamma in disguise: displayed without correction, 1/d² becomes (1/d²)^2.2 ≈ 1/d^4.4. In a linear workflow the physically correct inverse square looks right on its own.")}
      </p>
      <Equation>{r`\left(\frac{1}{d^{2}}\right)^{2.2} = \frac{1}{d^{4.4}} \qquad\text{(what an uncorrected pipeline shows)}`}</Equation>

      <Callout type="warn" t={t}>
        {tx(t, "oglAdvLight_doubleWarn",
          "Double-correcting is the most common mistake here, and it looks like a faded, milky image. If you enable GL_FRAMEBUFFER_SRGB, do not also apply pow(1/2.2) in the shader. And when you switch to a linear workflow, re-tune your light intensities — values tuned to look right under the wrong curve will all be too bright.")}
      </Callout>

      <KeyIdeas t={t} id="oglGamma" items={[
        "Displays emit roughly value^2.2: a pixel value of 0.5 is only ~22% of the light.",
        "Do all lighting on linear values: decode colour textures, encode the output once.",
        "Data textures (normals, roughness, specular masks) are never gamma-corrected.",
      ]} />
    </Article>
  );
}
