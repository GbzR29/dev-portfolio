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
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);   // no MIPMAP here

// stb_image reports 1 (grey), 2 (grey + alpha), 3 (RGB) or 4 (RGBA) channels
const GLenum format   = channels == 1 ? GL_RED : channels == 2 ? GL_RG
                      : channels == 3 ? GL_RGB : GL_RGBA;          // what the bytes contain
const GLenum internal = channels == 1 ? GL_R8  : channels == 2 ? GL_RG8
                      : channels == 3 ? GL_RGB8 : GL_RGBA8;        // how the GPU stores it

// stb_image packs rows tightly; OpenGL assumes each row starts on 4 bytes
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

// Upload pixel data to GPU
glTexImage2D(GL_TEXTURE_2D, 0, internal, width, height, 0, format, GL_UNSIGNED_BYTE, data);
glGenerateMipmap(GL_TEXTURE_2D);   // builds the smaller levels the MIN filter asks for

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
          ["GL_CLAMP_TO_BORDER", tx(t, "texBorder",  "Returns a fixed colour you choose outside [0, 1]. Used for shadow maps, where outside means lit.")],
        ]}
      />

      <CodeBlock lang="cpp" filename="border.cpp" t={t}>{`// GL_CLAMP_TO_BORDER needs the colour it should return
float border[] = { 1.0f, 1.0f, 0.0f, 1.0f };      // yellow, opaque
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, border);`}</CodeBlock>

      <p>
        {tx(t, "ch07_formatBody",
          "glTexImage2D takes two formats that are easy to confuse. The seventh argument, format, describes the bytes you hand over: which channels they contain, in which order. The third, the internal format, says how the GPU should store the texture. A sized internal format such as GL_RGB8 names the exact storage, 8 bits per channel. The unsized GL_RGB leaves the choice to the driver. The two channel counts do not have to match: uploading GL_RGB data into GL_RGBA8 storage fills alpha with 1."
        )}
      </p>

      <Callout type="info" t={t}>
        {tx(t, "ch07_srgbNote",
          "Colour images painted or photographed for a screen are stored gamma-encoded (sRGB). For now GL_RGB8 and GL_RGBA8 are fine. Once lighting enters the picture, colour textures should use GL_SRGB8 / GL_SRGB8_ALPHA8 instead, so the GPU converts them to linear values when sampling. The Gamma Correction chapter explains why, and why normal maps and other data textures must not."
        )}
      </Callout>

      <H2>{tx(t, "ch07_filterTitle", "Filtering, and what the mipmap modes mean")}</H2>
      <p>
        {tx(t, "ch07_filterBody",
          "A sample position almost never lands exactly on a texel centre. GL_NEAREST returns the closest texel, which keeps hard pixel edges (pixel art). GL_LINEAR blends the four nearest texels by distance, which looks smooth. That covers magnification, when one texel spreads over several pixels. Minification, when many texels fall into one pixel, is where mipmaps come in: a chain of copies, each half the size of the previous one, so a distant surface can read a pre-shrunk copy instead of skipping over texels. The mipmap filter names have two parts. The first word is the filter used inside one level, and the word after MIPMAP is how the two nearest levels are combined:"
        )}
      </p>
      <LessonTable
        headers={[
          tx(t, "texFilterHeader0", "GL_TEXTURE_MIN_FILTER"),
          tx(t, "texFilterHeader1", "Inside a level"),
          tx(t, "texFilterHeader2", "Between levels"),
        ]}
        rows={[
          ["GL_NEAREST",                tx(t, "texFNearest",  "closest texel"), tx(t, "texFNoMip",   "no mipmaps used")],
          ["GL_LINEAR",                 tx(t, "texFLinear",   "blend of 4 texels"), tx(t, "texFNoMip", "no mipmaps used")],
          ["GL_NEAREST_MIPMAP_NEAREST", tx(t, "texFNearest",  "closest texel"), tx(t, "texFPick",    "closest level only")],
          ["GL_LINEAR_MIPMAP_NEAREST",  tx(t, "texFLinear",   "blend of 4 texels"), tx(t, "texFPick", "closest level only")],
          ["GL_NEAREST_MIPMAP_LINEAR",  tx(t, "texFNearest",  "closest texel"), tx(t, "texFBlend",   "blend of the 2 closest levels")],
          ["GL_LINEAR_MIPMAP_LINEAR",   tx(t, "texFLinear",   "blend of 4 texels"), tx(t, "texFTrilinear", "blend of the 2 closest levels (trilinear)")],
        ]}
      />

      <p>
        {tx(t, "ch07_texFig",
          "Those parameters are easier to choose once you have seen them. Every pixel in the figure below is computed the way the GPU samples a texture — switch tabs to compare wrap modes, magnification filters and mipmaps."
        )}
      </p>

      <TextureFigure t={t} />

      <H2>{tx(t, "ch07_trapsTitle", "Three traps: black, rejected and skewed textures")}</H2>
      <ul className="space-y-3 ml-4 list-disc">
        <li>
          {tx(t, "ch07_trapMips",
            "A black texture usually means a missing mipmap chain. The default GL_TEXTURE_MIN_FILTER is GL_NEAREST_MIPMAP_LINEAR, which reads mip levels. If only level 0 exists, the texture is incomplete, and sampling an incomplete texture returns black (0, 0, 0, 1), with no error. Either call glGenerateMipmap after the upload, or set the MIN filter to GL_NEAREST or GL_LINEAR."
          )}
        </li>
        <li>
          {tx(t, "ch07_trapMag",
            "Mipmaps only exist for minification. GL_TEXTURE_MAG_FILTER accepts GL_NEAREST or GL_LINEAR, nothing else. Passing a mipmap mode there raises GL_INVALID_ENUM, and the call is ignored, so the filter silently stays at its default."
          )}
        </li>
        <li>
          {tx(t, "ch07_trapAlign",
            "A diagonally skewed image with shifted colours comes from row alignment. By default OpenGL assumes every row of your data starts at a multiple of 4 bytes (GL_UNPACK_ALIGNMENT = 4). A 101-pixel-wide RGB image has rows of 101 × 3 = 303 bytes, but OpenGL expects 304. It skips one byte at the end of each row, so every row starts one byte further off than the last. RGBA rows are always a multiple of 4, which is why the bug only appears with RGB or single-channel images whose width is not a multiple of 4. glPixelStorei(GL_UNPACK_ALIGNMENT, 1) says rows are packed tightly, which is how stb_image delivers them."
          )}
        </li>
      </ul>

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
          "A texture unit is a numbered slot a texture is bound to. The fragment shader can use at least 16 of them (GL_MAX_TEXTURE_IMAGE_UNITS). The enums are consecutive, so unit i is GL_TEXTURE0 + i. Activate a unit, bind a texture to it, then set the sampler uniform to that unit's number — the plain integer i, not the enum. This is how you use multiple textures in one draw call."
        )}
      </Callout>

      <H2>{tx(t, "ch07_twoTitle", "Two textures in one draw")}</H2>
      <p>
        {tx(t, "ch07_twoBody",
          "Each sampler uniform reads from one unit, so two textures need two units. The shader below lays a decal with transparent areas over a wall. GLSL's mix(a, b, t) returns a·(1 − t) + b·t: t = 0 gives a, t = 1 gives b, anything between blends them. Using the decal's alpha as t makes its transparent texels show the wall, and uMix scales the whole decal from invisible (0) to fully applied (1)."
        )}
      </p>
      <CodeBlock lang="glsl" filename="two_textures.frag" t={t}>{`#version 460 core
in  vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D uWall;     // reads unit 0
uniform sampler2D uDecal;    // reads unit 1
uniform float     uMix;      // 0 = wall only, 1 = decal fully applied

void main() {
    vec4 wall  = texture(uWall,  TexCoord);
    vec4 decal = texture(uDecal, TexCoord);
    FragColor  = mix(wall, decal, decal.a * uMix);
}`}</CodeBlock>
      <CodeBlock lang="cpp" filename="two_textures.cpp" t={t}>{`glUseProgram(shaderProgram);
glUniform1i(glGetUniformLocation(shaderProgram, "uWall"),  0);   // sampler → unit 0
glUniform1i(glGetUniformLocation(shaderProgram, "uDecal"), 1);   // sampler → unit 1
glUniform1f(glGetUniformLocation(shaderProgram, "uMix"),   0.8f);

// Every frame, before drawing
glActiveTexture(GL_TEXTURE0); glBindTexture(GL_TEXTURE_2D, wallTex);
glActiveTexture(GL_TEXTURE1); glBindTexture(GL_TEXTURE_2D, decalTex);
glBindVertexArray(VAO);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "ch07_twoWarn",
          "The sampler values are program state and only need setting once. The unit bindings are global state: the next draw that binds another texture to unit 1 replaces the decal for everyone. Two samplers of different types, such as a sampler2D and a samplerCube, must never point at the same unit, or the draw fails with GL_INVALID_OPERATION."
        )}
      </Callout>

    </article>
  );
}
