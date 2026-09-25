// src/lib/tracks/opengl/chapters/lighting-advanced/deferred.tsx
"use client";

import { CodeBlock, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { DeferredFigure } from "@/components/lesson/figures/advlighting/DeferredFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Deferred shading
// ═════════════════════════════════════════════════════════════════════════════

export function DeferredContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglDeferred_intro",
          "Forward rendering lights every fragment of every object, including the ones later hidden behind something else. Deferred shading splits rendering in two: first record what is visible at each pixel, then light each pixel exactly once.")}
      </Lead>

      <Equation label={tx(t, "oglDeferred_costLabel", "Where the cost goes")}
        where={[
          [r`F`, tx(t, "oglDeferred_wF", "fragments shaded, including overdraw")],
          [r`P`, tx(t, "oglDeferred_wP", "pixels on screen")],
          [r`L`, tx(t, "oglDeferred_wL", "lights")],
        ]}>
        {r`\text{forward} \approx F \times L
\qquad\qquad
\text{deferred} \approx F \;+\; P \times L`}
      </Equation>

      <DeferredFigure t={t} />

      <H2>{tx(t, "oglDeferred_gTitle", "The G-buffer")}</H2>
      <p>
        {tx(t, "oglDeferred_gBody",
          "The geometry pass uses a framebuffer with several colour attachments and a fragment shader with several outputs — multiple render targets. Everything the lighting needs is stored per pixel: position (or depth), normal, albedo and specular strength.")}
      </p>
      <CodeBlock lang="glsl" filename="gbuffer.frag" t={t}>{`layout (location = 0) out vec3 gPosition;
layout (location = 1) out vec3 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;

void main() {
    gPosition        = FragPos;
    gNormal          = normalize(Normal);
    gAlbedoSpec.rgb  = texture(texture_diffuse1, TexCoords).rgb;
    gAlbedoSpec.a    = texture(texture_specular1, TexCoords).r;
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="gbuffer.cpp" t={t}>{`// Position and normal need precision: 16-bit float. Colour fits in 8 bits.
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gPosition
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gNormal
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA,    w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr); // gAlbedoSpec

unsigned attachments[3] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1, GL_COLOR_ATTACHMENT2 };
glDrawBuffers(3, attachments);        // write all three at once`}</CodeBlock>

      <H2>{tx(t, "oglDeferred_volTitle", "Light volumes")}</H2>
      <p>
        {tx(t, "oglDeferred_volBody",
          "A pixel far from a light receives nothing from it, yet the naive lighting pass still loops over every light. Solve the attenuation formula for the distance where the light drops below visible, and skip — or better, only draw a sphere of that radius for each light:")}
      </p>
      <Equation label={tx(t, "oglDeferred_radiusLabel", "Radius of a light volume")}
        note={tx(t, "oglDeferred_radiusNote", "Setting F_att · I_max = 5/256 and solving the quadratic K_q d² + K_l d + K_c − 256·I_max/5 = 0.")}>
        {r`r = \frac{-K_l + \sqrt{K_l^{2} - 4K_q\left(K_c - \frac{256}{5} I_{\max}\right)}}{2K_q}`}
      </Equation>

      <LessonTable
        headers={[tx(t, "oglDeferred_t0", "Deferred…"), tx(t, "oglDeferred_t1", "Because")]}
        rows={[
          [tx(t, "oglDeferred_tp1", "✓ scales to hundreds of lights"), tx(t, "oglDeferred_tp1b", "each pixel is lit once, only by lights that reach it")],
          [tx(t, "oglDeferred_tc1", "✗ cannot do transparency"), tx(t, "oglDeferred_tc1b", "the G-buffer holds one surface per pixel; blended objects need a forward pass afterwards")],
          [tx(t, "oglDeferred_tc2", "✗ struggles with MSAA"), tx(t, "oglDeferred_tc2b", "multisampled G-buffers are huge; most engines use post-process AA instead")],
          [tx(t, "oglDeferred_tc3", "✗ one lighting model"), tx(t, "oglDeferred_tc3b", "every material shares the same lighting shader (a material ID in the G-buffer helps)")],
        ]}
      />

      <KeyIdeas t={t} id="oglDeferred" items={[
        "Geometry pass: write position, normal, albedo and specular to a G-buffer with MRT.",
        "Lighting pass: one fullscreen pass, each pixel lit once — cost ≈ pixels × lights.",
        "Light volumes limit each light to the pixels it can actually reach.",
      ]} />
    </Article>
  );
}
