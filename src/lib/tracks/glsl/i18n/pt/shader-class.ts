// PT text for src/lib/tracks/glsl/chapters/shader-class.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  glsl06_intro: "Embutir código de shader em string literals do C++ funciona para exemplos pequenos, mas quebra rapidamente em projetos reais. Uma classe Shader dedicada que carrega, compila e gerencia arquivos GLSL torna a iteração dramaticamente mais rápida.",
  glsl06_problemTitle: "O problema com string literals",
  glsl06_problemBody: "Código de shader em string literals exige recompilação do C++ a cada ajuste. Você perde o destaque de sintaxe da IDE e o código fica difícil de ler. Carregar de arquivos resolve tudo isso.",
  glsl06_classTitle: "Interface da classe Shader",
  glsl06_classBody: "Uma classe Shader mínima precisa de: um construtor com caminhos de arquivo, um método use() para vinculá-la, e helpers para setar uniforms.",
  glsl06_implTitle: "Implementação",
  glsl06_hotreloadTitle: "Padrão de hot reload",
  glsl06_hotreloadBody: "Observe o tempo de modificação do arquivo shader. Quando mudar, recompile em uma thread em segundo plano e troque o ID do programa atomicamente. Isso permite ajustar shaders e ver os resultados instantaneamente.",
  glsl06_errorTip: "Sempre mantenha o programa de shader antigo se a recompilação falhar — um shader quebrado não deve travar seu app. Imprima o erro no stderr com o nome do arquivo e número da linha.",
};

export default text;
