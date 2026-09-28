// src/lib/tracks/glsl/chapters/effects/pool.tsx
"use client";

import { Callout, H2, H3 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { WaveStringFigure } from "@/components/lesson/figures/pool/WaveStringFigure";
import { PoolLabFigure } from "@/components/lesson/figures/pool/PoolLabFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Interactive pool
// ═════════════════════════════════════════════════════════════════════════════

export function PoolContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslPool_intro",
          "Gerstner waves and FFT oceans are formulas of time: they cannot react when something touches the water. This chapter rebuilds Evan Wallace's WebGL Water (2011), still one of the best-known water demos on the web: a small pool where a click makes rings that bounce off the walls, a ball that floats and pushes water aside, and bright caustics on the tiles. It takes three pieces: the wave equation solved on a grid of heights, a ball with buoyancy, and caustics made by projecting the water mesh along the refracted sunlight.")}
      </Lead>

      <H2>{tx(t, "glslPool_fieldTitle", "A height field")}</H2>
      <p>
        {tx(t, "glslPool_fieldBody",
          "The pool is 2 m × 2 m and 1 m deep, and its water is described by one height per cell of a 256 × 256 grid: h(x, z), the height above the rest level. A height field cannot fold over or splash, but a pool that is only being poked never needs to. Each cell is Δx = 2 m / 256 ≈ 7.8 mm wide. The grid lives in a floating-point RGBA texture, one texel per cell: red holds the height, green the velocity (how far the height moves per step), and blue and alpha the x and z of the surface normal, for shading. A fragment shader cannot read the texture it is writing, so there are two textures, and every pass reads one and writes the other (ping-pong).")}
      </p>

      <H2>{tx(t, "glslPool_waveTitle", "The wave equation")}</H2>
      <p>
        {tx(t, "glslPool_waveBody",
          "Push a patch of water surface up and gravity pulls it back, pushing its neighbours up in turn. For small waves, the wave equation captures this: the vertical acceleration of each point is proportional to how much it sits below the average of its surroundings. The Laplacian ∇²h measures exactly that:")}
      </p>
      <Equation label={tx(t, "glslPool_pdeLabel", "The wave equation")}
        where={[
          [r`h(x, z, t)`, tx(t, "glslPool_wH", "the height of the surface above its rest level, in metres")],
          [r`\frac{\partial^2 h}{\partial t^2}`, tx(t, "glslPool_wAcc", "the vertical acceleration of the surface at a point")],
          [r`\nabla^2 h = \frac{\partial^2 h}{\partial x^2} + \frac{\partial^2 h}{\partial z^2}`, tx(t, "glslPool_wLap", "the Laplacian: the surface's curvature. It is positive in a dip (the neighbours are higher) and negative on a bump")],
          [r`c`, tx(t, "glslPool_wC", "the wave speed, in m/s: how fast a disturbance spreads")],
        ]}>
        {r`\frac{\partial^2 h}{\partial t^2} = c^2\,\nabla^2 h`}
      </Equation>
      <p>
        {tx(t, "glslPool_discBody",
          "On the grid, the Laplacian becomes the five-point stencil: the four neighbours' sum minus four times the cell itself, over Δx². Time advances in steps of Δt. Each step first updates the velocity from the stencil, then moves the height by the new velocity. That order, velocity then position, is the symplectic Euler method: it keeps a wave's energy from creeping up over thousands of steps, where plain Euler would slowly amplify it. Folding Δt and Δx into one constant gives the whole update:")}
      </p>
      <Equation label={tx(t, "glslPool_stepLabel", "One step, for every cell (i, j)")}
        where={[
          [r`v_{ij}`, tx(t, "glslPool_wV", "the velocity, stored as metres per step (so it is simply added to the height)")],
          [r`C^2 = c^2\,\Delta t^2 / \Delta x^2`, tx(t, "glslPool_wC2", "the squared Courant number: how far a wave travels in one step, in cells, squared. It is the 'wave speed C²' slider")],
          [r`d`, tx(t, "glslPool_wD", "the damping: the share of the velocity kept each step, just under 1. It stands for the friction and viscosity the equation leaves out. A wave loses about 1/e of its height every 2/(1 − d) steps: 400 steps, a little over 3 s, at d = 0.995")],
        ]}
        glsl={`float sum = left + right + down + up;\ns.g += uCourant2 * (sum - 4.0 * s.r);\ns.g *= uDamping;\ns.r += s.g;`}>
        {r`v_{ij} \leftarrow d\,\Big(v_{ij} + C^2\,\big(h_{i+1,j} + h_{i-1,j} + h_{i,j+1} + h_{i,j-1} - 4\,h_{ij}\big)\Big) \qquad h_{ij} \leftarrow h_{ij} + v_{ij}`}
      </Equation>
      <WaveStringFigure t={t} />

      <H3>{tx(t, "glslPool_stabTitle", "How fast can the waves go?")}</H3>
      <p>
        {tx(t, "glslPool_stabBody",
          "Information moves at most one cell per step on this grid, so a wave cannot be allowed to travel faster than that. The worst case is the shortest wave the grid can hold, the checkerboard, where every cell is the opposite of its four neighbours. There the stencil gives −8h, so each step changes the velocity by −8·C²·h. When C² > 1/2, that correction overshoots by more than it restores and the checkerboard grows at every step, whatever the damping. This is the Courant–Friedrichs–Lewy (CFL) condition for this scheme:")}
      </p>
      <Equation label={tx(t, "glslPool_cflLabel", "Stability, and the speed it allows")}
        where={[
          [r`C^2 \le \tfrac12`, tx(t, "glslPool_wCfl", "the limit in 2D (in 1D, with two neighbours, it is C² ≤ 1, as in the figure above)")],
          [r`\Delta t = 1/120\ \text{s}`, tx(t, "glslPool_wDt", "the lab takes 120 steps per second of animation, whatever the frame rate: it counts elapsed time and runs as many steps as are due")],
          [r`c = 0.66\ \text{m/s}`, tx(t, "glslPool_wSpeed", "√0.5 × 7.8 mm × 120 /s: the fastest waves this grid and step can run")],
        ]}>
        {r`c = \sqrt{C^2}\;\frac{\Delta x}{\Delta t} \le \sqrt{\tfrac12}\;\frac{\Delta x}{\Delta t}`}
      </Equation>
      <p>
        {tx(t, "glslPool_dispBody",
          "Real water is not this simple. In water 1 m deep, long waves travel at √(g·depth) ≈ 3.1 m/s, while ripples a few centimetres long move at about 0.25 m/s: the speed depends on the wavelength (dispersion). The wave equation gives every wavelength the same speed. At 0.66 m/s it looks right for the ripples a hand or a ball makes in a small pool, which is all this pool has to show.")}
      </p>
      <p>
        {tx(t, "glslPool_wallBody",
          "The walls come for free. A cell on the edge asks for a neighbour outside the grid, and the shader clamps the coordinate, so it gets itself back. The water just outside is then always level with the edge, so the surface meets the wall with zero slope (a Neumann boundary). That is exactly how water meets a vertical wall, and it reflects waves back into the pool.")}
      </p>

      <H3>{tx(t, "glslPool_dropTitle", "Drops and normals")}</H3>
      <p>
        {tx(t, "glslPool_dropBody",
          "A click adds a smooth bump to the heights, a raised cosine. It is 1 in the middle and falls to 0 with zero slope at its edge, so it adds no sharp corner, which the grid would turn into ringing. After the steps of the frame, one more pass computes the normals from the heights by central differences:")}
      </p>
      <Equation label={tx(t, "glslPool_dropLabel", "A drop, and the normal")}
        where={[
          [r`s`, tx(t, "glslPool_wS", "the drop's strength in metres: +2 cm for a click, +1 cm while dragging. Negative values make a dent")],
          [r`\rho = \lVert \mathbf x - \mathbf x_d\rVert / R`, tx(t, "glslPool_wRho", "the distance from the drop's centre x_d, as a share of its radius R (the 'drop radius' slider)")],
          [r`\frac{h_{i+1} - h_{i-1}}{2\,\Delta x}`, tx(t, "glslPool_wCd", "the slope along x, from the two neighbours. Using both sides keeps the normal centred on the cell")],
        ]}>
        {r`h \mathrel{+}= s\,\Big(\tfrac12 + \tfrac12\cos(\pi\rho)\Big)\ \ (\rho < 1) \qquad \mathbf n = \operatorname{normalize}\!\Big(-\frac{h_{i+1,j} - h_{i-1,j}}{2\Delta x},\ 1,\ -\frac{h_{i,j+1} - h_{i,j-1}}{2\Delta x}\Big)`}
      </Equation>

      <H2>{tx(t, "glslPool_ballTitle", "A ball that floats")}</H2>
      <p>
        {tx(t, "glslPool_ballBody",
          "The ball is simulated on the CPU, one step per frame. Gravity pulls it down with g. The water pushes it up with the weight of the water it displaces (Archimedes). That depends on how much of the ball is under the rest level: a spherical cap, whose volume has a closed form. Divided by the ball's mass, the buoyancy is g times the submerged share of the ball's volume, over the ball's density relative to water:")}
      </p>
      <Equation label={tx(t, "glslPool_buoyLabel", "Buoyancy of a sphere")}
        where={[
          [r`r`, tx(t, "glslPool_wR", "the ball's radius, 25 cm")],
          [r`h_s = \operatorname{clamp}(r - y_c,\ 0,\ 2r)`, tx(t, "glslPool_wHs", "the height of the submerged cap, for a centre y_c metres above the rest level")],
          [r`f`, tx(t, "glslPool_wF", "the submerged share of the volume: the cap's volume π·h_s²·(3r − h_s)/3 over the ball's 4πr³/3")],
          [r`\rho`, tx(t, "glslPool_wDens", "the ball's density over the water's (the 'ball density' slider). At rest, buoyancy balances weight where f = ρ: a ball half as dense as water floats half submerged")],
          [r`k`, tx(t, "glslPool_wK", "the drag, 0.3 + 4·f per second: water resists motion far more than air, so an oscillation dies out after a few bobs")],
        ]}>
        {r`f = \frac{h_s^2\,(3r - h_s)}{4\,r^3} \qquad a_y = -g + \frac{g\,f}{\rho} \qquad \mathbf v \leftarrow \mathbf v\,e^{-k\,\Delta t}`}
      </Equation>
      <p>
        {tx(t, "glslPool_pushBody",
          "The ball also has to move the water. Wherever it is, it fills part of each water column under it: from its bottom up to the rest level, a length that follows from the sphere's equation. When the ball moves, the water in a column rises by exactly as much as that length grew, and the wave equation spreads the bump out from there. A ball that drops in raises the whole pool by its submerged volume divided by the pool's area, and one that is pulled out lowers it again: the volume of water is conserved. The length drops to zero with an infinite slope at the ball's outline, and that kink would ring at the grid's scale, so it is eased out over the outer 15% of the radius.")}
      </p>
      <Equation label={tx(t, "glslPool_colLabel", "The ball's share of a water column")}
        where={[
          [r`\rho_c`, tx(t, "glslPool_wRhoc", "the horizontal distance from the column to the ball's centre")],
          [r`\sqrt{r^2 - \rho_c^2}`, tx(t, "glslPool_wHalf", "half the ball's height at that distance")],
          [r`\ell_{\text{new}} - \ell_{\text{old}}`, tx(t, "glslPool_wDl", "the change since the last frame, added to the column's height")],
        ]}
        glsl={`float s = sqrt(r * r - rho2);\nfloat len = max(min(b.y + s, 0.0) - (b.y - s), 0.0);\nh += len(new ball) - len(old ball);`}>
        {r`\ell = \max\!\Big(\min\big(y_c + \sqrt{r^2 - \rho_c^2},\ 0\big) - \big(y_c - \sqrt{r^2 - \rho_c^2}\big),\ 0\Big) \qquad h \mathrel{+}= \ell_{\text{new}} - \ell_{\text{old}}`}
      </Equation>

      <H2>{tx(t, "glslPool_causTitle", "Caustics from a mesh")}</H2>
      <p>
        {tx(t, "glslPool_causBody",
          "The Water Lab estimated caustics with a formula that assumes gentle slopes and a flat bed at one depth. A pool has walls, corners and a ball, and its ripples are steep. So the pool uses the method from Evan Wallace's demo. Take the water mesh and, for every vertex, follow the sunbeam that enters the water there, bent by that vertex's normal, down to the wall or floor it hits. Each triangle of the mesh is a thin tube of sunlight. It carries the light that fell on its area at the surface, and spreads it over the area where it lands. Its brightness there is the ratio of the two areas:")}
      </p>
      <Equation label={tx(t, "glslPool_areaLabel", "Brightness of one refracted triangle")}
        where={[
          [r`A_{\text{flat}}`, tx(t, "glslPool_wAf", "the triangle's area where it lands if the water were flat")],
          [r`A_{\text{wavy}}`, tx(t, "glslPool_wAw", "its area where it lands with the real, wavy normals. Smaller means the light is focused and brighter")],
          [r`e^{-\sigma_a t}`, tx(t, "glslPool_wAbs", "absorption over the t metres the beam travels in the water, per colour channel")],
          [r`\text{shadow}`, tx(t, "glslPool_wSh", "0 where the ball blocks the beam, either above the water or below it, with a soft edge")],
        ]}>
        {r`I = \frac{A_{\text{flat}}}{A_{\text{wavy}}}\;e^{-\sigma_a t}\;\text{shadow}`}
      </Equation>
      <p>
        {tx(t, "glslPool_keyBody",
          "Those landing areas are drawn into a caustic map, a 1024 × 1024 float texture, with additive blending: where several triangles land on the same spot, as they do at a fold, their light adds up. The map needs coordinates that cover the floor and the walls together. The trick is to index every point of the pool by where sunlight reaching it would have entered flat water, its key: slide the point back up along the flat refracted sun direction L to the plane y = 0. Every lit point has its own key, and a wall facing away from the light is never lit, so it never needs one. Shading a pool point computes its key and reads the map there.")}
      </p>
      <Equation label={tx(t, "glslPool_keyLabel", "The caustic map's key, and the area ratio in the shader")}
        where={[
          [r`\mathbf L`, tx(t, "glslPool_wL", "the sun's direction of travel under flat water: refract(−sun, up, 1/1.333)")],
          [r`q_y / L_y`, tx(t, "glslPool_wQy", "how far back along L the point is from the surface (both negative below it)")],
          [r`\operatorname{dFdx},\ \operatorname{dFdy}`, tx(t, "glslPool_wDfd", "the change of a varying from one pixel to the next. Keys are linear across a triangle, so these measure the triangle itself: their cross product is its area per pixel, in key units")],
        ]}
        glsl={`// vertex: vKey0 = the vertex's own position; vKey = key of where its beam lands\n// fragment:\nfloat before = area(dFdx(vKey0), dFdy(vKey0));\nfloat after  = area(dFdx(vKey),  dFdy(vKey));\ncolor = vAtt * before / after;   // blended with ONE, ONE`}>
        {r`\text{key}(\mathbf q) = \mathbf q_{xz} - \mathbf L_{xz}\,\frac{q_y}{L_y} \qquad \frac{A_{\text{flat}}}{A_{\text{wavy}}} = \frac{\big|\partial_x \mathbf k_0 \times \partial_y \mathbf k_0\big|}{\big|\partial_x \mathbf k \times \partial_y \mathbf k\big|}`}
      </Equation>
      <p>
        {tx(t, "glslPool_keyNote",
          "For flat water, the key of the point a beam lands on is the beam's own entry point, so the 'before' triangle is simply the mesh triangle at rest (k₀), and the ratio is 1 everywhere. Shadows come out for free: the part of the floor next to a wall on the sun's side receives no triangle at all, because the light that would reach it would have had to enter beyond the wall.")}
      </p>

      <PoolLabFigure t={t} />

      <H2>{tx(t, "glslPool_drawTitle", "Drawing the pool")}</H2>
      <p>
        {tx(t, "glslPool_drawBody",
          "Apart from the water, the scene is an open box, a plane and a sphere: shapes whose ray intersections are a few lines each. So a full-screen pass traces them per pixel instead of drawing meshes. It finds the nearest of the ball, the deck around the pool and the pool's inside faces, shades it, and writes its depth, as the Water Lab's background did. The water mesh then draws on top of it, displaced by the heights in its vertex shader. Each of its pixels traces the same shapes twice more: along the refracted ray, down to the tiles or the submerged part of the ball, dimmed by absorption over the distance, and along the reflected ray, up to the ball, the strip of wall above the water, or the sky. Fresnel mixes the two. A tile under the water is lit by the sun times its caustic value, plus the skylight dimmed with depth. Above the water it is lit directly, with the ball's shadow.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "glslPool_tip", "Games use this kind of simulation for water that can be touched: puddles, fountains, a lake near the player. Big water keeps its FFT or Gerstner waves and adds a small simulated patch that follows the camera, or an 'interaction texture' where characters and boats stamp their wakes. Water that flows, floods and fills needs the shallow water equations, which also move the water sideways, so it can pile up and run downhill.")}
      </Callout>

      <KeyIdeas t={t} id="glslPool" items={[
        tx(t, "glslPool_k1", "A height field in a float texture (height, velocity, normal), stepped by ping-ponging between two textures, turns a pool into something that can be touched."),
        tx(t, "glslPool_k2", "The wave equation on a grid: velocity += C²·(sum of 4 neighbours − 4·height), times damping, then height += velocity. It is stable only for C² ≤ 1/2, and clamped neighbours make the walls reflect."),
        tx(t, "glslPool_k3", "A floating ball is Archimedes: buoyancy g·f/ρ from the submerged cap's volume share f. It pushes water by the change of its share of each water column, which conserves the water's volume."),
        tx(t, "glslPool_k4", "Caustics: project each triangle of the water mesh along its refracted sunbeam and blend its brightness A_flat / A_wavy into a map, keyed by where the light entered flat water."),
        tx(t, "glslPool_k5", "Simple solids (box, plane, sphere) can be ray traced in the fragment shader, so reflections and refractions see them exactly."),
      ]} />
    </Article>
  );
}
