// src/lib/tracks/opengl/chapters/advanced/blending.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Blending & Transparency ──────────────────────────────────────────────────

export function BlendingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglBlend_intro",
          "Blending is how a fragment combines with what is already in the framebuffer instead of replacing it. The equation is fixed-function and simple. What is genuinely hard is the ordering problem it creates, and that problem has no cheap correct solution — which is why transparency is still a research topic."
        )}
      </p>

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
