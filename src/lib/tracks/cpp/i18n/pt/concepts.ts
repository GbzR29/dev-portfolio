// PT text for src/lib/tracks/cpp/chapters/concepts.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp06_intro: "Antes do C++20, um template não dizia nada sobre o que o seu argumento de tipo precisava suportar. Você descobria passando o tipo errado e lendo quatrocentas linhas de backtrace de instanciação. Concepts permitem declarar o requisito logo de início, então o erro aponta para o local da chamada e diz o que está faltando.",
  cpp06_beforeTitle: "Antes e depois",
  cpp06_writingTitle: "Escrevendo um concept",
  cpp06_stdTitle: "Os concepts da biblioteca padrão que você vai usar de verdade",
  cpp06_h0: "Concept",
  cpp06_h1: "Exige",
  cpp06_r1: "Um tipo inteiro ou de ponto flutuante. Substitui a maioria dos enable_if sobre tipos aritméticos.",
  cpp06_r2: "Exatamente o mesmo tipo, nas duas direções.",
  cpp06_r3: "A conversão implícita é válida.",
  cpp06_r4: "Herança pública e sem ambiguidade.",
  cpp06_r5: "Chamável com esses argumentos. A restrição certa para callbacks.",
  cpp06_r6: "Tem begin() e end(). Use isso em vez de receber um vector.",
  cpp06_overloadTitle: "Sobrecarga por restrições",
  cpp06_overloadBody: "Quando duas sobrecargas servem, vence a mais restrita — isso se chama subsunção, e substitui os truques de tag dispatch e enable_if usados para escolher uma implementação especializada.",
  cpp06_apiTip: "Concepts são documentação que o compilador faz cumprir. Mesmo que você nunca sobrecarregue por eles, restringir um template público com um concept transforma \"leia o comentário do header e torça\" em um contrato verificado — e encolhe a mensagem de erro de páginas para três linhas.",
};

export default text;
