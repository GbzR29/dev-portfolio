// PT text for src/lib/tracks/sdl3/chapters/text.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl07_intro: "O SDL básico não consegue desenhar texto nenhum — não há rasterizador de fontes nele. O SDL3_ttf embrulha o FreeType e oferece dois caminhos: renderizar uma string numa surface e enviá-la como textura, ou usar o text engine, que gerencia atlas de glifos para você. O segundo é o que você quer para qualquer coisa que muda a cada frame.",
  sdl07_basicTitle: "O caminho clássico: da string para a textura",
  sdl07_perfWarn: "Nunca faça isso a cada frame. Rasterizar uma string e enviar uma textura é ordens de grandeza mais caro que desenhar uma, então um contador de frames reconstruído 60 vezes por segundo vai custar mais que a sua cena inteira. Guarde a textura em cache e reconstrua-a só quando a string realmente mudar.",
  sdl07_qualityTitle: "Modos de renderização",
  sdl07_h0: "Função",
  sdl07_h1: "Qualidade",
  sdl07_h2: "Use para",
  sdl07_q1: "Serrilhado, bordas de 1 bit",
  sdl07_u1: "Overlays rápidos de debug, fontes de pixel art",
  sdl07_q2: "Antisserrilhado com alfa",
  sdl07_u2: "Tudo o que o jogador lê",
  sdl07_q3: "Antisserrilhamento de subpixel",
  sdl07_u3: "Texto pequeno num LCD de orientação conhecida",
  sdl07_q4: "O mesmo, com quebra de linha",
  sdl07_u4: "Parágrafos — passe uma largura de quebra em pixels",
  sdl07_engineTitle: "O text engine",
  sdl07_engineBody: "O SDL3_ttf acrescentou uma API de objetos de texto que mantém os glifos num atlas e só refaz a composição do que mudou. Você cria um engine ligado ao seu renderer, cria objetos TTF_Text e atualiza as strings deles — a biblioteca cuida do cache, então mudar o texto a cada frame é barato.",
  sdl07_engineNote: "Há variantes do engine para os diferentes caminhos de renderização — uma para o SDL_Renderer, uma que produz surfaces e uma que entrega a geometria crua para você alimentar o SDL_GPU ou o OpenGL por conta própria. Confira os headers do SDL3_ttf para ver o conjunto exato disponível na sua versão.",
  sdl07_metricsTitle: "Medindo e diagramando",
  sdl07_dpiTip: "Abra a fonte no tamanho em que você vai realmente desenhá-la. Rasterizar em 16pt e escalar a textura para 32 dá um resultado borrado — reabra a fonte no novo tamanho e, em telas de alta densidade, multiplique o tamanho em pontos pela escala da tela obtida com SDL_GetWindowDisplayScale.",
};

export default text;
