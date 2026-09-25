// PT text for src/lib/tracks/cpp/chapters/vocabulary.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp10_intro: "Tipos de vocabulário existem para que duas bibliotecas que nunca ouviram falar uma da outra concordem sobre como é \"uma string que não é minha\" ou \"talvez um valor\". Usá-los nas fronteiras das suas APIs é o que torna o código composável.",
  cpp10_svTitle: "string_view e span — dados emprestados",
  cpp10_svBody: "Os dois são um ponteiro e um tamanho. Nenhum dos dois é dono de nada. Eles existem para que uma função aceite qualquer sequência contígua sem virar template sobre o container nem forçar uma cópia.",
  cpp10_dangleWarn: "Nunca guarde uma string_view ou um span num membro que viva mais que a origem. O bug clássico: std::string_view sv = getString(); — a string temporária morre no fim da instrução e sv aponta para memória liberada. Use-os como tipos de parâmetro e variáveis locais; use std::string ou std::vector quando precisar ser dono.",
  cpp10_variantTitle: "variant — uma union com segurança de tipo",
  cpp10_bindingsTitle: "Structured bindings",
  cpp10_printTitle: "print e format",
  cpp10_formatTip: "std::format confere a string de formato contra os tipos dos argumentos em tempo de compilação, então um {} incompatível é erro de compilação em vez da corrupção silenciosa que o printf entrega. Também é bem mais rápido que iostreams, porque não há um estado de stream carregado de locale para mexer.",
};

export default text;
