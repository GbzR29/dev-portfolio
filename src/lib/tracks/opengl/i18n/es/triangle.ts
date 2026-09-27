// ES text for src/lib/tracks/opengl/chapters/triangle.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch05_intro: "Ya tienes todas las piezas. Este capítulo las une para renderizar el Hello World de la programación gráfica.",
  ch05_fullTitle: "El programa completo",
  ch05_blackScreenTip: "Si solo ves el color de fondo y ningún error, las causas más comunes son: no había un VAO enlazado cuando se ejecutó glVertexAttribPointer (o al dibujar), el layout location del shader no coincide con el índice del atributo, el shader falló al compilar o enlazar (revisa ambos logs, como en el código de arriba), o los vértices están fuera del rango [-1, 1] de las NDC.",
  ch05_nextTitle: "Qué probar a continuación",
  ch05_nextBody: "Cambia el color del triángulo, añade un segundo triángulo, y prueba a pasar colores por vértice.",
  ch05_windingWarn: "El orden de los vértices en el array no es arbitrario: define el winding order de la cara. Por defecto OpenGL considera frontales los triángulos en sentido antihorario (CCW). El capítulo Face Winding & Culling explica por qué importa.",
};

export default text;
