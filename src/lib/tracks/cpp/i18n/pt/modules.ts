// PT text for src/lib/tracks/cpp/chapters/modules.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp11_intro: "O modelo do #include é textual: o pré-processador cola o header inteiro em todo arquivo que o inclui, e o compilador o analisa de novo toda vez. Um projeto que inclui <vector> em cem arquivos analisa <vector> cem vezes. Módulos substituem isso por um artefato compilado que é analisado uma única vez.",
  cpp11_problemTitle: "Quanto os headers realmente custam",
  cpp11_p1t: "Análise quadrática",
  cpp11_p1b: "N arquivos-fonte incluindo M headers são analisados N×M vezes. Isso é o grosso de um build típico de C++.",
  cpp11_p2t: "Vazamento de macros",
  cpp11_p2b: "Um header que define min/max ou inclui <windows.h> muda o significado do código incluído depois dele.",
  cpp11_p3t: "Dependência de ordem",
  cpp11_p3b: "A ordem dos includes importa, e é por isso que existem ferramentas include-what-you-use e gambiarras de unity build.",
  cpp11_p4t: "Sem encapsulamento",
  cpp11_p4b: "Tudo num header é público. Funções auxiliares privadas vazam para o namespace de todo mundo que o consome.",
  cpp11_writingTitle: "Escrevendo um módulo",
  cpp11_partitionsTitle: "Partições mantêm módulos grandes legíveis",
  cpp11_realityTitle: "O choque de realidade",
  cpp11_realityBody: "O recurso da linguagem está pronto; o ecossistema é o gargalo. Módulos exigem que o sistema de build descubra, antes de compilar qualquer coisa, qual módulo cada arquivo fornece e de quais depende — um tipo realmente novo de varredura de dependências. O CMake suporta isso com geradores recentes do Ninja e do MSVC, mas muitas bibliotecas de terceiros ainda distribuem só headers.",
  cpp11_h0: "Situação",
  cpp11_h1: "Conselho prático",
  cpp11_s1: "Projeto novo, uma única toolchain recente",
  cpp11_a1: "Use módulos. O ganho no tempo de build é real e você não tem legado para migrar.",
  cpp11_s2: "Base de código existente com muitos headers",
  cpp11_a2: "Não reescreva. Acrescente módulos nas pontas, ou comece só com import std;.",
  cpp11_s3: "Você precisa suportar vários compiladores",
  cpp11_a3: "Fique nos headers. Reduza o custo com declarações antecipadas, PIMPL e headers pré-compilados.",
  cpp11_s4: "Biblioteca header-only que você publica",
  cpp11_a4: "Mantenha os headers; opcionalmente, distribua um wrapper em módulo junto com eles.",
  cpp11_stdTip: "import std; é o ponto de entrada mais barato possível. Não mexe em nenhuma decisão de design, funciona até num projeto baseado em headers e, numa unidade de tradução grande, pode cortar bastante o tempo de compilação em comparação com uma dúzia de includes da biblioteca padrão. Experimente isso primeiro, antes de migrar qualquer coisa sua.",
};

export default text;
