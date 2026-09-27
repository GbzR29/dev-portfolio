// ES text for src/lib/tracks/opengl/chapters/transformations.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch08_intro: "Todo lo dibujado hasta ahora está en coordenadas NDC fijas. Para mover, rotar y escalar objetos necesitas matrices. GLM es la librería header-only que espeja los tipos matemáticos de GLSL.",
  ch08_glmTitle: "Añadiendo GLM al proyecto",
  ch08_mvpTitle: "Las matrices MVP",
  ch08_mvpBody: "Cada vértice pasa por tres transformaciones. Cada una es una matriz 4×4 multiplicadas en orden inverso: gl_Position = Proyección × Vista × Modelo × vértice.",
  mvpHeader0: "Matriz",
  mvpHeader1: "Propósito",
  mvpHeader2: "Función GLM",
  mvpModel: "Coloca el objeto en el espacio mundo (translate/rotate/scale)",
  mvpView: "Simula una cámara — transforma al espacio de cámara",
  mvpProjection: "Aplica perspectiva — los objetos lejanos aparecen más pequeños",
  ch08_modelTitle: "Matriz Model — colocando objetos",
  ch08_modelBody: "Comienza con identidad y aplica transformaciones. Escala primero, luego rota, luego translada.",
  ch08_viewTitle: "Matriz View — cámara",
  ch08_viewBody: "glm::lookAt recibe posición de cámara, punto de mira y dirección arriba.",
  ch08_projTitle: "Matriz de proyección — perspectiva",
  ch08_projBody: "glm::perspective crea un frustum. Argumentos: FOV vertical, relación de aspecto, planos near y far.",
  ch08_nearWarn: "Nunca pongas el plano near en 0. Sustituye n = 0 en la matriz de arriba y la tercera fila queda (0, 0, −1, 0): z_clip = −z = w, así que tras la división todos los puntos caen en z_ndc = 1 y el depth buffer ya no puede distinguir nada. Incluso un near pequeño y positivo sale caro, porque la precisión de profundidad se concentra justo delante de la cámara. Aléjalo tanto como la escena permita (0.1 es un valor habitual); el capítulo Depth Testing muestra por qué.",
  ch08_shaderTitle: "Aplicando MVP en el vertex shader",
  ch08_animTip: "Para animar rotación, multiplica el ángulo por glfwGetTime() cada frame.",
  ch08_orthoTitle: "Matriz de proyección — ortográfica",
  ch08_orthoBody: "Una proyección ortográfica no tiene perspectiva: un objeto conserva su tamaño por lejos que esté, y las líneas paralelas siguen siendo paralelas. Su frustum es una caja en lugar de una pirámide, dada por seis planos: izquierda, derecha, abajo, arriba, near y far. glm::ortho lleva esa caja al cubo de las NDC con solo una escala y un desplazamiento por eje. Es lo que usan los juegos 2D y las interfaces, las vistas de CAD y de editores, y el shadow map de una luz direccional.",
  ch08_orthoEqLabel: "glm::ortho(l, r, b, t, n, f)",
  ch08_wLR: "x de los lados izquierdo y derecho de la caja, en view space",
  ch08_wBT: "y de sus lados inferior y superior",
  ch08_wNF2: "distancias a los planos near y far delante de la cámara (z en view space = −n y −f)",
  ch08_orthoEqNote: "Cada término de la diagonal comprime un lado de la caja en las 2 unidades de las NDC, y la última columna lleva el centro de la caja a 0. La última fila es (0, 0, 0, 1), así que w sigue siendo 1 y la división no cambia nada: por eso no hay perspectiva. A diferencia del caso en perspectiva, la profundidad se guarda de forma lineal y n = 0 está permitido.",
  ch08_orthoCheck: "Comprueba una esquina: x = r da (2r − r − l) / (r − l) = 1, el borde derecho de las NDC, y x = l da −1. La fila de z hace lo mismo con la profundidad: z = −n en view space cae en −1 y z = −f en +1; el signo menos convierte 'delante de la cámara' (z negativa) en profundidad creciente.",
};

export default text;
