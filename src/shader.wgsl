struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  orbitTime: f32,
  rotationTime: f32,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;
@group(0) @binding(1)
var mySampler: sampler;
@group(0) @binding(2)
var myTexture: texture_2d_array<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) WorldPos: vec3<f32>,
  // 新增：传递世界坐标给片段着色器
  @location(1) Normal: vec3<f32>,
  @location(2) Uv: vec2<f32>,
  @location(3) TexIndex: f32,
  @location(4) Color: vec3<f32>,
}

@vertex
fn vs_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>, @location(2) uv: vec2<f32>, @location(3) i_radius: f32, @location(4) i_distance: f32, @location(5) i_speed: f32, @location(6) i_texIndex: f32, @location(7) i_color: vec3<f32>, @location(8) i_initialAngle: f32) -> VertexOutput {
  var output: VertexOutput;

  // 1. 公转 (逆时针)
  let angle = - 1.0 * (i_initialAngle + uniforms.orbitTime * i_speed * 0.1);
  var orbitPos = vec3<f32>(0.0);
  if (i_distance > 0.001) {
    orbitPos = vec3<f32>(cos(angle) * i_distance, 0.0, sin(angle) * i_distance);
  }

  // 2. 自转 (逆时针)
  let rotSpeed = 0.5;
  // 只有星球才自转，背景球(半径为负)和太阳不自转或独立处理
  var rAngle = 0.0;
  // 简单判断：如果半径是正的，且不是太阳(距离>0)，则自转
  // 或者让所有正半径物体自转
  if (i_radius > 0.0) {
    rAngle = - 1.0 * (uniforms.rotationTime * rotSpeed + i_initialAngle);
  }

  let c = cos(rAngle);
  let s = sin(rAngle);

  // 3. 旋转几何体 (标准 Y 轴旋转)
  let rotatedPos = vec3<f32>(position.x * c - position.z * s, position.y, position.x * s + position.z * c);

  let rotatedNormal = vec3<f32>(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);

  // 4. 构建世界坐标
  let worldPos = (rotatedPos * i_radius) + orbitPos;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(worldPos, 1.0);
  output.WorldPos = worldPos;
  // 传递世界坐标
  output.Normal = rotatedNormal;
  output.Uv = uv;
  output.TexIndex = i_texIndex;
  output.Color = i_color;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // 1. 归一化法线
  let N = normalize(input.Normal);

  // 2. 光照方向 (从太阳指向表面位置的反方向)
  let L = normalize(vec3<f32>(0.0, 0.0, 0.0) - input.WorldPos);

  // 3. 漫反射 (向阳面亮度)
  var diffuse = max(dot(N, L), 0.0);

  // 4. 环境光 (Shadow Color) 
  // rgb亮度通道，b大一点，这样背光面会有淡淡的蓝灰色细节
  var ambient = vec3<f32>(0.30, 0.30, 0.35);

  // 5. 太阳和背景自发光 (保持不变)
  // 这里的逻辑是：如果是太阳(Index 0)或背景，忽略光照，始终最亮
  if (input.TexIndex < 0.1 || input.TexIndex > 8.5) {
    diffuse = 1.0;
    // 太阳不需要环境光叠加，否则会过曝
    ambient = vec3<f32>(0.0);
  }

  // 6. 采样
  let texColor = textureSample(myTexture, mySampler, input.Uv, i32(input.TexIndex));

  // 7. 混合
  let lighting = vec3<f32>(diffuse) + ambient;
  let finalColor = texColor.rgb * lighting * input.Color;

  return vec4<f32>(finalColor, 1.0);
}