// src/lib/tracks/glsl/chapters/effects/water.tsx
"use client";

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { GerstnerFigure } from "@/components/lesson/glsl/GerstnerFigure";
import { WaterLabFigure } from "@/components/lesson/figures/water/WaterLabFigure";
import { ShoreLabFigure } from "@/components/lesson/figures/water/ShoreLabFigure";
import { WATER_PRESETS } from "../../presets/water";

const r = String.raw;

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
