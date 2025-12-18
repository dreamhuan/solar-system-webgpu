// src/demo/main.ts

// 1. 导入我们的着色器代码
import pyramidShaderCode from "./pyramid.wgsl?raw";
import { mat4, vec2, vec3 } from "gl-matrix";

async function init() {
  const canvas = document.querySelector<HTMLCanvasElement>("#app")!;
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  if (!navigator.gpu) throw new Error("WebGPU not supported");

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({ device, format, alphaMode: "premultiplied" });

  // 2. 准备数据：我们的原材料 (顶点缓冲区)
  //    4个顶点，每个顶点有6个数字 (x, y, z, r, g, b)
  //    数据是紧密排列在一个数组里的
  // NDC是左手系 X: [-1, 1] (左 -> 右) Y: [-1, 1] (下 -> 上) Z: [0, 1] (近 -> 远)
  // 其他坐标都是右手系，z朝自己为正
  // 三棱锥，顶点在y轴上，底面在y=-0.204上，戳向z+方向
  // prettier-ignore
  const vertices = new Float32Array([
    //  X,      Y,       Z,        R,   G,   B
     0.0,    0.612,    0.0,       1.0, 0.0, 0.0, // 顶
    -0.5,   -0.204,   -0.288,     0.0, 1.0, 0.0, // 底左
     0.5,   -0.204,   -0.288,     0.0, 0.0, 1.0, // 底右
     0.0,   -0.204,    0.577,     1.0, 1.0, 1.0, // 底前
  ]);

  // 创建一个缓冲区对象
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // 缓冲区大小
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, // 用途：作为顶点数据
    mappedAtCreation: true, // 创建后就映射，方便我们写入数据
  });

  // 将我们的顶点数据写入缓冲区
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  // 创建索引缓冲区 (Index Buffer)
  //    定义了4个三角形面，总共12个索引
  // prettier-ignore
  const indexData = new Uint16Array([
    // 混和插值模式下每一行的顺序无所谓，flat插值模式下第一个值很关键
    0, 1, 2, // 底面
    1, 2, 3, // 侧面1
    2, 3, 0, // 侧面2
    3, 0, 1, // 侧面3
  ]);
  const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    // 用途是 INDEX
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(indexData);
  indexBuffer.unmap();

  // 2. 创建 Uniform 缓冲区来存放 MVP 矩阵
  const uniformBuffer = device.createBuffer({
    size: 4 * 4 * 4, // 4x4 矩阵, 每个元素是 f32 (4字节)
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. 创建渲染管线 (搭建流水线)
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    // 顶点着色器配置
    vertex: {
      module: device.createShaderModule({ code: pyramidShaderCode }),
      entryPoint: "vs_main",
      buffers: [
        {
          // 每个顶点现在有12个f32 (x,y,z,r,g,b) = 24字节
          arrayStride: 6 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
            { shaderLocation: 1, offset: 3 * 4, format: "float32x3" }, // color
          ],
        },
      ],
    },
    // 片元着色器配置
    fragment: {
      module: device.createShaderModule({ code: pyramidShaderCode }),
      entryPoint: "fs_main",
      targets: [{ format }], // 输出的颜色格式要和画布一致
    },
    // 图元类型
    primitive: {
      topology: "triangle-list", // 我们画的是一个个三角形
    },
    // 开启深度测试
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus", // 深度缓冲的格式
    },
  });

  // 6. 创建绑定组，将 uniformBuffer 连接到着色器
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0), // 从管线自动推断布局
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // 7. 设置 MVP 矩阵
  const mvpMatrix = mat4.create();
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();

  // 透视，最近0.1最远100.0
  mat4.perspective(
    projectionMatrix,
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    100.0
  );
  console.log("projectionMatrix", formatMat4(projectionMatrix));

  // 从屏幕外z=5(0,0,5)看向屏幕(0,0,0)，头顶朝上(0,1,0)
  mat4.lookAt(
    viewMatrix,
    vec3.fromValues(0, 0, 5),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0)
  );
  console.log("viewMatrix", formatMat4(viewMatrix));

  // 创建一个深度纹理
  // 它的尺寸必须和画布完全一样
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 【新增】鼠标控制的状态变量 ---
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // 用一个 vec2 来存储总的旋转角度
  // rotation[0] 存储绕 Y 轴的旋转 (左右拖动)
  // rotation[1] 存储绕 X 轴的旋转 (上下拖动)
  const rotation = vec2.fromValues(0, 0);
  // --- 【新增】添加鼠标事件监听器 ---
  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener("pointerup", (e) => {
    isDragging = false;
  });

  // 在 window 上监听 move 和 up 事件，可以防止鼠标移出 canvas 后失去响应
  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    // 根据鼠标移动更新旋转角度
    // 乘以一个灵敏度系数来控制旋转速度
    const sensitivity = 0.01;
    rotation[0] += deltaX * sensitivity; // 绕 Y 轴
    rotation[1] += deltaY * sensitivity; // 绕 X 轴

    // 【可选】限制上下旋转的角度，防止“万向节死锁”或倒转
    const maxPitch = Math.PI / 2 - 0.01; // 接近90度
    const minPitch = -Math.PI / 2 + 0.01; // 接近-90度
    rotation[1] = Math.max(minPitch, Math.min(maxPitch, rotation[1]));

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  // 4. 渲染循环 (下达生产命令)
  let renderCount = 0;
  function frame() {
    renderCount++;
    // // 更新旋转
    // const now = Date.now() / 1000;
    // // 模型矩阵随时间绕着y轴旋转
    // mat4.fromYRotation(modelMatrix, now);

    // --- 【修改】根据鼠标输入的旋转角度来构建模型矩阵 ---
    // 1. 先重置 modelMatrix 为单位矩阵
    mat4.identity(modelMatrix);
    // 2. 依次应用旋转
    //    先绕 Y 轴旋转 (左右)
    mat4.rotateY(modelMatrix, modelMatrix, rotation[0]);
    //    再绕 X 轴旋转 (上下)
    mat4.rotateX(modelMatrix, modelMatrix, rotation[1]);

    if (renderCount % 60 === 0) {
      console.log("modelMatrix", formatMat4(modelMatrix));
    }

    // 计算最终的 MVP 矩阵: mvp = p * v * m
    // mvpMatrix = viewMatrix * modelMatrix
    mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    // mvpMatrix = projectionMatrix * mvpMatrix
    mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    // 创建一个指令编码器
    const commandEncoder = device.createCommandEncoder();
    // 开始一个渲染通道 (可以理解为开始一轮绘制)
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(), // 画到哪里？画到当前画布纹理上
          loadOp: "clear", // 绘制前做什么？清空画布
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 }, // 用什么颜色清空
          storeOp: "store", // 绘制后做什么？保存结果
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthLoadOp: "clear",
        depthClearValue: 1.0, // 深度缓冲区的清空值
        depthStoreOp: "store",
      },
    });

    // 为这次绘制设置我们的流水线
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    // 将我们的顶点缓冲区设置到0号槽位
    passEncoder.setVertexBuffer(0, vertexBuffer);
    // 绑定索引缓冲区
    passEncoder.setIndexBuffer(indexBuffer, "uint16");

    // 使用带索引的绘制指令
    //    我们不再告诉GPU画多少个顶点，而是画多少个“索引”
    passEncoder.drawIndexed(indexData.length, 1, 0, 0, 0);
    // 结束这轮绘制
    passEncoder.end();

    // 提交我们录制好的所有指令，让GPU去执行
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);

/**
 * 将 gl-matrix 的 mat4 (Float32Array) 格式化为可读的 4x4 矩阵字符串。
 * @param m 要打印的 mat4 矩阵。
 * @param precision 小数点后的精度，默认为4位。
 * @returns 格式化后的字符串。
 */
function formatMat4(m: mat4, precision = 4): string {
  let s = "mat4(\n";
  for (let i = 0; i < 4; i++) {
    s += "  ";
    for (let j = 0; j < 4; j++) {
      // 注意：gl-matrix 是列主序存储，但为了方便阅读，
      // 我们通常按行打印。这里的索引 m[i*4 + j] 是按行读取。
      // 如果你想按列读取以匹配 GLSL 的构造函数，应该是 m[j*4 + i]。
      // 我们这里按行打印，更符合视觉直觉。
      const index = j * 4 + i; // 按列读取和打印
      s += m[index].toFixed(precision).padStart(precision + 4, " ");
      if (j < 3) {
        s += ", ";
      }
    }
    s += "\n";
  }
  s += ")";
  return s;
}
