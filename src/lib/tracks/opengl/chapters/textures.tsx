"use client";

// OpenGL track — "Textures".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { TextureFigure } from "@/components/lesson/figures/TextureFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function TexturesContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "ch07_intro",
          "A texture is a 2D image stored in GPU VRAM that your fragment shader can sample per pixel. Vertex data alone gives you solid colors — textures give you detail, surface variety, and photorealism without adding geometry."
        )}
      </p>

      <H2>{tx(t, "ch07_uvTitle", "UV / texture coordinates")}</H2>
      <p>
        {tx(t, "ch07_uvBody",
          "Each vertex carries a pair of floats (U, V) that tell the GPU which part of the texture maps to that vertex. In OpenGL, (0,0) is bottom-left and (1,1) is top-right."
        )}
      </p>
      <CodeBlock lang="cpp" filename="quad_with_uv.cpp" t={t}>{`// position (x,y,z)   +   texcoord (u,v)
float vertices[] = {
    // pos                  UV
    -0.5f,  0.5f, 0.0f,   0.0f, 1.0f,  // top-left
    -0.5f, -0.5f, 0.0f,   0.0f, 0.0f,  // bottom-left
     0.5f, -0.5f, 0.0f,   1.0f, 0.0f,  // bottom-right
     0.5f,  0.5f, 0.0f,   1.0f, 1.0f,  // top-right
};

// stride = 5 floats now (xyz + uv)
int stride = 5 * sizeof(float);

glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, stride, (void*)0);               // position
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, stride, (void*)(3*sizeof(float))); // texcoord
glEnableVertexAttribArray(1);`}</CodeBlock>

      <H2>{tx(t, "ch07_loadTitle", "Loading an image with stb_image")}</H2>
      <p>
        {tx(t, "ch07_loadBody",
          "stb_image.h is the standard single-header image loader for OpenGL projects. Include the implementation once in a .cpp file, then call stbi_load to get raw pixel data."
        )}
      </p>
      <CodeBlock lang="cpp" filename="load_texture.cpp" t={t}>{`#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

// OpenGL's origin is bottom-left; images are stored top-left — flip them
stbi_set_flip_vertically_on_load(true);

int width, height, channels;
unsigned char* data = stbi_load("assets/wall.jpg", &width, &height, &channels, 0);

if (!data) {
    std::cerr << "Failed to load texture: " << stbi_failure_reason() << std::endl;
}`}</CodeBlock>

      <H2>{tx(t, "ch07_createTitle", "Creating the texture object")}</H2>
      <CodeBlock lang="cpp" filename="create_texture.cpp" t={t}>{`unsigned int texture;
glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D, texture);

// Wrapping — what happens when UV goes outside [0, 1]
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);

// Filtering — how to sample between texels
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

// Upload pixel data to GPU
GLenum format = (channels == 4) ? GL_RGBA : GL_RGB;
glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
glGenerateMipmap(GL_TEXTURE_2D);

stbi_image_free(data);  // CPU copy no longer needed`}</CodeBlock>

      <LessonTable
        headers={[
          tx(t, "texWrapHeader0", "Wrap mode"),
          tx(t, "texWrapHeader1", "Behavior"),
        ]}
        rows={[
          ["GL_REPEAT",          tx(t, "texRepeat",  "Tiles the texture. Default and most common.")],
          ["GL_CLAMP_TO_EDGE",   tx(t, "texClamp",   "Stretches the edge pixel. Good for UI sprites.")],
          ["GL_MIRRORED_REPEAT", tx(t, "texMirror",  "Tiles but mirrors every other tile.")],
        ]}
      />

      <p>
        {tx(t, "ch07_texFig",
          "Those parameters are easier to choose once you have seen them. Every pixel in the figure below is computed the way the GPU samples a texture — switch tabs to compare wrap modes, magnification filters and mipmaps."
        )}
      </p>

      <TextureFigure t={t} />

      <H2>{tx(t, "ch07_shaderTitle", "Sampling in the fragment shader")}</H2>
      <CodeBlock lang="glsl" filename="textured.vert" t={t}>{`#version 460 core

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;

out vec2 TexCoord;

void main() {
    gl_Position = vec4(aPos, 1.0);
    TexCoord = aTexCoord;
}`}</CodeBlock>
      <CodeBlock lang="glsl" filename="textured.frag" t={t}>{`#version 460 core

in  vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D uTexture;

void main() {
    FragColor = texture(uTexture, TexCoord);
}`}</CodeBlock>

      <H2>{tx(t, "ch07_bindTitle", "Binding the texture before drawing")}</H2>
      <CodeBlock lang="cpp" filename="render.cpp" t={t}>{`// Bind to texture unit 0 and tell the shader which unit to use
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture);

glUseProgram(shaderProgram);
glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0); // unit 0

glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch07_unitsNote",
          "OpenGL supports at least 16 simultaneous texture units (GL_TEXTURE0 through GL_TEXTURE15). Activate a unit, bind a texture to it, then tell the uniform sampler which unit to read from. This is how you use multiple textures in one draw call."
        )}
      </Callout>

    </article>
  );
}
