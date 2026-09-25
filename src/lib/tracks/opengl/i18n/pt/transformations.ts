// PT text for src/lib/tracks/opengl/chapters/transformations.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch08_intro: "Tudo desenhado até agora está em coordenadas NDC fixas. Para mover, rotacionar e escalar objetos — e posicionar uma câmera — você precisa de matemática matricial. GLM é a biblioteca header-only em C++ que espelha os tipos matemáticos do GLSL.",
  ch08_glmTitle: "Adicionando GLM ao seu projeto",
  ch08_mvpTitle: "As matrizes MVP",
  ch08_mvpBody: "Cada vértice passa por três transformações antes de chegar à tela. Cada uma é uma matriz 4×4 multiplicadas em ordem inversa: gl_Position = Projeção × View × Model × vértice.",
  mvpHeader0: "Matriz",
  mvpHeader1: "Propósito",
  mvpHeader2: "Função GLM",
  mvpModel: "Posiciona o objeto no espaço do mundo (translate / rotate / scale)",
  mvpView: "Simula uma câmera — transforma espaço do mundo em espaço da câmera",
  mvpProjection: "Aplica perspectiva — objetos distantes aparecem menores",
  ch08_modelTitle: "Matriz Model — posicionando objetos",
  ch08_modelBody: "Comece com uma matriz identidade e aplique transformações. Ordem importa: escale primeiro, depois rotacione, depois translacione.",
  ch08_orderBody: "Por que a ordem importa tanto? Porque rotação e escala sempre acontecem em torno da origem (0, 0, 0). Dê play na figura abaixo: as mesmas duas operações, em ordens opostas, dão dois resultados bem diferentes.",
  ch08_orderCode: "Cada chamada da glm multiplica a nova matriz pela direita: model = model × M. Então a chamada que você escreve por último é a que toca o vértice primeiro. Para escalar, depois rotacionar, depois transladar, escreva-as na ordem oposta:",
  ch08_viewTitle: "Matriz View — câmera",
  ch08_viewBody: "glm::lookAt recebe três vetores: posição da câmera (eye), o ponto que ela olha (center) e qual direção é para cima (up). Retorna a view matrix.",
  ch08_projTitle: "Matriz de projeção — perspectiva",
  ch08_projBody: "glm::perspective cria um frustum onde objetos mais distantes aparecem menores. Argumentos: FOV vertical em radianos, proporção da janela e planos near/far.",
  ch08_frustumBody: "Esses quatro números descrevem um volume chamado view frustum: uma pirâmide com a ponta cortada. Tudo dentro dele acaba na tela, tudo fora é cortado (clipping). Gire a figura abaixo e depois troque para ortográfica para ver a pirâmide virar uma caixa.",
  ch08_perspEqLabel: "glm::perspective(fov, aspect, n, f)",
  ch08_wT: "tan(fov / 2) — o quanto o frustum se abre",
  ch08_wA: "aspect = largura / altura",
  ch08_wNF: "planos near e far",
  ch08_perspEqNote: "A última linha é o truque todo: ela copia −z para w. Depois que a GPU divide por w, x e y encolhem com a distância — isso é perspectiva — e z cai em [−1, 1].",
  ch08_nearWarn: "Nunca defina o plano near como 0. Isso causa z-fighting porque a precisão do depth buffer é distribuída entre near e far — um near de 0 dá precisão zero.",
  ch08_shaderTitle: "Aplicando MVP no vertex shader",
  ch08_animTip: "Para animar a rotação, multiplique o ângulo por glfwGetTime() a cada frame. O modelo girará continuamente sem estado extra.",
};

export default text;
