# Changelog

Registro datado de tudo o que foi feito e criado no site.

- As datas são as dos commits (fuso local, AAAA-MM-DD). Um trabalho feito em vários dias e commitado de uma vez aparece na data do commit.
- A data de criação e de última atualização de cada lição também aparece no topo da própria lição. Ela é gerada do histórico do git por `scripts/gen-chapter-dates.mjs` (`npm run dates`, que também roda antes de `dev` e `build`) e fica em `src/lib/generated/chapter-dates.json`.
- Para registrar algo novo, acrescente uma entrada no topo, com a data.

Totais em 2026-09-29: 7 trilhas e 215 lições (OpenGL 69 · Matemática 61 · GLSL 24 · Algoritmos 24 · C++ 15 · Game Dev 12 · SDL3 10).

---

## Setembro de 2026

### 2026-09-29

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
