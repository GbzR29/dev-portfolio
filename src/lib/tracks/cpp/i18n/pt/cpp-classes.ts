// PT text for src/lib/tracks/cpp/chapters/cpp-classes.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppCls_intro: "Nos capítulos de C, todo struct vinha com regras escritas em comentários. O tamanho do IntVec nunca pode passar da capacidade. Um FILE precisa ser fechado exatamente uma vez. Um valor de vida precisa ficar entre zero e o máximo. Nada garantia essas regras: qualquer linha do programa podia pôr qualquer coisa nos campos, e cada chamada de limpeza esquecida era um vazamento. Uma classe é um struct que consegue garantir as próprias regras. Ela decide quais dos seus campos o resto do programa pode tocar, roda um construtor para estar válida desde o primeiro instante, e roda um destrutor para limpar a própria bagunça. Toda a linguagem C++ é construída sobre essa ideia.",
  cppCls_goal0: "Escrever uma classe com dados privados e funções membro públicas que mantêm uma regra verdadeira.",
  cppCls_goal1: "Escrever um construtor com lista de inicialização de membros, e um destrutor.",
  cppCls_goal2: "Prever a ordem exata em que objetos e os seus membros são construídos e destruídos.",
  cppCls_goal3: "Dividir uma classe entre um header e um arquivo-fonte.",

  cppCls_structTitle: "O problema: um struct que qualquer um quebra",
  cppCls_structAfter: "A função damage respeita a regra, mas nada obriga o resto do programa a passar por ela. Uma regra assim, que precisa ser sempre verdadeira sobre um objeto, se chama invariante. Uma classe faz o compilador protegê-la.",

  cppCls_classTitle: "Uma classe que protege a sua regra",
  cppCls_hPart: "Parte",
  cppCls_hMeans: "O que significa",
  cppCls_c1: "Define um tipo novo, como um struct. Repare no ponto e vírgula depois da chave de fechamento.",
  cppCls_c2: "Rótulos de acesso. Tudo depois de public: pode ser usado em qualquer lugar; tudo depois de private:, só pelas funções membro da própria classe. O compilador garante isso.",
  cppCls_c3: "Uma função membro: uma função que pertence à classe e trabalha sobre um objeto. Chamada como h.damage(30).",
  cppCls_c4: "Dentro de uma função membro, os campos do objeto são usados pelo nome. São os campos do objeto sobre o qual ela foi chamada.",
  cppCls_c5: "Um getter: deixa o lado de fora ler hp_ sem poder mudá-lo. O const depois dos parênteses promete que esta função não muda o objeto.",
  cppCls_c6: "Só um costume de nomes, para que campos privados não se choquem com nomes de função como hp(). Alguns projetos usam m_hp.",
  cppCls_thisBody: "Como damage sabe sobre qual objeto trabalhar? Toda função membro recebe um parâmetro extra escondido, this: um ponteiro para o objeto sobre o qual foi chamada. h.damage(30) é compilado de um jeito muito parecido com a chamada em C damage(&h, 30), e hp_ dentro dela significa this->hp_. O código de máquina é o mesmo da versão em C. O que mudou é quem pode chamá-la.",
  cppCls_structVsClass: "struct e class são a mesma coisa no C++, com uma diferença: os membros de um struct são públicos até você dizer o contrário, os de uma class são privados. A convenção: struct para pacotes simples de dados sem regra a manter (um Vec2, uma Color), class quando há uma invariante a proteger.",

  cppCls_ctorTitle: "Construtores: válido desde o primeiro instante",
  cppCls_ctorBody: "Um construtor é uma função membro com o nome da classe e sem tipo de retorno. Ele roda automaticamente sempre que um objeto é criado, então não existe instante em que um Health exista sem estar preparado. No C, um struct declarado sem valor guardava lixo até alguém lembrar de chamar uma função init.",
  cppCls_initTitle: "A lista de inicialização de membros",
  cppCls_initBody: "A parte depois dos dois-pontos, : max_(…), hp_(max_), é a lista de inicialização de membros. Ela dá a cada campo o seu primeiro valor, antes de o corpo do construtor, entre as chaves, rodar. Prefira-a a atribuir no corpo: atribuir significa que o campo foi primeiro construído vazio e depois sobrescrito, e alguns campos (os const, as referências) nem podem receber atribuição.",
  cppCls_orderWarn: "Os campos são inicializados na ordem em que são declarados na classe, não na ordem em que aparecem na lista. Em Health, max_ é declarado antes de hp_, então hp_(max_) lê um max_ já definido. Troque as duas declarações e hp_ copiaria um max_ que ainda não existe. O -Wall avisa quando a lista está escrita numa ordem diferente (-Wreorder).",
  cppCls_explicitBody: "Um construtor com um parâmetro também funciona como uma conversão automática: sem explicit, Health h = 50; e uma chamada damage_all(50) a uma função que recebe um Health construiriam em silêncio um Health a partir do número. Marque construtores de um parâmetro como explicit, a menos que a conversão seja natural de verdade (uma std::string a partir de um literal de texto é).",

  cppCls_dtorTitle: "Destrutores, e a ordem de tudo",
  cppCls_dtorBody: "Um destrutor se escreve ~NomeDaClasse(), sem parâmetros. Ele roda automaticamente quando a vida do objeto termina: para uma variável local, na chave que fecha o seu escopo. Para ver isso acontecer, aqui está uma classe cuja única tarefa é se anunciar.",
  cppCls_figBody: "Percorra os três programas. No primeiro, veja a ordem em que objetos em escopos aninhados morrem. No segundo, veja como um objeto com membros é montado e desmontado. No terceiro, uma função sai mais cedo, e o destrutor roda mesmo assim. Depois marque a caixa para tirar todos os destrutores, que é o mundo do C.",
  cppCls_hWhen: "Quando",
  cppCls_hOrder: "Ordem",
  cppCls_o1: "Objetos num mesmo escopo",
  cppCls_o1b: "Construídos de cima para baixo, destruídos de baixo para cima: o inverso da construção.",
  cppCls_o2: "Construindo um objeto",
  cppCls_o2b: "Primeiro os seus membros, na ordem de declaração, depois o corpo do construtor.",
  cppCls_o3: "Destruindo um objeto",
  cppCls_o3b: "Primeiro o corpo do destrutor, depois os seus membros, na ordem inversa da declaração.",
  cppCls_o4: "Saindo cedo de um escopo",
  cppCls_o4b: "return, break, continue ou uma exceção: todo objeto já construído no escopo é destruído, em ordem inversa. Objetos ainda não construídos são pulados.",
  cppCls_timerTitle: "Um destrutor que faz trabalho útil",
  cppCls_timerBody: "Destrutores não servem só para liberar memória. Esta classe mede quanto tempo um escopo leva: o construtor anota a hora, o destrutor imprime a diferença. Ponha um no topo de qualquer função e você tem um medidor que não consegue esquecer de parar, por qualquer return que a função saia. std::chrono é a biblioteca padrão de tempo; steady_clock é um relógio que nunca anda para trás.",
  cppCls_ownTitle: "Possuindo memória: desligue a cópia por enquanto",
  cppCls_ownBody: "Um destrutor é o lugar natural para liberar memória, então aqui está o IntVec dos capítulos de C como classe. Há um porém. Copiar um objeto copia os seus campos, e o campo data_ é um ponteiro: dois IntVecs segurariam o mesmo bloco, e os dois destrutores o liberariam, um double free. Até os capítulos de RAII e de semântica de movimento mostrarem como copiar e mover uma classe assim do jeito certo, marque a cópia como deletada, e o compilador vai recusar qualquer cópia.",
  cppCls_ownAfter: "new int[cap] é o malloc do C++ para um array, e delete[] é o seu free. Você raramente vai escrevê-los: o std::vector do próximo capítulo é esta classe, terminada, com cópia, crescimento e conferência de limites feitos direito.",

  cppCls_splitTitle: "Header e arquivo-fonte",
  cppCls_splitBody: "Num projeto real, a definição da classe vai num header, para que todo arquivo que usa Health possa vê-la, e os corpos das funções membro mais longas vão num arquivo .cpp, compilado uma vez. Fora da classe, o nome de uma função membro se escreve com a classe na frente: Health::damage.",

  cppCls_tryTitle: "Experimente",
  cppCls_try1: "Escreva uma classe Ammo com o tamanho do pente e uma contagem que nunca fica abaixo de 0 nem acima do pente: fire() devolve false quando vazia, reload() recarrega. Tente quebrar a regra a partir de main e leia o erro do compilador.",
  cppCls_try2: "Dê dois Noisy como membros a uma classe Level, depois crie um Level dentro de um bloco em main. Preveja a ordem da saída antes de rodar.",
  cppCls_try3: "Ponha um ScopeTimer numa função com três return diferentes. Confira que ele imprime exatamente uma vez por chamada, qualquer que seja o return tomado.",
  cppCls_try4: "Tire as duas linhas = delete do IntVec, copie um (IntVec b = a;) e rode com -fsanitize=address. Leia o relatório.",

  cppCls_key0: "Uma classe mantém os seus campos privados e expõe funções membro, então a sua invariante não pode ser quebrada de fora.",
  cppCls_key1: "struct e class só diferem no acesso padrão: struct para dados simples, class quando há uma regra a manter.",
  cppCls_key2: "Um construtor deixa o objeto válido desde o primeiro instante; preencha os campos na lista de inicialização, na ordem de declaração.",
  cppCls_key3: "Um destrutor roda automaticamente no fim da vida do objeto, em todo caminho de saída do escopo.",
  cppCls_key4: "A construção vai membros-depois-corpo; a destruição é exatamente o inverso.",
  cppCls_key5: "Uma classe que libera um ponteiro no destrutor não pode ser copiada de qualquer jeito: delete a cópia até implementá-la.",
};

export default text;
