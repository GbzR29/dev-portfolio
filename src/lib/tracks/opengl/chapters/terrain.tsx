"use client";

// "Terrain Rendering" (Advanced Techniques): heightmaps, normals, texture
// splatting, triplanar mapping and level of detail for large landscapes.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { normalNumbers, splatNumbers, triNumbers } from "@/lib/tracks/opengl/live/terrain";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TerrainFigure } from "@/components/lesson/figures/tech/TerrainFigure";

const r = String.raw;

export function TerrainContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglTerr_intro",
          "Landscapes are the one kind of geometry almost every open-world game has, and they break the usual rules. A single terrain can be tens of kilometres across, far too big to be one mesh at full detail. It is also too big to texture with one image, and too visible from afar to leave out. Terrain rendering is a toolbox for those three problems. The shape comes from a heightmap, the surface is textured by rules instead of by hand, and the mesh loses detail smoothly with distance.")}
      </Lead>

      <Goals t={t} id="oglTerr" items={[
        "Build terrain from a heightmap.",
        "Blend several textures across it with splatting.",
        "Split it into chunks with levels of detail, without cracks.",
      ]} />

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
        words={tx(t, "oglTerr_nWords", "Estimate how steeply the ground rises along x and along z from the neighbours on either side. Then tip the up vector against those two slopes and make it length 1.")}
        note={tx(t, "oglTerr_nNote", "Compute normals from the full-resolution heightmap, not from the mesh being drawn. Then every level of detail uses the same lighting, and a coarse far-away mesh still shows the ridges its missing triangles would have had. The shader can also read the heightmap (or a precomputed normal map) directly.")}
        glsl={`float hL = texture(uHeight, uv - vec2(texel.x, 0)).r, hR = texture(uHeight, uv + vec2(texel.x, 0)).r;
float hD = texture(uHeight, uv - vec2(0, texel.y)).r, hU = texture(uHeight, uv + vec2(0, texel.y)).r;
vec3 n = normalize(vec3(hL - hR, 2.0 * spacing, hD - hU));`}>
        {r`\begin{gathered} \frac{\partial h}{\partial x} \approx \frac{h_{i+1,j} - h_{i-1,j}}{2s}, \quad \frac{\partial h}{\partial z} \approx \frac{h_{i,j+1} - h_{i,j-1}}{2s} \\[4pt] \mathbf n = \operatorname{normalize}\!\Big(-\frac{\partial h}{\partial x},\ 1,\ -\frac{\partial h}{\partial z}\Big) \end{gathered}`}
      </Equation>
      <Derivation t={t} label={tx(t, "oglTerr_crossDer", "Why the normal is (−∂h/∂x, 1, −∂h/∂z)")}
        steps={[
          { full: true, tex: r`\mathbf t_x = \Big(1,\ \frac{\partial h}{\partial x},\ 0\Big) \qquad \mathbf t_z = \Big(0,\ \frac{\partial h}{\partial z},\ 1\Big)`,
            why: tx(t, "oglTerr_cd1", "walking one unit along x on the surface, you also climb ∂h/∂x; the same along z. Both vectors lie in the surface") },
          { full: true, tex: r`\mathbf t_z \times \mathbf t_x = \Big(\frac{\partial h}{\partial z}\cdot 0 - 1 \cdot \frac{\partial h}{\partial x},\ \ 1 \cdot 1 - 0 \cdot 0,\ \ 0 \cdot \frac{\partial h}{\partial x} - \frac{\partial h}{\partial z} \cdot 1\Big)`,
            why: tx(t, "oglTerr_cd2", "the cross product of two vectors in the surface is perpendicular to both, so it is a normal. The order t_z × t_x makes it point up") },
          { full: true, tex: r`\mathbf t_z \times \mathbf t_x = \Big(-\frac{\partial h}{\partial x},\ 1,\ -\frac{\partial h}{\partial z}\Big)`,
            why: tx(t, "oglTerr_cd3", "the zeros drop out: y is always 1, and each slope tips the normal away from the uphill side. On flat ground both slopes are 0 and n = (0, 1, 0)") },
        ]} />
      <LiveFormula label={tx(t, "oglTerr_nLive", "Try it: four neighbours, 4 m apart")}
        tex={r`\frac{\partial h}{\partial x} \approx \frac{h_{i+1,j} - h_{i-1,j}}{2s} \qquad \frac{\partial h}{\partial z} \approx \frac{h_{i,j+1} - h_{i,j-1}}{2s} \qquad s = 4`}
        vars={[
          { id: "hL", label: <>h<sub>i−1,j</sub></>, min: 0, max: 20, step: 0.5, value: 10, fmt: v => `${v} m` },
          { id: "hR", label: <>h<sub>i+1,j</sub></>, min: 0, max: 20, step: 0.5, value: 14, fmt: v => `${v} m` },
          { id: "hD", label: <>h<sub>i,j−1</sub></>, min: 0, max: 20, step: 0.5, value: 10, fmt: v => `${v} m` },
          { id: "hU", label: <>h<sub>i,j+1</sub></>, min: 0, max: 20, step: 0.5, value: 10, fmt: v => `${v} m` },
        ]}
        compute={normalNumbers(t)}
        note={tx(t, "oglTerr_nLiveNote", "A rise of 4 m over the 8 m between left and right neighbours is a slope of 0.5: the normal leans 26.6° away from uphill, and slope = 1 − n_y ≈ 0.11, still grass. Make it 16 m over 8 m and the lean passes 63°: rock. Raising the middle sample itself changes nothing, since central differences never read it.")} />

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
        words={tx(t, "oglTerr_splatWords", "Each material gets a weight from a simple rule on height and slope, eased in with smoothstep. Grass takes whatever is left. The final colour is the weighted average of the materials.")}
        note={tx(t, "oglTerr_splatNote", "Blending by weight alone gives soft, muddy transitions. Height blending sharpens them: each material also has a height texture (pebbles stand above sand), and a material wins where weight + height is largest. Stones then poke through sand instead of fading into it.")}>
        {r`\begin{gathered} w_{\text{rock}} = \operatorname{smoothstep}(0.28, 0.45, \text{slope}) \\[4pt] w_{\text{snow}} = \operatorname{smoothstep}(26, 30, y)\,(1 - \ldots) \\[4pt] C = \frac{\sum_k w_k\,C_k}{\sum_k w_k} \end{gathered}`}
      </Equation>
      <LiveFormula label={tx(t, "oglTerr_splatLive", "Try it: the figure's four rules at one point")}
        tex={r`\begin{gathered} w_{\text{sand}} = \operatorname{smoothstep}(1.5, 0, y)\,(1 - \operatorname{smoothstep}(0.2, 0.4, \text{slope})) \\[4pt] w_{\text{grass}} = \max(1 - w_{\text{sand}} - w_{\text{rock}} - w_{\text{snow}},\ 0) \end{gathered}`}
        vars={[
          { id: "y", label: "y (m)", min: -2, max: 35, step: 0.5, value: 28, fmt: v => `${v} m` },
          { id: "slope", label: "slope", min: 0, max: 1, step: 0.01, value: 0.4, fmt: v => v.toFixed(2) },
        ]}
        where={[
          [r`w_{\text{rock}}`, tx(t, "oglTerr_wRock", "smoothstep(0.28, 0.45, slope): steep ground, at any height")],
          [r`w_{\text{snow}}`, tx(t, "oglTerr_wSnow", "smoothstep(26, 30, y)·(1 − smoothstep(0.35, 0.55, slope)): high ground that is not too steep for snow to stay")],
        ]}
        compute={splatNumbers(t)}
        note={tx(t, "oglTerr_splatLiveNote", "The wobble noise is left out here. At y = 28 and slope 0.4 rock and snow overlap and their raw weights add up to more than 1, so the division shares the pixel between them. Lower the slope to 0.2 and rock vanishes: at y = 28 snow and grass split the pixel half and half, and above 30 snow takes it all. Drop y below 1.5 on flat ground and sand appears.")} />
      <Equation label={tx(t, "oglTerr_triLabel", "Triplanar mapping for cliffs")}
        where={[
          [r`C_{yz},\ C_{xz},\ C_{xy}`, tx(t, "oglTerr_wProj", "the material sampled three times, projected along each world axis: texture(uTex, p.yz), texture(uTex, p.xz) and texture(uTex, p.xy)")],
          [r`|n|^k`, tx(t, "oglTerr_wK", "each projection's weight is how much the surface faces that axis, sharpened by the power k (4–8) so the blend zones stay narrow")],
        ]}
        words={tx(t, "oglTerr_triWords", "Project the texture onto the surface from the side, from above and from the front, and mix the three by how squarely the surface faces each direction. Raising the weights to a power keeps one projection in charge almost everywhere.")}
        note={tx(t, "oglTerr_triNote", "Heightmap UVs are just (x, z), which stretches textures down steep slopes into long streaks. Triplanar mapping ignores UVs and projects from whichever side the surface faces. It costs three samples per material, so it is usually applied only to the rock layer.")}>
        {r`C = \frac{|n_x|^k C_{yz} + |n_y|^k C_{xz} + |n_z|^k C_{xy}}{|n_x|^k + |n_y|^k + |n_z|^k}`}
      </Equation>
      <LiveFormula label={tx(t, "oglTerr_triLive", "Try it: a slope turning into a cliff")}
        tex={r`C = \frac{|n_x|^k C_{yz} + |n_y|^k C_{xz} + |n_z|^k C_{xy}}{|n_x|^k + |n_y|^k + |n_z|^k}`}
        vars={[
          { id: "th", label: "θ (°)", min: 0, max: 90, step: 1, value: 35, fmt: v => `${v}°` },
          { id: "k", label: "k", min: 1, max: 8, step: 1, value: 4, fmt: v => String(v) },
        ]}
        where={[
          [r`\theta`, tx(t, "oglTerr_wTh", "how far the normal is tilted from straight up toward +x: 0° flat ground, 90° a vertical cliff facing x")],
        ]}
        compute={triNumbers(t)}
        note={tx(t, "oglTerr_triLiveNote", "At 45° the two projections share equally whatever k is. At 35° with k = 1 the top view still only gets 59%, a wide muddy blend of two stretched images; with k = 4 it gets 81%, and with k = 8 95%. The higher k, the narrower the band where both are visible.")} />

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
