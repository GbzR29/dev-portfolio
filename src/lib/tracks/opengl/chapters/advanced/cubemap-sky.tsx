// src/lib/tracks/opengl/chapters/advanced/cubemap-sky.tsx
"use client";

// Part of "Cubemaps & Skybox": a procedural sky, layer by layer (gradient, single scattering, sun, hash/noise/fBm, stars, Milky Way, clouds).

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { airNumbers, gradNumbers } from "@/lib/tracks/opengl/live/cubemaps";
import { ProceduralSkyFigure } from "@/components/lesson/figures/sky/ProceduralSkyFigure";
import { SkyBuilderFigure } from "@/components/lesson/figures/sky/SkyBuilderFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

export function ProceduralSky({ t }: { t: TrackTranslations }) {
  return (
    <>
      <H2>{tx(t, "oglCube_procTitle", "A procedural sky, layer by layer")}</H2>
      <p>
        {tx(t, "oglCube_procBody",
          "A procedural sky is one function: it receives the view direction d (a unit vector) and returns the light arriving from that direction. The one below is built from five independent layers. Each is a function of d and of the direction toward the sun, s. They are summed, and the clouds are blended over the result. Try the time presets, then use S to solo each layer while reading its formula."
        )}
      </p>

      <ProceduralSkyFigure t={t} />

      <H3>{tx(t, "oglCube_pGradTitle", "1 · The base sky, the artist way")}</H3>
      <p>
        {tx(t, "oglCube_pGradBody",
          "The cheapest sky blends two colours by height, with a curve that concentrates the change near the horizon. The colours themselves depend on how high the sun is."
        )}
      </p>
      <Equation label={tx(t, "oglCube_gradLabel", "Gradient sky")}
        where={[
          [r`d_y`, tx(t, "oglCube_wDy", "height of the view direction: 0 at the horizon, 1 straight up")],
          [r`k = 0.45`, tx(t, "oglCube_wK", "an exponent below 1 bends the curve upward. d_y^0.45 is already 0.5 at d_y = 0.21, about 12° up, so most of the colour change sits near the horizon, as in real skies")],
          [r`\text{day}`, tx(t, "oglCube_wDay", "smoothstep(−0.25, 0.35, s_y): 0 at night, 1 in daylight, a smooth S-curve between. It blends the night and day versions of both colours")],
        ]}
        note={tx(t, "oglCube_gradNote", "A third term warms the horizon colour at dusk, more on the side facing the sun. Everything here is chosen by eye, so it is fast and easy to art-direct, but no physics links the colours to each other.")}
        words={tx(t, "oglCube_gradWords", "Blend from the horizon colour to the zenith colour by how high the view direction points, after bending that height with a power below 1 so the blend happens mostly near the horizon.")}>
        {r`C(\mathbf{d}) = \operatorname{mix}\!\big(C_{\text{horizon}},\ C_{\text{zenith}},\ d_y^{\,k}\big)`}
      </Equation>
      <LiveFormula label={tx(t, "oglCube_liveGrad", "Try it: how far has the colour moved at this height?")}
        tex={r`d_y^{\,k}, \quad k = 0.45`}
        vars={[{ id: "el", label: tx(t, "oglCube_liveEl", "elevation"), min: 0, max: 90, step: 1, value: 12, fmt: v => `${v}°` }]}
        compute={gradNumbers(t)}
        note={tx(t, "oglCube_liveGradNote", "12° above the horizon the blend is already halfway (0.5), while d_y itself is only 0.21. At 45° it is 0.86: the upper half of the sky is almost all zenith colour.")} />

      <H3>{tx(t, "oglCube_pScatTitle", "1 · The base sky, the physical way")}</H3>
      <p>
        {tx(t, "oglCube_pScatBody",
          "The sky is blue because air scatters short wavelengths more than long ones. A simple version of that physics treats the atmosphere as a flat, uniform slab one unit thick and follows light that scatters once. Four ideas are enough."
        )}
      </p>
      <Equation label={tx(t, "oglCube_massLabel", "Air mass: how much air a ray crosses")}
        where={[
          [r`d_y`, tx(t, "oglCube_wMassY", "the cosine of the angle from straight up. A ray at that angle crosses 1/cos of the slab's thickness")],
          [r`0.025`, tx(t, "oglCube_wEps", "keeps the horizon finite (1/0.025 = 40). On the real, curved Earth the horizon air mass is about 38")],
        ]}
        words={tx(t, "oglCube_massWords", "Straight up, a ray crosses one thickness of air. Tilted down toward the horizon, it crosses the slab at a slant and travels through more air: one over the height of the direction.")}>
        {r`m(y) = \frac{1}{y + 0.025}`}
      </Equation>
      <Equation label={tx(t, "oglCube_beerLabel", "Beer–Lambert: light surviving a path")}
        where={[
          [r`\beta`, tx(t, "oglCube_wBeta", "how strongly one unit of air removes light, per colour channel")],
          [r`\beta_R \propto \lambda^{-4}`, tx(t, "oglCube_wRay", "Rayleigh scattering by air molecules. With λ = 700, 530 and 400 nm, (400/700)⁴ ≈ 0.107 and (400/530)⁴ ≈ 0.324, giving β_R = (0.035, 0.107, 0.33). Blue is scattered about ten times more than red")],
          [r`\beta_M,\ \beta_O`, tx(t, "oglCube_wMieO", "haze (Mie, grey, 0.012) and ozone. Ozone absorbs orange and green but scatters nothing, and it is what keeps the twilight zenith blue instead of olive")],
        ]}
        words={tx(t, "oglCube_beerWords", "Every unit of air removes the same share of the light still left, so what survives falls off exponentially with the amount of air. The sunlight reaching the sky is the sun's light times what survives the path toward the sun, with all three kinds of loss added in the exponent.")}>
        {r`T = e^{-\beta\, m} \qquad L_{\text{sun}} = E\; e^{-(\beta_R + \beta_M + \beta_O)\, m(s_y)}`}
      </Equation>
      <LiveFormula label={tx(t, "oglCube_liveAir", "Try it: the colour of sunlight after the air, by sun height")}
        tex={r`m = \frac{1}{s_y + 0.025} \qquad T = e^{-\beta_R\, m}`}
        vars={[{ id: "el", label: tx(t, "oglCube_liveSunEl", "sun elevation"), min: 0, max: 90, step: 1, value: 3, fmt: v => `${v}°` }]}
        compute={airNumbers(t)}
        note={tx(t, "oglCube_liveAirNote", "Only Rayleigh is counted here, and the swatch is scaled so its brightest channel is full. With the sun high, all three channels survive and the light stays near white. At 3° the path is 13 air masses: blue keeps 1.4%, red 64%, and the sun turns orange; on the horizon (40 masses) it is deep red.")} />
      <Equation label={tx(t, "oglCube_scatLabel", "Single scattering toward the eye")}
        where={[
          [r`1 - e^{-\beta m(d_y)}`, tx(t, "oglCube_wFrac", "the fraction of light scattered somewhere along the view ray. It is small for blue at the zenith and close to 1 for every colour at the horizon, which is why the horizon turns white")],
          [r`\mu = \mathbf{d}\cdot\mathbf{s}`, tx(t, "oglCube_wMu", "cosine of the angle between the view and the sun")],
          [r`P_R(\mu) = \tfrac{3}{16\pi}(1+\mu^2)`, tx(t, "oglCube_wPR", "Rayleigh phase function: how much of the scattered light turns toward us. It is slightly brighter toward and away from the sun")],
          [r`P_{HG}(\mu, g)`, tx(t, "oglCube_wHG", "Henyey–Greenstein phase: (1 − g²) / (4π (1 + g² − 2gμ)^{3/2}). With g = 0.8, haze throws most light forward, which makes the bright glow around the sun")],
        ]}
        note={tx(t, "oglCube_scatNote", "One correction keeps sunsets right. For a high view, the air that scatters toward us sits higher up, where the sunlight reaching it has crossed less air. So the sun's air mass is multiplied by 0.25 + 0.75·e^(−3 d_y). Without it the whole sky takes the sun's orange tint at dusk.")}
        words={tx(t, "oglCube_scatWords", "Along the view ray, some share of the sunlight gets scattered by air and some by haze. Each share is multiplied by how much of the scattered light turns toward the eye at this angle to the sun, and the two are added.")}>
        {r`\begin{aligned} L(\mathbf{d}) = L_{\text{sun}} \Big[&\big(1 - e^{-\beta_R m(d_y)}\big) P_R(\mu) \\ &+ \big(1 - e^{-\beta_M m(d_y)}\big) P_{HG}(\mu, 0.8)\Big] \end{aligned}`}
      </Equation>

      <H3>{tx(t, "oglCube_pSunTitle", "2 · The sun")}</H3>
      <Equation label={tx(t, "oglCube_sunLabel", "A disc is a threshold on the angle")}
        where={[
          [r`\mu`, tx(t, "oglCube_wMu2", "cos of the angle to the sun. It shrinks as the angle grows, so “inside the disc” means μ > cos R")],
          [r`R`, tx(t, "oglCube_wR", "angular radius, here 0.7° (the real sun is 0.27°, too small to see at this resolution)")],
          [r`\operatorname{smoothstep}`, tx(t, "oglCube_wSmooth", "an antialiased step: 0 outside cos(1.15R), 1 inside cos R, smooth in between")],
        ]}
        note={tx(t, "oglCube_sunNote", "Its colour is L_sun, the same attenuated sunlight that lights the sky, so it turns orange at sunset without any extra code.")}
        words={tx(t, "oglCube_sunWords", "A direction is inside the sun's disc when its angle to the sun is smaller than the disc's radius. Comparing cosines does the same without an arccos, and a smoothstep over a slightly wider ring softens the edge.")}>
        {r`\text{disc} = \operatorname{smoothstep}\big(\cos 1.15R,\ \cos R,\ \mu\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pToolsTitle", "Tools first: hash, value noise and fBm")}</H3>
      <p>
        {tx(t, "oglCube_pToolsBody",
          "Stars, the Milky Way and clouds are all built from three small functions. None of them is specific to skies: the same three make fire, water ripples, terrain and marble. They are worth knowing by heart.")}
      </p>
      <Equation label={tx(t, "oglCube_hashLabel", "1. A hash: integer id → repeatable random number")}
        where={[
          [r`\mathbf p`, tx(t, "oglCube_wHashP", "an integer cell id (stored in a vec3). The same id must always give the same number")],
          [r`\operatorname{fract}(\mathbf p \cdot 0.1031)`, tx(t, "oglCube_wHashF", "scales the id and keeps only the fractional part, which scrambles the digits")],
          [r`\mathbf p \cdot (\mathbf p_{zyx} + 31.32)`, tx(t, "oglCube_wHashD", "mixes the three components into each other, so neighbouring ids give unrelated results")],
        ]}
        note={tx(t, "oglCube_hashNote", "This is Dave Hoskins' “hash without sine”. The older fract(sin(dot(p, k)) · 43758.5) works too, but sin loses precision for large arguments on some GPUs, and the pattern then turns into visible stripes. A hash is not random: it is a deterministic function that only looks random. That is what makes a procedural sky stable from one frame to the next.")}
        glsl={`float hash13(vec3 p) {\n    p = fract(p * 0.1031);\n    p += dot(p, p.zyx + 31.32);\n    return fract((p.x + p.y) * p.z);\n}`}
        words={tx(t, "oglCube_hashWords", "Scale the cell id and keep only the digits after the point. Mix the three components into one another, multiply, and again keep only the digits after the point. The result is a number between 0 and 1 that jumps wildly from one id to the next, but is always the same for the same id.")}>
        {r`\begin{gathered} h(\mathbf p) = \operatorname{fract}\big((q_x + q_y)\,q_z\big) \\[6pt] \mathbf q = \mathbf f + \mathbf f\cdot(\mathbf f_{zyx} + 31.32),\quad \mathbf f = \operatorname{fract}(0.1031\,\mathbf p) \end{gathered}`}
      </Equation>
      <Equation label={tx(t, "oglCube_noiseLabel", "2. Value noise: random values at grid points, smoothly blended")}
        where={[
          [r`\lfloor x\rfloor,\ f = x - \lfloor x\rfloor`, tx(t, "oglCube_wNoiseI", "the grid point to the left and the position between it and the next one (0 … 1)")],
          [r`h(\lfloor x\rfloor),\ h(\lfloor x\rfloor + 1)`, tx(t, "oglCube_wNoiseH", "the hashed values at the two surrounding grid points")],
          [r`u(f) = 3f^2 - 2f^3`, tx(t, "oglCube_wNoiseU", "the smoothstep curve. Its slope is 6f − 6f², which is 0 at both ends, so neighbouring segments join without a corner. Plain linear blending would leave a crease at every grid line")],
        ]}
        note={tx(t, "oglCube_noiseNote", "In 2D the same blend is done twice along x (the bottom and top pair of corners) and once along y between the results. In 3D there are four x-blends, two y-blends and one z-blend, eight corners in all. That is noise3() in the shader.")}
        words={tx(t, "oglCube_noiseWords", "Give every whole number a random value. Between two whole numbers, blend their two values, using an S-shaped curve of the position instead of a straight line so the result has no kinks.")}>
        {r`n(x) = \operatorname{mix}\!\big(h(\lfloor x\rfloor),\ h(\lfloor x\rfloor + 1),\ u(f)\big)`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglCube_noiseDer", "Why the S-curve leaves no crease")}
        steps={[
          { full: true, tex: r`n'(x) = \big(h(\lfloor x\rfloor + 1) - h(\lfloor x\rfloor)\big)\,u'(f)`,
            why: tx(t, "oglCube_nd1", "inside one segment the two hashed values are constants, so the slope of the blend is their difference times the slope of u") },
          { full: true, tex: r`u(f) = 3f^2 - 2f^3 \;\Rightarrow\; u'(f) = 6f - 6f^2 = 6f\,(1 - f)`,
            why: tx(t, "oglCube_nd2", "differentiate the smoothstep curve term by term") },
          { full: true, tex: r`u'(0) = 0, \quad u'(1) = 0 \;\Rightarrow\; n' = 0 \ \text{${tx(t, "oglCube_nd3t", "at every grid point")}}`,
            why: tx(t, "oglCube_nd3", "the slope is 0 at both ends of every segment, so two neighbouring segments arrive at their shared grid point with the same slope, 0: no corner") },
          { full: true, tex: r`u(f) = f \;\Rightarrow\; n' = h(\lfloor x\rfloor + 1) - h(\lfloor x\rfloor)`,
            why: tx(t, "oglCube_nd4", "with a straight-line blend the slope is the difference itself, which changes from one segment to the next: a visible crease at every grid line") },
        ]} />
      <Equation label={tx(t, "oglCube_fbmLabel", "3. fBm: octaves of noise, each twice as fine and half as strong")}
        where={[
          [r`2^i`, tx(t, "oglCube_wFbmF", "frequency of octave i (the lacunarity is 2): each octave has features half the size of the previous one")],
          [r`0.5^{\,i+1}`, tx(t, "oglCube_wFbmA", "its amplitude (the gain is 0.5): fine detail is fainter than large shapes, as in clouds, coastlines and mountains")],
          [r`R`, tx(t, "oglCube_wFbmR", "a small rotation plus an offset between octaves, so the grids of different octaves never line up")],
        ]}
        note={tx(t, "oglCube_fbmNote", "The amplitudes add up to 1 − 0.5^N, so the sum stays in 0…1 but clusters around 0.5. This is why the cloud coverage slides its threshold between 0.3 and 0.7 rather than over the whole 0…1 range.")}
        words={tx(t, "oglCube_fbmWords", "Add several copies of the noise. Each copy is twice as fine as the one before and counts half as much, and each is turned a little so their grids never line up.")}>
        {r`\operatorname{fbm}(\mathbf p) = \sum_{i=0}^{N-1} 0.5^{\,i+1}\; n\big(2^i R^i\,\mathbf p\big)`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglCube_fbmDer", "Why the amplitudes add up to 1 − 0.5ᴺ")}
        steps={[
          { full: true, tex: r`S = 0.5 + 0.25 + \dots + 0.5^{N}`,
            why: tx(t, "oglCube_fb1", "the largest value fbm can reach: every octave at its maximum of 1") },
          { full: true, tex: r`2S = 1 + 0.5 + \dots + 0.5^{N-1}`,
            why: tx(t, "oglCube_fb2", "doubling shifts every term one place to the left") },
          { full: true, tex: r`2S - S = 1 - 0.5^{N}`,
            why: tx(t, "oglCube_fb3", "subtract: all the middle terms cancel, only the first of 2S and the last of S remain") },
          { full: true, tex: r`S = 1 - 0.5^{N} \quad (N = 5:\ 0.969)`,
            why: tx(t, "oglCube_fb4", "so the sum never exceeds 1. Since each octave averages 0.5, fbm averages about half of S, which is why its values cluster around 0.5") },
        ]} />

      <H3>{tx(t, "oglCube_pStarsTitle", "3 · Stars from a hash")}</H3>
      <p>
        {tx(t, "oglCube_pStarsBody",
          "Storing thousands of stars is unnecessary. Scale the direction and round it down, and the sky is cut into cells: floor(70·d) is a 3D integer cell index. A hash function turns that index into a number that looks random but is always the same for the same cell. Keep a star only if the number is below a threshold, place it at a jittered point inside the cell, and give it a brightness from a second hash. Step through it; the equation after the figure sums it up."
        )}
      </p>
      <SkyBuilderFigure t={t} part="stars" />
      <Equation label={tx(t, "oglCube_starLabel", "One star per lucky cell")}
        where={[
          [r`h_1 < 0.35\,\rho`, tx(t, "oglCube_wKeep", "keep the cell's star if its hash is below the density slider ρ times 0.35")],
          [r`\mathbf{c}`, tx(t, "oglCube_wC", "the star's centre: the cell centre plus up to ±0.3 cells of hashed jitter, so the grid never shows")],
          [r`e^{-90 r^2}`, tx(t, "oglCube_wGauss", "a Gaussian spot: r is the distance from p to c in cell units, and 90 makes the spot about a tenth of a cell wide")],
          [r`h_2^{\,6}`, tx(t, "oglCube_wMag", "raising a uniform random number to the 6th power makes most stars faint and a few bright, much like the real sky")],
        ]}
        note={tx(t, "oglCube_starNote", "Two more factors: a slow sine per star for twinkle, and a fade near the horizon (smoothstep(0, 0.25, d_y)), where thick air dims starlight. The whole layer is multiplied by night = 1 − smoothstep(−0.18, 0.04, s_y).")}
        words={tx(t, "oglCube_starWords", "Scale the direction by 70 and round down to find its cell. If the cell's random number is low enough, it holds a star near its centre. The pixel's brightness is a soft spot around that star, times a random brightness that is usually faint.")}>
        {r`\mathbf{p} = 70\,\mathbf{d} \qquad \text{cell} = \lfloor \mathbf{p} \rfloor \qquad \text{star} = e^{-90\,\lVert \mathbf{p} - \mathbf{c}\rVert^2}\,\big(0.3 + 6\,h_2^{\,6}\big)`}
      </Equation>

      <H3>{tx(t, "oglCube_pMilkyTitle", "4 · The Milky Way")}</H3>
      <SkyBuilderFigure t={t} part="milky" />
      <Equation label={tx(t, "oglCube_milkyLabel", "A soft band around a great circle")}
        where={[
          [r`\mathbf{G}`, tx(t, "oglCube_wG", "the normal of the galaxy's plane. Directions on the band are perpendicular to it, so x = d·G is 0 on the band and grows off it (x is the sine of the angle off the plane)")],
          [r`\sigma = 0.12`, tx(t, "oglCube_wSigma", "the band's half-width, about 7°. A Gaussian of x fades it softly on both sides")],
          [r`\operatorname{fbm}`, tx(t, "oglCube_wFbm", "fractal noise: fbm(p) = Σ 0.5^(i+1)·noise(2^i p), octaves at double the frequency and half the strength. It gives the band's clumpy texture")],
        ]}
        note={tx(t, "oglCube_milkyNote", "A second, narrower Gaussian (width 0.07) multiplied by noise darkens a dust lane down the middle. The colour warms toward a chosen galactic-centre direction, which is also where the band is brightest.")}
        words={tx(t, "oglCube_milkyWords", "Measure how far the direction is from the galaxy's plane. Fade the band out smoothly as that distance grows, and give it a clumpy texture with fractal noise.")}>
        {r`x = \mathbf{d}\cdot\mathbf{G} \qquad \text{band} = e^{-x^2 / 2\sigma^2}\ \operatorname{fbm}(6\,\mathbf{d})`}
      </Equation>

      <H3>{tx(t, "oglCube_pCloudTitle", "5 · Clouds on a plane")}</H3>
      <p>
        {tx(t, "oglCube_pCloudBody",
          "Real clouds are volumes, and the Volumetrics chapter marches through them. A convincing cheap version treats the cloud layer as a flat sheet at height 1. For each view ray, find where it meets the sheet and read 2D noise there. Eight steps take it from a checkerboard to lit, drifting clouds."
        )}
      </p>
      <SkyBuilderFigure t={t} part="clouds" />
      <Equation label={tx(t, "oglCube_cloudLabel", "Ray–plane hit, coverage and one step of light")}
        where={[
          [r`t = 1/d_y`, tx(t, "oglCube_wT", "the distance along d to the plane y = 1, since the ray's height is t·d_y. Near the horizon t explodes, so hits far away are spread over huge areas")],
          [r`\mathbf{p}`, tx(t, "oglCube_wP", "the hit point's horizontal position, scaled, plus a wind offset that grows with time")],
          [r`e`, tx(t, "oglCube_wE", "the coverage edge, mix(0.7, 0.3, cover): the lower it is, the more of the noise counts as cloud")],
          [r`n(\mathbf{p}+\boldsymbol{\delta}) - n(\mathbf{p})`, tx(t, "oglCube_wLit", "one step toward the sun. If the noise is denser there, sunlight had to cross more cloud to arrive, so this point is darker (Beer–Lambert again, with a step of 0.12)")],
          [r`e^{-0.12\,t}`, tx(t, "oglCube_wFade", "distance fade. Far clouds dissolve into the haze before their noise turns into flicker")],
        ]}
        note={tx(t, "oglCube_cloudNote", "Thick parts are darkened further, since little light reaches a cloud's underside. A Henyey–Greenstein term brightens edges when you look toward the sun: the silver lining.")}
        words={tx(t, "oglCube_cloudWords", "Follow the view ray up to the cloud sheet and read the noise where it lands, shifted by the wind. Where the noise is above the coverage edge there is cloud. Then take one small step toward the sun: if the cloud is thicker there, less sunlight gets through and the point is darker.")}>
        {r`\begin{gathered} \mathbf{p} = t\,(d_x, d_z)\cdot 0.7 + \mathbf{v}_{\text{wind}}\,\text{time} \\[6pt] \alpha = \operatorname{smoothstep}\big(e,\ e + 0.2,\ n(\mathbf{p})\big) \\[6pt] \text{lit} = e^{-8\,\max(n(\mathbf{p}+\boldsymbol\delta) - n(\mathbf{p}),\,0)} \end{gathered}`}
      </Equation>

      <p>
        {tx(t, "oglCube_pToneBody",
          "Everything above is radiance, with the sun thousands of times brighter than a star. One tone map at the very end, 1 − e^(−exposure·c), squeezes that range into 0…1 before the gamma encode. It is the same idea as the HDR chapter."
        )}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglCube_procTip",
          "Evaluating this per pixel every frame costs a few noise lookups per pixel, which is fine for a sky. When the same sky also has to feed reflections or image-based lighting, render it into a small cube map whenever the time of day changes and sample that instead. It is the equirectangular-to-cube pass above with sky(d) in place of the texture read."
        )}
      </Callout>
    </>
  );
}
