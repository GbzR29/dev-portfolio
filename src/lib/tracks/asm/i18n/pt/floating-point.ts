// PT text for src/lib/tracks/asm/chapters/floating-point.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmFp_intro: "Nenhuma das instruções vistas até aqui consegue somar 0,5 a nada. Os números de ponto flutuante têm formato, registradores e instruções próprios: no x86-64 isso é o SSE, com dezesseis registradores de 128 bits chamados xmm0 a xmm15. Este capítulo abre um double para ver como ele guarda um número e depois acompanha o código do gcc para algumas funções pequenas, uma instrução por vez, incluindo as comparações em que o NaN muda a resposta.",
  asmFp_goal0: "Decodificar um double a partir dos bits de sinal, expoente e fração, e dizer por que 0.1 + 0.2 não é 0.3.",
  asmFp_goal1: "Ler instruções SSE escalares pelo nome: movsd, addsd, mulss, cvtsi2sd, cvttsd2si, comisd.",
  asmFp_goal2: "Explicar por que as constantes de ponto flutuante moram na memória, e como o gcc compara doubles para que o NaN dê a resposta certa.",
  asmFp_goal3: "Escrever uma função em assembly que recebe e devolve doubles, seguindo a convenção de chamada.",

  asmFp_ieeeTitle: "Como um double é guardado",
  asmFp_ieeeBody: "Um double são 64 bits divididos em três campos, como define o padrão IEEE 754: 1 bit de sinal, 11 bits de expoente e 52 bits de fração. Funciona como a notação científica em base 2: um número entre 1 e 2, vezes uma potência de dois.",
  asmFp_hTerm: "Termo",
  asmFp_hMeaning: "Significado",
  asmFp_s: "o bit de sinal: 0 para positivo, 1 para negativo. (−1)⁰ = 1 e (−1)¹ = −1",
  asmFp_e: "os 11 bits de expoente lidos como número sem sinal, de 0 a 2047. Subtrair o viés (bias) 1023 dá o expoente de verdade, de −1022 a 1023; guardá-lo com viés evita um bit de sinal para o expoente. e = 0 e e = 2047 ficam reservados para zero, subnormais, infinito e NaN",
  asmFp_f: "o significando: o número binário 1.f, em que f são os 52 bits de fração depois da vírgula. O 1 da frente não é guardado, já que todo número normal o tem: 53 bits de precisão pelo preço de 52",
  asmFp_float: "o mesmo arranjo em 32 bits: 1 bit de sinal, 8 bits de expoente com viés 127, 23 bits de fração",
  asmFp_ieeeRun: "0,1 não tem forma binária exata, assim como 1/3 não tem em decimal: os dígitos binários 0,000110011001100… se repetem para sempre, e 52 bits precisam parar em algum lugar. Veja o que fica guardado de verdade, e depois experimente 0.1 + 0.2 e 0.3:",
  asmFp_ieeeAfter: "0,1 fica guardado um pouco acima, 0,2 também, e a soma cai um degrau acima do double mais próximo de 0,3. Os dois só diferem no último bit, mas diferem, então 0.1 + 0.2 == 0.3 é falso. 53 bits são uns 16 dígitos decimais; os 24 bits de um float, uns 7. E acima de 2⁵³ um double nem consegue guardar todo inteiro: 2⁵³ + 1 é arredondado para 2⁵³.",

  asmFp_xmmTitle: "Os registradores xmm e as instruções escalares",
  asmFp_xmmBody: "O SSE (Streaming SIMD Extensions) acrescentou os registradores xmm ao x86. Todo processador x86-64 tem SSE2, então os compiladores o usam para toda conta com float e double. Um registrador xmm tem 128 bits: espaço para dois doubles ou quatro floats, chamados de faixas (lanes). A maior parte deste capítulo usa só a faixa mais baixa, com instruções escalares; preencher todas as faixas de uma vez, com instruções empacotadas, é SIMD, o assunto da próxima seção. Os nomes das instruções são montados com partes:",
  asmFp_hPart: "Parte",
  asmFp_hMeans: "Significa",
  asmFp_hEx: "Exemplo",
  asmFp_p1: "scalar double: um double, faixa 0",
  asmFp_p2: "scalar single: um float, faixa 0",
  asmFp_p3: "packed (empacotado): todas as faixas de uma vez",
  asmFp_p4: "cópia; movsd e movss carregam e guardam um valor",
  asmFp_p5: "conversão: si = inteiro com sinal, sd = double, ss = float",
  asmFp_p6: "conversão com truncamento, em direção a zero, como um cast do C",
  asmFp_p7: "raiz quadrada, numa instrução só",

  asmFp_constTitle: "As constantes moram na memória",
  asmFp_constBody: "Nenhuma instrução SSE aceita um operando imediato: não existe addsd xmm0, 32.0. O gcc põe cada constante na seção de dados somente leitura, sob um rótulo como .LC0, e a instrução a lê de lá. Aqui está double to_celsius(double f) { return (f - 32.0) * 5.0 / 9.0; } em -O2, e a mesma função com float:",
  asmFp_constData: "No arquivo .s do gcc a constante aparece como .LC0: .long 0, .long 1077936128. São as duas metades de 4 bytes de 32.0, a de baixo primeiro: 1077936128 é 0x40400000, então o double inteiro é 0x4040000000000000. No NASM você escreve dq 32.0 e o montador codifica. Dois truques dispensam constante: pxor xmm0, xmm0 dá 0.0, já que todos os bits zerados são +0.0, e negar x é um xorpd com uma máscara que inverte só o bit de sinal, que é como o gcc compila return -x;.",

  asmFp_convTitle: "Entre inteiros e doubles",
  asmFp_convBody: "Misturar int e double no C faz o compilador converter. O fim de double average(const int *a, int n), que devolve (double)s / n, converte a soma e a contagem antes de dividir. Siga o passo a passo, e depois remova as duas linhas pxor:",
  asmFp_convAfter: "O cvtsi2sd escreve só a faixa 0 e mantém o resto do registrador, então ele precisa esperar a última instrução que escreveu aquele registrador terminar, mesmo que o programa nunca tenha se importado com esses bytes. Um registrador zerado com pxor não depende de nada, então a conversão pode começar na hora. No outro sentido, (int)x é cvttsd2si: o t a mais é de truncamento, como o C exige, enquanto o cvtsd2si sem t seguiria o modo de arredondamento atual, que por padrão é para o mais próximo. Um double que não cabe dá 0x80000000, o que o C chama de comportamento indefinido.",

  asmFp_cmpTitle: "Comparações e NaN",
  asmFp_cmpBody: "comisd a, b compara dois doubles e liga três flags, como faria um cmp de inteiros sem sinal. Então os saltos e sets que vêm depois são os sem sinal: ja, jb, seta, setb, nunca jg ou jl.",
  asmFp_hResult: "Resultado",
  asmFp_unordered: "não ordenado (um NaN)",
  asmFp_nanBody: "NaN, not a number (não é um número), é o que 0.0 / 0.0 e √−1 dão. Toda comparação com um NaN é falsa no C, até NaN == NaN. As flags de \"não ordenado\" parecem \"menor que\" e \"igual\" ao mesmo tempo, então o compilador precisa escolher as instruções com cuidado. O PF, a flag de paridade, é a que denuncia o NaN. Experimente as duas funções com NaN:",
  asmFp_fastMath: "O -ffast-math deixa o gcc supor que não existem NaNs nem infinitos e reordenar as contas como se fossem exatas. O código fica mais rápido, mas isnan(x) pode virar 0 e somas podem mudar nos últimos dígitos. Use-o só depois de conferir que o seu programa não depende dessas regras.",

  asmFp_ownTitle: "Uma função de ponto flutuante no NASM",
  asmFp_ownBody: "A convenção de chamada do capítulo anterior também cobre os doubles: os oito primeiros argumentos de ponto flutuante chegam em xmm0 a xmm7, e o resultado volta em xmm0. No Linux todos os registradores xmm são salvos por quem chama, então uma função pode usar todos à vontade.",

  asmFp_x87Title: "E o x87?",
  asmFp_x87Body: "Antes do SSE, o x86 fazia ponto flutuante no x87, um coprocessador com oito registradores de 80 bits usados como pilha (fld empilha, fadd trabalha no topo). Programas de 32 bits ainda o usam, e no Linux x86-64 o long double é o formato de 80 bits do x87, então código com long double ainda tem fld e fstp. Todo o resto foi para o SSE, que tem registradores comuns e dá os mesmos resultados em qualquer máquina.",

  asmFp_tryTitle: "Tente você mesmo",
  asmFp_try1: "Na figura dos bits, comece de 1 e aperte +1 uma vez. De que tamanho é o passo de 1 até o double seguinte? Depois tente o mesmo a partir de 2⁵³.",
  asmFp_try2: "Escreva double hyp(double a, double b), que devolve √(a² + b²), no NASM com mulsd, addsd e sqrtsd, e chame-a do C com 3 e 4.",
  asmFp_try3: "No Compiler Explorer, compile int is_hot(double c) { return c > 30.0; } e compare com o is_cold. Por que o gcc não precisou trocar os operandos dessa vez?",

  asmFp_key0: "Um double é (−1)^s × 1.f × 2^(e − 1023): 1 bit de sinal, 11 de expoente, 52 de fração. Um float tem 8 e 23, com viés 127.",
  asmFp_key1: "A maioria das frações decimais, 0,1 entre elas, não tem forma binária exata, então é arredondada; 0.1 + 0.2 ≠ 0.3.",
  asmFp_key2: "As contas de ponto flutuante rodam nos registradores xmm de 128 bits; as instruções …sd e …ss trabalham só na faixa 0.",
  asmFp_key3: "O SSE não tem imediatos: as constantes moram na .rodata. pxor dá 0.0 e um xor com o bit de sinal nega.",
  asmFp_key4: "cvtsi2sd converte int para double (o gcc zera o registrador antes); cvttsd2si trunca em direção a zero, como um cast do C.",
  asmFp_key5: "comisd e ucomisd ligam ZF, PF e CF como uma comparação sem sinal; o NaN liga as três, e o PF é o que o denuncia.",
  asmFp_key6: "Doubles são passados em xmm0–xmm7 e devolvidos em xmm0; todos os registradores xmm são salvos por quem chama no Linux.",
};

export default text;
