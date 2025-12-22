// src/demo/pyramid.wgsl

// Uniforms 结构体现在包含三个成员
struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  cameraPos: vec3<f32>,
};
// CPU按字节位置写入数据，GPU读取时严格内存对齐
@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

// 定义顶点着色器的输出 (也是片元着色器的输入)
// 我们需要把顶点的颜色传递给片元着色器
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  // 在这里添加 flat 插值属性, 每个面就会使用第一个顶点作为颜色
  @location(0) @interpolate(flat) color: vec4<f32>,
  // @location(0) color: vec4<f32>,
  @location(1) worldPos: vec3<f32>,
  @location(2) worldNormal: vec3<f32>, 
};

// --- 顶点着色器 ---
// 接收来自我们代码的顶点数据
@vertex
fn vs_main(
  @location(0) pos: vec3<f32>,
  @location(1) color: vec3<f32>,
  @location(2) normal: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  
  // 1. 将顶点位置变换到裁剪空间
  output.position = uniforms.mvpMatrix * vec4<f32>(pos, 1.0);
  
  // 2. 将顶点位置变换到世界空间
  output.worldPos = (uniforms.modelMatrix * vec4<f32>(pos, 1.0)).xyz;

  // 3. 将法线变换到世界空间
  output.worldNormal = (uniforms.modelMatrix * vec4<f32>(normal, 0.0)).xyz;
  
  output.color = vec4<f32>(color, 1.0);
  return output;
}

// --- 片元着色器 ---
// 接收从顶点着色器传来的、经过插值的颜色
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // --- 最终修正的光照模型 (更标准的 Blinn-Phong 实现) ---

// --- 光照参数 (常量) ---
  let lightColor = vec3<f32>(1.0, 1.0, 0.95); // 稍微偏暖的白色光源
  let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.75)); // 从世界斜上方来的光
  let specularStrength: f32 = 0.5;   // 高光强度
  let shininess: f32 = 32.0;         // 高光锐利度
  let ambientStrength: f32 = 0.2;    // 环境光强度

  // --- 动态计算的向量 ---
  let normal = normalize(input.worldNormal);
  let viewDirection = normalize(uniforms.cameraPos - input.worldPos);

  // 引入能量守恒的思想
  let kS = specularStrength; // 镜面反射系数
  let kD = 1.0 - kS;        // 漫反射系数 = 1 - 镜面反射系数

  // 1. 环境光 (Ambient)
  //    公式: 环境光颜色 * 物体颜色
  let ambient = ambientStrength * input.color.rgb;

  // 2. 漫反射 (Diffuse)
  //    公式: 光强 * 光颜色 * 物体颜色
  let diffuseIntensity = max(dot(normal, lightDirection), 0.0);
  let diffuse = diffuseIntensity * lightColor * input.color.rgb * kD;

  // 3. 镜面高光 (Specular)
  //    公式: 光强 * 光颜色 (高光颜色)
  let halfwayDirection = normalize(lightDirection + viewDirection);
  let specAngle = max(dot(normal, halfwayDirection), 0.0);
  let specularIntensity = pow(specAngle, shininess);
  let specular = specularStrength * specularIntensity * lightColor * kS;

  // 最终颜色 = 环境光 + 漫反射 + 高光
  let finalColor = ambient + diffuse + specular;

  return vec4<f32>(finalColor, input.color.a);
}
