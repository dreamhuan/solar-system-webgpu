struct Uniforms {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var mySampler : sampler;
@group(0) @binding(2) var myTexture : texture_cube<f32>;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) uv : vec3<f32>,
};

@vertex
fn vs_main(@location(0) pos : vec3<f32>) -> VertexOutput {
  var output : VertexOutput;
  // 天空盒随相机移动，所以通常移除 View 矩阵的位移部分，或者在这里直接用大尺寸
  // 这里我们在 CPU 端处理 View 矩阵（移除位移）
  output.Position = uniforms.viewProjMatrix * vec4<f32>(pos, 1.0);
  // 确保天空盒在深度测试中处于最远端 (z = 1.0)
  output.Position = output.Position.xyww; 
  output.uv = pos;
  return output;
}

@fragment
fn fs_main(@location(0) uv : vec3<f32>) -> @location(0) vec4<f32> {
  // WebGPU 坐标系需修正翻转
  return textureSample(myTexture, mySampler, vec3<f32>(uv.x, uv.y, -uv.z));
}