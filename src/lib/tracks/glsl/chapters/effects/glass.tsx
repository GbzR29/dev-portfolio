// src/lib/tracks/glsl/chapters/effects/glass.tsx
"use client";

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { WindowLabFigure } from "@/components/lesson/figures/glass/WindowLabFigure";
import { FresnelFigure } from "@/components/lesson/glsl/FresnelFigure";
import { GLASS_PRESETS } from "../../presets/glass";

const r = String.raw;

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
