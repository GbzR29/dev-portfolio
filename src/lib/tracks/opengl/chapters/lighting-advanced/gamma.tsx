// src/lib/tracks/opengl/chapters/lighting-advanced/gamma.tsx
"use client";

// Gamma correction (explanation pass 2026-09-30): what the display's power
// curve does and why it was kept (codes spent on darks, in numbers); the
// exact sRGB curve; the linear workflow; one lit texel worked through the
// wrong and the right pipeline; blending and averaging; attenuation;
// choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
        where={[
          [r`V`, tx(t, "oglGamma_wV", "the value written to the framebuffer, 0–1 (the byte divided by 255)")],
          [r`L_{\text{emitted}}`, tx(t, "oglGamma_wL", "the light the screen gives off, as a fraction of its white")],
          [r`\gamma`, tx(t, "oglGamma_wG", "≈ 2.2 for sRGB displays")],
          [r`L_{\text{wanted}}`, tx(t, "oglGamma_wWanted", "the light your lighting maths computed; encoding it with 1/γ makes the display emit exactly that")],
        ]}>
        {r`L_{\text{emitted}} = V^{\gamma}
\qquad\Longrightarrow\qquad
V = L_{\text{wanted}}^{\,1/\gamma}
\qquad
0.5^{2.2} \approx 0.218,\;\; 0.5^{1/2.2} \approx 0.730`}
      </Equation>

      <H3>{tx(t, "oglGamma_whyTitle", "Why the curve was kept")}</H3>
      <p>
        {tx(t, "oglGamma_whyBody",
          "Our eyes judge brightness by ratios: going from 1% to 2% of white looks like a big step, going from 91% to 92% looks like nothing. Stored linearly, 8 bits give only two codes for everything below 1% light (1/255 is already 0.39%), so dark gradients show visible bands, while dozens of codes are wasted on bright tones nobody can tell apart. Stored through the 1/2.2 curve, the values below 1% light get 31 codes, because 0.01^(1/2.2) = 0.123 and 0.123 · 255 ≈ 31. The curve is a compression scheme: it spends the 256 codes where the eye needs them.")}
      </p>
      <p>
        {tx(t, "oglGamma_srgbBody",
          "The standard curve, sRGB, is a power of 2.4 with a short linear segment near black (so the curve has a finite slope at zero). 2.2 is the usual approximation:")}
      </p>
      <Equation label={tx(t, "oglGamma_srgbLabel", "The exact sRGB encoding")}
        where={[
          [r`C_{\text{lin}}`, tx(t, "oglGamma_wClin", "a linear value (light), 0–1")],
          [r`C_{\text{sRGB}}`, tx(t, "oglGamma_wCsrgb", "the encoded value that goes into the file or the framebuffer")],
          [r`12.92,\ 0.0031308`, tx(t, "oglGamma_wLinSeg", "the straight segment near black; a pure power curve would be vertical at 0 and amplify noise")],
          [r`1.055,\ 0.055`, tx(t, "oglGamma_wOffset", "scale and offset that make the power part meet the straight segment smoothly and reach 1 at 1")],
        ]}>
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
      <LessonTable
        headers={[tx(t, "oglGamma_tChoice", "Choice"), tx(t, "oglGamma_tReason", "Reason")]}
        rows={[
          [tx(t, "oglGamma_c1", "GL_SRGB8_ALPHA8 instead of pow() on sample"), tx(t, "oglGamma_c1b", "the hardware decodes before filtering, so the average of four texels is taken on light, not on codes; a pow() after texture() would average the codes first and darken edges and mip levels.")],
          [tx(t, "oglGamma_c2", "only RGB is decoded"), tx(t, "oglGamma_c2b", "in an sRGB texture the alpha channel stays linear: coverage and opacity are not light.")],
          [tx(t, "oglGamma_c3", "GL_FRAMEBUFFER_SRGB"), tx(t, "oglGamma_c3b", "encodes with the exact sRGB curve at write time, and blending happens on linear values before it. It only acts on framebuffers whose format is sRGB (the default one usually is when you ask for it).")],
          [tx(t, "oglGamma_c4", "pow(color, 1/2.2) in the shader"), tx(t, "oglGamma_c4b", "simple and explicit, and the only option when you tone map in a final fullscreen pass (HDR chapter). 2.2 differs from exact sRGB by at most about one code in the darks.")],
        ]}
      />

      <H2>{tx(t, "oglGamma_workedTitle", "Worked example: one texel under a light")}</H2>
      <p>
        {tx(t, "oglGamma_workedIntro",
          "An albedo texel stored as byte 128 (0.502), lit at a 60° angle so N·L = 0.5. How much light should come out?")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglGamma_w1", "Right pipeline, step 1: decode. 0.502^2.2 = 0.220. The painter's mid-grey reflects 22% of the light, not 50%.")}</li>
        <li>{tx(t, "oglGamma_w2", "Step 2: light it. 0.220 · 0.5 = 0.110 of the light.")}</li>
        <li>{tx(t, "oglGamma_w3", "Step 3: encode. 0.110^(1/2.2) = 0.366, byte 93. The display emits 0.366^2.2 = 0.110: exactly what was computed.")}</li>
        <li>{tx(t, "oglGamma_w4", "Wrong pipeline: 0.502 · 0.5 = 0.251, byte 64, written as is. The display emits 0.251^2.2 = 0.048: less than half of the correct 0.110. Every half-lit surface comes out too dark, so the terminator between light and shadow looks harsh.")}</li>
      </ol>

      <H3>{tx(t, "oglGamma_blendTitle", "Averaging and blending")}</H3>
      <p>
        {tx(t, "oglGamma_blendBody",
          "Blending, texture filtering and anti-aliasing all average colours, and averages are only meaningful on light. A pixel half covered by a white edge on black should emit half the light. Average the codes and you get 0.5, which emits 22%: anti-aliased edges look thin and dark. Average the light and encode it and you get 0.730 (byte 186), which emits the right 50%. The same happens with a red and green crossfade: done on codes, the middle passes through a dark, muddy olive; done on light, it stays bright yellow.")}
      </p>

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

      <H2>{tx(t, "oglGamma_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglGamma_tMistake", "Mistake"), tx(t, "oglGamma_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglGamma_e1", "Encoding twice (sRGB framebuffer and pow)"), tx(t, "oglGamma_e1b", "a washed-out, milky image with lifted blacks. Keep exactly one encode.")],
          [tx(t, "oglGamma_e2", "Loading a normal or roughness map as sRGB"), tx(t, "oglGamma_e2b", "the numbers are bent by the curve: normals tilt toward one side and roughness drops. Data textures use GL_RGBA8.")],
          [tx(t, "oglGamma_e3", "Colour uniforms taken straight from a colour picker"), tx(t, "oglGamma_e3b", "#FF8040 is sRGB; used as linear it looks too light and washed out. Decode it on the CPU (pow 2.2) before glUniform.")],
          [tx(t, "oglGamma_e4", "Encoding before tone mapping or post-processing"), tx(t, "oglGamma_e4b", "every later pass works on codes again. Encode once, as the very last operation.")],
          [tx(t, "oglGamma_e5", "Keeping light intensities tuned for the wrong pipeline"), tx(t, "oglGamma_e5b", "the scene gets brighter and flatter all at once. Retune lights and ambient after switching, and prefer the pure inverse-square falloff.")],
          [tx(t, "oglGamma_e6", "Expecting GL_FRAMEBUFFER_SRGB to act on any framebuffer"), tx(t, "oglGamma_e6b", "it only encodes into sRGB-format attachments; into GL_RGBA8 nothing happens and the image stays dark. Check the format or encode in the shader.")],
        ]}
      />

      <KeyIdeas t={t} id="oglGamma" items={[
        "Displays emit roughly value^2.2: a pixel value of 0.5 is only ~22% of the light.",
        "Do all lighting on linear values: decode colour textures, encode the output once.",
        "Data textures (normals, roughness, specular masks) are never gamma-corrected.",
        "The curve spends codes on darks: 31 of the 256 codes cover the darkest 1% of light, instead of 2.",
        "In the wrong pipeline a byte-128 texel at N·L = 0.5 emits 0.048 instead of 0.110.",
        "Averages (blending, filtering, anti-aliasing) are only correct on linear values.",
      ]} />
    </Article>
  );
}
