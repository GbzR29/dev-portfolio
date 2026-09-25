"use client";

// "Atmosphere & Volumetrics" (Advanced Techniques): participating media, the scattering integral, the sky, light shafts, froxels.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { PhaseFigure } from "@/components/lesson/figures/tech/PhaseFigure";
import { SKY_PRESETS } from "../presets/atmosphere";

const r = String.raw;

export function VolumetricsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglVol_intro",
          "Everything so far assumed light travels through empty space between surfaces. Real air is full of molecules, dust and droplets, and every one of them absorbs a little light and scatters a little in new directions. That is why the sky is blue, sunsets are red, distant mountains fade, and sunbeams through a window are visible at all. Rendering it means integrating light along the view ray through a \"participating medium\" rather than stopping at the first surface.")}
      </Lead>

      <H2>{tx(t, "oglVol_mediumTitle", "What a medium does to light")}</H2>
      <Equation label={tx(t, "oglVol_coeffLabel", "The coefficients of a medium")}
        where={[
          [r`\sigma_a`, tx(t, "oglVol_wSa", "absorption coefficient (per metre): light turned into heat")],
          [r`\sigma_s`, tx(t, "oglVol_wSs", "scattering coefficient: light redirected into other directions")],
          [r`\sigma_t`, tx(t, "oglVol_wSt", "extinction = both; the probability per metre that a photon leaves the ray")],
        ]}
        note={tx(t, "oglVol_coeffNote", "Along a ray, light is lost by extinction and gained by in-scattering: light arriving from other directions (mostly the sun) that some particle redirects toward the eye. Fog, smoke, clouds and the atmosphere differ only in these coefficients, how they vary in space, and the phase function below.")}>
        {r`\sigma_t = \sigma_a + \sigma_s \qquad T(a, b) = \exp\!\left(-\int_a^b \sigma_t(s)\,ds\right)\quad\text{(transmittance, Beer–Lambert)}`}
      </Equation>
      <Equation label={tx(t, "oglVol_rteLabel", "Single scattering along the view ray")}
        where={[
          [r`L_{surf}`, tx(t, "oglVol_wLs", "radiance of the surface the ray finally hits at distance d (or the sky/space beyond)")],
          [r`T(0, s)`, tx(t, "oglVol_wT0s", "how much of the light scattered at s survives the trip back to the eye")],
          [r`V(s)`, tx(t, "oglVol_wV", "1 if the sun is visible from s (shadow map, or analytic occluders), 0 otherwise")],
          [r`T_{sun}(s)`, tx(t, "oglVol_wTsun", "transmittance from s toward the sun: sunlight dimmed on its way in")],
          [r`p(\theta)`, tx(t, "oglVol_wP", "phase function: the fraction scattered toward the eye, θ between the sun direction and the view ray")],
        ]}
        note={tx(t, "oglVol_rteNote", "\"Single\" scattering counts light that bounced exactly once in the medium. It explains the sky's colour and light shafts well; clouds and thick fog need multiple scattering, approximated with extra ambient terms or precomputed tables. In practice the integral is a loop: march the ray in steps, accumulate the in-scattered light weighted by the transmittance so far, and multiply the transmittance by e^(−σₜ·Δs) each step.")}>
        {r`L = T(0, d)\,L_{surf} \;+\; \int_0^d T(0, s)\;\sigma_s(s)\;p(\theta)\;V(s)\;T_{sun}(s)\;E_{sun}\;ds`}
      </Equation>

      <H2>{tx(t, "oglVol_phaseTitle", "Phase functions")}</H2>
      <Equation label={tx(t, "oglVol_phaseLabel", "Rayleigh and Henyey–Greenstein")}
        where={[
          [r`\mu = \cos\theta`, tx(t, "oglVol_wMu", "cosine of the angle between the light's direction and the scattered direction")],
          [r`g`, tx(t, "oglVol_wG", "anisotropy in (−1, 1): the average cosine of the scattering angle")],
        ]}
        note={tx(t, "oglVol_phaseNote", "Both integrate to 1 over the sphere: a phase function redistributes light, it never creates or destroys it. Rayleigh applies to particles much smaller than the wavelength (air molecules). HG is a one-parameter fit for everything else, and Cornette–Shanks is a slightly better one for Mie scattering in the atmosphere.")}>
        {r`p_R(\mu) = \frac{3}{16\pi}(1 + \mu^2) \qquad p_{HG}(\mu) = \frac{1}{4\pi}\,\frac{1 - g^2}{\big(1 + g^2 - 2g\mu\big)^{3/2}}`}
      </Equation>
      <PhaseFigure t={t} />

      <H2>{tx(t, "oglVol_skyTitle", "Why the sky is blue and sunsets are red")}</H2>
      <p>
        {tx(t, "oglVol_skyBody",
          "Rayleigh scattering is proportional to 1/λ⁴. Blue light (450 nm) scatters about 5.5 times more than red (700 nm). Look at the sky away from the sun and you see mostly blue light that was scattered toward you. Look at the sun near the horizon and its light has crossed so much air (about 40 times the zenith path) that the blue has been scattered away before reaching you. What is left is orange and red. Earth's atmosphere is modelled with densities that fall exponentially with altitude:")}
      </p>
      <Equation label={tx(t, "oglVol_atmoLabel", "A standard atmosphere model")}
        where={[
          [r`h`, tx(t, "oglVol_wH", "altitude above sea level")],
          [r`H_R, H_M`, tx(t, "oglVol_wHs", "scale heights: 8 km for air molecules, 1.2 km for aerosols (haze hugs the ground)")],
          [r`\beta_R`, tx(t, "oglVol_wBR", "Rayleigh scattering at sea level: (5.8, 13.5, 33.1)·10⁻⁶ m⁻¹ for R, G, B — blue ≈ 5.7× red")],
          [r`\beta_M`, tx(t, "oglVol_wBM", "Mie scattering at sea level ≈ 21·10⁻⁶ m⁻¹, the same for all colours, hence white haze")],
        ]}>
        {r`\sigma_s^R(h) = \beta_R\,e^{-h/H_R} \qquad \sigma_s^M(h) = \beta_M\,e^{-h/H_M} \qquad \beta_R \propto \frac{1}{\lambda^4}`}
      </Equation>
      <ShaderPlayground presets={SKY_PRESETS} t={t} id="oglVol" />
      <Callout type="info" t={t}>
        {tx(t, "oglVol_lutNote", "Real-time skies don't march 16 × 8 samples per pixel. They precompute lookup tables once per frame or on change: transmittance to the top of the atmosphere for every (altitude, sun angle), a multiple-scattering table, and a low-resolution \"sky-view\" panorama that the sky pixels sample (Bruneton & Neyret 2008; Hillaire 2020, used in Unreal). The physics is the same as the shader above, only amortised.")}
      </Callout>

      <H2>{tx(t, "oglVol_fogTitle", "Volumetric fog in a real renderer")}</H2>
      <p>
        {tx(t, "oglVol_fogBody",
          "Marching every pixel's ray with a shadow-map lookup per step is too slow at full resolution. Engines (Frostbite, Unreal, Unity HDRP) use a froxel grid: the clustered-shading grid again, a 3D texture of about 160×90×64 cells aligned with the view frustum and sliced exponentially in depth. A compute shader fills every froxel with density (global fog, local fog volumes, noise) and in-scattered light (the sun with its cascaded shadow map, point and spot lights from the cluster lists, all weighted by the phase function). A second pass integrates front to back along each column, storing accumulated in-scattering and transmittance in every cell. Applying the fog to any pixel, opaque or transparent, is then one 3D texture lookup at its depth.")}
      </p>
      <CodeBlock lang="glsl" filename="froxel_integrate.comp" t={t}>{`layout(local_size_x = 8, local_size_y = 8) in;
layout(binding = 0, rgba16f) readonly  uniform image3D uScattering;   // rgb: in-scattered light, a: σ_t
layout(binding = 1, rgba16f) writeonly uniform image3D uIntegrated;   // rgb: accumulated light, a: transmittance

void main() {
    ivec2 xy = ivec2(gl_GlobalInvocationID.xy);
    vec3 accum = vec3(0.0);
    float T = 1.0;
    for (int z = 0; z < SLICES; ++z) {                    // front to back along the view
        vec4 s = imageLoad(uScattering, ivec3(xy, z));
        float ds = sliceThickness(z);                     // exponential slices: thicker far away
        float Tslice = exp(-s.a * ds);
        // integrate the in-scattering across the slice analytically (Hillaire 2015)
        vec3 S = s.rgb * (1.0 - Tslice) / max(s.a, 1e-5);
        accum += T * S;
        T *= Tslice;
        imageStore(uIntegrated, ivec3(xy, z), vec4(accum, T));
    }
}
// Applying it:  vec4 f = texture(uIntegrated, vec3(screenUV, sliceCoord(viewZ)));
//               color = color * f.a + f.rgb;`}</CodeBlock>
      <Equation label={tx(t, "oglVol_godLabel", "Screen-space god rays (the cheap version)")}
        where={[
          [r`\mathbf s`, tx(t, "oglVol_wS", "the sun's position on screen")],
          [r`M(\cdot)`, tx(t, "oglVol_wM", "an occlusion mask: bright where the sky is visible, black where geometry blocks it")],
          [r`\delta,\ w,\ N`, tx(t, "oglVol_wDecay", "decay per sample, weight, number of samples")],
        ]}
        note={tx(t, "oglVol_godNote", "A radial blur of the mask toward the sun, from Kenny Mitchell in GPU Gems 3. One pass, convincing, but it only works while the sun is on screen and the rays only ever point at it. The third preset above implements it.")}>
        {r`R(\mathbf u) = \sum_{i=1}^{N} w\,\delta^{\,i}\; M\!\left(\mathbf u - \frac{i}{N}\,\rho\,(\mathbf u - \mathbf s)\right)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "oglVol_thTech", "Technique"), tx(t, "oglVol_thWhat", "What it gives"), tx(t, "oglVol_thCost", "Cost")]}
        rows={[
          [tx(t, "oglVol_v1", "Analytic height fog"), tx(t, "oglVol_v1w", "distance haze, ground fog (see GLSL · Fog)"), tx(t, "oglVol_v1c", "a few ALU per pixel")],
          [tx(t, "oglVol_v2", "Screen-space god rays"), tx(t, "oglVol_v2w", "shafts toward an on-screen sun"), tx(t, "oglVol_v2c", "one post pass")],
          [tx(t, "oglVol_v3", "Per-pixel ray march + shadow map"), tx(t, "oglVol_v3w", "true shafts from any light, with shadows"), tx(t, "oglVol_v3c", "expensive; half resolution + temporal filtering")],
          [tx(t, "oglVol_v4", "Froxel volumetric fog"), tx(t, "oglVol_v4w", "all lights, shadows, local volumes; applies to transparents"), tx(t, "oglVol_v4c", "two compute passes on a small 3D grid")],
          [tx(t, "oglVol_v5", "Raymarched clouds"), tx(t, "oglVol_v5w", "3D noise density, lit with Beer + powder + HG"), tx(t, "oglVol_v5c", "the costliest; amortised over frames (Horizon Zero Dawn)")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglVol_pitfalls",
          "Ray marching with fixed step positions produces visible banding; jitter the start per pixel (blue noise works best) and let TAA average it. Scale the step count by distance, not a constant. Keep all of this in linear HDR before tone mapping. Energy must be conserved: a phase function that doesn't integrate to 1, or in-scattering not multiplied by the transmittance, makes fog glow brighter than the light that feeds it.")}
      </Callout>

      <KeyIdeas t={t} id="oglVol" items={[
        "Media absorb and scatter: σ_t = σ_a + σ_s; transmittance T = exp(−∫σ_t).",
        "Single scattering: integrate T · σ_s · phase · sun visibility · sunlight along the view ray.",
        "Rayleigh (∝ 1/λ⁴, symmetric) makes the blue sky and red sunsets; Mie/HG (forward) makes haze and glowing shafts.",
        "Engines precompute sky LUTs and store volumetric fog in a froxel grid integrated by compute.",
        "Screen-space god rays are a cheap radial blur of an occlusion mask toward the sun.",
      ]} />
    </Article>
  );
}
