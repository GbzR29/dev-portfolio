// PT text for src/lib/tracks/sdl3/chapters/setup.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl02_intro: "Colocar o SDL3 num projeto é a parte que a maioria dos tutoriais faz mal. O caminho recomendado hoje é CMake com FetchContent: nenhuma instalação no sistema, nenhuma caça a pacotes de desenvolvimento, e a versão exata que você fixou é a que toda máquina compila.",
  sdl02_cmakeTitle: "O arquivo de build",
  sdl02_installTip: "Se o SDL3 já estiver instalado no sistema (vcpkg, um pacote da distro ou um build manual), troque o bloco FetchContent por find_package(SDL3 REQUIRED). O nome do target, SDL3::SDL3, é o mesmo nos dois casos, então o resto do arquivo nunca muda.",
  sdl02_windowTitle: "Uma janela que fecha direito",
  sdl02_mainWarn: "O SDL_main.h deve ser incluído em exatamente um arquivo — o que contém o main. Ele redefine main como SDL_main para que o SDL instale o ponto de entrada de que a plataforma precisa no Windows, no iOS e no Android. Pular isso produz um programa que linka mas nunca inicia no Windows, ou um erro de WinMain não resolvido.",
  sdl02_subsysTitle: "Subsistemas e inicialização",
  sdl02_h0: "Flag",
  sdl02_h1: "Inicializa",
  sdl02_s1: "Janelas, a lista de telas e o sistema de eventos do qual dependem.",
  sdl02_s2: "Dispositivos e streams de áudio.",
  sdl02_s3: "Gamepads. Implica o subsistema de joystick.",
  sdl02_s4: "Dispositivos de force feedback e vibração.",
  sdl02_s5: "Captura de webcam — novo no SDL3.",
  sdl02_subsysBody: "Combine as flags com um ou bit a bit. Não existe mais SDL_INIT_TIMER — a medição de tempo está sempre disponível. Os subsistemas também podem ser iniciados depois com SDL_InitSubSystem, o que vale a pena fazer com o áudio, para que uma máquina sem dispositivo de som não impeça a sua janela de abrir.",
  sdl02_raiiTitle: "Embrulhando em RAII",
  sdl02_raiiBody: "O SDL é uma API em C, então todo Create tem um Destroy correspondente que você precisa chamar em todo caminho de saída. Um unique_ptr com um deleter sem estado elimina esse fardo por completo e não custa nada em tempo de execução.",
  sdl02_orderTip: "A ordem de destruição importa: o renderer precisa morrer antes da janela, e toda textura antes do seu renderer. Declarar os membros de uma classe na ordem de criação dá isso de graça, porque o C++ destrói os membros na ordem inversa da declaração.",
};

export default text;
