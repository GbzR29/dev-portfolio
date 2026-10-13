// PT chapter titles and section names for the music track (see music/index.tsx).

const track = {
  titles: {
    "what-is-sound": "O que é som?",
    pitch: "Altura e frequência",
    timbre: "Timbre e harmônicos",
    loudness: "Intensidade e envelope",
    pulse: "Pulso e andamento",
    durations: "Duração das notas",
    meter: "Compasso e fórmula de compasso",
    syncopation: "Síncope",
    "note-names": "Nomes das notas e o teclado",
    staff: "A pauta e as claves",
    accidentals: "Sustenidos, bemóis e bequadros",
    temperament: "Temperamento igual",
    intervals: "Intervalos",
  } as Record<string, string>,
  sections: {
    Sound: "Som",
    Rhythm: "Ritmo",
    Notes: "Notas",
    Scales: "Escalas",
  } as Record<string, string>,
};

export default track;
