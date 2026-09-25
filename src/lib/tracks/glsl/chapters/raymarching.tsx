"use client";

// "Raymarching": rendering 3D signed distance fields entirely in a fragment shader.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "../../opengl/chapters/lighting-advanced";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { RaymarchSliceFigure } from "@/components/lesson/glsl/RaymarchSliceFigure";
import { RAYMARCH_PRESETS } from "../presets/effects";

const r = String.raw;

export function RaymarchingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslRm_intro",
          "The SDF chapter drew 2D shapes from distance functions. The same idea in 3D renders whole scenes with no meshes at all: for each pixel, shoot a ray from the camera and walk along it until it reaches a surface described by a function. It is how most ShaderToy scenes, many demoscene intros and several games' clouds and fractals are made.")}
      </Lead>

      <H2>{tx(t, "glslRm_camTitle", "A ray per pixel")}</H2>
      <Equation label={tx(t, "glslRm_camLabel", "Camera ray")}
        where={[
          [r`\mathbf{ro}`, tx(t, "glslRm_wRo", "ray origin: the camera position")],
          [r`\mathbf u, \mathbf v, \mathbf w`, tx(t, "glslRm_wUvw", "camera right, up and forward, from a look-at: w = normalize(target − ro), u = normalize(w × up), v = u × w")],
          [r`p`, tx(t, "glslRm_wP", "the pixel in centred coordinates, (2·fragCoord − resolution) / resolution.y")],
          [r`z`, tx(t, "glslRm_wZ", "focal length; larger = narrower field of view (fov = 2·atan(1/z))")],
        ]}>
        {r`\mathbf{rd} = \operatorname{normalize}\big(p_x\,\mathbf u + p_y\,\mathbf v + z\,\mathbf w\big) \qquad \text{point}(t) = \mathbf{ro} + t\,\mathbf{rd}`}
      </Equation>

      <H2>{tx(t, "glslRm_traceTitle", "Sphere tracing")}</H2>
      <p>
        {tx(t, "glslRm_traceBody",
          "Ray-marching with fixed steps is slow and misses thin objects. With a distance function there is a better way (Hart, 1996). At any point, map(p) is the distance to the nearest surface, so a sphere of that radius around p contains nothing. The ray can jump exactly that far, safely. Far from everything the jumps are huge; near a surface they shrink, and the loop stops when the distance drops below a small ε:")}
      </p>
      <Equation label={tx(t, "glslRm_stLabel", "The sphere-tracing iteration")}
        note={tx(t, "glslRm_stNote", "Scaling ε with t (a hit threshold that grows with distance) keeps the precision about one pixel everywhere and saves steps far away. The loop needs a maximum step count and a maximum distance; rays that run out either missed or were grazing a surface.")}>
        {r`t_{i+1} = t_i + \operatorname{map}(\mathbf{ro} + t_i\,\mathbf{rd}) \qquad \text{hit when } \operatorname{map}(\cdot) < \varepsilon\,t_i`}
      </Equation>
      <RaymarchSliceFigure t={t} />

      <H2>{tx(t, "glslRm_sdfTitle", "3D distance functions")}</H2>
      <LessonTable
        headers={[tx(t, "glslRm_thShape", "Shape"), "SDF", tx(t, "glslRm_thNote", "Notes")]}
        rows={[
          [tx(t, "glslRm_s1", "Sphere"), "length(p) − r", tx(t, "glslRm_s1n", "exact")],
          [tx(t, "glslRm_s2", "Box"), "length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0), q = |p| − b", tx(t, "glslRm_s2n", "exact; subtract r for rounded edges")],
          [tx(t, "glslRm_s3", "Torus"), "length(vec2(length(p.xz) − R, p.y)) − r", tx(t, "glslRm_s3n", "a 2D circle revolved around y")],
          [tx(t, "glslRm_s4", "Capsule"), "distance to segment ab − r", tx(t, "glslRm_s4n", "great for limbs and pipes")],
          [tx(t, "glslRm_s5", "Plane"), "dot(p, n) + h", tx(t, "glslRm_s5n", "n unit length")],
        ]}
      />
      <Equation label={tx(t, "glslRm_opsLabel", "Combining and deforming")}
        notes={[
          tx(t, "glslRm_o1", "Union, intersection, subtraction and smin work exactly as in 2D."),
          tx(t, "glslRm_o2", "Domain repetition: evaluate the SDF at mod(p + c/2, c) − c/2 to get an infinite grid of copies for the price of one."),
          tx(t, "glslRm_o3", "Twists, bends and displacements (adding noise to the distance) break the distance property. Scale the step by 0.5–0.8 to stay safe."),
        ]}>
        {r`\cup = \min(d_1, d_2) \qquad \cap = \max(d_1, d_2) \qquad d_1 \setminus d_2 = \max(d_1, -d_2) \qquad \text{repeat: } p' = \operatorname{mod}(p + \tfrac{c}{2}, c) - \tfrac{c}{2}`}
      </Equation>

      <H2>{tx(t, "glslRm_shadeTitle", "Normals, shadows and occlusion — all from map()")}</H2>
      <Equation label={tx(t, "glslRm_normalLabel", "The normal is the gradient of the distance field")}
        where={[[r`\varepsilon`, tx(t, "glslRm_wEps", "a small offset, ~0.001 × scene scale")]]}
        note={tx(t, "glslRm_normalNote", "Six map() calls, or four with the tetrahedron trick. The same field that finds the surface also orients it.")}>
        {r`\mathbf n = \operatorname{normalize}\big(\nabla \operatorname{map}(p)\big) \approx \operatorname{normalize}\begin{pmatrix} \operatorname{map}(p + \varepsilon\hat x) - \operatorname{map}(p - \varepsilon\hat x) \\ \operatorname{map}(p + \varepsilon\hat y) - \operatorname{map}(p - \varepsilon\hat y) \\ \operatorname{map}(p + \varepsilon\hat z) - \operatorname{map}(p - \varepsilon\hat z) \end{pmatrix}`}
      </Equation>
      <Equation label={tx(t, "glslRm_softLabel", "Soft shadows (Quílez)")}
        where={[[r`h`, tx(t, "glslRm_wH", "the distance field along the shadow ray")], [r`k`, tx(t, "glslRm_wK", "sharpness: 2 = very soft, 32 = nearly hard")]]}
        note={tx(t, "glslRm_softNote", "March from the surface toward the light. If the ray ever passes close to geometry (small h) early on (small t), the point is in penumbra. The ratio h/t is roughly the angle by which the ray missed an occluder, so the result behaves like an area light, for the price of one extra march.")}>
        {r`\text{shadow} = \min_{t}\ \operatorname{clamp}\!\left(\frac{k\,h(t)}{t},\ 0,\ 1\right)`}
      </Equation>
      <CodeBlock lang="glsl" filename="raymarch_core.glsl" t={t}>{`float march(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 128; i++) {
        float h = map(ro + rd * t);
        if (h < 0.0005 * t) return t;     // hit: close enough for this distance
        t += h;
        if (t > 50.0) break;               // left the scene
    }
    return -1.0;
}

float ambientOcclusion(vec3 p, vec3 n) {   // how "open" is the space above p?
    float occ = 0.0, w = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.02 + 0.12 * float(i);
        occ += (h - map(p + n * h)) * w;   // expected distance − actual distance
        w *= 0.85;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}`}</CodeBlock>
      <ShaderPlayground presets={RAYMARCH_PRESETS} t={t} id="glslRm" />

      <Callout type="info" t={t}>
        {tx(t, "glslRm_whereNote", "Outside ShaderToy, raymarching lives inside ordinary renderers: volumetric clouds and fog (marching density instead of distance), screen-space reflections and shadows (marching the depth buffer), SDF-based soft shadows and GI (Unreal's distance field shadows and Lumen), and games built entirely on SDFs such as Dreams and Claybook. Mixing it with rasterised geometry only needs the depth: write gl_FragDepth from the hit distance.")}
      </Callout>
      <Callout type="warn" t={t}>
        {tx(t, "glslRm_perfWarn", "Every pixel runs the whole loop, and every step evaluates the whole scene. Cost is pixels × steps × scene complexity. Bound the scene (skip map() when the ray misses a bounding sphere), keep map() branch-light, and render at reduced resolution on weak GPUs. The heat-map toggle shows where the steps go: silhouettes and grazing planes are the expensive pixels.")}
      </Callout>

      <KeyIdeas t={t} id="glslRm" items={[
        "One ray per pixel: rd = normalize(p.x·u + p.y·v + z·w) from a look-at basis.",
        "Sphere tracing jumps by the distance field: t += map(ro + t·rd), stop at map < ε·t.",
        "3D SDFs combine with min/max/smin and repeat with mod, exactly like 2D.",
        "Normal = gradient of map; soft shadows = min(k·h/t) along a shadow ray; AO = a few samples along n.",
        "Cost scales with pixels × steps × scene: bound it, and watch the step heat map.",
      ]} />
    </Article>
  );
}
