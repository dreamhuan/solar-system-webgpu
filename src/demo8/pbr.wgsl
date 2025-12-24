const PI = 3.1415926535;

// --- 绑定组布局 ---
struct FrameUniforms {
  viewProjMatrix: mat4x4<f32>,
  cameraPos: vec3<f32>,
};
@group(0) @binding(0) var<uniform> frame: FrameUniforms;
// 新增：环境贴图绑定
@group(0) @binding(1) var envSampler: sampler;
@group(0) @binding(2) var envTexture: texture_cube<f32>;

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
  @location(1) worldPos: vec3<f32>,    // 需要世界坐标计算反射
  @location(2) worldNormal: vec3<f32>, // 需要世界法线
  @location(3) worldTangent: vec3<f32>,
  @location(4) worldBitangent: vec3<f32>,
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
    output.worldPos = worldPos;

    // 计算 TBN 需要的世界向量
    output.worldNormal = normalize((node.modelMatrix * vec4<f32>(normal, 0.0)).xyz);
    output.worldTangent = normalize((node.modelMatrix * vec4<f32>(tangent.xyz, 0.0)).xyz);
    // Bitangent 需考虑手性 (tangent.w)
    output.worldBitangent = cross(output.worldNormal, output.worldTangent) * tangent.w;

    return output;
}

// 菲涅尔方程 (Schlick近似)
fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 考虑粗糙度的菲涅尔
fn fresnelSchlickRoughness(cosTheta: f32, F0: vec3<f32>, roughness: f32) -> vec3<f32> {
    return F0 + (max(vec3<f32>(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// --- 片元着色器 ---
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let albedo_tex = textureSample(colorTexture, mySampler, input.uv);
  if (albedo_tex.a < 0.5) { discard; }
  let albedo = albedo_tex.rgb; // sRGB to Linear conversion happens often automatically by format, assuming unorm

  // 1. 获取法线贴图并转换到世界空间
  let tbnMatrix = mat3x3<f32>(normalize(input.worldTangent), normalize(input.worldBitangent), normalize(input.worldNormal));
  let normalMapVal = textureSample(normalTexture, mySampler, input.uv).rgb * 2.0 - 1.0;
  let N = normalize(tbnMatrix * normalMapVal);

  let metallicRoughness = textureSample(metallicRoughnessTexture, mySampler, input.uv);
  let metallic = metallicRoughness.b;
  let roughness = metallicRoughness.g;

  let V = normalize(frame.cameraPos - input.worldPos);
  let R = reflect(-V, N); 

  let F0 = mix(vec3<f32>(0.04), albedo, metallic);

  // --- 直接光照计算 (简单的方向光) ---
  let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.75));
  let L = lightDir;
  let H = normalize(L + V);
  let NdotL = max(dot(N, L), 0.0);
  let NdotH = max(dot(N, H), 0.0);
  let VdotH = max(dot(V, H), 0.0);
  
  // Cook-Torrance BRDF (Direct Light)
  let alpha = roughness * roughness;
  let alpha2 = alpha * alpha;
  let D_denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
  let D = alpha2 / max(PI * D_denom * D_denom, 0.0001); // NDF
  
  let k_direct = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  let G_V = max(dot(N, V), 0.0) / (max(dot(N, V), 0.0) * (1.0 - k_direct) + k_direct);
  let G_L = NdotL / (NdotL * (1.0 - k_direct) + k_direct);
  let G = G_V * G_L; // Geometry
  
  let F = fresnelSchlick(VdotH, F0); // Fresnel
  
  let kS = F;
  let kD = (vec3<f32>(1.0) - kS) * (1.0 - metallic);
  
  let specularDirect = (D * G * F) / (4.0 * max(dot(N, V), 0.0) * NdotL + 0.001);
  let directLightColor = vec3<f32>(3.0); // 强度
  let directLighting = (kD * albedo / PI + specularDirect) * directLightColor * NdotL;

  // --- IBL (程序化环境光) ---
  
  // 1. 漫反射部分 (Diffuse Irradiance)
  // 使用高 mipmap level 模拟模糊的 irradiance map。WebGPU 默认 cubemap 有 mipchain。
  // 注意：需要确保 cubemap 生成了 mipmaps 或者在采样器中开启了。
  // 这里我们假设使用较大的 LOD 来近似 Diffuse。
  // 为了修正坐标系翻转，Z 取反
  let N_lookup = vec3<f32>(N.x, N.y, -N.z);
  let diffuseIBL = textureSampleLevel(envTexture, envSampler, N_lookup, 6.0).rgb * albedo; // Level 6 for high blur
  
  // 2. 镜面反射部分 (Specular Image Based Lighting)
  // 根据 roughness 选取 mipmap level
  let R_lookup = vec3<f32>(R.x, R.y, -R.z);
  let MAX_REFLECTION_LOD = 6.0;
  let prefilteredColor = textureSampleLevel(envTexture, envSampler, R_lookup, roughness * MAX_REFLECTION_LOD).rgb;
  
  // 简化的 Split-Sum 近似 (这里没有 BRDF LUT，使用简单的菲涅尔近似)
  let F_IBL = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
  let specularIBL = prefilteredColor * F_IBL;

  // IBL 组合
  // kD 应该再次应用以确保能量守恒
  let kD_IBL = (vec3<f32>(1.0) - F_IBL) * (1.0 - metallic);
  let ambient = kD_IBL * diffuseIBL + specularIBL;

  var finalColor = ambient + directLighting;
  
  // Tone Mapping (Reinhard) & Gamma Correction
  finalColor = finalColor / (finalColor + vec3<f32>(1.0));
  finalColor = pow(finalColor, vec3<f32>(1.0/2.2));

  return vec4<f32>(finalColor, 1.0);
}