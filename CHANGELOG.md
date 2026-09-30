# Changelog

Registro datado de tudo o que foi feito e criado no site.

- As datas são as dos commits (fuso local, AAAA-MM-DD). Um trabalho feito em vários dias e commitado de uma vez aparece na data do commit.
- A data de criação e de última atualização de cada lição também aparece no topo da própria lição. Ela é gerada do histórico do git por `scripts/gen-chapter-dates.mjs` (`npm run dates`, que também roda antes de `dev` e `build`) e fica em `src/lib/generated/chapter-dates.json`.
- Para registrar algo novo, acrescente uma entrada no topo, com a data.

Totais em 2026-09-30: 8 trilhas e 227 lições (OpenGL 69 · Matemática 61 · GLSL 24 · Algoritmos 24 · C++ 15 · Game Dev 12 · Vulkan 12 · SDL3 10).

---

## Setembro de 2026

### 2026-09-30

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
