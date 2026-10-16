// PT text for src/lib/tracks/asm/chapters/pointers-and-memory.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmPtr_intro: "No C um ponteiro tem tipo: int *, char *, struct player *. No código de máquina o tipo some. Um ponteiro é um número de 64 bits num registrador, e os únicos rastros do tipo são o tamanho de cada leitura e os números pelos quais o compilador multiplicou. Este capítulo lê ponteiros na saída do gcc, percorre a memória com um deles na CPU e depois olha o que o comportamento indefinido faz com o assembly: o otimizador supõe que ele nunca acontece, e escreve o código de acordo.",
  asmPtr_goal0: "Traduzir *p, p[i], p + 1, &x e p->f em instruções, e de volta.",
  asmPtr_goal1: "Explicar por que desreferenciar NULL termina numa falha de segmentação, e quem a detecta.",
  asmPtr_goal2: "Reconhecer na saída do gcc três otimizações que contam com o comportamento indefinido, e as flags que as desligam.",
  asmPtr_goal3: "Dizer o que o AddressSanitizer e o volatile mudam no código gerado.",

  asmPtr_regTitle: "Um ponteiro é um endereço num registrador",
  asmPtr_hAsm: "Assembly (p em rdi)",
  asmPtr_hWhat: "O que acontece",
  asmPtr_r1: "os colchetes são o *: leia 4 bytes no endereço que está em rdi",
  asmPtr_r2: "os mesmos colchetes à esquerda: escrita",
  asmPtr_r3: "um int adiante: + 4 bytes. Num long *, + 8",
  asmPtr_r4: "só o endereço é calculado; nada é lido",
  asmPtr_r5: "o deslocamento do campo, como nos últimos capítulos",
  asmPtr_r6: "o endereço da posição de x na pilha",
  asmPtr_regBody: "A aritmética de ponteiros do C conta elementos, a CPU conta bytes, e o compilador converte uma na outra durante a compilação: p + 1 num int * vira + 4, num long * + 8. Compare os níveis, e veja o que acontece com uma variável local cujo endereço é pego:",

  asmPtr_walkTitle: "Percorrendo a memória com um ponteiro",
  asmPtr_walkBody: "O laço em C for (int *p = nums; *p != 0; p++) s += *p; percorre uma lista que termina em 0, do jeito que o strlen percorre uma string. Em assembly, p é rdi e p++ é add rdi, 4. Rode-o, e depois quebre-o dos dois jeitos: remova o lea, para que o ponteiro comece em 0, o ponteiro nulo; ou remova o add, para que ele nunca ande.",

  asmPtr_nullTitle: "Por que o NULL quebra",
  asmPtr_nullBody: "O C não confere ponteiros, e a instrução também não. Quem confere é o hardware, de graça, em todo acesso à memória. A CPU traduz cada endereço por tabelas de páginas que o kernel preenche, em páginas de 4.096 bytes. O Linux nunca mapeia as páginas mais baixas de um processo: por padrão nada pode ser mapeado abaixo de 65.536 (a configuração vm.mmap_min_addr). Uma leitura no endereço 0, ou no 4 para p->hp, não encontra página; a CPU gera uma falta de página (page fault), o kernel vê que o endereço não pertence a nada e manda o SIGSEGV para o processo.",
  asmPtr_nullBig: "É por isso que o NULL é 0, e é por isso que a proteção tem limites: uma struct com um campo no deslocamento 100.000, lida por um ponteiro nulo, cai acima da área protegida, talvez em memória mapeada. Antes de existir o vm.mmap_min_addr, um programa podia mapear a página 0 ele mesmo, e bugs do kernel que seguiam um ponteiro nulo liam os dados do atacante em vez de quebrar.",

  asmPtr_ubTitle: "O comportamento indefinido visto pelo otimizador",
  asmPtr_ubBody: "O padrão C deixa algumas operações indefinidas: ler por um ponteiro nulo, estourar um inteiro com sinal, ler um objeto por um ponteiro de um tipo sem relação com ele. O compilador não insere verificações para elas. Ele faz mais: supõe que nunca acontecem, e tira conclusões. No assembly essas conclusões são fáceis de ver. O capítulo de comportamento indefinido da trilha de C/C++ traz as regras; aqui estão as instruções, e o que cada programa imprimiu no Linux:",
  asmPtr_hRule: "Suposição",
  asmPtr_hFlag: "Flag que a desliga",
  asmPtr_hWho: "Quem usa a flag",
  asmPtr_f1: "um ponteiro que foi desreferenciado não é NULL",
  asmPtr_f1w: "o kernel Linux",
  asmPtr_f2: "a aritmética com sinal nunca estoura",
  asmPtr_f2w: "código que conta com a volta; o -ftrapv faz o estouro abortar em vez disso",
  asmPtr_f3: "ponteiros de tipos diferentes nunca apontam para o mesmo objeto",
  asmPtr_f3w: "o kernel Linux, e muito código C antigo",
  asmPtr_ubWhy: "Essas suposições não são maldade: são o que deixa um compilador manter valores em registradores e remover verificações que ele prova inúteis. A regra do estouro, por exemplo, deixa o gcc tratar for (int i = 0; i < n; i++) como um laço que roda exatamente n vezes e trocar o índice por um ponteiro que anda, como a função sum fez dois capítulos atrás. O preço é que um bug no código-fonte pode virar um código diferente em cada nível de otimização.",

  asmPtr_boundsTitle: "Sem limites, a não ser que você peça",
  asmPtr_boundsBody: "a[10] num array de 4 compila para o mesmo mov que a[1], com outro número nos colchetes. A CPU lê o que estiver lá: outra variável, um registrador salvo, um endereço de retorno. Só um endereço fora de toda página mapeada causa falha. O AddressSanitizer, ligado com -fsanitize=address, acrescenta a verificação que falta em cada acesso. Aqui está o que ele acrescenta a uma função de uma linha:",
  asmPtr_asanAfter: "O programa também ganha um runtime que cerca cada bloco do heap e cada array da pilha com bytes envenenados e marca a memória liberada como envenenada, então leituras além do fim e uso depois do free caem num byte-sombra negativo. O custo é mais ou menos o dobro do tempo de execução e mais memória, e é por isso que ele serve para testes, não para builds de produção.",

  asmPtr_volTitle: "volatile: memória que muda sozinha",
  asmPtr_volBody: "O otimizador também supõe que a memória só muda quando o programa a escreve. Um laço que espera uma flag ligada por uma rotina de interrupção ou por um dispositivo quebra essa suposição. Aqui estão duas versões de void wait_for(int *flag) { while (*flag == 0) { } }, gcc -O2, a segunda com volatile int *:",
  asmPtr_volAfter: "Sem volatile, o gcc lê a flag uma vez: nada no laço a escreve, então ela não pode mudar, e um jmp sem fim é uma tradução fiel. O volatile avisa o compilador de que toda leitura e escrita precisa acontecer, na ordem, então a leitura fica dentro do laço. Ele serve para registradores de hardware mapeados em memória e para tratadores de sinal. Ele não torna o código seguro para threads: para threads, use atômicos, como explica o capítulo de concorrência do C/C++.",

  asmPtr_tryTitle: "Tente você mesmo",
  asmPtr_try1: "Compile char second_c(char *p) { return p[1]; } e double second_d(double *p) { return p[1]; }. Que número aparece nos colchetes, e que registrador recebe o valor?",
  asmPtr_try2: "Mude o set_both para que b também seja um int *. O gcc -O2 ainda devolve a constante 1? Por que não?",
  asmPtr_try3: "Compile int f(int *a) { return a[4]; } com -O2 -fsanitize=address. O índice é conhecido na compilação: a verificação continua lá?",

  asmPtr_key0: "Um ponteiro é um endereço de 64 bits num registrador; o * são os colchetes, e o tipo só sobrevive como o tamanho de cada leitura e a escala.",
  asmPtr_key1: "p + 1 soma sizeof(*p) bytes, multiplicados na compilação; o lea calcula um endereço sem ler a memória.",
  asmPtr_key2: "Uma variável cujo endereço é pego precisa morar na memória: registradores não têm endereço.",
  asmPtr_key3: "O NULL causa falha porque o Linux nunca mapeia os 64 KiB mais baixos; quem pega o acesso são as tabelas de páginas, não o C.",
  asmPtr_key4: "O otimizador supõe que o comportamento indefinido nunca acontece: ele apaga verificações de nulo depois de uma desreferência, reduz x + 1 > x a 1 e ignora escritas por ponteiros de outros tipos.",
  asmPtr_key5: "-fno-delete-null-pointer-checks, -fwrapv e -fno-strict-aliasing desligam essas suposições.",
  asmPtr_key6: "Nada confere os limites de um array, a não ser que você acrescente -fsanitize=address, que testa um byte-sombra antes de cada acesso.",
  asmPtr_key7: "O volatile obriga toda leitura e escrita a acontecer; ele é para hardware e sinais, não para threads.",
};

export default text;
