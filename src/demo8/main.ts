import { load } from "@loaders.gl/core";
import { GLTFLoader } from "@loaders.gl/gltf";
import { mat4, vec3, quat } from "gl-matrix";
import pbrShaderCode from "./pbr.wgsl?raw";
import skyboxShaderCode from "./skybox.wgsl?raw";

interface DrawCommand {
  pipeline: GPURenderPipeline;
  attributeBuffers: GPUBuffer[];
  indexBuffer: GPUBuffer;
  indexCount: number;
  indexFormat: GPUIndexFormat;
  nodeBindGroup: GPUBindGroup;
  materialBindGroup: GPUBindGroup;
}

const GLTF_COMPONENT_TYPE_MAP: { [key: number]: any } = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

const GLTF_TYPE_MAP: { [key: string]: { length: number } } = {
  SCALAR: { length: 1 },
  VEC2: { length: 2 },
  VEC3: { length: 3 },
  VEC4: { length: 4 },
  MAT2: { length: 4 },
  MAT3: { length: 9 },
  MAT4: { length: 16 },
};

// --- 工具函数：加载并切割十字形 Cubemap ---
async function createCubemapTexture(device: GPUDevice, url: string) {
  const img = new Image();
  img.src = url;
  await new Promise((resolve) => (img.onload = resolve));

  const faceWidth = img.width / 4;
  const faceHeight = img.height / 3;

  // 提取 6 个面 (WebGPU 顺序: +X, -X, +Y, -Y, +Z, -Z)
  // 假设十字图布局:
  //    +Y
  // -X +Z +X -Z  <-- 这里常见的排列，根据具体图片可能需要调整 offset
  //    -Y
  // 注意：标准 Cubemap 十字图通常是:
  //      Top
  // Left Front Right Back
  //      Bottom
  // 对应:
  //      +Y
  // -X   +Z   +X    -Z
  //      -Y

  const faces = [
    { x: 2, y: 1 }, // +X (Right)
    { x: 0, y: 1 }, // -X (Left)
    { x: 1, y: 0 }, // +Y (Top)
    { x: 1, y: 2 }, // -Y (Bottom)
    { x: 1, y: 1 }, // +Z (Front)
    { x: 3, y: 1 }, // -Z (Back)
  ];

  const texture = device.createTexture({
    dimension: "2d",
    size: [faceWidth, faceHeight, 6],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const canvas = document.createElement("canvas");
  canvas.width = faceWidth;
  canvas.height = faceHeight;
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < 6; i++) {
    if (!ctx) break;
    const { x, y } = faces[i];
    ctx.drawImage(
      img,
      x * faceWidth,
      y * faceHeight,
      faceWidth,
      faceHeight,
      0,
      0,
      faceWidth,
      faceHeight
    );

    // 将 Canvas 内容上传到纹理数组层
    const bitmap = await createImageBitmap(canvas);
    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture, origin: [0, 0, i] },
      [faceWidth, faceHeight]
    );
  }

  return texture;
}

async function init() {
  // --- 1. WebGPU 初始化 ---
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("WebGPU not supported");
  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "premultiplied" });

  let depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // --- 2. 加载环境贴图 ---
  const cubemapTexture = await createCubemapTexture(
    device,
    "StandardCubeMap.png"
  );
  const cubemapSampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    mipmapFilter: "linear",
  });

  // --- 3. 创建绑定组布局 ---

  // 修改 frameBindGroupLayout 以包含环境贴图和采样器
  const frameBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {},
      }, // Uniforms
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Env Sampler
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { viewDimension: "cube" },
      }, // Env Texture
    ],
  });

  const nodeBindGroupLayout = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }],
  });

  const materialBindGroupLayout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
    ],
  });

  // --- 4. 创建 Skybox 渲染管线 ---
  const skyboxPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [frameBindGroupLayout],
  });
  const skyboxPipeline = device.createRenderPipeline({
    layout: skyboxPipelineLayout,
    vertex: {
      module: device.createShaderModule({ code: skyboxShaderCode }),
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: skyboxShaderCode }),
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    depthStencil: {
      depthWriteEnabled: false, // 天空盒不写入深度，作为背景
      depthCompare: "less-equal",
      format: "depth24plus",
    },
    primitive: { topology: "triangle-list" },
  });

  // 生成 Skybox 几何体 (简单的立方体)
  // prettier-ignore
  const skyboxVertices = new Float32Array([
    // 后 (Back, -Z)
    -1,  1, -1,   -1, -1, -1,    1, -1, -1,    1, -1, -1,    1,  1, -1,   -1,  1, -1,
    // 左 (Left, -X)
    -1, -1,  1,   -1, -1, -1,   -1,  1, -1,   -1,  1, -1,   -1,  1,  1,   -1, -1,  1,
    // 右 (Right, +X)
     1, -1, -1,    1, -1,  1,    1,  1,  1,    1,  1,  1,    1,  1, -1,    1, -1, -1,
    // 前 (Front, +Z)
    -1, -1,  1,   -1,  1,  1,    1,  1,  1,    1,  1,  1,    1, -1,  1,   -1, -1,  1,
    // 上 (Top, +Y)
    -1,  1, -1,    1,  1, -1,    1,  1,  1,    1,  1,  1,   -1,  1,  1,   -1,  1, -1,
    // 下 (Bottom, -Y)
    -1, -1, -1,   -1, -1,  1,    1, -1, -1,    1, -1, -1,   -1, -1,  1,    1, -1,  1
  ]);
  const skyboxBuffer = device.createBuffer({
    size: skyboxVertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(skyboxBuffer.getMappedRange()).set(skyboxVertices);
  skyboxBuffer.unmap();

  // --- 5. 创建 PBR 渲染管线 ---
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [
      frameBindGroupLayout,
      nodeBindGroupLayout,
      materialBindGroupLayout,
    ],
  });

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: device.createShaderModule({ code: pbrShaderCode }),
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
        },
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }],
        },
        {
          arrayStride: 8,
          attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }],
        },
        {
          arrayStride: 16,
          attributes: [{ shaderLocation: 3, offset: 0, format: "float32x4" }],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: pbrShaderCode }),
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

  // --- 6. 加载模型资源 ---
  const gltfRaw = await load("mig-23_mld/scene.gltf", GLTFLoader);
  const gltf = gltfRaw.json;
  const binaryBuffers = gltfRaw.buffers;
  const loadedImages = gltfRaw.images;

  // ... (保留之前的 fallbackSampler/Texture 代码) ...
  const fallbackSampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const fallbackTexture = device.createTexture({
    size: [1, 1],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.writeTexture(
    { texture: fallbackTexture },
    new Uint8Array([128, 128, 128, 255]),
    { bytesPerRow: 4 },
    [1, 1]
  );

  const getAccessorData = (accessorIndex: number) => {
    const accessor = gltf.accessors[accessorIndex];
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const buffer = binaryBuffers[bufferView.buffer].arrayBuffer;
    const TypedArray = GLTF_COMPONENT_TYPE_MAP[accessor.componentType];
    const typeInfo = GLTF_TYPE_MAP[accessor.type];
    return new TypedArray(
      buffer,
      (bufferView.byteOffset || 0) + (accessor.byteOffset || 0),
      accessor.count * typeInfo.length
    );
  };

  const createBufferFromAccessor = (
    accessorIndex: number,
    usage: GPUBufferUsageFlags
  ) => {
    const data = getAccessorData(accessorIndex);
    const buffer = device.createBuffer({
      size: (data.byteLength + 3) & ~3,
      usage,
      mappedAtCreation: true,
    });
    new Uint8Array(buffer.getMappedRange()).set(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    );
    buffer.unmap();
    return buffer;
  };

  // --- 7. 处理场景节点 ---
  const sceneMin = vec3.fromValues(Infinity, Infinity, Infinity);
  const sceneMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);
  const drawCommands: DrawCommand[] = [];
  const materialCache: (GPUBindGroup | null)[] = new Array(
    gltf.materials.length
  ).fill(null);

  const processNode = (nodeIndex: number, parentMatrix: mat4) => {
    const node = gltf.nodes[nodeIndex];
    const localMatrix = node.matrix
      ? mat4.clone(node.matrix as mat4)
      : mat4.fromRotationTranslationScale(
          mat4.create(),
          node.rotation || [0, 0, 0, 1],
          node.translation || [0, 0, 0],
          node.scale || [1, 1, 1]
        );
    const worldMatrix = mat4.multiply(mat4.create(), parentMatrix, localMatrix);

    if (node.mesh !== undefined) {
      const mesh = gltf.meshes[node.mesh];
      const nodeUniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(
        nodeUniformBuffer,
        0,
        worldMatrix as Float32Array
      );
      const nodeBindGroup = device.createBindGroup({
        layout: nodeBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: nodeUniformBuffer } }],
      });

      for (const primitive of mesh.primitives) {
        if (primitive.attributes.POSITION === undefined) continue;

        // ... (保留之前的 Bounds 计算) ...
        const posAccessor = gltf.accessors[primitive.attributes.POSITION];
        if (posAccessor.min && posAccessor.max) {
          const min = posAccessor.min as vec3,
            max = posAccessor.max as vec3;
          const corners = [
            [min[0], min[1], min[2]],
            [max[0], min[1], min[2]],
            [min[0], max[1], min[2]],
            [max[0], max[1], min[2]],
            [min[0], min[1], max[2]],
            [max[0], min[1], max[2]],
            [min[0], max[1], max[2]],
            [max[0], max[1], max[2]],
          ];
          corners.forEach((c) => {
            const worldPoint = vec3.transformMat4(
              vec3.create(),
              c as vec3,
              worldMatrix
            );
            vec3.min(sceneMin, sceneMin, worldPoint);
            vec3.max(sceneMax, sceneMax, worldPoint);
          });
        }

        const posBuffer = createBufferFromAccessor(
          primitive.attributes.POSITION,
          GPUBufferUsage.VERTEX
        );
        const normalBuffer = createBufferFromAccessor(
          primitive.attributes.NORMAL,
          GPUBufferUsage.VERTEX
        );
        const uvBuffer = createBufferFromAccessor(
          primitive.attributes.TEXCOORD_0,
          GPUBufferUsage.VERTEX
        );
        const tangentBuffer = primitive.attributes.TANGENT
          ? createBufferFromAccessor(
              primitive.attributes.TANGENT,
              GPUBufferUsage.VERTEX
            )
          : device.createBuffer({
              size: posAccessor.count * 16,
              usage: GPUBufferUsage.VERTEX,
            }); // Dummy

        const indexBuffer = createBufferFromAccessor(
          primitive.indices,
          GPUBufferUsage.INDEX
        );
        const indexAccessor = gltf.accessors[primitive.indices];
        const indexFormat =
          indexAccessor.componentType === 5125 ? "uint32" : "uint16";

        let materialBindGroup = materialCache[primitive.material];
        if (!materialBindGroup) {
          const material = gltf.materials[primitive.material];
          const pbrInfo = material?.pbrMetallicRoughness;

          const createTextureFromInfo = (texInfo: any) => {
            if (!texInfo || gltf.textures[texInfo.index]?.source === undefined)
              return fallbackTexture;
            const imgObj = loadedImages[gltf.textures[texInfo.index].source];
            const imgBitmap = (imgObj.image || imgObj) as ImageBitmap;
            const texture = device.createTexture({
              size: [imgBitmap.width, imgBitmap.height],
              format: "rgba8unorm",
              usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
              { source: imgBitmap },
              { texture },
              [imgBitmap.width, imgBitmap.height]
            );
            return texture;
          };

          const colorTex = createTextureFromInfo(pbrInfo?.baseColorTexture);
          const normalTex = createTextureFromInfo(material?.normalTexture);
          const metalRoughTex = createTextureFromInfo(
            pbrInfo?.metallicRoughnessTexture
          );

          materialBindGroup = device.createBindGroup({
            layout: materialBindGroupLayout,
            entries: [
              { binding: 0, resource: fallbackSampler },
              { binding: 1, resource: colorTex.createView() },
              { binding: 2, resource: normalTex.createView() },
              { binding: 3, resource: metalRoughTex.createView() },
            ],
          });
          materialCache[primitive.material] = materialBindGroup;
        }

        drawCommands.push({
          pipeline,
          attributeBuffers: [posBuffer, normalBuffer, uvBuffer, tangentBuffer],
          indexBuffer,
          indexCount: indexAccessor.count,
          indexFormat,
          nodeBindGroup,
          materialBindGroup,
        });
      }
    }
    if (node.children)
      node.children.forEach((i: number) => processNode(i, worldMatrix));
  };

  const rootNodes = gltf.scenes[gltf.scene || 0].nodes;
  for (const rootIndex of rootNodes) processNode(rootIndex, mat4.create());

  // --- 8. 相机与循环 ---
  const center = vec3.add(vec3.create(), sceneMin, sceneMax);
  vec3.scale(center, center, 0.5);
  const sizeVec = vec3.subtract(vec3.create(), sceneMax, sceneMin);
  const radius = Math.max(sizeVec[0], Math.max(sizeVec[1], sizeVec[2])) * 0.5;

  const frameUniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const skyboxUniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // PBR 全局绑定组 (Buffer + EnvMap + Sampler)
  const frameBindGroup = device.createBindGroup({
    layout: frameBindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: frameUniformBuffer } },
      { binding: 1, resource: cubemapSampler },
      {
        binding: 2,
        resource: cubemapTexture.createView({ dimension: "cube" }),
      },
    ],
  });

  // Skybox 绑定组 (使用自己的 Uniform Buffer，但共享同样的 Layout 结构如果可以，这里为了简单 Skybox shader 只用了一个 binding 0 做矩阵，后面加了纹理)
  // 注意：Skybox Shader 代码中绑定了 buffer, sampler, texture。
  // 为了复用，我们可以直接用 frameBindGroup，但是 Skybox 需要不同的 Matrix (去除位移)。
  // 所以我们新建一个 BindGroup，texture/sampler 复用，matrix 单独给。
  const skyboxBindGroup = device.createBindGroup({
    layout: frameBindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: skyboxUniformBuffer } }, // 专用 Matrix Buffer
      { binding: 1, resource: cubemapSampler },
      {
        binding: 2,
        resource: cubemapTexture.createView({ dimension: "cube" }),
      },
    ],
  });

  const projectionMatrix = mat4.create(),
    viewMatrix = mat4.create(),
    viewProjMatrix = mat4.create();
  let cameraPos = vec3.create();
  const cameraRotation = quat.create();
  quat.rotateX(cameraRotation, cameraRotation, -Math.PI / 6);
  let cameraDistance = radius * 2.5;

  // ... (保留鼠标交互代码) ...
  let isDragging = false,
    lastMouseX = 0,
    lastMouseY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  window.addEventListener("pointerup", () => (isDragging = false));
  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    const sensitivity = 0.005;
    const yawDelta = quat.create(),
      pitchDelta = quat.create();
    quat.setAxisAngle(yawDelta, [0, 1, 0], -deltaX * sensitivity);
    quat.setAxisAngle(pitchDelta, [1, 0, 0], -deltaY * sensitivity);
    quat.multiply(cameraRotation, yawDelta, cameraRotation);
    quat.multiply(cameraRotation, cameraRotation, pitchDelta);
    quat.normalize(cameraRotation, cameraRotation);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      cameraDistance *= 1 + e.deltaY * 0.001;
    },
    { passive: false }
  );

  function frame() {
    // 1. 计算相机
    const offset = vec3.fromValues(0, 0, cameraDistance);
    vec3.transformQuat(offset, offset, cameraRotation);
    vec3.add(cameraPos, center, offset);
    const upVector = vec3.fromValues(0, 1, 0);
    vec3.transformQuat(upVector, upVector, cameraRotation);

    const aspect = canvas.width / canvas.height;
    mat4.perspective(
      projectionMatrix,
      (2 * Math.PI) / 5,
      aspect,
      0.1,
      radius * 20
    );
    mat4.lookAt(viewMatrix, cameraPos, center, upVector);
    mat4.multiply(viewProjMatrix, projectionMatrix, viewMatrix);

    // 更新 PBR Uniforms
    device.queue.writeBuffer(
      frameUniformBuffer,
      0,
      viewProjMatrix as Float32Array
    );
    device.queue.writeBuffer(frameUniformBuffer, 64, cameraPos as Float32Array);

    // 更新 Skybox Uniforms (移除 View 的位移)
    const viewNoTranslate = mat4.clone(viewMatrix);
    viewNoTranslate[12] = 0;
    viewNoTranslate[13] = 0;
    viewNoTranslate[14] = 0;
    const skyboxViewProj = mat4.multiply(
      mat4.create(),
      projectionMatrix,
      viewNoTranslate
    );
    device.queue.writeBuffer(
      skyboxUniformBuffer,
      0,
      skyboxViewProj as Float32Array
    );

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
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

    // 2. 绘制 Skybox (通常先画，或者最后画且 depth func 为 less-equal)
    renderPass.setPipeline(skyboxPipeline);
    renderPass.setBindGroup(0, skyboxBindGroup);
    renderPass.setVertexBuffer(0, skyboxBuffer);
    renderPass.draw(36);

    // 3. 绘制 PBR 模型
    if (drawCommands.length > 0) {
      renderPass.setPipeline(drawCommands[0].pipeline);
      renderPass.setBindGroup(0, frameBindGroup); // 包含 EnvMap
      for (const cmd of drawCommands) {
        renderPass.setBindGroup(1, cmd.nodeBindGroup);
        renderPass.setBindGroup(2, cmd.materialBindGroup);
        renderPass.setVertexBuffer(0, cmd.attributeBuffers[0]);
        renderPass.setVertexBuffer(1, cmd.attributeBuffers[1]);
        renderPass.setVertexBuffer(2, cmd.attributeBuffers[2]);
        renderPass.setVertexBuffer(3, cmd.attributeBuffers[3]);
        renderPass.setIndexBuffer(cmd.indexBuffer, cmd.indexFormat);
        renderPass.drawIndexed(cmd.indexCount);
      }
    }
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    depthTexture.destroy();
    depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  });
  requestAnimationFrame(frame);
}

init().catch((err) => console.error(err));
