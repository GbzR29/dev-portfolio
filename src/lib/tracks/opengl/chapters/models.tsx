// src/lib/tracks/opengl/chapters/models.tsx
"use client";

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── Model Loading with Assimp ────────────────────────────────────────────────

export function ModelLoadingContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "oglModel_intro",
          "Every vertex array so far has been typed by hand. Real assets come out of Blender or Maya as OBJ, FBX or glTF, and writing a parser for each is not a good use of your time. Assimp reads about forty formats and hands them all back through one uniform data structure, which is the only reason anyone tolerates the FBX format."
        )}
      </p>

      <H2>{tx(t, "oglModel_structTitle", "How Assimp structures a file")}</H2>
      <p>
        {tx(t, "oglModel_structBody",
          "An aiScene is the root. It owns a flat array of meshes and a flat array of materials, plus a tree of nodes. Each node carries a transform and a list of indices into the mesh array — so a mesh is stored once and can be instanced by several nodes. You walk the tree to preserve the hierarchy the artist built."
        )}
      </p>

      <LessonTable
        headers={[tx(t, "oglModel_h0", "Assimp type"), tx(t, "oglModel_h1", "Holds")]}
        rows={[
          ["aiScene",    tx(t, "oglModel_s1", "The root. mMeshes, mMaterials, and mRootNode.")],
          ["aiNode",     tx(t, "oglModel_s2", "A transform, indices into mMeshes, and child nodes.")],
          ["aiMesh",     tx(t, "oglModel_s3", "Positions, normals, up to 8 UV sets, tangents, faces, one material index.")],
          ["aiFace",     tx(t, "oglModel_s4", "One primitive's indices. With aiProcess_Triangulate, always three.")],
          ["aiMaterial", tx(t, "oglModel_s5", "Texture paths per semantic type, plus scalar properties.")],
        ]}
      />

      <H2>{tx(t, "oglModel_importTitle", "Importing")}</H2>
      <CodeBlock lang="cpp" filename="load.cpp" t={t}>{`#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>

Assimp::Importer importer;
const aiScene* scene = importer.ReadFile(path,
      aiProcess_Triangulate            // quads and n-gons become triangles
    | aiProcess_FlipUVs                // OBJ/FBX origin is top-left, OpenGL's is bottom-left
    | aiProcess_CalcTangentSpace       // needed for normal mapping
    | aiProcess_GenSmoothNormals       // only if the file has none
    | aiProcess_JoinIdenticalVertices  // real indexing instead of duplicates
    | aiProcess_ImproveCacheLocality); // reorders indices for the GPU vertex cache

if (!scene || (scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE) || !scene->mRootNode) {
    std::cerr << "Assimp: " << importer.GetErrorString() << std::endl;
    return;
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglModel_lifetimeWarn",
          "The aiScene is owned by the Importer. When the Importer goes out of scope the entire scene is freed, including every pointer you kept into it. Copy what you need into your own structures before the Importer dies — this is the single most common Assimp crash."
        )}
      </Callout>

      <Callout type="tip" t={t}>
        {tx(t, "oglModel_flipTip",
          "If your textures come out upside down, aiProcess_FlipUVs is the switch. If you also called stbi_set_flip_vertically_on_load(true), you have flipped twice and are back where you started — pick exactly one."
        )}
      </Callout>

      <H2>{tx(t, "oglModel_meshTitle", "A Mesh that owns its GPU buffers")}</H2>
      <CodeBlock lang="cpp" filename="Mesh.hpp" t={t}>{`struct Vertex {
    glm::vec3 position;
    glm::vec3 normal;
    glm::vec2 texCoord;
    glm::vec3 tangent;
};

struct Texture {
    unsigned int id;
    std::string  type;   // "texture_diffuse", "texture_specular", ...
    std::string  path;   // used to deduplicate across meshes
};

class Mesh {
public:
    Mesh(std::vector<Vertex> v, std::vector<unsigned int> i, std::vector<Texture> tex)
        : vertices(std::move(v)), indices(std::move(i)), textures(std::move(tex)) {
        setup();
    }

    void draw(Shader& shader) const {
        unsigned diffuseN = 1, specularN = 1;
        for (unsigned i = 0; i < textures.size(); ++i) {
            glActiveTexture(GL_TEXTURE0 + i);
            const std::string number =
                textures[i].type == "texture_diffuse"  ? std::to_string(diffuseN++)
                                                       : std::to_string(specularN++);
            shader.setInt(textures[i].type + number, (int)i);
            glBindTexture(GL_TEXTURE_2D, textures[i].id);
        }
        glBindVertexArray(VAO);
        glDrawElements(GL_TRIANGLES, (GLsizei)indices.size(), GL_UNSIGNED_INT, nullptr);
        glBindVertexArray(0);
        glActiveTexture(GL_TEXTURE0);
    }

private:
    std::vector<Vertex>       vertices;
    std::vector<unsigned int> indices;
    std::vector<Texture>      textures;
    unsigned int VAO = 0, VBO = 0, EBO = 0;

    void setup() {
        glGenVertexArrays(1, &VAO);
        glGenBuffers(1, &VBO);
        glGenBuffers(1, &EBO);

        glBindVertexArray(VAO);
        glBindBuffer(GL_ARRAY_BUFFER, VBO);
        // A vector of a plain struct is contiguous — upload it directly
        glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex),
                     vertices.data(), GL_STATIC_DRAW);

        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int),
                     indices.data(), GL_STATIC_DRAW);

        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                              (void*)offsetof(Vertex, position));
        glEnableVertexAttribArray(1);
        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                              (void*)offsetof(Vertex, normal));
        glEnableVertexAttribArray(2);
        glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                              (void*)offsetof(Vertex, texCoord));
        glEnableVertexAttribArray(3);
        glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex),
                              (void*)offsetof(Vertex, tangent));

        glBindVertexArray(0);
    }
};`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "oglModel_offsetofNote",
          "offsetof plus sizeof(Vertex) as the stride is the whole trick behind interleaved attributes: you describe the struct layout to OpenGL once and never compute a byte offset by hand. Add a field to Vertex and every offset updates itself."
        )}
      </Callout>

      <H2>{tx(t, "oglModel_walkTitle", "Walking the node tree")}</H2>
      <CodeBlock lang="cpp" filename="Model.cpp" t={t}>{`void Model::processNode(aiNode* node, const aiScene* scene) {
    for (unsigned i = 0; i < node->mNumMeshes; ++i)
        meshes.push_back(processMesh(scene->mMeshes[node->mMeshes[i]], scene));

    for (unsigned i = 0; i < node->mNumChildren; ++i)
        processNode(node->mChildren[i], scene);   // depth first
}

Mesh Model::processMesh(aiMesh* mesh, const aiScene* scene) {
    std::vector<Vertex> vertices;
    vertices.reserve(mesh->mNumVertices);

    for (unsigned i = 0; i < mesh->mNumVertices; ++i) {
        Vertex v{};
        v.position = {mesh->mVertices[i].x, mesh->mVertices[i].y, mesh->mVertices[i].z};
        if (mesh->HasNormals())
            v.normal = {mesh->mNormals[i].x, mesh->mNormals[i].y, mesh->mNormals[i].z};
        if (mesh->mTextureCoords[0])          // channel 0 may be null
            v.texCoord = {mesh->mTextureCoords[0][i].x, mesh->mTextureCoords[0][i].y};
        if (mesh->HasTangentsAndBitangents())
            v.tangent = {mesh->mTangents[i].x, mesh->mTangents[i].y, mesh->mTangents[i].z};
        vertices.push_back(v);
    }

    std::vector<unsigned int> indices;
    indices.reserve(mesh->mNumFaces * 3);
    for (unsigned i = 0; i < mesh->mNumFaces; ++i) {
        const aiFace& face = mesh->mFaces[i];
        for (unsigned j = 0; j < face.mNumIndices; ++j)
            indices.push_back(face.mIndices[j]);
    }

    aiMaterial* mat = scene->mMaterials[mesh->mMaterialIndex];
    std::vector<Texture> textures;
    appendTextures(mat, aiTextureType_DIFFUSE,  "texture_diffuse",  textures);
    appendTextures(mat, aiTextureType_SPECULAR, "texture_specular", textures);
    appendTextures(mat, aiTextureType_NORMALS,  "texture_normal",   textures);

    return Mesh{std::move(vertices), std::move(indices), std::move(textures)};
}`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "oglModel_nullWarn",
          "Guard every optional channel. mTextureCoords[0] is null on a model with no UVs, mNormals is null when the exporter omitted them, and tangents only exist if you asked for aiProcess_CalcTangentSpace. Dereferencing them unconditionally works on the model you tested with and crashes on the next one."
        )}
      </Callout>

      <H2>{tx(t, "oglModel_cacheTitle", "Caching textures")}</H2>
      <p>
        {tx(t, "oglModel_cacheBody",
          "A model with thirty meshes often shares one atlas across all of them. Without a cache you decode and upload the same PNG thirty times, which turns a fast load into a slow one and wastes thirty times the VRAM. Key the cache on the file path."
        )}
      </p>

      <CodeBlock lang="cpp" filename="texture_cache.cpp" t={t}>{`std::unordered_map<std::string, Texture> loadedTextures;   // member of Model

void Model::appendTextures(aiMaterial* mat, aiTextureType type,
                           const std::string& name, std::vector<Texture>& out) {
    for (unsigned i = 0; i < mat->GetTextureCount(type); ++i) {
        aiString str;
        mat->GetTexture(type, i, &str);
        const std::string file = str.C_Str();

        if (auto it = loadedTextures.find(file); it != loadedTextures.end()) {
            out.push_back(it->second);            // already on the GPU
            continue;
        }
        Texture tex{textureFromFile(directory + "/" + file), name, file};
        loadedTextures.emplace(file, tex);
        out.push_back(tex);
    }
}`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "oglModel_formatTip",
          "Prefer glTF 2.0 for new work. It is the only mainstream format with a precise specification, it stores PBR material parameters natively, and its binary variant loads without any text parsing. OBJ has no skeleton and no PBR; FBX is proprietary and every exporter disagrees about units and axis orientation."
        )}
      </Callout>

    </article>
  );
}
