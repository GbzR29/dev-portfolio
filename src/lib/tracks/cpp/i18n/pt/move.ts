// PT text for src/lib/tracks/cpp/chapters/move.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppMv_intro: "Imagine levar um livro para a sala ao lado fotocopiando cada página, carregando a cópia e picotando o original. Era o que o C++ fazia nos seus primeiros vinte anos sempre que um objeto mudava de mãos: uma função que montava um vector de um milhão de elementos e o devolvia copiava todos os milhão, depois destruía o original. Os programadores contornavam isso com parâmetros de saída e ponteiros, e o código ficava mais feio. O C++11 acrescentou a alternativa óbvia: carregar o livro. Um movimento entrega o que um objeto possui, o seu bloco no heap, o seu arquivo, o seu buffer, e deixa o objeto antigo vazio. Este capítulo mostra como um movimento funciona por dentro, como o compilador decide quando pode mover, e a única chamada de função, std::move, cujo nome é algo que ela não faz.",
  cppMv_goal0: "Descrever o que um movimento faz com o objeto de origem e com o objeto de destino.",
  cppMv_goal1: "Escrever um construtor de movimento e uma atribuição por movimento, e marcá-los noexcept.",
  cppMv_goal2: "Diferenciar lvalues de rvalues e prever se uma chamada copia ou move.",
  cppMv_goal3: "Explicar por que std::move sozinho não move nada, e onde escrevê-lo deixa o código mais lento.",
  cppMv_goal4: "Escolher entre a regra dos cinco e a regra do zero.",

  cppMv_whyTitle: "Copiar quando você queria entregar",
  cppMv_whyBody: "push_back(lines) precisa copiar: até onde o compilador sabe, lines ainda vai ser usada depois. Mas não vai. O que queremos é dar ao push_back as próprias strings: deixar o elemento novo pegar o bloco de lines no heap e deixar lines vazia. Um ponteiro troca de dono, e nenhum caractere é copiado. Isso é um movimento, e o C++ precisa de duas coisas para fazê-lo: um jeito de a classe dizer como é movida, e um jeito de quem chama dizer \"terminei com este objeto\".",

  cppMv_ctorTitle: "Roubando o bloco: o construtor de movimento",
  cppMv_ctorBody: "Aqui está o construtor de movimento do Buf, a classe do capítulo anterior que é dona de um array no heap. Depois avance por ele, e pela versão com uma linha esquecida.",
  cppMv_hPart: "Parte",
  cppMv_hMeans: "O que significa",
  cppMv_p1: "Uma referência rvalue: uma referência que só se liga a objetos prestes a desaparecer, ou que quem chamou abandonou. Receber uma é permissão para levar o conteúdo.",
  cppMv_p2: "Copia o tamanho e o ponteiro: o objeto novo passa a ser dono do bloco da origem. Esse é todo o custo de um movimento: duas cópias pequenas, qualquer que seja o tamanho do array.",
  cppMv_p3: "Esvazia a origem. Ela ainda será destruída depois; sem esta linha, o destrutor dela liberaria o bloco que acabamos de pegar.",
  cppMv_p4: "Uma promessa de que esta função nunca lança exceção. Um movimento que só copia ponteiros não tem como falhar, então diga isso. O std::vector depende disso, como uma seção abaixo mostra.",
  cppMv_p5: "O \"terminei com a\" de quem chama. Faz o compilador escolher Buf(Buf&&) em vez de Buf(const Buf&).",
  cppMv_figMoveTitle: "Um movimento entrega o bloco",

  cppMv_assignTitle: "Atribuição por movimento",
  cppMv_assignBody: "b = std::move(a) quando b já existe chama o operador de atribuição por movimento. Como a atribuição por cópia, ele precisa primeiro cuidar do bloco que b já possui. std::exchange(x, v), de <utility>, põe v em x e devolve o valor antigo de x: uma chamada que pega o ponteiro da origem e deixa nullptr no lugar.",

  cppMv_catTitle: "lvalues e rvalues: quem pode ser roubado",
  cppMv_catBody: "Como o compilador sabe quando mover é seguro? Toda expressão em C++ tem, além do tipo, uma categoria de valor: ela responde se o objeto que a expressão nomeia ainda será usado depois. O padrão tem três, com nomes antigos e estranhos. Um lvalue (historicamente, o que pode ficar à esquerda do =) tem nome e ainda está em uso. Um prvalue (\"rvalue puro\") é um temporário sem nome, como o resultado de uma função que devolve por valor. Um xvalue (\"valor expirando\") tem nome mas foi marcado como encerrado, que é exatamente o que std::move faz. Os dois últimos juntos são os rvalues: as coisas das quais é seguro mover.",
  cppMv_hCat: "Categoria",
  cppMv_hTest: "Teste rápido",
  cppMv_hEx: "Exemplos",
  cppMv_l1: "Tem nome, ou você consegue tirar o endereço com &.",
  cppMv_l1ex: "a, v[0], *p, b (um parâmetro Buf&&)",
  cppMv_l2:"Um temporário feito pela própria expressão.",
  cppMv_l3: "Um objeto com nome convertido para \"expirando\".",
  cppMv_namedWarn: "Um parâmetro declarado Buf&& b é, dentro da função, um lvalue: ele tem nome, então o compilador supõe que você pode usá-lo de novo. Para repassá-lo como movimento, escreva std::move(b). Esse é o motivo mais comum de uma função \"que move\" copiar em silêncio.",

  cppMv_stdmoveTitle: "std::move não move nada",
  cppMv_stdmoveBody: "Apesar do nome, std::move não faz trabalho nenhum em tempo de execução. É uma conversão (um cast): transforma o argumento num xvalue, e só. O movimento acontece depois, no construtor ou na atribuição por movimento que a resolução de sobrecarga então escolhe. Se a classe não tem nenhum, a cópia roda no lugar, como a figura mostrou com take(Buf&&) desmarcado.",
  cppMv_fromBody: "Depois de um movimento, a origem fica num estado \"movido\". Para os tipos padrão a regra é \"válido mas não especificado\": o objeto continua funcionando e pode ser destruído ou receber um valor novo, mas você não deve contar com o que ele guarda. Nas suas classes, faça do estado movido o estado vazio, como o Buf faz, e só atribua a um objeto movido ou deixe-o ser destruído.",

  cppMv_retTitle: "Devolver por valor: nem cópia, nem movimento",
  cppMv_retBody: "Devolver um objeto local é onde os movimentos mais importam, e onde você deve escrever menos. O compilador pode construir o objeto local direto no lugar onde quem chamou quer o resultado, então não sobra nada para copiar ou mover. Isso se chama elisão de cópia. Para um temporário devolvido (return Buf{1000};) ela é garantida desde o C++17; para um local com nome (return r;) é a otimização do valor de retorno nomeado, NRVO, que todo compilador importante faz. Quando ela não é possível, o return move automaticamente. Compare os dois programas e conte as linhas de cada saída.",
  cppMv_figRetTitle: "return r contra return std::move(r)",
  cppMv_hWrite: "Você escreve",
  cppMv_hHappens: "O que acontece",
  cppMv_r1: "Construído no lugar de quem chamou. Garantido: nem é preciso ter construtor de cópia ou de movimento.",
  cppMv_r2: "Normalmente construído no lugar de quem chamou (NRVO); senão, movido, automaticamente.",
  cppMv_r3: "Proíbe a elisão: sempre um movimento e um destrutor a mais. Nunca escreva isso para um local; -Wpessimizing-move avisa.",
  cppMv_r4: "Um membro não é um local, então é copiado. Se o objeto não precisa mais dele, return std::move(member_) está certo aqui.",

  cppMv_noexceptTitle: "noexcept, e por que o std::vector se importa",
  cppMv_noexceptBody: "Quando um std::vector fica sem capacidade, ele aloca um bloco maior e leva os elementos para lá, como a figura do capítulo de std::vector mostrou. Movê-los seria barato. Mas o std::vector promete que, se algo lançar exceção durante o push_back, o vector fica como estava. Se mover o elemento 500 lançasse, os elementos 0 a 499 já estariam esvaziados, e a promessa quebrada. Então o std::vector só move elementos cujo construtor de movimento é noexcept; senão, copia todos, por segurança.",
  cppMv_noexceptAfter: "= default pede ao compilador que escreva a função do jeito usual, membro a membro; os movimentos que ele escreve são noexcept sempre que os dos membros forem. A regra para guardar: todo construtor de movimento e toda atribuição por movimento que você escreve à mão levam noexcept.",

  cppMv_fiveTitle: "A regra dos cinco, e de volta ao zero",
  cppMv_fiveBody: "A regra dos três do capítulo anterior cresce para a regra dos cinco: uma classe dona de algo cru escreve o destrutor, as duas cópias e os dois movimentos (ou apaga alguns). Um caso clássico é um handle para algo na GPU. O OpenGL entrega buffers como números simples: glGenBuffers cria um e escreve o número dele em id, glDeleteBuffers o destrói. Um buffer da GPU não pode ser copiado de forma sensata, mas pode trocar de dono: a classe abaixo só se move.",
  cppMv_hMember: "Membro especial",
  cppMv_hCalledBy: "Chamado por",
  cppMv_s1: "o fim da vida do objeto",
  cppMv_s2: "T b = a; passar a por valor",
  cppMv_s3: "b = a;",
  cppMv_s4: "T b = std::move(a); T b = make();  passar um temporário por valor",
  cppMv_s5: "b = std::move(a);  b = make();",
  cppMv_zeroNote: "Escreva qualquer um dos cinco você mesmo, nem que seja só um destrutor, e o compilador deixa de escrever os movimentos por você: as cópias são usadas no lugar, em silêncio. Mais um motivo para a regra do zero. Com os smart pointers do próximo capítulo, até o trabalho do GLBuffer pode ser feito por um membro, e a maioria das classes não escreve nenhum dos cinco.",

  cppMv_fwdTitle: "Um olhar adiante: referências de encaminhamento",
  cppMv_fwdBody: "Num template, onde o tipo é um parâmetro T deduzido da chamada, T&& quer dizer outra coisa: uma referência de encaminhamento (forwarding reference), que se liga a qualquer coisa e lembra se quem chamou passou um lvalue ou um rvalue. std::forward<T>(x) repassa x do mesmo jeito que ele chegou: copiado se veio como lvalue, movido se veio como rvalue. É assim que o emplace_back constrói um elemento no lugar a partir de quaisquer argumentos que você der. Templates têm capítulo próprio; por enquanto, reconheça o padrão.",

  cppMv_tryTitle: "Tente você mesmo",
  cppMv_try1: "Acrescente ao Noisy um construtor de movimento que imprime move e dá ao resultado um * (\"a*\"). Ponha três Noisy num std::vector sem reserve e leia a saída; depois tire o noexcept e rode de novo.",
  cppMv_try2: "Escreva Buf make() com return r; e depois com return std::move(r);. Compile os dois com -Wall -Wextra e leia o aviso.",
  cppMv_try3: "Escreva uma função void take(Buf&& b) { Buf mine = b; } e confira, com prints, que ela copia. Conserte com std::move.",
  cppMv_try4: "Apague o.data_ = nullptr; do construtor de movimento do Buf e rode com -fsanitize=address. Ache o double free no relatório.",

  cppMv_key0: "Um movimento entrega o que um objeto possui e deixa a origem vazia mas destrutível; o custo não depende do tamanho dos dados.",
  cppMv_key1: "Um construtor de movimento recebe T&&, copia os ponteiros e zera a origem. Marque-o, e a atribuição por movimento, noexcept.",
  cppMv_key2: "lvalues têm nome e continuam em uso; rvalues (prvalues e xvalues) podem ser movidos. Um parâmetro T&& é um lvalue dentro da função.",
  cppMv_key3: "std::move é só uma conversão para rvalue; o movimento acontece no construtor ou na atribuição que ele seleciona, e std::move num objeto const copia.",
  cppMv_key4: "Devolva locais com return r;: o compilador elide ou move. return std::move(r); só acrescenta trabalho.",
  cppMv_key5: "Regra dos cinco para classes donas de algo cru; regra do zero para todo o resto.",
};

export default text;
