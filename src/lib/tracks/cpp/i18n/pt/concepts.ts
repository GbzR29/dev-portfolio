// PT text for src/lib/tracks/cpp/chapters/concepts.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppCpt_intro: "No capítulo anterior, max_of(m1, m2) com um Mesh falhou com um erro que apontava para dentro do max_of, para a < b, uma linha que você não escreveu. O template tinha um requisito o tempo todo, \"T precisa aceitar <\", mas ele nunca foi escrito: estava escondido no corpo, e o compilador só o encontrou enquanto escrevia a função. Um concept escreve esse requisito na assinatura, como uma regra com nome que o compilador confere na sua chamada. Templates deixam de ser \"qualquer coisa, e boa sorte\" e passam a dizer do que precisam.",
  cppCpt_goal0: "Escrever um concept com uma requires-expression e ler cada tipo de requisito.",
  cppCpt_goal1: "Restringir um template em cada uma das quatro grafias, e escolher a mais clara.",
  cppCpt_goal2: "Prever qual sobrecarga vence quando várias restritas servem, e por que montar concepts pelo nome importa.",
  cppCpt_goal3: "Usar os concepts padrão e testar os seus com static_assert.",

  cppCpt_hiddenTitle: "O requisito escondido",
  cppCpt_hiddenAfter: "typename T aceita qualquer tipo. O compilador só descobre que Mesh está errado depois de substituí-lo e começar a compilar o corpo. Aqui o corpo tem uma linha, então o erro é fácil de ler. Numa biblioteca de verdade, a linha que falha pode estar cinco chamadas abaixo, num header que você nunca abriu.",

  cppCpt_firstTitle: "Um primeiro concept",
  cppCpt_hPart: "Parte",
  cppCpt_hMeans: "O que significa",
  cppCpt_a1: "Define um concept: uma pergunta de sim ou não sobre um tipo, com nome, respondida na compilação. LessComparable<int> é true, LessComparable<Mesh> é false.",
  cppCpt_a2: "Uma requires-expression. a e b são imaginários: nenhum objeto é criado. Eles existem só para você escrever as expressões que T precisa aceitar.",
  cppCpt_a3: "Um requisito: a < b precisa compilar, e o resultado precisa converter para bool.",
  cppCpt_a4: "Usa o concept no lugar de typename: só tipos que o satisfazem podem virar T.",
  cppCpt_firstAfter: "Agora o erro está na chamada, no seu arquivo, e diz qual promessa o Mesh quebrou. Nada muda para os tipos que funcionavam: o código gerado é idêntico.",
  cppCpt_kindsTitle: "Os quatro tipos de requisito",
  cppCpt_hKind: "Tipo",
  cppCpt_hChecks: "Confere",
  cppCpt_k1k: "simples",
  cppCpt_k1: "Só que a expressão compila. O resultado é ignorado.",
  cppCpt_k2k: "composto",
  cppCpt_k2: "Que compila, e que o tipo do resultado satisfaz o concept depois do ->. O tipo do resultado entra como primeiro argumento desse concept: -> std::same_as<int> quer dizer std::same_as<resultado, int>. Escreva noexcept depois das chaves para exigir que não lance exceção.",
  cppCpt_k3k: "de tipo",
  cppCpt_k3: "Que um nome aninhado existe e é um tipo.",
  cppCpt_k4k: "aninhado",
  cppCpt_k4: "Que uma condição de compilação é verdadeira. Sem a palavra requires, sizeof(T) <= 64 seria um requisito simples, que só confere que compila, e isso sempre compila.",
  cppCpt_nestedWarn: "Esse último ponto é o deslize clássico: requires(T x) { sizeof(T) <= 64; } é true para qualquer tipo, porque comparar dois números sempre compila. Dentro das chaves, só uma linha que começa com requires confere um valor.",

  cppCpt_shapeTitle: "Formas e sólidos",
  cppCpt_shapeBody: "Concepts se combinam com && e ||, então Solid é montado em cima de Shape. Repare no que Shape não diz: não há classe base nem função virtual. Qualquer tipo com esses dois membros é um Shape, seja quem for que o escreveu. Confira cada tipo abaixo, e depois veja qual sobrecarga de describe() cada um recebe.",

  cppCpt_spellTitle: "Quatro jeitos de escrever a mesma restrição",
  cppCpt_hForm: "Forma",
  cppCpt_hUse: "Use quando",
  cppCpt_s1: "A escolha de costume: curta, e T tem um nome para usar no corpo.",
  cppCpt_s2: "A condição é uma combinação: requires std::integral<T> || std::floating_point<T>.",
  cppCpt_s3: "Restringir uma função membro de um template de classe pelo T da classe.",
  cppCpt_s4: "Uma função curta em que o tipo não precisa de nome. Cada auto é um tipo próprio.",

  cppCpt_stdTitle: "Os concepts padrão",
  cppCpt_stdBody: "<concepts>, <iterator> e <ranges> já definem os que você mais vai precisar. Prefira-os aos seus quando dizem o que você quer dizer.",
  cppCpt_hConcept: "Concept",
  cppCpt_hReq: "Exige",
  cppCpt_r1: "Um tipo inteiro (int, char, long…), ou um de ponto flutuante (float, double).",
  cppCpt_r2: "Exatamente o mesmo tipo.",
  cppCpt_r3: "From converte para To implicitamente.",
  cppCpt_r4: "D herda publicamente de B.",
  cppCpt_r5: "<, >, <=, >=, == e != funcionam e concordam entre si: um LessComparable melhor.",
  cppCpt_r6: "Pode ser copiado, ou ao menos movido (o capítulo de Movimento).",
  cppCpt_r7: "F pode ser chamado com esses argumentos: a restrição certa para um callback ou uma lambda.",
  cppCpt_r8: "Tem begin() e end(): qualquer coisa que um for de intervalo percorre. Aceite isso em vez de um std::vector.",
  cppCpt_r9: "Um iterador que pula: it += n num passo só (vector, array). Um iterador de list é só bidirecional.",

  cppCpt_overTitle: "Sobrecarga por restrições",
  cppCpt_overBody: "Para um iterador de vector, as duas sobrecargas servem. O compilador escolhe a mais restrita: aquela cuja restrição inclui a da outra. std::random_access_iterator é definido como std::bidirectional_iterator e mais alguma coisa, que é definido como std::forward_iterator e mais alguma coisa, e assim por diante até std::input_iterator, então ele vence. Essa relação entre restrições se chama subsunção.",
  cppCpt_subsumeWarn: "O compilador só enxerga que um concept inclui outro pelos nomes: Solid menciona Shape<T>, então todo Solid é sabidamente um Shape. Se em vez disso você copiar as duas linhas de Shape para dentro de Solid, o significado é o mesmo mas a ligação some, e uma chamada que as duas sobrecargas aceitam fica ambígua. É a chave de quebrar da figura. Monte concepts maiores a partir dos menores, pelo nome.",

  cppCpt_testTitle: "Testando concepts com static_assert",
  cppCpt_testAfter: "Um concept usado como Shape<Circle> é uma constante bool, então o static_assert pode conferi-lo. São testes que rodam durante a compilação: se alguém renomear Circle::area, o build para nesta linha, com uma mensagem clara, e não num template lá longe.",

  cppCpt_autoTitle: "Restringindo uma variável",
  cppCpt_autoAfter: "auto sozinho aceita qualquer tipo. Um concept antes do auto mantém a comodidade e ainda documenta, e confere, o que o código espera.",

  cppCpt_oldTitle: "Antes dos concepts: enable_if",
  cppCpt_oldAfter: "Você ainda vai encontrar a primeira forma em código mais antigo. Ela se apoia numa regra chamada SFINAE (substitution failure is not an error, falha de substituição não é erro): quando pôr T na assinatura de um template produz algo inválido, aquele template sai dos candidatos em silêncio em vez de causar erro. std::enable_if_t<false, int> é feito para ser inválido de propósito. Funciona, mas esconde a intenção num truque; os concepts dizem o mesmo em palavras simples.",

  cppCpt_whenTitle: "Quando escrever um concept",
  cppCpt_w1: "Restrinja todo template que outras pessoas chamam. O concept é documentação que o compilador faz cumprir.",
  cppCpt_w2: "Exija o que o corpo usa, nada mais. Um max_of que exige std::copyable rejeita tipos com que lidaria muito bem.",
  cppCpt_w3: "Dê ao concept o nome do que os tipos sabem fazer (Drawable, Hashable), não o de uma classe que por acaso serve.",
  cppCpt_w4: "Procure primeiro um concept padrão; escreva o seu quando ele acrescentar um significado do seu programa, como Shape.",

  cppCpt_tryTitle: "Experimente",
  cppCpt_try1: "Escreva um concept Numeric que aceita inteiros e tipos de ponto flutuante, use-o numa função average(const std::vector<T>&), e confira com static_assert que std::string não é Numeric.",
  cppCpt_try2: "Escreva o concept Pooled com sizeof(T) <= 64 mas sem a palavra requires na frente. Teste num tipo de 100 bytes e explique o resultado.",
  cppCpt_try3: "Dê ao describe() uma quarta sobrecarga para um concept Named (só name()). Text passa a recebê-la, mas a chamada com um Circle fica ambígua. Explique por quê, e conserte reescrevendo Shape como Named<T> && requires { area }.",
  cppCpt_try4: "Escreva uma função que recebe const std::ranges::range auto& e imprime cada elemento. Chame com um vector, um std::array e uma std::list.",

  cppCpt_key0: "Um concept é um teste de compilação, com nome, sobre um tipo; ele leva os requisitos escondidos de um template para a assinatura.",
  cppCpt_key1: "Uma requires-expression lista o que precisa compilar: requisitos simples, compostos (com o resultado conferido), de tipo e aninhados.",
  cppCpt_key2: "Com uma restrição, um tipo errado falha na sua chamada, com o requisito quebrado nomeado, em vez de lá dentro do template.",
  cppCpt_key3: "Quando várias sobrecargas restritas servem, vence a mais restrita, o que o compilador só sabe pelos nomes dos concepts.",
  cppCpt_key4: "Prefira os concepts padrão (std::integral, std::invocable, std::ranges::range…) e teste os seus com static_assert.",
  cppCpt_key5: "enable_if e SFINAE fazem o mesmo trabalho em código mais antigo, de forma bem menos legível.",
};

export default text;
