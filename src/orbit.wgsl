struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  padding1: f32, // 占位: rotationTime
  ambientStrength: f32,
  // 必须与 main.ts 里的 Uniform Buffer 结构对齐
  // offset 76 (padding)
  // offset 80 (focusPos)
  padding2: f32,
  focusPos: vec3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>, // 单位圆顶点
  @location(4) i_orbitRadius: f32   // 从 Instance Buffer (Offset 4) 读取轨道半径
) -> VertexOutput {
  var output: VertexOutput;

  // 1. 太阳在绝对空间的位置是 (0,0,0)
  // 2. 我们现在的世界原点是 focusPos
  // 3. 所以太阳相对于我们的位置是 -focusPos
  let sunRelativePos = -uniforms.focusPos;

  // 4. 轨道的顶点位置 = (单位圆 * 半径) + 太阳相对位置
  let worldPos = (position * i_orbitRadius) + sunRelativePos;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(worldPos, 1.0);
  return output;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  // 增加基础亮度，让线更明显
  let baseAlpha = 0.3;
  let alpha = clamp(baseAlpha * uniforms.ambientStrength, 0.0, 1.0);
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}