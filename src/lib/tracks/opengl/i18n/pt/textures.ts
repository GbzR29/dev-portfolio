// PT text for src/lib/tracks/opengl/chapters/textures.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch07_intro: "Uma textura é uma imagem 2D armazenada na VRAM da GPU que seu fragment shader pode amostrar por pixel. Dados de vértice sozinhos dão cores sólidas — texturas dão detalhe e fotorrealismo sem adicionar geometria.",
  ch07_uvTitle: "Coordenadas UV / de textura",
  ch07_uvBody: "Cada vértice carrega um par de floats (U, V) que dizem à GPU qual parte da textura mapeia para aquele ponto. Em OpenGL, (0,0) é o canto inferior esquerdo e (1,1) é o canto superior direito.",
  ch07_loadTitle: "Carregando uma imagem com stb_image",
  ch07_loadBody: "stb_image.h é o carregador de imagens padrão para projetos OpenGL. Inclua a implementação uma vez em um arquivo .cpp, depois chame stbi_load para obter os dados raw de pixel.",
  ch07_createTitle: "Criando o objeto de textura",
  texWrapHeader0: "Modo de wrap",
  texWrapHeader1: "Comportamento",
  texRepeat: "Repete a textura em tile. Padrão e mais comum.",
  texClamp: "Estica o pixel da borda. Bom para sprites de UI.",
  texMirror: "Repete em tile mas espelha alternadamente.",
  ch07_texFig: "Esses parâmetros ficam mais fáceis de escolher depois que você os vê. Cada pixel da figura abaixo é calculado do jeito que a GPU amostra uma textura — troque de aba para comparar modos de wrap, filtros de ampliação e mipmaps.",
  ch07_shaderTitle: "Amostrando no fragment shader",
  ch07_bindTitle: "Vinculando a textura antes de desenhar",
  ch07_unitsNote: "O OpenGL suporta pelo menos 16 unidades de textura simultâneas (GL_TEXTURE0 a GL_TEXTURE15). Ative uma unidade, vincule uma textura a ela e diga ao uniform sampler qual unidade usar. É assim que se usam múltiplas texturas em um draw call.",
};

export default text;
