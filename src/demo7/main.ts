import { load } from "@loaders.gl/core";
import { GLTFLoader } from "@loaders.gl/gltf";
import { mat4, vec3, quat } from "gl-matrix"; // 确保引入了 quat
import pbrShaderCode from "./pbr.wgsl?raw";

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

  // --- 2. 创建绑定组布局和 PBR 管线 ---
  const frameBindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {},
      },
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

  // --- 3. 加载资源 ---
  const gltfRaw = await load("mig-23_mld/scene.gltf", GLTFLoader);
  const gltf = gltfRaw.json;
  const binaryBuffers = gltfRaw.buffers;
  const loadedImages = gltfRaw.images;

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

  // --- 4. 遍历场景图，创建绘制指令 ---
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
            });

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
          const normalInfo = material?.normalTexture;

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
          const normalTex = createTextureFromInfo(normalInfo);
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

    if (node.children) {
      node.children.forEach((childIndex: number) =>
        processNode(childIndex, worldMatrix)
      );
    }
  };

  const rootNodes = gltf.scenes[gltf.scene || 0].nodes;
  for (const rootIndex of rootNodes) {
    processNode(rootIndex, mat4.create());
  }

  // --- 5. 自动相机与渲染循环 ---
  const center = vec3.add(vec3.create(), sceneMin, sceneMax);
  vec3.scale(center, center, 0.5);
  const sizeVec = vec3.subtract(vec3.create(), sceneMax, sceneMin);
  const radius = Math.max(sizeVec[0], Math.max(sizeVec[1], sizeVec[2])) * 0.5;

  console.log("Model Center:", center, "Model Radius:", radius);

  const frameUniformBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const frameBindGroup = device.createBindGroup({
    layout: frameBindGroupLayout,
    entries: [{ binding: 0, resource: { buffer: frameUniformBuffer } }],
  });

  const projectionMatrix = mat4.create(),
    viewMatrix = mat4.create(),
    viewProjMatrix = mat4.create();
  let cameraPos = vec3.create();

  // --- 鼠标交互控制 (四元数累积版) ---
  const cameraRotation = quat.create();
  quat.rotateX(cameraRotation, cameraRotation, -Math.PI / 6); // 初始俯仰角
  let cameraDistance = radius * 2.5;
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

    const yawDelta = quat.create();
    quat.setAxisAngle(yawDelta, [0, 1, 0], -deltaX * sensitivity);

    const pitchDelta = quat.create();
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
      cameraDistance = Math.max(
        radius * 0.1,
        Math.min(radius * 10, cameraDistance)
      );
    },
    { passive: false }
  );

  function frame() {
    // 计算相机位置和朝向
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

    device.queue.writeBuffer(
      frameUniformBuffer,
      0,
      viewProjMatrix as Float32Array
    );
    device.queue.writeBuffer(frameUniformBuffer, 64, cameraPos as Float32Array);

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.1, g: 0.15, b: 0.2, a: 1.0 },
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

    if (drawCommands.length > 0) {
      renderPass.setPipeline(drawCommands[0].pipeline);
      renderPass.setBindGroup(0, frameBindGroup);
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
