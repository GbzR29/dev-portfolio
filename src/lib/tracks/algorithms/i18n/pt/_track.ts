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
  } as Record<string, string>,
  sections: {
    Foundations: "Fundamentos",
    "Searching & Sorting": "Busca e ordenação",
  } as Record<string, string>,
};

export default track;
