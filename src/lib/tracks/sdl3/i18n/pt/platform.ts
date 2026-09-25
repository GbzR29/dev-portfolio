// PT text for src/lib/tracks/sdl3/chapters/platform.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  sdl10_intro: "Os últimos vinte por cento de lançar um jogo são tudo o que está em volta do jogo: onde fica o arquivo de save em cada plataforma, como o log é escrito, o que acontece num notebook com tela de 90 Hz. O SDL cobre a maior parte disso, e usar as abstrações dele em vez das da plataforma é o que torna o port para a próxima plataforma algo sem surpresas.",
  sdl10_timeTitle: "Tempo",
  sdl10_refreshTip: "Não fixe 60 FPS no código. Consulte o modo de tela com SDL_GetCurrentDisplayMode e leia o refresh_rate — os jogadores têm telas de 60, 90, 120, 144 e 165 Hz, e um jogo que presume 60 ou roda na metade da velocidade ou gasta bateria renderizando frames que ninguém vê.",
  sdl10_fsTitle: "Arquivos e dados de save",
  sdl10_fsBody: "Escrever ao lado do executável falha no momento em que o jogo é instalado em Arquivos de Programas ou num pacote de app somente leitura. O SDL oferece os dois diretórios que toda plataforma realmente tem: onde estão os seus assets e onde você tem permissão para escrever.",
  sdl10_storageNote: "O SDL3 também acrescenta uma abstração de armazenamento — SDL_OpenTitleStorage para o conteúdo somente leitura do jogo e SDL_OpenUserStorage para os saves. No desktop é uma camada fina sobre o sistema de arquivos; nos consoles, corresponde à API de save certificada da plataforma. Usá-la desde o início transforma o sistema de save de um port para console de uma reescrita numa mudança de configuração.",
  sdl10_threadTitle: "Threads",
  sdl10_threadBody: "O SDL tem threads, mutexes e variáveis de condição porque precisa suportar C. Num projeto C++, prefira std::jthread e std::mutex — são RAII, integram-se ao resto da biblioteca padrão e o ThreadSanitizer os entende. A única regra do SDL que se sobrepõe a tudo: todas as chamadas de janela, renderer e eventos precisam acontecer na thread que chamou SDL_Init.",
  sdl10_threadWarn: "Criar uma janela, desenhar ou processar eventos a partir de uma thread de trabalho é comportamento indefinido e falha de um jeito diferente em cada plataforma — o macOS, em particular, exige chamadas de interface na thread principal. SDL_PushEvent é explicitamente thread-safe e é o caminho previsto para uma thread de trabalho falar com o loop principal.",
  sdl10_hintsTitle: "Hints e log",
  sdl10_errWarn: "SDL_GetError devolve o último erro definido na thread atual, e ele não é limpo por uma chamada bem-sucedida. Leia-o logo depois da função que falhou — conferir mais tarde traz uma mensagem velha de uma chamada sem relação, o que manda você depurar o subsistema errado.",
  sdl10_shipTitle: "Publicando",
  sdl10_h0: "Plataforma",
  sdl10_h1: "No que prestar atenção",
  sdl10_p1: "Distribua o SDL3.dll ao lado do executável. O SDL_main.h fornece o WinMain para você.",
  sdl10_p2: "Inclua a dylib dentro do .app e depois assine e notarize, senão ele não abre.",
  sdl10_p3: "Prefira o SDL3 do sistema ao empacotar; inclua-o junto para a Steam ou num AppImage.",
  sdl10_p4: "Emscripten. Os main callbacks são praticamente obrigatórios — um loop bloqueante trava a aba.",
  sdl10_p5k: "Mobile",
  sdl10_p5: "Trate SDL_EVENT_WILL_ENTER_BACKGROUND — libere os recursos da GPU ou o app é encerrado.",
  sdl10_nextTip: "Daqui, as duas direções naturais são subir e descer na pilha. Para baixo: as trilhas de OpenGL e GLSL, para ver o que realmente acontece quando você envia uma draw call. Para cima: construa algo pequeno e termine — um Pong completo, com som, menu e arquivo de save, vai te ensinar mais sobre a camada de plataforma do que qualquer leitura adicional.",
};

export default text;
