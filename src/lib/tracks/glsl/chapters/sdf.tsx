"use client";

// GLSL track — "Signed Distance Functions".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { SDF_PRESETS } from "../presets/basics";

const r = String.raw;

export function SDFContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl04_intro",
          "A Signed Distance Function (SDF) returns the distance from a point to the nearest surface of a shape. Negative = inside, positive = outside, zero = exactly on the edge. SDFs let you draw any shape analytically with perfect anti-aliased edges."
        )}
      </p>

      <H2>{tx(t, "glsl04_conceptTitle", "The concept")}</H2>
      <p>{tx(t, "glsl04_conceptBody", "Sample the SDF at the current UV position. If negative, output the shape color. Use smoothstep to anti-alias the edge.")}</p>
      <CodeBlock lang="glsl" filename="sdf_concept.glsl" t={t}>{`float sdfCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    vec2  uv   = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    float dist = sdfCircle(uv, 0.5);

    // Hard edge — aliased
    // float inside = dist < 0.0 ? 1.0 : 0.0;

    // Smooth edge — anti-aliased using screen-space derivative
    float px     = fwidth(dist);  // pixel width in SDF space
    float inside = smoothstep(px, -px, dist);

    FragColor = vec4(vec3(inside), 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "glsl04_circleTitle", "SDF: Circle")}</H2>
      <p>{tx(t, "glsl04_circleBody", "The simplest SDF. Distance from a point to a circle of radius r at the origin is length(p) - r.")}</p>
      <CodeBlock lang="glsl" filename="sdf_shapes.glsl" t={t}>{`float sdfCircle(vec2 p, float r) {
    return length(p) - r;
}

// Translate: move the shape by subtracting offset from p
float c1 = sdfCircle(uv - vec2(0.3, 0.0), 0.2);   // circle at (0.3, 0)
float c2 = sdfCircle(uv - vec2(-0.3, 0.0), 0.15);  // circle at (-0.3, 0)`}</CodeBlock>

      <H2>{tx(t, "glsl04_boxTitle", "SDF: Rectangle")}</H2>
      <p>{tx(t, "glsl04_boxBody", "The exact box SDF — b is the half-size of the box.")}</p>
      <CodeBlock lang="glsl" filename="sdf_box.glsl" t={t}>{`float sdfBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Rounded rectangle: add a radius to the SDF
float sdfRoundedBox(vec2 p, vec2 b, float r) {
    return sdfBox(p, b - r) - r;
}

// Usage
float box     = sdfBox(uv, vec2(0.4, 0.2));          // 0.8 wide, 0.4 tall
float rounded = sdfRoundedBox(uv, vec2(0.4, 0.2), 0.05); // with rounded corners`}</CodeBlock>

      <H2>{tx(t, "glsl04_combineTitle", "Combining shapes")}</H2>
      <p>{tx(t, "glsl04_combineBody", "Because SDFs return distances, combining them takes only a few characters.")}</p>
      <CodeBlock lang="glsl" filename="sdf_combine.glsl" t={t}>{`// Boolean operations
float sdfUnion(float d1, float d2)     { return min(d1, d2); }
float sdfSubtract(float d1, float d2)  { return max(d1, -d2); }
float sdfIntersect(float d1, float d2) { return max(d1, d2); }

// Smooth union — organic blending (k controls blend radius)
float sdfSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

// Example: two circles that smoothly merge into each other
float c1     = sdfCircle(uv - vec2( 0.3*sin(uTime), 0.0), 0.25);
float c2     = sdfCircle(uv - vec2(-0.3*sin(uTime), 0.0), 0.20);
float merged = sdfSmoothUnion(c1, c2, 0.15);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "glsl04_combineWarn",
          "Smooth union (smin) blends two shapes smoothly at their boundary using parameter k to control the blending radius. This is how organic-looking blobs and metaballs are made — the shapes attract each other."
        )}
      </Callout>


      <H2>{tx(t, "glsl04_exploreTitle", "Exploring distance fields")}</H2>
      <p>{tx(t, "glsl04_exploreBody", "The shader below paints the distance field itself: orange outside, blue inside, a band every 0.04 units and white on the surface. Click and drag to place a probe. The yellow circle has radius |d|, the largest circle around the point that touches no surface. That circle is what makes SDFs so useful: anti-aliasing, outlines, glows, shadows and raymarching all read it.")}</p>
      <Equation label={tx(t, "glsl04_opsLabel", "Operations on a distance")}
        where={[[r`d`, tx(t, "glsl04_wD", "the signed distance of a shape")], [r`r,\ w`, tx(t, "glsl04_wRW", "a rounding radius, a shell half-thickness")]]}
        note={tx(t, "glsl04_opsNote", "Rounding and onion are exact for any exact SDF. Union with min is exact outside both shapes but only a bound inside. Intersection and subtraction give bounds, still safe for raymarching, not exact distances.")}>
        {r`\text{round: } d - r \qquad \text{onion: } |d| - w \qquad \text{outline: } |d| < w \qquad \text{glow: } e^{-k\,\max(d, 0)}`}
      </Equation>
      <Equation label={tx(t, "glsl04_sminLabel", "Smooth minimum (polynomial)")}
        where={[[r`k`, tx(t, "glsl04_wK", "blend radius: how far apart the shapes start to merge")]]}
        note={tx(t, "glsl04_sminNote", "Where the two distances differ by more than k, h is 0 or 1 and smin returns the plain min. Inside that band it subtracts a small parabolic amount, which fills the crease between the shapes. The result is organic, blobby joins, the look of every SDF-sculpted character.")}>
        {r`h = \operatorname{clamp}\!\left(\tfrac12 + \tfrac12\,\frac{d_2 - d_1}{k},\ 0,\ 1\right) \qquad \operatorname{smin}(d_1, d_2) = \operatorname{mix}(d_2, d_1, h) - k\,h\,(1 - h)`}
      </Equation>
      <ShaderPlayground presets={SDF_PRESETS} t={t} id="glsl04Sdf" />
      <Callout type="tip" t={t}>
        {tx(t, "glsl04_aaTip", "fwidth(d) is the change of d over one pixel, so smoothstep(-w, w, d) with w = fwidth(d) gives an edge exactly one pixel wide at any zoom, rotation or resolution. Text renderers use the same trick with SDF font atlases (Valve, 2007), so glyphs stay sharp at any size from one small texture.")}
      </Callout>
      <KeyIdeas t={t} id="glsl04" items={[
        "An SDF returns signed distance: negative inside, zero on the surface, positive outside.",
        "|d| is the radius of the largest empty circle around the point.",
        "Round with d − r, hollow with |d| − w, combine with min/max, blend with smin.",
        "Anti-alias any SDF with smoothstep(−w, w, d), w = fwidth(d).",
      ]} />
    </article>
  );
}
