"use client";

// "The Shader Playground": how the live editor used throughout the track works, and what it provides.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ShaderPlayground } from "@/components/lesson/glsl/ShaderPlayground";
import { INTRO_PRESETS } from "../presets/basics";

export function PlaygroundContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "glslPg_intro",
          "From here on, almost every chapter has a live shader you can edit. The code is real GLSL ES 3.00, the same language as desktop GLSL 3.30+ apart from a precision line at the top, and it recompiles as you type. This chapter shows what the playground gives your shader, so you can focus on the maths in the rest of the track.")}
      </Lead>

      <ShaderPlayground presets={INTRO_PRESETS} t={t} id="glslPgIntro" />

      <H2>{tx(t, "glslPg_uniformsTitle", "What your shader receives")}</H2>
      <p>
        {tx(t, "glslPg_uniformsBody",
          "Everything below is declared for you, in a fixed prelude above your code. Error line numbers are shifted to match your code, not the prelude.")}
      </p>
      <LessonTable
        headers={[tx(t, "glslPg_thName", "Name"), tx(t, "glslPg_thType", "Type"), tx(t, "glslPg_thMeaning", "Meaning")]}
        rows={[
          ["uResolution", "vec2", tx(t, "glslPg_u1", "canvas size in pixels (device pixels, so it changes on HiDPI screens)")],
          ["uTime", "float", tx(t, "glslPg_u2", "seconds since start; stops while paused, ⟲ resets it")],
          ["uDelta, uFrame", "float, int", tx(t, "glslPg_u3", "seconds since the previous frame; frame counter")],
          ["uMouse", "vec4", tx(t, "glslPg_u4", "xy: pointer position in pixels while the button is held; zw: where it was pressed, negative after release (ShaderToy's iMouse)")],
          ["uTex0 … uTex3", "sampler2D", tx(t, "glslPg_u5", "textures chosen in the pickers that appear when your code uses them: procedural noise, real PBR material maps, prototype grids")],
          ["FragColor", "out vec4", tx(t, "glslPg_u6", "what the fragment shader writes, instead of the old gl_FragColor")],
        ]}
      />
      <p>
        {tx(t, "glslPg_meshBody",
          "Mesh presets add a vertex shader tab and render a real mesh (sphere, torus, cube or a finely subdivided plane) with an orbit camera. The vertex shader gets aPos, aNormal, aUV, aTangent and the uModel / uView / uProjection matrices. It passes vWorld, vNormal, vUV and vTangent to the fragment shader, which also receives uCamPos and uLightDir.")}
      </p>

      <H2>{tx(t, "glslPg_firstTitle", "A first shader, line by line")}</H2>
      <p>{tx(t, "glslPg_firstBody", "Paste this into the playground above. It uses three of the uniforms in the table and nothing else:")}</p>
      <CodeBlock lang="glsl" filename="first.glsl" t={t}>{`void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;          // 0..1 across the canvas
    vec2 m  = uMouse.xy / uResolution;                // the pointer, same units
    float d = distance(uv, m);                        // 0 at the pointer
    float glow = 0.05 / d;                            // bright near it, fades away
    vec3 base = 0.5 + 0.5 * cos(uTime + uv.xyx * 3.0 + vec3(0, 2, 4));
    FragColor = vec4(base * 0.4 + glow, 1.0);
}`}</CodeBlock>
      <p>{tx(t, "glslPg_firstSteps", "Line by line: uv is the pixel's position as a fraction of the canvas (see Fragment Coordinates). m converts the pointer from pixels to the same 0..1 units, so the two can be compared. d is the distance between them. 0.05 / d is 1 at d = 0.05, 0.5 at d = 0.1 and 5 very close to the pointer, so it makes a glow that falls off with distance; values above 1 simply clip to white. base is a cosine palette (see Colour): the three channels are offset by 0, 2 and 4 radians so they peak at different times, and adding uTime makes the colours drift. Before you click, uMouse is (0, 0), so the glow starts in the bottom-left corner.")}</p>

      <H2>{tx(t, "glslPg_controlsTitle", "Controls from comments")}</H2>
      <p>
        {tx(t, "glslPg_controlsBody",
          "Any uniform followed by an annotation comment gets a control. Change the numbers in the comment, or add your own uniforms, and the control panel updates as you type:")}
      </p>
      <CodeBlock lang="glsl" filename="annotations.glsl" t={t}>{`uniform float uRadius;   // @slider 0.02 0.6 0.2       min max default [step]
uniform int   uMode;     // @slider 0 4 1              ints step by 1
uniform vec3  uColor;    // @color 1.0 0.55 0.1        a colour picker
uniform float uRings;    // @toggle 1                  a checkbox: 0.0 or 1.0`}</CodeBlock>
      <p>{tx(t, "glslPg_controlsSteps", "Read the first line as: a slider from 0.02 to 0.6, starting at 0.2. The optional fourth number is the step; without it a float slider moves in 200 small steps across its range, and an int slider by 1. The comment is only a hint to the playground. To GLSL it is an ordinary comment, so the same shader still compiles in your own C++ program, where you set uRadius with glUniform1f instead.")}</p>
      <Callout type="tip" t={t}>
        {tx(t, "glslPg_toyTip",
          "Code from shadertoy.com runs unchanged: when your code defines mainImage() and no main(), the playground maps iTime, iResolution, iMouse and iChannel0..3 onto its own uniforms and calls mainImage for you. Use ⛶ for fullscreen with the editor beside the canvas.")}
      </Callout>
      <LessonTable
        headers={["ShaderToy", tx(t, "glslPg_thHere", "Playground"), tx(t, "glslPg_thNote", "Note")]}
        rows={[
          ["iTime", "uTime", tx(t, "glslPg_st1", "seconds, float")],
          ["iResolution", "uResolution", tx(t, "glslPg_st2", "ShaderToy's is a vec3 (z = pixel aspect, almost always 1); .xy is the same")],
          ["iMouse", "uMouse", tx(t, "glslPg_st3", "same vec4 meaning")],
          ["iChannel0…3", "uTex0…3", tx(t, "glslPg_st4", "texture slots")],
          ["mainImage(out vec4 c, in vec2 fragCoord)", "main() + FragColor", tx(t, "glslPg_st5", "fragCoord is gl_FragCoord.xy")],
        ]}
      />

      <H2>{tx(t, "glslPg_debugTitle", "Debugging a shader")}</H2>
      <p>
        {tx(t, "glslPg_debugBody",
          "There is no printf on the GPU. The universal technique is to output the value you doubt as a colour. Write FragColor = vec4(vec3(x), 1.0) for a scalar, or vec4(v * 0.5 + 0.5, 1.0) for a direction in [−1, 1]. Then check that it looks the way you expect: black where it should be 0, white where 1, a smooth ramp where it should be continuous. Out-of-range values clip to black and white, so use fract(x) to see large values as bands.")}
      </p>
      <CodeBlock lang="glsl" filename="debug_views.glsl" t={t}>{`FragColor = vec4(vec3(d), 1.0);                   // a scalar
FragColor = vec4(normal * 0.5 + 0.5, 1.0);        // a direction
FragColor = vec4(fract(worldPos), 1.0);           // large coordinates as repeating bands
FragColor = vec4(d < 0.0 ? vec3(1, 0, 0) : vec3(0, 0, 1), 1.0);  // a sign
FragColor = vec4(isnan(x) || isinf(x) ? vec3(1, 0, 1) : vec3(0), 1.0);  // NaN hunting`}</CodeBlock>
      <p>{tx(t, "glslPg_debugSteps", "Why * 0.5 + 0.5 for directions: a unit normal's components run −1..1, but a colour channel can only show 0..1, so everything negative would be black. Halving and shifting maps −1 → 0, 0 → 0.5 and 1 → 1. A normal pointing straight up, (0, 1, 0), shows as (0.5, 1, 0.5), light green; one pointing at the camera along +Z shows as (0.5, 0.5, 1), the lavender colour of every normal map. With fract(worldPos), a position of 3.25 shows as 0.25: each whole unit becomes one band, so you can count units on screen. NaN (not a number) comes from 0/0, sqrt(−1) or normalize(vec3(0)) and spreads through every calculation it touches; magenta makes it impossible to miss.")}</p>

      <H2>{tx(t, "glslPg_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "glslPg_thSymptom", "Symptom"), tx(t, "glslPg_thCause", "Cause"), tx(t, "glslPg_thFix", "Fix")]}
        rows={[
          [tx(t, "glslPg_m1a", "\"redefinition of uTime\""), tx(t, "glslPg_m1b", "Declared a uniform the prelude already declares"), tx(t, "glslPg_m1c", "Delete your declaration; it is provided")],
          [tx(t, "glslPg_m2a", "\"gl_FragColor undeclared\""), tx(t, "glslPg_m2b", "Old GLSL 1.x code"), tx(t, "glslPg_m2c", "Write to FragColor instead")],
          [tx(t, "glslPg_m3a", "Canvas black, no error"), tx(t, "glslPg_m3b", "FragColor alpha 0, or every value clipped below 0"), tx(t, "glslPg_m3c", "Output alpha 1.0; debug the value as a colour")],
          [tx(t, "glslPg_m4a", "Pasted ShaderToy code does nothing"), tx(t, "glslPg_m4b", "Both main() and mainImage() defined, so mainImage is never called"), tx(t, "glslPg_m4c", "Keep only mainImage")],
          [tx(t, "glslPg_m5a", "Slider missing"), tx(t, "glslPg_m5b", "Annotation not on the same line as the uniform, or a type the panel does not support (only float, int, vec3 and bool)"), tx(t, "glslPg_m5c", "Same line, right after the semicolon; split a vec2 into two floats")],
        ]}
      />

      <KeyIdeas t={t} id="glslPg" items={[
        "The playground compiles real GLSL ES 3.00 as you type; errors point at your own line numbers.",
        "Built-ins: uResolution, uTime, uMouse (ShaderToy semantics), uTex0..3 textures, FragColor.",
        "// @slider, @color and @toggle after a uniform create controls automatically.",
        "Mesh presets add an editable vertex shader and an orbit camera.",
        "Debug by painting the value you doubt as a colour.",
      ]} />
    </Article>
  );
}
