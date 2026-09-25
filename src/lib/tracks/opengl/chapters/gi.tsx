"use client";

// "Global Illumination" (Advanced Lighting): light that bounces. Lightmaps,
// light probes stored as spherical harmonics, and the dynamic techniques
// modern engines use.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { ShProbeFigure } from "@/components/lesson/figures/advlighting/ShProbeFigure";

const r = String.raw;

export function GiContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglGi_intro",
          "Every lighting chapter so far computed direct light: from a lamp to a surface to the eye. In reality light keeps bouncing. Sun through a window lights the floor, the floor lights the ceiling, and a red carpet tints the walls pink. That indirect light is often half of everything you see, and without it interiors look black wherever the lamps do not reach. Global illumination (GI) is the name for computing it. Doing it exactly is the path tracing of the GLSL track. This chapter covers how real-time engines approximate it: bake what does not move, store light at sample points in space, and update cheaply what does move.")}
      </Lead>

      <H2>{tx(t, "oglGi_whyTitle", "Why ambient is not enough")}</H2>
      <p>
        {tx(t, "oglGi_whyBody",
          "The Phong chapters faked indirect light with a constant ambient term: the same dim colour everywhere, from every direction. Real indirect light varies in both. A corner receives less than an open wall (ambient occlusion, see SSAO). A white floor under a blue sky is lit bluish from above and warm from a sunlit wall beside it. GI techniques replace that one constant with light that depends on position and on the direction the surface faces. They differ in where that information is stored and how often it is refreshed.")}
      </p>

      <H2>{tx(t, "oglGi_lmTitle", "Lightmaps: bake it once")}</H2>
      <p>
        {tx(t, "oglGi_lmBody",
          "If the lights and the level do not move, their bounced light does not change either. A lightmapper (offline, or in the editor) path traces the scene once and stores the result in a texture that covers every static surface. The shader then only has to look it up. It needs a second UV set in which every triangle has its own non-overlapping space in the texture (a lightmap unwrap), and a texel density chosen so that detail such as contact shadows survives. Lightmaps give the best quality per cost and still power most games' static lighting. But they know nothing about objects that move, and they are wrong as soon as a light changes.")}
      </p>
      <CodeBlock lang="glsl" filename="lightmap.frag" t={t}>{`in vec2 vUV;          // material UVs (tile, repeat)
in vec2 vLightmapUV;  // unique per-surface UVs, from the lightmap unwrap
uniform sampler2D uAlbedo, uLightmap;
void main() {
    vec3 indirect = texture(uLightmap, vLightmapUV).rgb;   // baked irradiance (HDR)
    vec3 albedo   = texture(uAlbedo, vUV).rgb;
    FragColor = vec4(albedo * indirect / 3.14159265 + directLight(), 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "oglGi_probeTitle", "Light probes and spherical harmonics")}</H2>
      <p>
        {tx(t, "oglGi_probeBody",
          "For moving objects, engines bake light at points in space instead of on surfaces. A light probe records the light arriving at one point from every direction, like the sky around the IBL chapter's spheres but captured inside the level. A character between probes blends the nearest ones. A full cube map per probe would be far too much memory for thousands of probes. But a matte surface only needs irradiance, the cosine-weighted average of incoming light, and irradiance is so smooth over directions that it can be stored in a few numbers. The standard format is spherical harmonics.")}
      </p>
      <Equation label={tx(t, "oglGi_shLabel", "Spherical harmonics: a Fourier series on the sphere")}
        where={[
          [r`Y_{lm}(\boldsymbol\omega)`, tx(t, "oglGi_wY", "the basis functions: fixed patterns over directions, like the sines and cosines of a Fourier series. Band l has 2l + 1 of them: 1 constant, 3 linear (x, y, z), 5 quadratic. They are orthonormal: the integral of any two different ones multiplied together is 0, and of one squared is 1")],
          [r`L_{lm}`, tx(t, "oglGi_wLlm", "the coefficients: how much of each pattern the sky contains. Projection is just the integral of the radiance times the basis function, which is the same Monte Carlo sum as before, over the pixels of a cube map or panorama, each weighted by its solid angle")],
          [r`L(\boldsymbol\omega) \approx \sum_{l \le 2}\sum_{m} L_{lm} Y_{lm}(\boldsymbol\omega)`, tx(t, "oglGi_wRecon", "reconstruction: adding the patterns back, weighted by their coefficients. Bands 0–2 give 9 coefficients per colour channel, 27 numbers per probe")],
        ]}
        note={tx(t, "oglGi_shNote", "In the figure, the basis functions are shown on spheres: band 0 is a constant, band 1 is brighter on one side and darker on the other along one axis, and band 2 has four lobes. Their formulas are small polynomials in the direction's x, y, z (e.g. Y₁₀ = 0.4886·z), so evaluating them in a shader is a handful of multiply-adds.")}>
        {r`L_{lm} = \int_{S^2} L(\boldsymbol\omega)\,Y_{lm}(\boldsymbol\omega)\,d\omega \;\approx\; \sum_{\text{pixels } k} L(\boldsymbol\omega_k)\,Y_{lm}(\boldsymbol\omega_k)\,\Delta\omega_k`}
      </Equation>
      <Equation label={tx(t, "oglGi_irrLabel", "Irradiance straight from the coefficients (Ramamoorthi & Hanrahan, 2001)")}
        where={[
          [r`E(\mathbf n)`, tx(t, "oglGi_wE", "irradiance at a surface with normal n: the integral of incoming radiance × max(n·ω, 0). Multiplied by albedo/π it is the diffuse colour")],
          [r`\hat A_l`, tx(t, "oglGi_wA", "the SH coefficients of the clamped-cosine lobe itself: π, 2π/3 and π/4 for bands 0, 1, 2, then almost nothing (band 3 is 0, band 4 is −π/24…). Convolving with the cosine therefore just scales each band, and it throws away almost everything above band 2")],
        ]}
        note={tx(t, "oglGi_irrNote", "This is why 9 coefficients are enough. The cosine lobe acts as a blur on the sphere that erases every detail finer than band 2. Ramamoorthi and Hanrahan showed that the error is on average about 1% for real environments. Specular reflections are a different story: they need the sharp detail, which is why the IBL chapter uses a prefiltered cube map for them.")}
        glsl={`vec3 shIrradiance(vec3 n, vec3 L[9]) {
    return 3.141593 * L[0] * 0.282095
         + 2.094395 * (L[1] * 0.488603 * n.y + L[2] * 0.488603 * n.z + L[3] * 0.488603 * n.x)
         + 0.785398 * (L[4] * 1.092548 * n.x * n.y + L[5] * 1.092548 * n.y * n.z
                     + L[6] * 0.315392 * (3.0 * n.z * n.z - 1.0)
                     + L[7] * 1.092548 * n.x * n.z + L[8] * 0.546274 * (n.x * n.x - n.y * n.y));
}`}>
        {r`E(\mathbf n) = \sum_{l=0}^{2} \hat A_l \sum_{m=-l}^{l} L_{lm}\,Y_{lm}(\mathbf n), \qquad \hat A_0 = \pi,\quad \hat A_1 = \tfrac{2\pi}{3},\quad \hat A_2 = \tfrac{\pi}{4}`}
      </Equation>

      <ShProbeFigure t={t} />

      <p>
        {tx(t, "oglGi_volBody",
          "Probes are placed in a regular 3D grid (an irradiance volume) or scattered by hand and connected into tetrahedra. A shaded point finds its cell and blends the 8 corner probes trilinearly, or the 4 tetrahedron corners barycentrically. The trouble is light leaking. A probe on the sunny side of a thin wall still gets blended into the dark room behind it. Engines fight this by storing per-probe visibility (depth moments, as in DDGI) or by weighting probes by whether they can see the shaded point.")}
      </p>

      <H2>{tx(t, "oglGi_dynTitle", "When things move: dynamic GI")}</H2>
      <LessonTable
        headers={[tx(t, "oglGi_tTech", "Technique"), tx(t, "oglGi_tHow", "How it works"), tx(t, "oglGi_tTrade", "Trade-offs")]}
        rows={[
          [tx(t, "oglGi_g1", "Screen-space GI (SSGI)"), tx(t, "oglGi_g1h", "like SSAO, but trace short rays in the depth buffer and gather the colour of what they hit"), tx(t, "oglGi_g1t", "cheap, fully dynamic; knows nothing off-screen or behind objects")],
          [tx(t, "oglGi_g2", "Reflective shadow maps / LPV"), tx(t, "oglGi_g2h", "treat every shadow-map texel as a tiny bounce light; light propagation volumes spread them through a grid of SH"), tx(t, "oglGi_g2t", "one bounce, blurry, leaks; historically important (CryEngine 3)")],
          [tx(t, "oglGi_g3", "Voxel cone tracing (VXGI)"), tx(t, "oglGi_g3h", "voxelise the scene into a 3D texture with mipmaps; trace a few wide cones that read coarser mips as they widen"), tx(t, "oglGi_g3t", "diffuse and glossy GI in real time; voxelisation is costly and blurs thin geometry")],
          [tx(t, "oglGi_g4", "DDGI (probes + ray tracing)"), tx(t, "oglGi_g4h", "a probe grid where each probe traces a few hundred rays per frame and blends the results into small octahedral irradiance and depth textures"), tx(t, "oglGi_g4t", "stable, handles moving lights; needs ray tracing; resolution limited by probe spacing")],
          [tx(t, "oglGi_g5", "Lumen (Unreal 5)"), tx(t, "oglGi_g5h", "a surface cache of lit cards on the meshes, traced with signed distance fields or hardware RT, filtered by screen probes"), tx(t, "oglGi_g5t", "high quality, fully dynamic; complex, several ms per frame")],
          [tx(t, "oglGi_g6", "Path tracing + denoiser"), tx(t, "oglGi_g6h", "one or two paths per pixel, ReSTIR for sampling, a denoiser for the rest (see the GLSL Ray & Path Tracing chapters)"), tx(t, "oglGi_g6t", "reference quality; only on the fastest GPUs")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglGi_mix", "Shipping games mix these. They use baked lightmaps and probes for the static world, SSAO or SSGI for small-scale contact, reflection probes for specular, and one dynamic technique for whatever must react to a light switch or a day–night cycle. The recurring idea is to store irradiance at the resolution it needs: dense where it changes quickly (on surfaces), coarse where it is smooth (in the air between them).")}
      </Callout>

      <KeyIdeas t={t} id="oglGi" items={[
        "Indirect light depends on position and direction; a constant ambient ignores both.",
        "Lightmaps bake static surfaces offline into a second, unique UV set.",
        "Light probes store irradiance at points in space; spherical harmonics fit it into 9 coefficients per channel.",
        "Irradiance from SH: scale bands 0, 1, 2 by π, 2π/3, π/4 and sum the basis functions; about 1% error.",
        "Dynamic GI: SSGI, voxel cone tracing, DDGI probes, Lumen, path tracing — traded against cost and leaking.",
      ]} />
    </Article>
  );
}
