"use client";

// "Order-Independent Transparency" (Advanced Techniques): why blending needs order, and the ways around it.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { OitLayersFigure } from "@/components/lesson/figures/tech/OitLayersFigure";
import { OitSceneFigure } from "@/components/lesson/figures/tech/OitSceneFigure";

const r = String.raw;

export function OitContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglOit_intro",
          "The Blending chapter ended with a rule: draw transparent objects back to front. The rule exists because the blending equation depends on order. Sorting works for separate objects, but fails for objects that intersect, objects that contain each other, or a single mesh folding over itself (hair, foliage, a glass bottle). Order-independent transparency (OIT) techniques get correct or nearly correct results without sorting.")}
      </Lead>

      <H2>{tx(t, "oglOit_overTitle", "Why order matters")}</H2>
      <Equation label={tx(t, "oglOit_overLabel", "The \"over\" operator, applied layer by layer")}
        where={[
          [r`C_{dst}`, tx(t, "oglOit_wDst", "the colour already in the framebuffer")],
          [r`C_i,\ \alpha_i`, tx(t, "oglOit_wCi", "the incoming layer's colour and opacity")],
        ]}
        note={tx(t, "oglOit_overNote", "Unrolled for n layers sorted far to near, each colour is attenuated by the transparency of every layer in front of it, so which layers are in front matters. Swap two layers and the products change. The operation is associative but not commutative, and the GPU applies it in draw order.")}>
        {r`C_{dst}' = \alpha_i\,C_i + (1 - \alpha_i)\,C_{dst} \qquad C = \sum_{i=1}^{n} \alpha_i\,C_i \prod_{j < i} (1 - \alpha_j) \;+\; C_{bg} \prod_{j=1}^{n} (1 - \alpha_j)`}
      </Equation>
      <p>
        {tx(t, "oglOit_overBody", "In the second form the layers are indexed from the nearest (j < i are the layers in front of layer i). The last term is the key to cheap OIT. The background's share, the product of all transparencies, does not depend on order at all. Only how the layers' own colours are weighted does.")}
      </p>
      <OitLayersFigure t={t} />

      <H2>{tx(t, "oglOit_exactTitle", "Exact methods")}</H2>
      <p>
        {tx(t, "oglOit_exactBody",
          "Depth peeling (Everitt, 2001) renders the transparent geometry several times. Each pass uses the previous pass's depth to reject everything in front of it, which \"peels off\" the nearest remaining layer per pixel, and composites the layers in order. It is exact after n passes for n layers but costs n full passes. Per-pixel linked lists (the A-buffer, GL 4.2+) store every transparent fragment of the frame in one big buffer, sort each pixel's list in a fullscreen pass, and composite. That is exact in a single geometry pass, with unbounded memory:")}
      </p>
      <CodeBlock lang="glsl" filename="abuffer_store.frag" t={t}>{`// Pass 1: every transparent fragment appends itself to its pixel's list
layout(binding = 0, r32ui) uniform coherent uimage2D headPtr;   // per pixel: index of the newest node
layout(binding = 0, offset = 0) uniform atomic_uint nodeCounter;
struct Node { vec4 color; float depth; uint next; };
layout(std430, binding = 1) buffer Nodes { Node nodes[]; };

void main() {
    uint idx = atomicCounterIncrement(nodeCounter);             // reserve a slot
    if (idx >= nodes.length()) discard;                          // out of memory: drop the fragment
    uint prev = imageAtomicExchange(headPtr, ivec2(gl_FragCoord.xy), idx);
    nodes[idx] = Node(vec4(shade(), alpha), gl_FragCoord.z, prev);   // push-front
}
// Pass 2 (fullscreen): walk the list, copy up to ~32 nodes to a local array,
// insertion-sort by depth, composite back to front over the opaque colour.`}</CodeBlock>

      <H2>{tx(t, "oglOit_wboitTitle", "Weighted blended OIT")}</H2>
      <p>
        {tx(t, "oglOit_wboitBody",
          "McGuire and Bavoil (2013) keep the background term exact and replace the order-dependent part with a weighted average of the layers' colours. The weight is a function of depth, so that nearer layers, which would have covered the others, count more. Everything becomes a sum and a product, and sums and products don't care about order:")}
      </p>
      <Equation label={tx(t, "oglOit_wbLabel", "Weighted blended OIT")}
        where={[
          [r`w(z_i, \alpha_i)`, tx(t, "oglOit_wW", "a weight that falls with view depth z; McGuire's eq. 7: α·clamp(10 / (10⁻⁵ + (z/5)² + (z/200)⁶), 10⁻², 3·10³)")],
          [r`\text{accum}`, tx(t, "oglOit_wAcc", "RGBA16F target, blended ONE, ONE: rgb = Σ w α C, a = Σ w α")],
          [r`\text{reveal}`, tx(t, "oglOit_wRev", "R8 target cleared to 1, blended ZERO, ONE_MINUS_SRC_COLOR: Π (1 − α)")],
        ]}
        note={tx(t, "oglOit_wbNote", "The result is exact when all layers have the same colour, and when there is only one layer. Its error grows with strongly differing colours at very different depths. The weight's range must fit in half floats, which is what the clamp is for, and it needs tuning to the scene's depth range.")}>
        {r`C \approx \frac{\sum_i w_i\,\alpha_i\,C_i}{\sum_i w_i\,\alpha_i}\,\Big(1 - \prod_i (1 - \alpha_i)\Big) + C_{bg}\prod_i (1 - \alpha_i)`}
      </Equation>
      <CodeBlock lang="cpp" filename="wboit.cpp" t={t}>{`// Two colour attachments, one pass: per-attachment blending (GL 4.0 glBlendFunci)
glNamedFramebufferDrawBuffers(oitFbo, 2, (GLenum[]){ GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1 });
glClearNamedFramebufferfv(oitFbo, GL_COLOR, 0, (float[]){ 0, 0, 0, 0 });  // accum
glClearNamedFramebufferfv(oitFbo, GL_COLOR, 1, (float[]){ 1, 1, 1, 1 });  // revealage
glEnable(GL_BLEND);
glBlendFunci(0, GL_ONE,  GL_ONE);                   // accum:  sum
glBlendFunci(1, GL_ZERO, GL_ONE_MINUS_SRC_COLOR);   // reveal: product of (1 − α)
glDepthMask(GL_FALSE);                              // test against opaque depth, don't write
drawTransparent();                                  // any order!

// transparent.frag
//   layout(location = 0) out vec4 accum;
//   layout(location = 1) out float reveal;
//   float w = clamp(10.0 / (1e-5 + pow(z / 5.0, 2.0) + pow(z / 200.0, 6.0)), 1e-2, 3e3);
//   accum  = vec4(color.rgb * color.a, color.a) * w;
//   reveal = color.a;
// composite.frag (fullscreen, blended over the opaque image with SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
//   vec4 a = texelFetch(accumTex, p, 0);  float r = texelFetch(revealTex, p, 0).r;
//   FragColor = vec4(a.rgb / max(a.a, 1e-5), 1.0 - r);`}</CodeBlock>
      <OitSceneFigure t={t} />

      <LessonTable
        headers={[tx(t, "oglOit_thMethod", "Method"), tx(t, "oglOit_thCost", "Cost"), tx(t, "oglOit_thQuality", "Quality"), tx(t, "oglOit_thUse", "Used for")]}
        rows={[
          [tx(t, "oglOit_m1", "Sort objects, over-blend"), tx(t, "oglOit_m1c", "a CPU sort"), tx(t, "oglOit_m1q", "exact for separate convex objects; fails on intersections"), tx(t, "oglOit_m1u", "the default everywhere")],
          [tx(t, "oglOit_m2", "Depth peeling"), tx(t, "oglOit_m2c", "n geometry passes"), tx(t, "oglOit_m2q", "exact up to n layers"), tx(t, "oglOit_m2u", "CAD, scientific visualisation")],
          [tx(t, "oglOit_m3", "Per-pixel linked lists"), tx(t, "oglOit_m3c", "1 pass + sort; unbounded memory"), tx(t, "oglOit_m3q", "exact"), tx(t, "oglOit_m3u", "hair (TressFX), offline-quality previews")],
          [tx(t, "oglOit_m4", "Weighted blended OIT"), tx(t, "oglOit_m4c", "1 pass + composite; 2 targets"), tx(t, "oglOit_m4q", "approximate colour, exact coverage"), tx(t, "oglOit_m4u", "particles, foliage, glass in games")],
          [tx(t, "oglOit_m5", "Moment-based OIT"), tx(t, "oglOit_m5c", "2 passes; 4–8 moments per pixel"), tx(t, "oglOit_m5q", "much closer than WBOIT"), tx(t, "oglOit_m5u", "high-end real-time")],
          [tx(t, "oglOit_m6", "Alpha to coverage / dithering"), tx(t, "oglOit_m6c", "free with MSAA / TAA"), tx(t, "oglOit_m6q", "binary per sample; noisy without TAA"), tx(t, "oglOit_m6u", "foliage, fences, hair ends")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglOit_pitfalls",
          "Transparent passes must depth-test against the opaque depth but not write depth, or nearer glass hides farther glass entirely. For WBOIT, clear revealage to 1, not 0, and remember per-attachment blend functions need glBlendFunci (GL 4.0); without them, render the two targets in two passes as the figure does. Premultiply colours by α consistently, and never let the weight overflow half-float range.")}
      </Callout>

      <KeyIdeas t={t} id="oglOit" items={[
        "\"Over\" is not commutative: each layer is attenuated by every layer in front of it, so order matters.",
        "Sorting objects fails for intersecting or self-overlapping geometry.",
        "Depth peeling and per-pixel linked lists are exact, at the cost of passes or memory.",
        "WBOIT keeps coverage Π(1 − α) exact and approximates colour with a depth-weighted average, in one pass.",
        "Transparent passes: depth test on, depth write off, composite after the opaque pass.",
      ]} />
    </Article>
  );
}
