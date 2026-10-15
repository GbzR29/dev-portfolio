// PT text for src/lib/tracks/asm/chapters/stack-calls.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmStk_intro: "Uma função precisa saber para onde voltar quando termina, e precisa de espaço para as suas variáveis locais. As duas coisas moram na pilha: uma área da memória que cresce e encolhe conforme as funções são chamadas e retornam. Dois registradores a administram, e quatro instruções fazem o trabalho: push, pop, call e ret. Este capítulo mostra cada uma em ação, inclusive como fica a quebra do programa quando essa contabilidade dá errado.",
  asmStk_goal0: "Dizer o que push e pop fazem com o rsp e com a memória, e por que a pilha cresce em direção aos endereços menores.",
  asmStk_goal1: "Explicar como call e ret usam a pilha para voltar ao lugar certo.",
  asmStk_goal2: "Ler o prólogo e o epílogo de uma função e achar as suas variáveis locais a partir do rbp.",
  asmStk_goal3: "Explicar por que um endereço de retorno estragado e uma recursão sem fim terminam, os dois, numa falha de segmentação.",

  asmStk_stackTitle: "A pilha",
  asmStk_stackBody: "Quando o Linux inicia um programa, ele mapeia alguns megabytes perto do topo do espaço de endereços para a pilha e aponta o rsp para lá. O rsp, o ponteiro da pilha, sempre guarda o endereço do item do topo: o último valor empilhado. No x86 a pilha cresce para baixo. Empilhar leva o rsp para um endereço menor; desempilhar o traz de volta para cima. Cada push e cada pop move 8 bytes.",
  asmStk_hInstr: "Instrução",
  asmStk_hSame: "Faz o mesmo que",
  asmStk_stepPush: "Avance por dois push e dois pop. A pilha aparece abaixo dos registradores, uma posição de 8 bytes por linha, com os endereços maiores em cima, para que ela também cresça para baixo na tela.",
  asmStk_stale: "Desempilhar não apaga nada. Os valores antigos continuam na memória abaixo do rsp, desenhados em tom claro, até o próximo push escrever por cima. É por isso que uma variável local não inicializada em C pode conter um valor deixado por uma função anterior.",

  asmStk_callTitle: "call e ret",
  asmStk_callBody: "Uma função é um label seguido de código que termina em ret. Para chamá-la, quem chama precisa voltar depois para a instrução logo após o call. O call guarda esse endereço, o endereço de retorno, na pilha:",
  asmStk_hInstr2: "Instrução",
  asmStk_hSame2: "Faz o mesmo que",
  asmStk_callSame: "push do endereço da próxima instrução   ·   jmp square",
  asmStk_retSame: "pop para dentro do rip",
  asmStk_callWhy: "Usar a pilha em vez de um lugar fixo é o que permite o aninhamento: uma função pode chamar outra, que chama uma terceira, e cada ret desempilha o endereço de retorno mais recente, na ordem inversa. O ret não confere nada. Ele confia que o rsp aponta para um endereço de retorno e salta para onde quer que esses 8 bytes digam.",

  asmStk_frameTitle: "O quadro da pilha",
  asmStk_frameBody: "Cada chamada que ainda não retornou é dona de um trecho da pilha, o seu quadro (stack frame): o endereço de retorno, registradores guardados e variáveis locais. O programa abaixo chama square(7). A função abre com o prólogo clássico e fecha com o epílogo. Observe o rsp e o rbp, e as posições para as quais eles apontam.",
  asmStk_hLine: "Linha",
  asmStk_hRole: "Papel",
  asmStk_r1: "guarda o ponteiro de quadro de quem chamou",
  asmStk_r2: "rbp = a base deste quadro; ele fica parado enquanto o rsp se move",
  asmStk_r3: "reserva espaço para variáveis locais abaixo do rbp",
  asmStk_r4: "uma variável local: deslocamentos negativos a partir do rbp",
  asmStk_r5: "mov rsp, rbp e depois pop rbp: libera as locais e restaura o rbp de quem chamou",
  asmStk_r6: "desempilha o endereço de retorno para dentro do rip",
  asmStk_gccO0: "É o formato que o gcc usa sem otimização. Para int square(int x) { return x * x; } o gcc -O0 escreve push rbp, mov rbp, rsp, mov DWORD PTR [rbp-4], edi, mov eax, DWORD PTR [rbp-4], imul eax, eax, pop rbp, ret. Uma diferença: não há sub rsp. square não chama nada, e o System V deixa uma função assim, uma função folha, usar os 128 bytes abaixo do rsp sem reservá-los, uma área chamada red zone (zona vermelha). Uma função que chama outras precisa mover o rsp, senão o call empilharia o seu endereço de retorno em cima das locais.",
  asmStk_noFp: "Com otimização, o gcc em geral deixa de usar o rbp como ponteiro de quadro e endereça tudo a partir do rsp, o que libera o rbp como mais um registrador de uso geral. Depuradores e profilers passam a usar tabelas extras do executável para percorrer a pilha.",

  asmStk_breakTitle: "Quebre: um endereço de retorno perdido",
  asmStk_breakBody: "Remova a linha do leave na figura acima e rode de novo. O rsp continua 16 bytes abaixo do rbp guardado, na área das locais. O ret desempilha o que estiver lá, 8 bytes que ninguém escreveu (aqui, zeros), e salta para o endereço 0. Não existe código no endereço 0, então a CPU nem consegue buscar a próxima instrução, e o Linux encerra o programa com uma falha de segmentação. No Linux é o código de saída 139, exatamente como na figura.",
  asmStk_smash: "Esse ret que salta para onde a pilha mandar é a base do ataque clássico de estouro de buffer na pilha. Uma função em C que copia entrada demais para um array local escreve além do fim dele, por cima do endereço de retorno, e o atacante escolhe para onde o ret vai. Os sistemas modernos se defendem em camadas: um valor aleatório, o canário, conferido antes do ret (o -fstack-protector do gcc), uma pilha que não pode ser executada, endereços aleatórios (ASLR) e, nas CPUs recentes, uma pilha-sombra em hardware que guarda uma segunda cópia de cada endereço de retorno.",

  asmStk_recTitle: "Recursão",
  asmStk_recBody: "Como cada chamada ganha as suas próprias posições, uma função pode chamar a si mesma. fact(n) calcula n! = n × (n − 1)!. Cada nível guarda o seu n e empilha um endereço de retorno: 16 bytes por nível. Veja a pilha crescer cinco níveis e depois se desfazer.",
  asmStk_overflow: "Agora remova as duas linhas do caso base. Nada mais interrompe as chamadas: n vai a 0, −1, −2 e assim por diante, e cada nível ocupa mais 16 bytes até a pilha acabar. O próximo push toca um endereço abaixo da pilha, que não está mapeado, e o programa morre com uma falha de segmentação. Isso é um estouro de pilha (stack overflow).",
  asmStk_size: "A figura dá a este programa uma pilha de só 512 bytes, então a quebra vem depois de umas trinta chamadas. Uma pilha de verdade no Linux tem 8 MiB por padrão (ulimit -s mostra 8192, em KiB), o suficiente para cerca de meio milhão de níveis desta função. A quebra é a mesma, só que mais tarde.",

  asmStk_alignTitle: "Mais uma regra: alinhamento",
  asmStk_alignBody: "Algumas instruções que movem 16 bytes de uma vez exigem um endereço múltiplo de 16. Por isso o System V acrescenta uma regra: o rsp precisa ser múltiplo de 16 em todo call. Logo depois do call, o endereço de retorno ocupou 8 bytes, então uma função começa com o rsp 8 bytes fora. O push rbp do prólogo por acaso corrige isso. O próximo capítulo mostra o que dá errado quando uma chamada quebra a regra.",

  asmStk_tryTitle: "Tente você mesmo",
  asmStk_try1: "O programa de push e pop troca dois registradores. Faça um rodízio de três só com push e pop: o rax antigo para o rbx, o rbx antigo para o rcx, o rcx antigo para o rax. Em que ordem os pop precisam vir?",
  asmStk_try2: "No programa do square, troque o leave por pop rbp. O que continua dando errado, e que instrução precisa vir antes dele?",
  asmStk_try3: "Reescreva o fact como um laço, sem nenhum call. Quantos bytes de pilha ele usa para n = 20?",

  asmStk_key0: "O rsp aponta para o último valor empilhado. push diminui o rsp em 8 e escreve; pop lê e aumenta o rsp em 8. A pilha cresce para baixo.",
  asmStk_key1: "call empilha o endereço de retorno e salta; ret o desempilha para dentro do rip. O ret confia totalmente na pilha.",
  asmStk_key2: "Um quadro guarda o endereço de retorno, os registradores salvos e as locais de uma chamada. Com o rbp como ponteiro de quadro, as locais ficam em [rbp − n].",
  asmStk_key3: "leave desfaz o prólogo: mov rsp, rbp e depois pop rbp.",
  asmStk_key4: "Um endereço de retorno estragado ou fora do lugar manda o ret para qualquer canto, em geral para uma falha de segmentação.",
  asmStk_key5: "Uma recursão sem fim esgota a pilha (8 MiB por padrão no Linux) e quebra com um estouro de pilha.",
  asmStk_key6: "O System V quer o rsp múltiplo de 16 em todo call.",
};

export default text;
