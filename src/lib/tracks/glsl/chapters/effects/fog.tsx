// src/lib/tracks/glsl/chapters/effects/fog.tsx
"use client";

import { CodeBlock, Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { FogLabFigure } from "@/components/lesson/figures/fog/FogLabFigure";
import { FogCurveFigure } from "@/components/lesson/glsl/FogCurveFigure";
import { FOG_PRESETS } from "../../presets/fog";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Fog
// ═════════════════════════════════════════════════════════════════════════════

export function FogContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslFog_intro",
          "Fog does more than hide the far plane. It sets the depth of a scene, since distant things are paler, and it sets the mood: morning mist, a smoky room, alien haze. Physically it is light being absorbed and scattered by particles along the view ray, and a few formulas cover almost every use.")}
      </Lead>

      <H2>{tx(t, "glslFog_physTitle", "Where the formulas come from")}</H2>
      <p>
        {tx(t, "glslFog_physBody",
          "Along a ray, each small step of length ds removes a fraction ρ·ds of the light from the object (extinction) and adds the same fraction of the fog's own colour (in-scattering). Integrating that over the distance d gives exponential fog. Every other formula is an approximation or a special case of it:")}
      </p>
      <Equation label={tx(t, "glslFog_beerLabel", "The fog integral")}
        where={[
          [r`\rho(s)`, tx(t, "glslFog_wRho", "fog density at distance s along the ray")],
          [r`f`, tx(t, "glslFog_wF", "visibility: the fraction of the object's colour that survives")],
        ]}>
        {r`f = \exp\!\left(-\int_0^d \rho(s)\,ds\right) \qquad C = f\,C_{obj} + (1 - f)\,C_{fog}`}
      </Equation>
      <Equation label={tx(t, "glslFog_kindsLabel", "The four common kinds")}
        notes={[
          tx(t, "glslFog_k1", "Linear: an artist's tool with hard start/end distances. It was fixed-function OpenGL's default (GL_LINEAR)."),
          tx(t, "glslFog_k2", "Exponential: constant density ρ. The physically correct uniform medium."),
          tx(t, "glslFog_k3", "Exp²: keeps the foreground clear and falls off fast; popular for stylised looks."),
          tx(t, "glslFog_k4", "Height: density ρ(y) = a·e^(−b·y), thick near the ground; its integral along a ray with direction slope s still has a closed form."),
        ]}>
        {r`\begin{aligned}
f_{lin} &= \operatorname{clamp}\!\left(\frac{d_{end} - d}{d_{end} - d_{start}}, 0, 1\right) & f_{exp} &= e^{-\rho d} & f_{exp^2} &= e^{-(\rho d)^2} \\
f_{height} &= \exp\!\left(-\frac{a}{b}\,e^{-b\,y_0}\,\frac{1 - e^{-b\,s\,d}}{s}\right)
\end{aligned}`}
      </Equation>
      <FogCurveFigure t={t} />
      <CodeBlock lang="glsl" filename="height_fog.glsl" t={t}>{`// ro: camera position, rd: normalised view ray, d: distance to the surface
vec3 applyHeightFog(vec3 col, vec3 ro, vec3 rd, float d, vec3 sunDir) {
    const float a = 0.08, b = 0.35;                         // density at y = 0, falloff with height
    float amount = (abs(rd.y) < 1e-4)
        ? a * exp(-b * ro.y) * d
        : (a / b) * exp(-b * ro.y) * (1.0 - exp(-b * rd.y * d)) / rd.y;
    float vis = exp(-amount);
    // tint toward the sun: forward scattering, the cheapest "god-ray" feel
    float sun = pow(max(dot(rd, sunDir), 0.0), 8.0);
    vec3 fogCol = mix(vec3(0.6, 0.68, 0.76), vec3(1.0, 0.85, 0.6), sun);
    return mix(fogCol, col, vis);
}`}</CodeBlock>
      <ShaderPlayground presets={FOG_PRESETS} t={t} id="glslFog" />
      <Callout type="warn" t={t}>
        {tx(t, "glslFog_repeatWarn", "A raymarching pitfall hides in this scene. The pillars repeat with mod(), but each cell has its own random height. A distance function that only measures the pillar in the current cell is wrong near cell borders: it cannot see a taller pillar next door, so the ray jumps into it and slices its top off. The result is ragged, torn tops. The fix is in pillars(): take the minimum over the 3×3 neighbouring cells. Whenever repeated shapes differ per cell, or can reach past their cell, check the neighbours.")}
      </Callout>
      <H2>{tx(t, "glslFog_layerTitle", "Fog that stays on the ground")}</H2>
      <p>
        {tx(t, "glslFog_layerBody",
          "Exponential and exp² fog depend only on distance, so they fill all of space: the air above your head is as thick as the air in the valley. Real morning fog is a layer. It is dense near the ground, has a top, and above it the air is clear. The lab below adds three layered kinds to the four classic ones. Try each, then raise the camera above the fog height and look down: a layer seen from above is a sea of clouds.")}
      </p>

      <FogLabFigure t={t} />

      <H3>{tx(t, "glslFog_slabTitle", "A layer with a soft top, integrated exactly")}</H3>
      <p>
        {tx(t, "glslFog_slabBody",
          "Describe the layer by its density at each height. Below the top H it is a constant ρ. Above H it fades exponentially over a thickness s, so the top is soft and the camera never sees a hard line where it crosses it. Along a ray y(t) = y₀ + t·d_y, the fog integral splits at the point where the ray crosses H. The part below H is a constant density times a length, and the part above is the integral of an exponential. Both have closed forms, so this fog costs a handful of instructions per pixel:")}
      </p>
      <Equation label={tx(t, "glslFog_slabLabel", "Ground layer: density and its integral along the ray")}
        where={[
          [r`t_H = \frac{H - y_0}{d_y}`, tx(t, "glslFog_wTH", "where the ray crosses the top. Looking up (d_y > 0), the part below H is [0, t_H]. Looking down, it is [t_H, ∞). Both intervals are clipped to [0, d], the distance to what the ray hits")],
          [r`\ell_{\text{below}}`, tx(t, "glslFog_wLb", "the length of the ray inside the constant part. Its contribution is simply ρ·ℓ")],
          [r`[a_0, a_1]`, tx(t, "glslFog_wA01", "the interval of the ray above H, clipped the same way")],
          [r`\frac{s}{d_y}\big(e^{\cdots a_0} - e^{\cdots a_1}\big)`, tx(t, "glslFog_wExp", "the antiderivative of e^(−(y₀ + t·d_y − H)/s) with respect to t, evaluated at the two ends. A horizontal ray (d_y ≈ 0) has no crossing: then the density is constant along it and the integral is density × d")],
        ]}
        note={tx(t, "glslFog_slabNote", "Seen from above, only the part of the ray below H counts, so the sky and the hilltops stay sharp while the valley disappears. A uniform fog cannot do that. Height fog is the same idea with a single exponential and no flat part. Its integral, (ρ/b)·e^(−b(y₀−H))·(1 − e^(−b·d_y·d))/d_y, is what the code block above computes.")}
        glsl={`float tH = (H - y0) / dy;\nfloat below = rho * max(min(d, b1) - max(0.0, b0), 0.0);\nfloat above = rho * s / dy * (exp(-(y0 + a0 * dy - H) / s) - exp(-(y0 + a1 * dy - H) / s));\nfloat vis = exp(-(below + above));`}>
        {r`\rho(y) = \begin{cases} \rho & y \le H \\ \rho\, e^{-(y - H)/s} & y > H \end{cases} \qquad \int_0^d \rho\,dt = \rho\,\ell_{\text{below}} + \rho\,\frac{s}{d_y}\Big(e^{-\frac{y_0 + a_0 d_y - H}{s}} - e^{-\frac{y_0 + a_1 d_y - H}{s}}\Big)`}
      </Equation>

      <H3>{tx(t, "glslFog_mistTitle", "Mist that moves: marching through the fog")}</H3>
      <p>
        {tx(t, "glslFog_mistBody",
          "Uniform layers look like a painted gradient. Real mist has wisps, thicker and thinner patches that drift. Multiplying the density by 3D noise does that, and the noise moves with the wind. But no closed form can integrate noise, so the shader walks along the ray in N small steps and applies Beer–Lambert one step at a time. This is ray marching again, but through a medium instead of toward a surface:")}
      </p>
      <Equation label={tx(t, "glslFog_marchLabel", "Discrete fog integral, front to back")}
        where={[
          [r`\rho_i`, tx(t, "glslFog_wRhoI", "density at step i: the layer's ρ(y) times mix(1, 2.2·smoothstep(0.25, 0.75, fbm), noise). The 2.2 roughly keeps the average density the same while the noise adds contrast")],
          [r`\alpha_i = 1 - e^{-\rho_i \Delta s}`, tx(t, "glslFog_wAlpha", "the fraction of light this step removes. It is also how much of the fog's own light it adds, which is the same rule as the continuous formula")],
          [r`T_i`, tx(t, "glslFog_wT", "transmittance so far: how much of what lies behind step i still reaches the eye. It starts at 1 and only decreases")],
          [r`S_i`, tx(t, "glslFog_wS", "the light the fog scatters toward the eye at step i (next equation)")],
        ]}
        note={tx(t, "glslFog_marchNote", "Three details matter. The ray is first clipped to the slab where fog exists (y ≤ H + 3s), so no step is wasted in clear air or ends up below the ground. The first step is offset by a random fraction of Δs per pixel, which trades visible bands for fine noise the eye ignores. And the loop stops as soon as T < 1%, because nothing behind can show through any more.")}
        glsl={`float a = 1.0 - exp(-dens * ds);\nacc += T * a * fogLight;\nT   *= 1.0 - a;\nif (T < 0.01) break;\n// finally: colour = surfaceColour * T + acc`}>
        {r`C = C_{\text{surface}}\,T_N + \sum_{i=0}^{N-1} T_i\,\alpha_i\,S_i, \qquad T_{i+1} = T_i\,(1 - \alpha_i)`}
      </Equation>
      <Equation label={tx(t, "glslFog_lightLabel", "What the fog glows with")}
        where={[
          [r`\mathbf C_{\text{fog}}\,E_{\text{sky}}`, tx(t, "glslFog_wAmb", "ambient light from the sky, tinted by the fog colour. This is why fog at night is nearly black")],
          [r`p_{HG}(\mu, 0.6)`, tx(t, "glslFog_wHG", "Henyey–Greenstein phase with g = 0.6, where μ = cos of the angle between the view ray and the sun. Water droplets scatter mostly forward, so fog glows strongly when you look toward the sun. The sun-scattering slider blends between this and an even glow")],
          [r`V_{\text{sun}}`, tx(t, "glslFog_wVis", "how much sunlight reaches the point through the fog above it: e^(−½·∫ρ) along the sun direction, using the same closed-form layer integral. Deep inside the layer the fog is darker than at its top. That self-shadowing is what gives a sea of clouds its bright surface. The ½ is an artistic softening: part of the sunlight also arrives already scattered by the fog, so the full attenuation looks too dark")],
        ]}>
        {r`S = \mathbf C_{\text{fog}}\,E_{\text{sky}} + \mathbf L_{\text{sun}}\;p_{HG}(\mu, 0.6)\;V_{\text{sun}}, \qquad V_{\text{sun}} = e^{-\frac12\int \rho\,dt\ \text{toward the sun}}`}
      </Equation>

      <Callout type="tip" t={t}>
        {tx(t, "glslFog_tip", "Apply fog to the sky as well, using the same fog colour at the horizon, or distant objects will stand out as flat cut-outs against a blue sky. Fog uses the distance from the camera, not the depth-buffer z: with z, fog changes as you turn your head, because z is measured along the view axis.")}
      </Callout>
      <KeyIdeas t={t} id="glslFog" items={[
        "Fog = exp(−∫ρ ds): extinction plus in-scattering along the ray.",
        "Linear is an art tool, exp is physical, exp² keeps the foreground clear.",
        "Height fog integrates a⋅e^(−b⋅y) analytically along the ray.",
        "Tint the fog toward the sun for cheap scattering; fog the sky too.",
        "A ground layer (constant below H, exponential top) still integrates in closed form: split the ray where it crosses H.",
        "Noisy mist has no closed form: march the ray, T ← T(1 − α), add T·α·S per step, jitter the start, stop when T is tiny.",
        "Fog glows with sky light plus forward-scattered sun (Henyey–Greenstein), dimmed by the fog between it and the sun.",
      ]} />
    </Article>
  );
}
