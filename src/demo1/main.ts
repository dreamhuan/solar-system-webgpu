// src/demo/main.ts

// 1. 导入我们的着色器代码
import triangleShaderCode from "./triangle.wgsl?raw";

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
  //    3个顶点，每个顶点有5个数字 (x, y, r, g, b)
  //    数据是紧密排列在一个数组里的
  const vertices = new Float32Array([
    //  X,   Y,   R,   G,   B
     0.0,  0.5, 1.0, 0.0, 0.0, // 顶点1 (红色) 
    -0.5, -0.5, 0.0, 1.0, 0.0, // 顶点2 (绿色) 
     0.5, -0.5, 0.0, 0.0, 1.0, // 顶点3 (蓝色) 
  ]);

  // 创建一个缓冲区对象
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength, // 缓冲区大小
    usage: GPUBufferUsage.VERTEX, // 用途：作为顶点数据
    mappedAtCreation: true, // 创建后就映射，方便我们写入数据
  });

  // 将我们的顶点数据写入缓冲区
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap(); // 解除映射，让GPU可以访问

  // 3. 创建渲染管线 (搭建流水线)
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    // 顶点着色器配置
    vertex: {
      module: device.createShaderModule({ code: triangleShaderCode }),
      entryPoint: "vs_main",
      // **关键连接**：描述顶点数据如何送入着色器
      buffers: [
        {
          arrayStride: 5 * 4, // 每个顶点占 5个f32 * 4字节/f32 = 20字节
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" }, // pos
            { shaderLocation: 1, offset: 2 * 4, format: "float32x3" }, // color
          ],
        },
      ],
    },
    // 片元着色器配置
    fragment: {
      module: device.createShaderModule({ code: triangleShaderCode }),
      entryPoint: "fs_main",
      targets: [{ format }], // 输出的颜色格式要和画布一致
    },
    // 图元类型
    primitive: {
      topology: "triangle-list", // 我们画的是一个个三角形
    },
  });

  // 4. 渲染循环 (下达生产命令)
  function frame() {
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
    });

    // 为这次绘制设置我们的流水线
    passEncoder.setPipeline(pipeline);
    // 将我们的顶点缓冲区设置到0号槽位
    passEncoder.setVertexBuffer(0, vertexBuffer);
    // 执行绘制！ 3个顶点，1个实例
    passEncoder.draw(3, 1, 0, 0);
    // 结束这轮绘制
    passEncoder.end();

    // 提交我们录制好的所有指令，让GPU去执行
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);
