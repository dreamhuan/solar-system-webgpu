const PI = 3.1415926535;

// --- 绑定组布局 ---
struct FrameUniforms {
  viewProjMatrix: mat4x4<f32>,
  cameraPos: vec3<f32>,
};
@group(0) @binding(0) var<uniform> frame: FrameUniforms;

struct NodeUniforms {
  modelMatrix: mat4x4<f32>,
};
@group(1) @binding(0) var<uniform> node: NodeUniforms;

@group(2) @binding(0) var mySampler: sampler;
@group(2) @binding(1) var colorTexture: texture_2d<f32>;
@group(2) @binding(2) var normalTexture: texture_2d<f32>;
@group(2) @binding(3) var metallicRoughnessTexture: texture_2d<f32>;

// --- 数据结构 ---
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) tangentSpaceLightDirection: vec3<f32>,
  @location(2) tangentSpaceViewDirection: vec3<f32>,
};

// --- 顶点着色器 ---
@vertex
fn vs_main(
  @location(0) pos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) tangent: vec4<f32>
) -> VertexOutput {
    var output: VertexOutput;
    let worldPos = (node.modelMatrix * vec4<f32>(pos, 1.0)).xyz;
    output.position = frame.viewProjMatrix * vec4<f32>(worldPos, 1.0);
    output.uv = uv;

    let worldNormal = normalize((node.modelMatrix * vec4<f32>(normal, 0.0)).xyz);
    let worldTangent = normalize((node.modelMatrix * vec4<f32>(tangent.xyz, 0.0)).xyz);
    let worldBitangent = cross(worldNormal, worldTangent) * tangent.w;
    let tbnMatrix = mat3x3<f32>(worldTangent, worldBitangent, worldNormal);

    let lightDirection = normalize(vec3<f32>(0.5, 1.0, 0.75));
    let viewDirection = normalize(frame.cameraPos - worldPos);
    
    output.tangentSpaceLightDirection = tbnMatrix * lightDirection;
    output.tangentSpaceViewDirection = tbnMatrix * viewDirection;

    return output;
}


// --- 片元着色器 ---
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let albedo_tex = textureSample(colorTexture, mySampler, input.uv);
  if (albedo_tex.a < 0.5) {
      discard;
  }
  let albedo = albedo_tex.rgb;
  let N = normalize(textureSample(normalTexture, mySampler, input.uv).rgb * 2.0 - 1.0);
  let metallicRoughness = textureSample(metallicRoughnessTexture, mySampler, input.uv);
  let metallic = metallicRoughness.b;
  let roughness = metallicRoughness.g;

  let V = normalize(input.tangentSpaceViewDirection);
  let L = normalize(input.tangentSpaceLightDirection);
  let H = normalize(L + V);

  let NdotL = max(dot(N, L), 0.0);
  let NdotV = max(dot(N, V), 0.0);
  let NdotH = max(dot(N, H), 0.0);
  let VdotH = max(dot(V, H), 0.0);

  let lightColor = vec3<f32>(1.0, 1.0, 0.95) * 10.0; // 增强光源

  let alpha = roughness * roughness;
  let F0 = mix(vec3<f32>(0.04), albedo, metallic);
  let F = F0 + (vec3<f32>(1.0) - F0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

  let alpha2 = alpha * alpha;
  let D_denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
  let D = alpha2 / max(PI * D_denom * D_denom, 0.0001);

  let k_direct = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  let G_V = NdotV / (NdotV * (1.0 - k_direct) + k_direct);
  let G_L = NdotL / (NdotL * (1.0 - k_direct) + k_direct);
  let G = G_V * G_L;
  
  let specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.001);
  
  let kS = F;
  let kD = (vec3<f32>(1.0) - kS) * (1.0 - metallic);
  
  let directLighting = (kD * albedo / PI + specular) * lightColor * NdotL;

  // 使用一个更强的、统一的环境光
  let ambient = vec3<f32>(0.1) * albedo;
  var finalColor = ambient + directLighting;
  
  finalColor = finalColor / (finalColor + vec3<f32>(1.0));
  finalColor = pow(finalColor, vec3<f32>(1.0/2.2));

  return vec4<f32>(finalColor, 1.0);
}