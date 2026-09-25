// PT text for src/lib/tracks/opengl/chapters/setup.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  oglSetup_intro: "OpenGL é uma especificação, não uma biblioteca. Não existe um opengl.dll contra o qual você linka que contenha as funções modernas — a implementação vive dentro do driver gráfico, e os pontos de entrada precisam ser buscados em tempo de execução. Além disso, o OpenGL não sabe nada sobre janelas, teclados ou monitores. Duas bibliotecas extras preenchem essas lacunas, e este capítulo configura as duas.",
  oglSetup_piecesTitle: "As três peças",
  oglSetup_h0: "Peça",
  oglSetup_h1: "Fornece",
  oglSetup_h2: "Escolha comum",
  oglSetup_p1: "Janela + contexto",
  oglSetup_p1b: "Cria a janela, o contexto OpenGL e entrega os eventos de entrada.",
  oglSetup_p2: "Loader de funções",
  oglSetup_p2b: "Resolve os ponteiros de função do driver para que glDrawArrays sequer exista.",
  oglSetup_p3: "Matemática",
  oglSetup_p3b: "Vetores, matrizes e os helpers de projeção. O OpenGL não tem API de matemática.",
  oglSetup_loaderNote: "O loader não é opcional nem é uma conveniência. Seu sistema operacional traz headers para OpenGL 1.1 (Windows) ou uma base antiga (Linux, macOS). Tudo o que veio depois — toda função desta trilha — precisa ser buscado no driver pelo nome em tempo de execução. O GLAD gera o código que faz isso.",
  oglSetup_gladTitle: "Gerando o GLAD",
  oglSetup_gladBody: "O GLAD é gerado, não baixado. Você escolhe a versão da API e o profile na página do gerador e ele produz um header mais um arquivo C feitos sob medida para exatamente as funções que essa versão expõe. Para esta trilha: OpenGL, versão 4.6, Core profile.",
  oglSetup_cmakeTitle: "O arquivo de build",
  oglSetup_contextTitle: "Criando o contexto",
  oglSetup_contextBody: "As hints da janela precisam ser definidas antes de a janela ser criada — elas descrevem o contexto que você quer, e o GLFW não consegue mudá-las depois. Pedir o Core profile é o que remove a API legada discutida no capítulo um.",
  oglSetup_orderWarn: "Três regras de ordem causam quase todas as falhas de setup. glad.h precisa ser incluído antes de glfw3.h, ou o GLFW puxa o header GL do sistema primeiro e você recebe centenas de erros de redefinição. glfwMakeContextCurrent precisa rodar antes de gladLoadGLLoader, porque o loader consulta o contexto atual. E nenhuma chamada gl* é válida antes de o loader rodar — chamar uma dá um crash por ponteiro de função nulo.",
  oglSetup_loopTitle: "O render loop e o redimensionamento",
  oglSetup_dpiTip: "Use o callback de tamanho do FRAMEBUFFER, não o de tamanho da janela. Em uma tela de alta densidade (high-DPI) o framebuffer é maior que a janela em unidades lógicas — uma janela de 1280x720 pode ter um framebuffer de 2560x1440 — e glViewport trabalha em pixels. Errar isso renderiza a cena no quarto inferior esquerdo da tela num Mac com Retina.",
  oglSetup_checkTitle: "Verificação básica",
  oglSetup_checkBody: "Se a janela abre e mostra sua cor de limpeza, está tudo ligado corretamente e você pode seguir em frente. Se ela abre branca ou preta, a cor de limpeza não está sendo aplicada — confira se glClear roda dentro do loop e se glfwSwapBuffers é chamado depois de desenhar, não antes.",
};

export default text;
