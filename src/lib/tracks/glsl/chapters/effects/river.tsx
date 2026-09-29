// src/lib/tracks/glsl/chapters/effects/river.tsx
"use client";

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FlowPhasesFigure } from "@/components/lesson/figures/river/FlowPhasesFigure";
import { RiverLabFigure } from "@/components/lesson/figures/river/RiverLabFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Rivers & lakes: flow maps
// ═════════════════════════════════════════════════════════════════════════════

export function RiverContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslRiver_intro",
          "The oceans and the pool of the last chapters have waves that travel through the water while the water itself stays put. A river is the other way round: the water moves, and it carries its small ripples and its foam with it, fast and rough in the rapids, torn white behind every rock, almost still where the river opens into a lake. Games draw this with a flow map, a texture that stores a velocity at every point of the water. Valve introduced the technique for Portal 2 (Alex Vlachos, 2010), and it still drives rivers, lava and even clouds in most engines. This chapter builds it, computes a flow map from the shape of a river, and ends in a calm lake that mirrors its valley.")}
      </Lead>

      <H2>{tx(t, "glslRiver_scrollTitle", "Scrolling a texture")}</H2>
      <p>
        {tx(t, "glslRiver_scrollBody",
          "The oldest way to make water move is to slide its texture: every frame, read the ripple texture a little further upstream. A point p on the surface then shows what was at p − v·t when the animation started, so the whole pattern travels at the velocity v:")}
      </p>
      <Equation label={tx(t, "glslRiver_scrollLabel", "A scrolling texture")}
        where={[
          [r`\mathbf p`, tx(t, "glslRiver_wP", "the point on the water, (x, z) in metres")],
          [r`\mathbf v`, tx(t, "glslRiver_wV", "the water's velocity there, in m/s")],
          [r`t`, tx(t, "glslRiver_wT", "the time since the animation started, in seconds")],
          [r`s`, tx(t, "glslRiver_wTile", "the tile size: the texture repeats every s metres")],
        ]}
        glsl={`vec4 ripples = texture(uRipples, (p - v * uTime) / s);`}>
        {r`\text{uv}(\mathbf p, t) = \frac{\mathbf p - \mathbf v\,t}{s}`}
      </Equation>
      <p>
        {tx(t, "glslRiver_stretchBody",
          "That works for a canal where all the water moves together. A river does not: it runs fast in the middle and slowly by the banks, and it splits around rocks. Store a different v at every point, a flow map, and the formula breaks down. Take two points a short distance apart whose velocities differ by Δv. The texture coordinates they read drift apart by Δv·t, so the patch of texture between them is stretched further every second, without end. After a minute, ripples that started round are long thin streaks.")}
      </p>

      <H2>{tx(t, "glslRiver_phasesTitle", "Two phases")}</H2>
      <p>
        {tx(t, "glslRiver_resetBody",
          "The stretching grows with t, so the fix is to never let t grow large. Run a clock that restarts every T seconds: the phase φ = fract(t / T) climbs from 0 to 1 and drops back to 0. Now the texture is never carried further than v·T from where it started, and the stretch stays bounded. But at every restart the texture jumps back to its starting place, and the whole surface visibly pops.")}
      </p>
      <p>
        {tx(t, "glslRiver_blendBody",
          "The trick is to read the texture twice, with two clocks half a cycle apart, and cross-fade between them. Each copy is faded to zero exactly when its own clock restarts, so its jump is never seen, and at that moment the other copy is at full strength:")}
      </p>
      <Equation label={tx(t, "glslRiver_phaseLabel", "Two phases, cross-faded")}
        where={[
          [r`k \in \{0, 1\}`, tx(t, "glslRiver_wK", "which of the two copies")],
          [r`T`, tx(t, "glslRiver_wPeriod", "the cycle: seconds between two restarts of one copy (the 'cycle T' slider)")],
          [r`o(\mathbf p)`, tx(t, "glslRiver_wO", "a per-point phase offset, read from a smooth noise texture (see below)")],
          [r`\varphi_k`, tx(t, "glslRiver_wPhi", "copy k's phase: it climbs from 0 to 1 over a cycle. The second copy runs half a cycle ahead")],
          [r`\mathbf j_k`, tx(t, "glslRiver_wJ", "a jump: a fixed shift of the texture, times the number of cycles so far. It moves the pattern to a new place at every restart, so the same ripples do not come back cycle after cycle")],
          [r`w_k`, tx(t, "glslRiver_wW", "copy k's weight, a triangle wave: 0 at its restart, 1 half-way through. Since the two phases are half a cycle apart, w₀ + w₁ = 1 at every moment")],
        ]}
        glsl={`float ph = fract(t / T + o + 0.5 * k);\nfloat w = 1.0 - abs(1.0 - 2.0 * ph);\nvec2 jump = floor(t / T + o + 0.5 * k) * vec2(0.213, 0.371) + 0.5 * k;\ncol += w * texture(tex, (p - v * ph * T) / s + jump);`}>
        {r`\varphi_k = \operatorname{fract}\!\Big(\frac{t}{T} + o(\mathbf p) + \frac{k}{2}\Big) \qquad w_k = 1 - \lvert 1 - 2\varphi_k\rvert \qquad \text{color} = \sum_{k} w_k\;\text{tex}\!\Big(\frac{\mathbf p - \mathbf v\,\varphi_k T}{s} + \mathbf j_k\Big)`}
      </Equation>
      <p>
        {tx(t, "glslRiver_offsetBody",
          "One artefact remains. With the same clock everywhere, the whole surface cross-fades in step, and the eye picks up a slow, regular pulse. Adding a smooth noise value o(p) to each point's phase spreads the restarts out, so neighbouring areas reach them at different moments and the pulse dissolves. The noise must be smooth: a sudden change of phase between two neighbours would show as a seam.")}
      </p>
      <FlowPhasesFigure t={t} />

      <H3>{tx(t, "glslRiver_varTitle", "Keeping the ripples' strength")}</H3>
      <p>
        {tx(t, "glslRiver_varBody",
          "Half-way between two restarts, both copies weigh 1/2, and averaging two unrelated patterns of ripples flattens them: their slopes partly cancel. For random patterns, the average's spread is √(w₀² + w₁²) times the spread of one pattern, which dips to 1/√2 ≈ 0.71 when the weights are equal. Left alone, the water would get visibly calmer and rougher again twice per cycle. The slopes have an average of zero, so dividing them by √(w₀² + w₁²) restores their strength without shifting them.")}
      </p>
      <Equation label={tx(t, "glslRiver_normLabel", "Blended slopes with a constant strength")}
        where={[
          [r`\nabla h_k`, tx(t, "glslRiver_wSlope", "the slopes read from copy k of the ripple texture: how much the ripple height rises per metre along x and along z")],
        ]}>
        {r`\nabla h = \frac{w_0\,\nabla h_0 + w_1\,\nabla h_1}{\sqrt{w_0^2 + w_1^2}}`}
      </Equation>

      <H3>{tx(t, "glslRiver_streakTitle", "Streaks along the current")}</H3>
      <p>
        {tx(t, "glslRiver_streakBody",
          "Fast water drags its ripples and foam out into lines along the current. The lab imitates this by reading the texture in a frame turned to the flow: one axis along the direction of v, the other across it, with the along axis stretched by a factor that grows with speed, 1 + 0.9·min(|v|, 2). Slopes read in that turned, stretched frame have to be turned back into world x and z. By the chain rule, a slope ∂h/∂u along the texture's first axis becomes (∂h/∂u)·d/k in the world, where d is the flow's direction and k the stretch, and the slope across becomes (∂h/∂v)·e, with e perpendicular to d.")}
      </p>

      <H2>{tx(t, "glslRiver_mapTitle", "Where the flow map comes from")}</H2>
      <p>
        {tx(t, "glslRiver_mapBody",
          "In production, flow maps are painted by artists with a brush that drags velocities around (the lab has one), or baked from a fluid simulation of the level. This chapter computes one from the river itself, with three pieces of hydraulics that fit in a few lines each. The map is a 256 × 512 texture over an 80 m × 152 m stretch of the valley, one texel every 0.31 m, in half floats: red and green hold the velocity's x and z in m/s, blue how much foam there should be, and alpha marks water.")}
      </p>

      <H3>{tx(t, "glslRiver_contTitle", "Continuity: the lake is slow")}</H3>
      <p>
        {tx(t, "glslRiver_contBody",
          "Water is (very nearly) incompressible, so every second the same volume has to pass through every cross-section of the river: the discharge Q, in cubic metres per second. Where the river is narrow and shallow, the water has to move fast to get Q through; where it opens into a lake, the same Q spreads over a much bigger section and slows to a crawl. This is the continuity equation:")}
      </p>
      <Equation label={tx(t, "glslRiver_contLabel", "Continuity")}
        where={[
          [r`Q`, tx(t, "glslRiver_wQ", "the discharge: volume of water per second, the same at every section (the 'discharge Q' slider, 8 m³/s by default)")],
          [r`\bar u`, tx(t, "glslRiver_wUbar", "the mean speed of the water through the section")],
          [r`A`, tx(t, "glslRiver_wA", "the cross-section's area. The lab's bed is a parabola of half-width W and depth D, whose area is 4/3·W·D")],
        ]}>
        {r`Q = \bar u\,A \qquad A = \tfrac43\,W\,D`}
      </Equation>
      <p>
        {tx(t, "glslRiver_contNums",
          "In the rapids W = 4.5 m and D = 1.1 m, so A = 6.6 m² and ū = 8 / 6.6 ≈ 1.2 m/s. In the lake W = 17.5 m and D = 3.5 m, so A ≈ 82 m², twelve times more, and ū ≈ 0.1 m/s. No one has to paint the lake calm: it follows from its size.")}
      </p>

      <H3>{tx(t, "glslRiver_manTitle", "Across the channel: Manning")}</H3>
      <p>
        {tx(t, "glslRiver_manBody",
          "The mean speed is not the speed everywhere. Friction with the bed slows the water, and it slows shallow water the most, so a river runs fastest over its deepest part. Engineers estimate open-channel speed with Manning's formula. In a wide, shallow river, the hydraulic radius it uses is close to the local depth d, so, for one river with a given slope and bed, the speed grows as d^(2/3):")}
      </p>
      <Equation label={tx(t, "glslRiver_manLabel", "Manning's formula, and the speed across the channel")}
        where={[
          [r`n`, tx(t, "glslRiver_wN", "Manning's roughness of the bed, about 0.03–0.05 s/m^(1/3) for a stony river")],
          [r`S`, tx(t, "glslRiver_wS", "the slope of the water surface: metres of drop per metre of river")],
          [r`d = D\,(1 - \sigma^2)`, tx(t, "glslRiver_wD", "the depth at a point: the parabolic bed, with σ the position across the channel, from −1 at one bank to +1 at the other")],
          [r`\kappa`, tx(t, "glslRiver_wKappa", "everything that is the same across the section, (1/n)·√S. The lab does not choose n and S: it picks κ so that the flow adds up to Q")],
        ]}>
        {r`u = \frac1n\,d^{2/3}\,S^{1/2} = \kappa\,d^{2/3}`}
      </Equation>
      <p>
        {tx(t, "glslRiver_manK",
          "The discharge is the speed times the depth, added up across the width: Q = ∫ u·d dx. With u = κ·d^(2/3) that is κ·W·D^(5/3) times ∫₋₁¹ (1 − σ²)^(5/3) dσ ≈ 1.137, a number the code computes once. Solving for κ gives the speed at every point; with the defaults, the middle of the rapids runs at 1.4 m/s. The velocity points along the river's centre line, whose direction the code finds by differencing the centre line's x between two nearby z.")}
      </p>
      <Equation label={tx(t, "glslRiver_kappaLabel", "The constant that makes the flow add up to Q")}
        where={[
          [r`1.137`, tx(t, "glslRiver_wShape", "the shape factor of the parabolic bed, ∫₋₁¹ (1 − σ²)^(5/3) dσ")],
        ]}
        glsl={`float k = Q / (W * pow(D, 5.0 / 3.0) * 1.137);\nfloat u = k * pow(D * (1.0 - s * s), 2.0 / 3.0);`}>
        {r`\kappa = \frac{Q}{W\,D^{5/3}\cdot 1.137}`}
      </Equation>

      <H3>{tx(t, "glslRiver_rockTitle", "Around a rock: potential flow")}</H3>
      <p>
        {tx(t, "glslRiver_rockBody",
          "A rock splits the current. The classic model is potential flow: an ideal fluid, with no friction and no swirl, that has an exact solution for a stream passing a circle. Written with complex numbers, where a point is ζ = x + i·z, and the velocity is read as the complex number u − i·w (w is the velocity's z part), the circle theorem says that a circle of radius a placed in a stream V adds one term:")}
      </p>
      <Equation label={tx(t, "glslRiver_potLabel", "A stream past a circle")}
        where={[
          [r`\zeta = x + i\,z`, tx(t, "glslRiver_wZeta", "the point, relative to the rock's centre, as a complex number")],
          [r`V = V_x + i\,V_z`, tx(t, "glslRiver_wVs", "the free stream: the river's velocity at the rock's centre as if the rock were not there")],
          [r`\bar V`, tx(t, "glslRiver_wVbar", "V's complex conjugate, V_x − i·V_z: the free stream in the u − i·w form")],
          [r`a`, tx(t, "glslRiver_wRa", "the rock's radius at the water line")],
          [r`u - i\,w`, tx(t, "glslRiver_wUw", "the velocity with the rock, in that form: its real part is the x velocity, minus its imaginary part the z velocity")],
        ]}
        glsl={`vec2 inv = vec2(x*x - z*z, -2.0*x*z) / (r2*r2);          // 1/ζ²\nvec2 add = -a*a * vec2(V.x*inv.x - V.y*inv.y, V.x*inv.y + V.y*inv.x);\nvel += vec2(add.x, -add.y);`}>
        {r`u - i\,w = \bar V - V\,\frac{a^2}{\zeta^2}`}
      </Equation>
      <p>
        {tx(t, "glslRiver_rockNote",
          "The extra term fades as 1/distance², so each rock only changes the water within a few radii of it, and the rocks can simply be added one after another. At the front and back of the rock the speed falls to zero (the stagnation points, where water piles up), and at its sides it doubles, to 2|V|. Potential flow is also perfectly symmetric: the water closes up behind the rock as smoothly as it opened in front, which is d'Alembert's paradox. Real water, with friction, separates from the rock's sides and leaves a slow, churning wake. The lab adds it by hand: behind each rock, along the stream, the speed drops by up to 55% and the foam channel rises, in a band that fades over about seven radii downstream and widens as it goes.")}
      </p>
      <Equation label={tx(t, "glslRiver_wakeLabel", "The wake, added by hand")}
        where={[
          [r`\ell`, tx(t, "glslRiver_wL", "the distance downstream of the rock's centre, along the free stream (only ℓ > 0 has a wake)")],
          [r`q`, tx(t, "glslRiver_wQl", "the distance across the stream from the rock's centre line")],
          [r`b = a\,(1 + \ell / 3a)`, tx(t, "glslRiver_wB", "the wake's half-width: the rock's radius, growing by a third of it for every radius downstream")],
        ]}>
        {r`\text{wake} = e^{-\ell / 7a}\; e^{-(q / b)^2} \qquad \mathbf v \leftarrow \mathbf v\,(1 - 0.55\,\text{wake}) \qquad \text{foam} \mathrel{+}= \text{wake}\cdot\min(\lvert V\rvert, 1.5)`}
      </Equation>
      <p>
        {tx(t, "glslRiver_foamSrc",
          "Foam also gathers where the water piles against a rock's upstream face (strongly within about a third of a radius of the stone, a little all round it), and wherever the water runs faster than 1.7 m/s, where a real river would break into white water.")}
      </p>

      <H2>{tx(t, "glslRiver_shadeTitle", "Shading the water")}</H2>
      <p>
        {tx(t, "glslRiver_shadeBody",
          "Every pixel of the water reads the flow map at its position, then reads the detail texture twice with the two-phase method: once for ripples 2.4 m across, once for ripples 0.9 m across. That texture holds a field of small ripples as slopes in red and green, a foam pattern in blue, and the smooth noise for the phase offsets in alpha. How strongly the ripples tilt the normal depends on the flow: slow water is nearly a mirror, the rapids are choppy, and water the map marks as turbulent is rough however fast it runs:")}
      </p>
      <Equation label={tx(t, "glslRiver_ampLabel", "Ripple strength, and foam")}
        where={[
          [r`r`, tx(t, "glslRiver_wR", "the 'ripples' slider")],
          [r`\lvert\mathbf v\rvert`, tx(t, "glslRiver_wSpeed", "the water's speed from the flow map, in m/s (capped at 2.5)")],
          [r`f`, tx(t, "glslRiver_wF", "the flow map's foam amount (times the 'foam' slider), 0 to 1")],
          [r`\text{pat}`, tx(t, "glslRiver_wPat", "the carried foam pattern, 0 to 1. The more foam the map asks for, the lower the threshold, and the more of the pattern turns white")],
        ]}
        glsl={`float amp = uRipple * (0.04 + 0.55 * min(speed, 2.5) + 0.8 * f);\nvec3 N = normalize(vec3(-slope.x * amp, 1.0, -slope.y * amp));\nfloat foam = smoothstep(1.0 - f, 1.3 - f, pattern);`}>
        {r`\text{amp} = r\,\big(0.04 + 0.55\,\min(\lvert\mathbf v\rvert, 2.5) + 0.8\,f\big) \qquad \text{foam} = \operatorname{smoothstep}(1 - f,\ 1.3 - f,\ \text{pat})`}
      </Equation>
      <p>
        {tx(t, "glslRiver_refrBody",
          "Under the surface, the bed is the same height function the valley is drawn with, so the refracted ray can be traced without a second render: go down along the refracted direction to the depth under the pixel, look up the bed's height where that lands, and correct the path length to it. The bed there is lit by the sun refracted into the water and absorbed on the way down, and by the skylight, both dimmed per colour channel by Beer–Lambert absorption over the path, exactly as in the Water Lab. The caustics are cheap: the same carried foam pattern, read under the point where the sun's refracted ray entered the water, brightens and darkens the sunlight on the bed, more strongly where the water moves.")}
      </p>

      <H2>{tx(t, "glslRiver_lakeTitle", "A calm lake: planar reflections")}</H2>
      <p>
        {tx(t, "glslRiver_lakeBody",
          "The sky probe the other labs reflect only knows the sky. A calm lake is a mirror, and what it mirrors most is the land around it: hills, banks, rocks. For a flat mirror there is an exact and cheap answer. Reflecting a point (x, y, z) through the water plane y = 0 gives (x, −y, z). So draw the valley a second time, upside down, into a texture the size of the screen: seen from the real camera, the flipped valley lands on the screen exactly where its reflection appears. Only the parts above the water may be flipped, so that pass discards every fragment whose original height is below 0. The water then reads that texture at its own pixel position:")}
      </p>
      <Equation label={tx(t, "glslRiver_mirrorLabel", "Planar reflection")}
        where={[
          [r`\mathbf M = \operatorname{diag}(1, -1, 1)`, tx(t, "glslRiver_wM", "the mirror through the plane y = 0, applied to the valley's vertices in the reflection pass")],
          [r`\mathbf s`, tx(t, "glslRiver_wScreen", "the pixel's position on the screen, from 0 to 1 (gl_FragCoord.xy divided by the screen size)")],
          [r`\mathbf N_{xz}`, tx(t, "glslRiver_wNxz", "the horizontal part of the water's normal: ripples nudge where the reflection is read, so it wobbles")],
          [r`\delta`, tx(t, "glslRiver_wDelta", "how far a ripple nudges the reflection (the 'reflection wobble' slider), shrinking with distance")],
          [r`\alpha`, tx(t, "glslRiver_wAlpha", "the reflection texture's alpha: 1 where the flipped valley was drawn, 0 where the sky shows through, which then comes from the sky probe")],
        ]}
        glsl={`// reflection pass (vertex): gl_Position = uViewProj * vec4(x, -h, z, 1.0);\n// reflection pass (fragment): if (worldY < 0.0) discard;\nvec4 rf = texture(uRefl, gl_FragCoord.xy / uScreen + N.xz * uDistort);\nvec3 refl = mix(skyEnv(reflect(rd, N)), rf.rgb, rf.a);`}>
        {r`\text{refl} = \operatorname{mix}\!\big(\text{sky}(\mathbf r),\ \text{tex}_{\text{refl}}(\mathbf s + \delta\,\mathbf N_{xz}),\ \alpha\big)`}
      </Equation>
      <p>
        {tx(t, "glslRiver_lakeNote",
          "The nudge is not physically exact, since a tilted mirror reflects a different direction, not just a shifted screen position, but for ripples it is convincing and it costs one texture read. Fresnel does the rest: looking across the lake at a low angle, the water reflects almost everything, and the valley hangs upside down in it; looking down near the shore, it reflects 2% and you see the bed. A lake is never quite still, though. Wind draws fine ripples over it, not everywhere at once but in drifting patches, which sailors call cat's paws. The lab reads the ripple texture once more, sliding in the wind's direction, and scales it by a slowly moving noise so it comes and goes in patches.")}
      </p>

      <RiverLabFigure t={t} />

      <Callout type="tip" t={t}>
        {tx(t, "glslRiver_tip", "Flow maps are not only for water. The same two-phase shader carries lava along its channels, clouds around a planet and smoke up a chimney, and engines store the flow in a texture, in the vertex colours of a river mesh, or along a spline's direction. Planar reflections cost a second render of everything they reflect, so games use them for one large flat surface at a time (a lake, a polished floor) and screen-space reflections or probes elsewhere.")}
      </Callout>

      <KeyIdeas t={t} id="glslRiver" items={[
        tx(t, "glslRiver_k1", "A flow map stores a velocity per point. Scrolling a texture by p − v·t works only for uniform flow: where v varies, the texture stretches without end."),
        tx(t, "glslRiver_k2", "Two phases: two copies of the texture on clocks half a cycle apart, each carried for at most one cycle T, cross-faded with triangle weights that sum to 1. A jump at each restart and a noise offset per point hide the repetition and the pulse."),
        tx(t, "glslRiver_k3", "Blending two slope patterns flattens them; dividing by √(w₀² + w₁²) keeps their strength constant."),
        tx(t, "glslRiver_k4", "A plausible flow map follows from hydraulics: continuity Q = ū·A slows the water where the channel widens, Manning's u ∝ d^(2/3) makes it fastest over the deepest part, and potential flow bends it around rocks, with a wake added by hand."),
        tx(t, "glslRiver_k5", "A calm lake needs the land in its reflection: draw the scene mirrored through the water plane into a screen-sized texture, clip what is under the water, and read it at the pixel's position nudged by the ripples."),
      ]} />
    </Article>
  );
}
