// src/lib/tracks/opengl/chapters/lighting-basics/light-casters.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { ATT_ROWS, attenuationNumbers, spotNumbers } from "../../live/light-casters";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { AttenuationFigure } from "@/components/lesson/figures/lighting/AttenuationFigure";
import { SpotlightFigure } from "@/components/lesson/figures/lighting/SpotlightFigure";
import { LightingSceneFigure } from "@/components/lesson/figures/lighting/LightingSceneFigure";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

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

      <Goals t={t} id="oglCast" items={[
        "Light a scene with a directional light, like the sun.",
        "Add point lights that fade with distance.",
        "Add a spotlight with a soft edge.",
      ]} />

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
      <Equation label={tx(t, "oglCast_isqLabel", "Inverse-square law")}
        where={[
          [r`\Phi`, tx(t, "oglCast_wPhiPow", "the bulb's total power: all the light it sends out each second")],
          [r`4\pi d^{2}`, tx(t, "oglCast_wSphere", "the area of a sphere of radius d, the surface that light is spread over at distance d")],
        ]}
        words={tx(t, "oglCast_isqWords", "The same light is shared by a bigger and bigger sphere. Twice as far, the sphere has four times the area, so each bit of it gets a quarter of the light; three times as far, a ninth.")}>
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
        ]}
        words={tx(t, "oglCast_attWords", "Divide the light by a number that starts at 1 right next to the bulb and grows with distance: first mostly in proportion to d, and far away like d², as the inverse-square law says.")}>
        {r`F_{att}(d) \;=\; \frac{1}{K_c + K_l\, d + K_q\, d^{2}}`}
      </Equation>

      <AttenuationFigure t={t} />
      <LightingSceneFigure t={t} mode="point" />

      <CodeBlock lang="glsl" filename="point.frag" t={t}>{`float d = length(light.position - FragPos);
float attenuation = 1.0 / (light.constant + light.linear * d + light.quadratic * d * d);
ambient  *= attenuation;   // attenuate all three terms
diffuse  *= attenuation;
specular *= attenuation;`}</CodeBlock>

      <p>
        {tx(t, "oglCast_tableBody",
          "Picking three constants by eye is awkward, so a table of tested values is widely reused (it comes from the Ogre3D wiki). Choose the row whose distance matches how far the light should reach. Each row is tuned so that at that distance F_att has fallen to about 1%: for 50 units, 1 + 0.09·50 + 0.032·50² = 85.5, and 1/85.5 ≈ 0.012. Past that point the light is effectively gone. The Multiple Lights chapter uses the 13-unit row.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglCast_thDist", "Reach (units)"), "K_c", "K_l", "K_q"]}
        rows={[
          ["7",    "1.0", "0.7",    "1.8"],
          ["13",   "1.0", "0.35",   "0.44"],
          ["20",   "1.0", "0.22",   "0.20"],
          ["32",   "1.0", "0.14",   "0.07"],
          ["50",   "1.0", "0.09",   "0.032"],
          ["65",   "1.0", "0.07",   "0.017"],
          ["100",  "1.0", "0.045",  "0.0075"],
          ["160",  "1.0", "0.027",  "0.0028"],
          ["200",  "1.0", "0.022",  "0.0019"],
          ["325",  "1.0", "0.014",  "0.0007"],
          ["600",  "1.0", "0.007",  "0.0002"],
          ["3250", "1.0", "0.0014", "0.000007"],
        ]}
      />
      <LiveFormula label={tx(t, "oglCast_liveAtt", "Try it: attenuation with a row of the table")}
        tex={r`F_{att}(d) = \frac{1}{1 + K_l\, d + K_q\, d^{2}}`}
        vars={[
          { id: "row", label: tx(t, "oglCast_lvRow", "row (reach)"), min: 0, max: ATT_ROWS.length - 1, step: 1, value: 1, fmt: v => String(ATT_ROWS[v][0]) },
          { id: "d", label: "d", min: 0, max: 100, step: 1, value: 2, fmt: v => String(v) },
        ]}
        compute={attenuationNumbers(t)}
        note={tx(t, "oglCast_liveAttNote", "The start is the 13-unit row used in Multiple Lights, at d = 2: a bit under a third of the light is left. Slide d up to the row's reach, 13, and F_att falls to about 1%. Then pick a longer row and watch the same distance keep much more light. At d = 0 every row gives exactly 1, thanks to K_c = 1.")} />

      <Callout type="info" t={t}>
        {tx(t, "oglCast_tableNote",
          "Read down the columns: as the reach grows, K_l shrinks roughly like 1/d and K_q like 1/d², which keeps both terms the same size at the chosen distance. K_c stays 1 so the light is never brighter than its colour at d = 0. These values were tuned for images without gamma correction. With the linear workflow of the Gamma Correction chapter a plain inverse square looks right, and the PBR chapters use exactly that.")}
      </Callout>

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
        ]}
        words={tx(t, "oglCast_softWords", "Full light inside the inner cone, none outside the outer cone, and in the ring between them a straight fade from 1 to 0, measured in cosines.")}>
        {r`I \;=\; \operatorname{clamp}\!\left(\frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma},\; 0,\; 1\right)`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglCast_softDer", "Where the soft-edge formula comes from")}
        steps={[
          { full: true, tex: r`I = a\cos\theta + b`,
            why: tx(t, "oglCast_sd1", "we want a straight ramp in cos θ, because cos θ is what the shader gets from the dot product; a and b are still unknown") },
          { full: true, tex: r`a\cos\gamma + b = 0, \qquad a\cos\phi + b = 1`,
            why: tx(t, "oglCast_sd2", "the two conditions: no light at the outer edge (θ = γ), full light at the inner edge (θ = φ)") },
          { full: true, tex: r`a\,(\cos\phi - \cos\gamma) = 1 \;\Rightarrow\; a = \frac{1}{\cos\phi - \cos\gamma}, \quad b = -a\cos\gamma`,
            why: tx(t, "oglCast_sd3", "subtract the first condition from the second: b cancels and a is left; then b comes from the first condition") },
          { full: true, tex: r`I = a\,(\cos\theta - \cos\gamma) = \frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma}`,
            why: tx(t, "oglCast_sd4", "put b back in and take a out as a common factor") },
          { full: true, tex: r`I = \operatorname{clamp}\!\left(\frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma},\ 0,\ 1\right)`,
            why: tx(t, "oglCast_sd5", "inside the inner cone the line keeps rising past 1, and outside the outer cone it goes negative; clamp cuts both ends") },
        ]} />
      <LiveFormula label={tx(t, "oglCast_liveSpot", "Try it: the soft edge of a spotlight")}
        tex={r`I = \operatorname{clamp}\!\left(\frac{\cos\theta - \cos\gamma}{\cos\phi - \cos\gamma},\ 0,\ 1\right)`}
        vars={[
          { id: "theta", label: "θ", min: 0, max: 30, step: 0.5, value: 15, fmt: v => `${v}°` },
          { id: "inner", label: "φ", min: 1, max: 25, step: 0.5, value: 12.5, fmt: v => `${v}°` },
          { id: "outer", label: "γ", min: 2, max: 30, step: 0.5, value: 17.5, fmt: v => `${v}°` },
        ]}
        compute={spotNumbers(t)}
        note={tx(t, "oglCast_liveSpotNote", "φ = 12.5° and γ = 17.5° are the usual torch values. θ = 15° sits in the middle of the ring, but I is not exactly 0.5: the fade is straight in cos θ, not in the angle. Move γ closer to φ and the edge turns sharp.")} />

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
