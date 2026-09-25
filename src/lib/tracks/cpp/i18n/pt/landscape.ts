// PT text for src/lib/tracks/cpp/chapters/landscape.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp01_intro: "O C++ lança um padrão novo a cada três anos. Esse ritmo significa que a linguagem que você aprendeu há cinco anos não é a que as pessoas escrevem hoje. Esta trilha ensina o C++ que um programador de gráficos e de jogos realmente escreve em 2026: semântica de valor, RAII, computação em tempo de compilação e a biblioteca padrão que substituiu a maior parte do código feito à mão dos anos 2000.",
  cpp01_trainTitle: "O trem de lançamentos a cada três anos",
  cpp01_trainBody: "Desde o C++11, o comitê congela recursos num calendário fixo e publica o que estiver pronto. Um padrão publicado não é o mesmo que o seu compilador implementá-lo — para os recursos maiores, costuma haver de dois a quatro anos entre um e outro.",
  cpp01_v11: "Semântica de movimento, lambdas, auto, smart pointers, threads. A ruptura com o C++98.",
  cpp01_v14: "Lambdas genéricas, dedução do tipo de retorno, templates de variável. Uma versão de correções.",
  cpp01_v17: "Structured bindings, if constexpr, optional / variant / string_view, filesystem.",
  cpp01_v20: "Concepts, ranges, módulos, corrotinas, <format>, o operador nave espacial, jthread.",
  cpp01_v23: "import std, std::expected, std::print, mdspan, deducing this, flat_map, generator.",
  cpp01_v26: "Reflexão, contracts, std::execution, std::simd, inplace_vector, indexação de pack.",
  cpp01_publishNote: "Os documentos ISO publicados levam o nome do ano em que foram finalizados, não o ano do apelido do padrão. O C++23 foi publicado como ISO/IEC 14882:2024. O C++26 teve os recursos congelados em 2025 e caminha para ser publicado como ISO/IEC 14882:2026, então partes dele já estão disponíveis atrás de flags dos compiladores.",
  cpp01_meaningTitle: "O que \"C++ moderno\" realmente significa",
  cpp01_meaningBody: "C++ moderno é menos uma lista de recursos e mais um conjunto de padrões de escolha. Quase toda regra abaixo existe para mover uma categoria de bug do tempo de execução para o tempo de compilação, ou para eliminá-la de vez.",
  cpp01_rule1t: "Posse expressa em tipos, não em comentários",
  cpp01_rule1b: "Todo recurso tem um destrutor que o libera. Nada de new/delete manual, nada de goto cleanup, nada de \"lembre de chamar Destroy()\".",
  cpp01_rule2t: "Prefira valores a indireção",
  cpp01_rule2b: "Passe e devolva por valor; deixe a semântica de movimento tornar isso barato. Ponteiros são para o que é opcional e não é dono, não para \"evitar uma cópia\".",
  cpp01_rule3t: "Leve o trabalho para o tempo de compilação",
  cpp01_rule3b: "constexpr, concepts e templates transformam erros de lógica em erros de compilação e tabelas de consulta em constantes embutidas no binário.",
  cpp01_rule4t: "Use a biblioteca padrão",
  cpp01_rule4b: "Ela é escrita por gente que lê o assembly gerado. Containers feitos à mão são uma decisão de desempenho que você precisa justificar com um profiler, não um padrão.",
  cpp01_helloTitle: "Olá, mundo moderno",
  cpp01_helloBody: "Duas versões do mesmo programa, com doze anos de diferença. A de C++23 não tem headers, nem operadores de stream, nem formatação manual.",
  cpp01_flagsTitle: "Ligando o padrão",
  cpp01_flagsBody: "Os compiladores ainda usam um padrão mais antigo por padrão. Você precisa pedir o que quer, e já deve aproveitar para pedir os avisos.",
  cpp01_supportWarn: "O suporte dos compiladores aos recursos mais novos é irregular e muda a cada poucos meses. Antes de basear um design em reflexão, contracts ou módulos, consulte as tabelas de suporte do cppreference para a versão exata da sua toolchain — \"o C++26 está pronto\" e \"meu compilador faz isso\" são afirmações muito diferentes.",
  cpp01_nextTitle: "O que vem a seguir",
  cpp01_nextBody: "O próximo capítulo começa pela base: como uma variável passa a existir. Inicialização parece trivial, mas é a maior fonte isolada de comportamento indefinido em bases de código C++ reais, e o C++26 mudou as regras para torná-la diagnosticável.",
};

export default text;
