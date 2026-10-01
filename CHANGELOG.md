# Changelog

Registro datado de tudo o que foi feito e criado no site.

- As datas são as dos commits (fuso local, AAAA-MM-DD). Um trabalho feito em vários dias e commitado de uma vez aparece na data do commit.
- A data de criação e de última atualização de cada lição também aparece no topo da própria lição. Ela é gerada do histórico do git por `scripts/gen-chapter-dates.mjs` (`npm run dates`, que também roda antes de `dev` e `build`) e fica em `src/lib/generated/chapter-dates.json`.
- Para registrar algo novo, acrescente uma entrada no topo, com a data.

Totais em 2026-10-01: 9 trilhas e 240 lições (OpenGL 69 · Matemática 61 · GLSL 24 · Algoritmos 24 · Vulkan 16 · C++ 15 · Game Dev 12 · SDL3 10 · IA 9).

---

## Outubro de 2026

### 2026-10-01

- **OpenGL, GLuint e os tipos GL (pedido do usuário)**: *Vertex Buffer Objects* ganhou a subseção "Por que GLuint e não unsigned int". Ela explica que o GLuint é um `typedef` de `unsigned int` com 32 bits garantidos pela especificação (o C++ só garante 16). Também traz uma tabela da família de tipos GL (GLuint, GLint, GLsizei, GLenum, GLfloat, GLboolean, GLsizeiptr: tipo no desktop, tamanho e para que serve) e uma dica de qual escrever: tipos GL onde o código fala com o OpenGL, combinando com o enum, como em GL_UNSIGNED_INT. A dica avisa que tutoriais como o LearnOpenGL escrevem `unsigned int`. *Primeiros shaders* ganhou "Funções que retornam um GLuint": o padrão criar → configurar → retornar o nome, quem é dono e apaga, 0 como "falhou" (um `makeProgram` mais rigoroso com tabela linha a linha), por que copiar um nome não copia o objeto (nome morto, número reaproveitado pelo driver, zerar depois do delete) e uma tabela de funções (compileShader, makeProgram, makeBuffer, loadTexture, makeMesh devolvendo uma struct). A classe RAII fica para depois. *O pipeline gráfico* passou a usar `GLuint`/`GLint` no código de compilar e linkar, como os capítulos vizinhos. Uma ideia-chave nova em cada capítulo. Tradução PT completa.

- **OpenGL, *Janela e contexto* e *O pipeline gráfico* — clareza e "programando junto" (pedido do usuário)**: *Janela e contexto* agora diz logo no início que a trilha usa C++ com GLFW + GLAD + GLM (CMake). Também ganhou: o `main.cpp` inteiro do capítulo num arquivo só (passos numerados 1–6, com o lugar de cada coisa que os próximos capítulos acrescentam); uma dica sobre GLAD 1 × GLAD 2; e uma seção "Usando outra biblioteca de janelas", com uma tabela GLFW × SDL3 × SFML 3, o mesmo programa completo em SDL3 e em SFML 3 e o que muda no LWJGL (sem GLAD, `GL.createCapabilities()`). Fecha com o roteiro "programando junto": o que cada capítulo até *Desenhando o triângulo* acrescenta ao `main.cpp` e o que se vê ao rodar. Em *O pipeline gráfico*, o texto do vertex shader foi reescrito em frases curtas, com uma tabela linha a linha do shader e um parágrafo próprio para o w ("o que é o w, e por que 1"). O texto de NDC foi dividido e ganhou um exemplo com números. Entrou também como os shaders viram strings em C++ (raw string literal, depois arquivos), onde o código de compilar/linkar entra no `main.cpp` e o que esperar ao rodar. O passo "vertex shader" da fig. 3.1 agora explica o w. Depois, a pedido do usuário, *O pipeline gráfico* ganhou a subseção "Shaders em arquivos próprios": a pasta `shaders/` com `.vert`/`.frag`, uma função `readFile` explicada linha a linha, por que um caminho relativo falha (o diretório de trabalho é a pasta de build), o `SHADER_DIR` vindo do CMake (`target_compile_definitions`), como distribuir (copiar a pasta para junto do executável) e duas armadilhas (`c_str()` de uma string temporária, arquivo salvo com BOM). Também entrou uma linha nova na tabela de erros comuns. Por fim, a subseção "O que o OpenGL realmente recebe: const char*": texto em C como bytes terminados em '\0', a declaração do `glShaderSource` argumento por argumento (vários pedaços, `length` NULL, o driver copia o texto), um exemplo que põe `#version`/`#define` na frente de um arquivo, uma tabela `const char*` × `std::string` × `std::ifstream` × `std::stringstream` (com os equivalentes em Java), a cadeia arquivo → driver do `readFile` e uma tabela de como ler e entregar o shader em C, C++, Java/Kotlin (LWJGL), C# (OpenTK), Python, Rust e JavaScript (WebGL). Tradução PT completa.

- **GLSL, passada de explicação (lote 4, completo — *Signed Distance Functions*, *The Shader Playground*, *Types & Vectors*, *Shader Class in C++*, *Built-in Functions*, *Texturing Tricks*, *Fragment Coordinates & UV*, *Toon, Dissolve & Hologram*, *Patterns & Transformations* e *Colour*)**: *Signed Distance Functions* ganhou o anti-aliasing calculado pixel a pixel, o SDF da caixa linha por linha com três pontos resolvidos, por que a caixa arredondada funciona, união/interseção/subtração com números, a legenda e um exemplo resolvido do smin, onion e glow com números e uma tabela de erros comuns; o smoothstep com bordas invertidas virou a forma portável. *The Shader Playground* ganhou um primeiro shader comentado linha a linha (brilho seguindo o mouse + paleta), a leitura das anotações de slider, uma tabela ShaderToy → playground, as contas das vistas de depuração (normal * 0,5 + 0,5, fract, NaN) e uma tabela de erros comuns conferida com o motor do playground. *Types & Vectors* ganhou a precisão do float na prática, aritmética de vetores componente a componente com números, as regras do swizzle, a ordem de coluna com uma matriz 2×2 multiplicada à mão e uma tabela de erros comuns; a tabela de tipos escalares passou a ser traduzida, e foi corrigida a frase "o GLSL não tem conversões implícitas" (o GLSL de desktop tem algumas; o GLSL ES não tem). *Texturing Tricks* ganhou uv × coordenada de texel × centro do texel, os modos de wrap, a escolha do mip calculada (parede de 256 px com textura de 1024), a legenda e os pesos do triplanar com k = 1, 4 e 8, a distorção em texels e uma tabela de erros comuns. *Built-in Functions* ganhou contas resolvidas para funções componente a componente, arredondamento de negativos, mod do GLSL × fmod do C, mix, step, smoothstep, length/normalize/dot/reflect e radianos, além de uma tabela de erros comuns; código corrigido: `uTime * 2.0` dizia "uma volta por segundo" (era uma a cada π s). *Patterns* e *Colour* ganharam a legenda que faltava (o, s, M⁻¹, θ, n, fract, hash, r, θ'), contas resolvidas para mover e escalar um círculo, a rotação de 90°, o id e as coordenadas locais de um ladrilho, a dobra polar, a paleta de cossenos canal a canal, HSV → RGB do amarelo, a curva sRGB em 0,5 e a mistura vermelho + verde em sRGB × linear, os modos de mesclagem com números e duas tabelas de erros comuns. *Toon, Dissolve & Hologram* ganhou a legenda completa da fórmula (N, L, V, H, floor, s, p), as faixas do toon calculadas com n = 3, o brilho duro e o rim com números, o dissolve resolvido com τ = 0,4, por que o ruído vai no espaço do objeto, o holograma termo a termo (Fresnel, linhas, cintilação, mistura aditiva) e uma tabela de erros comuns. *Fragment Coordinates* passou de ~290 para ~1150 palavras: tabela dos componentes de gl_FragCoord (x, y, z, w com exemplos), UV com números, por que o UV puro deforma círculos, a fórmula de centralização passo a passo com pixels resolvidos, o círculo via distância com sinal e smoothstep, a espiral animada termo a termo com um pixel calculado, framebuffer × janela em telas de alta densidade, tabela de qual coordenada usar e de erros comuns; faltava `out vec4 FragColor` nos códigos. *Shader Class*: capítulo reescrito de ~190 para ~1100 palavras. O que entrou: por que strings no C++ atrapalham (rebuild, editor, linhas do log), o ID 0 como "nenhum program", ok(), cada argumento dos setters de uniform (location -1, sufixos, count, GL_FALSE, value_ptr), como ler o log do driver, um frame resolvido com uniform pulsando calculado em números, tabela de escolhas (strings × arquivos × embutido × cache de locations) e tabela de erros comuns. Código corrigido: o hot reload tinha um `catch` que nunca disparava (o construtor não lançava exceção), dizia usar uma thread que não existia e observava só o vertex shader. Agora troca o program só quando a nova montagem dá ok(), observa os dois arquivos e tolera arquivo ausente durante o salvamento. Também foram implementados os setters que estavam só declarados no header. Tradução PT completa.

- **Correção, *Gamma Correction* (fig. "Gamma — your monitor is not linear")**: o teste de 50% de luz usava um xadrez preto/branco de 1 pixel físico, o pior padrão para a inversão de polaridade dos painéis LCD (fazia a tela inteira cintilar em alguns monitores) e que virava moiré em escala fracionária (125%, 150%). Agora são listras horizontais de 2 pixels físicos, desenhadas exatamente na resolução do dispositivo e redesenhadas quando o zoom muda; continuam emitindo exatamente 50% da luz.

- **OpenGL, passada de explicação (lote 3 — OpenGL avançado e moderno)**: *Direct State Access*, *Instancing*, *Framebuffers & Post-FX*, *Uniform Buffer Objects* e *Compute Shaders* reescritos no padrão atual (legenda para cada símbolo, exemplos resolvidos à mão, tabela de escolhas do código, erros comuns), passando de ~220–365 para ~1190–1440 palavras cada. Conteúdo novo: pontos de bind como estado global e o bug de uma função auxiliar rastreado linha a linha, `glCreate*` × `glGen*`, armazenamento imutável e suas flags, o número de níveis de mipmap (⌊log₂ n⌋ + 1), VAOs DSA separando formato e binding, editar × usar; o custo de um draw call, a fórmula do divisor com baseInstance, o mat4 como quatro vec4 lido byte a byte, um anel de 10 000 asteroides em números e o orphaning; o que é um framebuffer, textura × renderbuffer, a memória de um alvo 1080p, o viewport, o triângulo de tela cheia bit a bit e a convolução 3×3 com um pixel calculado; a regra de offset do std140 como fórmula, um bloco inteiro calculado em std140/std430/C++, pontos de binding e o alinhamento de offset (256); o ID global montado a partir dos outros, o arredondamento de um dispatch 1921×1080, os bits de glMemoryBarrier pelo consumidor, memória shared e barrier() com uma redução paralela, e o SSBO desenhado como vértices (código corrigido). *Compute Shaders* foi para o seu próprio módulo (`chapters/compute.tsx`). Widgets novos: "uma função auxiliar rouba o binding" (bind-to-edit × DSA), atributos → pontos de binding → buffers com troca de malha, qual elemento cada instância lê (divisor e baseInstance), quad × triângulo de tela cheia com os blocos 2×2 sombreados duas vezes, o layout byte a byte de um bloco editável em std140/std430/C++, e a grade de um dispatch com a sobra e os IDs de cada invocação. Textos e widgets com tradução PT completa.

## Setembro de 2026

### 2026-09-30

- **OpenGL, passada de explicação (lote 2 — Iluminação avançada)**: *Blinn-Phong*, *Gamma Correction*, *Normal Mapping*, *HDR & Tone Mapping*, *Bloom*, *Deferred Shading* e *Point Shadows* reescritos no padrão atual (legenda para cada símbolo, exemplos resolvidos à mão, tabela de escolhas do código, erros comuns), passando de ~200–460 para ~1050–1450 palavras cada. Conteúdo novo: o vinco do Phong e a dedução do "expoente ×4" pela aproximação gaussiana de cosⁿ; por que a curva de gama foi mantida (31 códigos no 1% mais escuro), um texel iluminado no pipeline certo e no errado, médias e blending; o texel de normal map decodificado, a tangente de um triângulo calculada, o determinante e as UVs espelhadas (tangent.w); formatos float e o que os bits compram, cada operador de tone mapping termo a termo, exposição em stops, um pixel laranja pelos operadores e a exposição automática pela média geométrica; o joelho suave, a origem binomial dos pesos do desfoque (σ = √3), σ√n ao repetir passadas e o truque de duas amostras por leitura bilinear; o custo forward × deferred em 1080p, a memória do G-buffer e o raio de uma luz deduzido e calculado; por que 90°, os vetores up do cube map, como a direção escolhe a face e um fragmento com o seu oclusor (e o bias). Widgets novos: um valor HDR pelas quatro curvas até o byte final, o kernel gaussiano 1D/2D com cobertura e contagem de amostras, a decodificação de um texel de normal map até N·L (com inversão do verde) e o custo forward × deferred × volumes com os seus próprios números. Textos e widgets com tradução PT completa.

- **OpenGL, passada de explicação (lote 1 — Iluminação básica)**: *Light & Color*, *Materials*, *Lighting Maps* e *Multiple Lights* reescritos no padrão atual (cada termo explicado, exemplos resolvidos à mão, tabela de escolhas do código, erros comuns), com cerca de 4× mais texto. Conteúdo novo: o que é a luz (espectro, cones, metâmeros) e por que o produto RGB é uma aproximação da integral espectral; o que cada termo de Phong imita e o shininess como largura do brilho (ângulos de meia intensidade); metais × plásticos e somas acima de 1; mapas por texel, sRGB × linear, outros mapas e empacotamento ORM; superposição, limite de uniforms, o raio de uma luz a partir da atenuação e o custo do forward shading em números. Widgets novos: espectros de luz × refletância comparados ao atalho RGB (luz do dia, incandescente, LEDs, sódio), um fragmento calculado passo a passo numa esfera clicável, três mapas de uma caixa texel a texel, e luzes somando ao longo de um piso (corte em 1, raio e culling). Textos e widgets com tradução PT completa.

- **IA, lote 2**: nova seção **Machine learning clássico**, com *Logistic Regression & Classification*, *Generalisation: Overfitting, Validation & Metrics*, *k-Nearest Neighbours*, *Decision Trees* e *k-Means Clustering*. Dois exemplos novos resolvidos à mão atravessam a seção (seis alunos numa prova por horas de estudo; catorze alunos por horas de estudo e de sono, com dois casos "ruidosos"), e as entregas e os apartamentos do lote 1 voltam na validação cruzada leave-one-out, no k-NN de regressão e na árvore de regressão. Widgets: a sigmoide com o custo −ln p de cada aluno e o passo do gradiente, a fronteira logística em 2D treinando época a época com limiar ajustável, underfitting/overfitting com polinômios de grau 0–9 e os erros de treino × validação, limiar + matriz de confusão + curva ROC/AUC, k-NN com ponto arrastável, regiões e erro leave-one-out por k, a maldição da dimensionalidade (distâncias se concentrando até 1024 dimensões), uma árvore de decisão crescendo por Gini com as caixas e o diagrama, e o k-means passo a passo (início aleatório × k-means++, rastros dos centroides, gráfico do cotovelo). Textos e widgets com tradução PT completa.

- **IA**: nova trilha (inteligência artificial do zero em C++, sem bibliotecas; 24 lições planejadas em 5 seções). Lote 1, seção **Fundamentos**: *What Is AI? Learning from Data*, *Data, Features & Vectors*, *Linear Regression* e *Gradient Descent*, com dois exemplos resolvidos à mão ao longo de todos os capítulos (tempo de entrega por distância; preço de apartamentos por área e quartos). Widgets: mapa da IA (regras, busca, ML supervisionado/não supervisionado/por reforço, deep learning), "ajuste a reta à mão" com os erros ao quadrado, escala de atributos mudando o vizinho mais próximo, a superfície de perda no espaço (w, b) com o gradiente, a taxa de aprendizado nos seus quatro regimes, e o caminho da descida do gradiente (km brutos × padronizados, batch/mini-batch/SGD). Textos e widgets com tradução PT completa.

- **Vulkan, lote 5 — trilha completa (16 lições)**: nova seção **Indo além**, com *Frames in Flight & Resizing*, *Mipmaps & Multisampling*, *Compute Shaders* e *Modern Vulkan: Bindless, Device Addresses & Timelines*. O programa ganha dois frames em voo (FrameData por slot, redimensionamento sem `vkDeviceWaitIdle` aposentando a swapchain antiga), mipmaps gerados por blit e MSAA 4× com resolve no dynamic rendering, dez mil partículas orbitando os cubos num compute shader (o mesmo buffer é storage e vertex buffer), e por fim texturas bindless, vertex pulling por buffer device address e um timeline semaphore no lugar das fences. Widgets novos: CPU × GPU com 1/2/3 frames em voo (tempo de frame, latência, o bug de recursos compartilhados), quando a swapchain antiga pode ser destruída (esperar, destruir na hora, aposentar), um chão em perspectiva renderizado pixel a pixel com NEAREST/LINEAR/trilinear e os níveis coloridos, MSAA com as posições de amostra padrão e o resolve, a grade de um dispatch (workgroups, IDs, subgroups), a simulação de partículas com "quebre a barreira / a verificação de limites", o array bindless com PARTIALLY_BOUND, e o contador de um timeline semaphore comparado às fences. Textos e widgets com tradução PT completa.

- **Vulkan, lote 4**: *Textures & Samplers* e *Depth Buffering & Face Culling*, que fecham a seção Recursos. Os quadrados ganham uma textura PNG (VkImage, layouts, upload por staging com duas transições, sampler com anisotropia, um descriptor set de material) e depois viram dois cubos texturizados que se atravessam, com depth buffer, back-face culling (frontFace anti-horário) e a barreira de profundidade entre frames. Widgets novos: bytes sRGB passando pela textura e pela swapchain (SRGB × UNORM, com a luz), "quebre o upload da textura" (desmarcar um passo e ver o texel cisalhado, desbotado, embaralhado ou o ruído, com a mensagem da validation layer), filtragem NEAREST/LINEAR e os quatro modos de endereçamento com os pesos bilineares de um fragmento, o teste de profundidade pixel a pixel (compareOp, escrita, valor de limpeza, ordem de desenho) e a precisão de profundidade (D16, D24, D32, reversed Z, z-fighting). Textos e widgets com tradução PT completa.

- **Vulkan, lote 3**: nova seção **Recursos**, com *Buffers & Memory*, *Staging Buffers & Transfers* e *Descriptors, Uniforms & Push Constants*. O triângulo vira um quadrado com vertex e index buffer, os vértices passam para a VRAM por um staging buffer, e a cena ganha câmera em perspectiva (uniform buffer) e dois quadrados girando (push constants). Widgets novos: heaps e tipos de memória de quatro GPUs com o findMemoryType bit a bit, suballocação de um bloco com alinhamento e padding, o custo de cada estratégia de upload (t = S / B), "quebre o upload" (desmarcar um passo do staging e ver o erro ou a imagem errada), o mesmo bloco uniform em std140/std430 × C++ com os offsets que divergem, e a cadeia de layout(set, binding) até os bytes com um elo quebrado por vez. Textos e widgets com tradução PT completa.

### 2026-09-29

- **Vulkan, lote 2**: *The Graphics Pipeline*, *Command Buffers* e *Synchronization: Fences, Semaphores & Barriers*, que fecham a seção Apresentação e chegam ao primeiro triângulo. Widgets novos: o mesmo NDC em duas viewports (OpenGL × Vulkan, eixo y e sentido de giro, altura negativa), estado do input assembly e do rasterizador (topologia, culling, face frontal), o ciclo de vida de um command buffer com os erros da validation layer, loadOp/storeOp com o tráfego de memória, a linha do tempo de um frame (desligar a fence ou um semáforo e ver o que quebra) e uma pipeline barrier estágio por estágio (máscaras de estágio e de acesso, corridas e sincronização excessiva). Textos e widgets com tradução PT completa.
- **Home**: no celular (colunas empilhadas), o "Sobre mim" mostra só o primeiro parágrafo, com um botão "Ler mais / Ler menos" que abre o resto com uma animação de altura; no desktop o texto aparece inteiro, porque tem a mesma altura da coluna da foto. Animações discretas: o hero entra em sequência ao carregar, cada seção aparece suavemente na primeira vez que entra na tela, e cards, posts e a foto reagem de leve ao mouse. Tudo desligado com "reduzir movimento" do sistema. As chaves `readMore`/`readLess` da Home (sobrescritas pelas do blog) viraram `aboutMore`/`aboutLess`.
- **OpenGL, início reescrito (lote 3 de 3)**: *First Shaders*, *Drawing the Triangle* e *Indexed Drawing (EBO)* reescritos. Widgets novos: shaders editáveis com o triângulo rodando ao vivo em WebGL (com erros reais de compilação e de link), swizzling, um "depurador do Hello Triangle" (desligar qualquer chamada e ver o que quebra) e uma malha em grade com lista de índices e conta de memória. A seção **Primeiros passos** inteira agora está em português, incluindo os widgets de NDC e de texturas, que tinham textos em inglês fixos.
- **OpenGL, início reescrito (lote 2 de 3)**: *Vertex Buffer Objects* e *Vertex Array Objects* reescritos e bem mais longos. Widgets novos: onde os dados de vértice moram (VRAM × RAM × GPU integrada, com a banda de cada um), o array de floats como bytes (IEEE-754, little-endian, e o bug do `sizeof` de ponteiro), um editor de layout de vértice (size/stride/offset) com o triângulo renderizado ao vivo, e o passo a passo do que um VAO grava (e o erro sem VAO no Core). Os diagramas estáticos antigos de VBO/VAO foram removidos.
- **OpenGL, início reescrito (lote 1 de 3)**: *Legacy & Modern OpenGL*, *Window & Context* e *The Graphics Pipeline* agora seguem o padrão novo (explicação de cada termo, exemplos resolvidos, erros comuns, ideias-chave). Widgets novos: linha do tempo das versões com o pipeline de cada época, custo do immediate mode × vertex arrays × VBO, o contexto como máquina de estados (com o bug do bind esquecido), um buffer × dois buffers × vsync, um triângulo passando por todos os estágios do pipeline, e rasterização com pesos baricêntricos. Textos em inglês e PT; ES/ZH desses capítulos ficam em inglês por enquanto.
- **Vulkan**: nova trilha (Vulkan 1.3, dynamic rendering + synchronization2, API C com SDL3), antes "em breve". Lote 1, seções Fundamentos e Apresentação: *Why Vulkan*, *Instance, Extensions & Validation Layers*, *Physical Devices, Queue Families & the Logical Device*, *Surface, Swapchain & Image Views*. Widgets: mapa de objetos do Vulkan, custo de CPU OpenGL × Vulkan, chamada passando pelas layers, famílias de filas, e uma linha do tempo dos present modes (FIFO/MAILBOX/IMMEDIATE). Textos e widgets com tradução PT completa.
- **Datas nas lições**: cada lição mostra "criado em · atualizado em", tirado do git, e este CHANGELOG foi criado.
- **Correção**: o capítulo GLSL *Waves & Water* travava o navegador inteiro por ~27 s. A causa era a compilação dos shaders no Windows (ANGLE/D3D), não o desenho. O shader do Shore & Rain Lab caiu de 21 s para ~6 s de compilação (laços com limite `uZero`, uma chamada só de `shade()`/`trace()`) e agora compila em segundo plano (`compileProgramAsync`). O Water Lab também foi convertido, e os laços do céu procedural foram corrigidos para todos os shaders que o usam.
- **Game Dev**: trilha ampliada com a seção Física: *Integrators*, *Collision Response & Impulses*, *2D Rigid Bodies*, *Platformer Feel*.

### 2026-09-28

- **GLSL**: *Rivers & Lakes* e *Black Holes* (efeito de buraco negro).
- **Matemática**: *Markov Chains* (propriedade de Markov).

### 2026-09-27

- **OpenGL**: correções de erros e revisão contra o livro LearnOpenGL (lotes 3 e 4); novo capítulo *Buffer Data*.
- **GLSL**: *Built-in Variables*, *Ocean* (ondas por FFT), *Underwater*, *Interactive Pool*; correções nos shaders de água.

### 2026-09-26

- **Matemática**: seções completadas: Geometria (fim), Trigonometria dividida em 6 capítulos com figuras interativas, Álgebra Linear, Cálculo partes 1 e 2, Probabilidade e Estatística partes 1 e 2. A trilha inteira foi revisada para ser matemática pura (contas à mão, sem código de jogos).
  36 lições: *Similarity & Scale*, *Circles & π*, *Volume & Surface Area*, *Coordinate Geometry & Conics*, *Transformations*, *Radians & the Unit Circle*, *Laws of Sines & Cosines*, *Identities & Rotation*, *Polar Coordinates & atan2*, *Waves & Oscillation*, *Matrices & Linear Maps*, *The Determinant*, *Inverses & Linear Systems*, *Eigenvalues & Eigenvectors*, *Complex Numbers*, *Quaternions & 3D Rotation*, *Limits & Continuity*, *The Derivative*, *Rules of Differentiation*, *Using Derivatives*, *Integrals*, *The Fundamental Theorem*, *Techniques of Integration*, *Taylor Series*, *Partial Derivatives & the Gradient*, *Multiple Integrals*, *Differential Equations*, *Counting*, *Probability Basics*, *Conditional Probability & Bayes*, *Random Variables*, *Expectation & Variance*, *Common Distributions*, *Descriptive Statistics*, *Sampling & Inference*, *Correlation & Linear Regression*.
- **Algoritmos e Estruturas de Dados**: trilha nova, criada em 4 lotes, com 24 lições: *Memory, Arrays & Pointers*, *Counting Steps*, *Recursion & the Call Stack*, *Linear & Binary Search*, *Elementary Sorts*, *Merge Sort*, *Quicksort*, *Beyond Comparisons*, *Dynamic Arrays*, *Linked Lists*, *Stacks*, *Queues & Deques*, *Hash Tables*, *Trees & Traversals*, *Binary Search Trees*, *Balanced Trees*, *Heaps & Priority Queues*, *Tries*, *Greedy Algorithms*, *Dynamic Programming*, *Graphs & Their Representations*, *Breadth-First & Depth-First Search*, *Shortest Paths*, *Minimum Spanning Trees & Union-Find*.
- **Site**: nova estrutura e novo design (Home redesenhada, tipografia Spectral/Plex, tema claro e escuro); menu ☰ para celular, compartilhado por todas as páginas; modo foco nas lições.

### 2026-09-25

- **Matemática**: trilha nova, com 24 lições: *Numbers & the Number Line*, *Order of Operations*, *Fractions & Decimals*, *Ratios, Proportion & Percent*, *Divisibility, Primes, GCD & LCM*, *Powers & Roots*, *Number Bases*, *Expressions*, *Linear Equations*, *Inequalities*, *Functions & Graphs*, *Systems of Equations*, *Quadratics*, *Polynomials*, *Exponents & Logarithms*, *Sequences & Series*, *Points, Lines & Angles*, *Triangles & Congruence*, *Perimeter & Area*, *The Pythagorean Theorem*, *Right-Triangle Trigonometry*, *Vectors*, *The Dot Product*, *The Cross Product*.
- **Game Dev**: trilha nova, com 8 lições: *The Game Loop & Fixed Timestep*, *Lerp, Easing & Tweening*, *Springs & Screen Shake*, *Randomness, Seeds & Hashing*, *Perlin Noise & Fractal Terrain*, *Collision Shapes & Overlap*, *Separating Axis Theorem*, *Object Pools & Handles*.
- **GLSL**: *Ray Tracing*, *Path Tracing*, *Acceleration & Denoising*.
- **OpenGL**: *Global Illumination*, *Temporal AA & Upscaling*, *Terrain Rendering*.
- **Arquitetura**: refatoração do /learn (uma página renderiza todas as lições, capítulos em módulos carregados sob demanda, kit de widgets); traduções para PT de todas as trilhas e widgets (ES/ZH parciais).

### 2026-09-24

- **Learn**: referências e documentação de funções; didática ampliada.
- **OpenGL**: 38 lições: *Light & Color*, *Materials*, *Lighting Maps*, *Multiple Lights*, *Gamma Correction*, *Point Shadows*, *Cascaded Shadow Maps*, *Normal Mapping*, *HDR & Tone Mapping*, *Bloom*, *Colour Spaces & ACES*, *Deferred Shading*, *PBR Theory*, *Cook-Torrance Lighting*, *IBL* (2 partes), *Post-Processing*, *SSAO*, *Parallax Mapping*, *Anti-Aliasing*, *Stencil Testing*, *Particles*, *Geometry Shader*, *Tessellation*, *Skeletal Animation*, *Text Rendering*, *Picking*, *Order-Independent Transparency*, *Reflections*, *Atmosphere & Volumetrics*, *Decals*, *Measuring Performance*, *Frustum & Occlusion Culling*, *Draw Calls & State*, *Forward+ & Clustered Shading*, *Level of Detail*, *Mipmapping & Texture Compression*, *Buffer Streaming & Sync*.
- **GLSL**: 9 lições: *The Shader Playground*, *Patterns & Transformations*, *Colour*, *Texturing Tricks*, *Waves & Water*, *Glass, Refraction & Fresnel*, *Fog*, *Toon, Dissolve & Hologram*, *Raymarching*.

### 2026-09-03

- **Learn Page**: remodelada; figuras de NDC 2D e 3D no OpenGL (trabalho iniciado em 2026-09-02).
- **OpenGL**: 14 lições: *Window & Context*, *Camera & View Matrix*, *Depth Testing*, *Light Casters*, *Blinn-Phong*, *Shadow Mapping*, *Model Loading (Assimp)*, *Blending & Transparency*, *Framebuffers & Post-FX*, *Cubemaps & Skybox*, *Instancing*, *Uniform Buffer Objects*, *Debugging OpenGL*, *Compute Shaders*.
- **C++**: 12 lições: *The Modern C++ Landscape*, *Initialization & Values*, *Concepts & Constraints*, *Compile-Time C++*, *Ranges & Views*, *Error Handling*, *Vocabulary Types*, *Modules & Build Hygiene*, *Concurrency & Threads*, *Performance & Data Layout*, *What's New in C++26*, *Tooling, Build & Sanitizers*.
- **SDL3**: trilha nova, com 10 lições: *SDL3 vs SDL2*, *Setup & First Window*, *The Main Loop*, *Events & Input*, *The 2D Renderer*, *Textures & Images*, *Text with SDL3_ttf*, *Audio Streams*, *SDL_GPU — Modern Graphics*, *Time, Files & Shipping*.

## Maio de 2026

### 2026-05-30

- **Learn**: seção de aprendizado melhorada.
- **GLSL**: trilha nova, com 6 lições: *Types & Vectors*, *Built-in Functions*, *Fragment Coordinates & UV*, *Signed Distance Functions*, *Noise & Procedural Patterns*, *Shader Class in C++*.
- **OpenGL**: 8 lições: *Legacy & Modern OpenGL*, *Indexed Drawing (EBO)*, *Textures*, *Linear Algebra for 3D*, *Transformations + GLM*, *Basic Lighting (Phong)*, *Face Winding & Culling*, *Direct State Access (DSA)*.

### 2026-05-20

- Ajustes gerais.

### 2026-05-18

- Modal de projetos refeito; tema claro.

## Março de 2026

### 2026-03-18

- Novo design das seções; as lições passam a ser listadas em `src/lib/tracks/<trilha>/index.tsx`.
- **OpenGL**: *The Graphics Pipeline*, *Drawing the Triangle*.
- **C++**: *Move Semantics*, *RAII & Smart Pointers*.

## Fevereiro de 2026

### 2026-02-20

- Ajustes de front-end.

### 2026-02-15 – 2026-02-16

- Blog ligado ao MongoDB; otimizações.

### 2026-02-10

- Internacionalização (i18n); página Learn com rotas por trilha; menu mobile melhorado; README revisado.
- **C++**: *Templates & Generic Code*.

### 2026-02-09

- Página Learn e idiomas.
- **OpenGL**: primeiras lições: *Vertex Buffer Objects*, *Vertex Array Objects*, *First Shaders*.

### 2026-02-08

- Metadados do site; página do blog.

### 2026-02-06 – 2026-02-07

- Layout refeito, novo logo, organização de pastas, partículas, seção de projetos, efeito de brilho nos cards, temas.

## Janeiro de 2026

### 2026-01-06

- Criação do repositório e do portfólio; deploy com GitHub Actions (Next.js).
