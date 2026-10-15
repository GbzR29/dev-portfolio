// PT text for src/lib/tracks/cpp/chapters/concurrency.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cppThr_intro: "A tela de carregamento mostra uma barra que se arrasta. Por trás dela, o jogo lê duzentas texturas do disco e as decodifica, uma depois da outra, num núcleo de um processador que tem doze. Os outros onze estão parados. Pô-los para trabalhar é a promessa das threads, e ela é real: quatro texturas que levam 50 ms cada carregam em cerca de 57 ms em vez de 200. Mas as threads também trazem os bugs mais difíceis da programação, os que aparecem uma vez em mil execuções e somem no momento em que você acrescenta um print. Este capítulo é sobre ganhar a velocidade sem esses bugs.",
  cppThr_goal0: "Iniciar threads com std::jthread e pará-las de forma limpa.",
  cppThr_goal1: "Explicar por que duas threads incrementando um int perdem atualizações, no nível das instruções de máquina.",
  cppThr_goal2: "Proteger dados compartilhados com um mutex ou um atomic, e evitar deadlock.",
  cppThr_goal3: "Reconhecer false sharing e medir antes de paralelizar.",

  cppThr_threadTitle: "Uma thread é uma segunda linha de execução",
  cppThr_threadBody: "Uma thread roda uma função ao lado do resto do programa, com a sua própria pilha mas compartilhando toda a memória do programa. O sistema operacional decide qual thread roda em qual núcleo e quando, e alterna entre elas muitas vezes por segundo. É por isso que as quatro linhas aparecem numa ordem diferente a cada execução: esta máquina imprimiu water, sand, stone, grass. Fazer join numa thread significa esperar que ela termine. O std::jthread (C++20) faz join sozinho no seu destrutor; o std::thread mais antigo chama std::terminate se for destruído sem join() nem detach(), o que é um jeito fácil de travar o programa.",
  cppThr_hPart: "Parte",
  cppThr_hMeans: "O que significa",
  cppThr_t1: "Inicia uma thread nova que roda f().",
  cppThr_t2: "O lambda captura name por valor, então cada thread tem a sua própria cópia (o capítulo de Lambdas). Capturá-la por referência faria todas as threads lerem uma variável de laço que continua mudando.",
  cppThr_t3: "Destrói os jthreads; cada destrutor espera a sua thread terminar.",
  cppThr_t4: "Quantas threads o hardware roda ao mesmo tempo: 12 nesta máquina (6 núcleos, 2 threads cada).",
  cppThr_stopBody: "Uma thread não pode ser morta com segurança de fora: ela pode estar segurando uma trava ou no meio da escrita de um arquivo. Em vez disso, você pede que ela pare. Se a função do jthread recebe um std::stop_token, o jthread passa um, e request_stop() faz stop_requested() devolver true. A thread confere isso em pontos onde parar é seguro.",

  cppThr_raceTitle: "Duas threads, um contador",
  cppThr_raceBody: "Compilado com -O0 nesta máquina, três execuções imprimiram 1.134.342, depois 1.103.592, depois 1.101.869: quase metade dos incrementos sumiu. ++counter parece uma operação só, mas o processador a faz em três: copiar counter para um registrador, somar 1 no registrador, escrever o registrador de volta. Se a outra thread rodar entre a cópia e a escrita, as duas threads leem o mesmo valor antigo e as duas escrevem o mesmo valor novo. Seja o escalonador abaixo e faça isso acontecer.",
  cppThr_raceAfter: "Duas threads mexendo na mesma memória, pelo menos uma escrevendo, sem nada ordenando os acessos, é uma corrida de dados (data race), e uma corrida de dados é comportamento indefinido em C++, não só um número errado. Compilado com -O2, o mesmo programa imprimiu 2.000.000 todas as vezes: o otimizador transformou cada laço num único counter += 1000000, o que deixou a janela minúscula. O bug não foi embora; só ficou raro, o que é pior. O ThreadSanitizer (o capítulo de Ferramentas) o encontra todas as vezes.",

  cppThr_mutexTitle: "Mutexes: uma thread por vez",
  cppThr_mutexBody: "Um mutex (exclusão mútua) é uma trava que só uma thread pode segurar. O código entre o lock e o unlock se chama seção crítica e, enquanto uma thread está nela, toda outra thread que quer o mesmo mutex espera. Nunca chame lock() e unlock() à mão: uma exceção ou um return antecipado entre os dois deixaria o mutex travado para sempre. O std::lock_guard é RAII para travas, exatamente como o unique_ptr para memória.",
  cppThr_hVersion: "Versão (2 threads × 1.000.000, -O2)",
  cppThr_hResult: "Resultado",
  cppThr_hTime: "Tempo nesta máquina",
  cppThr_m1: "errado em -O0, certo por sorte em -O2",
  cppThr_costBody: "A correção custa tempo, porque os dois núcleos agora precisam combinar quem é dono de counter a cada incremento. A lição não é \"use atomics, eles são mais rápidos\", e sim \"compartilhe menos\": dê a cada thread o seu próprio contador e some os totais uma vez no fim, e as threads nem precisam conversar.",
  cppThr_deadTitle: "Deadlock, e scoped_lock",
  cppThr_deadBody: "Se transfer travasse from.m e depois to.m com dois lock_guards, a thread 1 poderia travar a.m enquanto a thread 2 trava b.m, e então cada uma esperaria para sempre pelo mutex que a outra segura: um deadlock. O programa não trava com erro; simplesmente para. O std::scoped_lock (C++17) trava vários mutexes com um algoritmo que evita isso, em qualquer ordem em que forem passados. A regra geral, quando você não pode usá-lo, é travar os mutexes sempre na mesma ordem global.",

  cppThr_atomicTitle: "Atomics",
  cppThr_atomicBody: "Uma variável atômica é uma cujas operações não podem ser interrompidas no meio: nenhuma outra thread consegue ver ou se infiltrar entre a leitura e a escrita de um fetch_add. No x86-64 o g++ o transforma numa instrução só com o prefixo lock, que diz ao processador para segurar aquela linha de cache durante toda a operação. Atomics servem para valores únicos: contadores, flags, um índice. Para vários valores que precisam mudar juntos, como dois saldos, use um mutex.",
  cppThr_orderTitle: "Ordem de memória: publicar dados para outra thread",
  cppThr_orderBody: "Compiladores e processadores reordenam operações de memória quando nenhuma thread sozinha consegue notar a diferença. Outra thread consegue: sem regras, o consumidor poderia ver ready == true e ainda ler o payload antigo. Um store release e um load acquire que lê o valor dele formam um par: tudo o que o produtor escreveu antes do release fica visível para o consumidor depois do acquire. O padrão, memory_order_seq_cst, dá isso e mais, e é a escolha certa até um profiler dizer o contrário. memory_order_relaxed só promete que o próprio atomic não é lido pela metade, o que basta para um contador de estatísticas e mais nada.",

  cppThr_fsTitle: "False sharing",
  cppThr_fsBody: "As duas threads nunca mexem na mesma variável, então não há corrida. Mesmo assim, nesta máquina a primeira struct levou 356 ms e a com espaçamento 32 ms, onze vezes mais rápido. Os caches movem a memória em blocos de 64 bytes chamados linhas de cache (o capítulo de Desempenho). Quando a e b moram numa linha só, cada escrita de um núcleo tira a linha inteira do outro núcleo, e eles passam o tempo jogando-a de um lado para o outro. alignas(64) põe cada contador no começo da sua própria linha. std::hardware_destructive_interference_size dá nome a essa distância de forma portável; aqui ela vale 64.",

  cppThr_asyncTitle: "Tarefas com resultado: async e future",
  cppThr_asyncBody: "std::async roda uma função em outra thread e devolve um std::future, um bilhete para o resultado. get() espera por ele e o devolve uma vez; se a função lançou, get() lança a mesma exceção na thread de quem chamou. std::launch::async obriga uma thread nova; sem ele, a biblioteca pode decidir rodar a função preguiçosamente dentro do get(). As engines costumam ir um passo além e manter um pool de threads: um conjunto fixo de threads trabalhadoras, criadas uma vez, que pegam pequenas tarefas de uma fila, para que nenhuma thread seja criada por tarefa.",
  cppThr_execNote: "O C++26 acrescenta o std::execution, um jeito padrão de descrever cadeias de trabalho assíncrono (senders) e onde elas rodam (schedulers), pensado para virar a língua comum de pools de threads, filas de GPU e bibliotecas de rede. O suporte nas bibliotecas ainda está chegando em 2026; até lá, a biblioteca stdexec da NVIDIA o implementa.",

  cppThr_rulesTitle: "Regras que evitam a maioria dos bugs",
  cppThr_hRule: "Regra",
  cppThr_hWhy: "Por quê",
  cppThr_r1: "Compartilhe o mínimo possível: dê a cada thread os seus próprios dados e junte no fim.",
  cppThr_r1w: "Nada compartilhado significa nada sobre o que correr e nada pelo que esperar.",
  cppThr_r2: "Compartilhado e mudando significa mutex ou atomic, sempre.",
  cppThr_r2w: "\"É só um bool\" continua sendo uma corrida de dados, e continua sendo comportamento indefinido.",
  cppThr_r3: "Trave com RAII: lock_guard, scoped_lock, unique_lock.",
  cppThr_r3w: "Uma exceção ou um return antecipado não consegue deixar um mutex travado.",
  cppThr_r4: "Mantenha as seções críticas curtas; nunca chame código desconhecido segurando uma trava.",
  cppThr_r4w: "O código desconhecido pode tentar pegar a mesma trava: um deadlock consigo mesmo.",
  cppThr_r5: "Meça antes e depois, e rode os testes sob o ThreadSanitizer.",
  cppThr_r5w: "Threads muitas vezes deixam o código mais lento, e os bugs de corrida se escondem nas execuções normais.",

  cppThr_tryTitle: "Experimente",
  cppThr_try1: "Rode a corrida do contador em -O0 cinco vezes e anote os resultados. Depois transforme counter num std::atomic<int> e rode de novo.",
  cppThr_try2: "Some os números de 1 a 100.000.000 com 1, 2, 4 e 8 jthreads, cada uma somando a sua própria fatia na sua própria variável. Imprima os tempos: onde acrescentar threads deixa de ajudar?",
  cppThr_try3: "Escreva transfer com dois lock_guards, travando from.m e depois to.m, e rode os dois laços de transferência opostos. Quanto tempo até congelar? Depois troque para scoped_lock.",
  cppThr_try4: "Meça o par com false sharing na sua máquina, depois experimente alignas(32) e alignas(128). Explique os resultados com o tamanho da linha de cache.",

  cppThr_key0: "Uma thread compartilha toda a memória com as outras; o sistema operacional decide quando cada uma roda, então a ordem entre threads nunca é garantida.",
  cppThr_key1: "O std::jthread faz join no seu destrutor e pode ser convidado a parar com um stop_token.",
  cppThr_key2: "++counter é load, add, store; duas threads sem sincronização perdem atualizações, e uma corrida de dados é comportamento indefinido.",
  cppThr_key3: "Um mutex deixa uma thread por vez entrar numa seção crítica; trave-o com RAII e trave vários com scoped_lock.",
  cppThr_key4: "Atomics tornam indivisíveis as operações de uma variável; release/acquire publica os dados escritos antes do store.",
  cppThr_key5: "False sharing deixa lentas variáveis independentes quando elas dividem uma linha de cache de 64 bytes; compartilhe menos e meça.",
};

export default text;
