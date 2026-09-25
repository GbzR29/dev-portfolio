// PT text for src/lib/tracks/cpp/chapters/templates.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp05_intro: "Um template é uma receita que o compilador segue para gerar código, uma vez para cada conjunto de tipos com que você o usa. É por isso que templates são rápidos — não há indireção em tempo de execução — e por isso explodem o tempo de compilação e as mensagens de erro. Este capítulo cobre a mecânica; o próximo conserta as mensagens de erro.",
  cpp05_basicsTitle: "Templates de função e de classe",
  cpp05_ifTitle: "if constexpr substitui o tag dispatch",
  cpp05_ifBody: "if constexpr descarta em tempo de compilação o ramo que não é tomado — o ramo descartado nem precisa compilar para aquele tipo. Antes do C++17, isso exigia sobrecargas e tipos auxiliares.",
  cpp05_staticAssertNote: "static_assert(false, ...) dentro de um ramo descartado de if constexpr só passou a ser bem-formado no C++23. Em código mais antigo você vai ver o contorno static_assert(sizeof(T) == 0) ou um auxiliar dependent_false<T>, que existe apenas para adiar a avaliação até o template ser instanciado.",
  cpp05_packsTitle: "Parameter packs e fold expressions",
  cpp05_gotchasTitle: "Duas pegadinhas que custam um dia a todo mundo",
  cpp05_compileTip: "Headers carregados de templates são a causa número um de builds lentos em C++, porque toda unidade de tradução que os inclui analisa e instancia tudo de novo. Instanciação explícita num único .cpp, ou os módulos do C++20, são as duas soluções reais — headers pré-compilados só escondem o custo.",
};

export default text;
