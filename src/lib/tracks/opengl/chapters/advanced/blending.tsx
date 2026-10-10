// src/lib/tracks/opengl/chapters/advanced/blending.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { BLEND_MODES, blendNumbers, orderNumbers } from "@/lib/tracks/opengl/live/blending";
import { tx } from "@/lib/tracks/tx";
import { Goals } from "@/components/lesson/Prose";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

// ── Blending & Transparency ──────────────────────────────────────────────────

export function BlendingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglBlend_intro",
          "Blending is how a fragment combines with what is already in the framebuffer instead of replacing it. The equation is fixed-function and simple. What is genuinely hard is the ordering problem it creates, and that problem has no cheap correct solution — which is why transparency is still a research topic."
        )}
      </p>

      <Goals t={t} id="oglBlend" items={[
        "Write the blend equation and choose its factors.",
        "Change the blend operator.",
        "Use cut-out transparency where no blending is needed.",
        "Sort transparent objects so they are drawn correctly.",
      ]} />

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

      <Equation label={tx(t, "oglBlend_eqLabel", "The blend equation, per channel")}
        where={[
          [r`C`, tx(t, "oglBlend_wC", "the colour written back to the framebuffer")],
          [r`S`, tx(t, "oglBlend_wS", "source: the colour the fragment shader outputs")],
          [r`D`, tx(t, "oglBlend_wD", "destination: the colour already stored at this pixel")],
          [r`F_{src}`, tx(t, "oglBlend_wFs", "the first factor of glBlendFunc, e.g. GL_SRC_ALPHA = α_s")],
          [r`F_{dst}`, tx(t, "oglBlend_wFd", "the second factor, e.g. GL_ONE_MINUS_SRC_ALPHA = 1 − α_s")],
          [r`\alpha_s`, tx(t, "oglBlend_wAs", "the fragment's alpha, its opacity from 0 (invisible) to 1 (solid)")],
        ]}
        words={tx(t, "oglBlend_eqWords", "Take the new colour times one factor, take the colour already on screen times another factor, and add them. With the usual factors that is a weighted average: α parts of the new colour and 1 − α parts of the old.")}>
        {r`C = S\,F_{src} + D\,F_{dst} \qquad \text{alpha blend:}\quad C = S\,\alpha_s + D\,(1 - \alpha_s)`}
      </Equation>
      <LiveFormula label={tx(t, "oglBlend_liveMode", "Try it: one channel through each mode of the table")}
        tex={r`C = S\,F_{src} + D\,F_{dst}`}
        vars={[
          { id: "mode", label: tx(t, "oglBlend_liveModeVar", "mode"), min: 0, max: 3, step: 1, value: 0, fmt: v => BLEND_MODES[v] },
          { id: "S", label: "S", min: 0, max: 1, step: 0.05, value: 0.9 },
          { id: "a", label: "α", min: 0, max: 1, step: 0.05, value: 0.3 },
          { id: "D", label: "D", min: 0, max: 1, step: 0.05, value: 0.2 },
        ]}
        compute={blendNumbers(t)}
        note={tx(t, "oglBlend_liveModeNote", "Alpha: 0.9 · 0.3 + 0.2 · 0.7 = 0.41, a 30/70 mix. Additive keeps all of D and adds S·α on top, so it can only brighten: raise D and the result clips at 1. Multiply can only darken, and α plays no part. Premultiplied gives the same number as alpha, because S·α is already stored in the texture.")} />

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

      <H2>{tx(t, "oglBlend_opTitle", "Changing the operator: glBlendEquation")}</H2>
      <p>
        {tx(t, "oglBlend_opBody",
          "The full blend equation is result = S·F_src ⊕ D·F_dst, where S is the fragment's colour, D the colour already in the framebuffer, F_src and F_dst the two factors from glBlendFunc, and ⊕ an operator. The operator is addition unless you change it with glBlendEquation:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "oglBlend_eqH0", "glBlendEquation"), tx(t, "oglBlend_eqH1", "Result"), tx(t, "oglBlend_eqH2", "Use for")]}
        rows={[
          ["GL_FUNC_ADD",              "S·F_src + D·F_dst", tx(t, "oglBlend_eqU1", "the default: every mode in the table above")],
          ["GL_FUNC_SUBTRACT",         "S·F_src − D·F_dst", tx(t, "oglBlend_eqU2", "rarely; the fragment minus what is behind it")],
          ["GL_FUNC_REVERSE_SUBTRACT", "D·F_dst − S·F_src", tx(t, "oglBlend_eqU3", "darkening: subtracts light from what is already drawn")],
          ["GL_MIN",                   "min(S, D)",         tx(t, "oglBlend_eqU4", "keep the darker value per channel; the factors are ignored")],
          ["GL_MAX",                   "max(S, D)",         tx(t, "oglBlend_eqU5", "keep the brighter value per channel; the factors are ignored")],
        ]}
      />
      <p>
        {tx(t, "oglBlend_sepBody",
          "glBlendFuncSeparate sets one pair of factors for RGB and another for alpha. That matters as soon as the framebuffer's alpha channel is read later, for example when a UI layer or a particle buffer is rendered into a texture and composited on top of the scene. With plain SRC_ALPHA, ONE_MINUS_SRC_ALPHA the stored alpha becomes α_s² + α_d(1 − α_s): a 50% sprite on an empty target leaves an alpha of 0.25, and the layer later composites as far too transparent. Using ONE for the source alpha gives α_s + α_d(1 − α_s), the true coverage of both layers together."
        )}
      </p>
      <Derivation t={t} label={tx(t, "oglBlend_alphaDer", "Why the stored alpha comes out too low")}
        steps={[
          { full: true, tex: r`\alpha_{out} = \alpha_s \cdot \alpha_s + \alpha_d\,(1 - \alpha_s)`,
            why: tx(t, "oglBlend_ad1", "glBlendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA) blends the alpha channel with the same factors as the colour, so the source alpha is multiplied by itself") },
          { full: true, tex: r`\alpha_s = 0.5,\ \alpha_d = 0: \quad \alpha_{out} = 0.25 + 0 = 0.25`,
            why: tx(t, "oglBlend_ad2", "a half-transparent sprite on an empty, fully transparent target: the stored coverage is a quarter, not a half") },
          { full: true, tex: r`F = \text{ONE}: \quad \alpha_{out} = \alpha_s + \alpha_d\,(1 - \alpha_s) = 0.5`,
            why: tx(t, "oglBlend_ad3", "with ONE as the source factor for alpha, the same sprite stores 0.5") },
          { full: true, tex: r`1 - \alpha_{out} = 1 - \alpha_s - \alpha_d + \alpha_s\alpha_d = (1 - \alpha_s)(1 - \alpha_d)`,
            why: tx(t, "oglBlend_ad4", "and that is the right value: 1 − α is the light that gets through a layer, and the light that gets through both layers is the product of what each lets through") },
        ]} />
      <CodeBlock lang="cpp" filename="blend_separate.cpp" t={t}>{`// Colour: normal alpha blending. Alpha: accumulate coverage correctly.
glBlendFuncSeparate(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA,    // RGB
                    GL_ONE,       GL_ONE_MINUS_SRC_ALPHA);   // alpha

// Darken what is already drawn (e.g. a shadow blob) instead of adding to it
glBlendEquation(GL_FUNC_REVERSE_SUBTRACT);
glBlendFunc(GL_ONE, GL_ONE);                 // result = D - S
drawShadowBlobs();
glBlendEquation(GL_FUNC_ADD);                // restore the default`}</CodeBlock>

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
      <LiveFormula label={tx(t, "oglBlend_liveOrder", "Try it: a red pane behind a blue pane, over white")}
        tex={r`C_1 = \alpha_1\,S_1 + (1 - \alpha_1)\,D \qquad C_2 = \alpha_2\,S_2 + (1 - \alpha_2)\,C_1`}
        vars={[
          { id: "a1", label: <>α<sub>1</sub></>, min: 0, max: 1, step: 0.05, value: 0.5 },
          { id: "a2", label: <>α<sub>2</sub></>, min: 0, max: 1, step: 0.05, value: 0.5 },
        ]}
        where={[
          [r`S_1`, tx(t, "oglBlend_wS1", "the far pane, pure red (1, 0, 0), drawn first in the correct order")],
          [r`S_2`, tx(t, "oglBlend_wS2", "the near pane, pure blue (0, 0, 1)")],
          [r`D`, tx(t, "oglBlend_wDw", "the white background (1, 1, 1) already on screen")],
          [r`C_1`, tx(t, "oglBlend_wC1", "the framebuffer after the first pane, which becomes the destination of the second")],
        ]}
        compute={orderNumbers(t)}
        note={tx(t, "oglBlend_liveOrderNote", "Even with depth writes off, the order changes the colour: (0.5, 0.25, 0.75) against (0.75, 0.25, 0.5) at α = 0.5, bluish against reddish. The pane drawn last always dominates; with both at 1 it hides the other completely. Only when one α is 0 do the two orders agree, so any real transparency needs the sort.")} />

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
