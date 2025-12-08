import { mat4 } from "gl-matrix";
import shaderCode from "./shader.wgsl?raw";

// --- 0. 行星数据定义 ---
interface PlanetData {
  radius: number; // 相对半径
  distance: number; // 相对距离
  speed: number; // 公转速度
  color: [number, number, number];
}

const SOLAR_SYSTEM: PlanetData[] = [
  { radius: 3.0, distance: 0, speed: 0, color: [1.0, 0.8, 0.2] }, // Sun (为了演示，半径缩小了，否则太大)
  { radius: 0.38, distance: 4.0, speed: 4.1, color: [0.7, 0.7, 0.7] }, // Mercury
  { radius: 0.95, distance: 7.2, speed: 1.6, color: [0.9, 0.8, 0.2] }, // Venus
  { radius: 1.0, distance: 10.0, speed: 1.0, color: [0.0, 0.5, 1.0] }, // Earth
  { radius: 0.53, distance: 15.2, speed: 0.53, color: [1.0, 0.2, 0.0] }, // Mars
  { radius: 2.0, distance: 25.0, speed: 0.3, color: [0.8, 0.7, 0.6] }, // Jupiter (为了演示，距离拉近了)
  { radius: 1.8, distance: 35.0, speed: 0.2, color: [0.9, 0.8, 0.5] }, // Saturn
  { radius: 1.2, distance: 45.0, speed: 0.1, color: [0.5, 0.8, 0.9] }, // Uranus
  { radius: 1.2, distance: 55.0, speed: 0.1, color: [0.2, 0.3, 0.8] }, // Neptune
];

// --- 1. 几何体生成辅助函数 ---
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

      const px = radius * cosLon * cosLat;
      const py = radius * sinLat;
      const pz = radius * sinLon * cosLat;

      // Position (x, y, z)
      vertices.push(px, py, pz);
      // Normal (nx, ny, nz) - 对于球体，法线就是归一化的位置
      // 因为 radius 为 1 时，position 就是 normal
      vertices.push(cosLon * cosLat, sinLat, sinLon * cosLat);
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

  // 3. 创建资源
  // 3.1 网格 (Mesh) Buffer
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

  // 3.2 实例 (Instance) Buffer
  // 每个实例数据结构: radius(1) + distance(1) + speed(1) + color(3) + angle(1) + padding(1) = 8 floats = 32 bytes
  const instanceData = new Float32Array(SOLAR_SYSTEM.length * 8);
  SOLAR_SYSTEM.forEach((planet, i) => {
    const base = i * 8;
    instanceData[base + 0] = planet.radius;
    instanceData[base + 1] = planet.distance;
    instanceData[base + 2] = planet.speed;
    instanceData[base + 3] = planet.color[0];
    instanceData[base + 4] = planet.color[1];
    instanceData[base + 5] = planet.color[2];
    instanceData[base + 6] = Math.random() * Math.PI * 2; // 随机初始角度
    instanceData[base + 7] = 0; // Padding
  });

  const instanceBuffer = device.createBuffer({
    size: instanceData.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });
  new Float32Array(instanceBuffer.getMappedRange()).set(instanceData);
  instanceBuffer.unmap();

  // 3.3 Uniform Buffer
  // mat4 (64 bytes) + time (4 bytes) + padding (12 bytes) = 80 bytes -> 必须对齐到 16 bytes 的倍数
  const uniformBufferSize = 80;
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // 4. 管线配置
  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs_main", // 对应 shader.wgsl 中的函数名
      buffers: [
        // Buffer 0: Mesh (Position + Normal)
        {
          arrayStride: 6 * 4, // 24 bytes
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
            { shaderLocation: 1, offset: 12, format: "float32x3" }, // normal
          ],
        },
        // Buffer 1: Instance Data
        {
          arrayStride: 8 * 4, // 32 bytes
          stepMode: "instance", // 关键：每个实例读取一次
          attributes: [
            { shaderLocation: 2, offset: 0, format: "float32" }, // radius
            { shaderLocation: 3, offset: 4, format: "float32" }, // distance
            { shaderLocation: 4, offset: 8, format: "float32" }, // speed
            { shaderLocation: 5, offset: 12, format: "float32x3" }, // color
            { shaderLocation: 6, offset: 24, format: "float32" }, // angle
          ],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: "fs_main", // 对应 shader.wgsl 中的函数名
      targets: [{ format }],
    },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: "less",
      format: "depth24plus",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });

  // 深度纹理
  const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // 5. 渲染循环
  const projectionMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  let time = 0;

  function frame() {
    time += 0.02;

    const aspect = canvas.width / canvas.height;
    // 调整相机位置，确保能看到整个系统
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 1000.0);
    mat4.lookAt(viewMatrix, [0, 60, 80], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(mvpMatrix, projectionMatrix, viewMatrix);

    // 更新 Uniform
    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([time]));

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0.05, a: 1 }, // 深空黑背景
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
    passEncoder.setVertexBuffer(1, instanceBuffer); // 绑定实例数据
    passEncoder.setIndexBuffer(indexBuffer, "uint16");

    // drawIndexed(indexCount, instanceCount)
    passEncoder.drawIndexed(sphere.indexCount, SOLAR_SYSTEM.length);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);
