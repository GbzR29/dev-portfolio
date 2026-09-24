// src/lib/reference/opengl/textures.ts
import type { RefEntry } from "../types";

const KHR = "https://registry.khronos.org/OpenGL-Refpages/gl4/html/";

const TEX_TARGETS = [
  { name: "GL_TEXTURE_2D", desc: { en: "Ordinary 2D image — the common case.", pt: "Imagem 2D comum — o caso mais usado." } },
  { name: "GL_TEXTURE_CUBE_MAP", desc: { en: "Six square faces (skyboxes, reflections, point shadows).", pt: "Seis faces quadradas (skybox, reflexos, sombras de luz pontual)." } },
  { name: "GL_TEXTURE_2D_ARRAY", desc: { en: "A stack of 2D layers of the same size.", pt: "Uma pilha de camadas 2D do mesmo tamanho." } },
  { name: "GL_TEXTURE_3D", desc: { en: "Volume texture.", pt: "Textura de volume." } },
  { name: "GL_TEXTURE_2D_MULTISAMPLE", desc: { en: "MSAA render target.", pt: "Render target com MSAA." } },
];

const PNAMES = [
  { name: "GL_TEXTURE_MIN_FILTER", desc: { en: "Filter when the texture is shrunk. GL_LINEAR_MIPMAP_LINEAR (trilinear) needs mipmaps.", pt: "Filtro quando a textura é reduzida. GL_LINEAR_MIPMAP_LINEAR (trilinear) precisa de mipmaps." } },
  { name: "GL_TEXTURE_MAG_FILTER", desc: { en: "Filter when magnified: GL_LINEAR (smooth) or GL_NEAREST (pixel art).", pt: "Filtro quando ampliada: GL_LINEAR (suave) ou GL_NEAREST (pixel art)." } },
  { name: "GL_TEXTURE_WRAP_S / _T / _R", desc: { en: "What happens outside 0–1: GL_REPEAT, GL_MIRRORED_REPEAT, GL_CLAMP_TO_EDGE, GL_CLAMP_TO_BORDER.", pt: "O que acontece fora de 0–1: GL_REPEAT, GL_MIRRORED_REPEAT, GL_CLAMP_TO_EDGE, GL_CLAMP_TO_BORDER." } },
  { name: "GL_TEXTURE_COMPARE_MODE", desc: { en: "GL_COMPARE_REF_TO_TEXTURE turns a depth texture into a shadow sampler.", pt: "GL_COMPARE_REF_TO_TEXTURE transforma uma textura de profundidade em shadow sampler." } },
  { name: "GL_TEXTURE_MAX_LEVEL", desc: { en: "Highest mip level that may be used.", pt: "Maior nível de mipmap que pode ser usado." } },
];

export const textureEntries: RefEntry[] = [
  {
    name: "glGenTextures",
    category: "textures",
    since: "GL 1.1",
    signature: "void glGenTextures(GLsizei n, GLuint *textures);",
    summary: {
      en: "Reserves names (IDs) for new texture objects.",
      pt: "Reserva nomes (IDs) para novos texture objects.",
    },
    description: {
      en: "Same pattern as glGenBuffers: you only get IDs. The texture becomes a real 2D (or cube, or 3D…) texture the first time it is bound to a target with glBindTexture.",
      pt: "Mesmo padrão de glGenBuffers: você só recebe IDs. A textura vira uma textura 2D (ou cube, ou 3D…) de verdade na primeira vez que é ligada a um target com glBindTexture.",
    },
    params: [
      { name: "n", type: "GLsizei", desc: { en: "How many IDs.", pt: "Quantos IDs." } },
      { name: "textures", type: "GLuint *", desc: { en: "Array receiving the IDs.", pt: "Array que recebe os IDs." } },
    ],
    example: `GLuint tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);`,
    related: ["glBindTexture", "glTexImage2D", "glCreateTextures"],
    khronos: `${KHR}glGenTextures.xhtml`,
  },
  {
    name: "glBindTexture",
    category: "textures",
    since: "GL 1.1",
    signature: "void glBindTexture(GLenum target, GLuint texture);",
    summary: {
      en: "Binds a texture to a target of the ACTIVE texture unit.",
      pt: "Liga uma textura a um target da texture unit ATIVA.",
    },
    description: {
      en: "The GPU has several texture units (at least 16), each with its own slots for 2D, cube map, etc. glBindTexture places the texture into the unit selected by the last glActiveTexture call.\n\nIt serves two purposes: configuring the texture (glTexImage2D, glTexParameteri act on the bound texture) and using it for drawing (the sampler reads from its unit).",
      pt: "A GPU tem várias texture units (pelo menos 16), cada uma com seus próprios slots para 2D, cube map, etc. glBindTexture coloca a textura na unit selecionada pela última chamada de glActiveTexture.\n\nServe para duas coisas: configurar a textura (glTexImage2D e glTexParameteri agem na textura ligada) e usá-la para desenhar (o sampler lê da unit dela).",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Kind of texture. Fixed at the first bind — a texture cannot change type later.", pt: "Tipo de textura. Fica fixo no primeiro bind — a textura não pode mudar de tipo depois." }, values: TEX_TARGETS },
      { name: "texture", type: "GLuint", desc: { en: "Texture ID, or 0 to unbind.", pt: "ID da textura, ou 0 para desfazer o bind." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "texture was created with a different target.", pt: "texture foi criada com outro target." } },
    ],
    example: `glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, diffuse);
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, specular);`,
    related: ["glActiveTexture", "glGenTextures", "glUniform1i"],
    khronos: `${KHR}glBindTexture.xhtml`,
  },
  {
    name: "glActiveTexture",
    category: "textures",
    since: "GL 1.3",
    signature: "void glActiveTexture(GLenum texture);",
    summary: {
      en: "Chooses which texture unit the next glBindTexture affects.",
      pt: "Escolhe qual texture unit o próximo glBindTexture afeta.",
    },
    description: {
      en: "To use several textures in one shader, each one goes into a different unit. The pattern is: select unit N → bind texture → tell the sampler uniform to read from N with glUniform1i.\n\nGL_TEXTURE0 is active by default, which is why single-texture code works without calling this.",
      pt: "Para usar várias texturas em um shader, cada uma vai para uma unit diferente. O padrão é: selecionar a unit N → fazer bind da textura → dizer ao uniform sampler para ler da N com glUniform1i.\n\nGL_TEXTURE0 é a ativa por padrão, por isso código com uma única textura funciona sem chamar esta função.",
    },
    params: [
      { name: "texture", type: "GLenum", desc: { en: "GL_TEXTURE0 + i, where i is the unit number. GL_TEXTURE0 + 3 == GL_TEXTURE3.", pt: "GL_TEXTURE0 + i, onde i é o número da unit. GL_TEXTURE0 + 3 == GL_TEXTURE3." } },
    ],
    errors: [
      { code: "GL_INVALID_ENUM", when: { en: "The unit number is ≥ GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS.", pt: "O número da unit é ≥ GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS." } },
    ],
    example: `for (int i = 0; i < 3; ++i) {
    glActiveTexture(GL_TEXTURE0 + i);
    glBindTexture(GL_TEXTURE_2D, textures[i]);
}`,
    related: ["glBindTexture", "glUniform1i"],
    khronos: `${KHR}glActiveTexture.xhtml`,
  },
  {
    name: "glTexImage2D",
    category: "textures",
    since: "GL 1.0",
    signature: "void glTexImage2D(GLenum target, GLint level, GLint internalformat,\n                  GLsizei width, GLsizei height, GLint border,\n                  GLenum format, GLenum type, const void *data);",
    summary: {
      en: "Allocates a 2D texture image and optionally uploads pixels into it.",
      pt: "Aloca a imagem de uma textura 2D e, opcionalmente, envia pixels para ela.",
    },
    description: {
      en: "The texture equivalent of glBufferData. It has many parameters because it describes TWO formats: how the GPU should STORE the texels (internalformat) and how YOUR data in memory is laid out (format + type). The driver converts from one to the other.\n\nPassing nullptr as data just allocates — that is how you create empty render targets for framebuffers.",
      pt: "O equivalente de glBufferData para texturas. Tem muitos parâmetros porque descreve DOIS formatos: como a GPU deve GUARDAR os texels (internalformat) e como os SEUS dados estão organizados na memória (format + type). O driver converte de um para o outro.\n\nPassar nullptr em data só aloca — é assim que você cria render targets vazios para framebuffers.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_TEXTURE_2D, or one cube face: GL_TEXTURE_CUBE_MAP_POSITIVE_X + i.", pt: "GL_TEXTURE_2D, ou uma face de cube map: GL_TEXTURE_CUBE_MAP_POSITIVE_X + i." } },
      { name: "level", type: "GLint", desc: { en: "Mipmap level. 0 is the full-size image.", pt: "Nível de mipmap. 0 é a imagem em tamanho cheio." } },
      {
        name: "internalformat", type: "GLint",
        desc: { en: "How the GPU stores the texture.", pt: "Como a GPU guarda a textura." },
        values: [
          { name: "GL_RGB8 / GL_RGBA8", desc: { en: "8 bits per channel — standard data textures.", pt: "8 bits por canal — texturas de dados comuns." } },
          { name: "GL_SRGB8 / GL_SRGB8_ALPHA8", desc: { en: "Color images painted in sRGB (albedo). The GPU linearizes on sampling.", pt: "Imagens de cor pintadas em sRGB (albedo). A GPU lineariza ao amostrar." } },
          { name: "GL_RGBA16F / GL_RGBA32F", desc: { en: "Floating point — HDR render targets.", pt: "Ponto flutuante — render targets HDR." } },
          { name: "GL_DEPTH_COMPONENT24 / 32F", desc: { en: "Depth texture (shadow maps).", pt: "Textura de profundidade (shadow maps)." } },
          { name: "GL_RED / GL_R8", desc: { en: "Single channel (masks, font atlases).", pt: "Um canal só (máscaras, atlas de fonte)." } },
        ],
      },
      { name: "width", type: "GLsizei", desc: { en: "Width in texels.", pt: "Largura em texels." } },
      { name: "height", type: "GLsizei", desc: { en: "Height in texels.", pt: "Altura em texels." } },
      { name: "border", type: "GLint", desc: { en: "Must be 0 (historical parameter).", pt: "Deve ser 0 (parâmetro histórico)." } },
      {
        name: "format", type: "GLenum",
        desc: { en: "Channel order of YOUR data.", pt: "Ordem dos canais dos SEUS dados." },
        values: [
          { name: "GL_RGB / GL_RGBA", desc: { en: "3 or 4 channels, as stb_image returns.", pt: "3 ou 4 canais, como o stb_image retorna." } },
          { name: "GL_RED", desc: { en: "Single channel.", pt: "Um canal." } },
          { name: "GL_DEPTH_COMPONENT", desc: { en: "Depth data (use with nullptr).", pt: "Dados de profundidade (use com nullptr)." } },
        ],
      },
      { name: "type", type: "GLenum", desc: { en: "Type of each channel of YOUR data: GL_UNSIGNED_BYTE for images from disk, GL_FLOAT for HDR.", pt: "Tipo de cada canal dos SEUS dados: GL_UNSIGNED_BYTE para imagens do disco, GL_FLOAT para HDR." } },
      { name: "data", type: "const void *", desc: { en: "Pixel data, starting at the BOTTOM-left row. nullptr to only allocate.", pt: "Dados dos pixels, começando na linha de BAIXO à esquerda. nullptr para só alocar." } },
    ],
    notes: [
      { en: "Images load top-down but OpenGL expects bottom-up: call stbi_set_flip_vertically_on_load(true), or the texture appears upside down.", pt: "Imagens carregam de cima para baixo mas o OpenGL espera de baixo para cima: chame stbi_set_flip_vertically_on_load(true), senão a textura fica de cabeça para baixo." },
      { en: "RGB images with a width not multiple of 4 look skewed: set glPixelStorei(GL_UNPACK_ALIGNMENT, 1) first.", pt: "Imagens RGB com largura que não é múltiplo de 4 ficam tortas: chame glPixelStorei(GL_UNPACK_ALIGNMENT, 1) antes." },
      { en: "format must match the channel count stb_image reported — GL_RGB for 3, GL_RGBA for 4.", pt: "format precisa bater com o número de canais que o stb_image informou — GL_RGB para 3, GL_RGBA para 4." },
    ],
    errors: [
      { code: "GL_INVALID_VALUE", when: { en: "Size is negative or larger than GL_MAX_TEXTURE_SIZE, or border ≠ 0.", pt: "Tamanho negativo ou maior que GL_MAX_TEXTURE_SIZE, ou border ≠ 0." } },
      { code: "GL_INVALID_OPERATION", when: { en: "format/type combination is not compatible with internalformat.", pt: "A combinação format/type não é compatível com internalformat." } },
    ],
    example: `int w, h, n;
stbi_set_flip_vertically_on_load(true);
unsigned char* pixels = stbi_load("wall.jpg", &w, &h, &n, 0);
GLenum fmt = (n == 4) ? GL_RGBA : GL_RGB;

glBindTexture(GL_TEXTURE_2D, tex);
glTexImage2D(GL_TEXTURE_2D, 0, fmt, w, h, 0, fmt, GL_UNSIGNED_BYTE, pixels);
glGenerateMipmap(GL_TEXTURE_2D);
stbi_image_free(pixels);`,
    related: ["glTexParameteri", "glGenerateMipmap", "glTexStorage2D", "glTextureSubImage2D"],
    khronos: `${KHR}glTexImage2D.xhtml`,
  },
  {
    name: "glTexStorage2D",
    category: "textures",
    since: "GL 4.2",
    signature: "void glTexStorage2D(GLenum target, GLsizei levels, GLenum internalformat,\n                    GLsizei width, GLsizei height);",
    summary: {
      en: "Allocates immutable storage for all mip levels of a 2D texture at once.",
      pt: "Aloca armazenamento imutável para todos os níveis de mipmap de uma textura 2D de uma vez.",
    },
    description: {
      en: "The modern way to allocate a texture. You declare size, format and number of mip levels once; they can never change afterwards (the contents can). Knowing this upfront lets the driver skip completeness checks, and it prevents a whole class of \"texture is incomplete\" bugs.\n\nPixels are uploaded afterwards with glTexSubImage2D.",
      pt: "O jeito moderno de alocar uma textura. Você declara tamanho, formato e número de níveis de mipmap uma vez; eles nunca podem mudar depois (o conteúdo pode). Saber isso de antemão permite ao driver pular verificações, e evita uma classe inteira de bugs de \"textura incompleta\".\n\nOs pixels são enviados depois com glTexSubImage2D.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_TEXTURE_2D or GL_TEXTURE_CUBE_MAP.", pt: "GL_TEXTURE_2D ou GL_TEXTURE_CUBE_MAP." } },
      { name: "levels", type: "GLsizei", desc: { en: "Number of mip levels. Full chain: 1 + floor(log2(max(w, h))).", pt: "Número de níveis de mipmap. Cadeia completa: 1 + floor(log2(max(w, h)))." } },
      { name: "internalformat", type: "GLenum", desc: { en: "A SIZED format: GL_RGBA8, GL_SRGB8_ALPHA8, GL_RGBA16F, GL_DEPTH_COMPONENT24… (unsized GL_RGBA is rejected).", pt: "Um formato COM TAMANHO: GL_RGBA8, GL_SRGB8_ALPHA8, GL_RGBA16F, GL_DEPTH_COMPONENT24… (GL_RGBA sem tamanho é rejeitado)." } },
      { name: "width", type: "GLsizei", desc: { en: "Width of level 0.", pt: "Largura do nível 0." } },
      { name: "height", type: "GLsizei", desc: { en: "Height of level 0.", pt: "Altura do nível 0." } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The bound texture already has immutable storage.", pt: "A textura ligada já tem armazenamento imutável." } },
      { code: "GL_INVALID_ENUM", when: { en: "internalformat is unsized.", pt: "internalformat não tem tamanho." } },
    ],
    example: `glBindTexture(GL_TEXTURE_2D, shadowMap);
glTexStorage2D(GL_TEXTURE_2D, 1, GL_DEPTH_COMPONENT32F, 2048, 2048);`,
    related: ["glTexImage2D", "glTextureStorage2D"],
    khronos: `${KHR}glTexStorage2D.xhtml`,
  },
  {
    name: "glTexParameteri",
    category: "textures",
    since: "GL 1.0",
    signature: "void glTexParameteri(GLenum target, GLenum pname, GLint param);",
    summary: {
      en: "Sets how the bound texture is sampled: filtering, wrapping, comparison.",
      pt: "Define como a textura ligada é amostrada: filtragem, repetição, comparação.",
    },
    description: {
      en: "Texture coordinates rarely land exactly on a texel center, and they can go outside 0–1. These parameters decide what happens: blend neighboring texels (GL_LINEAR) or pick the nearest (GL_NEAREST); repeat, mirror or clamp outside the edges.\n\nThe default minification filter uses mipmaps. If your texture has none, it is \"incomplete\" and samples as black — set GL_TEXTURE_MIN_FILTER to GL_LINEAR or generate mipmaps.",
      pt: "Coordenadas de textura raramente caem exatamente no centro de um texel, e podem sair de 0–1. Estes parâmetros decidem o que acontece: misturar texels vizinhos (GL_LINEAR) ou pegar o mais próximo (GL_NEAREST); repetir, espelhar ou prender nas bordas.\n\nO filtro de redução padrão usa mipmaps. Se sua textura não tem nenhum, ela fica \"incompleta\" e é amostrada como preto — defina GL_TEXTURE_MIN_FILTER como GL_LINEAR ou gere mipmaps.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Target of the bound texture (GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP…).", pt: "Target da textura ligada (GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP…)." } },
      { name: "pname", type: "GLenum", desc: { en: "Which parameter.", pt: "Qual parâmetro." }, values: PNAMES },
      { name: "param", type: "GLint", desc: { en: "The value (an enum such as GL_LINEAR or GL_REPEAT).", pt: "O valor (um enum como GL_LINEAR ou GL_REPEAT)." } },
    ],
    notes: [
      { en: "GL_TEXTURE_MAG_FILTER only accepts GL_LINEAR or GL_NEAREST — mipmaps are never used for magnification.", pt: "GL_TEXTURE_MAG_FILTER só aceita GL_LINEAR ou GL_NEAREST — mipmaps nunca são usados na ampliação." },
      { en: "Use GL_CLAMP_TO_EDGE for cube maps and screen-space textures to avoid visible seams.", pt: "Use GL_CLAMP_TO_EDGE em cube maps e texturas de tela para evitar costuras visíveis." },
    ],
    errors: [{ code: "GL_INVALID_ENUM", when: { en: "pname or param is not valid (e.g. a mipmap filter for MAG_FILTER).", pt: "pname ou param inválido (ex.: filtro com mipmap em MAG_FILTER)." } }],
    example: `glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);`,
    related: ["glTexParameterfv", "glGenerateMipmap", "glBindTexture"],
    khronos: `${KHR}glTexParameter.xhtml`,
  },
  {
    name: "glTexParameterfv",
    category: "textures",
    since: "GL 1.0",
    signature: "void glTexParameterfv(GLenum target, GLenum pname, const GLfloat *params);",
    summary: {
      en: "Sets a texture parameter that takes floats — mainly the border color.",
      pt: "Define um parâmetro de textura que recebe floats — principalmente a cor da borda.",
    },
    description: {
      en: "Same as glTexParameteri, for parameters whose value is one or more floats. The classic use is GL_TEXTURE_BORDER_COLOR together with GL_CLAMP_TO_BORDER: in shadow mapping a white border (depth 1.0) makes everything outside the shadow map count as lit.",
      pt: "Igual a glTexParameteri, para parâmetros cujo valor é um ou mais floats. O uso clássico é GL_TEXTURE_BORDER_COLOR junto com GL_CLAMP_TO_BORDER: no shadow mapping uma borda branca (profundidade 1.0) faz tudo fora do shadow map contar como iluminado.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "Target of the bound texture.", pt: "Target da textura ligada." } },
      {
        name: "pname", type: "GLenum",
        desc: { en: "Which parameter.", pt: "Qual parâmetro." },
        values: [
          { name: "GL_TEXTURE_BORDER_COLOR", desc: { en: "RGBA color returned outside the texture with GL_CLAMP_TO_BORDER (4 floats).", pt: "Cor RGBA retornada fora da textura com GL_CLAMP_TO_BORDER (4 floats)." } },
          { name: "GL_TEXTURE_MAX_ANISOTROPY", desc: { en: "Anisotropic filtering level, e.g. 16 (GL 4.6).", pt: "Nível de filtragem anisotrópica, ex.: 16 (GL 4.6)." } },
          { name: "GL_TEXTURE_LOD_BIAS", desc: { en: "Shifts mip selection sharper (negative) or blurrier.", pt: "Desloca a escolha de mipmap para mais nítido (negativo) ou mais borrado." } },
        ],
      },
      { name: "params", type: "const GLfloat *", desc: { en: "Pointer to the value(s).", pt: "Ponteiro para o(s) valor(es)." } },
    ],
    example: `float border[] = { 1.0f, 1.0f, 1.0f, 1.0f };
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_BORDER);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_BORDER);
glTexParameterfv(GL_TEXTURE_2D, GL_TEXTURE_BORDER_COLOR, border);`,
    related: ["glTexParameteri"],
    khronos: `${KHR}glTexParameter.xhtml`,
  },
  {
    name: "glGenerateMipmap",
    category: "textures",
    since: "GL 3.0",
    signature: "void glGenerateMipmap(GLenum target);",
    summary: {
      en: "Builds all the smaller mipmap levels from level 0 of the bound texture.",
      pt: "Gera todos os níveis menores de mipmap a partir do nível 0 da textura ligada.",
    },
    description: {
      en: "Mipmaps are pre-shrunk copies of a texture: 1/2, 1/4, 1/8… of the size. When a surface is far away the GPU samples a small copy, which removes shimmering and is faster. This call computes them all automatically.\n\nCall it after uploading level 0, and again whenever the image changes.",
      pt: "Mipmaps são cópias reduzidas da textura: 1/2, 1/4, 1/8… do tamanho. Quando uma superfície está longe a GPU amostra uma cópia pequena, o que elimina o cintilar e é mais rápido. Esta chamada calcula todas automaticamente.\n\nChame depois de enviar o nível 0, e de novo sempre que a imagem mudar.",
    },
    params: [
      { name: "target", type: "GLenum", desc: { en: "GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_2D_ARRAY…", pt: "GL_TEXTURE_2D, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_2D_ARRAY…" } },
    ],
    errors: [
      { code: "GL_INVALID_OPERATION", when: { en: "The texture is a cube map whose faces are not all the same size/format.", pt: "A textura é um cube map com faces de tamanho/formato diferentes." } },
    ],
    example: `glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glGenerateMipmap(GL_TEXTURE_2D);`,
    related: ["glTexImage2D", "glTexParameteri"],
    khronos: `${KHR}glGenerateMipmap.xhtml`,
  },
];
