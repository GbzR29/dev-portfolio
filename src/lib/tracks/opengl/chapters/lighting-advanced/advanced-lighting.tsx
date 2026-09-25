// src/lib/tracks/opengl/chapters/lighting-advanced/advanced-lighting.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
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

      <H2>{tx(t, "oglBlinn_problemTitle", "Where Phong breaks")}</H2>
      <p>
        {tx(t, "oglBlinn_problemBody",
          "Phong measures the angle α between the reflected ray and the eye. Once α passes 90°, the dot product goes negative and max() clamps the whole term to zero. With a high exponent the highlight has already faded long before 90°, so nobody notices. With a low exponent the highlight is still bright at 90° — and it ends in a cliff.")}
      </p>
      <BlinnCompareFigure t={t} />

      <H2>{tx(t, "oglBlinn_halfTitle", "The halfway vector")}</H2>
      <p>
        {tx(t, "oglBlinn_halfBody",
          "Instead of reflecting the light, take the direction exactly between the light and the eye — the halfway vector — and ask how close it is to the normal. When the eye sits in the mirror direction, the halfway vector lines up with the normal, which is exactly when the highlight should peak.")}
      </p>
      <Equation label={tx(t, "oglBlinn_eqLabel", "Blinn-Phong specular")}
        where={[[r`\vH`, tx(t, "oglBlinn_wH", "the unit vector halfway between the light and view directions")]]}
        glsl="vec3 H = normalize(lightDir + viewDir);  float spec = pow(max(dot(N, H), 0.0), shininess);">
        {r`\vH = \frac{\vL + \vV}{\lVert \vL + \vV \rVert} \qquad I_s = k_s\,L_s\,\max(0,\,\dotp{\vN}{\vH})^{\alpha'}`}
      </Equation>
      <p>
        {tx(t, "oglBlinn_neverNeg",
          "Since the light and the eye are both above the surface, the halfway vector can never point more than 90° away from the normal, so n·h never needs clamping mid-highlight. The price is that the angle is smaller — which the next figure makes exact.")}
      </p>
      <BlinnMathFigure t={t} />
      <Equation label={tx(t, "oglBlinn_halfAngle", "In the plane of the three vectors")}
        note={tx(t, "oglBlinn_halfAngleNote", "With β = α/2, matching cos^n α near the peak needs cos^m(α/2) with m ≈ 4n — the usual rule of thumb for converting shininess.")}>
        {r`\angle(\vN, \vH) = \beta = \tfrac{1}{2}\,\angle(\vR, \vV) = \tfrac{\alpha}{2}
\qquad
\cos^{n}\alpha \;\approx\; \cos^{4n}\!\tfrac{\alpha}{2}`}
      </Equation>

      <CodeBlock lang="glsl" filename="blinn.glsl" t={t}>{`// Phong — the reflection vector
vec3  reflectDir = reflect(-lightDir, normal);
float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);

// Blinn-Phong — the halfway vector between light and view
vec3  halfwayDir = normalize(lightDir + viewDir);
float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess * 4.0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglBlinn_perfNote",
          "Blinn-Phong is also cheaper when the light is directional and the viewer is far away: H is then the same for every fragment and can be computed once on the CPU. And it matches measured highlights better than Phong — the halfway vector is the ancestor of the microfacet normal that physically based rendering is built on.")}
      </Callout>

      <KeyIdeas t={t} id="oglBlinn" items={[
        "Phong clamps r·v at 90°, which cuts low-shininess highlights off with a hard edge.",
        "Blinn-Phong compares the normal with the halfway vector h = normalize(l + v) instead.",
        "The halfway angle is half the reflection angle, so use about 4× the exponent for the same look.",
      ]} />
    </Article>
  );
}
