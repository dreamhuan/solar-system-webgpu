struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  globalTime: f32,
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

  // 1. 轨道计算
  let angle = i_initialAngle + uniforms.globalTime * i_speed * 0.1;
  var orbitPos = vec3<f32>(0.0);
  if (i_distance > 0.001) {
    orbitPos = vec3<f32>(cos(angle) * i_distance, 0.0, sin(angle) * i_distance);
  }

  // 2. 自转计算
  let rotSpeed = 0.5;
  let rAngle = uniforms.globalTime * rotSpeed + i_initialAngle;
  let c = cos(rAngle);
  let s = sin(rAngle);

  let rotatedPos = vec3<f32>(position.x * c + position.z * s, position.y, position.z * c - position.x * s);

  let rotatedNormal = vec3<f32>(normal.x * c + normal.z * s, normal.y, normal.z * c - normal.x * s);

  // 3. 计算世界坐标
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
  // --- 关键修改开始 ---

  // 1. 计算点光源方向：从 太阳中心(0,0,0) 指向 当前像素位置
  // 光照方向 = normalize(光源位置 - 物体位置)
  // 因为光源在 0,0,0，所以是 normalize(-input.WorldPos)
  var lightDir = normalize(- input.WorldPos);

  // 2. 基础环境光 (Ambient Light)
  // 调高这个值，背光面就会变亮，不再是纯黑
  var ambient = 0.3;

  // 3. 漫反射计算
  var diffuse = max(dot(input.Normal, lightDir), 0.0);

  // 特殊处理：如果是太阳 (TexIndex == 0)，它自己就是光源，不需要光照计算
  if (input.TexIndex < 0.1) {
    diffuse = 1.0;
    ambient = 0.5;
    // 让太阳更亮一点
  }

  // 4. 获取纹理颜色
  let texColor = textureSample(myTexture, mySampler, input.Uv, i32(input.TexIndex));

  // 5. 组合最终颜色 = 纹理 * (环境光 + 漫反射)
  let finalColor = texColor.rgb * (diffuse + ambient) * input.Color;

  return vec4<f32>(finalColor, 1.0);
}