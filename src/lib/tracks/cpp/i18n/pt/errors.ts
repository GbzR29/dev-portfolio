// PT text for src/lib/tracks/cpp/chapters/errors.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp09_intro: "O C++ tem três mecanismos de tratamento de erro e uma discussão antiga sobre qual usar. Engines de jogos costumam compilar com exceções desligadas; a biblioteca padrão presume que estão ligadas. O C++23 acrescentou std::expected, que finalmente dá ao grupo do \"erros são valores\" um tipo de vocabulário, em vez de cada um inventar o seu próprio Result.",
  cpp09_optionalTitle: "optional — ausência não é erro",
  cpp09_expectedTitle: "expected — um erro com motivo",
  cpp09_expectedBody: "std::expected<T, E> guarda um valor ou um erro. É o tipo de retorno para operações que falham por motivos conhecidos: arquivo ausente, shader que não compilou, conexão recusada. Quem chama não consegue ignorar a falha, porque chegar ao valor exige tratá-la.",
  cpp09_excTitle: "Exceções e o seu modelo de custo",
  cpp09_excBody: "As implementações modernas usam unwinding guiado por tabelas: um throw que não acontece custa literalmente nada em tempo de execução, mas as tabelas aumentam o binário e uma exceção lançada é muito lenta — microssegundos, não nanossegundos. Esse é todo o argumento. Exceções são corretas para falhas realmente excepcionais e erradas como controle de fluxo.",
  cpp09_h0: "Situação",
  cpp09_h1: "Use",
  cpp09_s1: "O valor pode legitimamente estar ausente",
  cpp09_s2: "A operação falhou e quem chama precisa reagir",
  cpp09_s3: "Falha no construtor — não há valor de retorno",
  cpp09_u3: "throw, ou uma fábrica estática que devolve expected",
  cpp09_s4: "Um bug de programação, não uma condição de execução",
  cpp09_u4: "assert / contracts — quebrar de forma ruidosa em debug",
  cpp09_s5: "Falta de memória, estado irrecuperável",
  cpp09_u5: "throw, ou terminate",
  cpp09_noexcWarn: "Se você compila com -fno-exceptions, lembre que a biblioteca padrão continua lançando — vector::at, std::stoi e toda alocação que falha. Com exceções desligadas, essas chamadas abortam o processo. Aceite isso ou evite totalmente o subconjunto que lança.",
  cpp09_contractsTitle: "Contracts (C++26)",
  cpp09_contractsBody: "Contracts levam as pré-condições de um comentário para a assinatura, onde o compilador pode verificá-las e as ferramentas podem lê-las. Eles miram bugs, não falhas de execução — uma pré-condição violada significa que o código que chama está errado.",
  cpp09_contractsNote: "Contracts são um dos recursos mais novos do C++26 e o mais provável de ainda estar atrás de uma flag experimental no seu compilador. Trate a sintaxe acima como a forma do recurso e consulte as notas de lançamento da sua toolchain antes de depender dela em código de produção.",
};

export default text;
