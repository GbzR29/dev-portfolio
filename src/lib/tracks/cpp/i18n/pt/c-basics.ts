// PT text for src/lib/tracks/cpp/chapters/c-basics.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cBas_intro: "C é uma linguagem pequena de 1972 que ainda move o mundo. Kernels de sistemas operacionais, drivers, bancos de dados e as bibliotecas por trás dos jogos são escritos nela. As APIs que você chama do C++ são APIs em C: OpenGL, Vulkan, SDL e o próprio sistema operacional. O C++ começou como \"C com classes\", e quase todo programa em C ainda é C++ válido. O C esconde muito pouco. Uma variável é uma caixa num endereço, e você pode ver esse endereço e trabalhar com ele. Esta seção ensina essa imagem primeiro. Os capítulos de C++ que vêm depois fazem sentido quando você sabe o que eles automatizam.",
  cBas_goal0: "Escrever, compilar e rodar um programa em C, e ler os avisos do compilador.",
  cBas_goal1: "Escolher um tipo para um valor e dizer quantos bytes ele ocupa.",
  cBas_goal2: "Prever o resultado da divisão inteira e de misturar int com double.",
  cBas_goal3: "Imprimir valores com printf e ler números com segurança com scanf.",

  cBas_helloTitle: "O primeiro programa",
  cBas_hLine: "Linha",
  cBas_hMeans: "O que significa",
  cBas_l1: "Cola as declarações das funções padrão de entrada e saída, printf entre elas. Linhas que começam com # são tratadas pelo pré-processador antes da compilação.",
  cBas_l2: "Define a função main. Todo programa em C começa nela. int é o tipo do valor que ela devolve; void quer dizer que ela não recebe argumentos.",
  cBas_l3: "As chaves guardam o corpo da função: os comandos que ela executa, de cima para baixo.",
  cBas_l4: "Chama printf com uma string. \\n é o caractere de nova linha. Todo comando termina com ponto e vírgula.",
  cBas_l5: "Encerra main e entrega 0 ao sistema operacional, o que por convenção quer dizer \"sucesso\". Qualquer outro número indica erro.",

  cBas_buildTitle: "Do arquivo-fonte ao programa",
  cBas_buildBody: "O processador não consegue rodar hello.c. Um compilador o transforma em código de máquina em três etapas. O pré-processador trata as linhas com #. O compilador propriamente dito traduz o C num arquivo objeto (hello.o): código de máquina com buracos onde ele chama funções definidas em outro lugar, como printf. O linker preenche os buracos com a biblioteca padrão do C e grava o executável. Um único comando faz as três coisas.",
  cBas_hFlag: "Opção",
  cBas_hDoes: "O que faz",
  cBas_f1: "Qual versão do C aceitar. C17 é o padrão seguro; C23 é mais novo e suportado por gcc e clang recentes.",
  cBas_f2: "Ligam a maioria dos avisos. Um aviso é o compilador apontando código que é válido mas provavelmente errado. Trate cada um como um bug.",
  cBas_f3: "Guarda informação de depuração, para que um depurador mostre as suas linhas de código e os nomes das variáveis.",
  cBas_f4: "Nome do arquivo de saída. Sem isso o gcc grava a.out.",
  cBas_explorerTip: "Ainda sem compilador instalado? O Compiler Explorer (godbolt.org) compila e roda C no navegador. Escolha \"C\" como linguagem e ponha as opções acima na caixa de opções do compilador.",

  cBas_typesTitle: "Tipos: quantos bytes e o que eles significam",
  cBas_typesBody: "A memória é uma longa fileira de bytes. Um byte tem 8 bits, então guarda um entre 2⁸ = 256 padrões. Um tipo diz duas coisas ao compilador: quantos bytes um valor ocupa e como ler esses bits (como número inteiro, número com fração ou caractere). O operador sizeof dá o tamanho em bytes. O C só fixa mínimos, mas todo computador e celular atual usa os tamanhos abaixo.",
  cBas_hType: "Tipo",
  cBas_hBytes: "Bytes",
  cBas_hRange: "Guarda",
  cBas_t1: "um caractere (na verdade um número pequeno: 'A' é 65)",
  cBas_t2: "números inteiros de −32 768 a 32 767",
  cBas_t3: "números inteiros até cerca de ±2,1 bilhões; a escolha padrão",
  cBas_t4: "números inteiros até cerca de ±9,2 · 10¹⁸",
  cBas_t5: "números com fração, cerca de 7 algarismos significativos",
  cBas_t6: "números com fração, cerca de 16 algarismos significativos; o padrão para decimais",
  cBas_t7: "tamanhos e contagens, nunca negativos; o que sizeof devolve",
  cBas_t8: "true ou false (inclua <stdbool.h> antes do C23)",
  cBas_signedBody: "Os tipos inteiros vêm em dois sabores. Os com sinal (signed, o padrão) guardam valores negativos e positivos. Os unsigned guardam só zero para cima e, em troca, chegam ao dobro: um unsigned int vai de 0 a cerca de 4,29 bilhões. Quando a largura exata importa, como num formato de arquivo ou numa mensagem de rede, use os tipos de <stdint.h>: int8_t, int32_t, uint64_t e assim por diante, cujos nomes dizem o número de bits.",
  cBas_longNote: "long é o único tipo que muda entre sistemas: 8 bytes no Linux e no macOS de 64 bits, mas 4 no Windows. É uma fonte comum de bugs em código levado de um para o outro. Use long long ou int64_t quando precisar de 64 bits.",

  cBas_varsTitle: "Variáveis são caixas em endereços",
  cBas_varsBody: "Uma declaração como int count = 3; pede uma caixa de 4 bytes e escreve 3 nela. Daí em diante o nome count representa essa caixa. Variáveis locais, as declaradas dentro de uma função, vivem no stack frame dessa função: um trecho de memória criado quando a função começa e liberado quando ela retorna. Avance pelo programa abaixo e veja cada caixa aparecer com o seu endereço, tipo e tamanho.",
  cBas_garbageBody: "Olhe total antes de receber valor. O C não limpa variáveis locais novas, então a caixa guarda os bits que uma função anterior deixou ali. Lê-la é um bug que pode imprimir 0 na sua máquina e lixo em outra. A regra é simples: dê valor a toda variável no lugar onde ela é declarada. -Wall avisa quando consegue ver o erro.",

  cBas_arithTitle: "Aritmética: o tipo decide o resultado",
  cBas_arithBody: "Quando os dois operandos são inteiros, o C faz aritmética inteira. A divisão descarta a fração (arredonda em direção a zero), e % dá o resto. Assim que um dos operandos é double, o outro é convertido para double e o resultado mantém a fração. Um cast, escrito (tipo) antes de um valor, converte de propósito.",

  cBas_printfTitle: "printf: imprimindo valores",
  cBas_printfBody: "printf recebe uma string de formato e depois os valores a encaixar nela. Cada % na string é um especificador de conversão: diz onde vai o próximo valor e como imprimi-lo. O especificador precisa combinar com o tipo do valor. O próprio printf não consegue conferir isso, mas -Wall -Wextra faz o compilador conferir por você.",
  cBas_hSpec: "Especificador",
  cBas_hFor: "Para",
  cBas_hEx: "Exemplo → saída",
  cBas_sStr: "string",
  cBas_sHex: "unsigned, em hexadecimal",
  cBas_sPtr: "um endereço (ponteiro)",

  cBas_scanfTitle: "scanf: lendo a entrada",
  cBas_scanfBody: "scanf é o inverso de printf: lê o texto digitado pelo usuário e guarda os números que encontra. Ele precisa mudar a sua variável, então você passa o endereço dela com &. O próximo capítulo explica endereços por completo. scanf devolve quantos valores conseguiu guardar, e você precisa conferir esse número: se o usuário digitar \"abc\" onde se esperava um número, nada é guardado e a variável fica com o valor antigo.",
  cBas_scanfWarn: "Nunca leia uma palavra com um %s puro: scanf escreve tantos caracteres quantos o usuário digitar, passando do fim do seu array. Sempre dê uma largura uma unidade menor que o tamanho do array, como em char name[32]; scanf(\"%31s\", name); O último byte fica reservado para o '\\0' que termina toda string em C.",

  cBas_flowTitle: "Decisões, laços e funções",
  cBas_flowBody: "O controle de fluxo do C é o mesmo que C++, Java e JavaScript herdaram: if / else, while, for e funções. Uma função precisa ser declarada antes de ser chamada. Quando a definição vem mais abaixo no arquivo, um protótipo no topo (a primeira linha da função seguida de ponto e vírgula) informa ao compilador o nome, os tipos dos parâmetros e o tipo de retorno.",
  cBas_vsCppTitle: "O que o C não tem",
  cBas_vsCppBody: "Vindo do C++, ou indo para ele em seguida, vale conhecer as diferenças. O C não tem classes, referências, templates, exceções, namespaces nem sobrecarga (duas funções não podem ter o mesmo nome). Não há std::string nem std::vector: texto e listas são arrays que você mesmo gerencia. Em troca, um programa em C faz exatamente o que as suas linhas dizem, sem nada rodando por trás. O último capítulo desta seção, Do C ao C++, mostra como o C++ constrói as suas ferramentas mais seguras sobre essas mesmas caixas.",

  cBas_tryTitle: "Experimente",
  cBas_try1: "Imprima o sizeof de cada tipo da tabela acima na sua máquina, com %zu. Eles batem?",
  cBas_try2: "Leia dois ints com um único scanf (\"%d %d\") e imprima a soma, o quociente inteiro, o resto e o quociente exato como double.",
  cBas_try3: "Declare int x; sem valor e imprima. Compile com -Wall -Wextra e depois acrescentando -O2. O que dizem os avisos?",

  cBas_key0: "Um programa em C começa em main. O compilador pré-processa, compila e liga tudo num executável.",
  cBas_key1: "Compile com -Wall -Wextra e trate cada aviso como um bug.",
  cBas_key2: "Um tipo fixa o tamanho de um valor em bytes e como os seus bits são lidos. sizeof informa o tamanho.",
  cBas_key3: "Uma variável local é uma caixa no stack frame da sua função. Ela guarda lixo até você dar um valor.",
  cBas_key4: "int / int descarta a fração. Faça um dos operandos ser double para mantê-la.",
  cBas_key5: "Os especificadores do printf precisam combinar com os tipos. scanf precisa de endereços (&x), e o seu retorno precisa ser conferido.",
};

export default text;
