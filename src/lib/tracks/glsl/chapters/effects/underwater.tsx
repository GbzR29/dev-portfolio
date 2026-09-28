// src/lib/tracks/glsl/chapters/effects/underwater.tsx
"use client";

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SnellWindowFigure } from "@/components/lesson/figures/underwater/SnellWindowFigure";
import { UnderwaterLabFigure } from "@/components/lesson/figures/underwater/UnderwaterLabFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Underwater
// ═════════════════════════════════════════════════════════════════════════════

export function UnderwaterContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslUnder_intro",
          "Dive under the Water Lab's surface and three things change. The surface turns into a ceiling that shows the sky only in a disc straight overhead, and mirrors the depths everywhere else. The water between you and everything you look at is no longer a thin layer to cross once: it is the whole scene, and it colours, dims and hazes everything with distance. And sunlight coming down through the waves draws moving shafts in that haze. This chapter builds all three on top of the Water Lab's mesh and bed.")}
      </Lead>

      <H2>{tx(t, "glslUnder_snellTitle", "Looking up: Snell's window")}</H2>
      <p>
        {tx(t, "glslUnder_snellBody",
          "Light crossing from one medium into another bends so that n·sin θ stays the same on both sides, where θ is the angle from the surface normal and n is the refractive index. Seen from below, that works in reverse: a ray from the eye leaving the water bends away from the normal. At some angle the ray would need sin θ_air > 1 to get out, and then it cannot: it is reflected back down, completely. That angle is the critical angle:")}
      </p>
      <Equation label={tx(t, "glslUnder_snellLabel", "Snell's law, and the critical angle from below")}
        where={[
          [r`n_w = 1.333,\ n_a = 1.000`, tx(t, "glslUnder_wN", "the refractive indices of water and air: how many times slower light travels in them than in vacuum")],
          [r`\theta_w,\ \theta_a`, tx(t, "glslUnder_wTh", "the angles between the ray and the surface normal, in the water and in the air")],
          [r`\theta_c`, tx(t, "glslUnder_wThc", "the critical angle, where θ_a would reach 90°: the ray would skim along the surface. Beyond it, sin θ_a would exceed 1, and nothing is transmitted")],
        ]}
        glsl={`vec3 T = refract(rd, -N, 1.333);  // vec3(0) past the critical angle`}>
        {r`n_w \sin\theta_w = n_a \sin\theta_a \qquad \theta_c = \arcsin\frac{n_a}{n_w} = \arcsin\frac{1}{1.333} \approx 48.6^\circ`}
      </Equation>
      <p>
        {tx(t, "glslUnder_windowBody",
          "Run it the other way, from the sky down to the eye. Light from straight overhead arrives straight. Light from the horizon arrives at θ_a = 90°, and bends to 48.6°. So the whole sky, 180° from horizon to horizon, reaches the eye inside a cone 97° wide. From below, the sky is a bright disc of diameter 2·d·tan 48.6° ≈ 2.27·d at depth d, squeezed toward its edge, where the horizon is. Divers call it Snell's window. Outside it, the surface reflects whatever lies below: the dark depths, the bed, a fish.")}
      </p>
      <SnellWindowFigure t={t} />
      <p>
        {tx(t, "glslUnder_fresBody",
          "The Water Lab used Schlick's approximation for Fresnel. It fits reflection from the air side well, but seen from the water side it never reaches total reflection at the critical angle. So the underside uses the exact Fresnel equations, for light arriving at cos θ_i with a ratio of indices η:")}
      </p>
      <Equation label={tx(t, "glslUnder_fLabel", "Exact Fresnel reflectance (unpolarised light)")}
        where={[
          [r`\eta = n_i / n_t`, tx(t, "glslUnder_wEta", "the index on the side the light comes from over the index on the other side: 1.333 for a ray leaving the water")],
          [r`\cos\theta_t = \sqrt{1 - \eta^2 (1 - \cos^2\theta_i)}`, tx(t, "glslUnder_wCt", "the cosine of the transmitted angle, from Snell's law. When the square root would be of a negative number, the ray is past the critical angle and F = 1")],
          [r`r_s,\ r_p`, tx(t, "glslUnder_wRs", "the reflected amplitudes for light polarised across and along the plane of incidence. Sunlight and skylight are treated as unpolarised: an even mix of both, hence the average of their squares")],
        ]}
        glsl={`float rs = (eta * cosi - cost) / (eta * cosi + cost);\nfloat rp = (cosi - eta * cost) / (cosi + eta * cost);\nF = 0.5 * (rs * rs + rp * rp);`}>
        {r`r_s = \frac{\eta\cos\theta_i - \cos\theta_t}{\eta\cos\theta_i + \cos\theta_t} \qquad r_p = \frac{\cos\theta_i - \eta\cos\theta_t}{\cos\theta_i + \eta\cos\theta_t} \qquad F = \frac{r_s^2 + r_p^2}{2}`}
      </Equation>
      <p>
        {tx(t, "glslUnder_undersideBody",
          "The underside is shaded with the Water Lab's mesh and normals, with the normal flipped to face down. The refracted ray T looks up into the sky probe, plus a sharp term for the sun itself, weighted by 1 − F. The reflected ray R goes back down into the water, and what it finds there (the bed, or open water) is weighted by F. Past the critical angle, F = 1 and only the water below remains. The waves tilt the normal, so the window's edge ripples and breaks into bright patches.")}
      </p>

      <H2>{tx(t, "glslUnder_mediumTitle", "Water is a medium")}</H2>
      <p>
        {tx(t, "glslUnder_mediumBody",
          "Above the surface, the Water Lab coloured the refracted light with Beer–Lambert absorption over the path to the bed. Underwater, that path is every path. Light travelling through water loses energy in two ways. It can be absorbed, turned into heat: water absorbs red within a few metres, green over tens of metres and blue least of all. Or it can be scattered, bounced into a new direction by particles, plankton and bubbles, whatever its colour. Both remove light from a ray, so they add up to the extinction coefficient:")}
      </p>
      <Equation label={tx(t, "glslUnder_extLabel", "Extinction and transmittance")}
        where={[
          [r`\sigma_a`, tx(t, "glslUnder_wSa", "the absorption coefficient, per metre and per colour channel: the water colour presets of the Water Lab, divided by the clarity slider")],
          [r`\sigma_s`, tx(t, "glslUnder_wSs", "the scattering coefficient, per metre: the turbidity slider. It is grey, because the particles that scatter are much larger than the wavelength of light, which then scatters every colour alike")],
          [r`T(s)`, tx(t, "glslUnder_wT", "the transmittance: the fraction of light still travelling along the ray after s metres. It is a colour, since σt differs per channel")],
        ]}>
        {r`\sigma_t = \sigma_a + \sigma_s \qquad T(s) = e^{-\sigma_t\, s}`}
      </Equation>
      <p>
        {tx(t, "glslUnder_inscBody",
          "If that were all, anything far away would fade to black. It fades to blue instead, because scattering also adds light. Sunlight and skylight reach every point in the water, and a fraction σs of that light is scattered at each metre, some of it toward the eye. The light the eye receives along a ray of length s is the sum of what the far end sends, dimmed, and of what every point along the way scatters toward the eye, dimmed by the water between that point and the eye:")}
      </p>
      <Equation label={tx(t, "glslUnder_rteLabel", "Single scattering along a view ray")}
        where={[
          [r`L_{\text{end}}`, tx(t, "glslUnder_wLend", "the light leaving what the ray ends on: the bed, or the underside of the surface")],
          [r`S(t)`, tx(t, "glslUnder_wS", "the source term: light scattered toward the eye per metre, at distance t along the ray")],
          [r`E_{\text{sun}}(d),\ E_{\text{sky}}(d)`, tx(t, "glslUnder_wE", "the sunlight and skylight arriving at depth d, below")],
          [r`p(\mu)`, tx(t, "glslUnder_wP", "the phase function: which share of the scattered sunlight turns toward the eye, as a function of μ, the cosine of the angle between the sunlight's direction and the direction to the eye")],
          [r`\tfrac{1}{4\pi}`, tx(t, "glslUnder_w4pi", "the phase function of light that comes from all over the sky: it is treated as scattering evenly into all 4π steradians of directions")],
          [r`c(\mathbf x)`, tx(t, "glslUnder_wC", "the caustic factor at the point: 1 under a flat surface, more where the waves focus the sun and less where they spread it. It makes the shafts, below")],
        ]}>
        {r`L = L_{\text{end}}\,T(s) + \int_0^s T(t)\,S(t)\,dt \qquad S = \sigma_s\Big(E_{\text{sun}}(d)\,c(\mathbf x)\,p(\mu) + \frac{E_{\text{sky}}(d)}{4\pi}\Big)`}
      </Equation>
      <p>
        {tx(t, "glslUnder_phaseBody",
          "Particles in water throw most of the light they scatter forward, within a few degrees of its original direction. The Henyey–Greenstein phase function, already used for the sky's haze, captures that with one number g, the average cosine of the scattering angle. Measurements of sea water give g ≈ 0.9; the lab uses 0.8, which keeps a little more light scattered sideways. With g = 0.8, looking toward the sun makes the scattered light about 700 times brighter than looking away from it: that is why the shafts glow most when you face them.")}
      </p>
      <Equation label={tx(t, "glslUnder_hgLabel", "Henyey–Greenstein phase function")}
        where={[
          [r`\mu`, tx(t, "glslUnder_wMu", "cos of the scattering angle: 1 when the light keeps going straight toward the eye, −1 when it bounces straight back")],
          [r`g`, tx(t, "glslUnder_wG", "the asymmetry: 0 scatters evenly in all directions, values near 1 keep the light close to its original direction")],
        ]}>
        {r`p(\mu) = \frac{1 - g^2}{4\pi\,\big(1 + g^2 - 2 g \mu\big)^{3/2}}`}
      </Equation>

      <H3>{tx(t, "glslUnder_depthTitle", "Light at depth d")}</H3>
      <p>
        {tx(t, "glslUnder_depthBody",
          "The sun enters through the surface with the transmitted fraction 1 − F, bent to the refracted direction L_s, and then crosses d / cos θ_s metres of water to reach depth d. Skylight enters from the whole sky, which inside the water fills the 48.6° cone of Snell's window. Averaged over that cone, weighted by how squarely each direction lights a horizontal patch, its path is 1.21 times the depth. Both are dimmed by the full extinction σt, since light scattered out of a beam no longer travels with it:")}
      </p>
      <Equation label={tx(t, "glslUnder_lightLabel", "Sunlight and skylight at depth d")}
        where={[
          [r`E_0`, tx(t, "glslUnder_wE0", "the sunlight just above the surface, from the sky model")],
          [r`F(\theta_{\text{sun}})`, tx(t, "glslUnder_wFs", "the Fresnel reflectance for the sun's elevation: a low sun is mostly reflected, so the depths get dark at dusk before the surface does")],
          [r`\cos\theta_s = -L_{s,y}`, tx(t, "glslUnder_wCs", "the cosine of the refracted sun direction from the vertical. It never drops below cos 48.6° = 0.66, so even a setting sun reaches the depths along a path at most 1.5 times the depth")],
          [r`1.21`, tx(t, "glslUnder_w121", "the mean of 1/cos θ over the window, weighted by cos θ (the light a horizontal patch receives from each direction): (1 − cos θc) / (½ sin² θc) = 0.339 / 0.281 ≈ 1.21")],
        ]}>
        {r`E_{\text{sun}}(d) = E_0\,\big(1 - F(\theta_{\text{sun}})\big)\,e^{-\sigma_t\, d / \cos\theta_s} \qquad E_{\text{sky}}(d) = E_{\text{amb}}\,e^{-1.21\,\sigma_t\, d}`}
      </Equation>

      <H2>{tx(t, "glslUnder_marchTitle", "Marching the ray")}</H2>
      <p>
        {tx(t, "glslUnder_marchBody",
          "The integral has no closed form once the caustics are in it, so the shader cuts the ray into 32 steps and sums them. Inside one step of length Δt the source S is taken as constant, and then that step's share has an exact answer. Summing S·Δt instead would overshoot in murky water, where a single step can be longer than the distance light survives:")}
      </p>
      <Equation label={tx(t, "glslUnder_stepLabel", "One step of the march")}
        where={[
          [r`\frac{1 - e^{-\sigma_t\Delta t}}{\sigma_t}`, tx(t, "glslUnder_wStep", "the integral of e^(−σt·t) over the step: how much of a constant source along Δt metres reaches the step's start. For short steps it is ≈ Δt, and for long ones it tends to 1/σt, the distance light survives")],
          [r`T`, tx(t, "glslUnder_wTacc", "the transmittance from the eye to the start of the step, multiplied by e^(−σt·Δt) after each step")],
          [r`j`, tx(t, "glslUnder_wJ", "a per-pixel offset between 0 and 1 (interleaved gradient noise). Every pixel samples the step at a different point, which turns the stripes a fixed step would leave into a fine, even grain")],
        ]}
        note={tx(t, "glslUnder_stepNote", "The march stops after 60 m. Past that, one more step covers the rest of the ray with the source at the 60 m point, without the caustic pattern, and ends at the bed or at infinity, where e^(−σt·s) = 0.")}
        glsl={`vec3 x = o + rd * ((float(i) + j) * dt);\nvec3 S = sigmaS * (sunAtDepth(d) * c * phase + skyAtDepth(d) / (4.0 * PI));\nL += trans * S * (1.0 - exp(-sigmaT * dt)) / sigmaT;\ntrans *= exp(-sigmaT * dt);`}>
        {r`L \mathrel{+}= T\,S\,\frac{1 - e^{-\sigma_t\,\Delta t}}{\sigma_t} \qquad T \leftarrow T\,e^{-\sigma_t\,\Delta t}`}
      </Equation>

      <H2>{tx(t, "glslUnder_shaftTitle", "Light shafts")}</H2>
      <p>
        {tx(t, "glslUnder_shaftBody",
          "The Water Lab lit the bed with caustics: each wave crest is a weak lens, and the sunlight under it is focused into bright lines. The same focused light passes through every depth on its way down, and the particles along its path scatter some of it toward the eye. Seen from the side, the caustic lines become sheets and shafts of light that follow the sun's direction and sway with the waves. So the caustic factor c(x) of the source term is the caustic formula again, evaluated at the point where the sunlight reaching x crossed the surface:")}
      </p>
      <Equation label={tx(t, "glslUnder_causLabel", "The caustic factor at any depth")}
        where={[
          [r`\mathbf x_s`, tx(t, "glslUnder_wXs", "the surface point the refracted sun ray through x came from: go back up along L_s by d / cos θ_s metres")],
          [r`\eta = 1/1.333`, tx(t, "glslUnder_wEtaIn", "air to water. (1 − η)·∇h is how far a surface slope ∇h tilts the refracted ray, per metre of depth")],
          [r`\mathbf H`, tx(t, "glslUnder_wH", "the Hessian of the surface height (its second derivatives) at x_s: how fast the slope changes, which is what focuses or spreads a beam")],
          [r`0.12`, tx(t, "glslUnder_w012", "a floor on the area ratio. At a perfect focus the determinant is 0 and the intensity infinite; real sunlight is a disc 0.5° wide, which blurs every focus, so the peak is capped at 1/0.12 ≈ 8 times flat-water light")],
        ]}
        glsl={`vec2 xs = x.xz + Ls.xz * (d / Ls.y);\nmat2 M = mat2(1.0) + d * (1.0 - ETA) * hessianRes(xs, res);\nfloat c = 1.0 / max(abs(determinant(M)), 0.12);`}>
        {r`\mathbf x_s = \mathbf x_{xz} - \mathbf L_{s,xz}\,\frac{d}{\cos\theta_s} \qquad c(\mathbf x) = \frac{1}{\big|\det\!\big(\mathbf I + d\,(1-\eta)\,\mathbf H(\mathbf x_s)\big)\big|}`}
      </Equation>
      <p>
        {tx(t, "glslUnder_filterBody",
          "Thirty-two samples along 60 m are almost 2 m apart, while ripples focus light into lines a few centimetres wide. Sampling such a pattern that sparsely gives noise, not shafts. So the Hessian leaves out waves shorter than a few times the resolution res, the same fade the Water Lab uses for distant waves, with res = 0.35·Δt + 0.02·d. The first term matches the step length. The second softens the pattern with depth, as the sun's width and forward scattering blur the real shafts; 0.02 was chosen by comparing with underwater footage. The bed uses the same factor, filtered by the pixel's size on the bed instead, so the shafts land exactly on their caustics.")}
      </p>

      <UnderwaterLabFigure t={t} />

      <H2>{tx(t, "glslUnder_passesTitle", "Putting it together")}</H2>
      <p>
        {tx(t, "glslUnder_passesBody",
          "The frame has the Water Lab's structure. First the sky probe. Then a full-screen pass for everything that is not the surface: it traces the view ray to the bed, shades the bed with its caustics, applies the march in front of it, and writes the bed's depth. Rays that reach the surface before the bed skip all of that, since the surface mesh will cover them. Then the surface mesh draws the underside, with its own march from the eye to the surface. Inside the underside, the reflected ray does not get a full march: it takes one analytic step lit at the depth halfway along its first 20 m, and no shafts. That view is already dimmed by its own path, so the difference does not show.")}
      </p>
      <p>
        {tx(t, "glslUnder_crossBody",
          "The camera can cross the surface. Each frame, the lab compares the camera's height with the Gerstner height right above it and picks the Water Lab's shaders or the underwater ones. The camera is kept at least 15 cm below the passing wave, or 30 cm above it, so the lens never straddles the surface: drawing the waterline across the lens needs the surface's height at the lens, and a split frame.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "glslUnder_tip", "Games usually march the scattering at lower resolution, or into a 3D grid of cells aligned with the camera (froxels) shared by every pixel, then blur and upsample it. They also add what this lab leaves out: the blur of objects seen through turbid water, particles drifting in front of the camera, a waterline drawn across the lens when it is half submerged, and shadows in the shafts cast by rocks, boats and swimmers. Light scattered more than once is often faked by lowering the extinction used for the light's path down.")}
      </Callout>

      <KeyIdeas t={t} id="glslUnder" items={[
        tx(t, "glslUnder_k1", "From below, the sky fits inside a cone of ±48.6° (Snell's window). Beyond the critical angle arcsin(1/1.333), the surface reflects everything. The exact Fresnel equations reach F = 1 there, where Schlick's approximation does not."),
        tx(t, "glslUnder_k2", "Water absorbs (σa, per colour) and scatters (σs, grey). Their sum σt dims every path as e^(−σt·s), and the light scattered in along the path gives distant water its colour."),
        tx(t, "glslUnder_k3", "Single scattering sums σs·(sunlight·caustic·phase + skylight/4π) along the ray, one step at a time, with each step integrated exactly as (1 − e^(−σt·Δt))/σt and jittered per pixel."),
        tx(t, "glslUnder_k4", "Light shafts are the caustics seen from the side: at each sample, trace the refracted sun ray back to the surface and use the inverse area change det(I + d(1 − η)H)."),
        tx(t, "glslUnder_k5", "Filter the pattern to what the samples can resolve: drop waves shorter than a few times the step length, and more with depth."),
      ]} />
    </Article>
  );
}
