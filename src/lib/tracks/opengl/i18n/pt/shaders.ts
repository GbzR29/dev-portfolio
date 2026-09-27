// PT text for src/lib/tracks/opengl/chapters/shaders.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch04_intro: "Shaders são pequenos programas que rodam na GPU para cada vértice ou pixel. Escrevê-los em GLSL é diferente de escrever C++, mas os conceitos são familiares: você tem tipos, funções e controle de fluxo. Este capítulo cobre tudo o que você precisa para escrever seu primeiro par de shaders.",
  ch04_basicsTitle: "Fundamentos do GLSL",
  ch04_passingTitle: "Passando dados entre estágios",
  ch04_passingBody: "Os dados fluem pelo pipeline usando qualificadores. As palavras-chave mudaram entre o GLSL antigo e o moderno:",
  shaderTableHeader0: "Qualificador",
  shaderTableHeader1: "Usado em",
  shaderTableHeader2: "Significado",
  shaderQualInVertex: "vertex shader",
  shaderQualInMeaning: "Dado vindo do VBO (um valor por vértice)",
  shaderQualOutMeaning: "Dado passado para o próximo estágio (interpolado)",
  shaderQualInFrag: "fragment shader",
  shaderQualInFragMeaning: "Recebe o out interpolado do vertex shader",
  shaderQualBoth: "ambos",
  shaderQualUniformMeaning: "Valor definido em C++, igual para todos os vértices e pixels",
  ch04_colorExampleTitle: "Exemplo de interpolação de cores",
  ch04_colorExampleBody: "Vamos passar uma cor por vértice e deixar o OpenGL interpolá-la pelo triângulo. Este é o clássico triângulo colorido do OpenGL.",
  ch04_interpolationNote: "Quando a GPU rasteriza um triângulo, cada fragmento recebe a média ponderada das três cores de vértice. Essa interpolação automática se chama interpolação baricêntrica e é gratuita.",
  ch04_uniformTitle: "Uniforms",
  ch04_uniformBody: "Um uniform é um valor que você define do C++ e que permanece igual para todos os vértices do draw call. Perfeito para matrizes de transformação, tempo ou cor global.",
  ch04_uniformWarn: "glUniform* sempre escreve no programa em uso no momento, então chame glUseProgram antes. Sem nenhum programa em uso a chamada falha com GL_INVALID_OPERATION. Com outro programa em uso, ela escreve nele, se ele por acaso tiver um uniform naquela location. O OpenGL 4.1 trouxe o glProgramUniform*, que recebe o programa como primeiro argumento e dispensa o glUseProgram.",
  ch04_unusedWarn: "glGetUniformLocation devolve −1 quando o nome não existe, e também quando o uniform existe mas nunca é usado: o compilador remove uniforms não usados do programa. Uma chamada glUniform* com location −1 é ignorada em silêncio. Então um erro de digitação, ou um uniform cujo único uso você comentou enquanto testava, parece simplesmente que 'meu uniform não faz nada'. Ao depurar, compare a location com −1.",
  ch04_classTip: "Buscar uma location e chamar glUniform* para cada valor logo fica repetitivo. O capítulo Shader Class in C++, da trilha de GLSL, embrulha carregar de arquivos, compilar, linkar, as checagens de erro e os setters de uniform numa classe pequena. Os capítulos seguintes desta trilha usam esse estilo: shader.use(), depois shader.setMat4(\"model\", model), shader.setVec3(…) e assim por diante. Um setter que a classe ainda não tem, como setMat3, é uma linha a mais no mesmo formato.",
};

export default text;
