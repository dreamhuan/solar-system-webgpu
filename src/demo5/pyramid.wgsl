// WGSL Shader for a Textured Pyramid with Blinn-Phong Lighting

// --- 绑定资源 ---
// 这个结构体必须与 main.ts 中 uniformBuffer 的布局完全匹配
struct Uniforms {
  mvpMatrix: mat4x4<f32>,     // at offset 0
  modelMatrix: mat4x4<f32>,   // at offset 64
  cameraPos: vec3<f32>,       // at offset 128
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var colorTexture: texture_2d<f32>;
@group(0) @binding(3) var normalTexture: texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) tangentSpaceLightDirection: vec3<f32>,
  @location(2) tangentSpaceViewDirection: vec3<f32>,
};


// --- 顶点着色器 ---
// 为每个顶点运行一次，计算其最终位置和传递给片元的数据
@vertex
fn vs_main(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) tangent: vec3<f32>
) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvpMatrix * vec4<f32>(pos, 1.0);
  output.uv = uv;

  let worldNormal = normalize((uniforms.modelMatrix * vec4<f32>(normal, 0.0)).xyz);
  let worldTangent = normalize((uniforms.modelMatrix * vec4<f32>(tangent, 0.0)).xyz);
  let worldBitangent = cross(worldNormal, worldTangent);

  let tbnMatrix = mat3x3<f32>(
    worldTangent,
    worldBitangent,
    worldNormal
  );

  let worldPos = (uniforms.modelMatrix * vec4<f32>(pos, 1.0)).xyz;
  let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.75));
  let viewDirection = normalize(uniforms.cameraPos - worldPos);
  
  output.tangentSpaceLightDirection = tbnMatrix * lightDirection;
  output.tangentSpaceViewDirection = tbnMatrix * viewDirection;

  return output;
}


// --- 片元着色器 ---
// 为每个被物体覆盖的像素运行一次，计算其最终颜色
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let albedo = textureSample(colorTexture, mySampler, input.uv).rgb;

  let tangentSpaceNormal = normalize(
    textureSample(normalTexture, mySampler, input.uv).rgb * 2.0 - 1.0
  );

  let lightDirection = normalize(input.tangentSpaceLightDirection);
  let viewDirection = normalize(input.tangentSpaceViewDirection);

  let ambient = 0.2 * albedo;
  
  let diffuseIntensity = max(dot(tangentSpaceNormal, lightDirection), 0.0);
  let diffuse = diffuseIntensity * vec3<f32>(1.0) * albedo;
  
  let halfwayDirection = normalize(lightDirection + viewDirection);
  let specAngle = max(dot(tangentSpaceNormal, halfwayDirection), 0.0);
  let specularIntensity = pow(specAngle, 32.0);
  let specular = 0.5 * specularIntensity * vec3<f32>(1.0);

  let finalColor = ambient + diffuse + specular;

  return vec4<f32>(finalColor, 1.0);
}
