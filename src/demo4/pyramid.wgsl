// WGSL Shader for a Textured Pyramid with Blinn-Phong Lighting

// --- 绑定资源 ---
// 这个结构体必须与 main.ts 中 uniformBuffer 的布局完全匹配
struct Uniforms {
  mvpMatrix: mat4x4<f32>,     // at offset 0
  modelMatrix: mat4x4<f32>,   // at offset 64
  cameraPos: vec3<f32>,       // at offset 128
};

// @group(0) 将所有资源都放在同一个绑定组中
// @binding(n) 指定了每个资源在该组中的具体“插槽”位置

@group(0) @binding(0) 
var<uniform> uniforms: Uniforms;

@group(0) @binding(1) 
var mySampler: sampler;

@group(0) @binding(2) 
var myTexture: texture_2d<f32>;


// --- 顶点着色器 -> 片元着色器 数据通道 ---
// 这个结构体定义了从顶点着色器传递到片元着色器的数据
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) worldNormal: vec3<f32>, 
  @location(2) uv: vec2<f32>,
};


// --- 顶点着色器 ---
// 为每个顶点运行一次，计算其最终位置和传递给片元的数据
@vertex
fn vs_main(
  @location(0) pos: vec3<f32>,      // 从顶点缓冲区读取：位置
  @location(1) normal: vec3<f32>,  // 从顶点缓冲区读取：法线
  @location(2) uv: vec2<f32>       // 从顶点缓冲区读取：UV坐标
) -> VertexOutput {
  var output: VertexOutput;

  // 1. 计算裁剪空间位置 (给GPU硬件用于光栅化)
  output.position = uniforms.mvpMatrix * vec4<f32>(pos, 1.0);

  // 2. 计算世界空间位置 (给片元着色器用于光照计算)
  output.worldPos = (uniforms.modelMatrix * vec4<f32>(pos, 1.0)).xyz;

  // 3. 计算世界空间法线 (给片元着色器用于光照计算)
  output.worldNormal = (uniforms.modelMatrix * vec4<f32>(normal, 0.0)).xyz;
  
  // 4. 直接传递 UV 坐标 (它会被自动插值)
  output.uv = uv;
  
  return output;
}


// --- 片元着色器 ---
// 为每个被物体覆盖的像素运行一次，计算其最终颜色
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // 1. 从纹理中获取物体的基础颜色 (Albedo)
  //    textureSample 函数使用 UV 坐标在纹理上进行采样
  let albedo = textureSample(myTexture, mySampler, input.uv).rgb;

  // 2. 光照参数和向量准备
  let lightColor = vec3<f32>(1.0, 1.0, 0.95); // 暖白色光源
  let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.75));
  let ambientStrength: f32 = 0.2;
  let specularStrength: f32 = 0.5;
  let shininess: f32 = 32.0;

  let normal = normalize(input.worldNormal);
  let viewDirection = normalize(uniforms.cameraPos - input.worldPos);

  // 3. 计算光照的三个组成部分
  //    a) 环境光 (Ambient)
  let ambient = ambientStrength * albedo;

  //    b) 漫反射 (Diffuse)
  let diffuseIntensity = max(dot(normal, lightDirection), 0.0);
  let diffuse = diffuseIntensity * lightColor * albedo;

  //    c) 镜面高光 (Specular)
  let halfwayDirection = normalize(lightDirection + viewDirection);
  let specAngle = max(dot(normal, halfwayDirection), 0.0);
  let specularIntensity = pow(specAngle, shininess);
  let specular = specularStrength * specularIntensity * lightColor;

  // 4. 组合最终颜色
  let finalColor = ambient + diffuse + specular;

  // 返回最终颜色，alpha 通道为 1.0 (不透明)
  return vec4<f32>(finalColor, 1.0);
}
