// PT text for src/lib/tracks/cpp/chapters/tooling.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp15_intro: "O C++ não tem sistema de build, gerenciador de pacotes nem formatador oficiais, o que significa que o ecossistema escolheu vários de cada. Este capítulo é a configuração da qual um projeto novo em 2026 deveria partir — CMake moderno, um gerenciador de pacotes, sanitizers ligados por padrão em debug e um linter na CI.",
  cpp15_cmakeTitle: "CMake baseado em targets",
  cpp15_cmakeBody: "A regra que separa o CMake moderno do estilo antigo: nunca defina uma variável global. Prenda tudo a um target, e marque cada propriedade como PUBLIC se quem consome precisar dela ou PRIVATE se ela parar neste target.",
  cpp15_presetsTitle: "Presets acabam com o paredão de flags",
  cpp15_sanitizersTitle: "Sanitizers acham o que o code review não acha",
  cpp15_h0: "Sanitizer",
  cpp15_h1: "Detecta",
  cpp15_h2: "Lentidão",
  cpp15_r1: "Use-after-free, estouro de buffer, vazamentos, double free.",
  cpp15_r2: "Overflow com sinal, shifts inválidos, acesso desalinhado, desreferência nula.",
  cpp15_r3: "Condições de corrida. A única forma prática de encontrá-las.",
  cpp15_r4: "Verificação de limites dentro dos containers e iteradores da libstdc++.",
  cpp15_r4b: "Pequena",
  cpp15_tsanWarn: "ASan e TSan não podem ser combinados num mesmo build — rode-os como jobs separados na CI. E rode a sua suíte de testes com sanitizers, não só o jogo: uma condição de corrida que só dispara uma vez a cada dez mil frames nunca vai se reproduzir num debugger, mas o TSan a aponta na primeira vez que o caminho de código executa.",
  cpp15_pkgTitle: "Dependências",
  cpp15_p0: "Ferramenta",
  cpp15_p1: "Melhor para",
  cpp15_t1: "Catálogo grande; o modo manifest fixa versões por projeto. Forte no Windows e no MSVC.",
  cpp15_t2: "Cache de binários e configurações de ABI personalizadas. Comum em estúdios maiores e em setups pesados de CI.",
  cpp15_t3: "Uma camada fina sobre o FetchContent. Sem etapa de instalação — bom para projetos pequenos e exemplos.",
  cpp15_t4: "Controle total, zero ferramentas, atualizações manuais para sempre. Ainda a escolha mais comum em gamedev.",
  cpp15_lintTitle: "Formatação e análise estática",
  cpp15_ciTip: "O pipeline de CI de maior valor para um projeto C++ tem quatro jobs: compilar com GCC, compilar com Clang, compilar com MSVC e rodar os testes com ASan+UBSan. Três compiladores discordam em muito mais coisas do que você imagina, e cada discordância costuma ser um bug real ou um problema de portabilidade que, de outro modo, você publicaria.",
  cpp15_nextTitle: "Para onde ir daqui",
  cpp15_nextBody: "Agora você domina a linguagem. Os próximos passos naturais neste conjunto de trilhas são SDL3, para janelas, entrada e áudio, e OpenGL ou GLSL, para a parte de renderização — as duas pressupõem exatamente o C++ ensinado aqui: wrappers RAII em volta de handles de C, spans na fronteira das APIs e semântica de valor em todo o resto.",
};

export default text;
