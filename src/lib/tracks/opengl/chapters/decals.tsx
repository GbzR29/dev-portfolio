"use client";

// "Decals" (Advanced Techniques): mesh decals, projected/deferred decals, reconstructing position from depth, clustered decals.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { DecalFigure } from "@/components/lesson/figures/tech/DecalFigure";

const r = String.raw;

export function DecalsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglDecal_intro",
          "Bullet holes, blood splatter, graffiti, tyre marks, footprints, puddles, road markings, dirt on a wall: all are decals, images stuck onto existing surfaces without changing their meshes or textures. Most are added at runtime, anywhere, on any surface. The modern way to do it doesn't touch the geometry at all. It projects the image onto whatever the depth buffer says is there.")}
      </Lead>

      <H2>{tx(t, "oglDecal_meshTitle", "Mesh decals and their limits")}</H2>
      <p>
        {tx(t, "oglDecal_meshBody",
          "The classic approach clips the target mesh's triangles against the decal's box on the CPU, builds a small new mesh from the pieces, and draws it slightly offset with glPolygonOffset to avoid z-fighting. It is exact and cheap to draw, but building it means reading the mesh on the CPU, which rules out skinned and GPU-deformed geometry. Every decal also becomes one more mesh and one more draw.")}
      </p>

      <H2>{tx(t, "oglDecal_projTitle", "Projected (deferred) decals")}</H2>
      <p>
        {tx(t, "oglDecal_projBody",
          "A projected decal is just an oriented box with a texture. After the scene's depth is available (the G-buffer in a deferred renderer, or a depth pre-pass in forward), each pixel inside the box's screen footprint asks: where in the world is the surface I show? Is that point inside the box? If so, where in the box? The answer to the last question is the texture coordinate.")}
      </p>
      <Equation label={tx(t, "oglDecal_reconLabel", "1 — World position from the depth buffer")}
        where={[
          [r`uv`, tx(t, "oglDecal_wUv", "the pixel's screen position in [0, 1]²")],
          [r`d`, tx(t, "oglDecal_wD", "the stored depth in [0, 1] (the default glDepthRange)")],
          [r`(PV)^{-1}`, tx(t, "oglDecal_wInv", "inverse of projection · view")],
        ]}
        note={tx(t, "oglDecal_reconNote", "This is the same unprojection as the picking ray, now with the depth of the actual surface instead of the near and far planes. A cheaper variant stores the linear view depth and scales a per-pixel view ray, which saves the matrix multiply and the divide.")}>
        {r`\mathbf n_{ndc} = \big(2\,uv - 1,\ \ 2d - 1,\ \ 1\big) \qquad \mathbf w = (PV)^{-1}\,\mathbf n_{ndc} \qquad \mathbf p_{world} = \mathbf w_{xyz} / \mathbf w_w`}
      </Equation>
      <Equation label={tx(t, "oglDecal_localLabel", "2 — Into the decal box, clip, and read the texture")}
        where={[
          [r`D`, tx(t, "oglDecal_wDm", "the decal's model matrix: position, orientation, and size (its box is the unit cube [−0.5, 0.5]³ in local space)")],
          [r`\mathbf q`, tx(t, "oglDecal_wQ", "the surface point in the decal's local space")],
        ]}
        note={tx(t, "oglDecal_localNote", "The projection axis is the box's local Y. The texture is laid out on the XZ face and pushed through the box along Y, like a slide projector. Everything the box contains gets the image, whatever its orientation, which is exactly the stretching problem below.")}>
        {r`\mathbf q = D^{-1}\,\mathbf p_{world} \qquad \text{discard if } \max(|q_x|, |q_y|, |q_z|) > \tfrac12 \qquad uv_{decal} = (q_x, q_z) + \tfrac12`}
      </Equation>
      <Equation label={tx(t, "oglDecal_fadeLabel", "3 — Angle fade: avoid stretching")}
        where={[
          [r`\vN`, tx(t, "oglDecal_wN", "the surface normal: from the G-buffer, or cross(dFdx(p), dFdy(p)) of the reconstructed positions")],
          [r`\hat{\mathbf y}_D`, tx(t, "oglDecal_wY", "the decal's projection axis in world space (normalised second column of D)")],
        ]}
        note={tx(t, "oglDecal_fadeNote", "A surface parallel to the projection axis receives one line of texels stretched across its whole extent. Fading by |N·ŷ| removes those surfaces smoothly. Using abs() lets both sides of thin objects receive the decal; without it, only surfaces facing the projector do.")}>
        {r`\alpha' = \alpha \cdot \operatorname{smoothstep}\big(c_0,\ c_1,\ |\vN\cdot\hat{\mathbf y}_D|\big)`}
      </Equation>
      <DecalFigure t={t} />
      <CodeBlock lang="glsl" filename="decal.frag" t={t}>{`// Drawn by rasterising the decal's box (back faces, depth test off),
// so only pixels inside its screen footprint run this.
uniform sampler2D uDepth, uDecalAlbedo;
uniform mat4 uInvViewProj, uInvDecal;
uniform vec3 uDecalAxis;
uniform vec2 uScreen;
out vec4 outAlbedo;                                     // blended into the G-buffer's albedo

void main() {
    vec2 uv = gl_FragCoord.xy / uScreen;
    float d = texture(uDepth, uv).r;
    vec4 w = uInvViewProj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
    vec3 p = w.xyz / w.w;
    vec3 q = (uInvDecal * vec4(p, 1.0)).xyz;
    if (any(greaterThan(abs(q), vec3(0.5)))) discard;
    vec3 N = normalize(cross(dFdx(p), dFdy(p)));
    vec4 c = texture(uDecalAlbedo, q.xz + 0.5);
    c.a *= smoothstep(0.3, 0.6, abs(dot(N, uDecalAxis)));
    outAlbedo = c;                                      // glBlendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
}`}</CodeBlock>

      <H2>{tx(t, "oglDecal_gbufTitle", "Decals in a deferred G-buffer")}</H2>
      <p>
        {tx(t, "oglDecal_gbufBody",
          "Written into the G-buffer before lighting, a decal is lit exactly like the surface under it: it gets shadows, reflections and every light for free. It can modify each channel separately, so a puddle darkens the albedo and lowers the roughness, and a crack only changes normals. Normals need care: a decal's normal map is in its own tangent frame, the box axes, and blending normals linearly flattens them, so engines blend in a derivative space or use a \"reoriented normal mapping\" formula. Unreal's DBuffer runs the decals before the base pass so that forward-shaded materials can read them too.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglDecal_thType", "Kind"), tx(t, "oglDecal_thHow", "How"), tx(t, "oglDecal_thTrade", "Trade-off")]}
        rows={[
          [tx(t, "oglDecal_k1", "Mesh decals"), tx(t, "oglDecal_k1h", "CPU clips triangles against the box; draw with polygon offset"), tx(t, "oglDecal_k1t", "exact, cheap to draw; no skinned targets; one mesh each")],
          [tx(t, "oglDecal_k2", "Deferred decals"), tx(t, "oglDecal_k2h", "rasterise the box, reconstruct position from depth, write to the G-buffer"), tx(t, "oglDecal_k2t", "any surface, lit for free; overdraw with many decals; needs depth first")],
          [tx(t, "oglDecal_k3", "Clustered decals"), tx(t, "oglDecal_k3h", "decals binned into the same cluster grid as lights; the material shader loops over them"), tx(t, "oglDecal_k3t", "works in forward; no blending order issues; one texture atlas for all decals (DOOM 2016)")],
          [tx(t, "oglDecal_k4", "Texture-space (virtual texturing)"), tx(t, "oglDecal_k4h", "bake the decal into the surface's own texture pages"), tx(t, "oglDecal_k4t", "free at draw time; needs a virtual texture system; permanent")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "oglDecal_pitfalls",
          "Mip selection breaks at the box edges: the decal uv jumps, derivatives explode, and a 1-pixel line of the smallest mip appears. Use textureGrad with the derivatives of q.xz before the discard, or skip mips. Decals meant for walls must not land on characters walking past, so exclude them with a stencil bit set when drawing dynamic objects. Sort decals by a creation index so newer ones cover older ones, and cap their count: every decal box is extra overdraw.")}
      </Callout>

      <KeyIdeas t={t} id="oglDecal" items={[
        "A projected decal is an oriented box; every pixel inside it reconstructs its world position from depth.",
        "q = D⁻¹ p: discard outside the unit box; (q.x, q.z) + 0.5 is the texture coordinate.",
        "Fade by |N · axis| to avoid stretching on surfaces parallel to the projection.",
        "Writing decals into the G-buffer makes them lit, shadowed and reflected like the surface below.",
        "Mask dynamic objects with the stencil; beware mip selection at box edges.",
      ]} />
    </Article>
  );
}
