// PT text for src/lib/tracks/glsl/chapters/types.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl01_intro: "O GLSL tem um sistema de tipos mais rico que o C++ em uma área específica: tipos embutidos de vetores e matrizes que mapeiam diretamente para registradores da GPU. Entendê-los é a base de todo shader que você escreverá.",
  glsl01_scalarsTitle: "Tipos escalares",
  glsl01_scalarsBody: "O GLSL tem quatro tipos escalares. float é o mais usado — a maior parte da matemática em shaders usa ele. Tipos inteiros são limitados em hardware antigo; prefira aritmética float a menos que precise de semântica inteira.",
  glsl01_vectorsTitle: "Tipos vetoriais",
  glsl01_vectorsBody: "Vetores são os tipos mais importantes do GLSL. Você usará vec2, vec3 e vec4 constantemente para representar posições, cores, direções e coordenadas UV.",
  glsl01_swizzleTitle: "Swizzling",
  glsl01_swizzleBody: "Swizzling permite reordenar e selecionar componentes de um vetor em uma única expressão. Você pode usar .xyzw, .rgba ou .stpq — todos são aliases equivalentes para os mesmos quatro componentes.",
  glsl01_constructorsTitle: "Construtores",
  glsl01_constructorsBody: "Vetores são construídos chamando o tipo como uma função. Você pode misturar escalares e vetores menores para preencher um maior. Um único escalar preenche todos os componentes: vec3(1.0) cria (1.0, 1.0, 1.0).",
  glsl01_matricesTitle: "Matrizes",
  glsl01_matricesBody: "mat4 é uma matriz 4×4 armazenada em ordem de coluna. mat4(1.0) cria uma matriz identidade. A multiplicação matriz × vetor segue a álgebra linear padrão.",
  glsl01_castingTitle: "Conversão de tipos",
  glsl01_castingBody: "O GLSL não tem conversões implícitas. Você deve converter explicitamente: float(myInt), int(myFloat). Esquecer isso é um erro de compilação muito comum ao misturar expressões inteiras e float.",
  glsl01_precisionTitle: "Qualificadores de precisão",
  glsl01_precisionBody: "O GLSL ES (WebGL, celular) obriga você a dizer quão preciso é cada float. O GLSL de desktop aceita as palavras-chave e as ignora. highp é IEEE de 32 bits. mediump tem pelo menos meia precisão de 16 bits (faixa ±65504, cerca de 3 dígitos decimais) e, em GPUs de celular, pode rodar duas vezes mais rápido. Cores ficam bem em mediump; posições, UVs em texturas grandes e tempo, não.",
  glsl01_aggTitle: "Arrays, structs e funções",
  glsl01_aggBody: "Arrays têm tamanho fixo, conhecido em tempo de compilação. Structs agrupam campos como em C. Funções passam parâmetros por valor, e os qualificadores in, out e inout dizem em que direção os dados fluem. Não há ponteiros nem recursão, porque a GPU praticamente não tem pilha de chamadas.",
  glsl01_swizzleLiveTitle: "Swizzling, ao vivo",
  glsl01_intWarn: "Literais inteiros e de ponto flutuante são tipos diferentes: 1 é um int, 1.0 é um float, e vec3 v = 1 não compila em compiladores estritos (o WebGL é estrito). A divisão de ints trunca: 3 / 2 == 1. Escreva os literais de float com ponto e use float(i) sempre que um índice de loop entrar numa conta.",
  glsl01_key0: "Escalares float/int/uint/bool; vetores vecN/ivecN/bvecN; matrizes matN, column-major.",
  glsl01_key1: "Faça swizzle à vontade: .xyzw = .rgba = .stpq; reordene, repita e atribua a vários componentes de uma vez.",
  glsl01_key2: "Sem conversões implícitas: 1 é um int, 1.0 é um float; converta explicitamente.",
  glsl01_key3: "highp para posições, UVs e tempo; mediump serve para cores.",
  glsl01_key4: "Arrays de tamanho fixo, structs como em C, parâmetros in/out/inout, sem recursão.",
};

export default text;
