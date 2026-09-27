// ES text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch02_intro: "Tus datos de vértice empiezan como un array C++ en la RAM, en memoria que pertenece a tu programa. El vertex shader no puede leer un array C++. Lee de buffer objects que gestiona OpenGL, ubicados donde el driver considere más rápido: normalmente en la memoria propia de la GPU (VRAM) en una tarjeta dedicada, o en una región compartida de la RAM del sistema en una integrada. Un Vertex Buffer Object (VBO) es ese tipo de buffer. Copias tu array en él una vez y, desde entonces, la GPU lo lee directamente, sin trabajo por vértice en la CPU.",
  ch02_flowTitle: "El flujo de datos",
  ch02_flowAfter: "Defines los datos, creas un buffer en la GPU, subes los datos con glBufferData y emites un draw call.",
  ch02_stepTitle: "Creando un VBO paso a paso",
  ch02_step1Title: "Paso 1: Generar el buffer",
  ch02_step1Body: "Todo en OpenGL se identifica con un ID entero. Le pides a OpenGL que cree un buffer y te devuelve un ID.",
  ch02_step2Title: "Paso 2: Hacer el bind del buffer",
  ch02_step2Body: "OpenGL es una máquina de estados. Para operar en un buffer, primero haces su bind.",
  ch02_step2Callout: "GL_ARRAY_BUFFER es para datos de vértice. GL_ELEMENT_ARRAY_BUFFER es para index buffers.",
  ch02_step3Title: "Paso 3: Subir los datos",
  ch02_step3Body: "Copias el array de vértices de RAM a la GPU con glBufferData.",
  ch02_step3TableIntro: "Los tres hints de uso que necesitas conocer:",
  vboTableHeader0: "Hint",
  vboTableHeader1: "Cuándo usar",
  vboStaticDesc: "Datos definidos una vez, usados muchas veces. Bueno para geometría estática.",
  vboDynamicDesc: "Datos modificados y usados muchas veces. Bueno para geometría animada.",
  vboStreamDesc: "Datos definidos una vez, usados pocas veces. Bueno para partículas por fotograma.",
  ch02_usageHintTip: "Estos hints son solo sugerencias de rendimiento. Usarlos incorrectamente no romperá nada.",
  ch02_interpretTitle: "Diciéndole a OpenGL cómo interpretar los datos",
  ch02_interpretBody: "El VBO es solo bytes en la GPU. Necesitas decirle a OpenGL cómo interpretarlos usando glVertexAttribPointer.",
  ch02_interpretWarn: "El primer argumento (0) debe coincidir con layout (location = 0) en tu vertex shader.",
  ch02_fullTitle: "El setup completo del VBO en un solo lugar",
  ch02_nextTitle: "Por qué no deberías detenerte aquí",
  ch02_nextBody: "El código de arriba está completo en lo que respecta al buffer, pero en el Core profile todavía no dibuja nada. El layout de atributos que describes con glVertexAttribPointer tiene que guardarse en algún sitio, y en Core ese sitio debe ser un Vertex Array Object (VAO). Sin un VAO enlazado, las llamadas de atributos y el draw call fallan con GL_INVALID_OPERATION, y el único síntoma es una pantalla vacía. (Los antiguos contextos de compatibilidad tenían un VAO por defecto, por eso muchos tutoriales antiguos lo omiten.) El próximo capítulo añade el VAO. Como extra, graba el layout completo una vez, de modo que dibujar una malla después cuesta un solo bind en lugar de describir cada atributo otra vez.",
};

export default text;
