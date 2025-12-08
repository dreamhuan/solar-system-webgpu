struct Uniforms {
  viewProjectionMatrix : mat4x4 < f32>,
  globalTime : f32,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4 < f32>,
  @location(0) Color : vec3 < f32>,
  @location(1) Normal : vec3 < f32>,
}

@vertex
fn vs_main(
@location(0) position : vec3 < f32>,
@location(1) normal : vec3 < f32>,
  //实例数据从 Location 2 开始
@location(2) i_radius : f32,
@location(3) i_distance : f32,
@location(4) i_speed : f32,
@location(5) i_color : vec3 < f32>,
@location(6) i_initialAngle : f32
) -> VertexOutput {
  var output : VertexOutput;

  //计算轨道运动
  let angle = i_initialAngle + uniforms.globalTime * i_speed * 0.1;

  //简单的圆周运动
  var orbitPos = vec3 < f32 > (0.0);
  if (i_distance > 0.001)
  {
    orbitPos = vec3 < f32 > (cos(angle) * i_distance, 0.0, sin(angle) * i_distance);
  }

  //模型变换：先缩放(radius)，再平移(orbitPos)
  let worldPosition = (position * i_radius) + orbitPos;

  output.Position = uniforms.viewProjectionMatrix * vec4 < f32 > (worldPosition, 1.0);
  output.Color = i_color;
  output.Normal = normal;

  return output;
}

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4 < f32> {
  //简单的漫反射光照
  let lightDir = normalize(vec3 < f32 > (0.5, 1.0, 0.5));
  let diffuse = max(dot(input.Normal, lightDir), 0.2);

  //太阳(原点物体)不需要阴影，让它亮一点
  var finalColor = input.Color * diffuse;

  return vec4 < f32 > (finalColor, 1.0);
}
