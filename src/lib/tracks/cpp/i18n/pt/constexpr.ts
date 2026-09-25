// PT text for src/lib/tracks/cpp/chapters/constexpr.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp07_intro: "Cada ciclo gasto em tempo de compilação é um ciclo a menos gasto a 16,6 milissegundos por frame. O constexpr moderno é quase um interpretador completo de C++ rodando dentro do compilador: loops, alocações, containers e, no C++26, até exceções.",
  cpp07_keywordsTitle: "constexpr, consteval, constinit",
  cpp07_h0: "Palavra-chave",
  cpp07_h1: "Garante",
  cpp07_r1: "PODE rodar em tempo de compilação. Cai para tempo de execução se os argumentos não forem constantes.",
  cpp07_r2: "PRECISA rodar em tempo de compilação. Chamar com um valor de tempo de execução é erro de compilação.",
  cpp07_r3: "Inicializado em tempo de compilação, mas mutável depois. Acaba com o fiasco da ordem de inicialização estática.",
  cpp07_r4: "Ramifica conforme esta chamada esteja sendo avaliada em tempo de compilação (C++23).",
  cpp07_tablesTitle: "Embutindo tabelas de consulta no binário",
  cpp07_tablesBody: "Este é o padrão que compensa em código gráfico: gere a tabela com C++ de verdade, em vez de um script Python que escreve um header, e o resultado é um array simples de constantes na seção de dados somente leitura.",
  cpp07_allocWarn: "Memória alocada durante a avaliação constante precisa ser liberada durante a avaliação constante — você não pode devolver um std::vector constexpr para o tempo de execução. Por isso o crivo acima devolve uma contagem e a LUT devolve um std::array, que não aloca.",
  cpp07_26Title: "O que o C++26 acrescenta",
  cpp07_26Body: "Duas mudanças deixam o código constexpr muito mais parecido com código comum: exceções agora podem ser lançadas e capturadas durante a avaliação constante, e o static_assert pode montar sua mensagem em tempo de compilação, em vez de exigir um literal de string.",
  cpp07_costTip: "Trabalho em tempo de compilação não é de graça — é pago a cada build em vez de a cada frame. Um crivo constexpr até um milhão vai deixar seu build visivelmente mais lento. Use para tabelas medidas em kilobytes, não em megabytes, e confira o impacto com -ftime-trace no Clang.",
};

export default text;
