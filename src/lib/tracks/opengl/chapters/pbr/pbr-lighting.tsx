// src/lib/tracks/opengl/chapters/pbr/pbr-lighting.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { BrdfTermsFigure } from "@/components/lesson/figures/pbr/BrdfTermsFigure";
import { PbrSpheresFigure } from "@/components/lesson/figures/pbr/PbrSpheresFigure";

const r = String.raw;

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
