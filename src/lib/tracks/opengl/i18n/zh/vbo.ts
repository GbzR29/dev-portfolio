// ZH text for src/lib/tracks/opengl/chapters/vbo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch02_intro: "顶点数据最初是RAM中的一个C++数组，属于你的程序。顶点着色器无法读取C++数组，它读取的是由OpenGL管理的缓冲对象，驱动会把它放在最快的位置：独立显卡上通常是GPU自己的显存（VRAM），集成显卡上则是系统RAM中的共享区域。顶点缓冲对象（VBO）就是这种缓冲。你把数组复制进去一次，之后GPU直接读取它，CPU不需要逐顶点做任何工作。",
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
  ch02_nextBody: "就缓冲本身而言，上面的代码是完整的，但在Core profile中它仍然什么都画不出来。你用glVertexAttribPointer描述的属性布局必须存放在某个地方，而在Core中这个地方必须是顶点数组对象（VAO）。没有绑定VAO时，属性调用和绘制调用都会以GL_INVALID_OPERATION失败，唯一的症状就是空白屏幕。（旧的兼容性上下文内置了默认VAO，所以很多老教程会省略它。）下一章会加入VAO。额外的好处是：它把整个布局记录一次，之后绘制网格只需一次绑定，而不必重新描述每个属性。",
};

export default text;
