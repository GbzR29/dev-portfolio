// ZH text for src/lib/tracks/opengl/chapters/vao.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch03_intro: "每次绘制网格，OpenGL需要知道数据在哪个缓冲区。VAO将该状态记录一次，让你用单次绑定重放。",
  ch03_whatTitle: "VAO存储什么",
  ch03_whatAfter: "绑定VAO时，对glVertexAttribPointer和glEnableVertexAttribArray的每次调用都会被记录。",
  ch03_createTitle: "创建和使用VAO",
  ch03_renderLoop: "现在在渲染循环中，只需绑定VAO：",
  ch03_goldenRule: "黄金法则：在设置VBO之前创建VAO。",
  ch03_interleavedTitle: "交错顶点数据",
  ch03_interleavedBody: "真实顶点有位置、纹理坐标和法向量，全部打包在一个缓冲区中。",
};

export default text;
