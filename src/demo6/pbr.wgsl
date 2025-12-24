// src/demo/pbr.wgsl - 最终版

// PI 常量
const PI = 3.1415926535;

// --- 绑定资源 ---
// 这个结构体必须与 main.ts 中 uniformBuffer 的布局完全匹配
struct Uniforms {
  mvpMatrix: mat4x4<f32>,     // at offset 0
  modelMatrix: mat4x4<f32>,   // at offset 64
  cameraPos: vec3<f32>,       // at offset 128
};

// 资源绑定
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var colorTexture: texture_2d<f32>;
@group(0) @binding(3) var normalTexture: texture_2d<f32>;
// 【新增】接收金属度和粗糙度贴图
@group(0) @binding(4) var metalnessTexture: texture_2d<f32>;
@group(0) @binding(5) var roughnessTexture: texture_2d<f32>;

// VertexOutput 结构体和 vs_main 函数 (与法线贴图版本完全一样)
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
  @location(0) pos: vec3<f32>, // 位置
  @location(1) normal: vec3<f32>, // 法线
  @location(2) uv: vec2<f32>, // 材质坐标
  @location(3) tangent: vec3<f32> // 切线
) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvpMatrix * vec4<f32>(pos, 1.0);
  output.uv = uv;

  // 世界坐标下法线矢量
  let worldNormal = normalize((uniforms.modelMatrix * vec4<f32>(normal, 0.0)).xyz);
  // 世界坐标下切线矢量
  let worldTangent = normalize((uniforms.modelMatrix * vec4<f32>(tangent, 0.0)).xyz);
  // 叉积得到世界坐标下副切线矢量，3个矢量正交。理论上worldNormal和worldTangent正交且长为1，叉积结果长度也为1，不需要normalize
  let worldBitangent = cross(worldNormal, worldTangent);

  // 用3个正交矢量张成切线空间映射矩阵
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


// --- PBR 片元着色器 ---
// BRDF 是 Bidirectional Reflectance Distribution Function 的缩写。中文通常翻译为双向反射分布函数。
// BRDF 是一个数学函数，它回答了下面这个看似简单、实则复杂的问题：
// “当一束光以某个方向 (L) 照射到一个物体表面的某一点上时，这个点会将多少比例的光能，反射到另一个特定的方向 (V) 上去？”
// 我们来拆解一下这个名字：
// Bidirectional (双向):
// 因为它同时考虑了两个方向：光的入射方向 (L) 和出射（观察）方向 (V)。改变其中任何一个方向，反射的结果都可能不同。
// Reflectance (反射):
// 它描述的是光的反射现象。
// Distribution (分布):
// 它描述了反射出去的光能在空间中的分布情况。
// 一个镜面，会把所有能量都集中反射到一个方向；而一个粗糙的表面，会把能量向四面八方散射开来。BRDF 就是用来量化这种“分布”的函数。
// Function (函数):
// 它是一个函数，输入是入射光方向 L、出射光方向 V、表面法线 N，以及一系列描述表面材质物理属性的参数（比如 albedo, roughness, metallic）。
// 它的输出是一个标量或颜色值，代表了从 L 到 V 这个特定路径的反射光比例。
// BRDF 在 PBR 中的角色
// 在 PBR 中，我们使用的 Cook-Torrance 模型就是一个微表面 BRDF。
// 不同的 BRDF 模型（比如 Lambertian, Phong, Blinn-Phong, Cook-Torrance）就是用不同的数学公式来近似模拟这个物理过程，以在真实感和性能之间取得平衡。Cook-Torrance 是目前实时渲染中效果最好、也最常用的一种。
@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // --- 1. 材质属性采样 ---
  // 材质基础颜色（纹理贴图）
  let albedo = textureSample(colorTexture, mySampler, input.uv).rgb;
  // 微表面法向量（法线贴图）（颜色通道为0~1，法线向量范围-1~1，所以最终结果*2-1）
  let tangentSpaceNormal = normalize(textureSample(normalTexture, mySampler, input.uv).rgb * 2.0 - 1.0);
  
  // 【修改】从独立的贴图中采样
  // 金属贴图，灰度图rgb一致，习惯性取个r，范围[0, 1]，代表了当前像素点的金属性。
  let metallic: f32 = textureSample(metalnessTexture, mySampler, input.uv).r;
  // 粗糙度贴图，同样只取r，范围 [0, 1]，代表了当前像素点的微观表面粗糙度
  let roughness: f32 = textureSample(roughnessTexture, mySampler, input.uv).r;

  // --- 2. 向量准备 (都在切线空间) ---
  // 重命名：Normal 法线向量
  let N = tangentSpaceNormal;
  // View 观察方向向量
  let V = normalize(input.tangentSpaceViewDirection);
  // 为了简单，我们依然使用一个固定的光源
  // Light 光源方向向量
  let L = normalize(input.tangentSpaceLightDirection);
  // 半角向量 (Halfway Vector)
  // 为什么需要 H？: 这是 Blinn-Phong 模型对传统 Phong 模型的一个重要优化，PBR 也借鉴了这个思想。
  // 在物理上，当一个微观镜面的法线，正好指向这个半角向量 H 的方向时，它就能完美地将来自 L 方向的光，反射到 V 方向（也就是我们的眼睛）。
  // 因此，H 向量对于计算镜面反射高光至关重要。我们可以把 H 看作是“产生最强高光的理想法线方向”。
  let H = normalize(L + V);

  // 法线与光向的点积。这是漫反射的核心，代表了有多少光线“正面”照射到表面上。
  let NdotL = max(dot(N, L), 0.0);
  // 法线与视向的点积。在几何遮蔽 G 的计算中会用到，代表了我们观察表面的角度。
  let NdotV = max(dot(N, V), 0.0);
  // 法线与半角向量的点积。这是法线分布函数 D 的核心，代表了当前表面的微观法线，有多接近于那个“理想的”高光反射方向。
  let NdotH = max(dot(N, H), 0.0);
  // 视向与半角向量的点积。这是菲涅尔效应 F 的核心，代表了我们的观察角度。
  let VdotH = max(dot(V, H), 0.0);

  // 增强光源亮度以获得更好的效果
  let lightColor = vec3<f32>(1.0, 1.0, 0.95) * 3.0;

  // --- 3. PBR 光照计算 (Cook-Torrance BRDF) ---

  // === F - 菲涅尔效应 (Fresnel Schlick Approximation) ===
  // 它回答的问题: 
  // 当一束光以某个角度撞击到一个表面时，有多大比例的光会被镜面反射 (弹开)，又有多大比例的光会折射 (钻进去) 并参与漫反射？
  // 几乎所有材质，在掠射角 (grazing angles)（视线几乎与表面平行）下的反射率都会急剧增加，趋近于 100%。
  // 在 PBR 中，菲涅尔效应有两个关键作用：
  // 区分金属 (Metals) 和电介质 (Dielectrics / Non-metals)。 实现“边缘高亮”的掠射角反射效果。

  // F0: 代表了当光线垂直照射 (0 度角) 到表面时的反射率。
  // 电介质 (非金属):
  // F0 值通常非常低。大部分非金属（水、玻璃、塑料、木头、皮肤）的 F0 都在 0.02 到 0.05 之间。
  // 这意味着，当光垂直照在塑料上时，只有大约 4% 的光被直接反射，另外 96% 的光都钻进去参与了漫反射，所以我们能清楚地看到塑料本身的颜色。
  // 在我们的代码中，我们用一个固定的 vec3(0.04) 来代表所有非金属的 F0 值。这是一个被广泛接受的、效果很好的近似值。
  // 金属:
  // F0 值非常高。金属在垂直入射时，就能反射 60% 到 90% 的光。
  // 更重要的是，金属的 F0 是带色彩的。比如，黄金的 F0 会强烈反射黄光，吸收蓝光，所以它的反射本身就是金色的。
  // 在 PBR 中，我们做一个简化：我们认为金属的 F0 值就是它的基础色 (Albedo)。

  // mix(A, B, t): 线性插值函数。t=0 时返回 A，t=1 时返回 B。 基于金属性(metallic)返回非金属色（4%白光）和金属色（当前颜色）的混合
  let F0 = mix(vec3<f32>(0.04), albedo, metallic);
  // 这是著名的 Schlick 菲涅尔近似公式，它是一个计算成本极低，但效果非常逼真的菲涅尔效应模拟: R = R0 + (1-R0)(1-cosθ)^5
  // 这个计算出的 fresnel (vec3) 将在后续计算中扮演“能量分配官”的角色：
  let fresnel = F0 + (vec3<f32>(1.0) - F0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);


  // === D - 法线分布 (NDF - Trowbridge-Reitz GGX) ===
  // 它回答的问题:
  // 在一个由无数微小镜面组成的粗糙表面上，假设光线以 L 方向射入，我们要从 V 方向观察，那么，有多少比例的微表面，其朝向正好是那个能完美反射光线的半角向量 H 的方向？
  // 微表面理论回顾:
  // 一个光滑的表面（如镜子），其微表面的法线几乎都指向同一个方向（宏观法线 N 的方向）。
  // 一个粗糙的表面（如石头），其微表面的法线朝向是随机混乱的。
  // NDF 的作用:
  // NDF 就是一个数学函数，它根据粗糙度 (roughness) 参数，来描述这些微表面法线的统计学分布情况。
  // 低 roughness: NDF 会给出一个非常集中的分布。绝大多数微表面的法线都紧密地聚集在宏观法线 N 的周围。
  // 高 roughness: NDF 会给出一个非常分散的分布。微表面的法线朝向非常混乱，分布在一个很广的角度范围内。
  let alpha = roughness * roughness;
  let alpha2 = alpha * alpha;
  let D_denom = PI * pow(NdotH * NdotH * (alpha2 - 1.0) + 1.0, 2.0);
 
  // 这是 GGX 公式的最终形式 D = α² / (π * ((N·H)²(α²-1)+1)²)。
  // 当 roughness 很低时 (alpha2 接近 0):
  // D 的值只有在 NdotH 极其接近 1 的时候才不为 0，而在其他角度会急剧衰减为 0。
  // 视觉效果: 形成一个非常小、非常亮、非常集中的高光光斑。
  // 当 roughness 很高时 (alpha2 接近 1):
  // 分母的变化会变得平缓，使得 D 的值在一个很宽的 NdotH 角度范围内，都能保持一个可观的值。
  // 视觉效果: 形成一个巨大、模糊、强度较低的高光“光晕”。

  // D 函数的输出值，可以被直观地理解为“微表面法线与半角向量 H 对齐的概率密度”。这个值会直接作为镜面反射 (specular) 计算中的一个核心乘数。
  // specular = (D * G * F) / Denominator
  // D 值大，意味着有很高比例的微表面正好能将光反射到你眼中，所以镜面反射强度高。
  // D 值小，意味着只有很少的微表面能把光反射过来，所以镜面反射强度低。
  // 总结一下，D 函数通过 roughness 参数，完美地控制了高光反射的“形状”，模拟出了从镜面到磨砂表面的平滑过渡。
  let D = alpha2 / max(D_denom, 0.0001); // 防止除以0

  // === G - 几何遮蔽 (Geometry - Schlick-GGX) ===
  // 它回答的问题:
  // 在一个凹凸不平的微观表面上，从光源射入的光线（光路 L），或者从表面反射到眼睛的光线（光路 V），有多大的概率没有被其他微小的凸起给挡住？
  // 表面越粗糙、观察或光照的角度越倾斜，光线被“自我遮挡”的概率就越高。
  // G 函数就是为了模拟这种微观尺度上的自阴影 (self-shadowing) 和自遮蔽 (self-occlusion) 现象。
  //  它的主要作用是修正光照能量，防止在特定情况下（尤其是高粗糙度和掠射角下）物体显得过亮和不真实。
  // 如果没有 G 函数，一个粗糙的物体在边缘处可能会出现一圈不自然的“能量增益”光晕，因为它没有考虑到掠射角下大部分光线其实已经被粗糙的表面结构自身给挡住了。
  // Schlick-GGX 模型
  // 我们使用的是目前业界最常用的 Schlick-GGX 几何遮蔽函数近似。它将 G 函数拆分为两个独立的部分来计算，最后再相乘：
  // 中间变量 roughness∈[0,1]，k∈[0.125,0.5]
  let k_direct = pow(roughness + 1.0, 2.0) / 8.0;
  // 描述从视线方向 (V) 来看的可见性。
  let G_V = NdotV / (NdotV * (1.0 - k_direct) + k_direct);
  // 描述从光源方向 (L) 来看的可见性。
  let G_L = NdotL / (NdotL * (1.0 - k_direct) + k_direct);
  // 最终的可见性是这两者的乘积。 只有当光线既能照到表面 (G_L > 0)，我们又能看到这个表面 (G_V > 0) 时，才会有有效的镜面反射。
  let G = G_V * G_L;

  // === 镜面反射部分 (Specular BRDF) ===
  //   分子部分: 这里我们将三个核心函数的结果相乘。
  // D: 描述了有多少微表面朝向正确。
  // G: 描述了在这些朝向正确的微表面中，有多少没有被遮挡。
  // fresnel: 描述了在这些未被遮挡且朝向正确的微表面上，有多少光被镜面反射了。
  // 这三者的乘积，共同决定了镜面反射的强度和颜色。
  let specularNumerator = D * G * fresnel;
  //   分母部分: 这是一个归一化因子。
  // 它的目的是为了校正由于视角和光照角度变化而导致的能量变化，确保 BRDF 模型是能量守恒的。
  // + 0.001: 这是一个防止除以零的安全措施。当 NdotV 或 NdotL 接近 0 时（掠射角），分母可能会变成 0，导致计算错误。
  let specularDenominator = 4.0 * NdotV * NdotL + 0.001;
  //   这就是最终的 Cook-Torrance 镜面 BRDF。
  // specular 是一个 vec3，它描述了这个表面对于镜面反射的响应方式——即它的“材质”。它本身还不是最终的颜色。
  let specular = specularNumerator / specularDenominator;

  // === 漫反射部分 (Diffuse BRDF) ===
  //    能量守恒：被镜面反射的光就不会被漫反射
  //   kS (Coefficient Specular) 是镜面反射系数。我们直接使用 fresnel 的结果来代表它。
  let kS = fresnel;
  //   kD (Coefficient Diffuse) 是漫反射系数。这是实现能量守恒的关键。
  // (vec3<f32>(1.0) - kS): 这部分计算的是被折射进物体内部的光的比例。总能量是 1.0，被 kS 镜面反射掉了，剩下的 1.0 - kS 就进入了物体内部。
  // * (1.0 - metallic): 这是一个关键的物理特性。
  // 金属 (metallic = 1.0): 1.0 - metallic 结果为 0。这意味着 kD 永远是 0。纯金属没有漫反射。所有被折射进金属内部的光都会被立即吸收并转化为热能，不会再散射出来。
  // 非金属 (metallic = 0.0): 1.0 - metallic 结果为 1。kD 就等于 1.0 - kS。这部分能量会在物体内部散射，形成漫反射。
  let kD = (vec3<f32>(1.0) - kS) * (1.0 - metallic);
  //   这就是最基础的 Lambertian 漫反射 BRDF。
  // albedo: 物体本身的颜色决定了散射出来的光是什么颜色。
  // * kD: 只有非金属、且未被镜面反射的能量，才参与漫反射。
  // / PI: 这是一个归一化因子，用于确保一个表面反射的总能量不会超过它接收到的能量。
  let diffuse = kD * albedo / PI;

  // 组合直接光照
  // (diffuse + specular): 这是总的 BRDF，它完整地描述了这个表面材质在给定视角和光照下的所有反射特性（漫反射+镜面反射）。
  // * lightColor: 将材质的反射特性与入射光的颜色相乘。
  // * NdotL: 最后，将结果乘以光线入射的强度因子 NdotL。如果光是斜着照过来的，那么单位面积接收到的能量就少，所以最终反射出来的光也应该更暗。
  let directLighting = (diffuse + specular) * lightColor * NdotL;

  // 环境光 (简化 IBL)
  let ambient = vec3<f32>(0.03) * albedo;
  let finalColor = ambient + directLighting;

  // 我们只关心颜色，所以不做 HDR 和色调映射
  // return vec4<f32>(finalColor / (finalColor + vec3<f32>(1.0)), 1.0); // 简单的 Reinhard 色调映射
  return vec4<f32>(finalColor, 1.0);
}
