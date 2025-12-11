// src/demo/pyramid.wgsl

// 定义一个 Uniform 缓冲区，用来接收 MVP 矩阵
@group(0) @binding(0)
var<uniform> mvpMatrix: mat4x4<f32>;

// 定义顶点着色器的输出 (也是片元着色器的输入)
// 我们需要把顶点的颜色传递给片元着色器
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  // 在这里添加 flat 插值属性, 每个面就会使用第一个顶点作为颜色
  // @location(0) @interpolate(flat) color: vec4<f32>,
  @location(0) color: vec4<f32>,
};

// --- 顶点着色器 ---
// 接收来自我们代码的顶点数据
@vertex
fn vs_main(
  @location(0) pos: vec3<f32>, // 接收顶点坐标 (x, y, z)
  @location(1) color: vec3<f32> // 接收顶点颜色 (r, g, b)
) -> VertexOutput {
  var output: VertexOutput;
  // 将二维坐标转换为四维，z=0, w=1
  output.position = mvpMatrix * vec4<f32>(pos, 1.0); 
  // 将三维颜色转换为四维，alpha=1
  output.color = vec4<f32>(color, 1.0);
  return output;
}

// --- 片元着色器 ---
// 接收从顶点着色器传来的、经过插值的颜色
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // 直接输出这个像素的颜色
  return input.color;
}
