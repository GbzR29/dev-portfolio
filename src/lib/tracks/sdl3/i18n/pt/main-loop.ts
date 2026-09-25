// PT text for src/lib/tracks/sdl3/chapters/main-loop.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl03_intro: "O game loop clássico é dono do processo: o seu while roda até o jogador sair. Esse modelo quebra em plataformas em que o sistema operacional é dono do loop e chama você — o navegador, o iOS e o Android funcionam assim. Os main callbacks do SDL3 invertem o fluxo de controle para que um único arquivo-fonte rode em todo lugar.",
  sdl03_problemTitle: "Por que o while é um problema de portabilidade",
  sdl03_problemBody: "No navegador, o JavaScript é single-threaded e a página precisa voltar ao event loop para que qualquer coisa seja desenhada. Um while(true) em C++ compilado para WebAssembly congela a aba. O contorno do Emscripten é entregar o corpo do seu loop ao requestAnimationFrame, que é exatamente o que os callbacks do SDL3 padronizam.",
  sdl03_callbacksTitle: "Os quatro callbacks",
  sdl03_h0: "Função",
  sdl03_h1: "Chamada",
  sdl03_c1: "Uma vez, na inicialização. Aloque o seu estado e guarde-o em appstate.",
  sdl03_c2: "Uma vez por evento, conforme chegam. Nenhum loop de polling seu.",
  sdl03_c3: "Uma vez por frame. Atualize e renderize aqui.",
  sdl03_c4: "Uma vez, no encerramento, seja qual for a causa. Libere tudo.",
  sdl03_returnBody: "Todo callback devolve um SDL_AppResult: SDL_APP_CONTINUE para continuar rodando, SDL_APP_SUCCESS para sair normalmente, SDL_APP_FAILURE para sair com erro. Não há flag global de execução nem break manual.",
  sdl03_bothNote: "Os dois modelos são totalmente suportados — o while clássico não está obsoleto. Use callbacks se um dia você puder publicar para a web ou para mobile, ou se quiser que o SDL cuide do ritmo dos frames. Use o while se estiver integrando o SDL a uma engine existente que já é dona do seu loop.",
  sdl03_timestepTitle: "Passo de tempo fixo",
  sdl03_timestepBody: "Física avançada por um delta time variável não é determinística: a mesma entrada produz resultados diferentes a 60 e a 144 quadros por segundo, e um único frame longo pode empurrar objetos através de paredes. Acumule o tempo real e consuma-o em fatias fixas.",
  sdl03_spiralWarn: "O limite não é opcional. Sem ele, um frame que levou dois segundos enfileira 120 passos de física, que levam mais que um frame, que enfileiram ainda mais — a espiral da morte. Limitar o tempo acumulado faz a simulação rodar em câmera lenta por um instante, em vez de travar.",
};

export default text;
