// src/orbit.wgsl

struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  // ... 其他字段这里用不到
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
}

@vertex
fn vs_main(@location(0) position: vec3<f32>, // 单位圆上的点

// 我们只从 Instance Buffer 里读取 distance
// 注意：这里的 location 要和 main.ts 里的 pipeline 配置对应
@location(1) i_distance: f32) -> VertexOutput {
  var output: VertexOutput;

  // 简单的缩放：位置 * 距离
  // 如果是太阳 (distance=0)，圈就会缩成一个点，不可见，符合预期
  let worldPos = position * i_distance;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(worldPos, 1.0);
  return output;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  // 返回半透明的白色
  return vec4<f32>(1.0, 1.0, 1.0, 0.15);
}