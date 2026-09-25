// ZH text for src/lib/tracks/opengl/chapters/ebo.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch06_intro: "每个四边形由两个共享两个顶点的三角形组成。没有索引就会重复存储顶点浪费VRAM。EBO存储索引列表让每个顶点只存在一次。",
  ch06_whyTitle: "重复问题",
  ch06_whyBody: "四边形有四个顶点，GL_TRIANGLES需要六个，其中两个重复。",
  ch06_solutionTitle: "EBO解决方案",
  ch06_solutionBody: "用EBO存储四个唯一顶点和六个索引，GPU通过索引查找顶点无需重复。",
  ch06_createTitle: "创建EBO",
  ch06_createBody: "EBO的创建方式与VBO完全相同，区别是目标为GL_ELEMENT_ARRAY_BUFFER，且必须在VAO绑定时绑定EBO。",
  ch06_eboWarn: "不要在解绑VAO之前解绑EBO。VAO存储GL_ELEMENT_ARRAY_BUFFER绑定，提前解绑会丢失该关联。",
  ch06_drawTitle: "使用glDrawElements绘制",
  ch06_drawBody: "用glDrawElements替换glDrawArrays，第二个参数是索引数量而非顶点数量。",
  ch06_wireframeTitle: "调试技巧：线框模式",
  ch06_wireframeBody: "开发时可切换线框模式验证索引是否正确。",
  ch06_nextTip: "EBO对复杂3D网格价值更大。Assimp等网格加载库默认输出索引几何体。",
};

export default text;
