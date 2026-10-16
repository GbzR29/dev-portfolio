// PT text for src/lib/tracks/asm/chapters/arrays-structs.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmArr_intro: "A CPU não faz ideia do que é um array ou uma struct. Ela conhece endereços, e tamanhos de 1, 2, 4 ou 8 bytes. Todo o resto é aritmética que o compilador faz por você: a[i] vira \"o endereço de a, mais i vezes o tamanho de um elemento\", e p->y vira \"p mais o deslocamento de y\". Este capítulo mostra essa aritmética na saída do gcc, explica o preenchimento (padding) que o compilador enfia entre os campos de uma struct e monta um array de structs à mão no NASM.",
  asmArr_goal0: "Calcular o endereço de a[i], g[r][c] e a[i].f a partir da base, dos tamanhos e dos deslocamentos.",
  asmArr_goal1: "Explicar de onde vem o padding, e reordenar os campos de uma struct para eliminá-lo.",
  asmArr_goal2: "Reconhecer os truques de lea e de deslocamento que o gcc usa para multiplicar pelo tamanho de uma struct.",
  asmArr_goal3: "Descrever uma struct no NASM com struc e endstruc.",

  asmArr_arrTitle: "Um array é uma base mais i × tamanho",
  asmArr_arrBody: "Os elementos de um array ficam um depois do outro, sem buracos e sem nada no meio. Se a começa no endereço A e cada elemento tem s bytes, o elemento i começa em A + i × s. É exatamente o modo de endereçamento base + índice × escala do capítulo do mov, e é por isso que ele existe. Aqui está o gcc -O2 para três jeitos de ler um array de int, com a em rdi:",
  asmArr_hHow: "Como",
  asmArr_r1: "o índice é conhecido: 3 × 4 = 12 é calculado durante a compilação",
  asmArr_r2: "i em rsi, multiplicado por 4 dentro do endereço",
  asmArr_r3: "um endereço tem 64 bits, então um índice int de 32 bits precisa primeiro ter o sinal estendido (movsx); um i negativo precisa continuar negativo",
  asmArr_scaleBody: "A escala só pode ser 1, 2, 4 ou 8, os tamanhos de char, short, int e long. Arrays de qualquer outra coisa precisam de uma instrução a mais, como as structs abaixo mostram.",

  asmArr_2dTitle: "Duas dimensões",
  asmArr_2dBody: "O C guarda int g[3][4] linha por linha: os 4 ints da linha 0, depois os 4 da linha 1, e assim por diante, 48 bytes ao todo. Uma linha tem 4 × 4 = 16 bytes, então g[r][c] fica em g + r × 16 + c × 4. O gcc -O2 compila int get(int g[][4], long r, long c) { return g[r][c]; } para:",
  asmArr_2dOrder: "Percorrer um array assim linha por linha lê endereços consecutivos; percorrê-lo coluna por coluna salta 16 bytes a cada vez. Em arrays grandes essa diferença decide se o cache ajuda ou não, como o capítulo de Desempenho do C/C++ mediu.",

  asmArr_structTitle: "Uma struct é uma lista de deslocamentos",
  asmArr_structBody: "Os campos de uma struct ficam na memória na ordem em que você os declara. Cada campo tem um deslocamento (offset), a distância em bytes do começo da struct, e ler p->f quer dizer ler em p + deslocamento. Em struct point { int x; int y; }, x está no deslocamento 0 e y no 4, então return p->y; é mov eax, DWORD PTR [rdi+4]. Os nomes dos campos somem do código de máquina; só os números ficam.",
  asmArr_alignBody: "Os deslocamentos nem sempre são a soma dos tamanhos anteriores. A ABI System V dá a cada tipo um alinhamento: o endereço dele precisa ser múltiplo desse número, que, para estes tipos, é o próprio tamanho. Um valor alinhado nunca fica partido entre duas linhas de cache ou duas páginas, então a CPU o lê num acesso só. O x86 tolera dados desalinhados, com um custo, mas algumas instruções, como o movaps citado no capítulo da convenção de chamada, falham com eles. Para manter cada campo alinhado, o compilador insere bytes sem uso, o padding:",
  asmArr_hRule: "Regra",
  asmArr_hEffect: "Efeito",
  asmArr_rule1: "cada campo começa num múltiplo do seu alinhamento",
  asmArr_rule1e: "padding antes de um campo, se precisar",
  asmArr_rule2: "o alinhamento da struct é o do seu maior campo",
  asmArr_rule2e: "uma struct com um double precisa começar num múltiplo de 8",
  asmArr_rule3: "o sizeof é arredondado para cima até um múltiplo desse alinhamento",
  asmArr_rule3e: "padding no fim, para que a[1] também fique alinhado",
  asmArr_recBody: "struct rec { char tag; double value; int count; } usa 13 bytes de dados mas ocupa 24: 7 bytes de padding depois de tag, para que value comece no 8, e 4 no fim, para que a próxima rec de um array comece num múltiplo de 8. Mude os campos de lugar:",
  asmArr_sortBody: "Pôr os maiores campos primeiro elimina a maior parte do padding: rec cai de 24 para 16 bytes, um terço a menos de memória e um terço a mais de registros por linha de cache. O compilador não pode fazer isso por você, porque o C promete que os campos ficam na ordem em que você os escreveu; código e formatos de arquivo dependem disso.",

  asmArr_aosTitle: "Arrays de structs",
  asmArr_aosBody: "a[i].f junta as duas coisas: o endereço é a + i × sizeof + deslocamento. Com tamanho 1, 2, 4 ou 8, é uma instrução só. Com outros tamanhos, o gcc multiplica primeiro, e evita o imul quando pode, porque o lea calcula x + x × 2, x + x × 4 ou x + x × 8 num ciclo:",
  asmArr_hMath: "Aritmética",
  asmArr_m16: "i × 16 com um deslocamento de bits, depois + 8 + a",
  asmArr_m12: "um float z em struct { float x, y, z; }: i × 3, depois × 4, + 8",
  asmArr_cpuRun: "Aqui está o laço feito à mão: a soma dos campos y de três pontos. Depois escolha \"passo errado\", o mesmo laço com escala 4 em vez de 8, o bug clássico de andar pelo tamanho de um campo em vez do tamanho da struct.",

  asmArr_strucTitle: "Structs no NASM",
  asmArr_strucBody: "Escrever [rbx + rcx*8 + 4] à mão funciona, mas o 8 e o 4 são números mágicos que quebram quando a struct muda. O NASM consegue dar nome a eles. struc e endstruc definem um conjunto de deslocamentos: cada campo reserva o seu tamanho com resb, resw, resd ou resq, e o NASM também define point_size.",
  asmArr_strucSame: "O add vira os mesmos quatro bytes de antes, 03 44 CB 04: o struc não cria código nem dados, só nomes para números. Ele também não acrescenta padding. Numa struct compartilhada com o C, ponha alignb 8 (ou o alinhamento de que precisar) antes de um campo para preenchê-lo como o compilador faria.",
  asmArr_packWarn: "O __attribute__((packed)) do gcc, ou #pragma pack(1), remove o padding. A struct fica menor, mas os campos podem ficar desalinhados, e pegar um ponteiro para um campo desses e passá-lo adiante é uma fonte comum de falhas em processadores mais rígidos que o x86. Use-o para formatos de arquivo e pacotes de rede, não para ganhar velocidade.",

  asmArr_tryTitle: "Tente você mesmo",
  asmArr_try1: "Calcule à mão o sizeof e cada deslocamento de struct { short a; double b; char c; int d; }, e confira com offsetof no Compiler Explorer. Reordene-a para o menor tamanho.",
  asmArr_try2: "Compile int get3(int g[][3], long r, long c) { return g[r][c]; } com -O2. Como o gcc multiplica r por 12?",
  asmArr_try3: "Estenda o points.asm com um campo z (resd 1). O que você precisa mudar no laço, e o que muda sozinho?",

  asmArr_key0: "a[i] fica em a + i × sizeof(elemento); o modo de endereçamento multiplica por 1, 2, 4 ou 8.",
  asmArr_key1: "Um índice int tem o sinal estendido (movsx) antes de entrar num endereço de 64 bits.",
  asmArr_key2: "g[r][c] num array 2D do C fica em g + r × (tamanho da linha) + c × (tamanho do elemento): as linhas são guardadas uma depois da outra.",
  asmArr_key3: "p->f é uma leitura em p + deslocamento(f); os nomes somem do código de máquina.",
  asmArr_key4: "Cada campo é alinhado ao seu tamanho, e o sizeof é arredondado para o maior alinhamento; os buracos são o padding. Os maiores campos primeiro desperdiçam menos.",
  asmArr_key5: "Para outros tamanhos o gcc multiplica com lea (× 3, × 5, × 9) e deslocamentos em vez de imul.",
  asmArr_key6: "O struc / endstruc do NASM dá nome aos deslocamentos e ao tamanho sem criar nenhum byte.",
};

export default text;
