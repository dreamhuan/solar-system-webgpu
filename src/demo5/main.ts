// src/demo/main.ts

// 1. 导入我们的着色器代码
import pyramidShaderCode from "./pyramid.wgsl?raw";
import { mat4, quat, vec3 } from "gl-matrix";

// 辅助函数：加载纹理
async function loadTexture(device: GPUDevice, url: string): Promise<GPUTexture> {
  const response = await fetch(url);
  const imageBitmap = await createImageBitmap(await response.blob());

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]
  );
  return texture;
}

async function init() {
  const canvas = document.querySelector<HTMLCanvasElement>("#app")!;
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";

  if (!navigator.gpu) throw new Error("WebGPU not supported");

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No appropriate GPUAdapter found.");

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({ device, format, alphaMode: "premultiplied" });

  // 1. 加载颜色和法线纹理
  const colorTexture = await loadTexture(device, "brick.jpg");
  const normalTexture = await loadTexture(device, "brick_normal.jpg");

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  // 2. 更新顶点数据，添加切线 (Tangent)
  //    一个顶点有 11 个 f32: Pos(3), Normal(3), UV(2), Tangent(3)
  // prettier-ignore
  const vertexData = new Float32Array([
    //  X,    Y,     Z,      Nx, Ny, Nz,      U,   V,   Tx,   Ty,   Tz
    // --- 侧面1 ---
     0.0,  0.612,   0.0,    0.0, 0.447, -0.894,   0.5, 1.0,  1.0, 0.0, 0.0,
    -0.5, -0.204,  -0.288,  0.0, 0.447, -0.894,   0.0, 0.0,  1.0, 0.0, 0.0,
     0.5, -0.204,  -0.288,  0.0, 0.447, -0.894,   1.0, 0.0,  1.0, 0.0, 0.0,

    // --- 侧面2 ---
     0.0,  0.612,   0.0,    0.774, 0.447, 0.447,   0.5, 1.0, -0.5, 0.0, 0.866,
     0.5, -0.204,  -0.288,  0.774, 0.447, 0.447,   0.0, 0.0, -0.5, 0.0, 0.866,
     0.0, -0.204,   0.577,  0.774, 0.447, 0.447,   1.0, 0.0, -0.5, 0.0, 0.866,

    // --- 侧面3 ---
     0.0,  0.612,   0.0,   -0.774, 0.447, 0.447,   0.5, 1.0, -0.5, 0.0, -0.866,
     0.0, -0.204,   0.577,  -0.774, 0.447, 0.447,   0.0, 0.0, -0.5, 0.0, -0.866,
    -0.5, -0.204,  -0.288,  -0.774, 0.447, 0.447,   1.0, 0.0, -0.5, 0.0, -0.866,
      
    // --- 底面 ---
    -0.5, -0.204,  -0.288,  0.0, -1.0, 0.0,     0.0, 0.0,  1.0, 0.0, 0.0,
     0.0, -0.204,   0.577,  0.0, -1.0, 0.0,     0.5, 1.0,  1.0, 0.0, 0.0,
     0.5, -0.204,  -0.288,  0.0, -1.0, 0.0,     1.0, 0.0,  1.0, 0.0, 0.0,
  ]);

  const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
  vertexBuffer.unmap();

  // 2. 创建 Uniform 缓冲区
  // 【修改】让 uniformBuffer 更大，以容纳 MVP, Model, 和 CameraPos
  // MVP(64) + Model(64) + CameraPos(16, 需要内存对齐) = 144 bytes
  // 我们直接分配 192 字节，更符合内存对齐规范 (256的倍数)
  // 实际上 144 也可以，但更大的对齐值更安全
  const uniformBuffer = device.createBuffer({
    size: 192,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 3. 更新管线
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: pyramidShaderCode }),
      entryPoint: "vs_main",
      buffers: [{
        arrayStride: 11 * 4,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
          { shaderLocation: 1, offset: 3 * 4, format: "float32x3" }, // normal
          { shaderLocation: 2, offset: 6 * 4, format: "float32x2" }, // uv
          { shaderLocation: 3, offset: 8 * 4, format: "float32x3" }, // tangent
        ],
      }],
    },
    fragment: {
      module: device.createShaderModule({ code: pyramidShaderCode }),
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // 4. 更新绑定组
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: colorTexture.createView() },
      { binding: 3, resource: normalTexture.createView() },
    ],
  });

  const mvpMatrix = mat4.create();
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  
  mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
  
  const cameraPosition = vec3.fromValues(0, 0, 4);
  mat4.lookAt(viewMatrix, cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
  
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const rotationQuat = quat.create();
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener("pointerup", (e) => {
    isDragging = false;
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;

    const sensitivity = 0.01;

    // a. 创建一个代表“左右”旋转的增量四元数
    //    左右拖动 -> 绕着世界的垂直轴 (Y轴) 旋转
    const yawDelta = quat.create();
    quat.setAxisAngle(
      yawDelta,
      vec3.fromValues(0, 1, 0),
      -deltaX * sensitivity
    );

    // b. 创建一个代表“上下”旋转的增量四元数
    //    上下拖动 -> 绕着世界的水平轴 (X轴) 旋转
    const pitchDelta = quat.create();
    quat.setAxisAngle(
      pitchDelta,
      vec3.fromValues(1, 0, 0),
      -deltaY * sensitivity
    );

    // c. 组合增量旋转
    //    注意顺序：先应用左右，再应用上下
    const totalDelta = quat.create();
    quat.multiply(totalDelta, yawDelta, pitchDelta);

    // d. 将增量旋转应用到主旋转四元数上
    //    公式: new_orientation = delta_rotation * old_orientation
    quat.multiply(rotationQuat, totalDelta, rotationQuat);
    // 归一化四元数，防止浮点数误差累积
    quat.normalize(rotationQuat, rotationQuat);

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

    // --- 从四元数生成模型矩阵 ---
    mat4.fromQuat(modelMatrix, rotationQuat);

    if (renderCount % 60 === 0) {
      console.log("modelMatrix", formatMat4(modelMatrix));
    }

    // 计算最终的 MVP 矩阵: mvp = p * v * m
    // mvpMatrix = viewMatrix * modelMatrix
    mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    // mvpMatrix = projectionMatrix * mvpMatrix
    mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    // 将三个数据都写入 uniformBuffer
    // MVP 矩阵, at offset 0
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    // Model 矩阵, at offset 64
    device.queue.writeBuffer(uniformBuffer, 64, modelMatrix as any);
    // 摄像机位置, at offset 128
    device.queue.writeBuffer(uniformBuffer, 128, cameraPosition as any);

    // 创建一个指令编码器
    const commandEncoder = device.createCommandEncoder();
    // 开始一个渲染通道 (可以理解为开始一轮绘制)
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(), // 画到哪里？画到当前画布纹理上
          loadOp: "clear", // 绘制前做什么？清空画布
          clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 }, // 用什么颜色清空
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

    // 使用 draw，画12个顶点
    passEncoder.draw(12, 1, 0, 0);
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
