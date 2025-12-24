import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import { mat4, vec3, vec4 } from 'gl-matrix'; // 确保引入了 vec3, vec4

interface DrawCommand {
    pipeline: GPURenderPipeline;
    vertexBuffer: GPUBuffer;
    uvBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
    indexFormat: GPUIndexFormat;
    nodeBindGroup: GPUBindGroup;
    materialBindGroup: GPUBindGroup;
}

async function init() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("WebGPU not supported");
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({ device, format, alphaMode: 'premultiplied' });

    let depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // --- Shader & Pipeline ---
    const frameBindGroupLayout = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }]
    });
    const nodeBindGroupLayout = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} }]
    });
    const materialBindGroupLayout = device.createBindGroupLayout({
        entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} }
        ]
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [frameBindGroupLayout, nodeBindGroupLayout, materialBindGroupLayout]
    });

    const shaderCode = `
        struct Frame { viewProj : mat4x4<f32> }
        struct Node { model : mat4x4<f32> }
        @group(0) @binding(0) var<uniform> frame : Frame;
        @group(1) @binding(0) var<uniform> node : Node;
        @group(2) @binding(0) var mySampler : sampler;
        @group(2) @binding(1) var myTexture : texture_2d<f32>;

        struct VertexOutput {
            @builtin(position) position : vec4<f32>,
            @location(0) uv : vec2<f32>,
        }

        @vertex fn vs_main(@location(0) pos : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
            var out : VertexOutput;
            out.position = frame.viewProj * node.model * vec4<f32>(pos, 1.0);
            out.uv = uv;
            return out;
        }

        @fragment fn fs_main(@location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
            let color = textureSample(myTexture, mySampler, uv);
            if (color.a < 0.5) { discard; } // 简单的透明度测试
            return vec4<f32>(pow(color.rgb, vec3<f32>(1.0/2.2)), color.a);
        }
    `;

    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: device.createShaderModule({ code: shaderCode }),
            entryPoint: 'vs_main',
            buffers: [
                { arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] },
                { arrayStride: 8, attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x2' }] }
            ]
        },
        fragment: {
            module: device.createShaderModule({ code: shaderCode }),
            entryPoint: 'fs_main',
            targets: [{ format }]
        },
        primitive: { topology: 'triangle-list', cullMode: 'back' },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        }
    });

    // --- 加载资源 ---
    const gltfRaw = await load('mig-23_mld/scene.gltf', GLTFLoader);
    const gltf = gltfRaw.json;
    const binaryBuffers = gltfRaw.buffers;
    const loadedImages = gltfRaw.images;

    // 默认材质
    const fallbackTexture = device.createTexture({ size: [1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
    device.queue.writeTexture({ texture: fallbackTexture }, new Uint8Array([128, 128, 128, 255]), { bytesPerRow: 4 }, [1, 1]);
    const fallbackSampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

    const createBufferFromAccessor = (accessorIndex: number, usage: GPUBufferUsageFlags) => {
        const accessor = gltf.accessors[accessorIndex];
        const bufferView = gltf.bufferViews[accessor.bufferView];
        const bufferData = binaryBuffers[bufferView.buffer].arrayBuffer;
        const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const data = bufferData.slice(offset, offset + bufferView.byteLength);
        
        const buffer = device.createBuffer({
            size: (data.byteLength + 3) & ~3,
            usage,
            mappedAtCreation: true,
        });
        new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(data));
        buffer.unmap();
        return buffer;
    };

    // --- 场景包围盒变量 ---
    const sceneMin = vec3.fromValues(Infinity, Infinity, Infinity);
    const sceneMax = vec3.fromValues(-Infinity, -Infinity, -Infinity);

    const drawCommands: DrawCommand[] = [];

    const processNode = (nodeIndex: number, parentMatrix: mat4) => {
        const node = gltf.nodes[nodeIndex];
        const localMatrix = mat4.create();
        if (node.matrix) {
            mat4.copy(localMatrix, node.matrix);
        } else {
            mat4.fromRotationTranslationScale(
                localMatrix, 
                node.rotation || [0, 0, 0, 1], 
                node.translation || [0, 0, 0], 
                node.scale || [1, 1, 1]
            );
        }
        const worldMatrix = mat4.create();
        mat4.multiply(worldMatrix, parentMatrix, localMatrix);

        if (node.mesh !== undefined) {
            const mesh = gltf.meshes[node.mesh];
            
            // 1. 准备 Node Uniform
            const nodeUniformBuffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
            device.queue.writeBuffer(nodeUniformBuffer, 0, worldMatrix as Float32Array);
            const nodeBindGroup = device.createBindGroup({
                layout: nodeBindGroupLayout,
                entries: [{ binding: 0, resource: { buffer: nodeUniformBuffer } }]
            });

            for (const primitive of mesh.primitives) {
                if (primitive.attributes.POSITION === undefined) continue;

                // --- 计算包围盒 (关键步骤) ---
                const posAccessor = gltf.accessors[primitive.attributes.POSITION];
                if (posAccessor.min && posAccessor.max) {
                    // 获取局部坐标系的8个角点
                    const min = posAccessor.min;
                    const max = posAccessor.max;
                    const corners = [
                        [min[0], min[1], min[2]], [max[0], min[1], min[2]],
                        [min[0], max[1], min[2]], [max[0], max[1], min[2]],
                        [min[0], min[1], max[2]], [max[0], min[1], max[2]],
                        [min[0], max[1], max[2]], [max[0], max[1], max[2]]
                    ];
                    
                    // 将8个点转换到世界坐标，并更新全局 min/max
                    corners.forEach(c => {
                        const worldPoint = vec3.create();
                        vec3.transformMat4(worldPoint, c as vec3, worldMatrix);
                        vec3.min(sceneMin, sceneMin, worldPoint);
                        vec3.max(sceneMax, sceneMax, worldPoint);
                    });
                }

                // 创建 Buffers
                const vertexBuffer = createBufferFromAccessor(primitive.attributes.POSITION, GPUBufferUsage.VERTEX);
                
                let uvBuffer: GPUBuffer;
                if (primitive.attributes.TEXCOORD_0 !== undefined) {
                    uvBuffer = createBufferFromAccessor(primitive.attributes.TEXCOORD_0, GPUBufferUsage.VERTEX);
                } else {
                    uvBuffer = device.createBuffer({ size: posAccessor.count * 8, usage: GPUBufferUsage.VERTEX });
                }

                const indexBuffer = createBufferFromAccessor(primitive.indices, GPUBufferUsage.INDEX);
                const indexAccessor = gltf.accessors[primitive.indices];
                const indexFormat = indexAccessor.componentType === 5125 ? 'uint32' : 'uint16';

                // 材质
                let textureView = fallbackTexture.createView();
                let sampler = fallbackSampler;
                if (primitive.material !== undefined) {
                    const material = gltf.materials[primitive.material];
                    const texInfo = material.pbrMetallicRoughness?.baseColorTexture;
                    if (texInfo) {
                        const imgObj = loadedImages[gltf.textures[texInfo.index].source];
                        const imgBitmap = imgObj.image || imgObj;
                        if (imgBitmap) {
                            const texture = device.createTexture({
                                size: [imgBitmap.width, imgBitmap.height],
                                format: 'rgba8unorm',
                                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
                            });
                            device.queue.copyExternalImageToTexture({ source: imgBitmap }, { texture }, [imgBitmap.width, imgBitmap.height]);
                            textureView = texture.createView();
                            sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear' });
                        }
                    }
                }

                const materialBindGroup = device.createBindGroup({
                    layout: materialBindGroupLayout,
                    entries: [{ binding: 0, resource: sampler }, { binding: 1, resource: textureView }]
                });

                drawCommands.push({
                    pipeline, vertexBuffer, uvBuffer, indexBuffer, 
                    indexCount: indexAccessor.count, indexFormat, 
                    nodeBindGroup, materialBindGroup
                });
            }
        }

        if (node.children) {
            node.children.forEach((childIndex: number) => processNode(childIndex, worldMatrix));
        }
    };

    const rootNodes = gltf.scenes[gltf.scene || 0].nodes;
    for (const rootIndex of rootNodes) {
        processNode(rootIndex, mat4.create());
    }

    // --- 自动调整相机 (Auto Framing) ---
    // 1. 计算中心点
    const center = vec3.create();
    vec3.add(center, sceneMin, sceneMax);
    vec3.scale(center, center, 0.5);

    // 2. 计算模型尺寸（半径）
    const sizeVec = vec3.create();
    vec3.subtract(sizeVec, sceneMax, sceneMin);
    const maxDim = Math.max(sizeVec[0], Math.max(sizeVec[1], sizeVec[2]));
    const radius = maxDim * 1.0; // 适当留白

    console.log("模型中心:", center, "模型尺寸:", maxDim);

    // --- 渲染循环 ---
    const frameUniformBuffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const frameBindGroup = device.createBindGroup({
        layout: frameBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: frameUniformBuffer } }]
    });

    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const viewProjMatrix = mat4.create();
    const cameraPos = vec3.create();

    function frame() {
        const now = performance.now() / 2000;
        
        // 相机围绕计算出的 Center 旋转，距离根据 Radius 动态设定
        // 距离系数 1.5 确保能看到整个物体
        const dist = radius * 1.2; 
        cameraPos[0] = center[0] + Math.sin(now) * dist;
        cameraPos[2] = center[2] + Math.cos(now) * dist;
        cameraPos[1] = center[1] + radius * 0.3; // 稍微俯视

        const aspect = canvas.width / canvas.height;
        mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, aspect, 0.1, radius * 10);
        mat4.lookAt(viewMatrix, cameraPos, center, [0, 1, 0]);
        mat4.multiply(viewProjMatrix, projectionMatrix, viewMatrix);

        device.queue.writeBuffer(frameUniformBuffer, 0, viewProjMatrix as Float32Array);

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        if (drawCommands.length > 0) {
            renderPass.setPipeline(drawCommands[0].pipeline);
            renderPass.setBindGroup(0, frameBindGroup);
            for (const cmd of drawCommands) {
                renderPass.setBindGroup(1, cmd.nodeBindGroup);
                renderPass.setBindGroup(2, cmd.materialBindGroup);
                renderPass.setVertexBuffer(0, cmd.vertexBuffer);
                renderPass.setVertexBuffer(1, cmd.uvBuffer);
                renderPass.setIndexBuffer(cmd.indexBuffer, cmd.indexFormat);
                renderPass.drawIndexed(cmd.indexCount);
            }
        }

        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        depthTexture.destroy();
        depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    });

    requestAnimationFrame(frame);
}

init().catch(err => console.error(err));