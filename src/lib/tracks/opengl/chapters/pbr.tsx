// src/lib/tracks/opengl/chapters/pbr.tsx
"use client";

// The "PBR" section: Theory → Cook-Torrance Lighting → Diffuse IBL → Specular IBL.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { HemisphereFigure } from "@/components/lesson/figures/pbr/HemisphereFigure";
import { MicrofacetFigure } from "@/components/lesson/figures/pbr/MicrofacetFigure";
import { BrdfTermsFigure } from "@/components/lesson/figures/pbr/BrdfTermsFigure";
import { PbrSpheresFigure } from "@/components/lesson/figures/pbr/PbrSpheresFigure";

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

// ═════════════════════════════════════════════════════════════════════════════
// Cook-Torrance lighting
// ═════════════════════════════════════════════════════════════════════════════

export function PbrLightingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPbrL_intro",
          "The Cook-Torrance BRDF splits the material into a diffuse part and a specular part. The specular part is the product of three factors, each answering one physical question about the microfacets. This chapter derives each one, shows it on its own, and assembles the full shader for point lights.")}
      </Lead>

      <Equation label={tx(t, "oglPbrL_ctLabel", "Cook-Torrance BRDF")}
        where={[
          [r`\frac{c}{\pi}`, tx(t, "oglPbrL_wLambert", "Lambertian diffuse, c = albedo — normalised by the π from the previous chapter")],
          [r`\purple{D}`, tx(t, "oglPbrL_wD", "normal Distribution: how many microfacets are aligned with h")],
          [r`\amber{F}`, tx(t, "oglPbrL_wF", "Fresnel: how much each aligned facet reflects, given the angle")],
          [r`\green{G}`, tx(t, "oglPbrL_wG", "Geometry: how many survive shadowing and masking by their neighbours")],
          [r`4(\dotp{\vN}{\vV})(\dotp{\vN}{\vL})`, tx(t, "oglPbrL_wDen", "converts from microfacet space to the macro surface (a Jacobian of the h → l mapping)")],
        ]}>
        {r`f_r = k_d\,\frac{c}{\pi} \;+\; k_s\,\frac{\purple{D}\,\amber{F}\,\green{G}}{4\,(\dotp{\vN}{\vV})\,(\dotp{\vN}{\vL})}`}
      </Equation>
      <p>
        {tx(t, "oglPbrL_ksF",
          "In practice F is the fraction reflected, so it is ks. It already appears in the specular numerator, so ks is dropped from the formula (otherwise it would be counted twice), and kd = 1 − F.")}
      </p>

      <H2>{tx(t, "oglPbrL_dTitle", "D — the normal distribution function (GGX)")}</H2>
      <p>
        {tx(t, "oglPbrL_dBody",
          "D answers the question: of all the microfacets, how dense are the ones whose normal is exactly h? Trowbridge-Reitz GGX is the industry standard. Its long tail gives highlights the soft halo that real materials have and that the old Beckmann distribution lacked.")}
      </p>
      <Equation label={tx(t, "oglPbrL_dLabel", "Trowbridge-Reitz GGX")}
        where={[
          [r`\alpha = \text{roughness}^2`, tx(t, "oglPbrL_wAlpha", "Disney/Epic's remapping — makes the roughness slider feel perceptually linear")],
        ]}
        note={tx(t, "oglPbrL_dNote", "At n·h = 1 the bracket equals α², so D(1) = 1/(πα²): a smooth surface gives a huge, narrow spike, a rough one a low, wide lobe. Whatever the roughness, the projected area ∫ D (n·h) dω stays exactly 1.")}
        glsl="float a2 = a*a;  float d = NdotH*NdotH*(a2 - 1.0) + 1.0;  float D = a2 / (PI * d * d);">
        {r`\purple{D}_{GGX}(\vN, \vH, \alpha) = \frac{\alpha^2}{\pi\,\big((\dotp{\vN}{\vH})^2(\alpha^2 - 1) + 1\big)^2}`}
      </Equation>

      <BrdfTermsFigure t={t} initial="D" />

      <H2>{tx(t, "oglPbrL_gTitle", "G — the geometry function (Smith + Schlick-GGX)")}</H2>
      <p>
        {tx(t, "oglPbrL_gBody",
          "On a rough surface a microfacet can be correctly aligned and still contribute nothing. Its neighbours may block the light on the way in (shadowing) or block the reflection on the way out (masking). G is the fraction that survives. Smith's method treats the two directions independently and multiplies them:")}
      </p>
      <Equation label={tx(t, "oglPbrL_gLabel", "Schlick-GGX, combined with Smith's method")}
        where={[
          [r`k_{direct} = \frac{(\text{roughness} + 1)^2}{8}`, tx(t, "oglPbrL_wKd", "remapping for analytic lights (Epic's, reduces hotness at low roughness)")],
          [r`k_{IBL} = \frac{\text{roughness}^2}{2}`, tx(t, "oglPbrL_wKi", "remapping for image-based lighting")],
        ]}
        glsl="float G1(float NdotX, float k) { return NdotX / (NdotX * (1.0 - k) + k); }  G = G1(NdotV, k) * G1(NdotL, k);">
        {r`\green{G_1}(\vN, \mathbf{x}, k) = \frac{\dotp{\vN}{\mathbf{x}}}{(\dotp{\vN}{\mathbf{x}})(1 - k) + k}
\qquad
\green{G}(\vN, \vV, \vL, k) = \green{G_1}(\vN, \vV, k)\;\green{G_1}(\vN, \vL, k)`}
      </Equation>
      <BrdfTermsFigure t={t} initial="G" />

      <H2>{tx(t, "oglPbrL_fTitle", "F — the Fresnel equation (Schlick)")}</H2>
      <p>
        {tx(t, "oglPbrL_fBody",
          "Look at a lake: straight down you see the bottom, toward the horizon you see the sky reflected. Every material reflects more at grazing angles, and all of them approach 100% at 90°. The full Fresnel equations need complex indices of refraction, but Schlick's approximation needs only the reflectance at normal incidence, F0:")}
      </p>
      <Equation label={tx(t, "oglPbrL_fLabel", "Fresnel-Schlick")}
        where={[
          [r`F_0`, tx(t, "oglPbrL_wF0", "base reflectivity looking straight at the surface — an RGB value")],
          [r`\dotp{\vH}{\vV}`, tx(t, "oglPbrL_wHV", "cosine of the angle between the facet normal (h) and the view")],
        ]}
        glsl="vec3 F = F0 + (1.0 - F0) * pow(clamp(1.0 - dot(H, V), 0.0, 1.0), 5.0);">
        {r`\amber{F}_{Schlick}(\vH, \vV, F_0) = F_0 + (1 - F_0)\,\big(1 - (\dotp{\vH}{\vV})\big)^5`}
      </Equation>
      <p>{tx(t, "oglPbrL_f0Table", "F0 values measured for real materials (linear):")}</p>
      <LessonTable
        headers={[tx(t, "oglPbrL_thMat", "Material"), "F0 (linear)", tx(t, "oglPbrL_thNote", "Note")]}
        rows={[
          [tx(t, "oglPbrL_water", "Water"), "(0.02, 0.02, 0.02)", tx(t, "oglPbrL_waterN", "why lakes are see-through head-on")],
          [tx(t, "oglPbrL_plastic", "Plastic / glass"), "(0.04, 0.04, 0.04)", tx(t, "oglPbrL_plasticN", "the 0.04 every engine uses for dielectrics")],
          [tx(t, "oglPbrL_diamond", "Diamond"), "(0.17, 0.17, 0.17)", tx(t, "oglPbrL_diamondN", "the brightest common dielectric")],
          [tx(t, "oglPbrL_iron", "Iron"), "(0.56, 0.57, 0.58)", tx(t, "oglPbrL_metalN", "metals: F0 is coloured and high")],
          [tx(t, "oglPbrL_copper", "Copper"), "(0.95, 0.64, 0.54)", ""],
          [tx(t, "oglPbrL_gold", "Gold"), "(1.00, 0.71, 0.29)", ""],
        ]}
      />
      <Equation label={tx(t, "oglPbrL_mixLabel", "One formula for both kinds of material")}
        note={tx(t, "oglPbrL_mixNote", "That is how the albedo map can serve both: for dielectrics it is the diffuse colour, and F0 is a fixed 4% grey. For metals it becomes F0 itself, and the diffuse is removed by the (1 − metallic) in kd.")}
        glsl="vec3 F0 = mix(vec3(0.04), albedo, metallic);">
        {r`F_0 = \operatorname{mix}(0.04,\; \text{albedo},\; \text{metallic})`}
      </Equation>
      <BrdfTermsFigure t={t} initial="F" />

      <H2>{tx(t, "oglPbrL_assembleTitle", "Putting it together")}</H2>
      <p>
        {tx(t, "oglPbrL_assembleBody",
          "With point lights the integral over the hemisphere becomes a sum over the lights. Each light contributes radiance from exactly one direction. Its radiance falls off with the physically correct inverse square of distance: no constant, linear and quadratic terms here.")}
      </p>
      <Equation label={tx(t, "oglPbrL_sumLabel", "Reflectance equation for N point lights")}
        where={[
          [r`L_i = \frac{\Phi_i}{d_i^2}`, tx(t, "oglPbrL_wLi", "light colour × intensity over squared distance")],
        ]}>
        {r`L_o(p, \vV) = \sum_{i=1}^{N} \Big( k_d\,\frac{c}{\pi} + \frac{\purple{D}\,\amber{F}\,\green{G}}{4\,(\dotp{\vN}{\vV})(\dotp{\vN}{\vL_i})} \Big)\, L_i\; \green{(\dotp{\vN}{\vL_i})}`}
      </Equation>
      <CodeBlock lang="glsl" filename="pbr.frag" t={t}>{`uniform vec3  albedo;     // linear
uniform float metallic, roughness, ao;
uniform vec3  lightPositions[4], lightColors[4];
uniform vec3  camPos;

const float PI = 3.14159265359;

float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness, a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (PI * d * d);
}
float GeometrySchlickGGX(float NdotX, float roughness) {
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    return NdotX / (NdotX * (1.0 - k) + k);
}
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    return GeometrySchlickGGX(max(dot(N, V), 0.0), roughness)
         * GeometrySchlickGGX(max(dot(N, L), 0.0), roughness);
}
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    vec3 N = normalize(Normal), V = normalize(camPos - WorldPos);
    vec3 F0 = mix(vec3(0.04), albedo, metallic);

    vec3 Lo = vec3(0.0);
    for (int i = 0; i < 4; ++i) {
        vec3 L = normalize(lightPositions[i] - WorldPos);
        vec3 H = normalize(V + L);
        float distance = length(lightPositions[i] - WorldPos);
        vec3 radiance = lightColors[i] / (distance * distance);

        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3  F   = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 specular = NDF * G * F / (4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001);
        vec3 kD = (vec3(1.0) - F) * (1.0 - metallic);

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }
    vec3 ambient = vec3(0.03) * albedo * ao;       // placeholder until IBL
    vec3 color = ambient + Lo;

    color = color / (color + vec3(1.0));           // HDR → LDR (Reinhard)
    color = pow(color, vec3(1.0 / 2.2));           // linear → sRGB
    FragColor = vec4(color, 1.0);
}`}</CodeBlock>

      <PbrSpheresFigure t={t} />

      <H2>{tx(t, "oglPbrL_texTitle", "Textured PBR")}</H2>
      <p>
        {tx(t, "oglPbrL_texBody",
          "Swap each uniform for a texture lookup and the same shader renders any material. Albedo is the only map stored in sRGB. Either load it as GL_SRGB8_ALPHA8 or convert it with pow(…, 2.2); the others are linear data.")}
      </p>
      <CodeBlock lang="glsl" filename="pbr_textured.frag" t={t}>{`vec3  albedo    = pow(texture(albedoMap, TexCoords).rgb, vec3(2.2));
float metallic  = texture(metallicMap,  TexCoords).r;
float roughness = texture(roughnessMap, TexCoords).r;
float ao        = texture(aoMap,        TexCoords).r;
vec3  N         = getNormalFromMap();     // TBN, see Normal Mapping`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglPbrL_pitfalls",
          "Classic PBR bugs: forgetting the + 0.0001 in the denominator, which gives NaN/black pixels at the silhouette where n·v = 0. Clamping radiance to 1.0, because PBR needs an HDR target and tone mapping (see HDR). Roughness exactly 0, where D becomes a delta and the highlight vanishes between pixels: clamp it to about 0.04. Keeping the old attenuation constants, which are not inverse-square.")}
      </Callout>

      <KeyIdeas t={t} id="oglPbrL" items={[
        "Cook-Torrance = kd·c/π + D·F·G / (4 (n·v)(n·l)).",
        "D (GGX) — how many facets face h; G (Smith, Schlick-GGX) — how many are not blocked; F (Schlick) — how much each reflects.",
        "F0 = mix(0.04, albedo, metallic) and kd = (1 − F)(1 − metallic): one albedo map serves metals and dielectrics.",
        "Point lights turn the integral into a sum; light falls off with 1/d².",
        "Render in HDR, tone map, then gamma-encode; only albedo textures are sRGB.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// IBL — diffuse irradiance
// ═════════════════════════════════════════════════════════════════════════════

export function IblDiffuseContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglIblD_intro",
          "Point lights are a convenient lie. In reality light arrives from every direction: the sky, the ground, the walls. Image-based lighting treats an environment map as the light source, where every texel is a tiny light. Evaluating the reflectance equation against millions of lights per pixel is out of the question, so we precompute.")}
      </Lead>

      <H2>{tx(t, "oglIblD_splitTitle", "Splitting the integral")}</H2>
      <p>
        {tx(t, "oglIblD_splitBody",
          "Expand Cook-Torrance inside the reflectance equation. The diffuse and specular parts are separate integrals, and we can attack each one on its own:")}
      </p>
      <Equation label={tx(t, "oglIblD_splitLabel", "Diffuse + specular")}>
        {r`L_o(p, ${wo}) = \underbrace{\int_{\Omega} k_d\,\frac{c}{\pi}\, L_i(p, ${wi})\,(\dotp{\vN}{${wi}})\,d${wi}}_{\text{diffuse}}
\;+\; \underbrace{\int_{\Omega} \frac{DFG}{4(\dotp{${wo}}{\vN})(\dotp{${wi}}{\vN})}\, L_i(p, ${wi})\,(\dotp{\vN}{${wi}})\,d${wi}}_{\text{specular (next chapter)}}`}
      </Equation>
      <p>
        {tx(t, "oglIblD_pullOut",
          "In the diffuse integral, kd, c and π do not depend on ωᵢ. Take them out, and what remains depends only on the normal: it is the irradiance from the previous chapters.")}
      </p>
      <Equation label={tx(t, "oglIblD_irrLabel", "Diffuse IBL = albedo × a lookup")}
        note={tx(t, "oglIblD_irrNote", "So precompute E(n) once for every direction n, store it in a small cube map (the irradiance map), and at runtime the whole diffuse integral is one texture fetch with the normal.")}
        glsl="vec3 irradiance = texture(irradianceMap, N).rgb;  vec3 diffuse = irradiance * albedo;">
        {r`L_{o,\,d}(p) = k_d\,\frac{c}{\pi} \int_{\Omega} L_i(p, ${wi})\,(\dotp{\vN}{${wi}})\,d${wi} = k_d\, c\, \underbrace{\frac{1}{\pi}\,E(\vN)}_{\text{irradiance map}}`}
      </Equation>

      <H2>{tx(t, "oglIblD_hdrTitle", "An HDR environment")}</H2>
      <p>
        {tx(t, "oglIblD_hdrBody",
          "The environment must hold real radiance, not display colours. The sun is thousands of times brighter than the sky beside it, and an 8-bit skybox flattens it to white = 1.0. The standard source is an equirectangular .hdr file, loaded with stb_image's stbi_loadf. It is converted to a float cube map by rendering a unit cube six times, one face at a time, the way Point Shadows rendered six depth faces.")}
      </p>
      <CodeBlock lang="cpp" filename="equirect_to_cubemap.cpp" t={t}>{`stbi_set_flip_vertically_on_load(true);
float* data = stbi_loadf("sky.hdr", &w, &h, &n, 0);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB16F, w, h, 0, GL_RGB, GL_FLOAT, data);

// 512² cube map with float faces
for (unsigned i = 0; i < 6; ++i)
    glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB16F, 512, 512, 0, GL_RGB, GL_FLOAT, nullptr);

glm::mat4 proj = glm::perspective(glm::radians(90.0f), 1.0f, 0.1f, 10.0f);   // 90° = one face
for (unsigned i = 0; i < 6; ++i) {
    shader.setMat4("view", captureViews[i]);          // the six lookAt matrices
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                           GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    renderCube();                                     // frag: sample equirect with the direction
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="equirect.frag" t={t}>{`const vec2 invAtan = vec2(0.1591, 0.3183);      // 1/2π, 1/π
vec2 sampleSphericalMap(vec3 v) {
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y)) * invAtan;
    return uv + 0.5;
}
void main() { FragColor = vec4(texture(equirectangularMap, sampleSphericalMap(normalize(localPos))).rgb, 1.0); }`}</CodeBlock>

      <H2>{tx(t, "oglIblD_convTitle", "Convolution: the irradiance map")}</H2>
      <p>
        {tx(t, "oglIblD_convBody",
          "For each texel of the irradiance map, take its direction as the normal and integrate the environment over the hemisphere around it. As in the theory chapter, the integral becomes a Riemann sum in θ and φ, and the sin θ from dω must stay in:")}
      </p>
      <Equation label={tx(t, "oglIblD_riemannLabel", "The discrete convolution")}
        where={[
          [r`n_1,\ n_2`, tx(t, "oglIblD_wN", "number of steps in φ and in θ")],
          [r`\frac{\pi}{n_1 n_2}`, tx(t, "oglIblD_wPi", "the two step sizes Δφ = 2π/n₁ and Δθ = (π/2)/n₂, times the 1/π: (2π/n₁) · (π/2n₂) / π = π/(n₁n₂)")],
        ]}>
        {r`\frac{1}{\pi}E(\vN) \approx \frac{\pi}{n_1\,n_2} \sum_{\varphi = 0}^{n_1} \sum_{\theta = 0}^{n_2} L_i(p, \varphi_j, \theta_k)\;\cos\theta_k\,\sin\theta_k`}
      </Equation>
      <HemisphereFigure t={t} mode="samples" />
      <CodeBlock lang="glsl" filename="irradiance_convolution.frag" t={t}>{`vec3 N = normalize(localPos);                    // this texel's direction = the normal
vec3 up    = abs(N.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
vec3 right = normalize(cross(up, N));
up         = normalize(cross(N, right));

vec3 irradiance = vec3(0.0);
float samples = 0.0, delta = 0.025;
for (float phi = 0.0; phi < 2.0 * PI; phi += delta) {
    for (float theta = 0.0; theta < 0.5 * PI; theta += delta) {
        // spherical → tangent space → world
        vec3 t = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
        vec3 dir = t.x * right + t.y * up + t.z * N;
        irradiance += texture(environmentMap, dir).rgb * cos(theta) * sin(theta);
        samples++;
    }
}
irradiance = PI * irradiance / samples;
FragColor = vec4(irradiance, 1.0);`}</CodeBlock>
      <p>
        {tx(t, "oglIblD_lowRes",
          "Irradiance varies slowly with the normal, because it is a cosine-weighted average of half the sky. A 32×32 cube map is enough, and linear filtering takes care of the rest.")}
      </p>

      <H2>{tx(t, "oglIblD_fresnelTitle", "Fresnel without a halfway vector")}</H2>
      <p>
        {tx(t, "oglIblD_fresnelBody",
          "kd = 1 − F needs F, but with light arriving from everywhere there is no single h. Use n·v instead. Rough surfaces should not get the full bright Fresnel rim, since their facets face many directions, so Sébastien Lagarde's variant caps the grazing reflectance by roughness:")}
      </p>
      <Equation label={tx(t, "oglIblD_frLabel", "Fresnel-Schlick with roughness")}
        glsl="vec3 F = F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 5.0);">
        {r`\amber{F} = F_0 + \big(\max(1 - \text{roughness},\, F_0) - F_0\big)\,\big(1 - \dotp{\vN}{\vV}\big)^5`}
      </Equation>
      <CodeBlock lang="glsl" filename="pbr.frag (ambient)" t={t}>{`vec3 F  = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
vec3 kD = (1.0 - F) * (1.0 - metallic);
vec3 irradiance = texture(irradianceMap, N).rgb;
vec3 diffuse    = irradiance * albedo;
vec3 ambient    = (kD * diffuse) * ao;       // specular IBL comes next chapter
vec3 color = ambient + Lo;`}</CodeBlock>

      <PbrSpheresFigure t={t} ibl="diffuse" />

      <Callout type="info" t={t}>
        {tx(t, "oglIblD_seamless",
          "Enable glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS) in desktop OpenGL. Without it, filtering stops at face edges and blurry maps show visible seams along the cube's edges. WebGL2 and OpenGL ES 3 are always seamless.")}
      </Callout>

      <KeyIdeas t={t} id="oglIblD" items={[
        "IBL treats the environment map as light arriving from every direction.",
        "The diffuse integral depends only on n, so precompute it into a small irradiance cube map.",
        "The convolution is a Riemann sum over θ, φ weighted by cos θ · sin θ.",
        "The environment must be HDR; convert equirect → cube map by rendering six faces.",
        "Use Fresnel with n·v and roughness for kd, since there is no single h.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// IBL — specular
// ═════════════════════════════════════════════════════════════════════════════

export function IblSpecularContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglIblS_intro",
          "The specular integral is harder: the BRDF depends on both ωᵢ and ωₒ, so there is no single variable to precompute against. Epic Games' split sum approximation (Karis, 2013) breaks it into two pieces that can each be baked into a texture. It is what nearly every real-time PBR renderer ships.")}
      </Lead>

      <H2>{tx(t, "oglIblS_splitTitle", "The split sum approximation")}</H2>
      <Equation label={tx(t, "oglIblS_specLabel", "The specular integral")}>
        {r`L_{o,\,s}(p, ${wo}) = \int_{\Omega} f_r(p, ${wi}, ${wo})\; L_i(p, ${wi})\,(\dotp{\vN}{${wi}})\,d${wi}`}
      </Equation>
      <p>
        {tx(t, "oglIblS_splitBody",
          "Approximate the integral of a product by a product of integrals. The first factor depends on the environment and the roughness. The second depends only on the BRDF, meaning n·v, roughness and F0:")}
      </p>
      <Equation label={tx(t, "oglIblS_splitLabel", "Split sum")}
        notes={[
          tx(t, "oglIblS_n1", "Left: the prefiltered environment map, one blur level per roughness, stored in the mip chain."),
          tx(t, "oglIblS_n2", "Right: the BRDF integration map, a 2D table indexed by (n·v, roughness)."),
        ]}>
        {r`L_{o,\,s} \approx \underbrace{\int_{\Omega} L_i(p, ${wi})\,d${wi}}_{\text{prefiltered env (roughness)}} \;\cdot\; \underbrace{\int_{\Omega} f_r(p, ${wi}, ${wo})\,(\dotp{\vN}{${wi}})\,d${wi}}_{\text{BRDF LUT } (\dotp{\vN}{${wo}},\ \text{roughness})}`}
      </Equation>

      <H2>{tx(t, "oglIblS_isTitle", "Importance sampling")}</H2>
      <p>
        {tx(t, "oglIblS_isBody",
          "A uniform Riemann grid wastes almost every sample on a glossy surface, because the specular lobe covers a tiny part of the hemisphere. Monte Carlo integration with importance sampling instead generates directions where the lobe actually is, following the GGX distribution, and divides by their probability:")}
      </p>
      <Equation label={tx(t, "oglIblS_mcLabel", "Monte Carlo estimator")}
        where={[
          [r`\text{pdf}(\omega_k)`, tx(t, "oglIblS_wPdf", "the probability density of having generated sample k")],
        ]}>
        {r`\int_{\Omega} f(\omega)\,d\omega \;\approx\; \frac{1}{N}\sum_{k=1}^{N} \frac{f(\omega_k)}{\text{pdf}(\omega_k)}`}
      </Equation>
      <p>
        {tx(t, "oglIblS_hammersley",
          "Instead of random numbers, a low-discrepancy sequence spreads the samples evenly and converges much faster. The Hammersley sequence pairs i/N with the Van der Corput radical inverse (the bits of i mirrored around the binary point). Each 2D point is then mapped to a GGX-distributed halfway vector:")}
      </p>
      <Equation label={tx(t, "oglIblS_ggxSample", "GGX importance sample from ξ = (ξ₁, ξ₂) ∈ [0,1)²")}
        glsl="float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));">
        {r`\varphi = 2\pi\,\xi_1 \qquad \cos\theta_h = \sqrt{\frac{1 - \xi_2}{1 + (\alpha^2 - 1)\,\xi_2}}`}
      </Equation>
      <CodeBlock lang="glsl" filename="importance_sample.glsl" t={t}>{`float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;   // / 0x100000000
}
vec2 Hammersley(uint i, uint N) { return vec2(float(i) / float(N), RadicalInverse_VdC(i)); }

vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;
    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    vec3 H = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);   // tangent space
    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 T = normalize(cross(up, N));
    vec3 B = cross(N, T);
    return normalize(T * H.x + B * H.y + N * H.z);
}`}</CodeBlock>

      <H2>{tx(t, "oglIblS_preTitle", "The prefiltered environment map")}</H2>
      <p>
        {tx(t, "oglIblS_preBody",
          "The lobe's shape depends on the view direction, which a lookup by reflection vector alone cannot know. Epic's second approximation assumes n = v = r, looking straight down the reflection. The prefilter then depends only on the direction and the roughness. Give each roughness its own mip level, blurrier as it goes down:")}
      </p>
      <CodeBlock lang="glsl" filename="prefilter.frag" t={t}>{`vec3 N = normalize(localPos);
vec3 R = N, V = R;                                      // the n = v = r assumption
const uint SAMPLE_COUNT = 1024u;
vec3 color = vec3(0.0);
float weight = 0.0;
for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
    vec3 H = ImportanceSampleGGX(Hammersley(i, SAMPLE_COUNT), N, roughness);
    vec3 L = normalize(2.0 * dot(V, H) * H - V);        // reflect V around H
    float NdotL = max(dot(N, L), 0.0);
    if (NdotL > 0.0) {
        color  += texture(environmentMap, L).rgb * NdotL;
        weight += NdotL;
    }
}
FragColor = vec4(color / weight, 1.0);`}</CodeBlock>
      <CodeBlock lang="cpp" filename="prefilter_mips.cpp" t={t}>{`glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glGenerateMipmap(GL_TEXTURE_CUBE_MAP);                  // allocate the chain
const unsigned maxMip = 5;
for (unsigned mip = 0; mip < maxMip; ++mip) {
    unsigned size = 128 >> mip;
    glViewport(0, 0, size, size);
    shader.setFloat("roughness", float(mip) / float(maxMip - 1));
    for (unsigned i = 0; i < 6; ++i) {
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                               GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterMap, mip);
        renderCube();
    }
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglIblS_dots",
          "Bright dots around a strong light source are the classic prefilter artifact. A few samples land on the sun, and each one carries its full HDR value. The fix (Colbert & Křivánek) samples a blurrier mip of the environment when the sample's probability is low. Such a sample stands in for a large solid angle, so it should read a correspondingly blurred texel. The figure below uses it.")}
      </Callout>
      <Equation label={tx(t, "oglIblS_lodLabel", "Mip level from the sample's solid angle")}
        where={[
          [r`\Omega_s = \frac{1}{N\cdot\text{pdf}}`, tx(t, "oglIblS_wOs", "solid angle represented by one sample")],
          [r`\Omega_p = \frac{4\pi}{6\,w^2}`, tx(t, "oglIblS_wOp", "solid angle of one texel of a w×w cube face")],
          [r`\text{pdf} = \frac{D\,(\dotp{\vN}{\vH})}{4\,(\dotp{\vH}{\vV})}`, tx(t, "oglIblS_wPdfH", "GGX pdf converted from h to l")],
        ]}>
        {r`\text{mip} = \tfrac{1}{2}\log_2\!\frac{\Omega_s}{\Omega_p}`}
      </Equation>

      <H2>{tx(t, "oglIblS_lutTitle", "The BRDF integration map")}</H2>
      <p>
        {tx(t, "oglIblS_lutBody",
          "The second factor still depends on F0, which would need a 3D table. Substitute Fresnel-Schlick in and F0 factors out of the integral. What is left is a scale and a bias on F0, each a 2D function of (n·v, roughness):")}
      </p>
      <Equation label={tx(t, "oglIblS_lutLabel", "Factor F0 out of the BRDF integral")}
        where={[
          [r`\red{A}`, tx(t, "oglIblS_wA", "scale — stored in the LUT's red channel")],
          [r`\green{B}`, tx(t, "oglIblS_wB", "bias — stored in the green channel")],
        ]}
        glsl="vec2 envBRDF = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;  specular = prefiltered * (F * envBRDF.x + envBRDF.y);">
        {r`\int_{\Omega} f_r\,(\dotp{\vN}{${wi}})\,d${wi} = F_0\underbrace{\int_{\Omega} \frac{f_r}{F}\big(1 - (1 - \dotp{${wo}}{\vH})^5\big)(\dotp{\vN}{${wi}})\,d${wi}}_{\red{A}} + \underbrace{\int_{\Omega} \frac{f_r}{F}(1 - \dotp{${wo}}{\vH})^5(\dotp{\vN}{${wi}})\,d${wi}}_{\green{B}}`}
      </Equation>
      <CodeBlock lang="glsl" filename="brdf_lut.frag" t={t}>{`vec2 IntegrateBRDF(float NdotV, float roughness) {
    vec3 V = vec3(sqrt(1.0 - NdotV * NdotV), 0.0, NdotV);
    vec3 N = vec3(0.0, 0.0, 1.0);
    float A = 0.0, B = 0.0;
    const uint SAMPLE_COUNT = 1024u;
    for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec3 H = ImportanceSampleGGX(Hammersley(i, SAMPLE_COUNT), N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);
        float NdotL = max(L.z, 0.0), NdotH = max(H.z, 0.0), VdotH = max(dot(V, H), 0.0);
        if (NdotL > 0.0) {
            float G = GeometrySmith(N, V, L, roughness);    // with k = roughness² / 2 (IBL)
            float G_Vis = (G * VdotH) / (NdotH * NdotV);    // BRDF · cos / pdf, simplified
            float Fc = pow(1.0 - VdotH, 5.0);
            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }
    return vec2(A, B) / float(SAMPLE_COUNT);
}
void main() { FragColor = IntegrateBRDF(TexCoords.x, TexCoords.y); }   // into a 512² GL_RG16F`}</CodeBlock>

      <H2>{tx(t, "oglIblS_finalTitle", "The final ambient term")}</H2>
      <CodeBlock lang="glsl" filename="pbr.frag (ambient)" t={t}>{`vec3 F  = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
vec3 kS = F;
vec3 kD = (1.0 - kS) * (1.0 - metallic);

vec3 diffuse = texture(irradianceMap, N).rgb * albedo;

const float MAX_REFLECTION_LOD = 4.0;
vec3 R = reflect(-V, N);
vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
vec2 envBRDF  = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
vec3 specular = prefilteredColor * (F * envBRDF.x + envBRDF.y);

vec3 ambient = (kD * diffuse + specular) * ao;
vec3 color   = ambient + Lo;`}</CodeBlock>

      <PbrSpheresFigure t={t} ibl="specular" />

      <H2>{tx(t, "oglIblS_orderTitle", "Precompute once, at load time")}</H2>
      <LessonTable
        headers={[tx(t, "oglIblS_thStep", "Step"), tx(t, "oglIblS_thOut", "Output"), tx(t, "oglIblS_thWhen", "When")]}
        rows={[
          [tx(t, "oglIblS_s1", "Equirect .hdr → cube map"), "512² RGB16F + mips", tx(t, "oglIblS_perEnv", "per environment")],
          [tx(t, "oglIblS_s2", "Irradiance convolution"), "32² RGB16F", tx(t, "oglIblS_perEnv", "per environment")],
          [tx(t, "oglIblS_s3", "Prefilter, 5 roughness mips"), "128² RGB16F, 5 mips", tx(t, "oglIblS_perEnv", "per environment")],
          [tx(t, "oglIblS_s4", "BRDF integration"), "512² RG16F", tx(t, "oglIblS_once", "once, ever — ship it as a texture")],
        ]}
      />

      <Callout type="info" t={t}>
        {tx(t, "oglIblS_limits",
          "The n = v = r assumption costs something. At grazing angles, real glossy reflections stretch vertically, the streaks of city lights on a wet road, and the split sum cannot produce them. Games also place local reflection probes (small cube maps captured around the level) and blend between them, because a single infinitely distant environment makes indoor objects reflect the outdoor sky.")}
      </Callout>

      <KeyIdeas t={t} id="oglIblS" items={[
        "Split sum: ∫ L·fr·cos ≈ (∫ L) · (∫ fr·cos) — two precomputable pieces.",
        "Prefiltered cube map: GGX-importance-sampled environment, one roughness per mip, read with textureLod(R, roughness · maxMip).",
        "BRDF LUT: F0 factors out as F0·A + B; a 2D (n·v, roughness) table, identical for every scene.",
        "Hammersley + GGX importance sampling converge with a few hundred samples; low-pdf samples read blurrier mips to avoid fireflies.",
        "Final ambient = (kd · irradiance · albedo + prefiltered · (F·A + B)) · ao.",
      ]} />
    </Article>
  );
}
