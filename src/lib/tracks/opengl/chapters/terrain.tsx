"use client";

// "Terrain Rendering" (Advanced Techniques): heightmaps, normals, texture
// splatting, triplanar mapping and level of detail for large landscapes.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TerrainFigure } from "@/components/lesson/figures/tech/TerrainFigure";

const r = String.raw;

export function TerrainContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTerr_intro",
          "Landscapes are the one kind of geometry almost every open-world game has, and they break the usual rules. A single terrain can be tens of kilometres across, far too big to be one mesh at full detail. It is also too big to texture with one image, and too visible from afar to leave out. Terrain rendering is a toolbox for those three problems. The shape comes from a heightmap, the surface is textured by rules instead of by hand, and the mesh loses detail smoothly with distance.")}
      </Lead>

      <H2>{tx(t, "oglTerr_hmTitle", "Heightmaps")}</H2>
      <p>
        {tx(t, "oglTerr_hmBody",
          "A heightmap is a greyscale image read as a function y = h(x, z): each texel gives the ground's height at one point of a regular grid. It is compact (a 4097² 16-bit map describes a 16 km × 16 km square at 4 m spacing in 32 MB), easy to edit, erode and stream, and it maps directly to a grid mesh: vertex (i, j) goes to (i·s, h(i, j), j·s). What it cannot store is anything with two heights at the same (x, z): caves, overhangs, arches. Those are added as separate meshes, or the terrain is stored as a voxel density instead.")}
      </p>
      <Equation label={tx(t, "oglTerr_nLabel", "Normals from central differences")}
        where={[
          [r`h_{i\pm1,j},\ h_{i,j\pm1}`, tx(t, "oglTerr_wH", "the four neighbouring samples along x and z")],
          [r`s`, tx(t, "oglTerr_wS", "the grid spacing in world units. The slope along x is the rise (h_{i+1} − h_{i−1}) over the run 2s")],
          [r`\mathbf n`, tx(t, "oglTerr_wN", "the normal of the surface y = h(x, z) is (−∂h/∂x, 1, −∂h/∂z), normalised. It is the cross product of the two tangents (1, ∂h/∂x, 0) and (0, ∂h/∂z, 1)")],
        ]}
        note={tx(t, "oglTerr_nNote", "Compute normals from the full-resolution heightmap, not from the mesh being drawn. Then every level of detail uses the same lighting, and a coarse far-away mesh still shows the ridges its missing triangles would have had. The shader can also read the heightmap (or a precomputed normal map) directly.")}
        glsl={`float hL = texture(uHeight, uv - vec2(texel.x, 0)).r, hR = texture(uHeight, uv + vec2(texel.x, 0)).r;
float hD = texture(uHeight, uv - vec2(0, texel.y)).r, hU = texture(uHeight, uv + vec2(0, texel.y)).r;
vec3 n = normalize(vec3(hL - hR, 2.0 * spacing, hD - hU));`}>
        {r`\frac{\partial h}{\partial x} \approx \frac{h_{i+1,j} - h_{i-1,j}}{2s}, \quad \frac{\partial h}{\partial z} \approx \frac{h_{i,j+1} - h_{i,j-1}}{2s}, \qquad \mathbf n = \operatorname{normalize}\!\Big(-\frac{\partial h}{\partial x},\ 1,\ -\frac{\partial h}{\partial z}\Big)`}
      </Equation>

      <TerrainFigure t={t} />

      <H2>{tx(t, "oglTerr_splatTitle", "Texture splatting")}</H2>
      <p>
        {tx(t, "oglTerr_splatBody",
          "Nobody paints a texture over 16 km². The terrain shader instead blends a small set of tiling materials (grass, rock, sand, snow) with a weight per material at every pixel. The weights come from a splat map painted by artists (4 materials per RGBA texel), from rules on height and slope, or from both. The figure uses rules. Sand goes where it is low and flat, rock where it is steep, snow where it is high and not too steep, and grass everywhere else. The weights are divided by their sum so they always add up to 1.")}
      </p>
      <Equation label={tx(t, "oglTerr_splatLabel", "Rule-based weights and the blend")}
        where={[
          [r`\text{slope} = 1 - n_y`, tx(t, "oglTerr_wSlope", "0 on flat ground, 1 on a vertical cliff (n_y is the cosine of the angle to straight up)")],
          [r`\text{wobble}`, tx(t, "oglTerr_wWobble", "low-frequency noise added to height and slope before the thresholds, so transitions follow the terrain in irregular lines instead of perfect contours")],
          [r`\mathbf w / \textstyle\sum w`, tx(t, "oglTerr_wNorm", "normalising keeps the brightness constant where materials overlap")],
        ]}
        note={tx(t, "oglTerr_splatNote", "Blending by weight alone gives soft, muddy transitions. Height blending sharpens them: each material also has a height texture (pebbles stand above sand), and a material wins where weight + height is largest. Stones then poke through sand instead of fading into it.")}>
        {r`w_{\text{rock}} = \operatorname{smoothstep}(0.28, 0.45, \text{slope}),\ \ w_{\text{snow}} = \operatorname{smoothstep}(26, 30, y)\,(1 - \ldots) \qquad C = \frac{\sum_k w_k\,C_k}{\sum_k w_k}`}
      </Equation>
      <Equation label={tx(t, "oglTerr_triLabel", "Triplanar mapping for cliffs")}
        where={[
          [r`C_{yz},\ C_{xz},\ C_{xy}`, tx(t, "oglTerr_wProj", "the material sampled three times, projected along each world axis: texture(uTex, p.yz), texture(uTex, p.xz) and texture(uTex, p.xy)")],
          [r`|n|^k`, tx(t, "oglTerr_wK", "each projection's weight is how much the surface faces that axis, sharpened by the power k (4–8) so the blend zones stay narrow")],
        ]}
        note={tx(t, "oglTerr_triNote", "Heightmap UVs are just (x, z), which stretches textures down steep slopes into long streaks. Triplanar mapping ignores UVs and projects from whichever side the surface faces. It costs three samples per material, so it is usually applied only to the rock layer.")}>
        {r`C = \frac{|n_x|^k C_{yz} + |n_y|^k C_{xz} + |n_z|^k C_{xy}}{|n_x|^k + |n_y|^k + |n_z|^k}`}
      </Equation>

      <H2>{tx(t, "oglTerr_lodTitle", "Level of detail: chunks, cracks and skirts")}</H2>
      <p>
        {tx(t, "oglTerr_lodBody",
          "The grid is cut into square chunks, each stored at several resolutions: every sample, every 2nd, every 4th and so on. This is geomipmapping, after the mip levels of a texture. Each frame a chunk picks its level from its distance to the camera, one level coarser each time the distance doubles, so triangles stay roughly the same size on screen. The trouble is at the borders. A fine chunk has a vertex in the middle of an edge where its coarse neighbour has none, so the two surfaces disagree there (a T-junction) and pixels of background leak through the crack.")}
      </p>
      <LessonTable
        headers={[tx(t, "oglTerr_tFix", "Crack fix"), tx(t, "oglTerr_tHow", "How"), tx(t, "oglTerr_tCost", "Cost")]}
        rows={[
          [tx(t, "oglTerr_c1", "Skirts"), tx(t, "oglTerr_c1h", "a vertical strip of triangles hanging down from every chunk edge. It fills the gap from below, and nobody notices a wall behind a crack"), tx(t, "oglTerr_c1c", "trivial; a few extra triangles; can show on very steep, close edges")],
          [tx(t, "oglTerr_c2", "Stitching"), tx(t, "oglTerr_c2h", "a fine chunk next to a coarser one uses special edge triangles that skip its extra vertices (one index buffer per neighbour combination)"), tx(t, "oglTerr_c2c", "exact; 16 variants per level; neighbours may differ by at most one level")],
          [tx(t, "oglTerr_c3", "Vertex snapping"), tx(t, "oglTerr_c3h", "in the vertex shader, move the odd vertices of a fine edge onto the line between their even neighbours"), tx(t, "oglTerr_c3c", "exact and cheap; needs the neighbour's level")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "oglTerr_popping", "Switching a chunk from one level to the next makes its silhouette jump (popping). CDLOD (continuous distance-dependent LOD) morphs each vertex toward its coarser position as the chunk approaches the switch distance, so the change is never visible. Clipmaps turn the scheme around. The mesh is a set of nested rings centred on the camera, each ring twice as coarse as the one inside it, and the heightmap is scrolled under them. The tessellation shader chapter shows the GPU way: draw coarse patches and let the tessellator add detail by screen-space edge length.")}
      </Callout>
      <CodeBlock lang="cpp" filename="terrain_lod.cpp" t={t}>{`for (Chunk& c : chunks) {
    if (!frustum.intersects(c.bounds)) continue;               // see Frustum Culling
    float d = glm::distance(camPos, c.bounds.centre());
    int lod = d < lodDistance ? 0
            : std::min(kLevels - 1, int(std::floor(std::log2(d / lodDistance))) + 1);
    glBindVertexArray(c.vao[lod]);
    glDrawElements(GL_TRIANGLES, c.indexCount[lod], GL_UNSIGNED_INT, nullptr);
    glDrawElements(GL_TRIANGLES, c.skirtCount[lod], GL_UNSIGNED_INT,
                   (void*)(c.skirtFirst[lod] * sizeof(GLuint)));   // skirts, culling off
}`}</CodeBlock>

      <KeyIdeas t={t} id="oglTerr" items={[
        "A heightmap is y = h(x, z) on a grid: compact and streamable, but no overhangs.",
        "Normals: (−∂h/∂x, 1, −∂h/∂z) from central differences of the full-resolution map.",
        "Splatting blends tiling materials by weights from a splat map or height/slope rules, normalised to sum to 1.",
        "Triplanar mapping projects textures along x, y and z to keep cliffs from stretching.",
        "Chunks pick a level by distance; cracks at level changes are hidden with skirts, stitching or vertex snapping.",
      ]} />
    </Article>
  );
}
