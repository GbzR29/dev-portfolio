// src/lib/tracks/opengl/chapters/pbr/pbr-theory.tsx
"use client";

import { Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
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
        glsl="vec3 kS = F;  vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);">
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
        note={tx(t, "oglPbrT_solidNote", "The sin θ matters: rings near the pole are smaller than rings near the equator. Integrating over the hemisphere gives 2π, the full sphere 4π.")}>
        {r`\omega = \frac{A}{r^2} \qquad d\omega = \sin\theta \, d\theta \, d\varphi \qquad \int_{\Omega} d\omega = \int_0^{2\pi}\!\!\int_0^{\pi/2} \sin\theta\,d\theta\,d\varphi = 2\pi`}
      </Equation>
      <p>
        {tx(t, "oglPbrT_radExplain",
          "Radiance packs everything into one number. It is the light flowing through a tiny area, arriving within a tiny cone of directions. The cos θ in its denominator measures the area as seen from the light's direction, which makes radiance independent of how the surface is tilted. When the area and the cone shrink to a point and a single direction, you get Lᵢ(p, ωᵢ): the light arriving at p from exactly ωᵢ. That is what a shader works with.")}
      </p>
      <HemisphereFigure t={t} mode="radiance" />

      <Equation label={tx(t, "oglPbrT_irrLabel", "Irradiance: add up the radiance from every direction")}
        where={[
          [r`\Omega`, tx(t, "oglPbrT_wOmega", "the hemisphere above p, centred on the normal")],
          [r`\cos\theta_i = \dotp{\vN}{${wi}}`, tx(t, "oglPbrT_wCos", "Lambert's projection factor — the purple footprint in the figure")],
        ]}>
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
        ]}>
        {r`L_o(p, ${wo}) = \int_{\Omega} \purple{f_r}(p, ${wi}, ${wo})\; L_i(p, ${wi})\; \green{(\dotp{\vN}{${wi}})}\; d${wi}`}
      </Equation>

      <H2>{tx(t, "oglPbrT_riemannTitle", "Solving an integral with a loop")}</H2>
      <p>
        {tx(t, "oglPbrT_riemannBody",
          "Shaders cannot integrate symbolically. What they can do is sample: split the hemisphere into small steps in θ and φ, evaluate the integrand at each one, multiply by the size of the step, and add everything up. That is a Riemann sum, and as the steps shrink it converges to the integral. Test it on the simplest case, a constant light and a constant BRDF, which leaves only ∫ cos θ dω:")}
      </p>
      <HemisphereFigure t={t} mode="samples" />
      <Equation label={tx(t, "oglPbrT_piLabel", "The integral of the cosine over the hemisphere")}
        note={tx(t, "oglPbrT_piNote", "This π shows up everywhere in PBR. Lambert's diffuse BRDF is c/π precisely so that a white surface (c = 1) lit uniformly reflects exactly as much as it receives.")}>
        {r`\int_{\Omega} \cos\theta\,d\omega = \int_0^{2\pi}\!\!\int_0^{\pi/2} \cos\theta\,\sin\theta\,d\theta\,d\varphi = 2\pi\cdot\tfrac{1}{2} = \pi`}
      </Equation>

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
        ]}>
        {r`f_r \ge 0 \qquad f_r(${wi}, ${wo}) = f_r(${wo}, ${wi}) \qquad \int_{\Omega} f_r(${wi}, ${wo})\,(\dotp{\vN}{${wo}})\,d${wo} \le 1`}
      </Equation>
      <p>
        {tx(t, "oglPbrT_blinnNot",
          "Blinn-Phong violates the last property: raise the shininess and the highlight shrinks but keeps the same peak, so the total energy drops. Nobody told the model where the light went. The Cook-Torrance BRDF in the next chapter conserves energy by construction, which is why real-time engines standardised on it.")}
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
