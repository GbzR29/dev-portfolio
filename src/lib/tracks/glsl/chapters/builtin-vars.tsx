"use client";

// GLSL track — "Built-in Variables".

import type { TrackTranslations } from "@/lib/tracks/types";
import { tx } from "@/lib/tracks/tx";
import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";

export function BuiltinVarsContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "glslBv_intro",
          "Your own in and out variables connect one shader to the next. Built-in variables connect a shader to the fixed parts of the pipeline instead: the part that fetches vertices, the rasteriser, the depth test. They all start with gl_, a prefix reserved for them, and each stage has its own set. gl_Position and gl_FragCoord are the two you already know; this chapter covers the rest that matter in practice."
        )}
      </p>

      <H2>{tx(t, "glslBv_vsTitle", "In the vertex shader")}</H2>
      <LessonTable
        headers={[tx(t, "glslBv_h0", "Variable"), tx(t, "glslBv_h1", "Type"), tx(t, "glslBv_h2", "Meaning")]}
        rows={[
          ["gl_VertexID",      "in int",     tx(t, "glslBv_v1", "which vertex this is: first + i for glDrawArrays, the value read from the index buffer for glDrawElements")],
          ["gl_InstanceID",    "in int",     tx(t, "glslBv_v2", "which instance this is in an instanced draw, counting from 0 (0 when not instanced)")],
          ["gl_Position",      "out vec4",   tx(t, "glslBv_v3", "the clip-space position the rasteriser uses — the one output you must write")],
          ["gl_PointSize",     "out float",  tx(t, "glslBv_v4", "the width in pixels of a point, when drawing GL_POINTS")],
          ["gl_ClipDistance[]","out float[]",tx(t, "glslBv_v5", "signed distances to your own clipping planes; negative is cut away")],
          ["gl_BaseVertex, gl_BaseInstance, gl_DrawID", "in int", tx(t, "glslBv_v6", "(GLSL 4.60) the base values and draw index of multi-draw and indirect calls")],
        ]}
      />

      <p>
        {tx(t, "glslBv_idBody",
          "gl_VertexID and gl_InstanceID let a shader compute geometry that is not stored anywhere. With no vertex buffer at all, the bits of the vertex number are enough to build the four corners of a quad, and the instance number can place each copy in a grid. The Framebuffers chapter of the OpenGL track uses the same idea to draw a fullscreen triangle from three vertex numbers."
        )}
      </p>
      <CodeBlock lang="glsl" filename="grid_of_quads.vert" t={t}>{`#version 460 core
// Draw with: glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 4, 100);  — no VBO, empty VAO
uniform mat4 uViewProj;

void main() {
    // gl_VertexID 0,1,2,3 → corners (0,0) (1,0) (0,1) (1,1): bit 0 is x, bit 1 is y
    vec2 corner = vec2(gl_VertexID & 1, gl_VertexID >> 1);

    // gl_InstanceID 0..99 → a 10 × 10 grid of cells
    vec2 cell = vec2(gl_InstanceID % 10, gl_InstanceID / 10);

    vec2 p = (cell + corner * 0.9) * 1.2;          // 0.9: leave a gap between quads
    gl_Position = uViewProj * vec4(p.x, 0.0, p.y, 1.0);
}`}</CodeBlock>

      <H2>{tx(t, "glslBv_pointTitle", "Points: gl_PointSize and gl_PointCoord")}</H2>
      <p>
        {tx(t, "glslBv_pointBody",
          "A GL_POINTS draw turns each vertex into a square of pixels centred on its position. gl_PointSize sets the side of that square in pixels, but only after glEnable(GL_PROGRAM_POINT_SIZE); without it the shader's value is ignored and the fixed size from glPointSize is used. In the fragment shader, gl_PointCoord says where the fragment lies inside its square, from (0, 0) at the top-left corner to (1, 1) at the bottom-right. That is enough to cut the square into a disc and to shade it like a small sphere."
        )}
      </p>
      <CodeBlock lang="glsl" filename="round_points.vert + .frag" t={t}>{`// vertex shader
uniform mat4  uViewProj;
uniform float uSize;            // diameter in pixels at distance 1
void main() {
    gl_Position  = uViewProj * vec4(aPos, 1.0);
    // For a perspective projection w is the distance in front of the camera,
    // so dividing by it makes far points smaller, like everything else
    gl_PointSize = uSize / gl_Position.w;
}

// fragment shader
out vec4 FragColor;
void main() {
    vec2  p = gl_PointCoord * 2.0 - 1.0;     // −1 … 1 across the square
    float r2 = dot(p, p);                     // squared distance from the centre
    if (r2 > 1.0) discard;                    // outside the disc
    float light = sqrt(1.0 - r2);             // height of a unit sphere there: brighter in the middle
    FragColor = vec4(vec3(1.0, 0.6, 0.2) * light, 1.0);
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "glslBv_pointWarn",
          "Points have two limits. Their size is capped by the implementation (query GL_POINT_SIZE_RANGE), and a point is clipped by its centre, so a large point vanishes all at once the moment its centre leaves the screen. For particles bigger than a few pixels, instanced quads are the safer choice, as the Particles chapter explains."
        )}
      </Callout>

      <H2>{tx(t, "glslBv_clipTitle", "Your own clipping planes: gl_ClipDistance")}</H2>
      <p>
        {tx(t, "glslBv_clipBody",
          "Besides the six sides of the view frustum, the rasteriser can clip against planes you define. Write a signed distance per vertex into gl_ClipDistance[i] and enable GL_CLIP_DISTANCE0 + i on the CPU. The distance is interpolated across each triangle, and the parts where it is negative are cut off exactly, producing new edges rather than discarded pixels. A plane can be stored as a vec4 (n, d), with n its unit normal and d its offset; for a point p, dot(n, p) + d is its signed distance from the plane. The classic use is water: when rendering the reflection, everything below the water surface is clipped away."
        )}
      </p>
      <CodeBlock lang="glsl" filename="clip_plane.vert" t={t}>{`uniform mat4 uModel, uViewProj;
uniform vec4 uClipPlane;            // (n.x, n.y, n.z, d); for water at height h: (0, 1, 0, -h)

out float gl_ClipDistance[1];       // redeclare with the number of planes you use

void main() {
    vec4 world = uModel * vec4(aPos, 1.0);
    gl_ClipDistance[0] = dot(world, uClipPlane);   // = dot(n, p) + d, since world.w = 1
    gl_Position = uViewProj * world;
}

// C++: glEnable(GL_CLIP_DISTANCE0);  ... draw the reflection ...  glDisable(GL_CLIP_DISTANCE0);`}</CodeBlock>

      <H2>{tx(t, "glslBv_fsTitle", "In the fragment shader")}</H2>
      <LessonTable
        headers={[tx(t, "glslBv_h0", "Variable"), tx(t, "glslBv_h1", "Type"), tx(t, "glslBv_h2", "Meaning")]}
        rows={[
          ["gl_FragCoord",   "in vec4",  tx(t, "glslBv_f1", "window position of the fragment and its depth — see Fragment Coordinates & UV")],
          ["gl_FrontFacing", "in bool",  tx(t, "glslBv_f2", "true if the triangle faces the camera, according to its winding")],
          ["gl_PointCoord",  "in vec2",  tx(t, "glslBv_f3", "position inside a point's square, (0, 0) top-left to (1, 1) bottom-right")],
          ["gl_PrimitiveID", "in int",   tx(t, "glslBv_f4", "the number of the triangle (or line, or point) within the current draw call")],
          ["gl_SampleID, gl_SamplePosition", "in int, in vec2", tx(t, "glslBv_f5", "which MSAA sample is being shaded and where it sits in the pixel; reading them makes the shader run once per sample")],
          ["gl_FragDepth",   "out float",tx(t, "glslBv_f6", "overrides the depth written to the depth buffer (default: gl_FragCoord.z)")],
        ]}
      />

      <p>
        {tx(t, "glslBv_frontBody",
          "gl_FrontFacing is what makes a two-sided material work. With face culling off, the back of a leaf or a sheet of paper is rasterised too, but its normal still points out of the front side, so the lighting treats it as facing away and draws it black. Flipping the normal when gl_FrontFacing is false lights both sides correctly. Which side counts as front follows glFrontFace, counter-clockwise by default."
        )}
      </p>
      <CodeBlock lang="glsl" filename="two_sided.frag" t={t}>{`in  vec3 vNormal;
out vec4 FragColor;
uniform vec3 uLightDir;          // towards the light, normalised
uniform vec3 uFront, uBack;      // e.g. a leaf: lighter underside

void main() {
    vec3 N     = normalize(gl_FrontFacing ? vNormal : -vNormal);
    vec3 base  = gl_FrontFacing ? uFront : uBack;
    float diff = max(dot(N, uLightDir), 0.0);
    FragColor  = vec4(base * (0.2 + 0.8 * diff), 1.0);
}`}</CodeBlock>

      <p>
        {tx(t, "glslBv_depthBody",
          "gl_FragDepth replaces the depth the rasteriser computed. The standard use is an impostor: a sphere drawn as a flat quad that faces the camera, whose fragment shader works out the sphere's real surface point. Writing that point's depth makes the sphere intersect other geometry correctly, as if it were round. The depth must be produced the same way the rasteriser does it: project the point, divide by w, and map the result from [−1, 1] to [0, 1]."
        )}
      </p>
      <CodeBlock lang="glsl" filename="sphere_impostor_depth.frag" t={t}>{`uniform mat4 uProjection;
// ... viewPos = the point on the sphere's surface in view space, found per fragment ...
vec4 clip = uProjection * vec4(viewPos, 1.0);
float ndcZ = clip.z / clip.w;              // −1 (near) … 1 (far)
gl_FragDepth = ndcZ * 0.5 + 0.5;           // the same [0, 1] value the depth buffer stores`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "glslBv_depthWarn",
          "Two rules come with gl_FragDepth. If any path through the shader writes it, every path must, or the depth of the other fragments is undefined. And writing it disables early depth testing, because the depth is no longer known before the shader runs. The Depth Testing chapter of the OpenGL track shows how conservative depth, layout(depth_greater), gives some of that speed back."
        )}
      </Callout>

      <H2>{tx(t, "glslBv_interpTitle", "How outputs are interpolated")}</H2>
      <p>
        {tx(t, "glslBv_interpBody",
          "Every out of the vertex shader reaches the fragment shader as a blend of the triangle's three vertex values. A qualifier on the variable chooses how that blend is made:"
        )}
      </p>
      <LessonTable
        headers={[tx(t, "glslBv_iH0", "Qualifier"), tx(t, "glslBv_iH1", "Blend"), tx(t, "glslBv_iH2", "Use for")]}
        rows={[
          ["smooth", tx(t, "glslBv_i1", "the default: perspective-correct, so a texture on a floor does not bend"), tx(t, "glslBv_i1u", "almost everything: normals, uvs, colours")],
          ["noperspective", tx(t, "glslBv_i2", "linear in screen space, ignoring depth"), tx(t, "glslBv_i2u", "screen-space effects, such as the edge distances of a wireframe overlay")],
          ["flat", tx(t, "glslBv_i3", "no blend: every fragment gets the value of one vertex, the provoking vertex (the last one by default)"), tx(t, "glslBv_i3u", "ids and indices; required for int and uint outputs")],
        ]}
      />
      <CodeBlock lang="glsl" filename="qualifiers.glsl" t={t}>{`// vertex shader
flat          out int  vMaterialId;
noperspective out vec3 vEdgeDist;
smooth        out vec2 vUV;          // 'smooth' is the default and is usually left out

// fragment shader — the qualifiers must match the vertex shader's
flat          in int  vMaterialId;
noperspective in vec3 vEdgeDist;
in vec2 vUV;`}</CodeBlock>

      <H2>{tx(t, "glslBv_blockTitle", "Interface blocks")}</H2>
      <p>
        {tx(t, "glslBv_blockBody",
          "When a stage passes many values on, grouping them in an interface block keeps both sides readable. A block has a block name, which is what the next stage matches, and an instance name, which is only how each shader refers to it; the two shaders may use different instance names. The members must match in name, type and order. In geometry and tessellation shaders the input block is an array with one entry per vertex of the primitive."
        )}
      </p>
      <CodeBlock lang="glsl" filename="interface_block.glsl" t={t}>{`// vertex shader
out VS_OUT {                // VS_OUT: the block name — must match in the next stage
    vec3 worldPos;
    vec3 normal;
    vec2 uv;
} vs_out;                   // vs_out: this shader's name for it
...
vs_out.normal = mat3(uNormalMatrix) * aNormal;

// fragment shader
in VS_OUT {
    vec3 worldPos;
    vec3 normal;
    vec2 uv;
} fs_in;                    // a different instance name is fine
...
vec3 N = normalize(fs_in.normal);

// geometry shader: one entry per input vertex
in VS_OUT { vec3 worldPos; vec3 normal; vec2 uv; } gs_in[];`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "glslBv_perVertexNote",
          "The built-ins follow the same pattern. gl_Position, gl_PointSize and gl_ClipDistance are members of a predefined block called gl_PerVertex, which is why a geometry shader reads gl_in[i].gl_Position. Compute shaders have their own built-ins, such as gl_GlobalInvocationID and gl_LocalInvocationID; the Compute Shaders chapter of the OpenGL track explains them."
        )}
      </Callout>

    </article>
  );
}
