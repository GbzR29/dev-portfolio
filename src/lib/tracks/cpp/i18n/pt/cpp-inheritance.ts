// PT text for src/lib/tracks/cpp/chapters/cpp-inheritance.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppInh_intro: "Um jogo tem slimes que pulam, morcegos que voam e torretas que nunca saem do lugar. Eles são diferentes, mas o laço principal quer tratar todos do mesmo jeito: uma vez por quadro, mandar cada inimigo se atualizar, sem se importar com o tipo dele. Programadores de C resolviam isso com um campo de tipo e um switch, e cada inimigo novo exigia editar todos os switches do programa. O C++ deixa cada tipo carregar o próprio comportamento, então o laço pode dizer enemy->update() e o código certo roda. Este capítulo mostra como escrever isso e depois abre a máquina por baixo, que no fim é uma pequena tabela de endereços de funções.",
  cppInh_goal0: "Escrever uma classe base e classes derivadas, e saber o que uma classe derivada herda.",
  cppInh_goal1: "Explicar por que uma chamada por um ponteiro para a base precisa de virtual para chegar à função da derivada.",
  cppInh_goal2: "Descrever o que são o vptr e a vtable, e quanto custa uma chamada virtual.",
  cppInh_goal3: "Usar override, classes abstratas e destrutor virtual, e evitar o fatiamento.",

  cppInh_cTitle: "O jeito do C: uma etiqueta e um switch",
  cppInh_cAfter: "Funciona, e para um conjunto pequeno e fixo de tipos ainda é um bom projeto. A fraqueza aparece quando o jogo cresce: cada tipo novo de inimigo obriga a achar todos os switches (update, draw, hit, save…) e acrescentar um case, e um case esquecido compila sem nenhum aviso. O comportamento de um morcego fica espalhado pelo programa inteiro em vez de morar num lugar só.",

  cppInh_baseTitle: "Classe base e classes derivadas",
  cppInh_baseBody: "Herança deixa uma classe começar como cópia de outra e acrescentar coisas. A classe de onde se parte é a classe base; a nova é a classe derivada. Todo objeto derivado contém dentro dele um objeto base completo, chamado de subobjeto base, mais o que a classe derivada acrescenta.",
  cppInh_hPart: "Parte",
  cppInh_hMeans: "O que significa",
  cppInh_b1: "Slime deriva de Enemy. public quer dizer que os membros públicos de Enemy continuam públicos em Slime, então qualquer um pode chamar s.hit(5). (Herança private existe, mas raramente é o que você quer.)",
  cppInh_b2: "Um terceiro nível de acesso: como private para o mundo de fora, mas as classes derivadas podem usar. As funções de Slime podem ler hp_; main não pode.",
  cppInh_b3: "Um construtor derivado nomeia primeiro o construtor da base na sua lista de inicialização. A parte base é construída antes dos membros da derivada, e destruída depois deles.",
  cppInh_b4: "Slime não escreveu hit; ela herdou. Lá dentro, hp_ é o hp_ da parte Enemy de s.",
  cppInh_b5: "O update de Slime esconde o de Enemy: por um Slime, a chamada chega em Slime::update.",
  cppInh_isA: "Use herança pública só quando a frase \"um Slime é um Enemy\" for verdadeira: em todo lugar onde o programa espera um Enemy, um Slime precisa poder ficar no lugar. É disso que trata a próxima seção.",

  cppInh_ptrTitle: "Por um ponteiro para a base, a função da derivada se perde",
  cppInh_ptrBody: "Como todo Slime contém um Enemy, um ponteiro ou referência para Enemy pode apontar para um Slime. A conversão é automática. É isso que deixa um único laço guardar todos os tipos de inimigo. Mas experimente:",
  cppInh_ptrAfter: "Quando o compilador traduz e->update, tudo o que ele sabe é o tipo com que e foi declarado, Enemy*. Para qual objeto e vai apontar só se sabe com o programa rodando. Então, por padrão, ele chama Enemy::update, decidido uma vez em tempo de compilação. Isso se chama ligação estática. Para uma função que as classes derivadas devem substituir, precisamos da decisão em tempo de execução, a partir do tipo real do objeto.",

  cppInh_virtTitle: "virtual: decidir em tempo de execução",
  cppInh_virtAfter: "virtual na frente de uma função membro quer dizer: uma chamada por ponteiro ou referência escolhe o corpo pelo tipo real do objeto, no momento da chamada. Isso é ligação dinâmica, e uma chamada escrita uma vez que se comporta diferente para cada tipo se chama polimorfismo (do grego, \"muitas formas\"). A redefinição numa classe derivada é um override (uma sobrescrita). Uma função virtual na base continua virtual em toda classe derivada, com ou sem a palavra.",
  cppInh_refsToo: "Funciona do mesmo jeito por referência: void tick(Enemy& e) { e.update(dt); } chama Slime::update quando recebe um Slime. Só uma chamada sobre o próprio objeto, s.update(dt), é sempre estática: ali o compilador sabe o tipo exato.",

  cppInh_vtTitle: "Como funciona: o vptr e a vtable",
  cppInh_vtBody: "Não há mágica nem busca. Para cada classe com funções virtuais, o compilador monta uma tabela na memória somente leitura, a vtable (tabela virtual): um array com o endereço da função certa para cada função virtual, numa ordem fixa. Todo objeto dessa classe ganha um campo escondido no seu início, o vptr (ponteiro virtual), que o construtor aponta para a tabela da sua classe. Uma chamada virtual então vira três passos pequenos: ler o vptr do objeto, ler o endereço na posição da função, pular para lá.",
  cppInh_figBody: "Rode as chamadas abaixo. Escolha para qual objeto e aponta e qual chamada o programa faz, e acompanhe o caminho pela stack, pelo heap, pelas tabelas e pelo código. Depois use os interruptores para quebrar: eles produzem os três bugs clássicos deste capítulo.",
  cppInh_hTerm: "Termo",
  cppInh_hMeaning: "Significado",
  cppInh_tVt: "vtable",
  cppInh_tVtB: "Uma por classe com funções virtuais, montada pelo compilador, guardada na memória somente leitura. A posição i guarda o endereço da função a rodar para a função virtual número i.",
  cppInh_tVp: "vptr",
  cppInh_tVpB: "Um ponteiro escondido em todo objeto dessa classe, em geral os seus primeiros 8 bytes. O construtor o preenche; é assim que um objeto \"sabe\" o próprio tipo em tempo de execução.",
  cppInh_tSlot: "posição (slot)",
  cppInh_tSlotB: "Fixada pela classe base: update fica na mesma posição nas tabelas de Enemy, Slime e Bat. Por isso quem chama não precisa saber o tipo real.",
  cppInh_tInh: "uma posição herdada",
  cppInh_tInhB: "Uma classe derivada que não sobrescreve uma função recebe o endereço da base copiado na sua tabela.",
  cppInh_abiNote: "O padrão do C++ não fala de vtables: ele só diz o que chamadas virtuais precisam fazer. Mas todo compilador grande as implementa assim, com pequenas diferenças de layout da tabela entre a ABI Itanium (GCC e Clang no Linux e no macOS) e o MSVC. Uma ABI (interface binária de aplicação) é o conjunto de regras de como o código compilado organiza objetos e chama funções.",

  cppInh_ovTitle: "override e final: deixe o compilador conferir",
  cppInh_ovBody: "Um override precisa bater exatamente com a função da base: mesmo nome, mesmos tipos de parâmetro, mesmo const. Se não bater, ele é simplesmente uma função nova e diferente, e as chamadas pela base continuam indo para a base. Escrever override depois da lista de parâmetros pede ao compilador que confirme que a função de fato substitui uma virtual, e que pare com erro se não substituir. Escreva sempre.",

  cppInh_absTitle: "Classes abstratas: interfaces",
  cppInh_absBody: "Às vezes a classe base não tem um comportamento que faça sentido sozinho: o que um \"Shape\" genérico desenharia? Escreva = 0 no lugar do corpo para tornar uma função virtual pura. Uma classe com pelo menos uma função virtual pura é abstrata: não dá para criar objetos dela, só de classes derivadas que sobrescrevem toda função pura. Uma classe abstrata com nada além de funções virtuais puras é o que outras linguagens chamam de interface.",

  cppInh_dtorTitle: "O destrutor virtual",
  cppInh_dtorBody: "delete e num Enemy* também é uma chamada: ao destrutor. Se ~Enemy não é virtual, ele é ligado estaticamente como qualquer outra função, então só ~Enemy roda. O destrutor da derivada nunca roda, nem os destrutores dos membros da classe derivada. Formalmente, apagar um objeto derivado por um ponteiro para a base cujo destrutor não é virtual é comportamento indefinido. Na prática, vaza o que a parte derivada possuía. Na figura, desmarque virtual no destrutor e apague um Bat: o bloco do path dele nunca é liberado.",
  cppInh_dtorRule: "Regra: uma classe feita para ser usada por um ponteiro para a base ganha virtual ~Base() = default;. Se uma classe não foi feita para ser base, marque-a final, e a pergunta nem aparece.",

  cppInh_sliceTitle: "Fatiamento: polimorfismo precisa de ponteiros ou referências",
  cppInh_sliceAfter: "Um parâmetro ou elemento de vector do tipo Enemy tem espaço exatamente para um Enemy. Copiar um Bat para ele copia só a parte Enemy e joga o resto fora; o vptr da cópia é o de Enemy. Isso se chama fatiamento (slicing). O polimorfismo só funciona por algo que se refere ao objeto original: um ponteiro, uma referência ou um smart pointer.",
  cppInh_storeTitle: "Guardando vários tipos de objeto juntos",
  cppInh_storeAfter: "Cada elemento é um unique_ptr que possui um inimigo no heap, do capítulo de RAII. O vector guarda ponteiros, então não há fatiamento, e cada inimigo é apagado quando o seu ponteiro é removido ou o vector morre.",

  cppInh_costTitle: "Quanto custa, e quando não usar",
  cppInh_hCost: "Custo",
  cppInh_hWhy: "Por quê",
  cppInh_k1: "8 bytes por objeto",
  cppInh_k1b: "O vptr. Para um objeto de 16 bytes, é metade do tamanho a mais.",
  cppInh_k2: "Uma chamada indireta",
  cppInh_k2b: "Duas leituras de memória e um salto para um endereço só conhecido em tempo de execução. A CPU prevê bem quando o mesmo tipo se repete, mal quando os tipos vêm misturados ao acaso.",
  cppInh_k3: "Sem inlining",
  cppInh_k3b: "O compilador não pode colar o corpo de uma função dentro de quem chama quando não sabe qual função vai rodar. Para funções minúsculas, é o maior custo. (Os compiladores tiram esse custo quando conseguem provar o tipo, e final ajuda nisso.)",
  cppInh_k4: "Objetos no heap",
  cppInh_k4b: "Muitos tipos num contêiner costumam significar uma alocação por objeto, espalhadas pela memória, o que é lento de percorrer. O capítulo de Desempenho volta a isso.",
  cppInh_alts: "Herança é a ferramenta certa quando o conjunto de tipos é aberto: plugins, ou código que outras pessoas estendem sem mexer no seu. Duas alternativas costumam ser melhores. Composição: em vez de um Bat ser um Enemy especial, um Enemy tem um componente Movement, e trocar componentes muda o comportamento sem uma classe para cada combinação. std::variant<Slime, Bat, Turret>, do capítulo de Tipos de vocabulário: um conjunto fechado de tipos guardados por valor, lado a lado, sem heap e sem vtable; o compilador então confere que todo tipo foi tratado, exatamente o que o switch do C não conseguia.",

  cppInh_tryTitle: "Experimente",
  cppInh_try1: "Escreva Enemy, Slime e Bat com um update virtual, guarde-os num std::vector<std::unique_ptr<Enemy>> e atualize todos num laço só. Acrescente uma Turret sem mexer no laço.",
  cppInh_try2: "Tire virtual do update e rode de novo. Depois devolva, tire o override de Bat e troque o parâmetro de Bat por double. Explique cada saída.",
  cppInh_try3: "Imprima sizeof(Enemy) com e sem nenhuma função virtual. Explique a diferença.",
  cppInh_try4: "Dê a Bat um membro std::vector, deixe ~Enemy não virtual, apague um Bat por um Enemy* e compile com -fsanitize=address. Leia o relatório e depois corrija.",

  cppInh_key0: "Uma classe derivada contém um objeto base inteiro e acrescenta a ele; use herança pública só para um \"é um\" verdadeiro.",
  cppInh_key1: "Por um ponteiro ou referência para a base, uma chamada não virtual vai para a função da base, escolhida em tempo de compilação.",
  cppInh_key2: "Uma chamada virtual lê o vptr do objeto, pega a posição da função na vtable da classe dele e pula para lá.",
  cppInh_key3: "Escreva override em todo override: uma assinatura errada vira erro de compilação em vez de bug silencioso.",
  cppInh_key4: "Uma classe base usada por ponteiros precisa de destrutor virtual; senão as partes derivadas nunca são destruídas.",
  cppInh_key5: "Copiar um objeto derivado para um valor da base o fatia; guarde objetos polimórficos atrás de ponteiros, como unique_ptr.",
  cppInh_key6: "Chamadas virtuais custam um ponteiro por objeto, uma chamada indireta e o inlining perdido; std::variant ou composição muitas vezes servem melhor.",
};

export default text;
