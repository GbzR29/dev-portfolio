"use client";

// GLSL track — "Fragment Coordinates & UV".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { InteractiveUV } from "@/components/lesson/InteractiveUV";

export function FragCoordContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl03_intro",
          "The fragment shader has access to the pixel's screen position through gl_FragCoord. Combined with a resolution uniform, this gives you the foundation for writing shader effects that cover the entire screen — the basis of everything from post-processing to live shader art."
        )}
      </p>

      <H2>{tx(t, "glsl03_fragcoordTitle", "gl_FragCoord")}</H2>
      <p>{tx(t, "glsl03_fragcoordBody", "gl_FragCoord.xy gives you the pixel position in window coordinates, where (0,0) is the bottom-left corner. The z component is the depth value in [0,1], and w is 1/clipW for perspective division.")}</p>
      <p>{tx(t, "glsl03_fragcoordWhy", "A fragment is a candidate pixel: the rasterizer produces one for every pixel a triangle covers, and runs main() once for each, all in parallel. No fragment can see its neighbours, so gl_FragCoord is the only way a fragment knows where it is. Its units are pixels of the render target: in an 800×600 window x runs from 0.5 to 799.5 and y from 0.5 to 599.5. The four components mean:")}</p>
      <LessonTable
        headers={[tx(t, "glsl03_thComp", "Component"), tx(t, "glsl03_thMeaning", "Meaning"), tx(t, "glsl03_thExample", "Example (800×600)")]}
        rows={[
          ["x, y", tx(t, "glsl03_compXY", "Centre of this pixel, in pixels, origin bottom-left"), "(400.5, 300.5)"],
          ["z", tx(t, "glsl03_compZ", "Depth after the viewport transform, 0 = near plane, 1 = far plane (default glDepthRange)"), "0.73"],
          ["w", tx(t, "glsl03_compW", "1 / w_clip; w_clip is the view-space distance for a perspective camera, so w shrinks with distance"), tx(t, "glsl03_compWEx", "0.2 for a point 5 units away")],
        ]}
      />
      <p>{tx(t, "glsl03_uvBody", "Dividing by uResolution, the window size in pixels, turns pixels into a fraction of the screen, called UV here: u = x / width, v = y / height. For the fragment at (400.5, 300.5) that gives (400.5/800, 300.5/600) = (0.5006, 0.5008), the middle of the screen. The point of UV is that it no longer depends on the window size: the same shader looks the same at 800×600 and 3840×2160.")}</p>
      <CodeBlock lang="glsl" filename="fragcoord.glsl" t={t}>{`// gl_FragCoord is built-in — always available in fragment shaders
// .xy = pixel position in window coordinates (0,0 = bottom-left)
// .z  = depth in [0.0, 1.0]
// .w  = 1.0 / clip-space w (for perspective-correct interpolation)

uniform vec2 uResolution;  // window size in pixels, set from C++
out vec4 FragColor;

void main() {
    vec2 pixelPos = gl_FragCoord.xy;        // e.g. (400.5, 300.5)
    vec2 uv       = pixelPos / uResolution; // [0,1] range
    FragColor = vec4(uv, 0.0, 1.0);         // red=X, green=Y gradient
}`}</CodeBlock>

      <H2>{tx(t, "glsl03_uvVisTitle", "Seeing UV, one fragment at a time")}</H2>
      <p>
        {tx(t, "glsl03_uvVisBody",
          "The widget below runs a real fragment shader. Drop the resolution to a few fragments and hover them: every square is one call to main(), with its own gl_FragCoord. Dividing it by uResolution gives the UV, and the shader turns that UV into a colour. Switch presets to see centering, fract() tiling, polar coordinates and time, or edit the code directly."
        )}
      </p>

      <InteractiveUV />

      <Callout type="tip" t={t}>
        {tx(t, "glsl03_uvVisTip",
          "gl_FragCoord points at the centre of the fragment, so the bottom-left one is (0.5, 0.5), not (0, 0). Reading UV as a colour (red = u, green = v) is also how you debug a shader: when something looks wrong, output the value you doubt as a colour and check it."
        )}
      </Callout>

      <H2>{tx(t, "glsl03_centeredTitle", "Centering and aspect ratio correction")}</H2>
      <p>{tx(t, "glsl03_centeredBody", "For most effects you want a centered coordinate system in [-1, +1]. Aspect ratio correction ensures circles look round and squares look square, regardless of window dimensions.")}</p>
      <p>{tx(t, "glsl03_aspectWhy", "Why plain UV is not enough: u and v both run 0..1, but on an 800×600 screen one unit of u is 800 pixels wide and one unit of v is 600 pixels tall. A circle of radius 0.25 in UV is therefore 200 pixels wide and 150 tall, an ellipse. The fix is to divide both axes by the same number, the height. Then one unit is 600 pixels in both directions, and shapes keep their proportions.")}</p>
      <CodeBlock lang="glsl" filename="centered_uv.glsl" t={t}>{`uniform vec2 uResolution;
out vec4 FragColor;

void main() {
    // Standard "ShaderToy" coordinate setup:
    // 1. Center: transform [0,1] to [-1, +1]
    // 2. Correct aspect ratio using height as reference
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
    //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //         uv.x = [-aspect, +aspect]
    //         uv.y = [-1.0,    +1.0]

    // Now a circle at the origin looks perfectly round
    float circle = length(uv) - 0.5;
    float mask   = smoothstep(0.01, -0.01, circle);
    FragColor = vec4(vec3(mask), 1.0);
}`}</CodeBlock>
      <p>{tx(t, "glsl03_centeredSteps", "Read the formula in three steps, with 800×600. gl_FragCoord.xy · 2.0 stretches 0..800 to 0..1600 and 0..600 to 0..1200. Subtracting uResolution (800, 600) shifts that to −800..800 and −600..600, so the screen centre becomes (0, 0). Dividing by uResolution.y = 600 gives x in −1.333..1.333 and y in −1..1. The 1.333 is the aspect ratio, 800/600. Worked pixels: the bottom-left fragment (0.5, 0.5) maps to ((1 − 800)/600, (1 − 600)/600) = (−1.332, −0.998); the centre one (400.5, 300.5) maps to (1/600, 1/600) ≈ (0.0017, 0.0017), as close to 0 as a pixel centre can get.")}</p>
      <p>{tx(t, "glsl03_circleSteps", "The circle then needs only distances. length(uv) is the distance from the centre, so length(uv) − 0.5 is negative inside a circle of radius 0.5, zero on its edge and positive outside: a signed distance. smoothstep(0.01, −0.01, d) returns 1 when d ≤ −0.01, 0 when d ≥ 0.01 and a smooth blend between, which softens the edge over 0.02 units (about 6 pixels at 600 px tall) instead of a jagged step. Because the bounds are given in reverse order, the result is 1 inside and 0 outside. (The GLSL spec leaves reversed bounds undefined, but every GPU computes them this way; 1.0 − smoothstep(−0.01, 0.01, d) is the strictly portable form.)")}</p>

      <H2>{tx(t, "glsl03_timeTitle", "Animating with time")}</H2>
      <p>{tx(t, "glsl03_timeBody", "Pass a float uniform that increases each frame (typically in seconds). Combine with sin/cos to create oscillating, looping animations.")}</p>
      <CodeBlock lang="glsl" filename="time_anim.glsl" t={t}>{`uniform float uTime;       // seconds since start, set each frame
uniform vec2  uResolution;
out vec4 FragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

    // Spinning color pattern
    float angle = atan(uv.y, uv.x) + uTime;
    float r     = length(uv);
    float bands = sin(angle * 6.0 + r * 10.0) * 0.5 + 0.5;

    FragColor = vec4(bands, bands * 0.5, 1.0 - bands, 1.0);
}`}</CodeBlock>
      <p>{tx(t, "glsl03_timeSteps", "Term by term: atan(uv.y, uv.x) is the angle of the pixel around the centre, from −π to π (the two-argument form knows which quadrant it is in). Adding uTime rotates that angle by one radian per second, so the pattern turns once every 2π ≈ 6.28 s. r is the distance from the centre. Inside sin, angle · 6.0 makes 6 bands around a full turn and r · 10.0 bends them into a spiral, since the phase also grows outward. · 0.5 + 0.5 remaps −1..1 to 0..1. The colour is (bands, bands/2, 1 − bands): orange where bands = 1, blue where bands = 0.")}</p>
      <p>{tx(t, "glsl03_timeNumbers", "One pixel worked out: uv = (0.5, 0) at uTime = 0 gives angle = atan(0, 0.5) = 0 and r = 0.5, so sin(0 + 5) = sin(5) = −0.959 and bands = 0.5 − 0.479 = 0.021: nearly pure blue (0.021, 0.010, 0.979). At uTime = 0.5 the angle becomes 0.5, sin(3 + 5) = sin(8) = 0.989, bands = 0.995, and the same pixel is orange.")}</p>

      <CodeBlock lang="cpp" filename="set_uniforms.cpp" t={t}>{`// Set these every frame in your render loop:
glUniform2f(glGetUniformLocation(prog, "uResolution"),
            (float)width, (float)height);
glUniform1f(glGetUniformLocation(prog, "uTime"),
            (float)glfwGetTime());`}</CodeBlock>
      <p>{tx(t, "glsl03_resNote", "Use the framebuffer size, not the window size: on high-DPI screens (macOS Retina, Windows at 150%) glfwGetFramebufferSize returns more pixels than glfwGetWindowSize, and gl_FragCoord counts framebuffer pixels. If you pass the window size, uv reaches 2.0 at the top-right instead of 1.0 and only the bottom-left quarter of the effect is visible.")}</p>

      <Callout type="tip" t={t}>
        {tx(t, "glsl03_patternTip",
          "The pattern uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y is the standard ShaderToy/GLSL art setup. It centers the coordinate system, corrects the aspect ratio using the height, and gives you a range of roughly [-aspect, aspect] on X and [-1, 1] on Y."
        )}
      </Callout>

      <H2>{tx(t, "glsl03_choicesTitle", "Which coordinates to use")}</H2>
      <LessonTable
        headers={[tx(t, "glsl03_thCoord", "Coordinates"), tx(t, "glsl03_thRange", "Range (800×600)"), tx(t, "glsl03_thUse", "Use it for")]}
        rows={[
          ["gl_FragCoord.xy", "0.5 … 799.5, 0.5 … 599.5", tx(t, "glsl03_use1", "Pixel-exact work: 1-px lines, dithering, reading a texture with texelFetch")],
          ["xy / uResolution", "0 … 1, 0 … 1", tx(t, "glsl03_use2", "Screen-space gradients, post-processing, sampling a full-screen texture")],
          ["(xy·2 − res) / res.y", "−1.33 … 1.33, −1 … 1", tx(t, "glsl03_use3", "Shapes, SDFs, ray marching: anything that must stay round")],
          [tx(t, "glsl03_coord4", "Vertex UV (in vec2 vUV)"), "0 … 1", tx(t, "glsl03_use4", "Effects attached to a mesh, which move with it instead of with the screen")],
        ]}
      />

      <H2>{tx(t, "glsl03_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glsl03_thSymptom", "Symptom"), tx(t, "glsl03_thCause", "Cause"), tx(t, "glsl03_thFix", "Fix")]}
        rows={[
          [tx(t, "glsl03_m1a", "Circles are ellipses"), tx(t, "glsl03_m1b", "Divided x by width and y by height"), tx(t, "glsl03_m1c", "Divide both by uResolution.y")],
          [tx(t, "glsl03_m2a", "Image upside down vs. a texture or image file"), tx(t, "glsl03_m2b", "gl_FragCoord starts bottom-left; most image files start top-left"), tx(t, "glsl03_m2c", "Use 1.0 − uv.y, or flip on load")],
          [tx(t, "glsl03_m3a", "Only a corner of the effect shows"), tx(t, "glsl03_m3b", "uResolution set to the window size on a high-DPI screen"), tx(t, "glsl03_m3c", "Pass glfwGetFramebufferSize")],
          [tx(t, "glsl03_m4a", "Whole screen one colour"), tx(t, "glsl03_m4b", "uResolution never set, so it is (0, 0) and the division gives infinity"), tx(t, "glsl03_m4c", "Set it after use(), and again on resize")],
          [tx(t, "glsl03_m5a", "Animation stutters after hours"), tx(t, "glsl03_m5b", "A large uTime loses float precision inside sin"), tx(t, "glsl03_m5c", "Wrap time on the CPU, e.g. fmod(t, 3600)")],
        ]}
      />

    </article>
  );
}
