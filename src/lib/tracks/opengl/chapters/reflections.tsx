"use client";

// "Reflections" (Advanced Techniques): planar mirrors, reflection probes with box projection, screen-space reflections.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { reflectNumbers, boxNumbers } from "@/lib/tracks/opengl/live/reflections";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SsrMarchFigure } from "@/components/lesson/figures/tech/SsrMarchFigure";
import { SsrFigure } from "@/components/lesson/figures/tech/SsrFigure";

const r = String.raw;

export function ReflectionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglRefl_intro",
          "A reflection shows, at each point of a shiny surface, what the view ray sees after bouncing off it. A rasteriser draws what the camera sees directly, and anything else has to be faked: by rendering the scene again from a mirrored camera, by pre-capturing the surroundings in cube maps, or by re-using the image already on screen. Real engines combine all three, each covering the others' blind spots.")}
      </Lead>

      <Goals t={t} id="oglRefl" items={[
        "Compute a reflected ray.",
        "Render planar reflections through a mirrored camera.",
        "Use reflection probes with box projection.",
        "Add screen-space reflections, and know their limits.",
      ]} />

      <H2>{tx(t, "oglRefl_reflectTitle", "The reflected ray")}</H2>
      <Equation label={tx(t, "oglRefl_reflectLabel", "Reflection direction")}
        where={[[r`\mathbf v`, tx(t, "oglRefl_wV", "unit direction from the camera to the surface point (the view ray)")], [r`\vN`, tx(t, "oglRefl_wN", "unit surface normal")]]}
        words={tx(t, "oglRefl_reflectWords", "Keep the part of the view ray that runs along the surface, and flip the part that goes into it. The ray bounces off at the same angle it arrived.")}
        note={tx(t, "oglRefl_reflectNote", "GLSL's reflect(v, n) is exactly this. Every method below answers the same question — what does the ray p + t·r hit? — with a different trade between cost and correctness. How much of that colour to show is Fresnel's job (see the Glass chapter): little when looking straight down at a floor, almost all at grazing angles.")}>
        {r`\mathbf r = \mathbf v - 2\,(\mathbf v\cdot\vN)\,\vN`}
      </Equation>
      <LiveFormula label={tx(t, "oglRefl_reflLive", "Try it: a view ray hitting a floor")}
        tex={r`\mathbf r = \mathbf v - 2\,(\mathbf v\cdot\vN)\,\vN \qquad \vN = (0,\ 1)`}
        vars={[
          { id: "th", label: "θ (°)", min: 0, max: 89, step: 1, value: 60, fmt: v => `${v}°` },
        ]}
        where={[
          [r`\theta`, tx(t, "oglRefl_wTh", "the angle between the view ray and the floor's normal: 0° looking straight down, near 90° at grazing angles")],
          [r`\mathbf v`, tx(t, "oglRefl_wV2", "the view ray, (sin θ, −cos θ): going down into the floor")],
        ]}
        compute={reflectNumbers(t)}
        note={tx(t, "oglRefl_reflLiveNote", "v·n is negative, because v goes into the surface, so −2(v·n)n adds an upward push of twice the downward part: the y component flips sign and x is untouched. The ray always leaves at θ from the normal, on the other side. At θ = 0 it comes straight back up.")} />

      <H2>{tx(t, "oglRefl_planarTitle", "Planar reflections: render through a mirror")}</H2>
      <p>
        {tx(t, "oglRefl_planarBody",
          "For a flat mirror, water surface or polished floor, what the reflection shows is exactly the scene seen by a camera mirrored through the plane. So render the scene a second time with the view matrix multiplied by a reflection matrix, into a texture. The reflective surface then samples that texture at its own screen position. The result is correct in every detail, including objects outside the main view.")}
      </p>
      <Equation label={tx(t, "oglRefl_mirrorLabel", "Reflection matrix for the plane n·x + d = 0")}
        where={[[r`\mathbf n = (a, b, c)`, tx(t, "oglRefl_wPn", "unit plane normal")], [r`d`, tx(t, "oglRefl_wD", "plane offset; for a floor at height h, n = (0, 1, 0), d = −h")]]}
        words={tx(t, "oglRefl_mirrorWords", "Measure how far a point is from the mirror plane and move it back through the plane by twice that distance. Written for x, y and z, that move is this matrix.")}
        note={tx(t, "oglRefl_mirrorNote", "It flips the winding of every triangle, so swap glFrontFace while rendering the reflection. Objects below the mirror plane must not appear in it. Clip them with gl_ClipDistance, or better, replace the projection's near plane with the mirror plane (Lengyel's oblique near-plane clipping), which clips for free.")}
        glm="glm::mat4 R = reflection(plane);  glm::mat4 reflectedView = view * R;">
        {r`R = \begin{pmatrix} 1 - 2a^2 & -2ab & -2ac & -2ad \\ -2ab & 1 - 2b^2 & -2bc & -2bd \\ -2ac & -2bc & 1 - 2c^2 & -2cd \\ 0 & 0 & 0 & 1 \end{pmatrix}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglRefl_mirDer", "Where the rows of R come from")}
        steps={[
          { full: true, tex: r`s = \mathbf n\cdot\mathbf p + d = a x + b y + c z + d`,
            why: tx(t, "oglRefl_rd1", "with n of length 1, s is the signed distance from the point p = (x, y, z) to the plane: positive on the side n points to") },
          { full: true, tex: r`\mathbf p' = \mathbf p - 2\,s\,\mathbf n`,
            why: tx(t, "oglRefl_rd2", "moving back by s along n reaches the plane; moving by 2s lands at the same distance on the other side") },
          { full: true, tex: r`\begin{aligned} x' &= x - 2a\,(a x + b y + c z + d) \\ &= (1 - 2a^2)\,x - 2ab\,y - 2ac\,z - 2ad \end{aligned}`,
            why: tx(t, "oglRefl_rd3", "the x component of that, multiplied out: its four coefficients are the first row of R. The y and z components give the second and third rows the same way") },
          { full: true, tex: r`\mathbf n = (0,\ 1,\ 0),\ d = -2,\ \mathbf p = (1,\ 5,\ 0):\quad s = 3,\ \ \mathbf p' = (1,\ -1,\ 0)`,
            why: tx(t, "oglRefl_rd4", "a floor at height 2 and a point 3 above it: the mirrored point is 3 below it. Only y changed, as the matrix's rows predict with a = c = 0, b = 1") },
        ]} />

      <H2>{tx(t, "oglRefl_probeTitle", "Reflection probes: cube maps with box projection")}</H2>
      <p>
        {tx(t, "oglRefl_probeBody",
          "For curved and scattered shiny surfaces, engines place reflection probes: points where the surroundings are captured into a cube map, baked offline or updated occasionally, and pre-filtered for roughness as in the IBL chapter. Sampling a cube map with r assumes the environment is infinitely far away, which is right for the sky and wrong for walls three metres away: the reflection slides as you move. Box projection (parallax-corrected cube maps) fixes this for room-shaped surroundings. Intersect the reflected ray with the room's box first, and look up the direction from the probe to that hit point:")}
      </p>
      <Equation label={tx(t, "oglRefl_boxLabel", "Parallax-corrected (box-projected) lookup")}
        where={[
          [r`\mathbf p`, tx(t, "oglRefl_wP", "the shaded point, world space")],
          [r`\mathbf b_{min}, \mathbf b_{max}`, tx(t, "oglRefl_wBox", "the room's box (the probe's influence volume)")],
          [r`\mathbf c`, tx(t, "oglRefl_wC", "where the probe was captured")],
        ]}
        words={tx(t, "oglRefl_boxWords", "Follow the reflected ray from the shaded point until it leaves the room's box. Then read the cube map in the direction from where it was captured to that exit point, not along the ray itself.")}
        note={tx(t, "oglRefl_boxNote", "The ray starts inside the box, so the exit distance is the smallest of the \"far\" slab distances. It is the slab test from the Picking chapter, keeping only t_exit. Then r' points from the capture position to where the reflection really lands on the wall.")}>
        {r`\begin{gathered} t = \min_{k \in \{x,y,z\}} \max\!\left(\frac{b_{max,k} - p_k}{r_k},\ \frac{b_{min,k} - p_k}{r_k}\right) \\[4pt] \mathbf r' = (\mathbf p + t\,\mathbf r) - \mathbf c \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglRefl_boxLive", "Try it: a 10 × 4 room seen from the side")}
        tex={r`t = \min_k \max\!\left(\frac{b_{max,k} - p_k}{r_k},\ \frac{b_{min,k} - p_k}{r_k}\right) \qquad \mathbf r' = (\mathbf p + t\,\mathbf r) - \mathbf c`}
        vars={[
          { id: "px", label: <>p<sub>x</sub></>, min: -4, max: 4, step: 0.25, value: 3, fmt: v => v.toFixed(2) },
          { id: "phi", label: "φ (°)", min: -75, max: 75, step: 5, value: 30, fmt: v => `${v}°` },
        ]}
        where={[
          [r`\mathbf b_{min},\ \mathbf b_{max}`, tx(t, "oglRefl_wBox2", "the room: x from −5 to 5, y from 0 (floor) to 4 (ceiling)")],
          [r`\mathbf c`, tx(t, "oglRefl_wC2", "the probe, captured in the middle of the room at (0, 2)")],
          [r`\mathbf p,\ \mathbf r`, tx(t, "oglRefl_wPR", "a floor point (p_x, 0) and its reflected ray, φ from straight up: (sin φ, cos φ)")],
        ]}
        compute={boxNumbers(t)}
        note={tx(t, "oglRefl_boxLiveNote", "From p_x = 3 at 30°, the ray hits the right wall at t = 4, at height 3.46. Seen from the probe that point is 73.7° from up, so a lookup along r (30°) would show the ceiling where the wall should be. Move p to the middle and point the ray straight up, and r and r′ agree, because that ray passes through the probe. Rays that miss the probe are all read in a wrong direction without the correction.")} />

      <H2>{tx(t, "oglRefl_ssrTitle", "Screen-space reflections")}</H2>
      <p>
        {tx(t, "oglRefl_ssrBody",
          "SSR traces the reflected ray through the depth buffer instead of the scene. Starting at the pixel's view-space position, step along r. Project each point to the screen and compare its depth with the depth buffer there. Once the ray is behind the stored surface, but by less than a thickness, it has hit that surface, and the reflection is simply the already-lit colour of that pixel. It costs the same whatever the scene contains, reflects everything the camera sees, and works on any surface orientation.")}
      </p>
      <SsrMarchFigure t={t} />
      <CodeBlock lang="glsl" filename="ssr.frag" t={t}>{`vec4 traceSSR(vec3 P, vec3 N) {              // view space: camera at the origin
    vec3 R = normalize(reflect(normalize(P), N));
    vec3 pos = P + N * 0.01, prev = pos;
    for (int i = 0; i < MAX_STEPS; ++i) {
        pos += R * stepLen;
        vec2 uv = project(pos);                                   // view → clip → [0, 1]
        if (any(lessThan(uv, vec2(0))) || any(greaterThan(uv, vec2(1)))) break;   // left the screen
        float sceneZ = texture(gPosition, uv).z;
        float dz = sceneZ - pos.z;                                // > 0: the ray is behind the surface
        if (dz > 0.0 && dz < thickness) {
            uv = binaryRefine(prev, pos);                        // pin down the crossing
            vec2 e = smoothstep(0.0, 0.1, uv) * smoothstep(0.0, 0.1, 1.0 - uv);
            return vec4(texture(litScene, uv).rgb, e.x * e.y);   // colour + confidence
        }
        prev = pos;
    }
    return vec4(0.0);                                             // miss: fall back to the probe
}`}</CodeBlock>
      <SsrFigure t={t} />
      <H3>{tx(t, "oglRefl_ssrLimitsTitle", "What SSR cannot do, and the usual fixes")}</H3>
      <LessonTable
        headers={[tx(t, "oglRefl_thProblem", "Problem"), tx(t, "oglRefl_thFix", "Fix")]}
        rows={[
          [tx(t, "oglRefl_p1", "Reflected objects off screen, or behind the camera"), tx(t, "oglRefl_f1", "fade by confidence and fall back to the reflection probe")],
          [tx(t, "oglRefl_p2", "Back faces and occluded surfaces are not in the depth buffer"), tx(t, "oglRefl_f2", "accept it; thickness tuning; probes or ray tracing for hero surfaces")],
          [tx(t, "oglRefl_p3", "Linear marching is slow and misses thin objects"), tx(t, "oglRefl_f3", "march in screen space (DDA over pixels) or with a Hi-Z mip chain: big empty regions skipped in one step")],
          [tx(t, "oglRefl_p4", "Rough surfaces need blurry reflections"), tx(t, "oglRefl_f4", "trace a cone: sample a blurred mip of the scene colour chosen by roughness × distance; or several jittered rays + temporal filtering")],
          [tx(t, "oglRefl_p5", "Noise and flicker"), tx(t, "oglRefl_f5", "jitter the start, resolve at half resolution, temporal accumulation (as in TAA)")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglRefl_layerNote", "A modern reflection stack, from most to least accurate: ray-traced reflections where hardware allows (RT cores, or Lumen's software tracing against distance fields), then SSR, then local box-projected probes blended by influence volume, then the sky probe. Each layer fills the pixels where the one above has no confident answer.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "oglRefl_pitfalls",
          "Planar reflections double the scene cost per mirror, so give them lower LODs, no shadows and a reduced resolution. With SSR, mind the precision of the depth or position buffer (use a float G-buffer, or reconstruct view positions from the depth texture) and the self-intersection at the start of the ray: offset along the normal. Reflections belong in the lighting pass, before tone mapping, because the reflected colours are HDR too.")}
      </Callout>

      <KeyIdeas t={t} id="oglRefl" items={[
        "r = v − 2(v·n)n; how much of the reflection shows is the Fresnel term.",
        "Planar: render the scene again through a reflection matrix; exact, one extra pass per plane.",
        "Probes: cube maps of the surroundings; box projection corrects the parallax for rooms.",
        "SSR marches the reflected ray against the depth buffer and reuses the lit image; only what is on screen can be reflected.",
        "Engines layer them: RT or SSR where confident, probes behind, the sky last.",
      ]} />
    </Article>
  );
}
