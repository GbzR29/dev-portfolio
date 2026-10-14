// PT text for src/lib/tracks/cpp/chapters/c-to-cpp.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cCpp_intro: "Agora você conhece o modelo de máquina do C, e já topou com os custos dele. Todo malloc precisa de um free em todo caminho. Arrays esquecem o próprio tamanho. Strings dependem de um byte zero. Códigos de erro são fáceis de ignorar. Nada disso é um erro de projeto do C: o C simplesmente não faz nenhuma contabilidade que você não tenha escrito. O C++ mantém o mesmo modelo, as mesmas caixas nos mesmos endereços, e acrescenta maneiras de fazer o compilador cuidar dessa contabilidade por você, sem deixar o programa mais lento. Este capítulo põe as duas lado a lado e liga cada problema do C à ferramenta do C++ que o resolve, e ao capítulo desta trilha que a ensina.",
  cCpp_goal0: "Dizer qual problema do C cada recurso principal do C++ foi feito para resolver.",
  cCpp_goal1: "Usar uma referência onde o C passaria um ponteiro.",
  cCpp_goal2: "Explicar como um destrutor faz um std::vector liberar a própria memória.",
  cCpp_goal3: "Trocar hábitos comuns do C pelos equivalentes do C++.",
  cCpp_goal4: "Chamar código C a partir do C++ com extern \"C\".",

  cCpp_sameTitle: "Um programa, duas linguagens",
  cCpp_sameBody: "Os dois programas leem linhas no formato \"nome pontos\" da entrada padrão, ordenam os jogadores pela pontuação e os imprimem. Repare no que a versão em C precisa gerenciar à mão, e no que cada linha poderia errar.",
  cCpp_sameAfter: "A versão em C++ não tem capacidade, realloc, free, limite de tamanho de nome nem casts a partir de void *. Cada uma dessas coisas era um lugar para um bug no C. E ela não é mais lenta: o std::sort costuma vencer o qsort, como explicado abaixo.",

  cCpp_mapTitle: "Cada problema do C e a resposta do C++",
  cCpp_hProb: "No C você precisava…",
  cCpp_hTool: "O C++ oferece",
  cCpp_hWhere: "Ensinado em",
  cCpp_p1: "lembrar de free, fclose e de cada função de destruir",
  cCpp_t1: "destrutores: a limpeza roda sozinha no fim do escopo (RAII)",
  cCpp_w1: "RAII e smart pointers",
  cCpp_p2: "passar cada array com o tamanho e fazê-lo crescer com realloc",
  cCpp_w2: "Tipos de vocabulário, Ranges",
  cCpp_p3: "manter um '\\0' e dimensionar cada buffer",
  cCpp_w3: "Tipos de vocabulário",
  cCpp_p4: "passar um ponteiro para uma função poder mudar a sua variável",
  cCpp_t4: "referências (T&)",
  cCpp_w4: "abaixo",
  cCpp_p5: "conferir códigos de erro fáceis de ignorar",
  cCpp_t5: "exceções, std::expected",
  cCpp_w5: "Tratamento de erros",
  cCpp_p6: "escrever código genérico com void * ou macros",
  cCpp_t6: "templates e concepts, conferidos pelo compilador",
  cCpp_w6: "Templates, Concepts",
  cCpp_p7: "pôr etiqueta em unions à mão",
  cCpp_w7: "Tipos de vocabulário",
  cCpp_p8: "usar #define para constantes e tabelas",
  cCpp_w8: "C++ em tempo de compilação",
  cCpp_p9: "prefixar cada nome (vec_len) para evitar colisões",
  cCpp_t9: "namespaces (math::length)",
  cCpp_w9: "Módulos e higiene de build",

  cCpp_refTitle: "Referências: um apelido em vez de um endereço",
  cCpp_refBody: "Uma referência é um segundo nome para uma variável que já existe. Declarada como int &a, ela precisa ser ligada a uma variável quando é criada, nunca pode ser NULL e nunca pode passar a se referir a outra coisa. Por baixo, o compilador passa um endereço, exatamente como a versão do swap com ponteiros, mas o código se lê como variáveis comuns e não há NULL para conferir.",

  cCpp_dtorTitle: "Destrutores: a contabilidade, automatizada",
  cCpp_dtorBody: "No capítulo de memória você escreveu o IntVec com vec_create e vec_destroy, e toda a dificuldade era chamar vec_destroy em todo caminho. Uma classe C++ pode ter um construtor, que roda quando um objeto é criado, e um destrutor, que roda quando ele sai de escopo. O próprio compilador insere a chamada do destrutor: na chave de fechamento, em todo return e quando uma exceção passa por ali. O std::vector é o IntVec com um destrutor. Avance por ele e compare com o capítulo de C.",
  cCpp_fileBody: "O mesmo truque funciona para qualquer recurso. Aqui está um FILE * embrulhado numa classe, de modo que um arquivo não pode mais ficar aberto.",

  cCpp_zeroTitle: "Não é mais lento: custo zero",
  cCpp_zeroBody: "Nada disso custa velocidade. Indexar um std::vector compila para a mesma instrução que indexar um array do C. A chamada do destrutor é o mesmo free que você teria escrito. O std::sort costuma ser mais rápido que o qsort: o qsort chama a comparação por um ponteiro de função para cada par, enquanto o std::sort é um template, então o compilador enxerga a comparação e a embute no laço de ordenação. É a regra do custo zero de Stroustrup, do capítulo de história, em ação.",
  cCpp_costNote: "O C++ tem custos de outros tipos: uma linguagem muito maior, compilação mais lenta, e recursos (exceções, funções virtuais, shared_ptr) com custos reais na execução, que você escolhe pagar. Os próximos capítulos dizem o que custa quanto.",

  cCpp_habitsTitle: "Hábitos do C para deixar para trás",
  cCpp_hC: "Hábito do C",
  cCpp_hCpp: "No C++",
  cCpp_h1: "std::vector, std::make_unique: nem new e delete crus",
  cCpp_h4: "static_cast<int>(x): visível, fácil de buscar e limitado a conversões seguras",
  cCpp_h6: "std::print(\"{}\", x) (C++23), com checagem de tipo",
  cCpp_h7c: "parâmetros de saída (int *result)",
  cCpp_h7: "devolva o valor; devolva um struct, std::optional ou std::expected para vários resultados ou falha",

  cCpp_externTitle: "Misturando as duas: extern \"C\"",
  cCpp_externBody: "O C++ permite duas funções com o mesmo nome e parâmetros diferentes, então o seu compilador codifica os tipos dos parâmetros no nome de cada símbolo. Isso é name mangling (\"desfiguração de nomes\"): vec_len(Vec) vira um símbolo como _Z7vec_len3Vec. O C não faz isso; o símbolo é só vec_len. Para chamar uma biblioteca C a partir do C++, as declarações dela precisam ser marcadas com extern \"C\", que manda o compilador C++ usar os nomes simples do C. Headers feitos para as duas linguagens fazem isso sozinhos; abra SDL.h ou vulkan.h e você vai encontrar exatamente isto.",

  cCpp_tryTitle: "Experimente",
  cCpp_try1: "Compile ranking.c como C++ (g++ -x c++ ranking.c). O que o compilador recusa, e por quê?",
  cCpp_try2: "Rode nm num .o compilado como C e no mesmo arquivo compilado como C++. Encontre os nomes desfigurados e decodifique um com c++filt.",
  cCpp_try3: "Acrescente uma função membro lines() à classe File e use-a em dois lugares. Ponha um return antecipado num deles e confira, com o detector de vazamentos do ASan, que nenhum arquivo fica aberto.",

  cCpp_key0: "O C++ mantém o modelo de memória do C e acrescenta ferramentas que deixam o compilador cuidar da contabilidade.",
  cCpp_key1: "Destrutores rodam sozinhos no fim de um escopo, então a limpeza não pode ser esquecida: isso é RAII.",
  cCpp_key2: "std::vector e std::string substituem arrays manuais e strings com '\\0'; referências substituem a maioria dos parâmetros ponteiro.",
  cCpp_key3: "Essas ferramentas não custam nada a mais na execução; o std::sort até vence o qsort.",
  cCpp_key4: "O C++ desfigura nomes; extern \"C\" deixa o C++ chamar bibliotecas C como SDL e Vulkan.",
};

export default text;
