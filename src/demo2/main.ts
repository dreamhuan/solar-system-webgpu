// src/demo/main.ts

// 1. 导入我们的着色器代码
import pyramidShaderCode from "./pyramid.wgsl?raw";
import { mat4, vec3 } from "gl-matrix";

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
  // prettier-ignore
  const vertices = new Float32Array([
    //  X,    Y,       Z,    R,   G,   B
    -0.5,  -0.5,  -0.408,  1.0, 0.0, 0.0,
     0.5,  -0.5,  -0.408,  0.0, 1.0, 0.0,
       0, 0.366,  -0.408,  0.0, 0.0, 1.0,
     0.0,   0.0,   0.408,  1.0, 1.0, 1.0,
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

  mat4.perspective(
    projectionMatrix,
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    100.0
  );

  mat4.lookAt(
    viewMatrix,
    vec3.fromValues(0, 0, 5),
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0)
  );

  // 创建一个深度纹理
  // 它的尺寸必须和画布完全一样
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
  // 4. 渲染循环 (下达生产命令)
  function frame() {
    // 更新旋转
    const now = Date.now() / 1000;
    mat4.fromYRotation(modelMatrix, now);

    // 计算最终的 MVP 矩阵
    mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
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
