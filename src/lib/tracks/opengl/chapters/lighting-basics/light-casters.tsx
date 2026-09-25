// src/lib/tracks/opengl/chapters/lighting-basics/light-casters.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { AttenuationFigure } from "@/components/lesson/figures/lighting/AttenuationFigure";
import { SpotlightFigure } from "@/components/lesson/figures/lighting/SpotlightFigure";
import { LightingSceneFigure } from "@/components/lesson/figures/lighting/LightingSceneFigure";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// 5. Light Casters
// ═════════════════════════════════════════════════════════════════════════════

export function LightCastersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglCast_intro",
          "So far the light was a point hanging next to the object. Real scenes need three kinds of light source, and each one differs in just one thing: how the direction to the light, and how much of it arrives, change from fragment to fragment.")}
      </Lead>

      <LessonTable
        headers={[tx(t, "oglCast_tType", "Caster"), tx(t, "oglCast_tDir", "Direction to light"), tx(t, "oglCast_tAmount", "How much arrives")]}
        rows={[
          [tx(t, "oglCast_tDirL", "Directional (sun)"), tx(t, "oglCast_tDirD", "The same for every fragment"), tx(t, "oglCast_tDirA", "Constant")],
          [tx(t, "oglCast_tPoint", "Point (bulb)"), tx(t, "oglCast_tPointD", "normalize(lightPos − fragPos)"), tx(t, "oglCast_tPointA", "Falls off with distance")],
          [tx(t, "oglCast_tSpot", "Spot (torch)"), tx(t, "oglCast_tSpotD", "Like a point light"), tx(t, "oglCast_tSpotA", "Falls off with distance and only inside a cone")],
        ]}
      />

      <H2>{tx(t, "oglCast_dirTitle", "Directional light")}</H2>
      <p>
        {tx(t, "oglCast_dirBody",
          "The sun is so far away that its rays are parallel by the time they reach us. The light has no position, only a direction, and that direction is the same for every fragment. Remember the w trick: a direction is a vec4 with w = 0, so translation never touches it.")}
      </p>
      <LightingSceneFigure t={t} mode="directional" />
      <CodeBlock lang="glsl" filename="directional.frag" t={t}>{`struct DirLight { vec3 direction; vec3 ambient, diffuse, specular; };
// direction points FROM the light; flip it to get "towards the light"
vec3 lightDir = normalize(-light.direction);`}</CodeBlock>

      <H2>{tx(t, "oglCast_attenTitle", "Point lights and attenuation")}</H2>
      <p>
        {tx(t, "oglCast_attenPhys",
          "A bulb sends its light out in every direction. At distance d that light is spread over the surface of a sphere of radius d, so the intensity per unit area falls with that area — the inverse-square law:")}
      </p>
      <Equation label={tx(t, "oglCast_isqLabel", "Inverse-square law")}>
        {r`I(d) \;=\; \frac{\Phi}{4\pi d^{2}} \;\;\propto\;\; \frac{1}{d^{2}}`}
      </Equation>
      <p>
        {tx(t, "oglCast_attenPractical",
          "Used raw, 1/d² explodes near the light and never quite reaches zero. The classic real-time formula keeps the quadratic falloff but adds a constant and a linear term to tame both ends:")}
      </p>
      <Equation label={tx(t, "oglCast_attLabel", "Attenuation")}
        where={[
          [r`K_c`, tx(t, "oglCast_wKc", "constant, usually 1 — keeps F ≤ 1 near the light")],
          [r`K_l`, tx(t, "oglCast_wKl", "linear — dominates at medium distance")],
          [r`K_q`, tx(t, "oglCast_wKq", "quadratic — takes over far away")],
        ]}>
        {r`F_{att}(d) \;=\; \frac{1}{K_c + K_l\, d + K_q\, d^{2}}`}
      </Equation>

      <AttenuationFigure t={t} />
      <LightingSceneFigure t={t} mode="point" />

      <CodeBlock lang="glsl" filename="point.frag" t={t}>{`float d = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant + light.linear * d + light.quadratic * d * d);
ambient  *= attenuation;   // attenuate all three terms
diffuse  *= attenuation;
specular *= attenuation;`}</CodeBlock>

      <H2>{tx(t, "oglCast_spotTitle", "Spotlight")}</H2>
      <p>
        {tx(t, "oglCast_spotBody",
          "A spotlight is a point light that only shines inside a cone. For each fragment we measure the angle θ between the spotlight's direction and the direction to the fragment, and compare it with the cone's cut-off angle. Since θ comes from a dot product, everything is compared as cosines — and cosines shrink as angles grow, so the test is reversed: inside the cone means cos θ > cos φ.")}
      </p>
      <Equation label={tx(t, "oglCast_softLabel", "Soft-edged spotlight")}
        where={[
          [r`\theta`, tx(t, "oglCast_wTheta", "angle between the spot direction and the direction to the fragment")],
          [r`\phi`, tx(t, "oglCast_wPhi", "inner cut-off: full intensity inside")],
          [r`\gamma`, tx(t, "oglCast_wGamma", "outer cut-off: zero outside")],
        ]}>
        {r`I \;=\; \operatorname{clamp}\!\left(\frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma},\; 0,\; 1\right)`}
      </Equation>

      <SpotlightFigure t={t} />
      <LightingSceneFigure t={t} mode="spot" />

      <Callout type="tip" t={t}>
        {tx(t, "oglCast_flashTip",
          "A flashlight is a spotlight whose position is the camera position and whose direction is the camera's front vector, updated every frame. With a single cut-off the edge is razor sharp; the inner/outer pair is what makes it look like a real torch.")}
      </Callout>

      <KeyIdeas t={t} id="oglCast" items={[
        "Directional: one direction for the whole scene, no falloff.",
        "Point: light spreads over a sphere, so it falls roughly as 1/d²; Kc, Kl and Kq tame the curve.",
        "Spot: a point light limited to a cone, compared with cosines; two cut-offs give a soft edge.",
      ]} />
    </Article>
  );
}
