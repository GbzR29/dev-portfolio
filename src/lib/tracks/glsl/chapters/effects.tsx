"use client";

// The "Effect Recipes" section: Texturing → Waves & Water → Glass & Fresnel → Fog → Toon, Dissolve & Hologram.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { GerstnerFigure } from "@/components/lesson/glsl/GerstnerFigure";
import { WaterLabFigure } from "@/components/lesson/figures/water/WaterLabFigure";
import { ShoreLabFigure } from "@/components/lesson/figures/water/ShoreLabFigure";
import { FogLabFigure } from "@/components/lesson/figures/fog/FogLabFigure";
import { WindowLabFigure } from "@/components/lesson/figures/glass/WindowLabFigure";
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
      <H2>{tx(t, "glslWater_labTitle", "A complete water shader")}</H2>
      <p>
        {tx(t, "glslWater_labBody",
          "The presets above show the pieces separately. The lab below puts them all into a single full-screen fragment shader. It traces the Gerstner surface, reflects the procedural sky from the Cubemaps chapter, and refracts down to a sea bed that rises into a beach. Along the way it adds absorption, crest glow, glints, foam and caustics. Each term has its own section below. Use the view buttons to see the quantity behind each one.")}
      </p>

      <WaterLabFigure t={t} />

      <H3>{tx(t, "glslWater_traceTitle", "Finding the surface")}</H3>
      <p>
        {tx(t, "glslWater_traceBody",
          "A fragment shader cannot rasterise a mesh, so each pixel sends a ray from the camera and looks for the point where the ray drops below the waves. The waves stay between −H and +H, where H is the sum of the amplitudes, so the search only covers the part of the ray inside that slab. It steps along until the ray's height goes below the surface height, then halves the last interval a few times (bisection) to pin down the crossing. One problem remains. A Gerstner wave moves points sideways, so the surface above a given x comes from a particle that started somewhere else, at x₀. Finding x₀ means solving an equation:")}
      </p>
      <Equation label={tx(t, "glslWater_invLabel", "Which particle ends up above x?")}
        where={[
          [r`\mathbf D(\mathbf x_0)`, tx(t, "glslWater_wDisp", "the horizontal Gerstner displacement Σ Qᵢ Aᵢ Dᵢ cos θᵢ of the particle that rests at x₀")],
          [r`\mathbf x_0^{(j+1)}`, tx(t, "glslWater_wIter", "fixed-point iteration: guess x₀ = x, see where it lands, move the guess back by the displacement. Three rounds are enough while the waves are not folding")],
        ]}
        glsl={`vec2 x0 = x;\nfor (int j = 0; j < 3; j++) x0 = x - displaceXZ(x0);\nfloat h = heightAtRest(x0);`}>
        {r`\mathbf x_0 + \mathbf D(\mathbf x_0) = \mathbf x \qquad\Longrightarrow\qquad \mathbf x_0^{(j+1)} = \mathbf x - \mathbf D\big(\mathbf x_0^{(j)}\big)`}
      </Equation>

      <H3>{tx(t, "glslWater_fresTitle", "Reflect or refract: Fresnel")}</H3>
      <Equation label={tx(t, "glslWater_fresLabel", "Schlick's approximation, for water")}
        where={[
          [r`F_0`, tx(t, "glslWater_wF0", "reflectance looking straight down: ((n₁ − n₂)/(n₁ + n₂))² = (0.333/2.333)² ≈ 0.02 for air (1.0) to water (1.333)")],
          [r`\mathbf N\cdot\mathbf V`, tx(t, "glslWater_wNV", "cosine between the normal and the direction to the eye: 1 looking straight down, 0 at grazing angles")],
        ]}
        note={tx(t, "glslWater_fresNote", "Only 2% of the light reflects when you look straight down, which is why you can see the bottom at your feet. Toward the horizon F tends to 1, and the sea turns into a mirror of the sky. The shader blends colour = mix(refracted, reflected, F), and the Glass & Fresnel chapter derives the curve.")}>
        {r`F = F_0 + (1 - F_0)\,(1 - \mathbf N\cdot\mathbf V)^5`}
      </Equation>

      <H3>{tx(t, "glslWater_colTitle", "The colour of water: absorption and scattering")}</H3>
      <p>
        {tx(t, "glslWater_colBody",
          "Water is not blue the way paint is blue. It absorbs red light about thirty times faster than blue, so the colour depends on how far the light travels through it. The refracted ray is followed down to the bed. The distance s it covers inside the water sets how much of the bed survives, and the light the water scatters back fills in the rest:")}
      </p>
      <Equation label={tx(t, "glslWater_beerLabel", "Beer–Lambert, per colour channel")}
        where={[
          [r`\boldsymbol\sigma_a`, tx(t, "glslWater_wSig", "absorption per metre for R, G, B. For clear sea water roughly (0.45, 0.075, 0.05): after 2 m only e^(−0.9) ≈ 40% of the red is left, but 90% of the blue")],
          [r`s`, tx(t, "glslWater_wS", "length of the refracted ray inside the water (the thickness view)")],
          [r`\mathbf c_s`, tx(t, "glslWater_wCs", "the colour the water body scatters back, lit by the ambient light. The absorbed fraction 1 − T is replaced by it")],
        ]}
        note={tx(t, "glslWater_beerNote", "Tropical water looks turquoise because white sand sits under only a few metres of it. Blue and green survive the trip down and back, and red does not. Over deep water no bed light comes back at all (T → 0), and only the dark scattered colour remains.")}>
        {r`\mathbf T = e^{-\boldsymbol\sigma_a s} \qquad \mathbf C_{\text{refr}} = \mathbf C_{\text{bed}} \odot \mathbf T + \mathbf c_s \odot (1 - \mathbf T)`}
      </Equation>

      <H3>{tx(t, "glslWater_sssTitle", "Glowing crests")}</H3>
      <p>
        {tx(t, "glslWater_sssBody",
          "Looking toward a low sun, the thin top of a wave glows green-blue, because sunlight passes through it and scatters toward you. A proper answer would integrate light through the volume. The usual real-time version multiplies three things that each switch the glow off where it cannot happen: the water's scattered colour, how directly you look toward the sun, and how high the point sits on the wave, since crests are the thinnest part.")}
      </p>
      <Equation label={tx(t, "glslWater_sssLabel", "Crest translucency (an art-directed approximation)")}
        where={[
          [r`\big(\tfrac{1 + \mathbf d\cdot\mathbf s}{2}\big)^6`, tx(t, "glslWater_wLook", "1 when the view ray d points at the sun s, falling quickly as you look away")],
          [r`c^2`, tx(t, "glslWater_wCrest", "the point's height mapped to 0 (trough) … 1 (crest), squared so that only the tops glow")],
        ]}>
        {r`\mathbf C_{\text{sss}} = k\;\mathbf c_s \odot \mathbf L_{\text{sun}}\;\Big(\frac{1 + \mathbf d\cdot\mathbf s}{2}\Big)^{6}\,c^2`}
      </Equation>

      <H3>{tx(t, "glslWater_foamTitle", "Foam from the Jacobian")}</H3>
      <p>
        {tx(t, "glslWater_foamBody",
          "Waves break where the surface folds. A Gerstner wave moves each particle from its rest position x₀ to x₀ + D(x₀). The Jacobian determinant of that map measures what happens to a tiny square of calm water. J > 1 means it was stretched (troughs), 0 < J < 1 means it was squeezed (crests), and J < 0 means it was turned inside out, so the surface has folded over itself. It is the most useful single number for placing foam, and the red regions in the J view are exactly the breaking crests:")}
      </p>
      <Equation label={tx(t, "glslWater_jacLabel", "Jacobian of the horizontal Gerstner map")}
        where={[
          [r`J_{xx},\ J_{zz},\ J_{xz}`, tx(t, "glslWater_wJ", "the partial derivatives of the displaced position: ∂x/∂x₀, ∂z/∂z₀ and ∂x/∂z₀, each a sum over the waves, and all of them already needed for the normal")],
          [r`Q_i A_i k_i`, tx(t, "glslWater_wQAk", "each wave's steepness. Their sum is the choppiness slider. When several steep waves line up, J dips below 0")],
          [r`e`, tx(t, "glslWater_wEdge", "the foam threshold: foam = smoothstep(e, e − 0.5, J). Raising e lets foam spread down from the crests")],
        ]}
        note={tx(t, "glslWater_foamNote", "Shore foam uses the water's thickness above the bed, w = h − y_bed: foam where w is small, drawn as lines that move toward the shore (sin(18w − 1.6t)). Both kinds are broken up by noise. In production oceans, J is accumulated over several frames so foam lingers and fades, which needs a render target. This lab keeps it to one pass.")}
        glsl={`float J = Jxx * Jzz - Jxz * Jxz;\nfloat foam = smoothstep(e, e - 0.5, J) * breakupNoise;`}>
        {r`J = J_{xx}J_{zz} - J_{xz}^2, \qquad J_{xx} = 1 - \sum_i Q_i A_i k_i D_{i,x}^2 \sin\theta_i,\quad J_{zz} = 1 - \sum_i Q_i A_i k_i D_{i,z}^2 \sin\theta_i,\quad J_{xz} = -\sum_i Q_i A_i k_i D_{i,x} D_{i,z} \sin\theta_i`}
      </Equation>

      <H3>{tx(t, "glslWater_causTitle", "Caustics: the same idea, applied to light")}</H3>
      <p>
        {tx(t, "glslWater_causBody",
          "The bright web on the bottom of a pool is sunlight focused by the waves. It follows from the same reasoning as the foam: a map, and how much it squeezes area. Sunlight falling straight down on a surface with slope ∇h bends toward the normal as it enters the water. At depth d below the surface it has moved sideways by a small, known amount, so each surface point x lands on the bed at:")}
      </p>
      <Equation label={tx(t, "glslWater_causLabel", "Where sunlight lands, and how concentrated it is")}
        where={[
          [r`\eta = 1/1.333`, tx(t, "glslWater_wEta", "the refraction ratio. For small angles Snell's law gives a refracted angle η times the incident one, so the ray turns by (1 − η) of the surface tilt")],
          [r`\nabla h,\ \mathbf H`, tx(t, "glslWater_wHess", "the slope and the Hessian (second derivatives) of the wave height. For waves hᵢ = Aᵢ sin θᵢ the Hessian is −Σ Aᵢ kᵢ² sin θᵢ DᵢDᵢᵀ, computed exactly")],
          [r`d`, tx(t, "glslWater_wDepth", "the depth of water above the bed point")],
          [r`I`, tx(t, "glslWater_wI", "irradiance relative to calm water. The same energy spread over a smaller area is brighter by the ratio of areas, which is the Jacobian determinant of the map")],
        ]}
        note={tx(t, "glslWater_causNote", "Under a crest H is negative, so det can reach 0: every ray from a neighbourhood arrives at one line, and the caustic peaks at depth d = 1/((1 − η)·curvature). The shader clamps det at 0.12, because the real sun is a disc rather than a point and that blurs the singularity. It also fades caustics with distance, since beyond a few metres the web is finer than a pixel.")}
        glsl={`mat2 M = mat2(1.0) + d * (1.0 - ETA) * hessian(xz);\nfloat I = 1.0 / max(abs(determinant(M)), 0.12);`}>
        {r`\mathbf x_{\text{bed}} = \mathbf x + d\,(1-\eta)\,\nabla h(\mathbf x) \qquad \frac{\partial \mathbf x_{\text{bed}}}{\partial \mathbf x} = \mathbf I + d\,(1-\eta)\,\mathbf H \qquad I = \frac{1}{\big|\det\!\big(\mathbf I + d\,(1-\eta)\,\mathbf H\big)\big|}`}
      </Equation>

      <H3>{tx(t, "glslWater_glintTitle", "Sun glints")}</H3>
      <p>
        {tx(t, "glslWater_glintBody",
          "The sparkling path under a low sun comes from the ripples that are too small to trace, each one a tiny tilted mirror. They are added to the normal only, as a few extra sine waves, and a sharp microfacet lobe (GGX with roughness α ≈ 0.06) picks the facets that bounce the sun into the eye. With distance the ripples fade out and α grows. That trades individual sparkles for a smooth bright path, the same average light without the flicker of details smaller than a pixel.")}
      </p>
      <Equation label={tx(t, "glslWater_ggxLabel", "The glint lobe")}
        where={[
          [r`\mathbf H = \frac{\mathbf s + \mathbf V}{\lVert \mathbf s + \mathbf V\rVert}`, tx(t, "glslWater_wH", "the half vector: a facet whose normal equals H mirrors the sun s into the eye V")],
          [r`D_{GGX}`, tx(t, "glslWater_wGGX", "α² / (π((N·H)²(α² − 1) + 1)²), the fraction of facets facing H, from the PBR chapters")],
        ]}>
        {r`\mathbf C_{\text{glint}} = \mathbf L_{\text{sun}}\,\frac{D_{GGX}(\mathbf N\cdot\mathbf H,\ \alpha)\,F\,(\mathbf N\cdot\mathbf s)}{4\,\mathbf N\cdot\mathbf V}`}
      </Equation>

      <H3>{tx(t, "glslWater_toonTitle", "Stylised water")}</H3>
      <p>
        {tx(t, "glslWater_toonBody",
          "Stylised water uses the same measurements, drawn with hard edges instead of smooth physics. Try the stylised preset, then compare the three rules below with the realistic terms they replace.")}
      </p>
      <LessonTable
        headers={[tx(t, "glslWater_tTerm", "Realistic term"), tx(t, "glslWater_tToon", "Stylised rule"), tx(t, "glslWater_tWhy", "Why it reads as water")]}
        rows={[
          [tx(t, "glslWater_tAbs", "Absorption over path length s"), "floor((1 − e^(−0.25 s)) · n) / n", tx(t, "glslWater_tAbsW", "n flat colour bands from shallow cyan to deep blue: the depth read at a glance")],
          [tx(t, "glslWater_tFoam", "Shore foam from thickness w"), "step(0.7, fract(3w − 0.4t)) · step(w, 0.9)", tx(t, "glslWater_tFoamW", "hard white lines that travel toward the shore, the classic cartoon coastline")],
          [tx(t, "glslWater_tSpec", "GGX glints"), "step(0.985, N·H)", tx(t, "glslWater_tSpecW", "one cel highlight: either the sun is in this facet or it is not")],
          [tx(t, "glslWater_tFres", "Fresnel blend"), "step(0.55, F) · 0.35", tx(t, "glslWater_tFresW", "a flat, lighter rim toward the horizon instead of a gradient")],
        ]}
      />

      <H2>{tx(t, "glslWater_shoreTitle", "Shallow water, foam and rain")}</H2>
      <p>
        {tx(t, "glslWater_shoreBody",
          "Open ocean is about big waves. Near a coast the interest moves elsewhere: to what is under the water, to foam where water meets sand and stone, and, when it rains, to thousands of small rings. The second lab looks down on a small bay. The water is a flat plane here, and its ripples exist only in the normal. That costs nothing and suits calm shallows, where waves are centimetres high. The sea bed, a sand island, rocks and two old posts form one distance field, traced three times per pixel: once for the view, once for the refracted ray and once for the reflection.")}
      </p>

      <ShoreLabFigure t={t} />

      <H3>{tx(t, "glslWater_depthTitle", "Colour from depth")}</H3>
      <p>
        {tx(t, "glslWater_depthBody",
          "Under a flat water plane at height L, the water thickness at (x, z) is simply h = L − bed(x, z). The refracted ray's length through the water replaces h in Beer–Lambert, so the shallow shelf around the island stays turquoise and the drop-off turns deep blue on its own, with no colour ramp painted by hand. Lower the water level and the same terrain becomes a wider beach. The stylised mode instead cuts 1 − e^(−0.7h) into four flat bands, which is how the lake in the reference screenshot gets its crisp rings of colour.")}
      </p>

      <H3>{tx(t, "glslWater_voroTitle", "Cellular foam: Voronoi noise")}</H3>
      <p>
        {tx(t, "glslWater_voroBody",
          "Shore foam in stylised games is not a smooth white band. It is a lace of cells that breaks apart away from the shore. That pattern comes from cellular (Voronoi, or Worley) noise. Scatter one random feature point in every grid cell. For any position p, F1 is the distance to the nearest feature point. F1 is 0 on a feature point and largest on the borders between two of them, so its level sets are the cell outlines.")}
      </p>
      <Equation label={tx(t, "glslWater_f1Label", "Voronoi F1 and the foam rule")}
        where={[
          [r`\mathbf f_{\mathbf c}`, tx(t, "glslWater_wFc", "the feature point of grid cell c: its corner plus a hashed offset. Here the offset also swings with time, so the lace slowly moves")],
          [r`\mathbf c \in 3\times3`, tx(t, "glslWater_wNb", "the nearest feature point is always in p's own cell or one of its 8 neighbours, so 9 distances are enough. It is the same neighbour rule as the fog chapter's pillars")],
          [r`a`, tx(t, "glslWater_wA", "foam amount, 0 … 1: 1 at the water's edge, falling to 0 once the water is deeper than the foam width")],
          [r`\theta = 1.05 - 1.1a`, tx(t, "glslWater_wTheta", "the threshold. With a = 1 it is below every value of F1, so all is white. As a drops it rises, and only the borders, where F1 is largest, stay white. At a = 0 nothing is left")],
        ]}
        note={tx(t, "glslWater_f1Note", "Offsetting p by the water's slope before the lookup makes the foam ride on the ripples instead of floating above them.")}
        glsl={`float f1 = voronoiF1(p * cells) / 0.75;\nfloat foam = smoothstep(theta - 0.05, theta + 0.05, f1);`}>
        {r`F_1(\mathbf p) = \min_{\mathbf c \in 3\times 3} \lVert \mathbf p - \mathbf f_{\mathbf c} \rVert \qquad \text{foam} = \operatorname{smoothstep}\!\big(\theta - 0.05,\ \theta + 0.05,\ F_1 / 0.75\big)`}
      </Equation>

      <H3>{tx(t, "glslWater_contactTitle", "Contact foam from the distance field")}</H3>
      <p>
        {tx(t, "glslWater_contactBody",
          "Foam collars around rocks and posts, as in the first reference screenshot, need the distance from each water pixel to the nearest object. A rasteriser would have to estimate it from the depth buffer (soft-particle style: foam where the scene depth is close to the water depth). With a distance field it is one function call: objects(p) at the water surface point is exactly that distance. The foam amount is 1 − objects(p)/width, and it goes through the same Voronoi rule as the shore, so both kinds of foam look alike. A thin solid line where the distance reaches 0 hides the exact edge.")}
      </p>

      <H3>{tx(t, "glslWater_rainTitle", "Raindrops on the water")}</H3>
      <p>
        {tx(t, "glslWater_rainBody",
          "A falling drop starts a ring that spreads and fades. Thousands of them must not cost thousands of evaluations per pixel. So the surface is cut into a grid of 0.7 m cells, and each cell holds one drop that falls again and again: each time at a new random point, at its own random moment. A pixel only has to sum the drops of its own cell and its 8 neighbours, because a ring dies before it has grown past one cell.")}
      </p>
      <Equation label={tx(t, "glslWater_ringLabel", "One drop: when, where, and the ring it makes")}
        where={[
          [r`\phi_{\mathbf c}`, tx(t, "glslWater_wPhi", "the cell's hashed phase: drops in different cells never fall together. Cells whose phase is above the rain slider stay dry, which is how lighter rain means fewer drops")],
          [r`\text{cycle},\ a`, tx(t, "glslWater_wCycle", "the integer part counts the drops so far and seeds a new random landing point each time. The fractional part, times the period T, is the current drop's age a in seconds")],
          [r`s = r - c\,a`, tx(t, "glslWater_wFront", "signed distance from the ring's front, where r is the distance to the landing point and c = 0.55 m/s the ring's speed")],
          [r`A,\ k,\ \beta,\ \gamma`, tx(t, "glslWater_wRingK", "height (12 mm), crest frequency (a 14 cm wavelength), ring thickness and fade rate. The Gaussian in s keeps only two or three crests, the exponential in a makes old rings disappear")],
        ]}
        note={tx(t, "glslWater_ringNote", "The shader needs the ring's slope, not its height. Differentiating along r gives dh/dr = A·e^(−βs²)·e^(−γa)·(k cos ks − 2βs sin ks), and the slope vector is that times the unit vector (p − centre)/r. For the first 0.14 s a small bright crown marks the impact: the splash.")}
        glsl={`float tt = uT / PERIOD + phase * 7.0;\nfloat cycle = floor(tt), age = fract(tt) * PERIOD;\nvec2 centre = (cell + 0.15 + 0.7 * hash22(cell + cycle * 13.1)) * CELL;\nfloat s = length(p - centre) - age * 0.55;\nfloat h = A * sin(k * s) * exp(-beta * s * s) * exp(-gamma * age);`}>
        {r`\text{cycle} = \Big\lfloor \tfrac{t}{T} + 7\phi_{\mathbf c} \Big\rfloor,\quad a = T\,\operatorname{fract}\!\Big(\tfrac{t}{T} + 7\phi_{\mathbf c}\Big) \qquad h(r, a) = A\,\sin(k s)\; e^{-\beta s^2}\; e^{-\gamma a}`}
      </Equation>
      <p>
        {tx(t, "glslWater_rainLook",
          "Two more details make rain read at a glance. Under an overcast sky the reflection is almost uniform, so rings barely change the colour. A soft highlight on each ring's crest, the bright sky caught by its slope, brings them back. The falling rain itself is drawn in screen space here: three layers of thin vertical streaks, hashed per column and scrolling at different speeds, which is cheap and convincing in a still view. Rain that has to exist in 3D, fall around a moving camera and splash where it lands is a particle system. The Advanced OpenGL · Particles chapter builds exactly that.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "glslWater_fftTip", "Production oceans (Sea of Thieves, Assassin's Creed IV) sum not four but thousands of waves, whose amplitudes follow a measured ocean spectrum (Phillips, JONSWAP). The sum is evaluated with an FFT in a compute shader every frame (Tessendorf, 2001). The formulas here are the same, just many more waves.")}
      </Callout>
      <KeyIdeas t={t} id="glslWater" items={[
        "Waves are sums of travelling sines; their normals come from the analytic derivative.",
        "Gerstner waves move points in circles: sharp crests, wide troughs; keep ΣQ·A·k ≤ 1.",
        "Deep-water dispersion ω = √(g·k): long waves are faster, so the pattern never repeats.",
        "Ripples are decaying wave packets; the normal offsets the refracted view and adds highlights.",
        "Fresnel decides the mix: 2% reflection looking down, a mirror at the horizon.",
        "Water colour is Beer–Lambert per channel plus scattered light; depth and clarity set the hue.",
        "Foam lives where the Gerstner map folds (Jacobian J < threshold) and where the water gets thin.",
        "Caustics are the same idea for light: brightness = 1 / |det(I + d(1 − η)H)|.",
        "In shallows, colour comes from depth (level − bed); cellular foam comes from Voronoi F1 against a threshold.",
        "A distance field gives contact foam for free: the foam amount is 1 − distance / width.",
        "Rain rings: one recurring drop per grid cell, summed over the 3×3 neighbourhood, differentiated for the normal.",
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
      <H2>{tx(t, "glslGlass_winTitle", "Rain on a window")}</H2>
      <p>
        {tx(t, "glslGlass_winBody",
          "A rainy window brings everything in this chapter together on a flat pane. Each drop is a small lens that bends the street behind it. The condensation around the drops scatters light and blurs the view, and a sliding drop wipes that condensation away and leaves a clear trail. The best-known real-time version is Martijn Steinrucken's (BigWIngs) Shadertoy “Heartfelt”. The lab below rebuilds its technique step by step, and adds frosted glass, dispersion and condensation you can wipe with the pointer.")}
      </p>

      <WindowLabFigure t={t} />

      <H3>{tx(t, "glslGlass_dropHTitle", "Drops as a height field")}</H3>
      <p>
        {tx(t, "glslGlass_dropHBody",
          "A drop is modelled like the water ripples: a scalar c(uv) that is 0 on dry glass and rises toward 1 inside a drop, a rough stand-in for the drop's thickness. Where the glass is tilted by a drop, light bends by an amount proportional to the slope (the small-angle form of Snell's law). So the background is read at an offset equal to the gradient of c, estimated from two extra evaluations one pixel apart:")}
      </p>
      <Equation label={tx(t, "glslGlass_offLabel", "Refraction offset from the drop field")}
        where={[
          [r`\nabla c \approx \tfrac{1}{\varepsilon}\big(c(u{+}\varepsilon,v) - c,\ c(u,v{+}\varepsilon) - c\big)`, tx(t, "glslGlass_wGrad", "finite differences with ε = 0.001, which is why drops() runs three times per pixel")],
          [r`k`, tx(t, "glslGlass_wK", "the refraction slider: how strongly a slope bends the view (it stands for (1 − 1/n) × the distance to the scene)")],
        ]}
        glsl={`vec2 n = vec2(drops(uv + e).x - c, drops(uv + e.yx).x - c);\nvec3 col = textureLod(uScene, UV + n * k, lod).rgb;`}>
        {r`\text{colour}(uv) = \text{scene}\big(uv + k\,\nabla c(uv)\big)`}
      </Equation>

      <H3>{tx(t, "glslGlass_cellsTitle", "Thousands of drops from a grid")}</H3>
      <p>
        {tx(t, "glslGlass_cellsBody",
          "As with the stars and the raindrops on water, no drop is stored. The glass is cut into cells, 6 times taller than wide because drops slide vertically, and every cell hashes its id into three random numbers n = (n.x, n.y, n.z). n.x places the drop horizontally, n.z gives it its own clock and wobble, and each column of cells is shifted by a random amount so that the rows never line up. Three layers are added together: tiny static drops on a 40-cell grid, and two layers of sliding drops, the second at 1.85× the scale so the sizes vary.")}
      </p>
      <Equation label={tx(t, "glslGlass_sawLabel", "Stick, then slide: the sawtooth")}
        where={[
          [r`\operatorname{saw}(b, t)`, tx(t, "glslGlass_wSaw", "rises smoothly while t goes from 0 to b = 0.85, then drops back to 0 in the remaining 15%. A slow climb and a sudden fall")],
          [r`y`, tx(t, "glslGlass_wY", "the drop's height inside its cell. The whole grid scrolls down at a constant speed while the drop climbs inside it almost as fast, so on screen the drop barely creeps. When the sawtooth falls, the drop jumps down its cell. It is the stick-then-slide motion of real drops, held by surface tension until they are heavy enough")],
          [r`x`, tx(t, "glslGlass_wX", "the horizontal position: n.x − ½ plus a wobble sin(y + sin y), whose amplitude shrinks near the cell's sides so the drop never leaves its column")],
        ]}
        glsl={`float saw(float b, float t) { return smoothstep(0.0, b, t) * smoothstep(1.0, b, t); }\nfloat y = (saw(0.85, fract(t + n.z)) - 0.5) * 0.9 + 0.5;`}>
        {r`\operatorname{saw}(b, t) = \operatorname{smoothstep}(0, b, t)\cdot\operatorname{smoothstep}(1, b, t) \qquad y = 0.9\big(\operatorname{saw}(0.85,\ \operatorname{fract}(t + n_z)) - 0.5\big) + 0.5`}
      </Equation>
      <p>
        {tx(t, "glslGlass_trailBody",
          "The trail is a vertical strip above the drop. It is narrow where the drop has just passed and narrower still further up, since r shrinks with height. Along it, a repeating pattern fract(10·v) places small droplets left behind, which is why a real trail looks beaded. The static drops use the same sawtooth with b = 0.025: they appear almost instantly (a raindrop hitting) and evaporate over the rest of their cycle. Finally the layers are summed and passed through smoothstep(0.3, 1, c). That merges neighbouring drops into one smooth surface, the way touching water drops fuse.")}
      </p>

      <H3>{tx(t, "glslGlass_blurTitle", "Blur from the mip chain")}</H3>
      <Equation label={tx(t, "glslGlass_lodLabel", "Choosing how blurry each pixel is")}
        where={[
          [r`\text{lod}`, tx(t, "glslGlass_wLod", "the mip level passed to textureLod. Level L is the image averaged over 2^L × 2^L texels, so blurring by about R pixels means reading level log₂R")],
          [r`f`, tx(t, "glslGlass_wF", "condensation at this pixel: the fog slider × the wipe mask × (1 − trail), because sliding drops clear the glass they cross")],
          [r`c`, tx(t, "glslGlass_wC", "the drop mask: inside a drop the level goes to 0, so the view is sharp. A drop is clear water in the middle of the mist")],
        ]}
        note={tx(t, "glslGlass_lodNote", "Mipmaps give free, variable blur, but box-shaped: a bright light turns into a square. Six extra taps around a circle at the same level round it off into proper bokeh. The wipe mask is a small 192×108 texture that the page updates from the pointer and that fogs back up a little every frame.")}>
        {r`\text{lod} = \operatorname{mix}\!\big(\max(f\cdot\text{blur},\ 5\cdot\text{frost}),\ 0,\ \operatorname{smoothstep}(0.1, 0.2, c)\big)`}
      </Equation>
      <p>
        {tx(t, "glslGlass_frostBody",
          "Frosted glass is a rough surface. Every ray that crosses it is refracted in a slightly random direction, and a pixel averages many such rays, which is a blur whose radius grows with the roughness. Its cheap form is a mip level proportional to the frost, plus a per-pixel jitter of the offset for the grainy look of etched glass. Dispersion reuses the drop offset three times with slightly different strengths for red, green and blue (1 ± 0.3k), so bright lights seen through a drop get coloured fringes, like the glass ball above.")}
      </p>

      <KeyIdeas t={t} id="glslGlass" items={[
        "refract(I, N, η) implements Snell's law; it returns vec3(0) on total internal reflection.",
        "Fresnel: F ≈ R₀ + (1 − R₀)(1 − cosθ)⁵; mix refraction and reflection with it.",
        "R₀ = ((n₁ − n₂)/(n₁ + n₂))²: 4% for glass, 2% for water.",
        "Dispersion: a different η per channel. Absorption: e^(−σ·d).",
        "Rain on glass: drops are a height field c; read the scene at uv + k·∇c.",
        "Drops come from hashed grid cells; a sawtooth gives the stick-then-slide motion; trails clear the fog.",
        "Blur = mip level ≈ log₂(radius); condensation and frost choose the level, drops force it to 0.",
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
