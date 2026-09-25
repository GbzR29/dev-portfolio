// PT text for src/lib/tracks/sdl3/chapters/textures.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl06_intro: "O SDL tem dois tipos de imagem, e eles vivem em lugares diferentes. Uma SDL_Surface são pixels na RAM do sistema, que a CPU pode ler e escrever. Uma SDL_Texture são pixels na memória da GPU, que o renderer desenha rápido, mas em que você não mexe com facilidade. Carregar significa criar uma surface, enviá-la e jogar a surface fora.",
  sdl06_h0: "",
  sdl06_r0: "Fica em",
  sdl06_r1: "RAM do sistema",
  sdl06_r2: "Memória da GPU",
  sdl06_r3: "Acesso aos pixels",
  sdl06_r4: "Direto — leitura e escrita",
  sdl06_r5: "Só com lock, ou texturas de streaming",
  sdl06_r6: "Velocidade de desenho",
  sdl06_r7: "Lenta — blit na CPU",
  sdl06_r8: "Rápida — acelerada por hardware",
  sdl06_r9: "Use para",
  sdl06_r10: "Carregamento e trabalho por pixel",
  sdl06_r11: "Tudo o que você realmente desenha",
  sdl06_loadTitle: "Carregando uma imagem",
  sdl06_drawTitle: "Desenhando sprites",
  sdl06_pixelTip: "Para pixel art, chame SDL_SetTextureScaleMode(tex, SDL_SCALEMODE_NEAREST). O padrão é filtragem linear, que borra todo sprite no momento em que ele não é desenhado exatamente em 1:1. Combine com a apresentação lógica INTEGER_SCALE para um resultado limpo em qualquer tamanho de janela.",
  sdl06_targetTitle: "Render targets",
  sdl06_targetBody: "Uma textura criada com SDL_TEXTUREACCESS_TARGET pode receber desenhos. Isso dá um buffer fora da tela para um minimapa, uma camada de tiles em cache que só precisa ser redesenhada quando o mundo muda, ou um buffer de resolução fixa que você amplia no fim do frame.",
  sdl06_streamTitle: "Texturas de streaming",
  sdl06_streamBody: "Quando a CPU gera os pixels a cada frame — um rasterizador em software, um raytracer, um decodificador de vídeo —, use uma textura de streaming e escreva direto na memória travada dela.",
  sdl06_pitchWarn: "Sempre indexe as linhas usando o pitch informado por SDL_LockTexture, nunca a largura vezes os bytes por pixel. Os drivers acrescentam preenchimento às linhas por alinhamento, então presumir um layout compacto produz uma imagem inclinada em algumas GPUs e correta na sua — o pior tipo de bug para depurar à distância.",
};

export default text;
