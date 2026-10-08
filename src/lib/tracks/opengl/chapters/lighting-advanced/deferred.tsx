// src/lib/tracks/opengl/chapters/lighting-advanced/deferred.tsx
"use client";

// Deferred shading (explanation pass 2026-09-30): the cost model with every
// symbol and a 1080p worked example (DeferredCost figure); the G-buffer, its
// formats and memory; the lighting pass; light volumes, the radius formula
// derived and worked; camera inside a volume; forward objects afterwards;
// choices in the code; mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { DeferredFigure } from "@/components/lesson/figures/advlighting/DeferredFigure";
import { DeferredCostFigure } from "@/components/lesson/figures/advlighting/DeferredCostFigure";

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

      <Goals t={t} id="oglDeferred" items={[
        "Store positions, normals and colours in a G-buffer.",
        "Light many lights cheaply with light volumes.",
        "Draw transparent and other forward-rendered objects afterwards.",
      ]} />

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
      <p>
        {tx(t, "oglDeferred_costBody",
          "Overdraw is the reason F is bigger than P: when a wall, a table and a cup overlap on one pixel, forward rendering may light all three fragments and then keep only the nearest. Sorting opaque objects front to back lets the depth test reject some of them before shading, but never all. The deferred geometry pass still produces all F fragments, but each one only writes a few numbers; the expensive loop over lights runs once per pixel.")}
      </p>

      <H3>{tx(t, "oglDeferred_workedTitle", "Worked example: 100 lights at 1080p")}</H3>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "oglDeferred_w1", "P = 1920 × 1080 = 2.07 million pixels. With an average overdraw of 2.5, F = 5.18 million fragments.")}</li>
        <li>{tx(t, "oglDeferred_w2", "Forward: F × L = 5.18 M × 100 = 518 million light evaluations per frame.")}</li>
        <li>{tx(t, "oglDeferred_w3", "Deferred, looping over every light for every pixel: 5.18 M G-buffer writes + 2.07 M × 100 = 207 M evaluations, 212.5 M in total. Already 2.4× less.")}</li>
        <li>{tx(t, "oglDeferred_w4", "Deferred with light volumes, each light reaching about 2% of the screen: 5.18 M + 2.07 M × 100 × 0.02 = 9.3 M. That is about 56× less than forward.")}</li>
      </ol>
      <DeferredCostFigure t={t} />

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
      <p>
        {tx(t, "oglDeferred_locBody",
          "layout (location = n) on an output picks the draw buffer it goes to, and glDrawBuffers maps draw buffer n to a colour attachment. The \"G\" stands for geometry: the buffer describes the visible surface, not its final colour.")}
      </p>
      <CodeBlock lang="cpp" filename="gbuffer.cpp" t={t}>{`// Position and normal need precision: 16-bit float. Colour fits in 8 bits.
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gPosition
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_FLOAT, nullptr);       // gNormal
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA,    w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr); // gAlbedoSpec

unsigned attachments[3] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1, GL_COLOR_ATTACHMENT2 };
glDrawBuffers(3, attachments);        // write all three at once`}</CodeBlock>
      <p>
        {tx(t, "oglDeferred_memBody",
          "Count the bytes: 8 for the position, 8 for the normal, 4 for albedo and specular, plus 4 for the depth buffer, 24 bytes per pixel. At 1080p that is 2.07 M × 24 ≈ 50 MB, written once and read at least once every frame. Memory bandwidth, not arithmetic, is what deferred shading spends, which is why production G-buffers are packed tightly: position is rebuilt from the depth buffer instead of stored (saving 8 bytes), and the normal is squeezed into two 16-bit numbers.")}
      </p>

      <H3>{tx(t, "oglDeferred_lightTitle", "The lighting pass")}</H3>
      <CodeBlock lang="glsl" filename="deferred_lighting.frag" t={t}>{`uniform sampler2D gPosition, gNormal, gAlbedoSpec;
uniform Light lights[NR_LIGHTS];
uniform vec3  viewPos;

void main() {
    // Everything the forward shader got from vertex attributes now comes from textures
    vec3  FragPos  = texture(gPosition,   TexCoords).rgb;
    vec3  Normal   = texture(gNormal,     TexCoords).rgb;
    vec3  Albedo   = texture(gAlbedoSpec, TexCoords).rgb;
    float Specular = texture(gAlbedoSpec, TexCoords).a;

    vec3 lighting = Albedo * 0.1;                     // ambient
    vec3 viewDir  = normalize(viewPos - FragPos);
    for (int i = 0; i < NR_LIGHTS; ++i) {
        float d = length(lights[i].Position - FragPos);
        if (d > lights[i].Radius) continue;           // outside this light's reach
        // ...the same Blinn-Phong + attenuation as in a forward shader
    }
    FragColor = vec4(lighting, 1.0);
}`}</CodeBlock>
      <p>
        {tx(t, "oglDeferred_lightBody",
          "It is the forward lighting shader with its inputs swapped: a fullscreen quad is drawn, and each fragment fetches the surface it represents from the G-buffer at the same screen position. The lighting maths itself does not change at all.")}
      </p>

      <H2>{tx(t, "oglDeferred_volTitle", "Light volumes")}</H2>
      <p>
        {tx(t, "oglDeferred_volBody",
          "A pixel far from a light receives nothing from it, yet the naive lighting pass still loops over every light. Solve the attenuation formula for the distance where the light drops below visible, and skip — or better, only draw a sphere of that radius for each light:")}
      </p>
      <Equation label={tx(t, "oglDeferred_radiusLabel", "Radius of a light volume")}
        where={[
          [r`K_c, K_l, K_q`, tx(t, "oglDeferred_wK", "the constant, linear and quadratic attenuation terms from Light Casters: F_att = 1 / (K_c + K_l d + K_q d²)")],
          [r`I_{\max}`, tx(t, "oglDeferred_wImax", "the light's brightest channel, max(r, g, b) of its colour times its strength")],
          [r`5/256`, tx(t, "oglDeferred_wCut", "the cut-off: a contribution below about 5 steps of an 8-bit display is treated as invisible (a larger value gives smaller spheres and a visible edge)")],
          [r`r`, tx(t, "oglDeferred_wR", "the positive root of the quadratic: the distance where I_max · F_att falls to 5/256")],
        ]}
        note={tx(t, "oglDeferred_radiusNote", "Setting F_att · I_max = 5/256 and solving the quadratic K_q d² + K_l d + K_c − 256·I_max/5 = 0.")}>
        {r`r = \frac{-K_l + \sqrt{K_l^{2} - 4K_q\left(K_c - \frac{256}{5} I_{\max}\right)}}{2K_q}`}
      </Equation>
      <p>
        {tx(t, "oglDeferred_radiusWorked",
          "For the \"range 7\" constants (K_c = 1, K_l = 0.7, K_q = 1.8) and a white light of strength 1: K_c − 51.2 = −50.2; the square root is √(0.49 + 4 · 1.8 · 50.2) = √361.9 = 19.02; r = (−0.7 + 19.02) / 3.6 = 5.09 units. Beyond about 5 units this light is skipped. The radius grows only with the square root of the intensity: four times brighter gives about twice the radius.")}
      </p>
      <p>
        {tx(t, "oglDeferred_sphereBody",
          "The if in the loop does not really save time on a GPU, because neighbouring pixels run in lock-step groups and the group waits for its slowest member. The real saving is to draw each light as a sphere mesh of radius r with additive blending (glBlendFunc(GL_ONE, GL_ONE)), running the lighting shader for that light only on the pixels the sphere covers. When the camera is inside a sphere its front faces are behind the camera and get clipped; render the spheres' back faces instead (glCullFace(GL_FRONT)), which always cover the right pixels.")}
      </p>

      <LessonTable
        headers={[tx(t, "oglDeferred_t0", "Deferred…"), tx(t, "oglDeferred_t1", "Because")]}
        rows={[
          [tx(t, "oglDeferred_tp1", "✓ scales to hundreds of lights"), tx(t, "oglDeferred_tp1b", "each pixel is lit once, only by lights that reach it")],
          [tx(t, "oglDeferred_tc1", "✗ cannot do transparency"), tx(t, "oglDeferred_tc1b", "the G-buffer holds one surface per pixel; blended objects need a forward pass afterwards")],
          [tx(t, "oglDeferred_tc2", "✗ struggles with MSAA"), tx(t, "oglDeferred_tc2b", "multisampled G-buffers are huge; most engines use post-process AA instead")],
          [tx(t, "oglDeferred_tc3", "✗ one lighting model"), tx(t, "oglDeferred_tc3b", "every material shares the same lighting shader (a material ID in the G-buffer helps)")],
        ]}
      />

      <H2>{tx(t, "oglDeferred_mixTitle", "Adding forward-rendered objects afterwards")}</H2>
      <p>
        {tx(t, "oglDeferred_mixBody",
          "Glass, particles, and the small cubes that show where the lights are must be drawn after the lighting pass with an ordinary forward shader. They still have to be hidden behind the lit scene where the scene is closer. The lighting pass drew a fullscreen quad, though, so the target framebuffer's depth buffer holds nothing useful. The scene's depth lives in the G-buffer. Copy it across with glBlitFramebuffer, then draw the forward objects with depth testing on:"
        )}
      </p>
      <CodeBlock lang="cpp" filename="deferred_then_forward.cpp" t={t}>{`// 1. Geometry pass into gBuffer, 2. lighting pass (fullscreen quad) into the default framebuffer

// 3. Copy the scene's depth from the G-buffer to the framebuffer we draw into next
glBindFramebuffer(GL_READ_FRAMEBUFFER, gBuffer);
glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);
glBlitFramebuffer(0, 0, width, height, 0, 0, width, height,
                  GL_DEPTH_BUFFER_BIT, GL_NEAREST);    // depth must use GL_NEAREST

// 4. Forward pass: light cubes, glass, particles — tested against the real scene depth
glBindFramebuffer(GL_FRAMEBUFFER, 0);
glEnable(GL_DEPTH_TEST);
drawLightCubes();
drawTransparentSorted();`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "oglDeferred_blitWarn",
          "A depth blit only works between depth buffers with the same format; otherwise it fails with GL_INVALID_OPERATION and copies nothing. The default framebuffer's format is whatever the window was created with, so either request matching bits (glfwWindowHint(GLFW_DEPTH_BITS, 24) and GLFW_STENCIL_BITS, 8 to match a GL_DEPTH24_STENCIL8 G-buffer), or, more robustly, do the lighting and forward passes into your own HDR framebuffer whose depth attachment you choose yourself."
        )}
      </Callout>

      <LessonTable
        headers={[tx(t, "oglDeferred_tChoice", "Choice"), tx(t, "oglDeferred_tReason", "Reason")]}
        rows={[
          [tx(t, "oglDeferred_c1", "RGBA16F for position and normal"), tx(t, "oglDeferred_c1b", "8 bits give 256 steps: a position in a 100 m level would snap to 40 cm and lighting would show blocky bands.")],
          [tx(t, "oglDeferred_c2", "specular packed into albedo's alpha"), tx(t, "oglDeferred_c2b", "one scalar fits in the free channel of an existing target, instead of a fourth attachment.")],
          [tx(t, "oglDeferred_c3", "GL_NEAREST on G-buffer textures"), tx(t, "oglDeferred_c3b", "the lighting pass reads exactly one texel per pixel; filtering would blend the normal or position of two different surfaces at edges.")],
          [tx(t, "oglDeferred_c4", "no blending during the geometry pass"), tx(t, "oglDeferred_c4b", "the G-buffer stores data, not colours; blending would mix the specular in alpha with what was already there.")],
        ]}
      />

      <H2>{tx(t, "oglDeferred_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "oglDeferred_tMistake", "Mistake"), tx(t, "oglDeferred_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "oglDeferred_e1", "Forgetting glDrawBuffers"), tx(t, "oglDeferred_e1b", "only attachment 0 is written; normal and albedo stay black, so the lit scene is black too. Call it once while the G-buffer is bound.")],
          [tx(t, "oglDeferred_e2", "GL_BLEND still enabled in the geometry pass"), tx(t, "oglDeferred_e2b", "gAlbedoSpec's alpha (the specular) is used as the blend factor and colours come out faded. Disable blending for the geometry pass, enable additive blending for light volumes.")],
          [tx(t, "oglDeferred_e3", "Position or normal in an 8-bit target"), tx(t, "oglDeferred_e3b", "negative values clamp to 0 and precision is lost: lighting looks banded and half the normals are wrong. Use a float format, or encode normals as n · 0.5 + 0.5.")],
          [tx(t, "oglDeferred_e4", "Clear colour left in the G-buffer background"), tx(t, "oglDeferred_e4b", "empty pixels read as a surface at the origin and get lit. Clear to 0 and skip pixels whose normal is zero, or test the depth.")],
          [tx(t, "oglDeferred_e5", "Light spheres culled when the camera is inside"), tx(t, "oglDeferred_e5b", "the light suddenly vanishes as you walk into its range. Render back faces (cull front) with the depth test set to GL_GREATER, or off.")],
          [tx(t, "oglDeferred_e6", "Radius computed from a light's average colour"), tx(t, "oglDeferred_e6b", "a saturated red light gets too small a sphere and a visible edge. Use the brightest channel, I_max.")],
        ]}
      />

      <KeyIdeas t={t} id="oglDeferred" items={[
        "Geometry pass: write position, normal, albedo and specular to a G-buffer with MRT.",
        "Lighting pass: one fullscreen pass, each pixel lit once — cost ≈ pixels × lights.",
        "Light volumes limit each light to the pixels it can actually reach.",
        "At 1080p with 100 lights: 518 M light evaluations forward, 212.5 M deferred, 9.3 M with volumes.",
        "The price is memory: about 24 bytes per pixel, 50 MB at 1080p, written and read every frame.",
        "A light's radius comes from solving its attenuation for 5/256; brightness ×4 gives radius ×2.",
      ]} />
    </Article>
  );
}
