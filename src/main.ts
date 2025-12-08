import { mat4, vec3 } from "gl-matrix";
import GUI from "lil-gui";
import { OrbitCamera } from "./camera";
import shaderCode from "./shader.wgsl?raw";
import orbitShaderCode from "./orbit.wgsl?raw";

// --- 0. 配置数据 ---
interface PlanetData {
  name: string;
  radius: number; // 相对半径
  distance: number; // 相对距离
  speed: number; // 公转速度
  color: [number, number, number];
  texIndex: number; // 纹理数组中的层级索引
  initialAngle: number; // 初始角度 (CPU/GPU同步用)
}

const SOLAR_SYSTEM: PlanetData[] = [
  {
    name: "Sun",
    radius: 3.0,
    distance: 0,
    speed: 0,
    color: [1, 1, 0.8],
    texIndex: 0,
    initialAngle: 0,
  },
  {
    name: "Mercury",
    radius: 0.38,
    distance: 6.0,
    speed: 4.1,
    color: [1, 1, 1],
    texIndex: 1,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Venus",
    radius: 0.95,
    distance: 10.0,
    speed: 1.6,
    color: [1, 1, 1],
    texIndex: 2,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Earth",
    radius: 1.0,
    distance: 15.0,
    speed: 1.0,
    color: [1, 1, 1],
    texIndex: 3,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Mars",
    radius: 0.53,
    distance: 20.0,
    speed: 0.53,
    color: [1, 1, 1],
    texIndex: 4,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Jupiter",
    radius: 2.2,
    distance: 28.0,
    speed: 0.3,
    color: [1, 1, 1],
    texIndex: 5,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Saturn",
    radius: 2.0,
    distance: 36.0,
    speed: 0.2,
    color: [1, 1, 1],
    texIndex: 6,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Uranus",
    radius: 1.5,
    distance: 44.0,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 7,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Neptune",
    radius: 1.4,
    distance: 52.0,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 8,
    initialAngle: Math.random() * 6,
  },
];

const TEXTURE_URLS = SOLAR_SYSTEM.map((p) => `${p.name}.jpg`);

// --- 1. 辅助函数 ---

// 生成球体 (UV 修正版)
function createSphere(
  radius: number,
  widthSegments: number = 64,
  heightSegments: number = 32
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

      // Position
      vertices.push(
        radius * cosLon * cosLat,
        radius * sinLat,
        radius * sinLon * cosLat
      );
      // Normal
      vertices.push(cosLon * cosLat, sinLat, sinLon * cosLat);

      // UV 修正:
      // u: 使用 1-u 以修正纹理的左右镜像问题
      // v: 使用 1-v 修正 WebGPU/Vulkan 坐标系的上下翻转
      vertices.push(1 - u, 1 - v); // <--- 修改了这里
    }
  }

  const stride = widthSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const i0 = y * stride + x;
      const i1 = i0 + 1;
      const i2 = (y + 1) * stride + x;
      const i3 = i2 + 1;
      // indices.push(i0, i1, i2);
      // indices.push(i2, i1, i3);
      indices.push(i0, i2, i1);
      indices.push(i2, i3, i1);
    }
  }

  return {
    vertexData: new Float32Array(vertices),
    indexData: new Uint16Array(indices),
    indexCount: indices.length,
  };
}

// 加载纹理 (2K 分辨率)
async function loadTextureBitmap(url: string): Promise<ImageBitmap> {
  const width = 2048;
  const height = 1024;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    return createImageBitmap(canvas);
  } catch (e) {
    // 失败时的占位图
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.font = "bold 100px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(url.replace(".jpg", ""), width / 2, height / 2);
    return createImageBitmap(canvas);
  }
}

// 生成虚线圆环 (用于轨道)
function createDashedCircle(segments: number = 256, gapRatio: number = 0.5) {
  const vertices: number[] = [];
  const step = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const angle1 = i * step;
    const angle2 = angle1 + step * gapRatio;
    vertices.push(Math.cos(angle1), 0, Math.sin(angle1));
    vertices.push(Math.cos(angle2), 0, Math.sin(angle2));
  }

  return new Float32Array(vertices);
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

  // 初始化相机
  const camera = new OrbitCamera(canvas, 80);

  // 初始化 GUI
  const state = {
    pauseOrbit: false,
    pauseRotation: false,
    focusTarget: "Sun",
    timeScale: 1.0,
  };
  const gui = new GUI({ title: "Solar Control" });
  gui.add(state, "pauseOrbit").name("Pause Orbit");
  gui.add(state, "pauseRotation").name("Pause Rotate");
  gui.add(state, "timeScale", 0, 5).name("Time Speed");
  gui
    .add(
      state,
      "focusTarget",
      SOLAR_SYSTEM.map((p) => p.name)
    )
    .name("Focus On")
    .onChange((name: string) => {
      if (name === "Sun") camera.reset();
    });

  // --- 资源加载 ---
  const bitmaps = await Promise.all(
    TEXTURE_URLS.map((url) => loadTextureBitmap(url))
  );
  const texture = device.createTexture({
    size: [2048, 1024, TEXTURE_URLS.length],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  bitmaps.forEach((bitmap, i) => {
    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: texture, origin: [0, 0, i] },
      [2048, 1024]
    );
  });
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "repeat",
    addressModeV: "clamp-to-edge",
  });

  // 球体 Buffer
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

  // 实例 Buffer
  const instanceData = new Float32Array(SOLAR_SYSTEM.length * 8);
  SOLAR_SYSTEM.forEach((planet, i) => {
    const base = i * 8;
    instanceData[base + 0] = planet.radius;
    instanceData[base + 1] = planet.distance;
    instanceData[base + 2] = planet.speed;
    instanceData[base + 3] = planet.texIndex;
    instanceData[base + 4] = planet.color[0];
    instanceData[base + 5] = planet.color[1];
    instanceData[base + 6] = planet.color[2];
    instanceData[base + 7] = planet.initialAngle;
  });
  const instanceBuffer = device.createBuffer({
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(instanceBuffer.getMappedRange()).set(instanceData);
  instanceBuffer.unmap();

  // 轨道 Buffer
  const orbitData = createDashedCircle(256, 0.6);
  const orbitVertexBuffer = device.createBuffer({
    size: orbitData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(orbitVertexBuffer.getMappedRange()).set(orbitData);
  orbitVertexBuffer.unmap();

  // Uniform Buffer (mat4 + orbitTime + rotationTime + padding)
  const uniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // --- Pipelines ---

  // 1. 行星 Pipeline
  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [
        // Mesh: pos(3)+norm(3)+uv(2)
        {
          arrayStride: 32,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x3" },
            { shaderLocation: 2, offset: 24, format: "float32x2" },
          ],
        },
        // Instance: radius(1)+dist(1)+speed(1)+tex(1)+color(3)+angle(1)
        {
          arrayStride: 32,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 3, offset: 0, format: "float32" },
            { shaderLocation: 4, offset: 4, format: "float32" },
            { shaderLocation: 5, offset: 8, format: "float32" },
            { shaderLocation: 6, offset: 12, format: "float32" },
            { shaderLocation: 7, offset: 16, format: "float32x3" },
            { shaderLocation: 8, offset: 28, format: "float32" },
          ],
        },
      ],
    },
    fragment: { module, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: texture.createView() },
    ],
  });

  // 2. 轨道 Pipeline
  const orbitModule = device.createShaderModule({ code: orbitShaderCode });
  const orbitPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: orbitModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        }, // pos only
        {
          arrayStride: 32,
          stepMode: "instance",
          attributes: [{ shaderLocation: 1, offset: 4, format: "float32" }],
        }, // read distance only
      ],
    },
    fragment: {
      module: orbitModule,
      entryPoint: "fs_main",
      targets: [
        {
          format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: { topology: "line-list" },
    depthStencil: {
      depthWriteEnabled: false,
      depthCompare: "less",
      format: "depth24plus",
    },
  });
  const orbitBindGroup = device.createBindGroup({
    layout: orbitPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 渲染循环 ---
  const projectionMatrix = mat4.create();
  const mvpMatrix = mat4.create();

  let orbitTime = 0;
  let rotationTime = 0;

  function frame() {
    const dt = 0.01 * state.timeScale;
    if (!state.pauseOrbit) orbitTime += dt;
    if (!state.pauseRotation) rotationTime += dt;

    // CPU 计算聚焦目标的位置
    if (state.focusTarget !== "Sun") {
      const targetPlanet = SOLAR_SYSTEM.find(
        (p) => p.name === state.focusTarget
      );
      if (targetPlanet) {
        const angle =
          -1.0 *
          (targetPlanet.initialAngle + orbitTime * targetPlanet.speed * 0.1);
        const x = Math.cos(angle) * targetPlanet.distance;
        const z = Math.sin(angle) * targetPlanet.distance;
        vec3.set(camera.target, x, 0, z);
        camera.updateMatrix();
      }
    }

    const aspect = canvas.width / canvas.height;
    mat4.perspectiveZO(
      projectionMatrix,
      (2 * Math.PI) / 5,
      aspect,
      0.1,
      1000.0
    ); // <--- 修改了这里

    mat4.multiply(mvpMatrix, projectionMatrix, camera.viewMatrix);

    // Uniform 更新
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([orbitTime]));
    device.queue.writeBuffer(
      uniformBuffer,
      68,
      new Float32Array([rotationTime])
    );

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          // 透明背景，以便显示 CSS 星空
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

    // 绘制行星
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);
    passEncoder.setIndexBuffer(indexBuffer, "uint16");
    passEncoder.drawIndexed(sphere.indexCount, SOLAR_SYSTEM.length);

    // === 新增：绘制轨道 ===
    passEncoder.setPipeline(orbitPipeline);
    // 复用之前的 BindGroup (因为 Uniform 布局在两个 Shader 里是兼容的)
    // 但为了严谨，最好让 orbitPipeline 也有自己的 BindGroup。
    // 不过由于我们的 layout: 'auto' 且 group(0) binding(0) 定义完全一样，
    // 这里直接复用 bindGroup 通常是可以的。
    // 如果报错，需要为 orbitPipeline 专门 createBindGroup。
    passEncoder.setBindGroup(0, orbitBindGroup);

    // 绑定轨道的顶点
    passEncoder.setVertexBuffer(0, orbitVertexBuffer);
    // 绑定实例数据 (复用同一个 instanceBuffer)
    passEncoder.setVertexBuffer(1, instanceBuffer);

    // 绘制: (顶点数, 实例数)
    // 顶点数 = orbitData.length / 3
    passEncoder.draw(orbitData.length / 3, SOLAR_SYSTEM.length);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);
