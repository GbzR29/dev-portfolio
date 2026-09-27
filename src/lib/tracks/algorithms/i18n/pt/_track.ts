// PT chapter titles and section names for the algorithms track (see algorithms/index.tsx).

const track = {
  titles: {
    memory: "Memória, arrays e ponteiros",
    complexity: "Contando passos: Big-O",
    recursion: "Recursão e a pilha de chamadas",
    searching: "Busca linear e busca binária",
    "elementary-sorts": "Ordenações elementares",
    "merge-sort": "Merge sort",
    quicksort: "Quicksort",
    "linear-sorts": "Além das comparações: ordenações lineares",
    "dynamic-array": "Arrays dinâmicos",
    "linked-list": "Listas encadeadas",
    stacks: "Pilhas",
    queues: "Filas e deques",
    "hash-table": "Tabelas hash",
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Searching & Sorting": "Busca e ordenação",
    "Linear Structures": "Estruturas lineares",
  } as Record<string, string>,
};

export default track;
