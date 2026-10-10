// src/lib/tracks/opengl/chapters/pbr/pbr-theory.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { hemisphereNumbers, srgbRoughNumbers } from "../../live/pbr-theory";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { HemisphereFigure } from "@/components/lesson/figures/pbr/HemisphereFigure";
import { MicrofacetFigure } from "@/components/lesson/figures/pbr/MicrofacetFigure";

const r = String.raw;
const wi = r`\amber{\omega_i}`, wo = r`\blue{\omega_o}`;

// ═════════════════════════════════════════════════════════════════════════════
// Theory
// ═════════════════════════════════════════════════════════════════════════════

export function PbrTheoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPbrT_intro",
          "Physically based rendering is not one algorithm but a promise: every term in the lighting equation has a physical meaning and a physical unit. Artists stop tweaking specular strengths per light; a material authored once looks right under noon sun, a candle, or a studio HDRI. This chapter builds the theory — the next three turn it into shaders.")}
      </Lead>

      <Goals t={t} id="oglPbrT" items={[
        "Describe a surface as many tiny mirrors.",
        "Read the reflectance equation term by term.",
        "Estimate an integral with a loop.",
        "Set up materials with the metallic-roughness workflow.",
      ]} />

      <p>{tx(t, "oglPbrT_three", "A lighting model counts as physically based when it satisfies three conditions:")}</p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglPbrT_c1", "It is built on the microfacet surface model.")}</li>
        <li>{tx(t, "oglPbrT_c2", "It is energy conserving: a surface never reflects more light than it receives.")}</li>
        <li>{tx(t, "oglPbrT_c3", "It uses a physically based BRDF.")}</li>
      </ol>

      <H2>{tx(t, "oglPbrT_microTitle", "The microfacet model")}</H2>
      <p>
        {tx(t, "oglPbrT_microBody",
          "At a small enough scale every surface is made of tiny perfect mirrors called microfacets. Roughness is how much their orientations vary. A polished surface has facets that mostly agree with the surface normal, so reflections stay sharp. On a rough surface they point everywhere, so reflected light scatters in a wide cone.")}
      </p>
      <p>
        {tx(t, "oglPbrT_microH",
          "No facet can be rendered on its own. What we can do is ask statistically how many facets are oriented to reflect the light toward the eye. A mirror sends ")}
        <Tex>{r`\vL`}</Tex>
        {tx(t, "oglPbrT_microH2", " into ")}
        <Tex>{r`\vV`}</Tex>
        {tx(t, "oglPbrT_microH3", " only when its normal is the halfway vector ")}
        <Tex>{r`\vH`}</Tex>
        {tx(t, "oglPbrT_microH4", ", the same vector Blinn-Phong uses. The more facets align with it, the stronger and tighter the highlight.")}
      </p>
      <MicrofacetFigure t={t} />

      <H2>{tx(t, "oglPbrT_energyTitle", "Energy conservation")}</H2>
      <p>
        {tx(t, "oglPbrT_energyBody",
          "When light hits a surface it splits in two. Part of it reflects straight off the boundary, and that part is the specular term. The rest refracts into the material, scatters around inside, gets partly absorbed, and whatever comes back out is the diffuse term. What refracts is exactly what did not reflect, so the two fractions always add up to one:")}
      </p>
      <Equation label={tx(t, "oglPbrT_energyLabel", "Reflected + refracted = incoming")}
        where={[
          [r`k_s`, tx(t, "oglPbrT_wKs", "fraction reflected at the surface — this will be the Fresnel term F")],
          [r`k_d`, tx(t, "oglPbrT_wKd", "fraction that enters the material and may come back out as diffuse")],
        ]}
        glsl="vec3 kS = F;  vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);"
        words={tx(t, "oglPbrT_energyWords", "Every bit of light that arrives either bounces off the surface or goes into it. Nothing is created, so if 30% bounces off, at most 70% is left to come back out as diffuse.")}>
        {r`k_d + k_s = 1 \quad\Longrightarrow\quad k_d = 1 - k_s`}
      </Equation>
      <p>
        {tx(t, "oglPbrT_metals",
          "Metals are the exception that the (1 − metallic) factor encodes: their free electrons absorb all refracted light immediately, so they have no diffuse at all. Their colour lives entirely in what they reflect. That split between dielectrics and metals is the whole reason the metallic parameter exists.")}
      </p>

      <H2>{tx(t, "oglPbrT_radioTitle", "Radiometry in five quantities")}</H2>
      <p>
        {tx(t, "oglPbrT_radioBody",
          "To say how much light arrives at a point from a direction we need the vocabulary of radiometry. Each quantity below is the previous one, divided by something:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglPbrT_thQty", "Quantity"), tx(t, "oglPbrT_thSym", "Symbol"), tx(t, "oglPbrT_thUnit", "Unit"), tx(t, "oglPbrT_thMean", "Meaning")]}
        rows={[
          [tx(t, "oglPbrT_flux", "Radiant flux"), <Tex key="a">{r`\Phi`}</Tex>, "W", tx(t, "oglPbrT_fluxM", "total energy per second leaving a light, summed over all wavelengths (we use RGB)")],
          [tx(t, "oglPbrT_solid", "Solid angle"), <Tex key="b">{r`\omega`}</Tex>, "sr", tx(t, "oglPbrT_solidM", "the area a direction bundle covers on the unit sphere — a 2D angle")],
          [tx(t, "oglPbrT_int", "Radiant intensity"), <Tex key="c">{r`I = \frac{d\Phi}{d\omega}`}</Tex>, "W/sr", tx(t, "oglPbrT_intM", "flux per solid angle — how strong a point light is in one direction")],
          [tx(t, "oglPbrT_irr", "Irradiance"), <Tex key="d">{r`E = \frac{d\Phi}{dA}`}</Tex>, "W/m²", tx(t, "oglPbrT_irrM", "flux arriving per unit area of the surface, from all directions")],
          [tx(t, "oglPbrT_rad", "Radiance"), <Tex key="e">{r`L = \frac{d^2\Phi}{dA\,d\omega\,\cos\theta}`}</Tex>, "W/(m²·sr)", tx(t, "oglPbrT_radM", "flux per area per solid angle — the one quantity a camera pixel actually measures")],
        ]}
      />
      <Equation label={tx(t, "oglPbrT_solidLabel", "Solid angle, and its differential in spherical coordinates")}
        where={[
          [r`A`, tx(t, "oglPbrT_wA", "the area a shape covers when projected onto a sphere of radius r")],
          [r`\theta,\ \varphi`, tx(t, "oglPbrT_wTP", "polar angle from the normal and azimuth around it")],
        ]}
        note={tx(t, "oglPbrT_solidNote", "The sin θ matters: rings near the pole are smaller than rings near the equator. Integrating over the hemisphere gives 2π, the full sphere 4π.")}
        words={tx(t, "oglPbrT_solidWords", "A solid angle is the patch a shape covers on a sphere around you, divided by the radius squared so it does not depend on how big the sphere is. A tiny patch is a step in θ times a step in φ, shrunk by sin θ because the circles get small near the pole.")}>
        {r`\omega = \frac{A}{r^2} \qquad d\omega = \sin\theta \, d\theta \, d\varphi \qquad \int_{\Omega} d\omega = \int_0^{2\pi}\!\!\int_0^{\pi/2} \sin\theta\,d\theta\,d\varphi = 2\pi`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPbrT_solidDer", "Why the hemisphere is 2π steradians")}
        steps={[
          { full: true, tex: r`\int_0^{2\pi}\!\!\int_0^{\pi/2} \sin\theta\,d\theta\,d\varphi`,
            why: tx(t, "oglPbrT_sd1", "add up every tiny patch dω = sin θ dθ dφ: θ from the normal (0) down to the horizon (π/2), φ once around (2π)") },
          { full: true, tex: r`\int_0^{\pi/2} \sin\theta\,d\theta = \big[-\cos\theta\big]_0^{\pi/2} = -\cos\tfrac{\pi}{2} + \cos 0 = 0 + 1 = 1`,
            why: tx(t, "oglPbrT_sd2", "the inner integral first: an antiderivative of sin θ is −cos θ; evaluate it at the horizon and subtract its value at the normal") },
          { full: true, tex: r`\int_0^{2\pi} 1\,d\varphi = 2\pi`,
            why: tx(t, "oglPbrT_sd3", "nothing depends on φ any more, so the outer integral is just the length of the φ range") },
          { full: true, tex: r`\text{${tx(t, "oglPbrT_sd4tex", "sphere")}}: \int_0^{\pi} \sin\theta\,d\theta = 2 \;\Rightarrow\; 2 \cdot 2\pi = 4\pi`,
            why: tx(t, "oglPbrT_sd4", "for the whole sphere θ goes all the way to π, the inner integral doubles, and so does the answer") },
        ]} />
      <p>
        {tx(t, "oglPbrT_radExplain",
          "Radiance packs everything into one number. It is the light flowing through a tiny area, arriving within a tiny cone of directions. The cos θ in its denominator measures the area as seen from the light's direction, which makes radiance independent of how the surface is tilted. When the area and the cone shrink to a point and a single direction, you get Lᵢ(p, ωᵢ): the light arriving at p from exactly ωᵢ. That is what a shader works with.")}
      </p>
      <HemisphereFigure t={t} mode="radiance" />

      <Equation label={tx(t, "oglPbrT_irrLabel", "Irradiance: add up the radiance from every direction")}
        where={[
          [r`\Omega`, tx(t, "oglPbrT_wOmega", "the hemisphere above p, centred on the normal")],
          [r`\cos\theta_i = \dotp{\vN}{${wi}}`, tx(t, "oglPbrT_wCos", "Lambert's projection factor — the purple footprint in the figure")],
        ]}
        words={tx(t, "oglPbrT_irrWords", "Look in every direction of the sky above the point, take the light coming from there, weaken it by how slanted it arrives, and add it all up. That total is how much light lands on each square metre.")}>
        {r`E(p) = \int_{\Omega} L_i(p, ${wi})\,(\dotp{\vN}{${wi}})\,d${wi}`}
      </Equation>

      <H2>{tx(t, "oglPbrT_reTitle", "The reflectance equation")}</H2>
      <p>
        {tx(t, "oglPbrT_reBody",
          "Now the centrepiece. The light leaving p toward the eye is the incoming light from every direction, each weighted by how much this material redirects light from that direction toward that one. It is the rendering equation with the emission term removed, and every PBR shader evaluates some approximation of it:")}
      </p>
      <Equation label={tx(t, "oglPbrT_reLabel", "The reflectance equation")}
        where={[
          [r`L_o(p, ${wo})`, tx(t, "oglPbrT_wLo", "outgoing radiance toward the eye — the pixel colour, before tone mapping")],
          [r`\purple{f_r}(p, ${wi}, ${wo})`, tx(t, "oglPbrT_wFr", "the BRDF: the material. What fraction of light from ωᵢ goes out along ωₒ")],
          [r`L_i(p, ${wi})`, tx(t, "oglPbrT_wLi", "incoming radiance from direction ωᵢ — lights, sky, other surfaces")],
          [r`\green{\dotp{\vN}{${wi}}}`, tx(t, "oglPbrT_wNdotL", "the cosine (Lambert) factor")],
        ]}
        notes={[
          tx(t, "oglPbrT_reN1", "With a handful of point lights the integral collapses into a sum: only those few directions carry light."),
          tx(t, "oglPbrT_reN2", "With an environment map, light comes from everywhere, and the integral has to be precomputed. That is IBL, two chapters from now."),
        ]}
        words={tx(t, "oglPbrT_reWords", "The light leaving the point toward your eye is a sum over every direction above it: the light arriving from that direction, times how much the material sends from there toward you, times the slant factor.")}>
        {r`L_o(p, ${wo}) = \int_{\Omega} \purple{f_r}(p, ${wi}, ${wo})\; L_i(p, ${wi})\; \green{(\dotp{\vN}{${wi}})}\; d${wi}`}
      </Equation>

      <H2>{tx(t, "oglPbrT_riemannTitle", "Solving an integral with a loop")}</H2>
      <p>
        {tx(t, "oglPbrT_riemannBody",
          "Shaders cannot integrate symbolically. What they can do is sample: split the hemisphere into small steps in θ and φ, evaluate the integrand at each one, multiply by the size of the step, and add everything up. That is a Riemann sum, and as the steps shrink it converges to the integral. Test it on the simplest case, a constant light and a constant BRDF, which leaves only ∫ cos θ dω:")}
      </p>
      <HemisphereFigure t={t} mode="samples" />
      <Equation label={tx(t, "oglPbrT_piLabel", "The integral of the cosine over the hemisphere")}
        note={tx(t, "oglPbrT_piNote", "This π shows up everywhere in PBR. Lambert's diffuse BRDF is c/π precisely so that a white surface (c = 1) lit uniformly reflects exactly as much as it receives.")}
        words={tx(t, "oglPbrT_piWords", "Light of strength 1 arriving equally from the whole sky lands with a total of π, not 2π: the slanted directions near the horizon count for less, so on average each direction counts for one half.")}>
        {r`\int_{\Omega} \cos\theta\,d\omega = \int_0^{2\pi}\!\!\int_0^{\pi/2} \cos\theta\,\sin\theta\,d\theta\,d\varphi = 2\pi\cdot\tfrac{1}{2} = \pi`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPbrT_piDer", "Where the π comes from, and why Lambert divides by it")}
        steps={[
          { full: true, tex: r`\int_0^{\pi/2} \cos\theta\,\sin\theta\,d\theta, \qquad u = \sin\theta,\ \ du = \cos\theta\,d\theta`,
            why: tx(t, "oglPbrT_pd1", "the inner integral, with the substitution u = sin θ: its derivative cos θ dθ is already sitting in the integral") },
          { full: true, tex: r`= \int_0^{1} u\,du = \Big[\tfrac{u^2}{2}\Big]_0^1 = \tfrac{1}{2}`,
            why: tx(t, "oglPbrT_pd2", "θ = 0 gives u = 0 and θ = π/2 gives u = 1; an antiderivative of u is u²/2") },
          { full: true, tex: r`\int_0^{2\pi} \tfrac{1}{2}\,d\varphi = 2\pi \cdot \tfrac{1}{2} = \pi`,
            why: tx(t, "oglPbrT_pd3", "nothing depends on φ, so the outer integral multiplies by the length 2π") },
          { full: true, tex: r`L_o = \int_{\Omega} \frac{c}{\pi}\,L\,\cos\theta\,d\omega = \frac{c}{\pi}\,L\,\pi = c\,L`,
            why: tx(t, "oglPbrT_pd4", "a matte BRDF c/π under a uniform sky L: the constants come out, the integral is π, and the π cancels. A white surface (c = 1) sends back exactly the L it receives") },
        ]} />
      <LiveFormula label={tx(t, "oglPbrT_liveHemi", "Try it: the shader's loop for ∫ cos θ dω")}
        tex={r`\int_{\Omega} \cos\theta\,d\omega \approx \sum_{j=0}^{n_1 - 1} \sum_{k=0}^{n_2 - 1} \cos\theta_k\,\sin\theta_k\,\Delta\theta\,\Delta\varphi`}
        vars={[
          { id: "n1", label: <>n<sub>1</sub></>, min: 1, max: 64, step: 1, value: 8, fmt: v => String(v) },
          { id: "n2", label: <>n<sub>2</sub></>, min: 1, max: 64, step: 1, value: 4, fmt: v => String(v) },
        ]}
        where={[
          [r`n_1,\ n_2`, tx(t, "oglPbrT_wN12", "the number of steps around (φ) and from the normal down to the horizon (θ)")],
          [r`\theta_k = k\,\Delta\theta`, tx(t, "oglPbrT_wThetaK", "the angle at the start of step k, the way the shader's loop counts")],
        ]}
        compute={hemisphereNumbers(t)}
        note={tx(t, "oglPbrT_liveHemiNote", "n₁ makes no difference here, because nothing changes as you go around. Only n₂ matters: 4 steps miss π by about 5%, 16 by about 0.3%. With a real sky that varies around, n₁ matters too.")} />

      <H2>{tx(t, "oglPbrT_brdfTitle", "The BRDF")}</H2>
      <p>
        {tx(t, "oglPbrT_brdfBody",
          "The bidirectional reflectance distribution function takes an incoming direction, an outgoing direction, the normal and the material parameters, and returns how much of the light arriving along ωᵢ leaves along ωₒ. A perfect mirror returns zero everywhere except at the mirror direction. A perfectly matte surface returns the same value for every pair. To be physically plausible, a BRDF has to satisfy three properties:")}
      </p>
      <Equation label={tx(t, "oglPbrT_brdfProps", "Properties of a physically plausible BRDF")}
        notes={[
          tx(t, "oglPbrT_bp1", "Positivity: it never makes light negative."),
          tx(t, "oglPbrT_bp2", "Helmholtz reciprocity: swapping light and eye gives the same value."),
          tx(t, "oglPbrT_bp3", "Energy conservation: over all outgoing directions, it never reflects more than 100%."),
        ]}
        words={tx(t, "oglPbrT_brdfWords", "A real material never sends negative light, gives the same answer if light and eye trade places, and, added over every direction it could send light to, never returns more than it got.")}>
        {r`f_r \ge 0 \qquad f_r(${wi}, ${wo}) = f_r(${wo}, ${wi}) \qquad \int_{\Omega} f_r(${wi}, ${wo})\,(\dotp{\vN}{${wo}})\,d${wo} \le 1`}
      </Equation>
      <p>
        {tx(t, "oglPbrT_blinnNot",
          "Plain Blinn-Phong ignores the last property, in both directions. Its specular term is never normalised. At low shininess the lobe is wide, and diffuse plus specular can reflect more light than arrives. At high shininess the highlight shrinks but keeps the same peak, so light simply disappears. The total is never tied to the material. Multiplying the lobe by (n + 8) / 8π fixes the brightness. The Cook-Torrance BRDF in the next chapter is built to respect the limit from the start, which is why real-time engines standardised on it.")}
      </p>

      <H2>{tx(t, "oglPbrT_workflowTitle", "The metallic-roughness workflow")}</H2>
      <p>
        {tx(t, "oglPbrT_workflowBody",
          "Engines (Unreal, Unity HDRP, Godot, glTF 2.0) expose the BRDF through a small set of textures that artists can reason about:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglPbrT_thMap", "Map"), tx(t, "oglPbrT_thSpace", "Colour space"), tx(t, "oglPbrT_thWhat", "What it stores")]}
        rows={[
          ["albedo", "sRGB", tx(t, "oglPbrT_albedo", "base colour: diffuse colour for dielectrics, F0 (reflected colour) for metals. No lighting or shadows baked in")],
          ["normal", tx(t, "oglPbrT_linear", "linear"), tx(t, "oglPbrT_normal", "tangent-space normal, as in the Normal Mapping chapter")],
          ["metallic", tx(t, "oglPbrT_linear", "linear"), tx(t, "oglPbrT_metallic", "0 = dielectric, 1 = metal. Real materials are one or the other; in-between values are for blending at texel edges (rust, dust)")],
          ["roughness", tx(t, "oglPbrT_linear", "linear"), tx(t, "oglPbrT_roughness", "microfacet spread, 0 = mirror, 1 = fully matte. Some engines store smoothness = 1 − roughness")],
          ["AO", tx(t, "oglPbrT_linear", "linear"), tx(t, "oglPbrT_ao", "ambient occlusion: how much of the hemisphere is blocked by the surface's own crevices")],
        ]}
      />

      <Callout type="warn" t={t}>
        {tx(t, "oglPbrT_pitfall",
          "Only albedo is colour data. Loading metallic, roughness, normal or AO as sRGB (GL_SRGB8_ALPHA8) silently runs them through the gamma curve. A roughness of 0.5 then reads as 0.21, and every material looks too shiny.")}
      </Callout>
      <LiveFormula label={tx(t, "oglPbrT_liveSrgb", "Try it: a roughness map loaded as sRGB")}
        tex={r`\text{${tx(t, "oglPbrT_liveRead", "read")}} = \Big(\frac{v + 0.055}{1.055}\Big)^{2.4} \qquad \alpha = \text{roughness}^2 \qquad D(1) = \frac{1}{\pi\alpha^2}`}
        vars={[{ id: "v", label: "v", min: 0.05, max: 1, step: 0.01, value: 0.5, fmt: v => v.toFixed(2) }]}
        where={[
          [r`v`, tx(t, "oglPbrT_wV", "the roughness the artist painted, stored in the texture")],
          [r`D(1)`, tx(t, "oglPbrT_wD1", "the height of the GGX highlight at its centre (next chapter): smaller α, taller and narrower peak")],
        ]}
        compute={srgbRoughNumbers(t)}
        note={tx(t, "oglPbrT_liveSrgbNote", "At v = 0.5 the shader sees 0.21, α shrinks from 0.25 to 0.046 and the highlight gets about 30 times taller. Only 0 and 1 survive unchanged, which is why the bug hides on pure mirrors and fully matte test materials.")} />

      <KeyIdeas t={t} id="oglPbrT" items={[
        "Microfacets: roughness is the statistical spread of tiny mirrors; only those aligned with h reflect toward the eye.",
        "Energy conservation: kd = 1 − ks, and metals have no diffuse at all.",
        "Radiance L is flux per area per solid angle; irradiance E integrates it with a cos θ over the hemisphere.",
        "The reflectance equation Lo = ∫ fr · Li · (n·ωi) dωi is what every PBR shader approximates — a sum for point lights, precomputation for environments.",
        "∫ cos θ dω = π, which is why Lambert's BRDF is c/π.",
      ]} />
    </Article>
  );
}
