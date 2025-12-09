import { mat4, vec3 } from "gl-matrix";
import GUI from "lil-gui";
import { OrbitCamera } from "./camera";
import shaderCode from "./shader.wgsl?raw";
import orbitShaderCode from "./orbit.wgsl?raw";
import { SOLAR_SYSTEM, TEXTURE_URLS, EARTH_BASE_RADIUS, AU_TO_EARTH_RADIUS } from "./constants";
import { createSphere, loadTextureBitmap, createDashedCircle } from "./utils";

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

  const camera = new OrbitCamera(canvas, 80);
  camera.maxDistance = 2000000.0; 

  const state = {
    pauseOrbit: false,
    pauseRotation: false,
    focusTarget: "Sun",
    timeScale: 1.0,
    trueScale: false, 
    valSizeScale: 1.0, 
    valDistScale: 1.0, 
    brightMode: false, 
    hideSun: false,
  };

  const bitmaps = await Promise.all(TEXTURE_URLS.map((url) => loadTextureBitmap(url)));
  const texture = device.createTexture({ size: [2048, 1024, TEXTURE_URLS.length], format: "rgba8unorm", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
  bitmaps.forEach((bitmap, i) => { device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: texture, origin: [0, 0, i] }, [2048, 1024]); });
  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "repeat", addressModeV: "clamp-to-edge" });

  // Sphere
  const sphere = createSphere(1.0);
  const vertexBuffer = device.createBuffer({ size: sphere.vertexData.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
  new Float32Array(vertexBuffer.getMappedRange()).set(sphere.vertexData);
  vertexBuffer.unmap();
  const indexBuffer = device.createBuffer({ size: sphere.indexData.byteLength, usage: GPUBufferUsage.INDEX, mappedAtCreation: true });
  new Uint16Array(indexBuffer.getMappedRange()).set(sphere.indexData);
  indexBuffer.unmap();

  // Orbit (Unit Circle)
  const orbitData = createDashedCircle(512, 0.6); // 增加段数让大圆更圆
  const orbitVertexBuffer = device.createBuffer({ size: orbitData.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
  new Float32Array(orbitVertexBuffer.getMappedRange()).set(orbitData);
  orbitVertexBuffer.unmap();

  // Instance Buffer
  const tempInstanceData = new Float32Array(SOLAR_SYSTEM.length * 8);
  const instanceBuffer = device.createBuffer({
    size: tempInstanceData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, 
    mappedAtCreation: false,
  });

  // Uniform Buffer
  // Size 96 bytes: MVP(64) + RotTime(4) + AmbStr(4) + Pad(4) + FocusPos(12)
  const uniformBuffer = device.createBuffer({ size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

  // --- Pipelines ---
  // Shared Instance Attributes Layout
  const instanceAttrs = [
    { shaderLocation: 3, offset: 0, format: "float32" as GPUVertexFormat },    // Radius
    { shaderLocation: 4, offset: 4, format: "float32" as GPUVertexFormat },    // OrbitRadius (Distance)
    { shaderLocation: 5, offset: 8, format: "float32" as GPUVertexFormat },    // RelX (to Sun)
    { shaderLocation: 6, offset: 12, format: "float32" as GPUVertexFormat },   // RelZ (to Sun)
    { shaderLocation: 7, offset: 16, format: "float32x3" as GPUVertexFormat }, // Color
    { shaderLocation: 8, offset: 28, format: "float32" as GPUVertexFormat },   // TexIndex
  ];

  const module = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [
        { arrayStride: 32, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }, { shaderLocation: 1, offset: 12, format: "float32x3" }, { shaderLocation: 2, offset: 24, format: "float32x2" }] },
        { arrayStride: 32, stepMode: "instance", attributes: instanceAttrs },
      ],
    },
    fragment: { module, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: { depthWriteEnabled: true, depthCompare: "less", format: "depth24plus" },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }, { binding: 1, resource: sampler }, { binding: 2, resource: texture.createView() }],
  });

  const orbitModule = device.createShaderModule({ code: orbitShaderCode });
  const orbitPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: orbitModule,
      entryPoint: "vs_main",
      buffers: [
        { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }, // pos
        { arrayStride: 32, stepMode: "instance", attributes: instanceAttrs }, // Use same instance buffer
      ],
    },
    fragment: { module: orbitModule, entryPoint: "fs_main", targets: [{ format, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" } } }] },
    primitive: { topology: "line-list" },
    depthStencil: { depthWriteEnabled: false, depthCompare: "less", format: "depth24plus" },
  });
  const orbitBindGroup = device.createBindGroup({ layout: orbitPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniformBuffer } }] });

  const depthTexture = device.createTexture({ size: [canvas.width, canvas.height], format: "depth24plus", usage: GPUTextureUsage.RENDER_ATTACHMENT });

  // --- GUI ---
  const gui = new GUI({ title: "Solar Control" });
  gui.add(state, "pauseOrbit").name("Pause Orbit");
  gui.add(state, "pauseRotation").name("Pause Rotate");
  gui.add(state, "timeScale", 0, 5).name("Time Speed");
  gui.add(state, "focusTarget", SOLAR_SYSTEM.map((p) => p.name)).name("Focus On").onChange((name: string) => { if (name === "Sun") camera.reset(); });

  const modeFolder = gui.addFolder("Simulation Mode");
  modeFolder.add(state, "trueScale").name("True Scale Mode");
  modeFolder.add(state, "hideSun").name("Hide Sun");
  modeFolder.add(state, "brightMode").name("Bright Mode");
  modeFolder.add(state, "valSizeScale", 0.0, 5.0, 0.1).name("Universal Size Scale");
  modeFolder.add(state, "valDistScale", 0.0, 2.0, 0.001).name("Universal Dist Scale");
  modeFolder.open();

  // --- Render Loop ---
  const projectionMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  let orbitTime = 0;
  let rotationTime = 0;
  
  // 存储相对于太阳的坐标 (用于计算 Focus)
  const sunRelPositions: {x: number, z: number}[] = new Array(SOLAR_SYSTEM.length).fill(null).map(() => ({x:0, z:0}));

  function frame() {
    const dt = 0.01 * state.timeScale;
    if (!state.pauseOrbit) orbitTime += dt;
    if (!state.pauseRotation) rotationTime += dt;

    // 1. CPU 计算相对于太阳的位置
    SOLAR_SYSTEM.forEach((planet, i) => {
      let distBase = state.trueScale ? (planet.realDistance * AU_TO_EARTH_RADIUS) : planet.artisticDistance;
      let currentDist = distBase * state.valDistScale;
      
      const angle = -1.0 * (planet.initialAngle + orbitTime * planet.speed * 0.1);
      sunRelPositions[i].x = Math.cos(angle) * currentDist;
      sunRelPositions[i].z = Math.sin(angle) * currentDist;
    });

    // 2. 确定 Focus Offset (绝对空间中 Focus 的位置)
    // 假设太阳在 (0,0), 那么 Focus 的绝对位置就是 sunRelPositions[targetIndex]
    let focusX = 0, focusZ = 0;
    if (state.focusTarget !== "Sun") {
      const idx = SOLAR_SYSTEM.findIndex(p => p.name === state.focusTarget);
      if (idx !== -1) {
        focusX = sunRelPositions[idx].x;
        focusZ = sunRelPositions[idx].z;
      }
    }

    // 3. 更新 Instance Buffer
    SOLAR_SYSTEM.forEach((planet, i) => {
      const base = i * 8;
      
      let rBase = state.trueScale ? (planet.realRadius * EARTH_BASE_RADIUS) : planet.artisticRadius;
      let finalRadius = rBase * state.valSizeScale;
      if (state.hideSun && planet.name === "Sun") finalRadius = 0;

      let dBase = state.trueScale ? (planet.realDistance * AU_TO_EARTH_RADIUS) : planet.artisticDistance;
      let finalOrbitRadius = dBase * state.valDistScale;

      tempInstanceData[base + 0] = finalRadius;
      tempInstanceData[base + 1] = finalOrbitRadius; // i_distance / OrbitRadius
      tempInstanceData[base + 2] = sunRelPositions[i].x; // i_relX (relative to Sun)
      tempInstanceData[base + 3] = sunRelPositions[i].z; // i_relZ (relative to Sun)
      tempInstanceData[base + 4] = planet.color[0];
      tempInstanceData[base + 5] = planet.color[1];
      tempInstanceData[base + 6] = planet.color[2];
      tempInstanceData[base + 7] = planet.texIndex;
    });
    device.queue.writeBuffer(instanceBuffer, 0, tempInstanceData);

    // 4. 更新相机
    vec3.set(camera.target, 0, 0, 0);
    camera.updateMatrix();

    // 5. Uniforms
    const aspect = canvas.width / canvas.height;
    mat4.perspectiveZO(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, 2000000.0);
    mat4.multiply(mvpMatrix, projectionMatrix, camera.viewMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as any);
    device.queue.writeBuffer(uniformBuffer, 64, new Float32Array([rotationTime]));
    const ambient = state.brightMode ? 3.0 : 1.0;
    device.queue.writeBuffer(uniformBuffer, 68, new Float32Array([ambient]));
    // 传入 Focus Position (用于 Shader 里的 Floating Origin 计算)
    device.queue.writeBuffer(uniformBuffer, 80, new Float32Array([focusX, 0, focusZ]));

    // 6. Draw
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        storeOp: "store",
      }],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0, depthLoadOp: "clear", depthStoreOp: "store",
      },
    });

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);
    passEncoder.setIndexBuffer(indexBuffer, "uint16");
    passEncoder.drawIndexed(sphere.indexCount, SOLAR_SYSTEM.length);

    // 绘制轨道：使用 Instance Drawing
    passEncoder.setPipeline(orbitPipeline);
    passEncoder.setBindGroup(0, orbitBindGroup);
    passEncoder.setVertexBuffer(0, orbitVertexBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);
    // 顶点数 = orbitData.length / 3, 实例数 = 9
    passEncoder.draw(orbitData.length / 3, SOLAR_SYSTEM.length);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

init().catch(console.error);