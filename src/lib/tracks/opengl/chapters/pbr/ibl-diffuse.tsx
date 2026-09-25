// src/lib/tracks/opengl/chapters/pbr/ibl-diffuse.tsx
"use client";

import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { HemisphereFigure } from "@/components/lesson/figures/pbr/HemisphereFigure";
import { PbrSpheresFigure } from "@/components/lesson/figures/pbr/PbrSpheresFigure";

const r = String.raw;
const wi = r`\amber{\omega_i}`, wo = r`\blue{\omega_o}`;

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
