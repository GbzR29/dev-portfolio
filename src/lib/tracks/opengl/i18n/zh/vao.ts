// ZH text for src/lib/tracks/opengl/chapters/vao.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch03_intro: "每次绘制网格，OpenGL需要知道数据在哪个缓冲区。VAO将该状态记录一次，让你用单次绑定重放。",
  ch03_whatTitle: "VAO存储什么",
  ch03_whatAfter: "绑定VAO时，对glVertexAttribPointer和glEnableVertexAttribArray的每次调用都会被记录。",
  ch03_createTitle: "创建和使用VAO",
  ch03_renderLoop: "现在在渲染循环中，只需绑定VAO：",
  ch03_goldenRule: "真正重要的规则：调用glVertexAttribPointer和glEnableVertexAttribArray时必须绑定着VAO，因为VAO记录的正是这些调用。创建VBO或用glBufferData填充它可以在任何时候进行，之前或之后都行。仅仅绑定到GL_ARRAY_BUFFER的VBO不会被记录；被记录的是glVertexAttribPointer执行那一刻所绑定的缓冲，并与该属性关联。像上面那样先绑定VAO，只是最不容易出错的做法。",
  ch03_interleavedTitle: "交错顶点数据",
  ch03_interleavedBody: "真实顶点有位置、纹理坐标和法向量，全部打包在一个缓冲区中。",
};

export default text;
