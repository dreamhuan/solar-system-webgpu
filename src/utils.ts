// 生成球体 (保持不变)
export function createSphere(
  radius: number,
  widthSegments: number = 64,
  heightSegments: number = 32
) {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const latitude = (v - 0.5) * Math.PI;
    const cosLat = Math.cos(latitude);
    const sinLat = Math.sin(latitude);

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const longitude = u * 2 * Math.PI;
      const cosLon = Math.cos(longitude);
      const sinLon = Math.sin(longitude);

      // Position
      vertices.push(
        radius * cosLon * cosLat,
        radius * sinLat,
        radius * sinLon * cosLat
      );
      // Normal
      vertices.push(cosLon * cosLat, sinLat, sinLon * cosLat);

      // UV 修正: 1-u 修正镜像, 1-v 修正翻转
      vertices.push(1 - u, 1 - v);
    }
  }

  const stride = widthSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const i0 = y * stride + x;
      const i1 = i0 + 1;
      const i2 = (y + 1) * stride + x;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i2, i3, i1);
    }
  }

  return {
    vertexData: new Float32Array(vertices),
    indexData: new Uint16Array(indices),
    indexCount: indices.length,
  };
}

// 加载纹理 (已修复尺寸报错问题)
export async function loadTextureBitmap(url: string): Promise<ImageBitmap> {
  const width = 2048;
  const height = 1024;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    const blob = await response.blob();
    const rawBitmap = await createImageBitmap(blob);

    // 强制缩放到指定尺寸，防止 WebGPU Copy 越界
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(rawBitmap, 0, 0, width, height);

    return createImageBitmap(canvas);
  } catch (e) {
    console.warn(`Texture load failed: ${url}`);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.font = "bold 100px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(url.replace(".jpg", ""), width / 2, height / 2);
    return createImageBitmap(canvas);
  }
}

// 生成虚线圆环 (保持不变)
export function createDashedCircle(
  segments: number = 256,
  gapRatio: number = 0.5
) {
  const vertices: number[] = [];
  const step = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const angle1 = i * step;
    const angle2 = angle1 + step * gapRatio;
    vertices.push(Math.cos(angle1), 0, Math.sin(angle1));
    vertices.push(Math.cos(angle2), 0, Math.sin(angle2));
  }
  return new Float32Array(vertices);
}
