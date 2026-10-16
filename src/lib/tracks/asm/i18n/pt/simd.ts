// PT text for src/lib/tracks/asm/chapters/simd.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmSimd_intro: "O capítulo de ponto flutuante usou uma faixa de cada registrador xmm e deixou o resto vazio. O SIMD, single instruction multiple data (uma instrução, vários dados), preenche todas: um addps soma quatro pares de floats, um vaddps do AVX soma oito. Laços sobre arrays de números, que são a maior parte de gráficos, áudio, física e aprendizado de máquina, podem rodar de quatro a dezesseis vezes mais rápido assim. Este capítulo mostra os registradores, mede o ganho numa máquina de verdade e lê o código vetorial que o gcc escreve, e depois escreve um pouco à mão.",
  asmSimd_goal0: "Explicar o que uma instrução empacotada faz, e quantas faixas os registradores do SSE, do AVX e do AVX-512 têm para cada tipo.",
  asmSimd_goal1: "Ler o laço vetorizado do gcc: o broadcast, o laço principal e o resto.",
  asmSimd_goal2: "Dizer por que uma soma de floats só é vetorizada com -ffast-math.",
  asmSimd_goal3: "Escrever SSE empacotado no NASM e com intrínsecos, e saber o que -mavx2 e -march fazem.",

  asmSimd_lanesTitle: "Uma instrução, várias faixas",
  asmSimd_lanesBody: "Uma instrução empacotada faz a mesma operação em todas as faixas dos seus registradores de uma vez. O x86 ganhou três gerações de registradores vetoriais, cada uma com o dobro da largura da anterior, e a metade de baixo de cada uma é a anterior: o xmm0 é a metade de baixo do ymm0, que é a metade de baixo do zmm0.",
  asmSimd_hExt: "Extensão",
  asmSimd_hRegs: "Registradores",
  asmSimd_hLanes: "Faixas (float / int / double)",
  asmSimd_hWho: "Quais processadores",
  asmSimd_w1: "todo processador x86-64",
  asmSimd_w2: "AVX desde 2011; o AVX2, que acrescenta as operações com inteiros, desde 2013 na Intel e 2015 na AMD",
  asmSimd_w3: "chips de servidor da Intel, AMD desde o Zen 4 (2022); não o Ryzen 5 5600X usado aqui",
  asmSimd_names: "Os nomes seguem os escalares: addps é add packed single (4 floats), addpd é add packed double, paddd é add packed doublewords (4 ints; o p na frente é das instruções de inteiros), mulps, subps, sqrtps e assim por diante. As formas do AVX acrescentam um v e um terceiro operando: vaddps ymm0, ymm1, ymm2 escreve o ymm0 e deixa as duas fontes intactas.",

  asmSimd_raceTitle: "Quanto mais rápido?",
  asmSimd_raceBody: "Aqui está o laço de soma do capítulo de leitura da saída do compilador, de três jeitos. O laço escalar soma um elemento por volta. O laço SSE que o gcc -O3 escreve mantém quatro somas parciais nas quatro faixas do xmm0, e o AVX2, oito no ymm0; no fim as faixas são juntadas.",
  asmSimd_hBuild: "Build",
  asmSimd_hTime: "Tempo por elemento",
  asmSimd_hSpeed: "Ganho",
  asmSimd_raceAfter: "Medido com o gcc 14 num Ryzen 5 5600X, somando 4.096 ints, pouco o bastante para caber no cache L1, 100.000 vezes; o melhor de sete execuções. O SSE dá um pouco mais que 4× porque o laço vetorial também tem menos instruções de controle por elemento. Quando os dados deixam de caber nos caches, o ganho encolhe: a CPU soma mais rápido do que a memória consegue entregar, como o próximo capítulo mede.",

  asmSimd_autoTitle: "Vetorização automática: lendo o laço vetorial do gcc",
  asmSimd_autoBody: "Você raramente escreve SIMD à mão: o compilador faz isso em laços simples, no -O3 (e, nos casos baratos, no -O2 desde o gcc 12). O resultado tem as mesmas três partes toda vez. Veja um laço que multiplica cada elemento de um array por k:",
  asmSimd_hPart: "Parte",
  asmSimd_hDoes: "O que faz",
  asmSimd_p1: "preparação",
  asmSimd_p1v: "pula arrays curtos, e copia k para todas as faixas (shufps ou vbroadcastss): um broadcast",
  asmSimd_p2: "laço principal",
  asmSimd_p2v: "carrega 4 ou 8 elementos, uma multiplicação empacotada, guarda: a parte rápida",
  asmSimd_p3: "resto",
  asmSimd_p3v: "os últimos n mod 4 (ou n mod 8) elementos, com instruções escalares ou mais estreitas",
  asmSimd_whenNot: "O compilador só vetoriza quando consegue provar que o resultado é o mesmo. Um laço em que as voltas dependem umas das outras, como a[i] = a[i - 1] * k, não pode ser dividido em faixas. Ponteiros que podem se sobrepor obrigam a uma verificação em tempo de execução ou impedem tudo; o restrict promete que não se sobrepõem. E as somas de ponto flutuante esbarram numa regra própria:",
  asmSimd_assoc: "Nos números reais, (a + b) + c = a + (b + c). Nos floats nem sempre, porque cada soma arredonda: (0.1 + 0.2) + 0.3 dá 0.6000000000000001, enquanto 0.1 + (0.2 + 0.3) dá 0.6. Quatro faixas somam os elementos numa ordem diferente da do laço, então o gcc se recusa sem -ffast-math ou o mais restrito -fassociative-math. Somas de inteiros não têm esse problema, e é por isso que a soma de ints acima foi vetorizada no -O3.",

  asmSimd_handTitle: "Instruções empacotadas à mão",
  asmSimd_handBody: "No NASM as instruções empacotadas parecem as escalares com outro sufixo. Esta função soma dois arrays de quatro floats; o C a chama como qualquer outra função:",
  asmSimd_handRun: "Chamada com {1, 2, 3, 4} e {10, 20, 30, 40}, ela dá 11 22 33 44. O movups carrega 16 bytes de qualquer endereço. O movaps, a de aligned (alinhado), é a mesma leitura, mas falha se o endereço não for múltiplo de 16; nos processadores modernos o movups com dados alinhados é tão rápido quanto, então os compiladores usam quase sempre ele.",

  asmSimd_intrinTitle: "Intrínsecos: SIMD a partir do C",
  asmSimd_intrinBody: "Entre confiar no compilador e escrever assembly há um caminho do meio, os intrínsecos: funções C que o compilador transforma numa instrução cada. Os tipos de dados são __m128 (4 floats), __m128i (inteiros), __m256 e assim por diante.",
  asmSimd_intrinAfter: "Os nomes se leem como as instruções: _mm_ para 128 bits, _mm256_ para 256, depois a operação, depois ps, pd ou epi32 para o tipo. O Intrinsics Guide da Intel, online, lista cada um com a sua instrução e o seu custo. Intrínsecos são o que bibliotecas como codecs de imagem e núcleos matemáticos usam: você escolhe as instruções, e o compilador continua alocando os registradores, ordenando o código e fazendo o inlining.",
  asmSimd_sigill: "-mavx2 e -march=native deixam o gcc usar AVX2 em todo aquele arquivo. O programa então quebra com SIGILL, instrução ilegal, num processador sem essa extensão. Software distribuído para outras pessoas confere antes, com __builtin_cpu_supports(\"avx2\") ou com a instrução cpuid, e escolhe uma versão em tempo de execução; o gcc consegue gerar as duas versões para você com __attribute__((target_clones(\"avx2\", \"default\"))).",

  asmSimd_tryTitle: "Tente você mesmo",
  asmSimd_try1: "Estenda o add4.asm para um add8 com AVX: registradores ymm, vmovups e vaddps ymm0, ymm0, ymm1. Monte-o e chame-o do C. O que acontece se você deixar o vzeroupper de fora antes do ret?",
  asmSimd_try2: "No Compiler Explorer, compile o laço de escala com -O3 -march=x86-64-v4 (AVX-512). Quantos floats cada volta trata agora?",
  asmSimd_try3: "Escreva void prefix(float *a, int n) { for (int i = 1; i < n; i++) a[i] += a[i - 1]; } e compile com -O3. Ele é vetorizado? Por que não?",

  asmSimd_key0: "Uma instrução empacotada faz a mesma operação em todas as faixas: addps soma 4 floats, vaddps num ymm soma 8.",
  asmSimd_key1: "O SSE tem 16 registradores xmm de 128 bits, o AVX 16 ymm de 256, o AVX-512 32 zmm de 512; cada um contém o anterior como metade de baixo.",
  asmSimd_key2: "Medido num Ryzen 5 5600X: uma soma de ints ficou 5,2× mais rápida com SSE e 10,7× com AVX2.",
  asmSimd_key3: "Os laços vetoriais do gcc têm uma preparação com broadcast, um laço principal e um resto escalar.",
  asmSimd_key4: "Reduções de float só são vetorizadas com -ffast-math, porque a soma de floats não é associativa.",
  asmSimd_key5: "Intrínsecos dão SIMD a partir do C, uma instrução por chamada; o compilador continua cuidando dos registradores e da ordem.",
  asmSimd_key6: "Código compilado para AVX quebra com SIGILL em processadores sem ele: confira com __builtin_cpu_supports ou cpuid.",
};

export default text;
