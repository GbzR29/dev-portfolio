// PT chapter titles and section names for the cpp track (see cpp/index.tsx).

const track = {
  titles: {
    landscape: "O panorama do C++ moderno",
    values: "Inicialização e valores",
    move: "Semântica de movimento",
    raii: "RAII e smart pointers",
    templates: "Templates e código genérico",
    concepts: "Concepts e restrições",
    constexpr: "C++ em tempo de compilação",
    ranges: "Ranges e views",
    errors: "Tratamento de erros",
    vocabulary: "Tipos de vocabulário",
    modules: "Módulos e higiene de build",
    concurrency: "Concorrência e threads",
    performance: "Desempenho e layout de dados",
    cpp26: "O que há de novo no C++26",
    tooling: "Ferramentas, build e sanitizers",
  } as Record<string, string>,
  sections: {
    "Language Core": "Núcleo da linguagem",
    "Generic C++": "C++ genérico",
    "Standard Library": "Biblioteca padrão",
    "Systems & Performance": "Sistemas e desempenho",
    "What's Next": "O que vem por aí",
  } as Record<string, string>,
};

export default track;
