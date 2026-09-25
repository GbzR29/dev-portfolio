"use client";

// "Skeletal Animation" (Advanced Techniques): bones, bind pose, skinning (LBS and DQS), keyframes, Assimp, blending and IK.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation, Tex } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "./lighting-advanced";
import { SkinningArmFigure } from "@/components/lesson/figures/tech/SkinningArmFigure";
import { SkinnedTubeFigure } from "@/components/lesson/figures/tech/SkinnedTubeFigure";

const r = String.raw;

export function SkeletalContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "oglSkel_intro",
          "A character mesh has tens of thousands of vertices. Animating each one by hand, frame by frame, would be impossible to author and far too much data to store. Instead the mesh gets a skeleton of a few dozen bones. Animators pose the bones, and every vertex follows the bones it is attached to. This is skinning, and nearly every animated character in every game works this way.")}
      </Lead>

      <H2>{tx(t, "oglSkel_hierTitle", "The skeleton is a hierarchy of transforms")}</H2>
      <p>
        {tx(t, "oglSkel_hierBody",
          "Each bone stores its transform relative to its parent: the forearm's rotation is \"how the forearm is bent relative to the upper arm\", not relative to the world. To know where a bone actually is, multiply down the chain from the root. Rotating the shoulder then carries the whole arm with it, which is exactly what we want. Rotating only the elbow moves the forearm and hand but leaves the upper arm alone.")}
      </p>
      <Equation label={tx(t, "oglSkel_globalLabel", "Local and global (model-space) bone transforms")}
        where={[
          [r`L_i`, tx(t, "oglSkel_wL", "bone i's local transform relative to its parent: translation · rotation · scale, animated")],
          [r`G_i`, tx(t, "oglSkel_wG", "bone i's global transform: from bone space to the model's space")],
          [r`p(i)`, tx(t, "oglSkel_wP", "the parent of bone i; the root has no parent")],
        ]}
        note={tx(t, "oglSkel_globalNote", "Because of this recursion, bones must be processed parents-first. Storing the skeleton as a flat array sorted so that every parent comes before its children makes the whole update one simple loop.")}>
        {r`L_i = T_i\,R_i\,S_i \qquad G_{\text{root}} = L_{\text{root}} \qquad G_i = G_{p(i)}\,L_i`}
      </Equation>

      <H2>{tx(t, "oglSkel_bindTitle", "The bind pose and the inverse bind matrix")}</H2>
      <p>
        {tx(t, "oglSkel_bindBody",
          "The mesh is modelled in one particular pose, usually a T-pose or A-pose, called the bind pose. The vertex positions in the file are in model space, in that pose. To make a vertex follow a bone, we need its position relative to that bone as it was at bind time: \"the elbow vertex is 5 cm below the forearm bone's origin\". Multiplying by the inverse of the bone's bind-pose global transform gives exactly that. Multiplying by the bone's current global transform then carries the vertex to where the bone is now.")}
      </p>
      <Equation label={tx(t, "oglSkel_skinMatLabel", "The skinning matrix of a bone")}
        where={[
          [r`B_i`, tx(t, "oglSkel_wB", "bone i's global transform in the bind pose, fixed forever (Assimp: the inverse is stored as aiBone::mOffsetMatrix)")],
          [r`G_i(t)`, tx(t, "oglSkel_wGt", "bone i's global transform in the current animated pose")],
          [r`K_i`, tx(t, "oglSkel_wK", "the skinning matrix sent to the shader")],
        ]}
        note={tx(t, "oglSkel_skinMatNote", "Read it right to left: B⁻¹ takes a bind-pose model-space position into bone i's local space; G(t) takes it back out to model space with the bone where it is now. In the bind pose G = B, so K = identity and the mesh looks exactly as modelled, which is a great first test.")}>
        {r`K_i(t) = G_i(t)\,B_i^{-1}`}
      </Equation>

      <H2>{tx(t, "oglSkel_lbsTitle", "Weights and linear blend skinning")}</H2>
      <p>
        {tx(t, "oglSkel_lbsBody",
          "A vertex in the middle of the forearm follows only the forearm. A vertex at the elbow should partly follow both bones, or the skin would tear. So every vertex stores a few bone indices, almost always at most 4, and a weight for each. The weights are painted by an artist and sum to 1. Linear blend skinning (LBS) moves the vertex with each of its bones and averages the results by weight:")}
      </p>
      <Equation label={tx(t, "oglSkel_lbsLabel", "Linear blend skinning")}
        where={[
          [r`v,\ \mathbf n`, tx(t, "oglSkel_wV", "the vertex position (w = 1) and normal (w = 0) in the bind pose")],
          [r`b_j,\ w_j`, tx(t, "oglSkel_wBW", "the vertex's bone indices and weights, j = 0..3, with Σ wⱼ = 1")],
        ]}
        note={tx(t, "oglSkel_lbsNote", "Because matrix multiplication is linear, averaging the transformed positions equals transforming by the averaged matrix. The shader builds one blended 4×4 matrix per vertex and multiplies once. For normals, the blended matrix's upper 3×3 is used and the result renormalised. Strictly it should be the inverse-transpose, but skinning matrices are close to rotations.")}>
        {r`v' = \sum_{j=0}^{3} w_j\,K_{b_j}\,v = \Big(\sum_{j=0}^{3} w_j\,K_{b_j}\Big)\,v \qquad \mathbf n' = \operatorname{normalize}\Big(\sum_j w_j\,K_{b_j}\,\mathbf n\Big)`}
      </Equation>
      <SkinningArmFigure t={t} />

      <H3>{tx(t, "oglSkel_dataTitle", "Vertex data and the shader")}</H3>
      <CodeBlock lang="cpp" filename="skinned_vertex.cpp" t={t}>{`struct SkinnedVertex {
    glm::vec3  position;
    glm::vec3  normal;
    glm::vec2  uv;
    glm::ivec4 boneIds;    // up to 4 influences; unused slots point at bone 0…
    glm::vec4  weights;    // …with weight 0. Sum of weights = 1
};

// Integer attributes need the *I* variant, or the ints are converted to floats
// (and 3 becomes 4.2e-45 when reinterpreted). This is the #1 skinning bug.
glVertexAttribIPointer(3, 4, GL_INT, sizeof(SkinnedVertex), (void*)offsetof(SkinnedVertex, boneIds));
glVertexAttribPointer (4, 4, GL_FLOAT, GL_FALSE, sizeof(SkinnedVertex), (void*)offsetof(SkinnedVertex, weights));`}</CodeBlock>
      <CodeBlock lang="glsl" filename="skinned.vert" t={t}>{`#version 460 core
layout (location = 0) in vec3  aPos;
layout (location = 1) in vec3  aNormal;
layout (location = 2) in vec2  aUV;
layout (location = 3) in ivec4 aBoneIds;
layout (location = 4) in vec4  aWeights;

const int MAX_BONES = 128;
uniform mat4 uBones[MAX_BONES];          // K_i = G_i · B_i⁻¹, uploaded every frame
uniform mat4 uModel, uView, uProjection;
out vec3 vNormal; out vec2 vUV;

void main() {
    mat4 skin = aWeights.x * uBones[aBoneIds.x]
              + aWeights.y * uBones[aBoneIds.y]
              + aWeights.z * uBones[aBoneIds.z]
              + aWeights.w * uBones[aBoneIds.w];
    vec4 pos = skin * vec4(aPos, 1.0);             // bind pose → animated pose (model space)
    vNormal  = mat3(uModel) * normalize(mat3(skin) * aNormal);
    vUV      = aUV;
    gl_Position = uProjection * uView * uModel * pos;
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "oglSkel_limitNote",
          "128 mat4 uniforms use 8 KB, near the limit of the default uniform block on some drivers (GL_MAX_VERTEX_UNIFORM_COMPONENTS). Bigger skeletons, and crowds of many characters, put the matrices in a UBO, an SSBO or a texture instead. With an SSBO, every character's bones live in one buffer and each instance reads its own range.")}
      </Callout>

      <H2>{tx(t, "oglSkel_keysTitle", "Keyframes: where the pose comes from")}</H2>
      <p>
        {tx(t, "oglSkel_keysBody",
          "An animation clip stores, for each bone, three tracks of keyframes: position, rotation and scale, each a list of (time, value) pairs. To pose the skeleton at time t, each track finds the two keys around t and interpolates between them. Positions and scales are interpolated linearly. Rotations are stored as quaternions and interpolated along the sphere of rotations with slerp:")}
      </p>
      <Equation label={tx(t, "oglSkel_sampleLabel", "Sampling a track at time t")}
        where={[
          [r`(t_k, x_k)`, tx(t, "oglSkel_wKey", "the key at or before t; (t_{k+1}, x_{k+1}) the one after")],
          [r`u`, tx(t, "oglSkel_wU", "how far between the two keys we are, in [0, 1]")],
          [r`\theta`, tx(t, "oglSkel_wTheta", "the angle between the two quaternions, cos θ = q₀·q₁ (4D dot product)")],
        ]}
        note={tx(t, "oglSkel_sampleNote", "q and −q represent the same rotation. If q₀·q₁ < 0, negate q₁ first, or slerp takes the long way round and the bone spins 340° instead of 20°. Lerping matrices or Euler angles instead gives shearing, shrinking or gimbal-locked flips. Quaternions are why none of that happens.")}>
        {r`u = \frac{t - t_k}{t_{k+1} - t_k} \qquad \mathbf p = \operatorname{mix}(\mathbf p_k, \mathbf p_{k+1}, u) \qquad \operatorname{slerp}(q_0, q_1, u) = \frac{\sin((1-u)\theta)}{\sin\theta}\,q_0 + \frac{\sin(u\theta)}{\sin\theta}\,q_1`}
      </Equation>

      <H3>{tx(t, "oglSkel_assimpTitle", "Loading it with Assimp")}</H3>
      <LessonTable
        headers={[tx(t, "oglSkel_thAssimp", "Assimp structure"), tx(t, "oglSkel_thHolds", "Holds"), tx(t, "oglSkel_thUse", "Use it for")]}
        rows={[
          ["aiMesh::mBones[i]", tx(t, "oglSkel_a1", "the bone's name, mOffsetMatrix = B⁻¹, and mWeights (vertexId, weight) pairs"), tx(t, "oglSkel_a1u", "fill boneIds/weights per vertex; keep the 4 largest and renormalise")],
          ["aiNode tree", tx(t, "oglSkel_a2", "the hierarchy; each node's mTransformation is its rest local transform"), tx(t, "oglSkel_a2u", "parents for G = G_parent · L; nodes without animation keep this L")],
          ["aiAnimation::mChannels", tx(t, "oglSkel_a3", "one aiNodeAnim per animated node: position, rotation (aiQuaternion) and scaling keys"), tx(t, "oglSkel_a3u", "sample at t to get L_i(t)")],
          ["mTicksPerSecond, mDuration", tx(t, "oglSkel_a4", "key times are in ticks, not seconds (0 means \"unspecified\": use 25)"), tx(t, "oglSkel_a4u", "t_ticks = fmod(seconds · ticksPerSecond, duration)")],
          ["mRootNode->mTransformation", tx(t, "oglSkel_a5", "the scene's root transform"), tx(t, "oglSkel_a5u", "its inverse is often premultiplied into every K, so the mesh isn't moved twice")],
        ]}
      />
      <CodeBlock lang="cpp" filename="animator.cpp" t={t}>{`// Parents-first recursive update: G = G_parent · L,  K = G · B⁻¹
void Animator::update(const aiNode* node, const glm::mat4& parentGlobal, float ticks) {
    glm::mat4 local = toGlm(node->mTransformation);          // rest pose (Assimp is row-major: transpose!)
    if (const Channel* ch = clip.find(node->mName.C_Str()))
        local = glm::translate(glm::mat4(1), ch->samplePosition(ticks))
              * glm::mat4_cast(ch->sampleRotation(ticks))    // slerp between the two nearest keys
              * glm::scale(glm::mat4(1), ch->sampleScale(ticks));

    glm::mat4 global = parentGlobal * local;
    if (auto it = boneIndex.find(node->mName.C_Str()); it != boneIndex.end())
        skinning[it->second] = globalInverse * global * inverseBind[it->second];

    for (unsigned c = 0; c < node->mNumChildren; ++c)
        update(node->mChildren[c], global, ticks);
}`}</CodeBlock>

      <H2>{tx(t, "oglSkel_dqsTitle", "The candy wrapper, and dual quaternion skinning")}</H2>
      <p>
        {tx(t, "oglSkel_dqsBody",
          "LBS averages matrices, and an average of rotation matrices is not a rotation. For small angles the difference is invisible. When two bones differ by a large twist, as with a forearm rotating the wrist or a shoulder raising the arm, the blended matrix shrinks everything perpendicular to the axis, and the joint pinches into what artists call the \"candy wrapper\". Dual quaternion skinning (Kavan et al., 2007) blends the rigid motions themselves:")}
      </p>
      <Equation label={tx(t, "oglSkel_dqLabel", "Dual quaternion skinning")}
        where={[
          [r`\hat q = q_r + \varepsilon\,q_d`, tx(t, "oglSkel_wDq", "a unit dual quaternion: real part q_r is the rotation, dual part q_d = ½·t·q_r encodes the translation t (ε² = 0)")],
          [r`w_j`, tx(t, "oglSkel_wWj", "the same bone weights as LBS")],
        ]}
        note={tx(t, "oglSkel_dqNote", "Blend linearly, then divide by the length of the real part: the result is again a rigid transform (a rotation plus translation, a screw motion), so it cannot shrink the skin. Align signs with the first bone before summing, since q and −q are the same rotation. The cost is a few more ALU ops per vertex. Plain DQS cannot represent scale, so engines use LBS for scaled bones or a hybrid.")}>
        {r`\hat b = \frac{\sum_j w_j\,\hat q_{b_j}}{\big\lVert \sum_j w_j\,q_{r,b_j} \big\rVert} \qquad v' = q_r\,v\,q_r^{*} + 2\,\big(q_d\,q_r^{*}\big)_{xyz}`}
      </Equation>
      <SkinnedTubeFigure t={t} />
      <CodeBlock lang="glsl" filename="dqs.vert" t={t}>{`uniform vec4 uReal[MAX_BONES], uDual[MAX_BONES];   // one dual quaternion per bone

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

void main() {
    vec4 r0 = uReal[aBoneIds.x], r = vec4(0.0), d = vec4(0.0);
    for (int k = 0; k < 4; ++k) {
        float w = aWeights[k] * sign(dot(uReal[aBoneIds[k]], r0));   // same hemisphere
        r += w * uReal[aBoneIds[k]];
        d += w * uDual[aBoneIds[k]];
    }
    float len = length(r);
    r /= len;  d /= len;
    vec3 pos = qrot(r, aPos) + 2.0 * (r.w * d.xyz - d.w * r.xyz + cross(r.xyz, d.xyz));
    vec3 nrm = qrot(r, aNormal);
    // … project as usual
}`}</CodeBlock>

      <H2>{tx(t, "oglSkel_blendTitle", "Combining animations")}</H2>
      <LessonTable
        headers={[tx(t, "oglSkel_thTech", "Technique"), tx(t, "oglSkel_thHow", "How"), tx(t, "oglSkel_thFor", "For")]}
        rows={[
          [tx(t, "oglSkel_b1", "Cross-fade"), tx(t, "oglSkel_b1h", "sample both clips; per bone, lerp positions and slerp rotations by a weight going 0 → 1 over ~0.2 s"), tx(t, "oglSkel_b1f", "switching walk → run without a pop")],
          [tx(t, "oglSkel_b2", "Blend spaces"), tx(t, "oglSkel_b2h", "clips placed on a 1D/2D grid (speed, direction); blend the nearest ones with barycentric weights"), tx(t, "oglSkel_b2f", "smooth locomotion at any speed and angle")],
          [tx(t, "oglSkel_b3", "Layering / masks"), tx(t, "oglSkel_b3h", "a per-bone weight mask: upper body from one clip, legs from another"), tx(t, "oglSkel_b3f", "shooting while running")],
          [tx(t, "oglSkel_b4", "Additive"), tx(t, "oglSkel_b4h", "store a clip as a difference from a reference pose, add it on top of any base"), tx(t, "oglSkel_b4f", "breathing, flinches, aim offsets")],
          [tx(t, "oglSkel_b5", "Inverse kinematics"), tx(t, "oglSkel_b5h", "solve joint angles so an end bone reaches a target"), tx(t, "oglSkel_b5f", "feet on uneven ground, hands on a door handle")],
        ]}
      />
      <Equation label={tx(t, "oglSkel_ikLabel", "Two-bone IK (arm or leg), by the law of cosines")}
        where={[
          [r`a,\ b`, tx(t, "oglSkel_wAB", "lengths of the upper and lower bone")],
          [r`d`, tx(t, "oglSkel_wD", "distance from the root joint (shoulder, hip) to the target, clamped to ≤ a + b")],
          [r`\beta`, tx(t, "oglSkel_wBeta", "the elbow/knee's interior angle; α the root's angle away from the root→target line")],
        ]}
        note={tx(t, "oglSkel_ikNote", "Rotate the root bone toward the target, then by α inside the plane chosen by a \"pole\" vector (where the knee should point), and set the middle joint to π − β. It is exact and cheap, so games run it every frame on every foot.")}>
        {r`\cos\beta = \frac{a^2 + b^2 - d^2}{2ab} \qquad \cos\alpha = \frac{a^2 + d^2 - b^2}{2ad}`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "oglSkel_pitfalls",
          "The usual failures, in order of frequency: bone ids uploaded with glVertexAttribPointer instead of glVertexAttribIPointer; Assimp's row-major matrices not transposed for GLM; weights that don't sum to 1 (the mesh grows or shrinks); vertices with more than 4 influences where the extras were dropped without renormalising; the root node transform applied twice; interpolating rotation keys without the q₀·q₁ < 0 sign flip. Debug by rendering the bind pose (every K = identity) and by colouring vertices by their first bone id.")}
      </Callout>
      <p>
        {tx(t, "oglSkel_perfNote", "Every pass that draws the character (shadow maps, depth pre-pass, main pass) skins its vertices again. Engines with many passes skin once per frame in a compute shader into a buffer and draw that. Crowds of thousands bake animations into textures (\"vertex animation textures\") and play them back with no skeleton at all, since each frame of each vertex is just a texel ")}
        <Tex>{r`(\text{vertexId},\ \text{frame})`}</Tex>.
      </p>

      <KeyIdeas t={t} id="oglSkel" items={[
        "Bones form a hierarchy: G_i = G_parent · L_i, processed parents-first.",
        "Skinning matrix K_i = G_i(t) · B_i⁻¹: bind-pose model space → bone space → animated model space.",
        "LBS: v' = Σ wⱼ K_bⱼ v with ≤ 4 weights summing to 1; ids need glVertexAttribIPointer.",
        "Keyframes: lerp positions and scales, slerp rotations (flip the sign when q₀·q₁ < 0).",
        "LBS pinches joints under large twists (candy wrapper); dual quaternion skinning blends rigid motions and keeps volume.",
        "Cross-fades, layers, additive clips and two-bone IK combine animations at runtime.",
      ]} />
    </Article>
  );
}
