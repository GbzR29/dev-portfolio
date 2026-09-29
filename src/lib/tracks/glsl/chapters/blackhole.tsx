"use client";

// "Black Holes: Bending Light": tracing curved light paths through a
// Schwarzschild black hole, with a thin accretion disk shaded as a blackbody.

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RayPathsFigure } from "@/components/lesson/figures/blackhole/RayPathsFigure";
import { DopplerFigure } from "@/components/lesson/figures/blackhole/DopplerFigure";
import { BlackHoleLabFigure } from "@/components/lesson/figures/blackhole/BlackHoleLabFigure";

const r = String.raw;

export function BlackHoleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslBh_intro",
          "In 2014 the film Interstellar showed a black hole wrapped in a glowing disk whose far side bends up over the top and down under the bottom of the hole. That image came from a renderer written with the physicist Kip Thorne, and five years later the Event Horizon Telescope photographed a real one, M87*: a dark shadow in a lopsided ring of light. Both pictures follow from one idea that fits in a fragment shader. Light near a black hole does not travel in straight lines, so instead of stepping along a straight ray, the shader integrates the path light really takes. This chapter derives that path, finds the shadow and the photon sphere, and shades the disk with the temperature, Doppler shift and gravitational redshift of its gas.")}
      </Lead>

      <H2>{tx(t, "glslBh_planTitle", "What the shader does")}</H2>
      <p>
        {tx(t, "glslBh_planBody",
          "Like every ray tracer, the shader works backwards: for each pixel it follows, from the camera outwards, the path along which light would have reached that pixel. The raymarching chapter walked along a straight line; here the walker's direction changes at every step, following an equation of motion. Every path ends in one of three ways. It falls through the horizon, and the pixel is black, since nothing comes out of there. It crosses the disk, which adds the disk's glow and dims whatever lies behind. Or it escapes to a great distance, and the pixel shows the sky in the direction the path finally points to, not the one it started with. That last detail is all lensing is: the sky is looked up in a bent direction.")}
      </p>

      <H3>{tx(t, "glslBh_unitsTitle", "Units: the Schwarzschild radius")}</H3>
      <p>
        {tx(t, "glslBh_unitsBody",
          "A non-spinning black hole of mass M has one length that sets every scale around it, the Schwarzschild radius: the radius of the horizon. For the Sun it would be 2.95 km; for M87*, 6.5 billion Suns, it is about 128 times the Earth–Sun distance. The shader measures every length in units of rₛ and every speed in units of c, so rₛ = 1 and c = 1, and the same code draws a black hole of any mass. The unit of time becomes rₛ/c: 10 microseconds for a Sun-mass hole, almost 18 hours for M87*.")}
      </p>
      <Equation label={tx(t, "glslBh_rsLabel", "The Schwarzschild radius")}
        where={[
          [r`G`, tx(t, "glslBh_wG", "Newton's gravitational constant, 6.674 × 10⁻¹¹ m³/(kg·s²)")],
          [r`M`, tx(t, "glslBh_wM", "the black hole's mass")],
          [r`c`, tx(t, "glslBh_wC", "the speed of light, 2.998 × 10⁸ m/s")],
        ]}>
        {r`r_s = \frac{2GM}{c^2} \qquad\Rightarrow\qquad GM = \tfrac12 \ \text{ in units where } r_s = c = 1`}
      </Equation>

      <H2>{tx(t, "glslBh_orbitTitle", "The path of light")}</H2>
      <p>
        {tx(t, "glslBh_orbitBody",
          "Anything moving past a single mass, a planet or a ray of light, stays in one plane through the mass's centre, since the pull points to the centre and has no sideways part. In that plane, describe the path by the angle φ around the centre and, instead of the distance r, its inverse u = 1/r. For a planet, Newton's laws then give a famous equation whose solutions are the ellipses, parabolas and hyperbolas of orbits. Einstein's general relativity changes it, and for light, which has no mass, the Newtonian part drops out altogether and only the relativistic correction remains:")}
      </p>
      <Equation label={tx(t, "glslBh_binetLabel", "The orbit equation of light around a Schwarzschild black hole")}
        where={[
          [r`\varphi`, tx(t, "glslBh_wPhi", "the angle of the point around the centre, in the plane of the path")],
          [r`u = 1/r`, tx(t, "glslBh_wU", "the inverse of the distance from the centre")],
          [r`u''`, tx(t, "glslBh_wUpp", "the second derivative of u with respect to φ: how fast the path's inverse distance bends as it goes round")],
          [r`\tfrac32\,r_s\,u^2`, tx(t, "glslBh_wTerm", "gravity's effect on light. It grows with u², so it matters only close to the hole")],
        ]}>
        {r`\frac{d^2u}{d\varphi^2} + u = \tfrac32\,r_s\,u^2`}
      </Equation>
      <p>
        {tx(t, "glslBh_straightBody",
          "Without the right-hand side, u'' + u = 0 has the solution u = sin(φ)/b: a straight line that passes the centre at distance b, the impact parameter. The right-hand side pulls the path inwards, more strongly the closer it gets. This equation is exact for a black hole that does not spin (it comes from the Schwarzschild solution of Einstein's equations), not an approximation for weak gravity.")}
      </p>

      <H3>{tx(t, "glslBh_forceTitle", "Turning it into a force")}</H3>
      <p>
        {tx(t, "glslBh_forceBody",
          "A shader works in x, y, z, not in u and φ, and a ray's plane is different for every pixel. The trick, popularised by Riccardo Antonelli's renderer Starless, is to invent a central force whose orbits have exactly this shape, and integrate it in 3D like any particle simulation. For a force of size F(r) towards the centre, Newtonian mechanics gives u'' + u = F/(h²u²), where h = |x × v| is the angular momentum per unit mass, which a central force never changes. Choosing F = (3/2)·rₛ·h²·u⁴, that is (3/2)·rₛ·h²/r⁴, turns the right-hand side into (3/2)·rₛ·u², the equation above:")}
      </p>
      <Equation label={tx(t, "glslBh_accLabel", "The acceleration the shader integrates")}
        where={[
          [r`\mathbf x`, tx(t, "glslBh_wX", "the point on the path, relative to the hole's centre, in units of rₛ")],
          [r`\mathbf v`, tx(t, "glslBh_wV", "the velocity of the point along the path. It is a bookkeeping velocity, not the speed of light: only the shape of the path is physical")],
          [r`h = \lvert\mathbf x \times \mathbf v\rvert`, tx(t, "glslBh_wH", "the angular momentum per unit mass, computed once per pixel from the starting point and direction, and constant after that")],
          [r`r = \lvert\mathbf x\rvert`, tx(t, "glslBh_wR", "the distance from the centre")],
        ]}
        glsl={`vec3 L = cross(x, v);\nfloat h2 = dot(L, L);                       // once per pixel\nvec3 accel(vec3 x) {\n  float r2 = dot(x, x), r = sqrt(r2);\n  return -1.5 * h2 * x / (r2 * r2 * r);\n}`}>
        {r`\mathbf a = -\tfrac32\,r_s\,h^2\,\frac{\mathbf x}{r^5}`}
      </Equation>
      <p>
        {tx(t, "glslBh_newtonBody",
          "For comparison, Newton's gravity acting on a particle that flies at the speed of light would be a = −GM·x/r³ = −½·x/r³. It bends light too, but half as much far from the hole, and it has no photon sphere. Arthur Eddington's measurement of starlight grazing the Sun during the 1919 eclipse found the larger, Einsteinian value, 1.75 arc seconds. The lab lets you switch between no bending, Newton's and Einstein's.")}
      </p>

      <H3>{tx(t, "glslBh_rk4Title", "Integrating with RK4")}</H3>
      <p>
        {tx(t, "glslBh_rk4Body",
          "Near the hole the path bends sharply, far from it it is nearly straight, so the step is proportional to the distance: Δt = k·r. Simple Euler steps would slowly spiral paths in or out near the photon sphere, where errors grow fastest, so the shader uses the classic fourth-order Runge–Kutta method. It evaluates the acceleration four times per step, at the start, twice at the middle and at the end, each time using the previous estimate to look ahead, and averages them with weights 1, 2, 2, 1:")}
      </p>
      <Equation label={tx(t, "glslBh_rk4Label", "One RK4 step of x″ = a(x)")}
        where={[
          [r`\Delta t = k\,r`, tx(t, "glslBh_wDt", "the step, growing with the distance r (the 'step k' slider, 0.06 by default)")],
          [r`\mathbf k_1 \dots \mathbf k_4`, tx(t, "glslBh_wK", "four estimates of the acceleration: at the start, at the midpoint (twice, each using the estimate before it) and at the end of the step")],
          [r`\mathbf v_1 \dots \mathbf v_4`, tx(t, "glslBh_wVi", "the matching estimates of the velocity: v₁ = v, v₂ = v + ½Δt·k₁, v₃ = v + ½Δt·k₂, v₄ = v + Δt·k₃")],
        ]}
        glsl={`vec3 k1x = v,                  k1v = accel(x);\nvec3 k2x = v + 0.5*dt*k1v,     k2v = accel(x + 0.5*dt*k1x);\nvec3 k3x = v + 0.5*dt*k2v,     k3v = accel(x + 0.5*dt*k2x);\nvec3 k4x = v + dt*k3v,         k4v = accel(x + dt*k3x);\nx += dt/6.0 * (k1x + 2.0*k2x + 2.0*k3x + k4x);\nv += dt/6.0 * (k1v + 2.0*k2v + 2.0*k3v + k4v);`}>
        {r`\mathbf x \mathrel{+}= \tfrac{\Delta t}{6}\,(\mathbf v_1 + 2\mathbf v_2 + 2\mathbf v_3 + \mathbf v_4) \qquad \mathbf v \mathrel{+}= \tfrac{\Delta t}{6}\,(\mathbf k_1 + 2\mathbf k_2 + 2\mathbf k_3 + \mathbf k_4)`}
      </Equation>
      <p>
        {tx(t, "glslBh_endBody",
          "The loop stops when r < 1 (the horizon), when the path is far away (beyond the camera and the disk) and heading outwards, or after 400 steps, which only happens to rays circling the photon sphere and is drawn black: they would have fallen in or escaped at an angle too thin to see.")}
      </p>

      <RayPathsFigure t={t} />

      <H2>{tx(t, "glslBh_sphereTitle", "The photon sphere and the shadow")}</H2>
      <p>
        {tx(t, "glslBh_sphereBody",
          "A circular orbit has u constant, so u'' = 0 and the orbit equation reads u = (3/2)·rₛ·u², whose solution is r = 1.5 rₛ. At that radius light can circle the hole, which is why it is called the photon sphere. The orbit is unstable: a path a hair inside it spirals into the horizon, a hair outside it unwinds back to space, after as many turns as it happened to be close.")}
      </p>
      <p>
        {tx(t, "glslBh_critBody",
          "Which rays fall in? Multiplying the orbit equation by 2u' and integrating once gives an equation for the slope of the path, whose constant is fixed by the straight line far away, 1/b². A ray coming in turns back out where u' = 0, so it escapes only if 1/b² is larger than u² − rₛu³ at every u it meets. That expression is largest at u = 2/(3rₛ), the photon sphere, where it equals 4/(27rₛ²). So every ray with an impact parameter below the critical value falls in:")}
      </p>
      <Equation label={tx(t, "glslBh_critLabel", "The critical impact parameter")}
        where={[
          [r`u'`, tx(t, "glslBh_wUp", "du/dφ, the slope of the path in the (φ, u) description")],
          [r`b`, tx(t, "glslBh_wB", "the impact parameter: how far from the centre the ray would pass if it went straight")],
          [r`b_c`, tx(t, "glslBh_wBc", "the critical impact parameter: rays with b < b_c end in the horizon")],
        ]}>
        {r`u'^2 = \frac1{b^2} - u^2 + r_s u^3 \qquad b_c = \frac{3\sqrt3}{2}\,r_s \approx 2.598\,r_s`}
      </Equation>
      <p>
        {tx(t, "glslBh_shadowBody",
          "Seen from far away, the black hole blocks every ray inside a disk of radius b_c: its shadow is 2.6 times as wide as the horizon itself. That is what the Event Horizon Telescope measured, and from the shadow's size, the mass of M87*. A camera close to the hole sees the shadow larger, and what it measures as an angle is not a coordinate angle: space near the hole is stretched. A camera hovering at distance D sees the shadow's edge at an angle α from the centre with sin α = b_c·√(1 − rₛ/D)/D, and at D = 1.5 rₛ it covers half the sky.")}
      </p>
      <p>
        {tx(t, "glslBh_camBody",
          "The same stretch sets how the shader starts each ray. The pixel gives a direction n as the hovering camera measures it. Its part along the radius, n_r, carries over, but its sideways part must be divided by √(1 − rₛ/D) to give the path the impact parameter that direction really has. Without it, rays near a close camera would be aimed slightly wrong and the shadow would come out the wrong size.")}
      </p>
      <Equation label={tx(t, "glslBh_initLabel", "Starting velocity from the camera's direction")}
        where={[
          [r`\mathbf n`, tx(t, "glslBh_wN", "the pixel's direction, a unit vector, as measured by the camera")],
          [r`\hat{\mathbf r}`, tx(t, "glslBh_wRhat", "the unit vector from the hole to the camera")],
          [r`n_r = \mathbf n\cdot\hat{\mathbf r}`, tx(t, "glslBh_wNr", "the radial part of n; n − n_r·r̂ is its sideways part")],
          [r`D`, tx(t, "glslBh_wD", "the camera's distance from the centre (the 'distance D' slider)")],
        ]}
        glsl={`float nr = dot(n, rh);\nvec3 v = nr * rh + (n - nr * rh) / sqrt(1.0 - 1.0 / D);`}>
        {r`\mathbf v_0 = n_r\,\hat{\mathbf r} + \frac{\mathbf n - n_r\,\hat{\mathbf r}}{\sqrt{1 - r_s/D}}`}
      </Equation>

      <H2>{tx(t, "glslBh_diskTitle", "The accretion disk")}</H2>
      <p>
        {tx(t, "glslBh_diskBody",
          "Gas falling towards a black hole almost never falls straight in. It has some sideways motion, so it settles into orbit, and collisions flatten it into a thin disk in which each ring orbits slightly faster than the one outside it. Friction between the rings heats the gas and lets it slowly spiral inwards, until it reaches the innermost stable circular orbit, the ISCO, at 3 rₛ for a black hole that does not spin. Closer than that no circular orbit is stable, and the gas plunges in within an orbit or two. So the lab's disk runs from 3 rₛ to an outer edge you choose.")}
      </p>
      <p>
        {tx(t, "glslBh_crossBody",
          "The disk is infinitely thin, in the plane y = 0. After each step, if the path's y changed sign, the step crossed the plane. Along the step the path is nearly straight, so the crossing point is found by linear interpolation, and if its distance from the axis is between the disk's edges, the ray has hit the disk. The loop does not stop there: the disk is partly transparent, and a ray can cross the plane again after bending round the hole. Bending is also what makes the famous arc over the shadow. A ray aimed just above the hole passes over it, bends down behind it and meets the far side of the disk from above, so the far side appears lifted up over the top. A ray aimed just below the hole does the same underneath and shows the far side's lower face beneath the shadow, and rays that bend further still, half-way or all the way round, add ever thinner rings hugging the shadow's edge.")}
      </p>
      <Equation label={tx(t, "glslBh_crossLabel", "Where the step crossed the plane")}
        where={[
          [r`\mathbf x_0, \mathbf x_1`, tx(t, "glslBh_wX01", "the path's positions before and after the step")],
          [r`f`, tx(t, "glslBh_wF", "the fraction of the step at which y reaches 0")],
        ]}
        glsl={`if (x.y * x1.y < 0.0) {\n  float f = x.y / (x.y - x1.y);\n  vec3 p = mix(x, x1, f);\n  float rp = length(p.xz);\n  if (rp > uDiskIn && rp < uDiskOut) { /* shade the disk */ }\n}`}>
        {r`f = \frac{y_0}{y_0 - y_1} \qquad \mathbf p = \mathbf x_0 + f\,(\mathbf x_1 - \mathbf x_0)`}
      </Equation>

      <H3>{tx(t, "glslBh_tempTitle", "How hot the disk is")}</H3>
      <p>
        {tx(t, "glslBh_tempBody",
          "Each ring of gas that moves inwards falls deeper into the hole's gravity and releases energy as heat, which it radiates from its surface. Shakura and Sunyaev (1973) worked out how much: per unit area, the flux falls off as r⁻³, times a factor that goes to zero at the inner edge, because at the ISCO the gas stops rubbing against anything further in. A surface that radiates like a blackbody gives off σT⁴ per unit area (the Stefan–Boltzmann law), so its temperature is the fourth root of the flux:")}
      </p>
      <Equation label={tx(t, "glslBh_tempLabel", "The thin-disk temperature profile")}
        where={[
          [r`F(r)`, tx(t, "glslBh_wFlux", "the power the disk radiates per unit area at radius r")],
          [r`\sigma`, tx(t, "glslBh_wSigma", "the Stefan–Boltzmann constant: a blackbody at temperature T radiates σT⁴ per unit area")],
          [r`r_{in}`, tx(t, "glslBh_wRin", "the inner edge of the disk, the ISCO")],
          [r`T_\ast`, tx(t, "glslBh_wTstar", "a scale temperature. The shader divides by the profile's maximum, reached at r = (49/36)·r_in, so the 'peak temperature' slider sets the hottest ring directly")],
        ]}
        glsl={`float x = r / uDiskIn;\nfloat T = uTemp * pow(x, -0.75) * pow(1.0 - inversesqrt(x), 0.25) / 0.48788;`}>
        {r`F(r) \propto \frac{1}{r^3}\Big(1 - \sqrt{\tfrac{r_{in}}{r}}\Big) = \sigma T^4 \qquad\Rightarrow\qquad T(r) = T_\ast \Big(\frac{r}{r_{in}}\Big)^{-3/4}\Big(1 - \sqrt{\tfrac{r_{in}}{r}}\Big)^{1/4}`}
      </Equation>
      <p>
        {tx(t, "glslBh_hotBody",
          "A real disk around a black hole a few times the Sun's mass is millions of kelvin hot and shines in X-rays; around a supermassive one it peaks in the ultraviolet. To give the disk visible colours, the lab lets you choose the peak temperature, between 2500 K and 20 000 K, like Interstellar's artists did. Everything else in this chapter, the colour shifts included, is computed as it would be at any temperature.")}
      </p>

      <H3>{tx(t, "glslBh_bbTitle", "The colour of a blackbody")}</H3>
      <p>
        {tx(t, "glslBh_bbBody",
          "A blackbody's spectrum is Planck's law. To turn a spectrum into a colour, weigh it with the three CIE colour-matching functions x̄, ȳ, z̄, which describe how strongly the eye's receptors respond to each wavelength, and sum over the visible range. That gives the CIE XYZ coordinates of the colour, and a fixed 3 × 3 matrix turns XYZ into linear sRGB. The lab does this on the CPU (with Wyman, Sloan and Shirley's 2013 fit of the colour-matching functions) for 256 temperatures from 800 K to 80 000 K on a logarithmic scale, and uploads the result as a 256 × 1 texture that the shader reads with one lookup:")}
      </p>
      <Equation label={tx(t, "glslBh_planckLabel", "Planck's law, and the colour it makes")}
        where={[
          [r`B_\lambda(T)`, tx(t, "glslBh_wB_l", "the radiance of a blackbody at temperature T, per unit wavelength")],
          [r`\lambda`, tx(t, "glslBh_wLambda", "the wavelength, summed from 380 to 780 nm in 5 nm steps")],
          [r`h, k`, tx(t, "glslBh_wHk", "Planck's constant and Boltzmann's constant; hc/k = 1.4388 × 10⁻² m·K")],
          [r`\bar x, \bar y, \bar z`, tx(t, "glslBh_wCmf", "the CIE 1931 colour-matching functions. Y is the luminance, how bright the colour looks")],
        ]}
        glsl={`vec3 blackbody(float T) {\n  float s = (log2(T) - log2(800.0)) / (log2(80000.0) - log2(800.0));\n  return texture(uBB, vec2((0.5 + s * 255.0) / 256.0, 0.5)).rgb;\n}`}>
        {r`B_\lambda(T) = \frac{2hc^2}{\lambda^5}\,\frac{1}{e^{hc/\lambda kT} - 1} \qquad X = \sum_\lambda B_\lambda\,\bar x(\lambda) \quad Y = \sum_\lambda B_\lambda\,\bar y(\lambda) \quad Z = \sum_\lambda B_\lambda\,\bar z(\lambda)`}
      </Equation>
      <p>
        {tx(t, "glslBh_bbNote",
          "The texture keeps the absolute brightness, scaled so that 6500 K has luminance 1: a 3000 K disk is far dimmer than a 10 000 K one, as it should be. Above 80 000 K the shader extrapolates, since the visible part of a very hot spectrum just grows in proportion to T.")}
      </p>

      <H3>{tx(t, "glslBh_opacityTitle", "Opacity and turbulence")}</H3>
      <p>
        {tx(t, "glslBh_opacityBody",
          "The gas is not a solid sheet. Each crossing gives it an opacity α between 0 and 1, and Kirchhoff's law of thermal radiation says that a layer which absorbs a fraction α of the light going through it also emits α times the blackbody radiance of its temperature. A ray that crosses the thin layer at a slant goes through more gas: with the angle i between the ray and the disk's axis, the path is 1/|cos i| times longer, and the transmitted fraction (1 − α) is raised to that power. The layers along a ray are then composited front to back, exactly like the volumetric effects of earlier chapters:")}
      </p>
      <Equation label={tx(t, "glslBh_compLabel", "One crossing of the disk")}
        where={[
          [r`\alpha_0`, tx(t, "glslBh_wA0", "the opacity of the gas straight through the disk, from the 'opacity' slider times the turbulence pattern")],
          [r`\cos i`, tx(t, "glslBh_wCosI", "the y part of the ray's unit direction at the crossing (clamped away from 0 for grazing rays)")],
          [r`\tau`, tx(t, "glslBh_wTau", "the transmittance: the fraction of light from further along the path that still gets through. It starts at 1")],
          [r`B(gT)`, tx(t, "glslBh_wBgT", "the blackbody colour at the temperature the camera sees, explained in the next section")],
        ]}
        glsl={`float alpha = 1.0 - pow(1.0 - a0, 1.0 / max(abs(dir.y), 0.03));\ncol += trans * alpha * blackbody(g * T);\ntrans *= 1.0 - alpha;`}>
        {r`\alpha = 1 - (1 - \alpha_0)^{1/\lvert\cos i\rvert} \qquad \text{color} \mathrel{+}= \tau\,\alpha\,B(gT) \qquad \tau \mathrel{\times}= 1 - \alpha`}
      </Equation>
      <p>
        {tx(t, "glslBh_gasBody",
          "The gas pattern is fractal noise read on a cylinder, at (cos θ, sin θ, r), where θ is the angle around the axis. The cylinder is thin around its circumference and long along r, so a noise cell spans a long arc but a short stretch of radius, and the pattern comes out as streaks along the orbit. The gas turns at the Keplerian rate Ω = √(GM/r³), which is exact for circular orbits in Schwarzschild's geometry when time is measured by a distant clock. Since the inner rings turn faster, the pattern shears into ever tighter spirals, the same endless stretch the rivers chapter met with flow maps, and the same cure works: two copies of the pattern on clocks half a period apart, cross-faded with triangle weights.")}
      </p>
      <Equation label={tx(t, "glslBh_omegaLabel", "The rotating gas")}
        where={[
          [r`\Omega(r)`, tx(t, "glslBh_wOmega", "the angular velocity of the ring at r, in radians per rₛ/c. At the ISCO a turn takes 46 rₛ/c")],
          [r`\varphi_k`, tx(t, "glslBh_wPhk", "the phase of copy k, from 0 to 1 over a period P of 30 rₛ/c. The lab's 'time scale' sets how many rₛ/c pass per second")],
          [r`\theta`, tx(t, "glslBh_wTheta", "the angle of the crossing point around the axis. The pattern is read where the gas was φ_k·P earlier")],
        ]}
        glsl={`float a = th + omega * ph * uPeriod;\nfloat n = fbm(vec3(cos(a) * 2.6, sin(a) * 2.6, r * 1.7));`}>
        {r`\Omega = \sqrt{\frac{GM}{r^3}} = \sqrt{\frac{1}{2r^3}} \qquad \text{gas}_k = \text{fbm}\big(\cos(\theta + \Omega\,\varphi_k P),\ \sin(\theta + \Omega\,\varphi_k P),\ r\big)`}
      </Equation>

      <H2>{tx(t, "glslBh_shiftTitle", "Doppler beaming and gravitational redshift")}</H2>
      <p>
        {tx(t, "glslBh_shiftBody",
          "At the ISCO the gas orbits at half the speed of light. Light from gas moving towards the camera arrives with a higher frequency than it was emitted with, and light from gas moving away arrives with a lower one: the Doppler effect. Independently, light climbing out of a gravitational well loses energy, because a clock deep in the well runs slower than one far away: the gravitational redshift. Both are summed up in one number per crossing, the ratio g of the frequency the camera sees to the frequency the gas emitted.")}
      </p>
      <Equation label={tx(t, "glslBh_gLabel", "The frequency ratio for gas orbiting at r")}
        where={[
          [r`\sqrt{1 - r_s/r}`, tx(t, "glslBh_wLapse", "how fast a clock hovering at r runs, compared with one far away: the gravitational redshift")],
          [r`\sqrt{\tfrac{1 - 3r_s/2r}{1 - r_s/r}}`, tx(t, "glslBh_wGamma", "1/γ, the time dilation of the orbiting gas as the hovering clock sees it: its orbital speed there is β = √(rₛ/2(r − rₛ))")],
          [r`\Omega\,\ell`, tx(t, "glslBh_wOmL", "the Doppler term: the orbit's angular velocity times the photon's angular momentum about the disk's axis. Positive when the photon leaves in the direction the gas is moving, which raises g")],
          [r`\ell`, tx(t, "glslBh_wEll", "the photon's angular momentum about the axis, per unit energy. It never changes along the path, so it is computed once per pixel: ℓ = −(x × v)·ŷ, with a minus sign because the shader follows the light backwards")],
          [r`\sqrt{1 - r_s/D}`, tx(t, "glslBh_wCam", "the camera's own clock rate: a camera deep in the well sees all incoming light blueshifted")],
        ]}
        glsl={`float gGrav = sqrt(1.0 - 1.0 / r) / sqrt(1.0 - 1.0 / D);\nfloat gDop  = sqrt((1.0 - 1.5 / r) / (1.0 - 1.0 / r)) / (1.0 - omega * ell);\nfloat g = gGrav * gDop;`}>
        {r`g = \frac{\nu_{\text{seen}}}{\nu_{\text{emitted}}} = \underbrace{\frac{\sqrt{1 - r_s/r}}{\sqrt{1 - r_s/D}}}_{\text{gravity}}\ \cdot\ \underbrace{\sqrt{\frac{1 - 3r_s/2r}{1 - r_s/r}}\ \frac{1}{1 - \Omega\,\ell}}_{\text{Doppler}}`}
      </Equation>
      <p>
        {tx(t, "glslBh_liouvilleBody",
          "How does g change the colour? A photon's frequency is multiplied by g, and a result of relativity (Liouville's theorem applied to photons) says that the radiance per unit frequency divided by the frequency cubed, I_ν/ν³, is the same for every observer along the ray. Put a blackbody spectrum through both rules and it comes out as a blackbody again, at the temperature gT. So the shader does not need to shift a spectrum: it reads the blackbody texture at g·T, and gets the shifted colour and the shifted brightness in one lookup. The brightness change is large. The total power of a blackbody grows as T⁴, so a side with g = 1.4 looks about 4 times brighter than it would at rest and a side with g = 0.5 about 16 times dimmer: this is Doppler beaming, and it is why the EHT's ring and Interstellar's disk are both lopsided.")}
      </p>
      <Equation label={tx(t, "glslBh_invLabel", "Why a shifted blackbody is a blackbody")}
        where={[
          [r`I_\nu`, tx(t, "glslBh_wInu", "the radiance per unit frequency: power per area, per solid angle, per frequency")],
          [r`B_\nu(T)`, tx(t, "glslBh_wBnu", "Planck's law per unit frequency, 2hν³/c² · 1/(e^(hν/kT) − 1)")],
        ]}>
        {r`\frac{I_\nu}{\nu^3} = \text{const} \quad\Rightarrow\quad I_{\nu}^{\text{seen}} = g^3\,B_{\nu/g}(T) = B_\nu(gT)`}
      </Equation>
      <p>
        {tx(t, "glslBh_dopNote",
          "Interstellar's makers turned this effect down on purpose: a disk that is bright blue on one side and dull red on the other seemed too confusing for a film audience. The lab lets you switch each part off to see what it does.")}
      </p>

      <DopplerFigure t={t} />

      <H2>{tx(t, "glslBh_skyTitle", "The sky behind")}</H2>
      <p>
        {tx(t, "glslBh_skyBody",
          "A ray that escapes looks up the sky in its final direction. The lab's star field is procedural: the direction, scaled up, falls in a cell of a 3D grid, a hash of the cell decides whether it holds a star, and the star sits at a random point of the cell, pushed onto the sphere. Its brightness is a steep power of another hash, so a few stars are bright and most are faint, and its tint is a blackbody colour from the same texture, between 3200 K and 12 000 K. A faint band of galaxy with a dark dust lane finishes the sky. The 'sky grid' option replaces it with lines every 15° of latitude and longitude on four coloured quarters, which shows the lensing plainly.")}
      </p>
      <p>
        {tx(t, "glslBh_ringBody",
          "Watch what happens near the shadow. A star exactly behind the hole is seen as a ring, the Einstein ring, and every star appears twice, once on each side of the hole, with a thin second image close to the shadow's edge. Just outside the shadow the whole sky is squeezed into ever thinner rings: light that went half-way round the hole, all the way round, and so on. Lensing magnifies stars but does not make them brighter per pixel. The same invariance of I_ν/ν³ means that, with g = 1, surface brightness is conserved: a magnified star covers more pixels at the same brightness, which is exactly what the shader draws when it reads the sky in the bent direction.")}
      </p>

      <BlackHoleLabFigure t={t} />

      <Callout type="tip" t={t}>
        {tx(t, "glslBh_tip", "Real black holes spin, and a spinning (Kerr) black hole drags space round with it: its shadow is flattened on one side and its ISCO moves in to as little as 0.5 rₛ. Its light paths have no simple force form, so renderers integrate the full geodesic equations, as the team behind Interstellar did (James, von Tunzelmann, Franklin and Thorne, 2015). They also traced a narrow beam per pixel, not a single ray, to keep the tiny images near the shadow smooth. The step count dominates the cost here: raise 'step k' to see the rings break up, and look at the 'steps' view to see where the work goes.")}
      </Callout>

      <KeyIdeas t={t} id="glslBh" items={[
        tx(t, "glslBh_k1", "A black hole is rendered by tracing each pixel's light backwards along a bent path: it ends in the horizon (black), on the disk (its glow), or in the sky, looked up in the path's final direction."),
        tx(t, "glslBh_k2", "Light around a Schwarzschild hole obeys u″ + u = (3/2)·rₛ·u². The same paths come from the central force a = −(3/2)·rₛ·h²·x/r⁵, integrated in 3D with RK4 and a step proportional to r."),
        tx(t, "glslBh_k3", "Light can circle the hole at the photon sphere, 1.5 rₛ. Rays with an impact parameter below 3√3/2 rₛ ≈ 2.6 rₛ fall in, so the shadow is 2.6 times the horizon's size."),
        tx(t, "glslBh_k4", "The thin disk runs from the ISCO at 3 rₛ outwards, with T ∝ r^(−3/4)·(1 − √(r_in/r))^(1/4). Rays bent round the hole show its far side over and under the shadow; the gas is partly transparent, so a ray keeps going after a crossing."),
        tx(t, "glslBh_k5", "Doppler shift and gravitational redshift combine into g. Since I_ν/ν³ is invariant, a blackbody at T is seen as a blackbody at gT: one texture lookup gives the shifted colour and brightness."),
      ]} />
    </Article>
  );
}
