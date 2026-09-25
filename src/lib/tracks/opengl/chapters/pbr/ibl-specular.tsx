// src/lib/tracks/opengl/chapters/pbr/ibl-specular.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { PbrSpheresFigure } from "@/components/lesson/figures/pbr/PbrSpheresFigure";

const r = String.raw;
const wi = r`\amber{\omega_i}`, wo = r`\blue{\omega_o}`;

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
