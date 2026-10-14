// src/lib/reference/opengl/dsaTextures.ts
// More of the "dsa" category: texture parameters, binding to a unit, mipmaps
// and compressed uploads, all by texture ID.
import type { RefEntry } from "../types";
import { DSA_NOTE } from "./dsa";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const TEX_PARAMS = [
  { name: "GL_TEXTURE_MIN_FILTER", desc: { en: "Filter when the texture is shrunk: GL_LINEAR_MIPMAP_LINEAR (smooth, needs mipmaps), GL_LINEAR, GL_NEAREST.", pt: "Filtro quando a textura é reduzida: GL_LINEAR_MIPMAP_LINEAR (suave, precisa de mipmaps), GL_LINEAR, GL_NEAREST." } },
  { name: "GL_TEXTURE_MAG_FILTER", desc: { en: "Filter when it is enlarged: GL_LINEAR (smooth) or GL_NEAREST (pixel art).", pt: "Filtro quando é ampliada: GL_LINEAR (suave) ou GL_NEAREST (pixel art)." } },
  { name: "GL_TEXTURE_WRAP_S / _T / _R", desc: { en: "What happens outside 0..1: GL_REPEAT, GL_MIRRORED_REPEAT, GL_CLAMP_TO_EDGE, GL_CLAMP_TO_BORDER.", pt: "O que acontece fora de 0..1: GL_REPEAT, GL_MIRRORED_REPEAT, GL_CLAMP_TO_EDGE, GL_CLAMP_TO_BORDER." } },
  { name: "GL_TEXTURE_BASE_LEVEL / GL_TEXTURE_MAX_LEVEL", desc: { en: "Range of mip levels the sampler may use.", pt: "Faixa de níveis de mipmap que o sampler pode usar." } },
  { name: "GL_TEXTURE_COMPARE_MODE", desc: { en: "GL_COMPARE_REF_TO_TEXTURE turns a depth texture into a shadow sampler (sampler2DShadow).", pt: "GL_COMPARE_REF_TO_TEXTURE transforma uma textura de profundidade num shadow sampler (sampler2DShadow)." } },
];

export const dsaTextureEntries: RefEntry[] = [
  {
    name: "glTextureParameteri",
    category: "dsa",
    diagram: "wrapModes",
    since: "GL 4.5",
    signature: "void glTextureParameteri(GLuint texture, GLenum pname, GLint param);",
    summary: {
      en: "Sets one integer setting of a texture (filtering, wrapping…) by its ID.",
      pt: "Define uma configuração inteira de uma textura (filtro, repetição…) pelo ID.",
    },
    description: {
      en: "The DSA form of glTexParameteri: the same names and values, but the texture is the first argument, so nothing has to be bound to a target first. Settings belong to the texture and stay until you change them; set them once after creating it.\n\nThe two settings almost every texture needs are the filters. The default minification filter, GL_NEAREST_MIPMAP_LINEAR, expects mipmaps: without them (or without glGenerateTextureMipmap) the texture is incomplete and samples as black.",
      pt: "A forma DSA de glTexParameteri: os mesmos nomes e valores, mas a textura é o primeiro argumento, então nada precisa estar ligado a um target antes. As configurações pertencem à textura e ficam até você mudá-las; defina uma vez depois de criá-la.\n\nAs duas configurações de que quase toda textura precisa são os filtros. O filtro de redução padrão, GL_NEAREST_MIPMAP_LINEAR, espera mipmaps: sem eles (ou sem glGenerateTextureMipmap) a textura fica incompleta e é lida como preta.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "The texture (from glCreateTextures).", pt: "A textura (de glCreateTextures)." } },
      { name: "pname", type: "GLenum", desc: { en: "Which setting.", pt: "Qual configuração." }, values: TEX_PARAMS },
      { name: "param", type: "GLint", desc: { en: "The new value, usually an enum such as GL_LINEAR.", pt: "O novo valor, normalmente um enum como GL_LINEAR." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "A separate sampler object (glBindSampler) overrides these settings while it is bound to the unit.", pt: "Um sampler object separado (glBindSampler) substitui estas configurações enquanto estiver ligado à unidade." },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "pname or param is not accepted.", pt: "pname ou param não é aceito." } },
      { code: "GL_INVALID_OPERATION", when: { en: "texture is not the name of an existing texture.", pt: "texture não é o nome de uma textura existente." } },
    ],
    example: `glTextureParameteri(tex, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTextureParameteri(tex, GL_TEXTURE_WRAP_T, GL_REPEAT);
glTextureParameteri(tex, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTextureParameteri(tex, GL_TEXTURE_MAG_FILTER, GL_LINEAR);`,
    related: ["glTexParameteri", "glTextureParameterf", "glTextureParameteriv", "glGenerateTextureMipmap", "glCreateTextures"],
    khronos: `${KHR}glTexParameter.xhtml`,
  },
  {
    name: "glTextureParameterf",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glTextureParameterf(GLuint texture, GLenum pname, GLfloat param);",
    summary: {
      en: "Sets one floating-point setting of a texture, such as anisotropic filtering or LOD bias.",
      pt: "Define uma configuração em ponto flutuante de uma textura, como o filtro anisotrópico ou o LOD bias.",
    },
    description: {
      en: "The same as glTextureParameteri for settings whose value is a number with a fraction. The one you will use most is GL_TEXTURE_MAX_ANISOTROPY: it keeps floors and roads sharp when seen at a grazing angle, where plain mipmapping blurs them. 16 is the usual maximum, and it costs very little on modern GPUs.",
      pt: "O mesmo que glTextureParameteri, para configurações cujo valor é um número com casas decimais. A mais usada é GL_TEXTURE_MAX_ANISOTROPY: mantém pisos e estradas nítidos quando vistos em ângulo rasante, onde o mipmap comum os borra. 16 é o máximo usual, e custa muito pouco nas GPUs atuais.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "The texture.", pt: "A textura." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which setting.", pt: "Qual configuração." },
        values: [
          { name: "GL_TEXTURE_MAX_ANISOTROPY", desc: { en: "1 = off, up to GL_MAX_TEXTURE_MAX_ANISOTROPY (usually 16). Core in GL 4.6, an extension (…_EXT) before.", pt: "1 = desligado, até GL_MAX_TEXTURE_MAX_ANISOTROPY (normalmente 16). Core no GL 4.6, extensão (…_EXT) antes." } },
          { name: "GL_TEXTURE_LOD_BIAS", desc: { en: "Shifts the chosen mip level: negative = sharper, positive = blurrier.", pt: "Desloca o nível de mipmap escolhido: negativo = mais nítido, positivo = mais borrado." } },
          { name: "GL_TEXTURE_MIN_LOD / GL_TEXTURE_MAX_LOD", desc: { en: "Clamp the level of detail.", pt: "Limitam o nível de detalhe." } },
        ],
      },
      { name: "param", type: "GLfloat", desc: { en: "The new value.", pt: "O novo valor." } },
    ],
    notes: [DSA_NOTE],
    example: `GLfloat maxAniso = 1.0f;
glGetFloatv(GL_MAX_TEXTURE_MAX_ANISOTROPY, &maxAniso);
glTextureParameterf(tex, GL_TEXTURE_MAX_ANISOTROPY, std::min(16.0f, maxAniso));`,
    related: ["glTextureParameteri", "glGenerateTextureMipmap"],
    khronos: `${KHR}glTexParameter.xhtml`,
  },
  {
    name: "glTextureParameteriv",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glTextureParameteriv(GLuint texture, GLenum pname, const GLint *params);",
    summary: {
      en: "Sets a texture setting that takes several integers at once, such as the channel swizzle.",
      pt: "Define uma configuração de textura que recebe vários inteiros de uma vez, como o swizzle de canais.",
    },
    description: {
      en: "The array form, for settings with more than one value. The common one is GL_TEXTURE_SWIZZLE_RGBA, which says where each channel the shader reads comes from. A one-channel GL_R8 glyph atlas with the swizzle { GL_ONE, GL_ONE, GL_ONE, GL_RED } reads in the shader as white with the glyph shape in alpha, so ordinary text shaders work unchanged, using a quarter of the memory of RGBA.",
      pt: "A forma com array, para configurações com mais de um valor. A comum é GL_TEXTURE_SWIZZLE_RGBA, que diz de onde vem cada canal que o shader lê. Um atlas de glifos GL_R8, de um canal só, com o swizzle { GL_ONE, GL_ONE, GL_ONE, GL_RED } é lido no shader como branco com a forma do glifo no alfa, assim shaders de texto comuns funcionam sem mudança, usando um quarto da memória de RGBA.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "The texture.", pt: "A textura." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which setting.", pt: "Qual configuração." },
        values: [
          { name: "GL_TEXTURE_SWIZZLE_RGBA", desc: { en: "4 values, each GL_RED, GL_GREEN, GL_BLUE, GL_ALPHA, GL_ZERO or GL_ONE.", pt: "4 valores, cada um GL_RED, GL_GREEN, GL_BLUE, GL_ALPHA, GL_ZERO ou GL_ONE." } },
          { name: "GL_TEXTURE_BORDER_COLOR", desc: { en: "4 values used outside the texture with GL_CLAMP_TO_BORDER (often via glTextureParameterfv).", pt: "4 valores usados fora da textura com GL_CLAMP_TO_BORDER (geralmente via glTextureParameterfv)." } },
        ],
      },
      { name: "params", type: "const GLint *", desc: { en: "Pointer to the values.", pt: "Ponteiro para os valores." } },
    ],
    notes: [DSA_NOTE],
    example: `GLint swz[] = { GL_ONE, GL_ONE, GL_ONE, GL_RED };
glTextureParameteriv(atlas, GL_TEXTURE_SWIZZLE_RGBA, swz);`,
    related: ["glTextureParameteri", "glTexParameterfv"],
    khronos: `${KHR}glTexParameter.xhtml`,
  },
  {
    name: "glBindTextureUnit",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glBindTextureUnit(GLuint unit, GLuint texture);",
    summary: {
      en: "Puts a texture on texture unit number unit, in one call (no glActiveTexture).",
      pt: "Coloca uma textura na unidade de textura número unit, numa chamada só (sem glActiveTexture).",
    },
    description: {
      en: "Shaders read textures through numbered units: a sampler2D uniform holds a unit number, and whatever texture is on that unit at draw time is what it samples. The old way took two calls, glActiveTexture(GL_TEXTURE0 + unit) then glBindTexture(target, tex). This one does both, and the target is taken from the texture itself.",
      pt: "Os shaders leem texturas por unidades numeradas: um uniform sampler2D guarda o número de uma unidade, e a textura que estiver nessa unidade na hora do desenho é a que ele lê. O jeito antigo levava duas chamadas, glActiveTexture(GL_TEXTURE0 + unit) e depois glBindTexture(target, tex). Esta faz as duas coisas, e o target vem da própria textura.",
    },
    params: [
      { name: "unit", type: "GLuint", desc: { en: "The unit as a plain number: 0, 1, 2… NOT GL_TEXTURE0.", pt: "A unidade como número simples: 0, 1, 2… NÃO GL_TEXTURE0." } },
      { name: "texture", type: "GLuint", desc: { en: "The texture, or 0 to unbind every target of that unit.", pt: "A textura, ou 0 para desligar todos os targets dessa unidade." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "Passing GL_TEXTURE0 + 3 instead of 3 is the classic mistake: it asks for unit 33987, which does not exist.", pt: "Passar GL_TEXTURE0 + 3 em vez de 3 é o erro clássico: isso pede a unidade 33987, que não existe." },
      { en: "The sampler uniform must hold the same number: glProgramUniform1i(prog, loc, 3), or layout(binding = 3) in GLSL.", pt: "O uniform do sampler precisa ter o mesmo número: glProgramUniform1i(prog, loc, 3), ou layout(binding = 3) no GLSL." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "texture is not 0 and not an existing texture.", pt: "texture não é 0 nem uma textura existente." } },
    ],
    example: `// GLSL: layout(binding = 3) uniform sampler2D albedo;
glBindTextureUnit(3, tex);`,
    related: ["glActiveTexture", "glBindTexture", "glCreateTextures", "glUniform1i"],
    khronos: `${KHR}glBindTextureUnit.xhtml`,
  },
  {
    name: "glGenerateTextureMipmap",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glGenerateTextureMipmap(GLuint texture);",
    summary: {
      en: "Builds every smaller mip level of a texture from its level 0, by ID.",
      pt: "Gera todos os níveis de mipmap menores de uma textura a partir do nível 0, pelo ID.",
    },
    description: {
      en: "The DSA form of glGenerateMipmap. Each level is half the size of the one above, filtered down by the driver, until 1×1. Call it after the level-0 pixels are uploaded, and again whenever they change (a texture you render into, for example).\n\nWith glTextureStorage2D the levels must already be allocated: pass levels = 1 + floor(log2(max(w, h))), or there is nowhere to write them.",
      pt: "A forma DSA de glGenerateMipmap. Cada nível tem metade do tamanho do anterior, filtrado pelo driver, até 1×1. Chame depois de enviar os pixels do nível 0, e de novo sempre que eles mudarem (numa textura em que você renderiza, por exemplo).\n\nCom glTextureStorage2D os níveis precisam já estar alocados: passe levels = 1 + floor(log2(max(w, h))), senão não há onde escrevê-los.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "The texture whose level 0 is already filled.", pt: "A textura cujo nível 0 já está preenchido." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "Compressed textures (BC7, ASTC…) cannot generate mipmaps on the GPU: compress every level offline and upload each one.", pt: "Texturas comprimidas (BC7, ASTC…) não geram mipmaps na GPU: comprima cada nível offline e envie um por um." },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The texture is a multisample or buffer texture, or its format cannot be filtered.", pt: "A textura é multisample ou buffer texture, ou seu formato não pode ser filtrado." } },
    ],
    example: `glTextureSubImage2D(tex, 0, 0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glGenerateTextureMipmap(tex);`,
    related: ["glGenerateMipmap", "glTextureStorage2D", "glTextureParameteri"],
    khronos: `${KHR}glGenerateMipmap.xhtml`,
  },
  {
    name: "glCompressedTextureSubImage2D",
    category: "dsa",
    since: "GL 4.5",
    signature: "void glCompressedTextureSubImage2D(GLuint texture, GLint level, GLint xoffset, GLint yoffset,\n                                   GLsizei width, GLsizei height, GLenum format,\n                                   GLsizei imageSize, const void *data);",
    summary: {
      en: "Uploads already-compressed blocks (BC7, BC1, ASTC…) into one mip level of a texture.",
      pt: "Envia blocos já comprimidos (BC7, BC1, ASTC…) para um nível de mipmap de uma textura.",
    },
    description: {
      en: "Block-compressed formats store each 4×4 pixel block in a fixed number of bytes (8 for BC1, 16 for BC7), and the GPU decodes them while sampling. The data comes ready from a tool or a .dds / .ktx2 file; OpenGL only copies it.\n\nAllocate the texture first with glTextureStorage2D and the same compressed format, then upload every mip level with one call each. imageSize is the byte count of that level: ceil(w/4) × ceil(h/4) × bytes per block.",
      pt: "Os formatos comprimidos em blocos guardam cada bloco de 4×4 pixels num número fixo de bytes (8 no BC1, 16 no BC7), e a GPU os decodifica durante a leitura. Os dados chegam prontos de uma ferramenta ou de um arquivo .dds / .ktx2; o OpenGL só os copia.\n\nAloque a textura antes com glTextureStorage2D e o mesmo formato comprimido, depois envie cada nível de mipmap com uma chamada. imageSize é o número de bytes daquele nível: ceil(w/4) × ceil(h/4) × bytes por bloco.",
    },
    params: [
      { name: "texture", type: "GLuint", desc: { en: "Texture allocated with a compressed internal format.", pt: "Textura alocada com formato interno comprimido." } },
      { name: "level", type: "GLint", desc: { en: "Mip level.", pt: "Nível de mipmap." } },
      { name: "xoffset", type: "GLint", desc: { en: "Left edge, a multiple of 4.", pt: "Borda esquerda, múltiplo de 4." } },
      { name: "yoffset", type: "GLint", desc: { en: "Bottom edge, a multiple of 4.", pt: "Borda de baixo, múltiplo de 4." } },
      { name: "width", type: "GLsizei", desc: { en: "Width of the region (the level's width for a full upload).", pt: "Largura da região (a largura do nível, para um envio completo)." } },
      { name: "height", type: "GLsizei", desc: { en: "Height of the region.", pt: "Altura da região." } },
      {
        name: "format", type: "GLenum",
        desc: { en: "The compressed format, the same as the storage.", pt: "O formato comprimido, o mesmo do armazenamento." },
        values: [
          { name: "GL_COMPRESSED_RGBA_BPTC_UNORM / GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM", desc: { en: "BC7: high quality colour, 16 bytes per block.", pt: "BC7: cor de alta qualidade, 16 bytes por bloco." } },
          { name: "GL_COMPRESSED_RGB_S3TC_DXT1_EXT", desc: { en: "BC1: 8 bytes per block, no real alpha.", pt: "BC1: 8 bytes por bloco, sem alfa de verdade." } },
          { name: "GL_COMPRESSED_RG_RGTC2", desc: { en: "BC5: two channels, for normal maps.", pt: "BC5: dois canais, para normal maps." } },
        ],
      },
      { name: "imageSize", type: "GLsizei", desc: { en: "Number of bytes in data.", pt: "Número de bytes em data." } },
      { name: "data", type: "const void *", desc: { en: "The compressed blocks.", pt: "Os blocos comprimidos." } },
    ],
    notes: [
      DSA_NOTE,
      { en: "A wrong imageSize gives GL_INVALID_VALUE and nothing is uploaded: the texture stays black.", pt: "Um imageSize errado gera GL_INVALID_VALUE e nada é enviado: a textura fica preta." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "imageSize does not match the size of the region in that format.", pt: "imageSize não bate com o tamanho da região naquele formato." } },
      { code: "GL_INVALID_OPERATION", when: { en: "format differs from the texture's format, or the offsets are not block aligned.", pt: "format é diferente do formato da textura, ou os offsets não estão alinhados aos blocos." } },
    ],
    example: `glTextureStorage2D(tex, levels, GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM, w, h);
for (int level = 0; level < levels; ++level) {
    int lw = std::max(1, w >> level), lh = std::max(1, h >> level);
    GLsizei bytes = ((lw + 3) / 4) * ((lh + 3) / 4) * 16;   // BC7
    glCompressedTextureSubImage2D(tex, level, 0, 0, lw, lh,
        GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM, bytes, blocks[level]);
}`,
    related: ["glTextureStorage2D", "glTextureSubImage2D", "glCreateTextures"],
    khronos: `${KHR}glCompressedTexSubImage2D.xhtml`,
  },
];
