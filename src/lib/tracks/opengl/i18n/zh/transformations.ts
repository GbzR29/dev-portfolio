// ZH text for src/lib/tracks/opengl/chapters/transformations.tsx. Keys match the tx() calls there; English is the fallback in the code.

const text: Record<string, string> = {
  ch08_intro: "目前所有内容都在固定NDC坐标。要移动旋转缩放对象并放置相机，需要矩阵数学。GLM是镜像GLSL数学类型的header-only C++库。",
  ch08_glmTitle: "向项目添加GLM",
  ch08_mvpTitle: "MVP矩阵",
  ch08_mvpBody: "每个顶点到达屏幕前经过三次变换。每次变换是4×4矩阵，逆序相乘：gl_Position = 投影 × 视图 × 模型 × 顶点。",
  mvpHeader0: "矩阵",
  mvpHeader1: "用途",
  mvpHeader2: "GLM函数",
  mvpModel: "在世界空间放置对象（平移/旋转/缩放）",
  mvpView: "模拟相机——将世界空间变换到相机空间",
  mvpProjection: "应用透视——远处物体显得更小",
  ch08_modelTitle: "模型矩阵——放置对象",
  ch08_modelBody: "从单位矩阵开始应用变换。顺序重要：先缩放，再旋转，再平移。",
  ch08_viewTitle: "视图矩阵——相机",
  ch08_viewBody: "glm::lookAt接受相机位置、观察点和向上方向三个向量。",
  ch08_projTitle: "投影矩阵——透视",
  ch08_projBody: "glm::perspective创建视锥体，远处物体显得更小。参数：垂直FOV、宽高比、近远裁剪面。",
  ch08_nearWarn: "近裁剪面不要设为0，会导致z-fighting，因为深度缓冲精度在near到far间分布。",
  ch08_shaderTitle: "在顶点着色器中应用MVP",
  ch08_animTip: "将角度乘以glfwGetTime()可实现每帧旋转动画。",
};

export default text;
