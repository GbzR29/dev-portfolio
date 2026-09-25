// PT text for src/lib/tracks/cpp/chapters/values.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp02_intro: "O C++ tem mais formas de inicializar uma variável do que qualquer outra linguagem popular, e elas não significam todas a mesma coisa. Errar isso deixa você com uma variável guardando os bytes que por acaso estavam na pilha — a fonte clássica do \"funciona em debug, mas não em release\".",
  cpp02_zooTitle: "O zoológico da inicialização",
  cpp02_h0: "Forma",
  cpp02_h1: "Use quando",
  cpp02_r1: "Padrão. Zera escalares, rejeita conversões com perda e nunca vira declaração de função.",
  cpp02_r2: "Você está dando valores concretos e quer que conversões com perda sejam erro.",
  cpp02_r3: "Você precisa de um construtor que concorre com uma sobrecarga de initializer_list — vector(5) é o caso clássico.",
  cpp02_r4: "O tipo é óbvio pelo lado direito, ou impossível de escrever (lambdas, iteradores, pipelines de views).",
  cpp02_vexing: "A análise mais irritante: Widget w(); não cria um Widget. Declara uma função chamada w que não recebe nada e devolve um Widget. As chaves não têm essa ambiguidade — Widget w{}; sempre cria um objeto. Só isso já é um bom motivo para fazer das chaves o seu padrão.",
  cpp02_ebTitle: "O C++26 mudou o que \"não inicializado\" significa",
  cpp02_ebBody: "Ler uma variável não inicializada era comportamento indefinido, o que permitia ao otimizador apagar todo o código ao redor. O C++26 introduz o comportamento errôneo: a leitura continua sendo um bug, mas tem um resultado definido e diagnosticável, em vez de uma licença para compilar o seu programa errado. Os compiladores podem preencher a memória com um padrão conhecido e os sanitizers conseguem apontá-la de forma confiável.",
  cpp02_ebTip: "Isso não torna leituras não inicializadas corretas — torna-as encontráveis. Continue inicializando tudo; a mudança existe para que o seu build com sanitizers pegue as que escaparem.",
  cpp02_constTitle: "const, constexpr, constinit",
  cpp02_constBody: "Use constexpr por padrão em constantes. Ele garante que o valor é calculado em tempo de compilação e pode ser usado em qualquer lugar que exija uma constante, enquanto const só promete que a variável não será modificada.",
  cpp02_autoTitle: "auto e CTAD",
  cpp02_autoBody: "auto deduz por valor e remove referências e o const de nível superior, o que é exatamente o que você quer na maior parte do tempo e um bug sutil no resto. A dedução de argumentos de template de classe (CTAD) faz o mesmo trabalho para templates de classe.",
  cpp02_autoNote: "const auto& num range-for é o padrão seguro: sem cópia, sem modificação acidental. Use auto&& quando estiver escrevendo código genérico que também precisa funcionar com views que produzem temporários.",
};

export default text;
