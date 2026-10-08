// src/lib/tracks/opengl/chapters/lighting-advanced/advanced-lighting.tsx
"use client";

// Blinn-Phong (explanation pass 2026-09-30): why Phong's highlight ends in a
// crease at low shininess; the halfway vector and why n·h cannot go negative;
// the half-angle relation and the "×4 exponent" rule derived from the
// Gaussian approximation of cosⁿ; one fragment worked by hand in both models;
// choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { BlinnMathFigure } from "@/components/lesson/figures/advlighting/BlinnMathFigure";
import { BlinnCompareFigure } from "@/components/lesson/figures/advlighting/BlinnCompareFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Blinn-Phong
// ═════════════════════════════════════════════════════════════════════════════

export function BlinnPhongContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglBlinn_intro",
          "Phong's specular term has a flaw that only shows in some situations — low shininess, grazing angles — but when it shows, it is ugly: the highlight stops along a hard edge. Jim Blinn's fix in 1977 replaced one vector and became the default specular model in OpenGL's fixed pipeline for decades.")}
      </Lead>

      <Goals t={t} id="oglBlinn" items={[
        "Explain where Phong's highlight breaks.",
        "Compute the halfway vector and the Blinn-Phong highlight.",
        "Compare both models on one fragment, and adjust the shininess so they match.",
      ]} />

      <H2>{tx(t, "oglBlinn_problemTitle", "Where Phong breaks")}</H2>
      <p>
        {tx(t, "oglBlinn_problemBody2",
          "Phong measures the angle α between the reflected ray R and the direction to the eye V, and uses cos α raised to the shininess. Once α passes 90°, the dot product goes negative and max() clamps the whole term to zero. With a high exponent this is invisible: cos³² α is already below 0.01 at α = 30°, long before 90°. With a low exponent it is not: cos¹ 80° is still 0.17, so the highlight is clearly visible near 90° and then falls to zero along a steep slope that suddenly becomes flat. The eye is very good at spotting a sudden change of slope in brightness, so it sees a crease, a hard edge where the highlight ends.")}
      </p>
      <BlinnCompareFigure t={t} />
      <p>
        {tx(t, "oglBlinn_whenBody",
          "When does α pass 90° while the surface is still lit? When the eye and the light are both low over the surface, on the same side, such as a floor lit by a lamp near it and seen at a shallow angle. R then leans away from both, and a large part of the lit floor has R more than 90° away from V. Exactly the scenes where a broad, soft highlight is wanted.")}
      </p>

      <H2>{tx(t, "oglBlinn_halfTitle", "The halfway vector")}</H2>
      <p>
        {tx(t, "oglBlinn_halfBody",
          "Instead of reflecting the light, take the direction exactly between the light and the eye — the halfway vector — and ask how close it is to the normal. When the eye sits in the mirror direction, the halfway vector lines up with the normal, which is exactly when the highlight should peak.")}
      </p>
      <Equation label={tx(t, "oglBlinn_eqLabel", "Blinn-Phong specular")}
        where={[
          [r`\vL, \vV`, tx(t, "oglBlinn_wLV", "unit vectors from the fragment toward the light and toward the eye")],
          [r`\vH`, tx(t, "oglBlinn_wH", "the unit vector halfway between the light and view directions")],
          [r`\lVert \vL + \vV \rVert`, tx(t, "oglBlinn_wNorm", "the length of the sum; dividing by it makes H a unit vector again (the sum of two unit vectors is shorter than 2 unless they are equal)")],
          [r`k_s, L_s`, tx(t, "oglBlinn_wKs", "the material's and the light's specular colours, as in the Materials chapter")],
          [r`\alpha'`, tx(t, "oglBlinn_wAlpha", "the Blinn-Phong shininess; about 4× Phong's for the same highlight size (derived below)")],
        ]}
        glsl="vec3 H = normalize(lightDir + viewDir);  float spec = pow(max(dot(N, H), 0.0), shininess);">
        {r`\vH = \frac{\vL + \vV}{\lVert \vL + \vV \rVert} \qquad I_s = k_s\,L_s\,\max(0,\,\dotp{\vN}{\vH})^{\alpha'}`}
      </Equation>
      <p>
        {tx(t, "oglBlinn_neverNeg",
          "Since the light and the eye are both above the surface, the halfway vector can never point more than 90° away from the normal, so n·h never needs clamping mid-highlight. The price is that the angle is smaller — which the next figure makes exact.")}
      </p>
      <p>
        {tx(t, "oglBlinn_neverNegWhy",
          "Why it cannot go negative: N·H is proportional to N·L + N·V (the dot product distributes over the sum, and the division by the length is a positive factor). For a lit fragment seen from the front both terms are positive, so their sum is too. The max() stays in the code only for fragments facing away from the light or the eye, where the term should be off anyway.")}
      </p>
      <BlinnMathFigure t={t} />
      <Equation label={tx(t, "oglBlinn_halfAngle", "In the plane of the three vectors")}
        note={tx(t, "oglBlinn_halfAngleNote", "With β = α/2, matching cos^n α near the peak needs cos^m(α/2) with m ≈ 4n — the usual rule of thumb for converting shininess.")}>
        {r`\angle(\vN, \vH) = \beta = \tfrac{1}{2}\,\angle(\vR, \vV) = \tfrac{\alpha}{2}
\qquad
\cos^{n}\alpha \;\approx\; \cos^{4n}\!\tfrac{\alpha}{2}`}
      </Equation>

      <H3>{tx(t, "oglBlinn_fourTitle", "Where the 4 comes from")}</H3>
      <p>
        {tx(t, "oglBlinn_fourBody",
          "Near the peak the angles are small, and for a small angle θ (in radians) cos θ ≈ 1 − θ²/2 ≈ e^(−θ²/2). Raising that to a power n multiplies the exponent: cosⁿ θ ≈ e^(−nθ²/2), a bell curve whose width shrinks as n grows. Phong uses the angle α, Blinn the angle α/2, so the two bells are:")}
      </p>
      <Equation label={tx(t, "oglBlinn_fourLabel", "Matching the two bells")}
        where={[
          [r`n`, tx(t, "oglBlinn_wN", "Phong's shininess")],
          [r`m`, tx(t, "oglBlinn_wM", "the Blinn-Phong shininess that gives the same highlight")],
        ]}>
        {r`\cos^{n}\alpha \approx e^{-n\alpha^{2}/2}
\qquad
\cos^{m}\tfrac{\alpha}{2} \approx e^{-m\alpha^{2}/8}
\qquad
\frac{n}{2} = \frac{m}{8} \;\Longrightarrow\; m = 4n`}
      </Equation>
      <p>
        {tx(t, "oglBlinn_fourCaveat",
          "The relation β = α/2 is exact only when V lies in the plane of N and L. Off that plane the two highlights also differ in shape: Phong's is round around the reflection direction, Blinn-Phong's is stretched along the surface at grazing angles, which is what real wet roads and polished floors do. So ×4 is a starting point to tune by eye, not an exact conversion.")}
      </p>

      <H2>{tx(t, "oglBlinn_workedTitle", "Worked example: one fragment, both models")}</H2>
      <p>
        {tx(t, "oglBlinn_workedIntro",
          "Work in the plane of the drawing, with the normal pointing up, N = (0, 1). The light is 60° to the left of the normal and the eye 40° to the right:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglBlinn_w1", "L = (−sin 60°, cos 60°) = (−0.866, 0.5) and V = (sin 40°, cos 40°) = (0.643, 0.766).")}</li>
        <li>{tx(t, "oglBlinn_w2", "Phong: R = 2(N·L)N − L = 2 · 0.5 · (0, 1) − (−0.866, 0.5) = (0.866, 0.5), which is 60° to the right. R·V = 0.866 · 0.643 + 0.5 · 0.766 = 0.940, the cosine of 20° (60° − 40°).")}</li>
        <li>{tx(t, "oglBlinn_w3", "Blinn: L + V = (−0.223, 1.266), whose length is 1.286, so H = (−0.174, 0.985). N·H = 0.985, the cosine of 10°: half of Phong's 20°, as promised.")}</li>
        <li>{tx(t, "oglBlinn_w4", "With the same shininess 32: Phong gives 0.940³² = 0.137, Blinn-Phong 0.985³² = 0.613. The Blinn highlight is much broader. With 4 × 32 = 128: 0.985¹²⁸ = 0.141, within 3% of Phong's 0.137.")}</li>
      </ol>

      <H2>{tx(t, "oglBlinn_codeTitle", "In the shader")}</H2>
      <CodeBlock lang="glsl" filename="blinn.glsl" t={t}>{`// Phong — the reflection vector
vec3  reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

// Blinn-Phong — the halfway vector between light and view
vec3  halfwayDir = normalize(lightDir + viewDir);
float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess * 4.0);`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "oglBlinn_tChoice", "Choice"), tx(t, "oglBlinn_tReason", "Reason")]}
        rows={[
          [tx(t, "oglBlinn_c1", "normalize(lightDir + viewDir)"), tx(t, "oglBlinn_c1b", "both inputs are unit vectors pointing away from the fragment; their sum points halfway between them but is shorter than 1 (length 1.286 in the example), so it must be normalised before the dot product.")],
          [tx(t, "oglBlinn_c2", "no reflect() any more"), tx(t, "oglBlinn_c2b", "reflect() costs a dot product and a multiply-add; the halfway vector costs an add and a normalise. Similar per fragment, but H can be precomputed when it is constant (see below).")],
          [tx(t, "oglBlinn_c3", "shininess * 4.0"), tx(t, "oglBlinn_c3b", "keeps materials tuned for Phong looking the same size. For new materials, just pick the Blinn exponent directly.")],
          [tx(t, "oglBlinn_c4", "the diffuse term is unchanged"), tx(t, "oglBlinn_c4b", "Blinn's change only concerns the highlight; N·L stays exactly as it was.")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "oglBlinn_perfNote",
          "Blinn-Phong is also cheaper when the light is directional and the viewer is far away: H is then the same for every fragment and can be computed once on the CPU. And it matches measured highlights better than Phong — the halfway vector is the ancestor of the microfacet normal that physically based rendering is built on.")}
      </Callout>

      <H2>{tx(t, "oglBlinn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglBlinn_tMistake", "Mistake"), tx(t, "oglBlinn_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglBlinn_e1", "Forgetting to normalise H"), tx(t, "oglBlinn_e1b", "N·H can then exceed 1 and the highlight becomes huge and blown out, especially when L and V are close. Always normalize().")],
          [tx(t, "oglBlinn_e2", "Using −lightDir (the ray direction) in the sum"), tx(t, "oglBlinn_e2b", "H then points into the surface and the highlight lands in the wrong place or disappears. Both vectors must point away from the fragment.")],
          [tx(t, "oglBlinn_e3", "Keeping Phong's shininess"), tx(t, "oglBlinn_e3b", "every highlight suddenly looks about twice as wide. Multiply by about 4.")],
          [tx(t, "oglBlinn_e4", "Computing H per vertex and interpolating"), tx(t, "oglBlinn_e4b", "the interpolated vector is not unit length and the highlight shape depends on the triangle size. Interpolate L and V (or positions) and build H per fragment.")],
          [tx(t, "oglBlinn_e5", "Mixing spaces"), tx(t, "oglBlinn_e5b", "lightDir in world space and viewDir in view space give an H that means nothing. Keep all three vectors in one space.")],
          [tx(t, "oglBlinn_e6", "No specular cut-off on the unlit side"), tx(t, "oglBlinn_e6b", "N·H can be positive where N·L < 0, giving highlights on the dark side. Multiply spec by step(0.0, N·L) or skip it when N·L ≤ 0.")],
        ]}
      />

      <KeyIdeas t={t} id="oglBlinn" items={[
        "Phong clamps r·v at 90°, which cuts low-shininess highlights off with a hard edge.",
        "Blinn-Phong compares the normal with the halfway vector h = normalize(l + v) instead.",
        "The halfway angle is half the reflection angle, so use about 4× the exponent for the same look.",
        "The ×4 comes from cosⁿ θ ≈ e^(−nθ²/2): halving the angle quarters the exponent in the bell.",
        "In the worked example Phong 32 gives 0.137, Blinn 32 gives 0.613, Blinn 128 gives 0.141.",
      ]} />
    </Article>
  );
}
