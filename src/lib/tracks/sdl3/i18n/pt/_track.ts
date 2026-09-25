// PT chapter titles and section names for the sdl3 track (see sdl3/index.tsx).

const track = {
  titles: {
    "whats-new": "SDL3 vs. SDL2",
    setup: "Configuração e primeira janela",
    "main-loop": "O loop principal",
    input: "Eventos e entrada",
    renderer: "O renderer 2D",
    textures: "Texturas e imagens",
    text: "Texto com SDL3_ttf",
    audio: "Streams de áudio",
    gpu: "SDL_GPU — gráficos modernos",
    platform: "Tempo, arquivos e publicação",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Input & 2D": "Entrada e 2D",
    "Audio & Graphics": "Áudio e gráficos",
    Shipping: "Publicação",
  } as Record<string, string>,
};

export default track;
