// src/lib/tracks/opengl/chapters/transforms.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Equation } from "@/components/lesson/Tex";

// ── Depth Testing ─────────────────────────────────────────────────────────────

export function DepthTestingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglDepth_intro",
          "Draw two cubes without depth testing and the second one always covers the first, regardless of which is closer. The GPU has no idea what is in front of what — it just writes fragments in the order they arrive. The depth buffer fixes this by remembering, for every pixel, how far away the nearest fragment written so far was."
        )}
      </p>

      <H2>{tx(t, "oglDepth_enableTitle", "Turning it on")}</H2>
      <CodeBlock lang="cpp" filename="depth.cpp" t={t}>{`glEnable(GL_DEPTH_TEST);          // off by default in Core profile

// The depth buffer must be cleared every frame, exactly like the colour buffer
while (running) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    // ... draw ...
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglDepth_clearWarn",
          "Forgetting GL_DEPTH_BUFFER_BIT in glClear is the classic symptom: the first frame looks correct and every frame after it is progressively more broken, because last frame's depth values are still in the buffer rejecting this frame's fragments."
        )}
      </Callout>

      <H2>{tx(t, "oglDepth_funcTitle", "The depth function")}</H2>
      <p>
        {tx(t, "oglDepth_funcBody",
          "glDepthFunc decides what 'passes'. The default, GL_LESS, keeps a fragment when its depth is smaller than what is already stored — smaller meaning closer. The others are situational but each has a real use."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglDepth_h0", "Function"), tx(t, "oglDepth_h1", "Passes when"), tx(t, "oglDepth_h2", "Used for")]}
        rows={[
          ["GL_LESS",    tx(t, "oglDepth_f1", "New depth is closer"),           tx(t, "oglDepth_u1", "The default. Normal opaque geometry.")],
          ["GL_LEQUAL",  tx(t, "oglDepth_f2", "New depth is closer or equal"),  tx(t, "oglDepth_u2", "Skyboxes drawn last at depth 1.0; multi-pass rendering.")],
          ["GL_ALWAYS",  tx(t, "oglDepth_f3", "Always"),                        tx(t, "oglDepth_u3", "Effectively disables the test but keeps depth writes.")],
          ["GL_GREATER", tx(t, "oglDepth_f4", "New depth is farther"),          tx(t, "oglDepth_u4", "Reversed-Z setups, and some occlusion tricks.")],
        ]}
      />

      <H2>{tx(t, "oglDepth_maskTitle", "Testing versus writing")}</H2>
      <p>
        {tx(t, "oglDepth_maskBody",
          "These are two separate switches, and confusing them causes most transparency bugs. The test decides whether a fragment survives; the mask decides whether a surviving fragment updates the depth buffer. Transparent surfaces should be tested against opaque geometry but must not write depth, or the transparent object in front hides the one behind it."
        )}
      </p>

      <CodeBlock lang="cpp" filename="depth_mask.cpp" t={t}>{`// 1. Opaque pass — test and write
glEnable(GL_DEPTH_TEST);
glDepthMask(GL_TRUE);
drawOpaque();

// 2. Transparent pass — test against opaque, but do not write
glDepthMask(GL_FALSE);
drawTransparent();
glDepthMask(GL_TRUE);    // restore, or the next frame's opaque pass breaks`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglDepth_disableNote",
          "glDisable(GL_DEPTH_TEST) switches off both at once: with the test disabled, nothing is written to the depth buffer either. To draw everything but still record depth, keep the test enabled with glDepthFunc(GL_ALWAYS)."
        )}
      </Callout>

      <H2>{tx(t, "oglDepth_earlyTitle", "Early depth testing, and what turns it off")}</H2>
      <p>
        {tx(t, "oglDepth_earlyBody",
          "The pipeline diagram puts the depth test after the fragment shader, and that is its official place. Real GPUs run it earlier when they can prove the result would be the same: a fragment that is already hidden is thrown away before its shader runs, so hidden surfaces cost almost nothing. This early-Z is the reason opaque objects are drawn roughly front to back. The near ones fill the depth buffer first, and most of what lies behind them is rejected unshaded. Three things in a fragment shader weaken or disable it:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "oglDepth_eH0", "Shader does"), tx(t, "oglDepth_eH1", "Effect on early-Z"), tx(t, "oglDepth_eH2", "Why")]}
        rows={[
          [tx(t, "oglDepth_e1", "writes gl_FragDepth"), tx(t, "oglDepth_e1b", "disabled"), tx(t, "oglDepth_e1c", "the real depth is only known after the shader has run")],
          [tx(t, "oglDepth_e2", "uses discard"), tx(t, "oglDepth_e2b", "weakened"), tx(t, "oglDepth_e2c", "the test can run early, but the depth write must wait until the shader decides whether the fragment survives")],
          [tx(t, "oglDepth_e3", "writes to images or SSBOs"), tx(t, "oglDepth_e3b", "disabled by default"), tx(t, "oglDepth_e3c", "skipping the shader would also skip its side effects")],
        ]}
      />
      <p>
        {tx(t, "oglDepth_earlyFix",
          "OpenGL 4.2 added two ways to give the GPU the guarantee it needs. layout(early_fragment_tests) forces the depth and stencil tests to run before the shader; any depth the shader writes is then ignored. Conservative depth keeps gl_FragDepth writable but promises a direction. depth_greater means the shader only ever pushes the fragment farther away, so with GL_LESS a fragment that already fails at its interpolated depth would fail anyway, and can be rejected early."
        )}
      </p>
      <CodeBlock lang="glsl" filename="early_z.frag" t={t}>{`#version 460 core
// Option 1: run the depth and stencil tests before this shader, always
layout (early_fragment_tests) in;

// Option 2 (instead of option 1): keep writing depth, but promise a direction
// layout (depth_greater) out float gl_FragDepth;   // only ever moves farther
// ...
// gl_FragDepth = gl_FragCoord.z + offset;          // offset >= 0 keeps the promise`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_prepassTip",
          "A depth pre-pass takes early-Z to its limit. First draw the opaque scene with a trivial shader and the colour writes off (glColorMask(GL_FALSE, …)), filling only the depth buffer. Then draw it again with the real shaders and glDepthFunc(GL_LEQUAL) or GL_EQUAL: now every pixel runs its expensive shader exactly once, for the surface that is actually visible. It costs a second geometry pass, so it pays off when fragment shading is expensive."
        )}
      </Callout>

      <H2>{tx(t, "oglDepth_precisionTitle", "Z-fighting and why it happens")}</H2>
      <p>
        {tx(t, "oglDepth_precisionBody",
          "Depth is not stored linearly. The perspective divide compresses distant depth values into a tiny slice of the buffer's range, so two surfaces a centimetre apart are perfectly distinguishable near the camera and indistinguishable at 500 units. When their quantized depths collide, the winner varies per pixel and per frame — the flickering stripes known as z-fighting."
        )}
      </p>

      <Equation label={tx(t, "oglDepth_eqLabel", "Where a distance ends up in the depth buffer")}
        where={[
          [String.raw`d`, tx(t, "oglDepth_wD", "view-space distance in front of the camera")],
          [String.raw`n,\ f`, tx(t, "oglDepth_wNF", "near and far planes")],
        ]}
        notes={[tx(t, "oglDepth_halfNote", "Half of all depth values are used before d = 2nf / (f + n) — about twice the near plane when far ≫ near. With n = 0.1 that is the first 20 centimetres of the scene.")]}>
        {String.raw`z_{\text{ndc}}(d) \;=\; \frac{f+n}{f-n} \;-\; \frac{2fn}{(f-n)\,d}
\qquad
z_{\text{buffer}} = \frac{z_{\text{ndc}} + 1}{2}
\qquad
z_{\text{ndc}} = 0 \;\Longleftrightarrow\; d = \frac{2fn}{f+n} \approx 2n`}
      </Equation>

      <LessonTable
        headers={[tx(t, "oglDepth_z0", "Fix"), tx(t, "oglDepth_z1", "Effect")]}
        rows={[
          [tx(t, "oglDepth_zf1", "Push the near plane out"), tx(t, "oglDepth_ze1", "By far the biggest win. 0.1 instead of 0.001 buys enormous precision — precision loss scales with far/near.")],
          [tx(t, "oglDepth_zf2", "Pull the far plane in"),   tx(t, "oglDepth_ze2", "Helps, but much less than the near plane. Do not obsess over it.")],
          [tx(t, "oglDepth_zf3", "Separate the geometry"),   tx(t, "oglDepth_ze3", "Do not model coplanar surfaces. A decal needs an offset or polygon offset.")],
          [tx(t, "oglDepth_zf4", "Use a 32-bit depth buffer"), tx(t, "oglDepth_ze4", "More bits, more range. Costs bandwidth and is not always available.")],
          [tx(t, "oglDepth_zf5", "Reversed-Z"),              tx(t, "oglDepth_ze5", "Map near to 1.0 and far to 0.0 with a float buffer. Distributes precision almost perfectly.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="polygon_offset.cpp" t={t}>{`// Decals and coplanar detail: nudge the depth without moving the geometry
glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(-1.0f, -1.0f);   // pull slightly toward the camera
drawDecals();
glDisable(GL_POLYGON_OFFSET_FILL);`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglDepth_visTip",
          "To see the depth buffer, output gl_FragCoord.z as a greyscale colour. It will look almost entirely white, which is the point — that is the non-linear distribution making itself visible. Linearize it back to view-space distance to get a readable image, and you will understand z-fighting immediately."
        )}
      </Callout>

      <Equation label={tx(t, "oglDepth_linLabel", "Undoing it: linearized depth")}
        glsl="float d = (2.0 * n * f) / (f + n - ndc * (f - n));">
        {String.raw`d \;=\; \frac{2nf}{f + n - z_{\text{ndc}}\,(f - n)}`}
      </Equation>

      <CodeBlock lang="glsl" filename="visualize_depth.frag" t={t}>{`#version 460 core
out vec4 FragColor;

uniform float uNear;
uniform float uFar;

float linearizeDepth(float d) {
    float ndc = d * 2.0 - 1.0;                       // [0,1] back to [-1,1]
    return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
}

void main() {
    float depth = linearizeDepth(gl_FragCoord.z) / uFar;
    FragColor = vec4(vec3(depth), 1.0);
}`}</CodeBlock>

    </article>
  );
}
