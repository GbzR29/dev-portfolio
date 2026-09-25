"use client";

// GLSL track — "Fragment Coordinates & UV".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2 } from "@/components/lesson/LessonComponents";
import { InteractiveUV } from "@/components/lesson/InteractiveUV";

export function FragCoordContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glsl03_intro",
          "The fragment shader has access to the pixel's screen position through gl_FragCoord. Combined with a resolution uniform, this gives you the foundation for full-screen shader effects."
        )}
      </p>

      <H2>{tx(t, "glsl03_fragcoordTitle", "gl_FragCoord")}</H2>
      <p>{tx(t, "glsl03_fragcoordBody", "gl_FragCoord.xy gives the pixel position with (0,0) at the bottom-left corner.")}</p>
      <CodeBlock lang="glsl" filename="fragcoord.glsl" t={t}>{`// gl_FragCoord is built-in — always available in fragment shaders
// .xy = pixel position in window coordinates (0,0 = bottom-left)
// .z  = depth in [0.0, 1.0]
// .w  = 1.0 / clip-space w (for perspective-correct interpolation)

uniform vec2 uResolution;  // window size in pixels, set from C++

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
      <p>{tx(t, "glsl03_centeredBody", "For most effects you want a centered coordinate system with aspect ratio correction.")}</p>
      <CodeBlock lang="glsl" filename="centered_uv.glsl" t={t}>{`uniform vec2 uResolution;

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

      <H2>{tx(t, "glsl03_timeTitle", "Animating with time")}</H2>
      <p>{tx(t, "glsl03_timeBody", "Pass a float uniform that increases each frame, combine with sin/cos for looping animations.")}</p>
      <CodeBlock lang="glsl" filename="time_anim.glsl" t={t}>{`uniform float uTime;       // seconds since start, set each frame
uniform vec2  uResolution;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

    // Spinning color pattern
    float angle = atan(uv.y, uv.x) + uTime;
    float r     = length(uv);
    float bands = sin(angle * 6.0 + r * 10.0) * 0.5 + 0.5;

    FragColor = vec4(bands, bands * 0.5, 1.0 - bands, 1.0);
}`}</CodeBlock>

      <CodeBlock lang="cpp" filename="set_uniforms.cpp" t={t}>{`// Set these every frame in your render loop:
glUniform2f(glGetUniformLocation(prog, "uResolution"),
            (float)width, (float)height);
glUniform1f(glGetUniformLocation(prog, "uTime"),
            (float)glfwGetTime());`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "glsl03_patternTip",
          "The pattern uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y is the standard ShaderToy setup. It centers the coordinate system and corrects the aspect ratio, giving [-aspect, aspect] on X and [-1, 1] on Y."
        )}
      </Callout>

    </article>
  );
}
