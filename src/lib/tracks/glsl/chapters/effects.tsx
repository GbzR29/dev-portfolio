"use client";

// The "Effect Recipes" section: Texturing → Waves & Water → Glass & Fresnel → Fog → Toon, Dissolve & Hologram.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { GerstnerFigure } from "@/components/lesson/glsl/GerstnerFigure";
import { FresnelFigure } from "@/components/lesson/glsl/FresnelFigure";
import { FogCurveFigure } from "@/components/lesson/glsl/FogCurveFigure";
import { TEXTURE_PRESETS, WATER_PRESETS, GLASS_PRESETS, FOG_PRESETS, STYLE_PRESETS } from "../presets/effects";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Texturing
// ═════════════════════════════════════════════════════════════════════════════

export function TexturingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslTex_intro",
          "texture(sampler, uv) looks like an array read, but it is one of the most sophisticated operations a GPU does. It picks a mip level from how fast uv changes across neighbouring pixels, blends four texels (or eight, or sixteen with anisotropy), and handles wrapping. Knowing what it does lets you bend it: distort the UV, project textures without UVs, or read exact texels when filtering would get in the way.")}
      </Lead>

      <H2>{tx(t, "glslTex_funcTitle", "The sampling functions")}</H2>
      <LessonTable
        headers={[tx(t, "glslTex_thFn", "Function"), tx(t, "glslTex_thDoes", "What it does")]}
        rows={[
          ["texture(s, uv)", tx(t, "glslTex_f1", "filtered read; mip level from the screen-space derivatives of uv (fragment shader only)")],
          ["textureLod(s, uv, lod)", tx(t, "glslTex_f2", "filtered read at an explicit mip level: works in any stage, and inside loops or branches")],
          ["textureGrad(s, uv, dx, dy)", tx(t, "glslTex_f3", "you supply the derivatives: keeps mips correct after a UV discontinuity (fract, atlases)")],
          ["texelFetch(s, ivec2, lod)", tx(t, "glslTex_f4", "one exact texel by integer coordinate, no filtering, no wrapping: data textures, lookups")],
          ["textureSize(s, lod)", tx(t, "glslTex_f5", "the texture's size in texels at that mip, as an ivec2")],
        ]}
      />
      <Equation label={tx(t, "glslTex_mipLabel", "How texture() picks a mip level")}
        where={[
          [r`\frac{\partial uv}{\partial x}, \frac{\partial uv}{\partial y}`, tx(t, "glslTex_wDeriv", "how much uv changes to the next pixel right and up (dFdx, dFdy)")],
          [r`N`, tx(t, "glslTex_wN", "texture size in texels")],
        ]}
        note={tx(t, "glslTex_mipNote", "The derivatives come from the 2×2 pixel quad the GPU shades together. fract(uv) jumps from 1 to 0 at a seam, so the derivative there is huge and a 1-pixel line of the smallest mip appears. textureGrad with the derivatives of the unwrapped uv fixes it.")}>
        {r`\lambda = \log_2 \max\!\left( \left\lVert N\,\frac{\partial uv}{\partial x} \right\rVert,\ \left\lVert N\,\frac{\partial uv}{\partial y} \right\rVert \right)`}
      </Equation>

      <H2>{tx(t, "glslTex_projTitle", "Distortion and triplanar projection")}</H2>
      <p>
        {tx(t, "glslTex_projBody",
          "Offsetting uv by a small, smoothly varying vector distorts the image. Scrolling noise gives heat haze, and a normal map gives refraction. When a mesh has no usable UVs (terrain, procedural rocks, anything sculpted), project the texture from the three axes in world space and blend by the normal:")}
      </p>
      <Equation label={tx(t, "glslTex_triLabel", "Triplanar mapping")}
        where={[
          [r`\mathbf n`, tx(t, "glslTex_wTN", "the surface normal")],
          [r`k`, tx(t, "glslTex_wK", "blend sharpness: higher = narrower transitions")],
          [r`T(\cdot)`, tx(t, "glslTex_wT", "the texture, sampled with two world coordinates as uv")],
        ]}
        note={tx(t, "glslTex_triNote", "Three texture reads instead of one, but no seams and no stretching on any shape. For normal maps, each projection's tangent frame is different: swizzle the sampled normal per axis (the \"whiteout\" or \"UDN\" blend).")}>
        {r`w = \frac{|\mathbf n|^k}{|n_x|^k + |n_y|^k + |n_z|^k} \qquad c = w_x\,T(p_{zy}) + w_y\,T(p_{xz}) + w_z\,T(p_{xy})`}
      </Equation>
      <ShaderPlayground presets={TEXTURE_PRESETS} t={t} id="glslTex" />
      <Callout type="warn" t={t}>
        {tx(t, "glslTex_warn",
          "Colour textures are stored in sRGB and must be linearised before lighting (or uploaded as GL_SRGB8_ALPHA8 so the hardware does it). Normal, roughness, metallic, AO and height maps are data, already linear, and must not be converted. Mixing the two up is the most common reason a material looks washed out or too dark.")}
      </Callout>
      <KeyIdeas t={t} id="glslTex" items={[
        "texture() filters and picks mips from uv derivatives; textureLod/Grad give you control; texelFetch reads exact texels.",
        "Distort by offsetting uv with smooth noise; scroll two layers in different directions.",
        "Triplanar mapping projects along X, Y, Z and blends by |n|^k: seamless without UVs.",
        "Linearise colour textures; leave data textures (normal, roughness…) alone.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Waves & water
// ═════════════════════════════════════════════════════════════════════════════

export function WaterContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslWater_intro",
          "Water is three problems: the shape of the surface (waves), how light leaves it (reflection vs refraction, decided by Fresnel), and small-scale detail (ripples, normal maps, foam). This chapter builds each part from its formula, from raindrops on a pool to an open ocean displaced in the vertex shader.")}
      </Lead>

      <H2>{tx(t, "glslWater_sineTitle", "Sums of sines, and their normals")}</H2>
      <Equation label={tx(t, "glslWater_sineLabel", "A travelling sine wave and its slope")}
        where={[
          [r`A,\ \lambda`, tx(t, "glslWater_wAl", "amplitude and wavelength; k = 2π/λ")],
          [r`\mathbf D`, tx(t, "glslWater_wD", "unit direction of travel on the plane")],
          [r`\omega`, tx(t, "glslWater_wW", "angular speed; for deep water ω = √(g·k), so long waves travel faster")],
        ]}
        note={tx(t, "glslWater_sineNote", "Normals come from the analytic derivative, not from neighbouring vertices: exact, cheap, and independent of the mesh resolution. With several waves, sum the heights and sum the slopes.")}>
        {r`h(\mathbf x, t) = A \sin(k\,\mathbf D\cdot\mathbf x - \omega t) \qquad \nabla h = A\,k\,\mathbf D \cos(k\,\mathbf D\cdot\mathbf x - \omega t) \qquad \mathbf n = \operatorname{normalize}(-h_x,\ 1,\ -h_z)`}
      </Equation>

      <H2>{tx(t, "glslWater_gerstTitle", "Gerstner waves")}</H2>
      <p>
        {tx(t, "glslWater_gerstBody",
          "Real water particles move in circles, not up and down. Gerstner (trochoidal) waves displace each point horizontally too, toward the crest, which sharpens crests and flattens troughs. It is the model behind almost every real-time ocean, introduced to games by Tessendorf and GPU Gems:")}
      </p>
      <Equation label={tx(t, "glslWater_gerstLabel", "Gerstner wave (sum over waves i)")}
        where={[
          [r`Q_i`, tx(t, "glslWater_wQ", "steepness; keep Σ Qᵢ Aᵢ kᵢ ≤ 1 or crests loop over themselves")],
          [r`\theta_i`, tx(t, "glslWater_wTh", "phase: kᵢ Dᵢ·x₀ − ωᵢ t")],
        ]}>
        {r`P(\mathbf x_0, t) = \begin{pmatrix} x_0 + \sum_i Q_i A_i D_{i,x} \cos\theta_i \\ \sum_i A_i \sin\theta_i \\ z_0 + \sum_i Q_i A_i D_{i,z} \cos\theta_i \end{pmatrix}`}
      </Equation>
      <GerstnerFigure t={t} />
      <Equation label={tx(t, "glslWater_tanLabel", "Exact normal from the tangent vectors")}
        note={tx(t, "glslWater_tanNote", "Differentiate P with respect to x₀ and z₀ to get two tangents; their cross product is the normal. The ocean preset below does exactly this in its vertex shader.")}>
        {r`\frac{\partial P}{\partial x} = \Big(1 - \sum Q_i A_i k_i D_{i,x}^2 \sin\theta_i,\ \ \sum A_i k_i D_{i,x}\cos\theta_i,\ \ -\sum Q_i A_i k_i D_{i,x}D_{i,z}\sin\theta_i\Big) \qquad \mathbf n = \frac{\partial P}{\partial z} \times \frac{\partial P}{\partial x}`}
      </Equation>

      <H2>{tx(t, "glslWater_rippleTitle", "Ripples")}</H2>
      <p>
        {tx(t, "glslWater_rippleBody", "A raindrop makes a ring that travels outward and fades. Model it as a wave packet: a sine in the distance behind the front, windowed by a Gaussian so only a few crests exist, and decaying with age. Summed over drops, differentiated for a normal, and used to offset the view of what lies under the surface, it is convincing water in about thirty lines:")}
      </p>
      <Equation label={tx(t, "glslWater_packetLabel", "One ripple")}
        where={[
          [r`r`, tx(t, "glslWater_wR", "distance from the drop")],
          [r`a`, tx(t, "glslWater_wAge", "age of the drop in seconds; c = speed of the ring")],
        ]}>
        {r`x = r - c\,a \qquad h = \sin(k x)\; e^{-\beta x^2}\; e^{-\gamma a}`}
      </Equation>
      <ShaderPlayground presets={WATER_PRESETS} t={t} id="glslWater" />
      <Callout type="tip" t={t}>
        {tx(t, "glslWater_fftTip", "Production oceans (Sea of Thieves, Assassin's Creed IV) sum not four but thousands of waves, whose amplitudes follow a measured ocean spectrum (Phillips, JONSWAP). The sum is evaluated with an FFT in a compute shader every frame (Tessendorf, 2001). The formulas here are the same, just many more waves.")}
      </Callout>
      <KeyIdeas t={t} id="glslWater" items={[
        "Waves are sums of travelling sines; their normals come from the analytic derivative.",
        "Gerstner waves move points in circles: sharp crests, wide troughs; keep ΣQ·A·k ≤ 1.",
        "Deep-water dispersion ω = √(g·k): long waves are faster, so the pattern never repeats.",
        "Ripples are decaying wave packets; the normal offsets the refracted view and adds highlights.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Glass & Fresnel
// ═════════════════════════════════════════════════════════════════════════════

export function GlassContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslGlass_intro",
          "Every transparent material follows two rules. Snell's law says where light goes when it crosses into another medium. The Fresnel equations say how much of it reflects instead. GLSL has both built in: refract() and, with one line of Schlick, the Fresnel term. Together they make glass, water, gems and soap bubbles.")}
      </Lead>

      <H2>{tx(t, "glslGlass_snellTitle", "Refraction")}</H2>
      <Equation label={tx(t, "glslGlass_snellLabel", "Snell's law, and what refract() computes")}
        where={[
          [r`\eta = n_1 / n_2`, tx(t, "glslGlass_wEta", "ratio of refractive indices; air 1.0, water 1.33, glass 1.5, diamond 2.42")],
          [r`\mathbf I,\ \mathbf N`, tx(t, "glslGlass_wIN", "unit incident direction and unit normal facing against it")],
        ]}
        note={tx(t, "glslGlass_snellNote", "When k < 0 there is no refracted ray (total internal reflection) and refract() returns vec3(0). Check for it. Entering glass from air use η = 1/1.5; leaving it use η = 1.5 with the normal flipped to face the ray.")}
        glsl="vec3 T = refract(I, N, eta);   // vec3(0.0) on total internal reflection">
        {r`n_1 \sin\theta_1 = n_2 \sin\theta_2 \qquad k = 1 - \eta^2\big(1 - (\mathbf N\cdot\mathbf I)^2\big) \qquad \mathbf T = \eta\,\mathbf I - \big(\eta\,(\mathbf N\cdot\mathbf I) + \sqrt{k}\big)\mathbf N`}
      </Equation>

      <H2>{tx(t, "glslGlass_fresTitle", "Fresnel: how much reflects")}</H2>
      <Equation label={tx(t, "glslGlass_schlickLabel", "Schlick's approximation")}
        where={[
          [r`R_0`, tx(t, "glslGlass_wR0", "reflectance at normal incidence: 2% water, 4% glass, 17% diamond; 50–100% metals (coloured)")],
          [r`\cos\theta`, tx(t, "glslGlass_wCos", "N·V, the angle between the view and the normal")],
        ]}
        note={tx(t, "glslGlass_schlickNote", "The exact equations average two polarisations with square roots and divisions. Schlick's fifth power matches them within a few percent for dielectrics and costs a couple of multiplies. The PBR chapters of the OpenGL track use the same term, F in Cook-Torrance.")}>
        {r`R_0 = \left(\frac{n_1 - n_2}{n_1 + n_2}\right)^2 \qquad F(\theta) \approx R_0 + (1 - R_0)(1 - \cos\theta)^5 \qquad c = \operatorname{mix}(\text{refracted},\ \text{reflected},\ F)`}
      </Equation>
      <FresnelFigure t={t} />

      <H2>{tx(t, "glslGlass_dispTitle", "Dispersion and absorption")}</H2>
      <p>
        {tx(t, "glslGlass_dispBody",
          "The index of refraction depends on wavelength: blue bends more than red, which is how a prism makes a rainbow. The cheap version refracts three times, with a slightly different η for R, G and B. Thick glass also absorbs: light loses a fraction per unit distance travelled inside (Beer–Lambert), tinting the edges of a glass object and deep water:")}
      </p>
      <Equation label={tx(t, "glslGlass_beerLabel", "Beer–Lambert absorption")}
        where={[[r`\sigma_a`, tx(t, "glslGlass_wSigma", "absorption per colour channel. Water absorbs red far more than blue (large σ for red), which is why deep water looks blue-green")], [r`d`, tx(t, "glslGlass_wDist", "distance travelled inside the medium")]]}>
        {r`T = e^{-\sigma_a\,d}`}
      </Equation>
      <ShaderPlayground presets={GLASS_PRESETS} t={t} id="glslGlass" />
      <Callout type="info" t={t}>
        {tx(t, "glslGlass_rtNote", "In a rasteriser you cannot trace the refracted ray through the scene. Real-time glass samples a cube map, the screen behind the object (screen-space refraction, offsetting the UV by the normal), or a blurred copy of the scene for frosted glass. The ball here is ray-traced analytically because it is a sphere.")}
      </Callout>
      <KeyIdeas t={t} id="glslGlass" items={[
        "refract(I, N, η) implements Snell's law; it returns vec3(0) on total internal reflection.",
        "Fresnel: F ≈ R₀ + (1 − R₀)(1 − cosθ)⁵; mix refraction and reflection with it.",
        "R₀ = ((n₁ − n₂)/(n₁ + n₂))²: 4% for glass, 2% for water.",
        "Dispersion: a different η per channel. Absorption: e^(−σ·d).",
      ]} />
    </Article>
  );
}

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
      <Callout type="tip" t={t}>
        {tx(t, "glslFog_tip", "Apply fog to the sky as well, using the same fog colour at the horizon, or distant objects will stand out as flat cut-outs against a blue sky. Fog uses the distance from the camera, not the depth-buffer z: with z, fog changes as you turn your head, because z is measured along the view axis.")}
      </Callout>
      <KeyIdeas t={t} id="glslFog" items={[
        "Fog = exp(−∫ρ ds): extinction plus in-scattering along the ray.",
        "Linear is an art tool, exp is physical, exp² keeps the foreground clear.",
        "Height fog integrates a⋅e^(−b⋅y) analytically along the ray.",
        "Tint the fog toward the sun for cheap scattering; fog the sky too.",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Toon, dissolve, hologram
// ═════════════════════════════════════════════════════════════════════════════

export function StylizedContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslSty_intro",
          "Stylised shaders break physical rules on purpose, and each one is built from the same few quantities as realistic lighting: N·L, N·V, N·H, a noise value and a threshold. Quantise them, compare them, or add them up in unusual ways, and you get cartoons, disintegration and sci-fi projections.")}
      </Lead>

      <H2>{tx(t, "glslSty_toonTitle", "Toon shading")}</H2>
      <Equation label={tx(t, "glslSty_toonLabel", "Quantised lighting")}
        where={[
          [r`n`, tx(t, "glslSty_wN", "number of light bands")],
          [r`\epsilon`, tx(t, "glslSty_wEps", "the fwidth of the quantity: one pixel of smoothing, so bands never alias")],
        ]}
        note={tx(t, "glslSty_toonNote", "Games often replace the floor() with a 1D \"ramp\" texture indexed by N·L, so artists can paint the bands and their colours. Outlines are drawn separately: an inverted hull (the back faces, pushed out along the normals, as in the Stencil chapter), or edge detection on depth and normals in post.")}>
        {r`\text{toon} = \frac{\lfloor n\,(\vN\cdot\vL) \rfloor}{n} \qquad \text{spec} = \operatorname{smoothstep}(1 - s - \epsilon,\ 1 - s,\ \vN\cdot\vH) \qquad \text{rim} = (1 - \vN\cdot\vV)^p`}
      </Equation>

      <H2>{tx(t, "glslSty_dissTitle", "Dissolve")}</H2>
      <p>
        {tx(t, "glslSty_dissBody",
          "Give every point of the surface a random but smooth value, from noise in object or world space, and discard fragments whose value is below a threshold. Animating the threshold from 0 to 1 eats the object away. A band just above the threshold is the burning edge:")}
      </p>
      <Equation label={tx(t, "glslSty_dissLabel", "Threshold and edge")}
        where={[[r`n(p)`, tx(t, "glslSty_wNoise", "noise at the surface point")], [r`\tau`, tx(t, "glslSty_wTau", "threshold (the animated amount)")], [r`w`, tx(t, "glslSty_wW", "edge width")]]}>
        {r`\text{discard if } n(p) < \tau \qquad \text{edge} = 1 - \operatorname{smoothstep}\big(0,\ w,\ n(p) - \tau\big)`}
      </Equation>

      <H2>{tx(t, "glslSty_holoTitle", "Hologram")}</H2>
      <p>
        {tx(t, "glslSty_holoBody",
          "A hologram is light without a surface. It is drawn with additive blending and depth writes off, so front and back faces add up like glowing gas. The Fresnel term brightens silhouettes, and scanlines are a sine of the world-space height. A band scrolls up, and a random flicker sells the effect.")}
      </p>
      <ShaderPlayground presets={STYLE_PRESETS} t={t} id="glslSty" />
      <LessonTable
        headers={[tx(t, "glslSty_thEffect", "Effect"), tx(t, "glslSty_thIngredients", "Ingredients"), tx(t, "glslSty_thState", "Render state")]}
        rows={[
          [tx(t, "glslSty_e1", "Toon"), "floor(N·L·n), step(N·H), (1 − N·V)ᵖ", tx(t, "glslSty_e1s", "opaque; outline pass or post edge detection")],
          [tx(t, "glslSty_e2", "Dissolve"), "noise(p) < τ → discard, edge band", tx(t, "glslSty_e2s", "opaque, culling off to see inside; discard disables early-Z")],
          [tx(t, "glslSty_e3", "Hologram"), "Fresnel + sin(y·k − t) + flicker", tx(t, "glslSty_e3s", "additive (ONE, ONE), depth write off, culling off")],
          [tx(t, "glslSty_e4", "Force field"), tx(t, "glslSty_e4i", "Fresnel + intersection glow (scene depth − fragment depth)"), tx(t, "glslSty_e4s", "additive, needs the depth texture")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "glslSty_warn", "discard switches off early depth testing for that shader, because the GPU cannot know before shading whether the fragment survives. Use it only on the objects that need it, and draw them after the opaque geometry. For dissolve transitions on whole screens, alpha-to-coverage or dithering keep the depth pre-pass working.")}
      </Callout>
      <KeyIdeas t={t} id="glslSty" items={[
        "Toon: quantise N·L into bands, threshold N·H for a hard highlight, (1 − N·V) for rim and outline.",
        "Dissolve: discard where noise < threshold; a thin band above it glows.",
        "Hologram: additive blending, no depth writes, Fresnel + scanlines + flicker.",
        "discard disables early-Z: use it sparingly.",
      ]} />
    </Article>
  );
}
