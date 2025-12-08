import { mat4 } from "gl-matrix";
import shaderCode from "./shader.wgsl?raw";

// --- 0. 配置数据 ---
interface PlanetData {
  name: string;
  radius: number; // 相对半径
  distance: number; // 相对距离
  speed: number; // 公转速度
  color: [number, number, number]; // 混合颜色 (通常为白色 [1,1,1])
  texIndex: number; // 纹理数组中的层级索引
}

const SOLAR_SYSTEM: PlanetData[] = [
  {
    name: "Sun",
    radius: 3.0,
    distance: 0,
    speed: 0,
    color: [1, 1, 0.8],
    texIndex: 0,
  },
  {
    name: "Mercury",
    radius: 0.38,
    distance: 5.0,
    speed: 4.1,
    color: [1, 1, 1],
    texIndex: 1,
  },
  {
    name: "Venus",
    radius: 0.95,
    distance: 8.0,
    speed: 1.6,
    color: [1, 1, 1],
    texIndex: 2,
  },
  {
    name: "Earth",
    radius: 1.0,
    distance: 12.0,
    speed: 1.0,
    color: [1, 1, 1],
    texIndex: 3,
  },
  {
    name: "Mars",
    radius: 0.53,
    distance: 16.0,
    speed: 0.53,
    color: [1, 1, 1],
    texIndex: 4,
  },
  {
    name: "Jupiter",
    radius: 2.2,
    distance: 22.0,
    speed: 0.3,
    color: [1, 1, 1],
    texIndex: 5,
  },
  {
    name: "Saturn",
    radius: 2.0,
    distance: 28.0,
    speed: 0.2,
    color: [1, 1, 1],
    texIndex: 6,
  },
  {
    name: "Uranus",
    radius: 1.5,
    distance: 34.0,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 7,
  },
  {
    name: "Neptune",
    radius: 1.4,
    distance: 40.0,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 8,
  },
];

// 虚拟图片路径 (你可以稍后替换为真实的 .jpg URL)
const TEXTURE_URLS = SOLAR_SYSTEM.map((p) => `${p.name}.jpg`);

// --- 1. 辅助函数 ---

// 生成带 UV 的球体
function createSphere(
  radius: number,
  widthSegments: number = 32,
  heightSegments: number = 16
) {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const latitude = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(latitude);
    const sinLat = Math.sin(latitude);

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const longitude = u * 2 * Math.PI;
      const cosLon = Math.cos(longitude);
      const sinLon = Math.sin(longitude);

      // 1. Position (x, y, z)
      vertices.push(
        radius * cosLon * cosLat,
        radius * sinLat,
        radius * sinLon * cosLat
      );
      // 2. Normal (nx, ny, nz)
      vertices.push(cosLon * cosLat, sinLat, sinLon * cosLat);
      // 3. UV (u, v) - WebGPU 纹理坐标原点在左上角，可能需要翻转 V，这里先保持标准
      vertices.push(1 - u, v);
    }
  }

  const stride = widthSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const i0 = y * stride + x;
      const i1 = i0 + 1;
      const i2 = (y + 1) * stride + x;
      const i3 = i2 + 1;
      indices.push(i0, i1, i2);
      indices.push(i2, i1, i3);
    }
  }

  return {
    vertexData: new Float32Array(vertices),
    indexData: new Uint16Array(indices),
    indexCount: indices.length,
  };
}

// 加载图片或生成占位图
async function loadTextureBitmap(url: string): Promise<ImageBitmap> {
  const width = 2048;
  const height = 1024;

  try {
    // 尝试加载真实图片
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    // 调整大小
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    return createImageBitmap(canvas);
  } catch (e) {
    // 失败（或无图片）时，生成带文字的纹理
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // 生成随机底色
    const hue = Math.random() * 360;
    ctx.fillStyle = `hsl(${hue}, 50%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    // 画网格线
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= width; i += 128) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
    }
    for (let i = 0; i <= height; i += 128) {
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
    }
    ctx.stroke();

    // 写名字
    ctx.fillStyle = "white";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(url.replace(".jpg", ""), width / 2, height / 2);

    return createImageBitmap(canvas);
  }
}

// --- 2. 主程序 ---
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

  // --- 资源创建 ---

  // 1. 加载所有纹理
  const bitmaps = await Promise.all(
    TEXTURE_URLS.map((url) => loadTextureBitmap(url))
  );

  // 2. 创建纹理数组
  const texture = device.createTexture({
    size: [2048, 1024, TEXTURE_URLS.length],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 3. 将图片上传到纹理数组的层中
  bitmaps.forEach((bitmap, i) => {
    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: texture, origin: [0, 0, i] },
      [2048, 1024]
    );
  });

  // 4. 创建采样器
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "repeat",
    addressModeV: "clamp-to-edge",
  });

  // 5. 网格 Buffer
  const sphere = createSphere(1.0);
  const vertexBuffer = device.createBuffer({
    size: sphere.vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(sphere.vertexData);
  vertexBuffer.unmap();

  const indexBuffer = device.createBuffer({
    size: sphere.indexData.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(sphere.indexData);
  indexBuffer.unmap();

  // 6. 实例 Buffer
  // 结构: rad(1) + dist(1) + speed(1) + texIndex(1) + color(3) + angle(1) = 8 floats
  const instanceData = new Float32Array(SOLAR_SYSTEM.length * 8);
  SOLAR_SYSTEM.forEach((planet, i) => {
    const base = i * 8;
    instanceData[base + 0] = planet.radius;
    instanceData[base + 1] = planet.distance;
    instanceData[base + 2] = planet.speed;
    instanceData[base + 3] = planet.texIndex; // 纹理层索引
    instanceData[base + 4] = planet.color[0];
    instanceData[base + 5] = planet.color[1];
    instanceData[base + 6] = planet.color[2];
    instanceData[base + 7] = Math.random() * Math.PI * 2;
  });

  const instanceBuffer = device.createBuffer({
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(instanceBuffer.getMappedRange()).set(instanceData);
  instanceBuffer.unmap();

  // 7. Uniform Buffer
  const uniformBufferSize = 80; // mat4(64) + time(4) + padding
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- 管线配置 ---
  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [
        // Buffer 0: Mesh (Stride = 32 bytes)
        {
          arrayStride: 8 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // pos
            { shaderLocation: 1, offset: 12, format: "float32x3" }, // norm
            { shaderLocation: 2, offset: 24, format: "float32x2" }, // uv <--- 新增
          ],
        },
        // Buffer 1: Instance (Stride = 32 bytes)
        {
          arrayStride: 8 * 4,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 3, offset: 0, format: "float32" }, // radius
            { shaderLocation: 4, offset: 4, format: "float32" }, // distance
            { shaderLocation: 5, offset: 8, format: "float32" }, // speed
            { shaderLocation: 6, offset: 12, format: "float32" }, // texIndex <--- 新增
            { shaderLocation: 7, offset: 16, format: "float32x3" }, // color
            { shaderLocation: 8, offset: 28, format: "float32" }, // angle
          ],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  // 创建 BindGroup
  // 必须与 Shader 中的 @binding 对应
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: texture.createView() }, // 默认视图即可访问所有层
    ],
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 渲染循环 ---
  const projectionMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  let time = 0;

  function frame() {
    time += 0.01;

    const aspect = canvas.width / canvas.height;
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 1000.0);
    // 稍微抬高相机，俯视太阳系
    mat4.lookAt(viewMatrix, [0, 40, 60], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);

    // 写入 Uniform (使用 as any 规避 gl-matrix 类型问题)
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([time]));

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);
    passEncoder.setIndexBuffer(indexBuffer, "uint16");
    passEncoder.drawIndexed(sphere.indexCount, SOLAR_SYSTEM.length);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);
