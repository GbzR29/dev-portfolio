// PT text for src/lib/tracks/cpp/chapters/history.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cHist_intro: "Em 1969, num laboratório de pesquisa em Nova Jersey, dois programadores ficaram sem projeto. Em quatro anos eles tinham escrito um sistema operacional e inventado a linguagem para escrevê-lo. Dez anos depois, no mesmo prédio, um jovem pesquisador dinamarquês começou a acrescentar classes a essa linguagem. O sistema operacional era o Unix. As linguagens eram o C e o C++. Meio século depois, elas ainda rodam por baixo de quase tudo: o kernel do seu celular, o navegador que mostra esta página, o motor do último jogo que você jogou. Este capítulo conta como elas nasceram e por que são do jeito que são.",
  cHist_goal0: "Contar de onde veio o C e por que ele foi desenhado em torno da máquina.",
  cHist_goal1: "Explicar o que Stroustrup queria do C++ e como ele nasceu do C.",
  cHist_goal2: "Situar os principais padrões de C e de C++ numa linha do tempo.",
  cHist_goal3: "Dizer por que as duas linguagens ainda importam em 2026 e onde cada uma é usada.",

  cHist_labsTitle: "Bell Labs, 1969",
  cHist_labsBody: "O Bell Telephone Laboratories, em Murray Hill, era o braço de pesquisa da AT&T, o monopólio telefônico americano. Já tinha dado ao mundo o transistor e a teoria da informação. Nos anos 1960 ele construía o Multics, um sistema operacional de tempo compartilhado muito ambicioso, junto com o MIT e a General Electric. O Multics estava atrasado, grande e lento, e em 1969 o Bell Labs saiu do projeto.",
  cHist_unixBody: "Ken Thompson e Dennis Ritchie tinham trabalhado no Multics e sentiam falta do que ele prometia: um sistema confortável, compartilhado por muita gente. Thompson achou um minicomputador PDP-7 pouco usado e, no verão de 1969, escreveu para ele um pequeno sistema operacional em linguagem assembly, junto com um shell, um editor e um montador. Um colega, Brian Kernighan, o apelidou de Unics, um trocadilho com Multics. A grafia logo virou Unix.",

  cHist_bTitle: "Do BCPL ao B e ao C",
  cHist_bBody: "A linguagem assembly é presa a um processador: todo programa precisa ser reescrito para a próxima máquina. Thompson queria algo de mais alto nível, então enxugou o BCPL, uma linguagem de Cambridge, até ele caber na memória minúscula do PDP-7. Chamou o resultado de B. O B não tinha tipo nenhum. Todo valor era uma palavra da máquina, e o programa decidia se uma palavra era um número ou um endereço.",
  cHist_cBody: "Isso deixou de funcionar no PDP-11, a máquina que o Bell Labs comprou em seguida. Ela endereçava bytes individuais, então um caractere e um número inteiro passaram a ter tamanhos diferentes, e uma linguagem sem tipos não conseguia distingui-los. Entre 1971 e 1973 Ritchie acrescentou tipos ao B: char, int, arrays e ponteiros para eles, depois structs. A linguagem tinha mudado o bastante para merecer outro nome, e ficou com a letra seguinte: C.",
  cHist_hLang: "Linguagem",
  cHist_hYear: "Ano",
  cHist_hBy: "Por",
  cHist_hIdea: "O que trouxe",
  cHist_l1: "uma linguagem pequena e portável para escrever compiladores; um único tipo, a palavra",
  cHist_l2: "BCPL enxugado para caber no PDP-7; ainda sem tipos",
  cHist_l3: "tipos para bytes, inteiros e ponteiros, depois structs; perto da máquina, mas portável",

  cHist_portTitle: "Um sistema operacional numa linguagem de alto nível",
  cHist_portBody: "Em 1973 Thompson e Ritchie reescreveram o kernel do Unix em C. Sistemas operacionais eram escritos em assembly naquela época, porque só o assembly era considerado rápido o bastante. A reescrita provou o contrário e deu ao Unix a sua maior força: para levá-lo a um computador novo, bastava escrever um compilador de C para esse computador e recompilar o resto. Daí em diante o Unix e o C se espalharam juntos, um levando o outro.",
  cHist_spreadBody: "Eles também se espalharam por um motivo jurídico. Por um acordo de 1956 com o governo americano, a AT&T não podia vender produtos de computação. Ela licenciou o Unix para universidades por quase nada, com o código-fonte incluído. Uma geração de estudantes aprendeu sistemas operacionais lendo esse código, e a Universidade da Califórnia em Berkeley criou a sua própria versão, o BSD. Quando esses estudantes se formaram, levaram o C com eles.",

  cHist_krTitle: "O livro, e o \"hello, world\"",
  cHist_krBody: "Em 1978 Kernighan e Ritchie publicaram The C Programming Language. Os programadores o chamam de K&R. É fino, preciso e cheio de pequenos programas completos, e durante onze anos foi a única definição do C que existia. O primeiro exemplo imprime as palavras hello, world. Kernighan já as tinha usado num tutorial de B anos antes; depois deste livro, quase toda linguagem passou a ser apresentada com elas.",
  cHist_q1: "O C é excêntrico, cheio de falhas e um sucesso enorme.",
  cHist_q1by: "Dennis Ritchie, The Development of the C Language, 1993",
  cHist_stdBody: "Conforme os compiladores de C se multiplicaram, passaram a discordar nos detalhes. Em 1989 o órgão de normas americano, o ANSI, publicou o primeiro C oficial, adotado pela ISO um ano depois: o C89, também chamado de C90. Desde então o C muda devagar e de propósito. O C99 trouxe os comentários //, inteiros de largura fixa e declarações em qualquer ponto de um bloco. O C11 trouxe threads. O C23 transformou bool e nullptr em palavras-chave e trouxe o #embed. Aqui a lentidão é uma qualidade: código C de 1990 ainda compila hoje.",

  cHist_bjarneTitle: "1979: classes, sem pagar por elas",
  cHist_bjarneBody: "Bjarne Stroustrup cresceu em Aarhus, na Dinamarca, e fez o doutorado em Cambridge, simulando sistemas de computação distribuídos. Escreveu o simulador primeiro em Simula, uma linguagem norueguesa que tinha inventado as classes: um jeito de juntar dados com o código que trabalha sobre eles. O projeto ficou lindo, mas o programa rodava devagar demais para ser útil. Ele o reescreveu em BCPL, onde ficou rápido, e a experiência foi um sofrimento. Saiu de Cambridge convencido de que uma linguagem podia, e devia, ter as duas coisas.",
  cHist_withBody: "Em 1979 ele entrou no Bell Labs, a poucas portas da equipe do Unix, e começou o C with Classes (\"C com classes\"): C, mais classes com construtores e destrutores, partes públicas e privadas, e classes derivadas. Ele manteve o C por baixo de propósito. O C era rápido, rodava em todo lugar e todo programador do Bell Labs já o conhecia. Em 1983 um colega, Rick Mascitti, sugeriu um nome novo. Em C, ++ soma um a uma variável, então C++ é \"um a mais que o C\".",
  cHist_cfrontBody: "Em 1985 vieram a primeira versão comercial e o livro de Stroustrup, The C++ Programming Language. O compilador, o Cfront, traduzia C++ para C, então o C++ rodava em qualquer máquina que tivesse um compilador de C, ou seja, em todas. Funções virtuais, sobrecarga de operadores, referências e const já estavam lá; templates e exceções vieram por volta de 1990.",
  cHist_q2: "O que você não usa, você não paga. E mais: o que você usa, você não conseguiria escrever melhor à mão.",
  cHist_q2by: "Bjarne Stroustrup, sobre o princípio do custo zero",

  cHist_stlTitle: "A biblioteca padrão, o padrão e uma longa espera",
  cHist_stlBody: "Em 1994 Alexander Stepanov mostrou ao comitê de padronização a sua Standard Template Library: contêineres como vector e map, algoritmos como sort e find, e iteradores que deixam qualquer algoritmo trabalhar sobre qualquer contêiner. Ela foi aceita quase inteira e virou o C++ na direção da programação genérica. Em 1998 saiu o primeiro padrão ISO, o C++98.",
  cHist_waitBody: "Depois vieram treze anos quietos. O C++03 só corrigiu defeitos, enquanto a revisão seguinte, conhecida como C++0x, crescia e atrasava. Nesse meio-tempo Java e C# ofereciam coleta de lixo e grandes bibliotecas padrão, e muita gente deu o C++ como linguagem do passado. O C++11 enfim chegou em setembro de 2011. Trouxe semântica de movimento, auto, lambdas, smart pointers e threads, e mudou tanto o C++ do dia a dia que Stroustrup disse que parecia uma linguagem nova. Desde então sai um padrão novo a cada três anos, como um trem que parte no horário com o que estiver pronto: C++14, 17, 20, 23 e agora 26.",
  cHist_ritchieBody: "Um mês depois da publicação do C++11, em outubro de 2011, Dennis Ritchie morreu. Ele e Thompson tinham recebido o Prêmio Turing, a maior honraria da computação, em 1983. Thompson depois ajudou a criar a codificação de texto UTF-8 e, no Google, a linguagem Go. Stroustrup ainda participa do comitê que faz o C++ evoluir.",

  cHist_timelineTitle: "A história inteira numa linha",

  cHist_familyTitle: "Duas linguagens, uma família",
  cHist_familyBody: "O C++ começou como um superconjunto do C, e quase todo programa em C ainda é C++ válido. Quase: as duas se afastaram em pequenos detalhes. Em C, o resultado do malloc vira qualquer tipo de ponteiro sozinho; o C++ exige um cast. O C tem arrays de tamanho variável; o C++, não. Mais importante é a diferença de espírito. O C dá poucas ferramentas simples e confia em você por completo. O C++ dá ferramentas para você construir as suas próprias abstrações seguras, como tipos que liberam a própria memória sozinhos, e promete que elas não custam nada a mais na execução.",
  cHist_r1: "Tamanho",
  cHist_r1c: "pequeno: a linguagem inteira cabe na cabeça",
  cHist_r1p: "enorme: ninguém usa tudo",
  cHist_r2: "Abstrações",
  cHist_r2c: "funções e structs",
  cHist_r2p: "classes, templates, lambdas, uma grande biblioteca padrão",
  cHist_r3: "Memória",
  cHist_r3c: "malloc e free, à mão",
  cHist_r3p: "objetos que se limpam sozinhos (RAII)",
  cHist_r4: "Mudanças",
  cHist_r4c: "devagar; código antigo continua funcionando",
  cHist_r4p: "um padrão novo a cada três anos",
  cHist_r5: "Onde costuma morar",
  cHist_r5c: "kernels, drivers, dispositivos embarcados, bibliotecas feitas para serem chamadas de qualquer linguagem",
  cHist_r5p: "motores de jogos, navegadores, gráficos, finanças, compiladores",

  cHist_todayTitle: "Onde elas rodam hoje",
  cHist_todayBody: "O kernel do Linux, começado em 1991, é escrito em C, assim como boa parte do Windows e do macOS por baixo, o banco de dados SQLite dentro de todo celular, o Git e o interpretador do Python. O C também é a língua comum que outras linguagens usam para conversar entre si: OpenGL, Vulkan e SDL são APIs em C exatamente por isso. O C++ move a Unreal Engine e a maioria dos outros motores de jogos, o Chrome e o Firefox, o Photoshop, a família de compiladores LLVM e os laços internos rápidos de bibliotecas de aprendizado de máquina como o PyTorch. A sintaxe delas vive em Java, C#, JavaScript e Go. O ponto fraco delas, a segurança de memória, é o motivo de linguagens novas como Rust existirem, e de o kernel do Linux hoje aceitar Rust ao lado do C.",

  cHist_trackTitle: "Como esta trilha está organizada",
  cHist_trackBody: "Esta trilha segue a história. Começa pelo C, porque o C mostra a máquina às claras: variáveis são caixas em endereços, a memória é sua para pedir e devolver, e nada acontece sem que você tenha escrito. Depois passa ao C++, e cada ferramenta do C++ aparece como a resposta a um problema que você já terá encontrado no C.",

  cHist_key0: "O C foi criado no Bell Labs entre 1969 e 1973, por Ritchie e Thompson, para escrever o Unix.",
  cHist_key1: "O B não tinha tipos; o PDP-11, que endereçava bytes, obrigou o C a tê-los. O C fica perto da máquina, mas roda em qualquer uma.",
  cHist_key2: "Reescrever o Unix em C o tornou portável, e as licenças baratas para universidades espalharam os dois pelo mundo.",
  cHist_key3: "Stroustrup começou o C++ em 1979 para ter as classes do Simula com a velocidade do C. Custo zero continua sendo a regra dele.",
  cHist_key4: "Padrões principais: C89, C99, C11, C23; C++98, C++11 (a grande virada), depois um a cada três anos até o C++26.",
  cHist_key5: "O C continua a língua comum de sistemas e APIs; o C++ move motores, navegadores e gráficos.",
};

export default text;
