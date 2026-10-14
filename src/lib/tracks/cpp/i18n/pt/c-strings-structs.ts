// PT text for src/lib/tracks/cpp/chapters/c-strings-structs.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  cStr_intro: "O C não tem tipo string nem classes. Texto é um array de chars com um byte zero no fim, e toda função que lida com texto confia nesse byte zero para saber onde o texto termina. Dados agrupados são um struct: campos com nome colocados um depois do outro na memória. Com enum para constantes com nome e union para \"um entre vários tipos\", essas quatro ferramentas bastam para descrever quase qualquer dado, do cabeçalho de um arquivo a uma entidade de jogo.",
  cStr_goal0: "Explicar como uma string em C termina, e por que um '\\0' faltando é um bug.",
  cStr_goal1: "Comparar, copiar e montar strings com <string.h> e snprintf sem estourar.",
  cStr_goal2: "Definir um struct, inicializá-lo e chegar aos seus campos com . e ->.",
  cStr_goal3: "Usar um enum para estados com nome e uma union com etiqueta para valores de vários tipos.",

  cStr_strTitle: "Uma string é um array que termina em zero",
  cStr_strBody: "Uma string em C é uma sequência de chars seguida do caractere nulo '\\0', um byte de valor 0. Nada mais registra o comprimento. O literal \"hello\" tem 6 bytes: cinco letras e o terminador. Para achar o comprimento, o código anda a partir do primeiro char até encontrar o zero. Avance abaixo e veja o ponteiro se mover.",

  cStr_libTitle: "As funções de <string.h>",
  cStr_hFn: "Função",
  cStr_hDoes: "O que faz",
  cStr_hCare: "Cuidado",
  cStr_f1: "número de chars antes do '\\0'",
  cStr_f1c: "percorre a string inteira a cada chamada",
  cStr_f2: "0 se forem iguais; negativo ou positivo pela ordem alfabética",
  cStr_f2c: "a == b compara endereços, não o texto",
  cStr_f3: "copia src, com o '\\0', para dst",
  cStr_f3c: "não confere tamanho: estoura um dst pequeno",
  cStr_f4: "acrescenta src ao fim de dst",
  cStr_f4c: "também não confere tamanho",
  cStr_f5: "printf para dentro de um array; escreve no máximo size bytes e sempre termina com '\\0'",
  cStr_f5c: "devolve o comprimento que queria: se for ≥ size, o texto foi cortado",
  cStr_f6: "copia n bytes de qualquer coisa",
  cStr_f6c: "as áreas não podem se sobrepor (use memmove se sobrepuserem)",
  cStr_f7: "põe um mesmo valor em n bytes, em geral 0",
  cStr_f7c: "define bytes, não ints: memset(a, 1, …) não produz 1s",

  cStr_noTermTitle: "Quando falta o zero",
  cStr_noTermBody: "Um array de chars sem terminador parece uma string, mas não é. Qualquer função de string que o receba continua lendo além do fim, pelo que estiver em seguida na memória, até topar com um byte zero por acaso. Avance pelo mesmo laço sobre um array assim.",
  cStr_overflowWarn: "Escrever além do fim de um array de chars é o clássico buffer overflow. Com strcpy, strcat, gets ou um %s puro no scanf, é a entrada que decide quantos bytes são escritos, então um atacante que controla a entrada controla o que é sobrescrito. Limite o tamanho de toda escrita: snprintf, scanf(\"%31s\"), fgets(buf, sizeof buf, stdin).",

  cStr_structTitle: "struct: campos lado a lado",
  cStr_structBody: "Um struct junta campos com nome, de quaisquer tipos, num único valor. Na memória os campos ficam na ordem em que você os declara. Um ponto alcança um campo de um valor struct (pt.x). Através de um ponteiro você escreve p->x, que é a forma curta de (*p).x. Structs podem ser atribuídos e passados por valor, o que copia todos os bytes, então funções costumam receber um ponteiro para um struct grande; const nesse ponteiro diz que a função só lê.",
  cStr_padNote: "Um struct pode ser maior que a soma dos seus campos. Cada campo começa num múltiplo do seu próprio tamanho, então o compilador insere bytes de enchimento (padding) sem uso: struct { char a; int b; char c; } ocupa 12 bytes, não 6. Ordenar os campos do maior para o menor desperdiça menos. O capítulo Memória da trilha de Algoritmos desenha isso byte a byte.",

  cStr_enumTitle: "enum: constantes com nome",
  cStr_enumBody: "Um enum dá nomes a um conjunto de números inteiros. Se você não disser outra coisa, eles contam a partir de 0. Use um sempre que um valor for \"um entre poucos estados\": o código se lê como palavras e, com -Wall, um switch que esquece um dos nomes ganha um aviso.",

  cStr_unionTitle: "union: vários tipos nos mesmos bytes",
  cStr_unionBody: "Uma union parece um struct, mas todos os campos começam no mesmo endereço e dividem os mesmos bytes. O tamanho dela é o do maior campo, e só um campo guarda um valor com sentido de cada vez. Sozinha, nada diz qual. Por isso unions quase sempre andam com uma etiqueta enum que registra qual campo está em uso: uma union com etiqueta (tagged union). Valores JSON, variáveis de script e filas de eventos são feitos assim.",
  cStr_variantBody: "Ler um membro diferente do último escrito é um bug, a não ser que você queira olhar os bytes crus. O C++ troca a etiqueta escrita à mão por std::variant, que guarda a etiqueta sozinho e recusa o acesso errado; o capítulo Tipos de vocabulário trata disso.",

  cStr_tryTitle: "Experimente",
  cStr_try1: "Escreva a sua própria size_t my_strlen(const char *s) com um ponteiro que anda, e confira com strlen.",
  cStr_try2: "Imprima o sizeof de struct { char a; int b; char c; } e dos mesmos campos na ordem int, char, char. Explique a diferença.",
  cStr_try3: "Acrescente SHAPE_TRIANGLE (base e altura) à union com etiqueta e a area. Compile com -Wall antes de atualizar o switch e leia o aviso.",

  cStr_key0: "Uma string em C é uma sequência de chars seguida de '\\0'. Nada mais guarda o comprimento.",
  cStr_key1: "Compare strings com strcmp, nunca com ==, e monte-as com snprintf, que não estoura.",
  cStr_key2: "Um literal de string é somente leitura; um array de chars inicializado com ele é uma cópia sua, que pode ser alterada.",
  cStr_key3: "Um struct dispõe os campos em ordem, com padding. Use . num valor e -> através de um ponteiro.",
  cStr_key4: "Passe structs grandes por ponteiro, com const quando a função só lê.",
  cStr_key5: "enum dá nome a estados; uma union divide bytes entre campos e precisa de uma etiqueta que diga qual vale.",
};

export default text;
