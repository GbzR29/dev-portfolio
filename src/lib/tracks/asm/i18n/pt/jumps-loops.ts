// PT text for src/lib/tracks/asm/chapters/jumps-loops.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  asmJmp_intro: "Assembly não tem if, nem while, nem for. Tem saltos: instruções que põem um endereço novo no rip, de modo que a CPU continua em outro lugar. Um salto condicional só faz isso quando as flags mandam. Com saltos e as flags do capítulo anterior dá para montar toda estrutura de controle que o C tem, e é exatamente isso que este capítulo faz.",
  asmJmp_goal0: "Usar cmp ou test seguido de um salto condicional, e escolher o salto com sinal ou o sem sinal.",
  asmJmp_goal1: "Traduzir if/else, while, do-while e for em labels e saltos.",
  asmJmp_goal2: "Reconhecer o formato de laço que o gcc gera, com o teste no fim.",
  asmJmp_goal3: "Trocar um desvio curto por setcc ou cmov, e dizer por que os compiladores fazem isso.",

  asmJmp_jmpTitle: "jmp e labels",
  asmJmp_jmpBody: "jmp alvo põe o endereço do alvo no rip. A próxima instrução que a CPU busca é a que está no alvo. Você dá nome aos alvos com labels, como no primeiro programa. Um label que começa com ponto, como .top, é local: o NASM o prende ao último label comum, então cada função pode ter o seu próprio .done sem conflito.",
  asmJmp_relBody: "O código de máquina não guarda o endereço do alvo. Ele guarda a distância do fim do salto até o alvo, como nos dados relativos ao RIP. Um salto curto usa um byte com sinal, de −128 a 127; um mais longo usa quatro. No laço mais abaixo, jle .top são os dois bytes 7E F7. 7E quer dizer \"salte se menor ou igual\", e F7 é −9: nove bytes para trás, até o .top.",

  asmJmp_condTitle: "Compare, depois salte",
  asmJmp_condBody: "Um salto condicional olha as flags e salta ou segue para a linha seguinte. Algo precisa ajustar as flags logo antes dele, e em geral é uma de duas instruções feitas para isso:",
  asmJmp_hInstr: "Instrução",
  asmJmp_hDoes: "Faz",
  asmJmp_hUse: "Uso típico",
  asmJmp_cmp: "a − b, só as flags; a não muda",
  asmJmp_cmpUse: "comparar dois valores",
  asmJmp_test: "a & b, só as flags",
  asmJmp_testUse: "test eax, eax: é zero? é negativo?",
  asmJmp_condNames: "Leia cmp a, b seguido de um salto como uma pergunta sobre a e b. Os nomes seguem uma regra: less e greater (l, g; menor e maior) são para números com sinal, below e above (b, a; abaixo e acima) para números sem sinal. e é equal (igual), n quer dizer not (não). Mexa nos controles e veja quais saltos aconteceriam:",
  asmJmp_hSigned: "Com sinal (int)",
  asmJmp_hUnsigned: "Sem sinal",
  asmJmp_whyFlags: "Por que o jl testa SF ≠ OF? Depois de a − b, um resultado negativo (SF = 1) quer dizer a < b, a não ser que a subtração tenha estourado, caso em que o sinal sai invertido (OF = 1). Então \"menor\" é \"negativo, ou estourou, mas não as duas coisas\". Para números sem sinal é mais simples: a < b exatamente quando a − b precisou de empréstimo, CF = 1.",

  asmJmp_typeTitle: "O salto decide o tipo",
  asmJmp_typeBody: "Em assembly, um registrador é só bits; não existe int nem unsigned. O tipo mora no salto que você escolhe. Os dois programas abaixo são idênticos, exceto por um salto: os dois calculam o maior entre −1 e 1. Rode cada um e compare os códigos de saída.",
  asmJmp_typeC: "Este é o assembly por trás de uma armadilha famosa do C. Se a é um int que vale −1 e b é unsigned, o C converte a para unsigned antes de comparar, e o compilador gera o salto sem sinal: −1 vira 4.294.967.295, e −1 < 1u é falso. O gcc -O2 compila as duas versões de max para cmovge e cmovnb, a mesma escolha entre com e sem sinal em outra instrução (nb, not below, é outro nome para ae).",

  asmJmp_ifTitle: "if e else",
  asmJmp_ifBody: "O padrão de um if é saltar por cima do corpo quando a condição é falsa. Então o salto no código testa o contrário da condição do C: if (x < 0) vira \"salte o corpo se x ≥ 0\".",
  asmJmp_ifEnd: "O jmp .end no fim da parte do then é fácil de esquecer. Sem ele, a CPU cai direto na parte do else e sobrescreve o resultado: labels são só endereços, não paredes.",

  asmJmp_loopTitle: "Laços",
  asmJmp_loopBody: "Um laço é um salto para trás. O programa abaixo é for (i = 1; i <= 5; i++) total += i;, com total em eax e i em ecx. Rode-o e depois remova o inc ecx.",
  asmJmp_hang: "Sem o inc, ecx fica em 1 para sempre, cmp ecx, 5 sempre encontra 1 ≤ 5, e o jle sempre volta. O assembler não tem como perceber isso, e a CPU não para sozinha: o programa roda até alguém encerrá-lo. A figura desiste depois de 60 passos; num terminal você apertaria Ctrl+C.",

  asmJmp_shapesTitle: "Quatro formatos de laço",
  asmJmp_hShape: "Formato em assembly",
  asmJmp_s1: "corpo, teste, salta para trás se c: o mais simples, um salto por volta",
  asmJmp_s2: "teste no topo, salta para fora se não c; corpo; jmp de volta para o teste",
  asmJmp_s3: "init, depois um laço while cujo corpo termina com step",
  asmJmp_s4c: "contagem regressiva até 0",
  asmJmp_s4: "corpo; dec ecx; jnz para trás: o próprio dec ajusta o ZF, então não precisa de cmp",
  asmJmp_rotate: "Um laço while custa dois saltos por volta. Os compiladores evitam isso testando uma vez antes do laço e pondo o teste no fim, o que o transforma num do-while. Este é o gcc -O1 para int sum(int n) { int t = 0; for (int i = 1; i <= n; i++) t += i; return t; }:",
  asmJmp_rotateNote: "Labels como .L13 são inventados pelo compilador. Achar o salto para trás (jne .L13) é o jeito mais rápido de encontrar um laço na saída de um compilador. No -O2, o gcc vai além e trata dois números por volta; ler isso é assunto de um capítulo mais adiante.",

  asmJmp_noBranchTitle: "Decidir sem saltar",
  asmJmp_noBranchBody: "Duas famílias de instruções usam as flags sem saltar. setcc grava 1 ou 0 num registrador de um byte: setl al faz al = 1 se o último cmp encontrou \"menor\". cmovcc (cópia condicional) copia um valor só se a condição vale. O cc é qualquer um dos códigos de condição acima. Saída real do gcc -O2:",
  asmJmp_noBranchWhy: "Por que se dar ao trabalho? Uma CPU moderna começa a trabalhar nas instruções muito antes de saber para onde vai um salto condicional. Ela chuta, e quando o chute erra joga o trabalho fora, o que custa uns 15 a 20 ciclos. Para uma condição que muda de forma imprevisível, um cmov que sempre leva um ou dois ciclos sai mais barato. O xor antes do setl zera o eax inteiro, já que o setl só escreve em al. A seção de desempenho volta à previsão de desvios.",

  asmJmp_tryTitle: "Tente você mesmo",
  asmJmp_try1: "Reescreva o programa do laço como uma contagem regressiva: comece ecx em 5, some, depois dec ecx e jnz. Por que o cmp pode sair?",
  asmJmp_try2: "Escreva o valor absoluto de edi em eax sem salto: mov eax, edi, neg eax e depois um cmov. Com qual código de condição?",
  asmJmp_try3: "Escreva um laço que conta os caracteres de uma string terminada em zero: cmp byte [rdi + rax], 0, je para o fim, inc rax, jmp de volta. É o strlen.",

  asmJmp_key0: "Um salto põe um endereço novo no rip. Saltos condicionais só fazem isso quando as flags combinam com a sua condição.",
  asmJmp_key1: "cmp a, b calcula a − b e test a, b calcula a & b, guardando só as flags.",
  asmJmp_key2: "l e g (less, greater) comparam números com sinal; b e a (below, above) comparam números sem sinal. O salto que você escolhe decide o tipo.",
  asmJmp_key3: "Um if salta por cima do corpo quando a condição é falsa, então o salto testa o contrário da condição do C.",
  asmJmp_key4: "Um laço é um salto para trás. Os compiladores testam uma vez antes do laço e depois no fim de cada volta.",
  asmJmp_key5: "setcc e cmovcc usam as flags sem saltar; os compiladores os preferem quando um desvio seria difícil de prever.",
};

export default text;
