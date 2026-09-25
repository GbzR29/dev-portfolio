"use client";

// "Particles" (Advanced OpenGL): emission, integration, pooling, instanced billboards, blending and sorting, GPU simulation.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { IntegratorFigure } from "@/components/lesson/figures/advgl/IntegratorFigure";
import { ParticlesFigure } from "@/components/lesson/figures/advgl/ParticlesFigure";
import { RainFigure } from "@/components/lesson/figures/advgl/RainFigure";

const r = String.raw;

export function ParticlesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPart_intro",
          "Fire, smoke, sparks, rain, dust, magic: none of these are meshes. They are thousands of tiny, short-lived, semi-transparent sprites, each following simple rules. A particle system has three jobs: spawn particles at the right rate, move them every frame, and draw all of them cheaply. Each job has a well-known right way and a well-known wrong way.")}
      </Lead>

      <H2>{tx(t, "oglPart_dataTitle", "A particle is a few floats")}</H2>
      <CodeBlock lang="cpp" filename="particle.h" t={t}>{`struct Particle {
    glm::vec3 position;
    glm::vec3 velocity;
    float     age;        // seconds since spawn
    float     life;       // seconds it will live
    float     rotation, spin;
    float     seed;       // per-particle randomness (tint, size variation…)
};                        // ~44 bytes: 10 000 particles ≈ 440 KB`}</CodeBlock>
      <p>
        {tx(t, "oglPart_tBody", "Almost every visual property is a function of normalised age ")}
        <Tex>{r`t = \text{age}/\text{life} \in [0, 1]`}</Tex>
        {tx(t, "oglPart_tBody2", ": size, colour and opacity are read from small curves (keyframes lerped over t) authored by an artist, rather than stored per particle. That keeps the struct tiny and the look tweakable without touching code.")}
      </p>
      <Equation label={tx(t, "oglPart_curveLabel", "A property curve")}
        where={[
          [r`(t_k, c_k)`, tx(t, "oglPart_wKey", "keyframes, sorted by t")],
          [r`k`, tx(t, "oglPart_wK", "the segment with t_k ≤ t < t_{k+1}")],
        ]}
        note={tx(t, "oglPart_curveNote", "Fire in the figure uses four colour keys: invisible yellow at birth (so it does not pop in), bright orange-yellow, red, then transparent dark red. Fading alpha to 0 at both ends hides both spawning and dying.")}>
        {r`c(t) = \operatorname{mix}\!\left(c_k,\ c_{k+1},\ \frac{t - t_k}{t_{k+1} - t_k}\right)`}
      </Equation>

      <H2>{tx(t, "oglPart_emitTitle", "Emission without drift")}</H2>
      <p>
        {tx(t, "oglPart_emitBody",
          "\"Spawn 50 particles per second\" at 144 fps means 0.35 particles per frame. Rounding that each frame gives 0 (nothing ever spawns) or 1 (three times too many). Keep an accumulator and carry the fraction over:")}
      </p>
      <Equation label={tx(t, "oglPart_accLabel", "Emission accumulator")}
        where={[[r`R`, tx(t, "oglPart_wR", "rate in particles per second")]]}
        note={tx(t, "oglPart_accNote", "Over any window the count is exact to within one particle, at any frame rate. For smooth trails from a fast emitter, also spread the spawn positions (and ages) along the path travelled during the frame, or the particles clump into one blob per frame.")}>
        {r`a \mathrel{+}= R\,\Delta t \qquad n = \lfloor a \rfloor \qquad a \mathrel{-}= n`}
      </Equation>

      <H2>{tx(t, "oglPart_intTitle", "Moving them: integration")}</H2>
      <p>
        {tx(t, "oglPart_intBody",
          "Each frame advances position and velocity by Δt under some forces. The textbook explicit Euler step updates the position with the old velocity. That is unstable: under any spring-like force it adds energy every step. Updating the velocity first and then moving with the new velocity (semi-implicit, or symplectic, Euler) costs exactly the same and stays stable:")}
      </p>
      <Equation label={tx(t, "oglPart_eulerLabel", "Explicit vs semi-implicit Euler")}
        where={[[r`\mathbf a(\mathbf x, \mathbf v)`, tx(t, "oglPart_wA", "acceleration: gravity, wind, drag, attractors, curl noise…")]]}>
        {r`\begin{aligned}
&\text{explicit:} && \mathbf x_{n+1} = \mathbf x_n + \mathbf v_n\,\Delta t, && \mathbf v_{n+1} = \mathbf v_n + \mathbf a_n\,\Delta t \\
&\text{semi-implicit:} && \mathbf v_{n+1} = \mathbf v_n + \mathbf a_n\,\Delta t, && \mathbf x_{n+1} = \mathbf x_n + \mathbf v_{n+1}\,\Delta t
\end{aligned}`}
      </Equation>
      <IntegratorFigure t={t} />
      <Equation label={tx(t, "oglPart_dragLabel", "Frame-rate independent drag")}
        where={[[r`k`, tx(t, "oglPart_wKd", "drag coefficient, 1/s: the velocity falls to 1/e after 1/k seconds")]]}
        note={tx(t, "oglPart_dragNote", "v *= 0.98 every frame looks identical, but it means strong drag at 144 fps and weak drag at 30 fps. The exponential is the exact solution of dv/dt = −k v, so any sequence of steps adding up to 1 s produces the same slowdown.")}
        glsl="v *= exp(-k * dt);">
        {r`\frac{d\mathbf v}{dt} = -k\,\mathbf v \;\Rightarrow\; \mathbf v(t + \Delta t) = \mathbf v(t)\,e^{-k\,\Delta t}`}
      </Equation>

      <H2>{tx(t, "oglPart_poolTitle", "Storage: a pool with swap-remove")}</H2>
      <p>
        {tx(t, "oglPart_poolBody",
          "Allocating a particle on spawn and freeing it on death means thousands of allocations a second. Instead, allocate a fixed array once and keep the live particles packed at the front. Spawning appends at index alive. When particle i dies, the last live particle is copied into slot i and alive shrinks by one. Both are O(1), there is never a hole, and the first alive entries are exactly what to draw:")}
      </p>
      <CodeBlock lang="cpp" filename="update.cpp" t={t}>{`void ParticleSystem::update(float dt) {
    accumulator += rate * dt;                       // emission
    int n = int(accumulator);
    accumulator -= n;
    while (n-- > 0 && alive < capacity) spawn(pool[alive++]);

    const float damp = std::exp(-drag * dt);
    for (int i = 0; i < alive; ) {
        Particle& p = pool[i];
        p.age += dt;
        if (p.age >= p.life) {                      // swap-remove: O(1), no holes
            p = pool[--alive];
            continue;                               // slot i now holds a different particle
        }
        p.velocity += gravity * dt;                 // semi-implicit Euler
        p.velocity *= damp;
        p.position += p.velocity * dt;
        ++i;
    }
}`}</CodeBlock>

      <H2>{tx(t, "oglPart_drawTitle", "Drawing: one instanced call")}</H2>
      <p>
        {tx(t, "oglPart_drawBody",
          "A draw call per particle would be the slowest part of the frame. Upload every live particle's render data into one buffer and draw them all with instancing. Each instance is a quad of 4 strip vertices. The vertex shader builds it facing the camera by offsetting along the camera's right and up vectors, taken from the view matrix:")}
      </p>
      <Equation label={tx(t, "oglPart_bbLabel", "Camera-facing billboard corner")}
        where={[
          [r`\mathbf p`, tx(t, "oglPart_wP", "particle centre")],
          [r`(c_x, c_y) \in \{-1, 1\}^2`, tx(t, "oglPart_wC", "which corner, from gl_VertexID")],
          [r`\hat{\mathbf r},\ \hat{\mathbf u}`, tx(t, "oglPart_wRu", "camera right and up: the first two rows of the view matrix")],
          [r`s,\ \theta`, tx(t, "oglPart_wS", "size and rotation of this particle")],
        ]}
        note={tx(t, "oglPart_bbNote", "Rotating (cₓ, c_y) by θ first gives spinning smoke. Replacing r̂, û with the velocity direction and its perpendicular gives stretched sparks and rain streaks.")}>
        {r`\mathbf w = \mathbf p + \frac{s}{2}\big(c'_x\,\hat{\mathbf r} + c'_y\,\hat{\mathbf u}\big) \qquad \begin{pmatrix} c'_x \\ c'_y \end{pmatrix} = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}\begin{pmatrix} c_x \\ c_y \end{pmatrix}`}
      </Equation>
      <CodeBlock lang="cpp" filename="render.cpp" t={t}>{`// Per-instance attributes: advance once per particle, not per vertex
glVertexAttribDivisor(0, 1);   // vec3  position
glVertexAttribDivisor(1, 1);   // float size
glVertexAttribDivisor(2, 1);   // vec4  colour
glVertexAttribDivisor(3, 1);   // float rotation

// Orphan, then fill: the driver hands out fresh memory instead of waiting
// for the GPU to finish reading last frame's data
glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
glBufferData(GL_ARRAY_BUFFER, capacity * sizeof(Instance), nullptr, GL_STREAM_DRAW);
glBufferSubData(GL_ARRAY_BUFFER, 0, alive * sizeof(Instance), instances.data());

glDepthMask(GL_FALSE);         // test against the scene, but never hide other particles
glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 4, alive);
glDepthMask(GL_TRUE);`}</CodeBlock>
      <CodeBlock lang="glsl" filename="particle.vert" t={t}>{`layout (location = 0) in vec3  iPos;
layout (location = 1) in float iSize;
layout (location = 2) in vec4  iColor;
layout (location = 3) in float iRot;
uniform mat4 view, projection;
out vec2 uv; out vec4 color;

void main() {
    vec2 c  = vec2(gl_VertexID & 1, gl_VertexID >> 1) * 2.0 - 1.0;   // no vertex buffer needed
    vec2 rc = mat2(cos(iRot), sin(iRot), -sin(iRot), cos(iRot)) * c;
    vec3 right = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 up    = vec3(view[0][1], view[1][1], view[2][1]);
    vec3 world = iPos + (right * rc.x + up * rc.y) * iSize * 0.5;
    uv = c * 0.5 + 0.5;  color = iColor;
    gl_Position = projection * view * vec4(world, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "oglPart_blendTitle", "Blending and sorting")}</H2>
      <Equation label={tx(t, "oglPart_blendLabel", "Three blend modes")}
        where={[
          [r`C_s,\ \alpha_s`, tx(t, "oglPart_wCs", "particle colour and opacity")],
          [r`C_d`, tx(t, "oglPart_wCd", "what is already in the framebuffer")],
        ]}
        notes={[
          tx(t, "oglPart_bn1", "Additive only adds, and addition commutes: any order gives the same result, so no sorting. Fire, sparks, glows."),
          tx(t, "oglPart_bn2", "Alpha (\"over\") does not commute: particles must be drawn back to front, sorted by view depth every frame."),
          tx(t, "oglPart_bn3", "Premultiplied stores C·α in the texture. α = 1 gives normal blending, α = 0 gives pure addition, so fire and smoke can share one pass and one blend state."),
        ]}>
        {r`\begin{aligned}
&\text{additive} && C = C_d + \alpha_s C_s && \texttt{(GL\_ONE, GL\_ONE)} \\
&\text{alpha} && C = \alpha_s C_s + (1 - \alpha_s)\,C_d && \texttt{(GL\_SRC\_ALPHA, GL\_ONE\_MINUS\_SRC\_ALPHA)} \\
&\text{premultiplied} && C = (\alpha_s C_s) + (1 - \alpha_s)\,C_d && \texttt{(GL\_ONE, GL\_ONE\_MINUS\_SRC\_ALPHA)}
\end{aligned}`}
      </Equation>
      <ParticlesFigure t={t} />
      <Equation label={tx(t, "oglPart_softLabel", "Soft particles")}
        where={[
          [r`z_{scene}`, tx(t, "oglPart_wZs", "linear depth of the opaque scene at this pixel (from the depth buffer)")],
          [r`z_p`, tx(t, "oglPart_wZp", "linear depth of the particle fragment")],
          [r`\delta`, tx(t, "oglPart_wDelta", "fade distance, e.g. 0.3 m")],
        ]}
        note={tx(t, "oglPart_softNote", "A flat quad crossing the floor shows a hard, straight line where it is clipped. Fading alpha as the particle gets close to the geometry behind it removes that line. It needs the scene's depth as a texture, so particles are drawn after the opaque pass with that depth bound for reading (and not attached for writing).")}
        glsl="alpha *= clamp((sceneDepth - particleDepth) / fadeDistance, 0.0, 1.0);">
        {r`\alpha' = \alpha \cdot \operatorname{saturate}\!\left(\frac{z_{scene} - z_p}{\delta}\right)`}
      </Equation>

      <H2>{tx(t, "oglPart_rainTitle", "Case study: rain")}</H2>
      <p>
        {tx(t, "oglPart_rainBody",
          "Rain is the textbook particle effect, and it needs a few ideas the general system above does not. The world is far too big to fill with drops. A drop is a streak, not a sprite. And drops have to react to what they hit. The figure puts it all together: the drops, the splash droplets they spawn on the pavement and the ripple rings they spawn on the pond are three pools, drawn with four instanced calls.")}
      </p>

      <RainFigure t={t} />

      <Equation label={tx(t, "oglPart_vtLabel", "Drops fall at a constant speed")}
        where={[
          [r`m g`, tx(t, "oglPart_wMg", "the drop's weight")],
          [r`\tfrac12 \rho_{air} C_d A\, v^2`, tx(t, "oglPart_wDrag", "air drag, which grows with the square of the speed. ρ_air is the air density (1.2 kg/m³), C_d the drag coefficient (≈ 0.5 for a sphere) and A the drop's cross-section")],
          [r`v_t`, tx(t, "oglPart_wVt", "terminal velocity, where drag equals weight. A drop reaches it within a few metres of falling: about 6.5 m/s for a 2 mm drop and 9 m/s for the largest")],
        ]}
        note={tx(t, "oglPart_vtNote", "So a rain drop needs no gravity integration at all: p += v·Δt with a constant v (plus wind), randomised by ±15% so the rain does not fall in lockstep. That also makes rain cheap enough to be computed without any simulation (see the tip below).")}>
        {r`m g = \tfrac12\,\rho_{air}\,C_d\,A\,v_t^2 \quad\Longrightarrow\quad v_t = \sqrt{\frac{2 m g}{\rho_{air}\,C_d\,A}}`}
      </Equation>

      <Equation label={tx(t, "oglPart_boxLabel", "A rain volume that travels with the camera")}
        where={[
          [r`B`, tx(t, "oglPart_wB", "half the width of the box around the camera. Drops only exist inside it")],
          [r`\mathbf c`, tx(t, "oglPart_wCam", "the camera position")],
          [r`\operatorname{round}`, tx(t, "oglPart_wRound", "rounding to the nearest integer: a drop that drifts out of one side re-enters on the opposite side (toroidal wrapping). The figure does it with two comparisons per axis, which is the same thing for drops that move less than 2B per frame")],
          [r`\rho`, tx(t, "oglPart_wRho", "density: drops spawned per second per square metre")],
        ]}
        note={tx(t, "oglPart_boxNote", "The number alive settles at spawn rate × lifetime: ρ·(2B)²·H/v_t. With ρ = 15, B = 10 m, H = 12 m and v_t = 9 m/s that is about 8000 drops. The same drops are recycled everywhere you go, and the viewer never notices, because every place looks equally rainy. Prewarming spawns the first frame's drops at random heights, so the volume starts full instead of beginning with one flat sheet falling from the top.")}
        glsl={`x -= 2.0 * B * round((x - cam.x) / (2.0 * B));\nz -= 2.0 * B * round((z - cam.z) / (2.0 * B));`}>
        {r`x \leftarrow x - 2B\,\operatorname{round}\!\Big(\frac{x - c_x}{2B}\Big) \qquad N_{alive} = \rho\,(2B)^2\,\frac{H}{v_t}`}
      </Equation>

      <Equation label={tx(t, "oglPart_streakLabel", "A streak is motion blur")}
        where={[
          [r`\Delta t_{shutter}`, tx(t, "oglPart_wShutter", "how long a camera (or an eye) integrates light for one image, ≈ 16 ms at 60 Hz")],
          [r`\mathbf p - \mathbf v\,\Delta t_{shutter}`, tx(t, "oglPart_wTail", "the tail: where the drop was when the exposure started. The head is where it is now")],
          [r`w_{min}`, tx(t, "oglPart_wWmin", "the world-space width of one pixel at distance d: the screen height spans 2d·tan(fov/2) metres, split into H_px pixels")],
        ]}
        note={tx(t, "oglPart_streakNote", "A drop is 2 mm across and nearly round. A photo of rain shows long lines only because it moves 14 cm during a 16 ms exposure. The quad is built in the vertex shader from the head, the tail, and a side vector cross(v, toCamera) that keeps it facing the viewer. Far streaks thinner than a pixel break into flickering dashes. Widening them to one pixel and dividing the alpha by the same factor keeps each streak's total light while removing the aliasing.")}
        glsl={`vec3 p = pos - vel * shutter * c.y;             // c.y: 0 head, 1 tail\nvec3 side = normalize(cross(vel, normalize(cam - pos)));\nfloat w = max(width, dist * pixel); alpha *= width / w;`}>
        {r`L = \lVert \mathbf v \rVert\,\Delta t_{shutter} \qquad w_{min} = \frac{2\,d\,\tan(\text{fov}/2)}{H_{px}} \qquad \alpha' = \alpha\,\frac{w}{\max(w,\ w_{min})}`}
      </Equation>

      <p>
        {tx(t, "oglPart_rainHit",
          "When a drop reaches the ground it dies and becomes something else. On pavement it spawns a few child particles: a crown of droplets thrown up and out, which fall back under gravity within a third of a second. This is a sub-emitter: one system's death events feed another system's spawn. On water it spawns a ripple: a flat decal quad lying on the surface, whose fragment shader draws a ring of radius r = c·age that fades out. The figure's ground is flat, so hitting it is y ≤ 0. Real games render a height map of the scene from above once (a rain occlusion map). A drop dies when it falls below the stored height, which also keeps it dry under roofs and trees.")}
      </p>

      <Callout type="tip" t={t}>
        {tx(t, "oglPart_rainStateless",
          "Because drops fall in straight lines at constant speed, rain can skip simulation entirely. Give each instance an id. In the vertex shader, hash the id into a start position and a phase, and compute the drop's height directly as y = top − v·fract(time/T + phase)·T, wrapped around the camera like above. There are no buffers to update and nothing to upload, and a million drops cost only their fill rate. Splashes can be placed the same way, at the moment fract() wraps around. Many shipped games draw their rain like this.")}
      </Callout>

      <H2>{tx(t, "oglPart_gpuTitle", "Moving the simulation to the GPU")}</H2>
      <p>
        {tx(t, "oglPart_gpuBody",
          "A CPU system handles tens of thousands of particles. Past that, the per-frame upload and the update loop become the bottleneck, and the simulation moves to the GPU, where the data never leaves video memory:")}
      </p>
      <LessonTable
        headers={[tx(t, "oglPart_thWay", "Approach"), tx(t, "oglPart_thHow", "How"), tx(t, "oglPart_thNote", "Notes")]}
        rows={[
          [tx(t, "oglPart_g1", "CPU + instancing"), tx(t, "oglPart_g1h", "simulate on the CPU, upload instances each frame"), tx(t, "oglPart_g1n", "simple, easy collisions with game logic; ~10⁴–10⁵ particles")],
          [tx(t, "oglPart_g2", "Transform feedback (GL 3)"), tx(t, "oglPart_g2h", "a vertex shader updates particles and writes them to a second buffer; ping-pong"), tx(t, "oglPart_g2n", "works everywhere, including WebGL2; awkward for spawning and killing")],
          [tx(t, "oglPart_g3", "Compute shader (GL 4.3)"), tx(t, "oglPart_g3h", "SSBO of particles, atomic counters for alive/dead lists, glDrawArraysIndirect"), tx(t, "oglPart_g3n", "millions of particles; see the Compute Shaders chapter")],
          [tx(t, "oglPart_g4", "GPU sorting"), tx(t, "oglPart_g4h", "bitonic or radix sort in compute on the depth keys"), tx(t, "oglPart_g4n", "only for alpha-blended systems; additive ones skip it")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "oglPart_fillTip",
          "The expensive part of particles is rarely the simulation. It is fill rate. A smoke column of 200 large quads can cover each pixel 50 times, each time running the fragment shader and a read-modify-write blend. Use smaller or fewer quads with better textures (flipbook atlases: frame = ⌊t · frames⌋), trim quads to the sprite's visible shape, and render heavy effects into a half-resolution buffer that is upsampled and composited.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglPart_pitfalls",
          "Leaving depth writes on makes particles cut rectangular holes in each other. Using a fixed per-frame spawn count or per-frame drag ties the effect to the frame rate. Sorting by distance to the camera instead of view depth flickers when particles cross each other at the screen edges. Point sprites (gl_PointSize) look tempting but have a hardware maximum size, cannot rotate, and pop out all at once when the centre leaves the screen. Instanced quads avoid all three.")}
      </Callout>

      <KeyIdeas t={t} id="oglPart" items={[
        "A particle is a small struct; its look comes from curves over normalised age t = age / life.",
        "Emit with an accumulator; integrate with semi-implicit Euler; apply drag as v·e^(−k·Δt).",
        "Pool with swap-remove keeps live particles packed: O(1) spawn and kill, one contiguous draw.",
        "Draw everything in one instanced call; build camera-facing quads in the vertex shader; depth test on, depth write off.",
        "Additive needs no sorting; alpha needs back-to-front order; premultiplied does both; fill rate is the real cost.",
        "Rain: a volume that follows the camera with wrapped drops, streaks as long as v × shutter, splashes and ripples as sub-emitters.",
      ]} />
    </Article>
  );
}
