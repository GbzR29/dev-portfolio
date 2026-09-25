// src/lib/tracks/glsl/chapters/effects/stylized.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { STYLE_PRESETS } from "../../presets/stylized";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Toon, dissolve, hologram
// ═════════════════════════════════════════════════════════════════════════════

export function StylizedContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslSty_intro",
          "Stylised shaders break physical rules on purpose, and each one is built from the same few quantities as realistic lighting: N·L, N·V, N·H, a noise value and a threshold. Quantise them, compare them, or add them up in unusual ways, and you get cartoons, disintegration and sci-fi projections.")}
      </Lead>

      <H2>{tx(t, "glslSty_toonTitle", "Toon shading")}</H2>
      <Equation label={tx(t, "glslSty_toonLabel", "Quantised lighting")}
        where={[
          [r`n`, tx(t, "glslSty_wN", "number of light bands")],
          [r`\epsilon`, tx(t, "glslSty_wEps", "the fwidth of the quantity: one pixel of smoothing, so bands never alias")],
        ]}
        note={tx(t, "glslSty_toonNote", "Games often replace the floor() with a 1D \"ramp\" texture indexed by N·L, so artists can paint the bands and their colours. Outlines are drawn separately: an inverted hull (the back faces, pushed out along the normals, as in the Stencil chapter), or edge detection on depth and normals in post.")}>
        {r`\text{toon} = \frac{\lfloor n\,(\vN\cdot\vL) \rfloor}{n} \qquad \text{spec} = \operatorname{smoothstep}(1 - s - \epsilon,\ 1 - s,\ \vN\cdot\vH) \qquad \text{rim} = (1 - \vN\cdot\vV)^p`}
      </Equation>

      <H2>{tx(t, "glslSty_dissTitle", "Dissolve")}</H2>
      <p>
        {tx(t, "glslSty_dissBody",
          "Give every point of the surface a random but smooth value, from noise in object or world space, and discard fragments whose value is below a threshold. Animating the threshold from 0 to 1 eats the object away. A band just above the threshold is the burning edge:")}
      </p>
      <Equation label={tx(t, "glslSty_dissLabel", "Threshold and edge")}
        where={[[r`n(p)`, tx(t, "glslSty_wNoise", "noise at the surface point")], [r`\tau`, tx(t, "glslSty_wTau", "threshold (the animated amount)")], [r`w`, tx(t, "glslSty_wW", "edge width")]]}>
        {r`\text{discard if } n(p) < \tau \qquad \text{edge} = 1 - \operatorname{smoothstep}\big(0,\ w,\ n(p) - \tau\big)`}
      </Equation>

      <H2>{tx(t, "glslSty_holoTitle", "Hologram")}</H2>
      <p>
        {tx(t, "glslSty_holoBody",
          "A hologram is light without a surface. It is drawn with additive blending and depth writes off, so front and back faces add up like glowing gas. The Fresnel term brightens silhouettes, and scanlines are a sine of the world-space height. A band scrolls up, and a random flicker sells the effect.")}
      </p>
      <ShaderPlayground presets={STYLE_PRESETS} t={t} id="glslSty" />
      <LessonTable
        headers={[tx(t, "glslSty_thEffect", "Effect"), tx(t, "glslSty_thIngredients", "Ingredients"), tx(t, "glslSty_thState", "Render state")]}
        rows={[
          [tx(t, "glslSty_e1", "Toon"), "floor(N·L·n), step(N·H), (1 − N·V)ᵖ", tx(t, "glslSty_e1s", "opaque; outline pass or post edge detection")],
          [tx(t, "glslSty_e2", "Dissolve"), "noise(p) < τ → discard, edge band", tx(t, "glslSty_e2s", "opaque, culling off to see inside; discard disables early-Z")],
          [tx(t, "glslSty_e3", "Hologram"), "Fresnel + sin(y·k − t) + flicker", tx(t, "glslSty_e3s", "additive (ONE, ONE), depth write off, culling off")],
          [tx(t, "glslSty_e4", "Force field"), tx(t, "glslSty_e4i", "Fresnel + intersection glow (scene depth − fragment depth)"), tx(t, "glslSty_e4s", "additive, needs the depth texture")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "glslSty_warn", "discard switches off early depth testing for that shader, because the GPU cannot know before shading whether the fragment survives. Use it only on the objects that need it, and draw them after the opaque geometry. For dissolve transitions on whole screens, alpha-to-coverage or dithering keep the depth pre-pass working.")}
      </Callout>
      <KeyIdeas t={t} id="glslSty" items={[
        "Toon: quantise N·L into bands, threshold N·H for a hard highlight, (1 − N·V) for rim and outline.",
        "Dissolve: discard where noise < threshold; a thin band above it glows.",
        "Hologram: additive blending, no depth writes, Fresnel + scanlines + flicker.",
        "discard disables early-Z: use it sparingly.",
      ]} />
    </Article>
  );
}
