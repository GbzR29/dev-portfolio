// src/lib/tracks/opengl/chapters/post/parallax.tsx
"use client";

// Parallax Mapping (Post-Processing & Effects): the one-step offset, steep parallax
// layers and parallax occlusion mapping.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { layerNumbers, offsetNumbers } from "../../live/parallax";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ParallaxRayFigure } from "@/components/lesson/figures/post/ParallaxRayFigure";
import { ParallaxFigure } from "@/components/lesson/figures/post/ParallaxFigure";

const r = String.raw;

export function ParallaxContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglPar_intro",
          "Normal mapping fakes the lighting of a bumpy surface, but the texture stays glued to the flat polygon. Look at a brick wall at a grazing angle and the bricks should hide the mortar behind them, which normal mapping cannot do. Parallax mapping shifts the texture coordinates per pixel, using a depth map, to show what you would see if the surface really had depth.")}
      </Lead>

      <Goals t={t} id="oglPar" items={[
        "Shift texture coordinates to fake depth on a flat surface.",
        "March through layers for steep parallax.",
        "Interpolate between layers for parallax occlusion mapping.",
      ]} />

      <H2>{tx(t, "oglPar_ideaTitle", "The offset")}</H2>
      <p>
        {tx(t, "oglPar_ideaBody",
          "The view ray hits the flat polygon at texture coordinate A. On the real, bumpy surface it would have continued downward and hit a point further along, at B. If we knew B, sampling every texture (albedo, normal map) at B instead of A would produce the illusion. Plain parallax mapping estimates B with a single step: read the depth at A, and walk that far along the view direction projected onto the surface:")}
      </p>
      <Equation label={tx(t, "oglPar_offsetLabel", "Parallax offset in tangent space")}
        where={[
          [r`\vV`, tx(t, "oglPar_wV", "unit vector from the fragment toward the eye, in tangent space (z = along the normal)")],
          [r`d(A)`, tx(t, "oglPar_wD", "depth map value at A, in [0, 1] — white = deep")],
          [r`s`, tx(t, "oglPar_wS", "height scale: how deep 1.0 in the map is, in UV units (typically 0.02 – 0.1)")],
          [r`\mathbf{P}`, tx(t, "oglPar_wPoff", "the 2D shift of the texture coordinates")],
          [r`uv_A,\ uv_B`, tx(t, "oglPar_wUvAB", "where the ray meets the flat polygon, and the estimate of where it would meet the real bumpy surface")],
        ]}
        note={tx(t, "oglPar_offsetNote", "Dividing by V.z makes the offset grow at grazing angles, where a real surface would shift the most. Dropping that division gives \"parallax with offset limiting\": less accurate, but it cannot fly off at the horizon.")}
        glsl="vec2 p = V.xy / V.z * (texture(depthMap, uv).r * heightScale);  uv -= p;"
        words={tx(t, "oglPar_offsetWords", "Read how deep the surface is at A. A ray that sinks that deep also slides sideways, farther the more it is tilted. Move the texture coordinates back by that slide, against the direction of the eye.")}>
        {r`\mathbf{P} = \frac{\vV_{xy}}{\vV_z}\; d(A)\; s \qquad uv_B \approx uv_A - \mathbf{P}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPar_tanDer", "Why V.xy / V.z is the sideways slide per unit of depth")}
        steps={[
          { full: true, tex: r`\vV = (\sin\theta\cos\varphi,\ \sin\theta\sin\varphi,\ \cos\theta)`,
            why: tx(t, "oglPar_td1", "a unit vector θ away from the normal (the z axis in tangent space), turned by φ around it") },
          { full: true, tex: r`\lVert \vV_{xy} \rVert = \sin\theta\sqrt{\cos^2\varphi + \sin^2\varphi} = \sin\theta \qquad \frac{\lVert \vV_{xy} \rVert}{\vV_z} = \frac{\sin\theta}{\cos\theta} = \tan\theta`,
            why: tx(t, "oglPar_td2", "the part along the surface has length sin θ, the part along the normal cos θ") },
          { full: true, tex: r`h = d(A)\,s \;\Rightarrow\; \lVert \mathbf{P} \rVert = h\,\tan\theta`,
            why: tx(t, "oglPar_td3", "a right triangle: the ray sinks h along the normal and slides h·tan θ along the surface. Straight on (θ = 0) there is no slide; at 45° the slide equals the depth") },
          { full: true, tex: r`uv_B \approx uv_A - \mathbf{P}`,
            why: tx(t, "oglPar_td4", "V points from the surface toward the eye, and the ray travels the other way, into the surface: hence the minus sign") },
        ]} />
      <LiveFormula label={tx(t, "oglPar_liveOffset", "Try it: how far does the texture shift?")}
        tex={r`\lvert \mathbf{P} \rvert = \tan\theta \cdot d(A) \cdot s`}
        vars={[
          { id: "theta", label: "θ", min: 0, max: 85, step: 1, value: 60, fmt: v => `${v}°` },
          { id: "d", label: "d(A)", min: 0, max: 1, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
          { id: "s", label: "s", min: 0.01, max: 0.1, step: 0.005, value: 0.05, fmt: v => v.toFixed(3) },
        ]}
        where={[[r`\theta`, tx(t, "oglPar_wTheta", "the angle between the view direction and the surface normal")]]}
        compute={offsetNumbers(t)}
        note={tx(t, "oglPar_liveOffsetNote", "At 60° the shift is 1.7 times the depth: 44 texels on a 1024² map. At 85° tan θ is 11.4 and the shift is 0.29 of the whole texture, which is the \"flying off at the horizon\" the note warns about.")} />
      <p>
        {tx(t, "oglPar_tangent",
          "The texture coordinates live in tangent space, so the view vector must be in tangent space too: the same TBN matrix as normal mapping, transposed (it is orthonormal, so transpose = inverse). Doing that in the vertex shader saves a matrix multiply per pixel.")}
      </p>
      <CodeBlock lang="glsl" filename="parallax.vert" t={t}>{`vec3 T = normalize(mat3(model) * aTangent);
vec3 N = normalize(mat3(model) * aNormal);
T = normalize(T - dot(T, N) * N);
vec3 B = cross(N, T);
mat3 TBN = transpose(mat3(T, B, N));          // world → tangent

vs_out.TangentViewPos = TBN * viewPos;
vs_out.TangentFragPos = TBN * vec3(model * vec4(aPos, 1.0));
vs_out.TangentLightPos = TBN * lightPos;`}</CodeBlock>

      <ParallaxRayFigure t={t} />

      <H2>{tx(t, "oglPar_steepTitle", "Steep parallax: march in layers")}</H2>
      <p>
        {tx(t, "oglPar_steepBody",
          "One step is too optimistic when the depth changes quickly. Steep parallax mapping walks along the ray in equal depth layers. At each step it moves the UV by P/n and goes down 1/n in depth, and it stops at the first layer that is below the depth map. Grazing views need more layers, so the count adapts to the angle:")}
      </p>
      <Equation label={tx(t, "oglPar_layersLabel", "Layer count and step")}
        glsl="float n = mix(maxLayers, minLayers, abs(dot(vec3(0,0,1), V)));  vec2 dUV = P / n;"
        where={[
          [r`n_{max},\ n_{min}`, tx(t, "oglPar_wNmm", "the most and fewest layers: 32 and 8 in the code below")],
          [r`\lvert \vV_z \rvert`, tx(t, "oglPar_wVz", "cos θ: 1 when looking straight at the surface, near 0 at a grazing angle")],
          [r`\operatorname{mix}(a, b, f)`, tx(t, "oglPar_wMix", "a + (b − a)·f, GLSL's name for lerp")],
          [r`\mathbf{P}`, tx(t, "oglPar_wPfull", "here the shift for the full depth 1, V.xy / V.z · s; each step takes an n-th of it")],
        ]}
        words={tx(t, "oglPar_layersWords", "Looking straight at the surface, use few layers; at a grazing angle, many. Then split both the depth range and the total shift into that many equal steps.")}>
        {r`n = \operatorname{mix}(n_{max},\ n_{min},\ \lvert \vV_z \rvert) \qquad \Delta uv = \frac{\mathbf{P}}{n},\quad \Delta d = \frac{1}{n}`}
      </Equation>
      <LiveFormula label={tx(t, "oglPar_liveLayers", "Try it: how many layers at this angle?")}
        tex={r`n = \operatorname{mix}(32,\ 8,\ \cos\theta) \qquad \Delta d = \frac{1}{n} \qquad \lvert \Delta uv \rvert = \frac{\tan\theta \cdot s}{n}`}
        vars={[
          { id: "theta", label: "θ", min: 0, max: 85, step: 1, value: 60, fmt: v => `${v}°` },
          { id: "s", label: "s", min: 0.01, max: 0.1, step: 0.005, value: 0.05, fmt: v => v.toFixed(3) },
        ]}
        compute={layerNumbers(t)}
        note={tx(t, "oglPar_liveLayersNote", "Straight on, 8 layers suffice because the ray barely slides. At 60° it takes 20, and near the horizon almost 30, because the ray slides far and each step must stay small. The code's loop counter is a float, so n need not be a whole number.")} />
      <CodeBlock lang="glsl" filename="steep_parallax.frag" t={t}>{`vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir) {
    const float minLayers = 8.0, maxLayers = 32.0;
    float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));
    float layerDepth = 1.0 / numLayers;
    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / numLayers;

    float currentLayerDepth = 0.0;
    vec2  currentTexCoords  = texCoords;
    float currentDepthMapValue = texture(depthMap, currentTexCoords).r;
    while (currentLayerDepth < currentDepthMapValue) {
        currentTexCoords -= deltaTexCoords;
        currentDepthMapValue = texture(depthMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
    }
    return currentTexCoords;    // steep parallax stops here — POM continues below
}`}</CodeBlock>

      <H2>{tx(t, "oglPar_pomTitle", "Parallax occlusion mapping: interpolate")}</H2>
      <p>
        {tx(t, "oglPar_pomBody",
          "Steep parallax returns the first layer below the surface, so its answer snaps to the layer grid and shows slices. POM takes the last point above the surface and the first point below it. Between them the depth map is treated as a straight line, and it computes where the ray crosses that line:")}
      </p>
      <Equation label={tx(t, "oglPar_pomLabel", "Linear interpolation between the last two steps")}
        where={[
          [r`a = d(uv_k) - \ell_k`, tx(t, "oglPar_wA", "after: how far below the map the ray is at the first step past it (≤ 0)")],
          [r`b = d(uv_{k-1}) - \ell_{k-1}`, tx(t, "oglPar_wB", "before: how far above the map it was one step earlier (> 0)")],
          [r`\ell_k`, tx(t, "oglPar_wEll", "the depth of layer k: k · Δd")],
          [r`uv_k`, tx(t, "oglPar_wUvk", "the texture coordinate after k steps; uv_{k−1} is one step earlier")],
          [r`w`, tx(t, "oglPar_wW", "the weight of the earlier point in the blend")],
        ]}
        words={tx(t, "oglPar_pomWords", "One step before, the ray was above the surface by some amount; one step later, below it by some amount. Assume it crossed at a steady rate in between, and blend the two texture coordinates in proportion to those two amounts.")}>
        {r`w = \frac{a}{a - b} \qquad uv_{final} = w\,uv_{k-1} + (1 - w)\,uv_k`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglPar_pomDer", "Where the weight w comes from")}
        steps={[
          { full: true, tex: r`f(\tau) = b + \tau\,(a - b), \qquad \tau \in [0, 1]`,
            why: tx(t, "oglPar_pd1", "the gap between the depth map and the ray, treated as a straight line from b (step k − 1, τ = 0) to a (step k, τ = 1). The code's afterDepth and beforeDepth hold the depth map minus the layer, so above the surface means the map is deeper than the ray") },
          { full: true, tex: r`f(\tau) = 0 \;\Rightarrow\; \tau = \frac{b}{b - a}`,
            why: tx(t, "oglPar_pd2", "the ray meets the surface where the gap is zero. b > 0 and a ≤ 0, so τ lies between 0 and 1") },
          { full: true, tex: r`uv_{final} = (1 - \tau)\,uv_{k-1} + \tau\,uv_k`,
            why: tx(t, "oglPar_pd3", "walk the same fraction τ of the way from the earlier coordinate to the later one") },
          { full: true, tex: r`w = 1 - \tau = \frac{b - a - b}{b - a} = \frac{-a}{b - a} = \frac{a}{a - b}`,
            why: tx(t, "oglPar_pd4", "the weight of the earlier coordinate is 1 − τ. Multiplying top and bottom by −1 gives the form the shader uses: weight = after / (after − before)") },
        ]} />
      <CodeBlock lang="glsl" filename="pom.frag" t={t}>{`    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(depthMap, prevTexCoords).r - currentLayerDepth + layerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);
    return prevTexCoords * weight + currentTexCoords * (1.0 - weight);
}

void main() {
    vec3 viewDir = normalize(fs_in.TangentViewPos - fs_in.TangentFragPos);
    vec2 uv = ParallaxMapping(fs_in.TexCoords, viewDir);
    if (uv.x > 1.0 || uv.y > 1.0 || uv.x < 0.0 || uv.y < 0.0) discard;   // clean edges
    vec3 normal = normalize(texture(normalMap, uv).rgb * 2.0 - 1.0);        // sample EVERYTHING at uv
    vec3 color  = texture(diffuseMap, uv).rgb;
    // … lighting as in Normal Mapping
}`}</CodeBlock>

      <ParallaxFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglPar_thMethod", "Method"), tx(t, "oglPar_thReads", "Depth reads"), tx(t, "oglPar_thLooks", "Looks")]}
        rows={[
          [tx(t, "oglPar_m1", "Normal mapping"), "0", tx(t, "oglPar_m1l", "correct lighting, flat texture")],
          [tx(t, "oglPar_m2", "Parallax (one step)"), "1", tx(t, "oglPar_m2l", "good for shallow detail; swims at grazing angles")],
          [tx(t, "oglPar_m3", "Steep parallax"), "n (8 – 32)", tx(t, "oglPar_m3l", "real occlusion; visible layer slices")],
          [tx(t, "oglPar_m4", "POM"), "n + 1", tx(t, "oglPar_m4l", "smooth and solid — the standard choice")],
          [tx(t, "oglPar_m5", "Relief mapping / tessellation"), tx(t, "oglPar_m5r", "n + binary search / real geometry"), tx(t, "oglPar_m5l", "exact hit / true silhouettes")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglPar_pitfalls",
          "POM is still one flat polygon. Silhouettes and intersections with other geometry stay flat, and the depth buffer knows nothing about the fake depth. Sample the depth map with textureGrad or textureLod inside the loop: with dynamic loops the implicit derivatives are undefined, which on some GPUs gives sparkling pixels. A depth map where white means \"high\" (a height map) must be inverted first: use 1 − h.")}
      </Callout>

      <KeyIdeas t={t} id="oglPar" items={[
        "Parallax mapping moves the UV along the tangent-space view direction: P = V.xy / V.z · depth · scale.",
        "Every map (albedo, normal, roughness…) is then sampled at the shifted UV.",
        "Steep parallax marches in n depth layers (more at grazing angles) until it goes below the depth map.",
        "POM linearly interpolates between the last step above and the first below — smooth with few layers.",
        "It is a pixel illusion: silhouettes and depth-buffer intersections stay flat.",
      ]} />
    </Article>
  );
}
