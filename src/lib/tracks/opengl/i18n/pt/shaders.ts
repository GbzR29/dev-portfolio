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
  ch04_uniformWarn: "Você deve chamar glUseProgram antes de definir uniforms. Os uniforms pertencem ao programa ativo no momento.",
};

export default text;
