// ZH text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch02_intro: "顶点数据是CPU RAM中的C++数组，GPU无法直接访问RAM。VBO是OpenGL提供的将数据复制到GPU显存的机制。",
  ch02_flowTitle: "数据流",
  ch02_flowAfter: "定义数据、在GPU创建缓冲区、用glBufferData上传、发出绘制调用，GPU完成其余工作。",
  ch02_stepTitle: "逐步创建VBO",
  ch02_step1Title: "第一步：生成缓冲区",
  ch02_step1Body: "OpenGL中一切由整数ID标识。请求OpenGL创建缓冲区，它返回一个ID。",
  ch02_step2Title: "第二步：绑定缓冲区",
  ch02_step2Body: "OpenGL是状态机。要操作缓冲区，先绑定它，使其成为当前活动缓冲区。",
  ch02_step2Callout: "GL_ARRAY_BUFFER用于顶点数据，GL_ELEMENT_ARRAY_BUFFER用于索引缓冲区。",
  ch02_step3Title: "第三步：上传数据",
  ch02_step3Body: "用glBufferData将顶点数组从RAM复制到GPU。最后参数是关于数据更改频率的提示。",
  ch02_step3TableIntro: "你需要了解的三个使用提示：",
  vboTableHeader0: "提示",
  vboTableHeader1: "使用场景",
  vboStaticDesc: "数据设置一次，多次使用。适用于静态几何体。",
  vboDynamicDesc: "数据频繁修改和使用。适用于动画几何体。",
  vboStreamDesc: "数据设置一次，少量使用。适用于每帧粒子系统。",
  ch02_usageHintTip: "这些提示只是性能建议，不影响程序行为。用错了不会破坏任何东西。",
  ch02_interpretTitle: "告诉OpenGL如何解释数据",
  ch02_interpretBody: "VBO只是GPU上的字节块，需要用glVertexAttribPointer告知OpenGL如何解释。",
  ch02_interpretWarn: "第一个参数（0）必须与顶点着色器中的layout (location = 0)匹配。",
  ch02_fullTitle: "完整的VBO设置",
  ch02_nextTitle: "为什么不应在此停止",
  ch02_nextBody: "下一章介绍VAO，允许你记录所有绑定和属性规格一次，然后用单次绑定重放。",
};

export default text;
