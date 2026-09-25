// PT text for src/lib/tracks/cpp/chapters/move.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cpp03_intro: "A semântica de movimento é o recurso que tornou \"devolver por valor\" o padrão certo. Antes do C++11, devolver um container grande copiava cada elemento; agora o compilador transfere a posse do buffer interno e deixa a origem vazia. Entender quando um movimento acontece — e quando ele silenciosamente não acontece — é o que separa C++ rápido de C++ que parece rápido.",
  cpp03_valueTitle: "Categorias de valor numa tabela",
  cpp03_h0: "Categoria",
  cpp03_h1: "Informalmente",
  cpp03_h2: "Exemplo",
  cpp03_lv: "Tem nome e endereço. Dá para fazer &x.",
  cpp03_pr: "Um temporário puro que ainda não foi materializado.",
  cpp03_xv: "Um objeto nomeado que você marcou como prestes a expirar.",
  cpp03_moveTitle: "std::move não move nada",
  cpp03_moveBody: "std::move é um cast, nada mais. Ele converte um lvalue em uma referência a rvalue para que a resolução de sobrecarga escolha o construtor de movimento em vez do de cópia. O trabalho de verdade acontece dentro desse construtor.",
  cpp03_noexceptWarn: "Marque as operações de movimento como noexcept. O std::vector só move seus elementos ao realocar se o construtor de movimento for noexcept — caso contrário, precisa copiá-los para manter a garantia forte de exceção. Um noexcept esquecido transforma, em silêncio, cada crescimento do vector numa cópia profunda.",
  cpp03_rulesTitle: "A regra do zero, do três e do cinco",
  cpp03_rulesBody: "Se a sua classe só tem membros que se gerenciam sozinhos (vector, string, unique_ptr), não escreva nenhuma das funções membro especiais — essa é a regra do zero, e ela é o objetivo. Se você precisa escrever um destrutor porque possui um recurso cru, quase certamente também precisa das outras quatro.",
  cpp03_fwdTitle: "Referências de encaminhamento",
  cpp03_fwdBody: "Num contexto de dedução, T&& não é uma referência a rvalue — é uma referência de encaminhamento, que se liga a qualquer coisa e lembra se quem chamou passou um lvalue ou um rvalue. std::forward restaura essa categoria ao repassá-la.",
  cpp03_pitfalls: "Duas armadilhas que vale decorar. Primeira: std::move num objeto const produz em silêncio um rvalue const, que se liga ao construtor de cópia — você ganha uma cópia sem nenhum diagnóstico. Segunda: nunca use um objeto de onde já se moveu, exceto para atribuir a ele ou destruí-lo; o padrão só garante que ele está num estado válido, mas não especificado.",
  cpp03_rvoTitle: "Normalmente você não deve mover no return",
  cpp03_rvoBody: "A elisão de cópia faz o objeto ser construído direto no espaço de quem chama, então não há cópia nem movimento algum. Escrever std::move numa variável local devolvida desativa essa otimização e deixa o código mais lento.",
};

export default text;
