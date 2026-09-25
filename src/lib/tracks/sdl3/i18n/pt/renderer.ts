// PT text for src/lib/tracks/sdl3/chapters/renderer.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl05_intro: "O SDL_Renderer é uma API 2D acelerada por hardware que roda sobre o backend que a plataforma oferecer — Direct3D, Metal, Vulkan ou OpenGL. Você ganha sprites, formas e blending sem escrever um único shader. Para um jogo 2D, muitas vezes é tudo de que você precisa, e é o jeito mais rápido de colocar algo na tela enquanto aprende o resto.",
  sdl05_basicsTitle: "Limpar, desenhar, apresentar",
  sdl05_alphaTip: "O alfa em SDL_SetRenderDrawColor não faz nada até você ligar o blending com SDL_SetRenderDrawBlendMode(r, SDL_BLENDMODE_BLEND). O padrão é SDL_BLENDMODE_NONE, que grava o alfa direto no destino e parece que foi ignorado.",
  sdl05_logicalTitle: "Apresentação lógica — independência de resolução",
  sdl05_logicalBody: "Em vez de escalar cada coordenada pelo tamanho da janela, diga ao SDL para qual resolução você projetou e deixe-o colocar tarjas ou esticar. O código do jogo passa a trabalhar num espaço de coordenadas fixo, não importa o que a janela faça, inclusive em tela cheia e em telas de alta densidade.",
  sdl05_h0: "Modo",
  sdl05_h1: "Comportamento",
  sdl05_m1: "Mantém a proporção, acrescenta barras pretas. O padrão seguro.",
  sdl05_m2: "Mantém a proporção, corta o excesso. Sem barras, perde as bordas.",
  sdl05_m3: "Só escala por números inteiros. A escolha certa para pixel art.",
  sdl05_m4: "Preenche a janela, distorce a proporção.",
  sdl05_m5: "Sem escala — você cuida disso.",
  sdl05_vsyncTitle: "VSync e ritmo dos frames",
  sdl05_geomTitle: "Geometria personalizada",
  sdl05_geomBody: "SDL_RenderGeometry recebe vértices crus com posições, cores e coordenadas de textura. É a saída de emergência quando retângulos não bastam — quads rotacionados, rastros, sistemas de partículas simples e interfaces imediatas são todos construídos sobre ele.",
  sdl05_limitWarn: "O SDL_Renderer não tem shaders, nem renderização para múltiplos alvos, nem compute. Se você precisa de iluminação, pós-processamento ou qualquer coisa personalizada por pixel, é nesse ponto que você passa para o SDL_GPU ou para o OpenGL — o SDL_Renderer é, de propósito, um pipeline de sprites, não uma API gráfica genérica.",
};

export default text;
