struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  rotationTime: f32,
  ambientStrength: f32,
  padding: f32,
  focusPos: vec3<f32>, // Offset 80
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d_array<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) WorldPos: vec3<f32>,
  @location(1) Normal: vec3<f32>,
  @location(2) Uv: vec2<f32>,
  @location(3) TexIndex: f32,
  @location(4) Color: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>, 
  @location(1) normal: vec3<f32>, 
  @location(2) uv: vec2<f32>, 
  // Instance Attributes
  @location(3) i_radius: f32, 
  @location(4) i_distance: f32, 
  @location(5) i_relX: f32, // 这里我们不再用CPU传过来的relX，而是用 distance 重新算
  @location(6) i_relZ: f32, // 这样能保证星球和轨道完全同步
  @location(7) i_color: vec3<f32>, 
  @location(8) i_texIndex: f32
) -> VertexOutput {
  var output: VertexOutput;

  // 既然我们有了 focusPos Uniform，我们可以在 Shader 里直接用 i_distance 算绝对坐标
  // 这样星球和轨道共用同一套 "Radius/Distance" 逻辑，不会出现分离

  // 1. 自转
  let rotSpeed = 0.5;
  var rAngle = 0.0;
  if (i_radius > 0.0) {
    rAngle = -1.0 * uniforms.rotationTime * rotSpeed;
  }
  let c = cos(rAngle);
  let s = sin(rAngle);
  let rotatedPos = vec3<f32>(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  let rotatedNormal = vec3<f32>(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);

  // 2. 利用传入的 i_relX / i_relZ (这是相对于太阳的位置)
  // 注意：在 main.ts 里，我们将把 "相对于太阳的位置" 传进 relX/relZ
  // 而不是相对于 Focus 的位置。这样更灵活。
  let planetPosRelativeToSun = vec3<f32>(i_relX, 0.0, i_relZ);
  
  // 3. 太阳相对于 Focus 的位置
  let sunRelativePos = -uniforms.focusPos;

  // 4. 最终坐标 = (本地旋转 * 半径) + 行星相对太阳位移 + 太阳相对Focus位移
  let finalRelPos = (rotatedPos * i_radius) + planetPosRelativeToSun + sunRelativePos;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(finalRelPos, 1.0);
  output.WorldPos = finalRelPos;
  output.Normal = rotatedNormal;
  output.Uv = uv;
  output.TexIndex = i_texIndex;
  output.Color = i_color;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let N = normalize(input.Normal);
  // 简单光照：假设光来自观察位置反向(近似)
  let L = normalize(-input.WorldPos); 
  var diffuse = max(dot(N, L), 0.0);
  var ambient = vec3<f32>(0.30, 0.30, 0.35) * uniforms.ambientStrength;

  if (input.TexIndex < 0.1 || input.TexIndex > 8.5) {
    diffuse = 1.0;
    ambient = vec3<f32>(0.0);
  }

  let texColor = textureSample(myTexture, mySampler, input.Uv, i32(input.TexIndex));
  let lighting = vec3<f32>(diffuse) + ambient;
  let finalColor = texColor.rgb * lighting * input.Color;

  return vec4<f32>(finalColor, 1.0);
}