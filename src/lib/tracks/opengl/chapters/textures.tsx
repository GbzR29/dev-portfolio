"use client";

// OpenGL track — "Textures": what this chapter adds to main.cpp; UV
// coordinates and the vertex change (colour → uv); getting stb_image into the
// CMake project and finding the image file (ASSET_DIR); stbi_load and
// glTexImage2D argument by argument; wrap modes, formats, filtering and
// mipmaps (figure); three traps; the textured shaders; texture units; the
// loadTexture helper and the code-along checkpoint (the whole main.cpp so
// far); two textures in one draw.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { TextureFigure } from "@/components/lesson/figures/TextureFigure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";

export function TexturesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "ch07_intro",
          "A texture is a 2D image stored in GPU VRAM that your fragment shader can sample per pixel. Vertex data alone gives you solid colors — textures give you detail, surface variety, and photorealism without adding geometry."
        )}
      </Lead>

      <Goals t={t} id="ch07" items={[
        "Map an image onto a shape with texture coordinates.",
        "Load an image with stb_image and create a texture from it.",
        "Choose the filtering and mipmap modes.",
        "Avoid black, rejected and skewed textures.",
      ]} />

      <H2>{tx(t, "ch07_alongTitle", "What this chapter adds to main.cpp")}</H2>
      <p>
        {tx(t, "ch07_alongBody",
          "This chapter puts an image on the coloured square from the Indexed Drawing chapter. Five things change in your main.cpp, and the checkpoint at the end shows the whole file:")}
      </p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>{tx(t, "ch07_along1", "a new library, stb_image, to read image files, and an image to read;")}</li>
        <li>{tx(t, "ch07_along2", "each vertex carries a texture coordinate (u, v) instead of a colour;")}</li>
        <li>{tx(t, "ch07_along3", "the shaders pass the coordinate along and read the texture with it;")}</li>
        <li>{tx(t, "ch07_along4", "step 4 creates the texture on the GPU, through a loadTexture helper;")}</li>
        <li>{tx(t, "ch07_along5", "the render loop binds the texture before drawing.")}</li>
      </ol>

      <H2>{tx(t, "ch07_uvTitle", "UV / texture coordinates")}</H2>
      <p>
        {tx(t, "ch07_uvBody",
          "Each vertex carries a pair of floats (U, V) that tell the GPU which part of the texture maps to that vertex. In OpenGL, (0,0) is bottom-left and (1,1) is top-right."
        )}
      </p>
      <p>
        {tx(t, "ch07_uvInterp",
          "Between the vertices, the rasterizer interpolates (u, v) like any other output, exactly as it blended the colours. A fragment in the middle of the square gets (0.5, 0.5), the middle of the image.")}
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
      <Callout type="info" t={t}>
        {tx(t, "ch07_changeNote", "Changed since the Indexed Drawing chapter: each vertex was x y z r g b (6 floats, 24 bytes). Now it is x y z u v (5 floats, 20 bytes). So the stride becomes 5 * sizeof(float), and attribute 1 now has 2 components instead of 3. It still starts at byte 12, right after the position. The corners are the same four in the same order, so the index list does not change.")}
      </Callout>

      <H2>{tx(t, "ch07_loadTitle", "Loading an image with stb_image")}</H2>
      <p>
        {tx(t, "ch07_loadBody",
          "stb_image.h is the standard single-header image loader for OpenGL projects. Include the implementation once in a .cpp file, then call stbi_load to get raw pixel data."
        )}
      </p>
      <H3>{tx(t, "ch07_stbTitle", "Adding stb_image to the project")}</H3>
      <p>
        {tx(t, "ch07_stbGet",
          "Download stb_image.h from github.com/nothings/stb. It is one file and needs no building of its own. Put it in include/, next to the glad/ and KHR/ folders from the Window & Context chapter.")}
      </p>
      <p>
        {tx(t, "ch07_stbImpl",
          "A single-header library holds both the declarations and the code. By default, including it gives you only the declarations. The code is compiled where STB_IMAGE_IMPLEMENTATION is defined before the include, and that must happen in exactly one .cpp file. The cleanest place is a tiny file of its own:")}
      </p>
      <CodeBlock lang="bash" filename="project_layout.txt" t={t}>{`CMakeLists.txt
assets/
    wall.jpg            ← your image (any JPG or PNG)
include/
    glad/  KHR/
    stb_image.h         ← NEW
src/
    glad.c
    main.cpp
    stb_image.cpp       ← NEW: the two lines below`}</CodeBlock>
      <CodeBlock lang="cpp" filename="src/stb_image.cpp" t={t}>{`#define STB_IMAGE_IMPLEMENTATION   // compile the library's code here, once
#include "stb_image.h"`}</CodeBlock>
      <p>
        {tx(t, "ch07_stbCmake",
          "Then two changes in CMakeLists.txt. The new .cpp file joins add_executable. And, exactly like SHADER_DIR in the Pipeline chapter, ASSET_DIR gives the program the absolute path of the assets/ folder. A relative path such as \"assets/wall.jpg\" would be looked up from the build folder and not found. The include/ folder needs nothing new: the glad library already adds it with PUBLIC, so app sees it too.")}
      </p>
      <CodeBlock lang="cmake" filename="CMakeLists.txt" t={t}>{`add_executable(app src/main.cpp src/stb_image.cpp)         # stb_image.cpp added
target_link_libraries(app PRIVATE glad glfw glm::glm)
target_compile_definitions(app PRIVATE ASSET_DIR="\${CMAKE_SOURCE_DIR}/assets/")`}</CodeBlock>
      <p>
        {tx(t, "ch07_stbImage",
          "For the image, any photo works. A brick wall or a wooden crate is the classic first texture. Any size is fine: since OpenGL 2.0, textures no longer need power-of-two sizes such as 256 or 512.")}
      </p>

      <H3>{tx(t, "ch07_loadCallTitle", "Reading the file")}</H3>
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`#include "stb_image.h"     // declarations only: the code is in stb_image.cpp

// OpenGL's origin is bottom-left; images are stored top-left — flip them
stbi_set_flip_vertically_on_load(true);

int width, height, channels;
unsigned char* data = stbi_load(ASSET_DIR "wall.jpg", &width, &height, &channels, 0);

if (!data) {
    std::cerr << "Failed to load texture: " << stbi_failure_reason() << std::endl;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "ch07_tPart", "Part"), tx(t, "ch07_tMeaning", "Meaning")]}
        rows={[
          ["stbi_set_flip_vertically_on_load(true)", tx(t, "ch07_l1", "image files store the top row first, but OpenGL's v = 0 is the bottom. Flipping while loading puts the bottom row first, so the picture is not upside down.")],
          ["ASSET_DIR \"wall.jpg\"", tx(t, "ch07_l2", "two string literals side by side are joined by the compiler into one full path, as with SHADER_DIR.")],
          ["&width, &height, &channels", tx(t, "ch07_l3", "stbi_load writes the image's size in pixels and its number of channels into these variables: 1 grey, 2 grey + alpha, 3 RGB, 4 RGBA. A colour JPG gives 3.")],
          ["0", tx(t, "ch07_l4", "the channel count you want back. 0 means \"as stored in the file\". Passing 4 would always give RGBA.")],
          ["data", tx(t, "ch07_l5", "a pointer to width × height × channels bytes, one byte per channel, row after row. A 512 × 512 JPG is 512 · 512 · 3 = 786 432 bytes. If the file cannot be read, data is nullptr and stbi_failure_reason() says why.")],
        ]}
      />

      <H2>{tx(t, "ch07_createTitle", "Creating the texture object")}</H2>
      <CodeBlock lang="cpp" filename="create_texture.cpp" t={t}>{`GLuint texture;
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
      <p>
        {tx(t, "ch07_createSteps",
          "The pattern is the one you know from buffers: generate a name, bind it to a target (GL_TEXTURE_2D), then configure and fill whatever is bound. S and T in the wrap parameters are OpenGL's names for the u and v axes of a texture.")}
      </p>
      <p>{tx(t, "ch07_texImageIntro", "glTexImage2D has nine arguments, and most mistakes with textures come from one of them:")}</p>
      <LessonTable
        headers={[tx(t, "ch07_tArg", "Argument"), tx(t, "ch07_tMeaning", "Meaning")]}
        rows={[
          ["GL_TEXTURE_2D", tx(t, "ch07_a1", "target: fill the texture bound to GL_TEXTURE_2D.")],
          ["0", tx(t, "ch07_a2", "level: the mipmap level to fill. 0 is the full-size image; glGenerateMipmap makes the smaller levels from it.")],
          ["internal", tx(t, "ch07_a3", "internal format: how the GPU stores the texels, for example GL_RGB8 (8 bits per channel).")],
          ["width, height", tx(t, "ch07_a4", "the size in texels, straight from stbi_load.")],
          ["0", tx(t, "ch07_a5", "border: a leftover from old OpenGL. It must be 0.")],
          ["format", tx(t, "ch07_a6", "which channels your bytes contain, in which order: GL_RGB, GL_RGBA…")],
          ["GL_UNSIGNED_BYTE", tx(t, "ch07_a7", "the type of each channel value in your data: one byte, 0–255, as stb_image delivers.")],
          ["data", tx(t, "ch07_a8", "the pointer to the pixels. OpenGL copies them during the call, which is why stbi_image_free can run right after.")],
        ]}
      />

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
      <p>
        {tx(t, "ch07_trapPath",
          "One more, before any of these: the file is not found at all. stbi_load returns nullptr, and if the code goes on anyway, the texture has no image and samples as black. Always check data, print stbi_failure_reason(), and load from ASSET_DIR rather than a relative path.")}
      </p>

      <H2>{tx(t, "ch07_shaderTitle", "Sampling in the fragment shader")}</H2>
      <p>
        {tx(t, "ch07_shaderWhere",
          "These two shaders replace the colour shaders in your main.cpp. The vertex shader reads the coordinate at location 1 and passes it on as TexCoord. The fragment shader declares a sampler2D, a handle to a texture, and texture(uTexture, TexCoord) returns the colour of the image at that (u, v), filtered as configured above.")}
      </p>
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
      <CodeBlock lang="cpp" filename="main.cpp" t={t}>{`// Once, after the program is made (step 4): the sampler reads unit 0
glUseProgram(shaderProgram);
glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0); // unit 0

// Every frame, in the render loop (step 5): bind the texture to unit 0, then draw
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture);
glUseProgram(shaderProgram);
glBindVertexArray(vao);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`}</CodeBlock>

      <Callout type="info" t={t}>
        {tx(t, "ch07_unitsNote",
          "A texture unit is a numbered slot a texture is bound to. The fragment shader can use at least 16 of them (GL_MAX_TEXTURE_IMAGE_UNITS). The enums are consecutive, so unit i is GL_TEXTURE0 + i. Activate a unit, bind a texture to it, then set the sampler uniform to that unit's number — the plain integer i, not the enum. This is how you use multiple textures in one draw call."
        )}
      </Callout>

      <H2>{tx(t, "ch07_helperTitle", "A loadTexture helper")}</H2>
      <p>
        {tx(t, "ch07_helperBody",
          "Reading the file and creating the texture always go together, so they belong in one function, like compileShader and makeProgram in the First Shaders chapter. loadTexture takes a path and returns the texture's name, or 0 if the file could not be read. It goes above main, next to the shader helpers.")}
      </p>
      <LessonTable
        headers={[tx(t, "ch07_tPart", "Part"), tx(t, "ch07_tMeaning", "Meaning")]}
        rows={[
          ["if (!data) return 0;", tx(t, "ch07_h1", "no file, no texture: report it with the name that is never valid, so main can stop instead of drawing black.")],
          ["format / internal", tx(t, "ch07_h2", "chosen from channels, so the same function loads a JPG (3 channels) or a PNG with transparency (4).")],
          ["stbi_image_free(data)", tx(t, "ch07_h3", "the GPU has its own copy after glTexImage2D, so the CPU copy is freed before returning.")],
          ["return tex;", tx(t, "ch07_h4", "the caller owns the texture and deletes it at the end with glDeleteTextures.")],
        ]}
      />

      <H2>{tx(t, "ch07_soFarTitle", "Your main.cpp so far")}</H2>
      <p>
        {tx(t, "ch07_soFarBody",
          "The whole file, with the square textured. Compared with the Indexed Drawing chapter's version, the changes are marked NEW: the stb_image include, the textured shaders, loadTexture, the vertices with u v instead of r g b and attribute 1 with 2 components, the texture and its sampler in step 4c, the bind in the loop, and glDeleteTextures at the end. The shader helpers are shortened because they did not change.")}
      </p>
      <CodeBlock lang="cpp" filename="src/main.cpp" t={t}>{`#include <glad/glad.h>      // MUST come before glfw3.h
#include <GLFW/glfw3.h>
#include <iostream>
#include "stb_image.h"         // NEW: declarations only, the code is in stb_image.cpp

// ── Shaders ─────────────────────────────────────── NEW: uv in, texture out
const char* vertexShaderSource = R"(#version 460 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoord;
out vec2 TexCoord;
void main() {
    gl_Position = vec4(aPos, 1.0);
    TexCoord = aTexCoord;
})";

const char* fragmentShaderSource = R"(#version 460 core
in vec2 TexCoord;
out vec4 FragColor;
uniform sampler2D uTexture;
void main() {
    FragColor = texture(uTexture, TexCoord);
})";

// ── Shader helpers (unchanged since First Shaders) ──────────────────────────
GLuint compileShader(GLenum type, const char* src) { /* ... */ }
GLuint makeProgram(const char* vsSrc, const char* fsSrc) { /* ... */ }

// ── Texture helper ──────────────────────────────── >>> NEW in this chapter
GLuint loadTexture(const char* path) {
    stbi_set_flip_vertically_on_load(true);           // file rows top-down → OpenGL bottom-up
    int width, height, channels;
    unsigned char* data = stbi_load(path, &width, &height, &channels, 0);
    if (!data) {
        std::cerr << "Could not load " << path << ": " << stbi_failure_reason() << "\\n";
        return 0;                                      // 0 = "no texture"
    }
    const GLenum format   = channels == 1 ? GL_RED : channels == 2 ? GL_RG
                          : channels == 3 ? GL_RGB : GL_RGBA;
    const GLenum internal = channels == 1 ? GL_R8  : channels == 2 ? GL_RG8
                          : channels == 3 ? GL_RGB8 : GL_RGBA8;

    GLuint tex;
    glGenTextures(1, &tex);
    glBindTexture(GL_TEXTURE_2D, tex);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);            // stb_image rows are tightly packed
    glTexImage2D(GL_TEXTURE_2D, 0, internal, width, height, 0, format, GL_UNSIGNED_BYTE, data);
    glGenerateMipmap(GL_TEXTURE_2D);
    stbi_image_free(data);                             // the GPU has its own copy now
    return tex;
}
//                                                 <<< end of NEW

void framebufferSizeCallback(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}

int main() {
    // ── 1–3. Window, GLAD, viewport (unchanged) ─────────────────────────────
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 6);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    GLFWwindow* window = glfwCreateWindow(1280, 720, "GLApp", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 1; }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) return 1;
    int fbw, fbh;
    glfwGetFramebufferSize(window, &fbw, &fbh);
    glViewport(0, 0, fbw, fbh);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    // ── 4. One-time setup ────────────────────────────────────────────────────
    // 4a. Shaders → program (unchanged)
    GLuint shaderProgram = makeProgram(vertexShaderSource, fragmentShaderSource);
    if (shaderProgram == 0) { glfwTerminate(); return 1; }

    // 4b. Vertex data → VAO + VBO + EBO            >>> NEW: u v instead of r g b
    float vertices[] = {
    //    x      y     z     u     v
        -0.5f,  0.5f, 0.0f, 0.0f, 1.0f,   // 0: top-left
        -0.5f, -0.5f, 0.0f, 0.0f, 0.0f,   // 1: bottom-left
         0.5f, -0.5f, 0.0f, 1.0f, 0.0f,   // 2: bottom-right
         0.5f,  0.5f, 0.0f, 1.0f, 1.0f,   // 3: top-right
    };
    GLuint indices[] = {
        0, 1, 2,
        0, 2, 3,
    };
    GLuint vao, vbo, ebo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);
    glGenBuffers(1, &ebo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
    // attribute 0 = aPos: 3 floats, stride 20 bytes, starts at byte 0
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    // attribute 1 = aTexCoord: 2 floats, stride 20 bytes, starts at byte 12
    glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
    glBindVertexArray(0);
    //                                               <<< end of NEW

    // 4c. Texture + sampler                         >>> NEW
    GLuint texture = loadTexture(ASSET_DIR "wall.jpg");
    if (texture == 0) { glfwTerminate(); return 1; }
    glUseProgram(shaderProgram);
    glUniform1i(glGetUniformLocation(shaderProgram, "uTexture"), 0);   // sampler reads unit 0
    //                                               <<< end of NEW

    // ── 5. The render loop ───────────────────────────────────────────────────
    while (!glfwWindowShouldClose(window)) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);

        glClearColor(0.06f, 0.07f, 0.10f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        glActiveTexture(GL_TEXTURE0);                  // NEW: texture → unit 0
        glBindTexture(GL_TEXTURE_2D, texture);         // NEW
        glUseProgram(shaderProgram);
        glBindVertexArray(vao);
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, (void*)0);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // ── 6. Clean up ──────────────────────────────────────────────────────────
    glDeleteTextures(1, &texture);                     // NEW
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteBuffers(1, &ebo);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}`}</CodeBlock>
      <p>
        {tx(t, "ch07_soFarRun",
          "Run it: your image fills the square, the right way up. Because the window is wider than it is tall, the square, and the image with it, looks stretched sideways; the projection matrix in the Transformations section fixes that.")}
      </p>
      <LessonTable
        headers={[tx(t, "ch07_tSee", "What you see"), tx(t, "ch07_tCause", "Likely cause")]}
        rows={[
          [tx(t, "ch07_s1", "the program closes and prints \"Could not load …\""), tx(t, "ch07_s1b", "the image is not at assets/wall.jpg, the name differs, or ASSET_DIR is missing from CMakeLists.txt (re-run CMake after editing it).")],
          [tx(t, "ch07_s2", "a black square"), tx(t, "ch07_s2b", "a missing mipmap chain, or the texture was not bound to the unit the sampler reads (trap 1 above, and the units callout).")],
          [tx(t, "ch07_s3", "the image is upside down"), tx(t, "ch07_s3b", "stbi_set_flip_vertically_on_load(true) is missing, or runs after stbi_load.")],
          [tx(t, "ch07_s4", "diagonal stripes and wrong colours"), tx(t, "ch07_s4b", "row alignment (trap 3): add glPixelStorei(GL_UNPACK_ALIGNMENT, 1) before glTexImage2D.")],
          [tx(t, "ch07_s5", "a linker error: undefined stbi_load"), tx(t, "ch07_s5b", "stb_image.cpp is not in add_executable, or it lacks #define STB_IMAGE_IMPLEMENTATION.")],
          [tx(t, "ch07_s6", "a linker error: stbi_load defined twice"), tx(t, "ch07_s6b", "STB_IMAGE_IMPLEMENTATION is defined in more than one .cpp file. Keep it only in stb_image.cpp.")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "ch07_tileTip", "Try the wrap modes on your own image: change the u and v values of the corners from 1.0 to 2.0. With GL_REPEAT the image appears 2 × 2 times; switch the wrap mode to GL_CLAMP_TO_EDGE or GL_MIRRORED_REPEAT in loadTexture and compare.")}
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
      <CodeBlock lang="cpp" filename="two_textures.cpp" t={t}>{`// Once, in step 4c
GLuint wallTex  = loadTexture(ASSET_DIR "wall.jpg");
GLuint decalTex = loadTexture(ASSET_DIR "decal.png");    // a PNG with transparency
glUseProgram(shaderProgram);
glUniform1i(glGetUniformLocation(shaderProgram, "uWall"),  0);   // sampler → unit 0
glUniform1i(glGetUniformLocation(shaderProgram, "uDecal"), 1);   // sampler → unit 1
glUniform1f(glGetUniformLocation(shaderProgram, "uMix"),   0.8f);

// Every frame, before drawing
glActiveTexture(GL_TEXTURE0); glBindTexture(GL_TEXTURE_2D, wallTex);
glActiveTexture(GL_TEXTURE1); glBindTexture(GL_TEXTURE_2D, decalTex);
glBindVertexArray(vao);
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "ch07_twoWarn",
          "The sampler values are program state and only need setting once. The unit bindings are global state: the next draw that binds another texture to unit 1 replaces the decal for everyone. Two samplers of different types, such as a sampler2D and a samplerCube, must never point at the same unit, or the draw fails with GL_INVALID_OPERATION."
        )}
      </Callout>
      <p>
        {tx(t, "ch07_twoMix",
          "A worked pixel, with uMix = 0.8. The wall texel is (0.6, 0.3, 0.2, 1). Where the decal is opaque red, (1, 0, 0, 1), t = 1 · 0.8 = 0.8 and the result is 0.2 · wall + 0.8 · decal = (0.92, 0.06, 0.04, 1): mostly red. Where the decal is fully transparent (alpha 0), t = 0 and the wall shows unchanged, whatever colour the decal's invisible texels hold.")}
      </p>

      <KeyIdeas t={t} id="ch07" items={[
        "A texture is an image on the GPU; each vertex carries (u, v) saying which point of the image it shows, and the rasterizer interpolates it.",
        "stb_image is one header: define STB_IMAGE_IMPLEMENTATION in exactly one .cpp file, and load files from an absolute ASSET_DIR path.",
        "stbi_load returns width × height × channels bytes; flip vertically on load, because OpenGL's v = 0 is the bottom row.",
        "Create a texture like a buffer: generate, bind to GL_TEXTURE_2D, set wrap and filter parameters, upload with glTexImage2D, build mipmaps.",
        "format describes your bytes, the internal format describes the GPU storage; set GL_UNPACK_ALIGNMENT to 1 for tightly packed rows.",
        "A black texture usually means missing mipmaps, a file that did not load, or a texture bound to the wrong unit.",
        "Samplers read texture units: bind with glActiveTexture(GL_TEXTURE0 + i) + glBindTexture, and set the sampler uniform to the plain integer i.",
      ]} />
    </Article>
  );
}
