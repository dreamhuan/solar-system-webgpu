// src/camera.ts
import { mat4, vec3 } from "gl-matrix";

export class OrbitCamera {
  // 核心属性
  public viewMatrix: mat4;
  public eye: vec3; // 相机位置
  public target: vec3; // 观察点（旋转中心）
  public up: vec3; // 上方向

  // 极坐标参数 (用于旋转)
  private radius: number;
  private theta: number; // 水平角度
  private phi: number; // 垂直角度

  // 保存初始值用于重置
  private initialRadius: number;

  // 交互状态
  private isDragging: boolean = false;
  private isPanning: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private canvas: HTMLCanvasElement;

  // 配置参数
  public sensitivity: number = 0.005; // 旋转灵敏度
  public zoomSpeed: number = 0.001; // 缩放速度
  public minDistance: number = 2.0; // 最近距离
  public maxDistance: number = 500.0; // 最远距离

  constructor(canvas: HTMLCanvasElement, initialRadius: number = 60) {
    this.canvas = canvas;
    this.viewMatrix = mat4.create();

    // 初始化向量
    this.eye = vec3.create();
    this.target = vec3.fromValues(0, 0, 0); // 默认看原点
    this.up = vec3.fromValues(0, 1, 0);

    // 保存初始半径
    this.initialRadius = initialRadius;
    this.radius = initialRadius;
    this.theta = Math.PI / 2;
    this.phi = Math.PI / 3;

    this.bindEvents();
    this.updateMatrix();
  }

  // --- 重置功能 ---
  public reset() {
    // 1. 重置目标点为原点
    vec3.set(this.target, 0, 0, 0);

    // 2. 重置角度和距离
    this.radius = this.initialRadius;
    this.theta = Math.PI / 2;
    this.phi = Math.PI / 3;

    // 3. 立即更新矩阵
    this.updateMatrix();
  }

  // 计算相机的基向量 (Right, Up, Forward)
  private getCameraBasis() {
    // 1. Forward (Eye -> Target) 注意：OpenGL 习惯是 Target - Eye 是 -Z，这里方便计算我们用 Eye -> Target
    const forward = vec3.create();
    vec3.subtract(forward, this.target, this.eye);
    vec3.normalize(forward, forward);

    // 2. Right (Forward x WorldUp)
    const right = vec3.create();
    vec3.cross(right, forward, this.up);
    vec3.normalize(right, right);

    // 3. Camera Up (Right x Forward)
    const camUp = vec3.create();
    vec3.cross(camUp, right, forward);
    vec3.normalize(camUp, camUp);

    return { forward, right, camUp };
  }

  private bindEvents() {
    // 禁用右键菜单
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // --- 键盘监听 (Space 重置) ---
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        this.reset();
      }
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);

      if (e.button === 0) {
        // 左键平移
        this.isPanning = true;
      } else if (e.button === 2) {
        // 右键旋转
        this.isDragging = true;
      }
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.isDragging && !this.isPanning) return;

      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.isDragging) {
        // --- 旋转逻辑 ---
        this.theta -= deltaX * this.sensitivity;
        this.phi -= deltaY * this.sensitivity;

        // 限制垂直角度，防止翻转 (Gimbal Lock 预防)
        const epsilon = 0.01;
        this.phi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.phi));
      }

      if (this.isPanning) {
        // 左键平移
        const { right, camUp } = this.getCameraBasis();

        // 移动速度随距离变化，越远动得越快
        const panSpeed = this.radius * 0.0015;

        const moveX = vec3.create();
        const moveY = vec3.create();
        vec3.scale(moveX, right, -deltaX * panSpeed);
        vec3.scale(moveY, camUp, deltaY * panSpeed);

        vec3.add(this.target, this.target, moveX);
        vec3.add(this.target, this.target, moveY);
      }

      this.updateMatrix();
    });

    this.canvas.addEventListener("pointerup", (e) => {
      this.isDragging = false;
      this.isPanning = false;
      this.canvas.releasePointerCapture(e.pointerId);
    });

    // --- 改动 2: 以鼠标为中心缩放 ---
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();

        // 1. 计算缩放前的基础数据
        const oldRadius = this.radius;
        // 滚轮增量 (deltaY 通常是 100 或 -100)
        const deltaRadius = e.deltaY * this.zoomSpeed * oldRadius;
        let newRadius = oldRadius + deltaRadius;

        // 限制范围
        newRadius = Math.max(
          this.minDistance,
          Math.min(this.maxDistance, newRadius)
        );

        // 2. 计算需要偏移 Target 多少，才能保持鼠标下的点不动
        // 获取 NDC 坐标 (Normalized Device Coordinates, -1 到 1)
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1); // Y轴翻转

        // 获取当前可视平面的尺寸 (World Units)
        // main.ts 里 FOV 是 72度 (2*PI/5)。 半角 = 36度。
        const fov = (2 * Math.PI) / 5;
        const aspect = rect.width / rect.height;

        // tan(fov/2) = (height/2) / dist
        const tanHalfFov = Math.tan(fov / 2);

        // 当前视口在世界空间的高度的一半
        const visibleHeightHalf = oldRadius * tanHalfFov;
        const visibleWidthHalf = visibleHeightHalf * aspect;

        // 缩放比例 (Zoom Ratio)
        // 如果我们拉近了 (new < old)，这个系数是正的，Target 应该向鼠标方向移动
        const ratio = (oldRadius - newRadius) / oldRadius;

        // 计算位移向量
        const { right, camUp } = this.getCameraBasis();

        const shiftX = vec3.create();
        const shiftY = vec3.create();

        // X轴位移: Right向量 * 鼠标NDCX * 半宽 * 比例
        vec3.scale(shiftX, right, mouseX * visibleWidthHalf * ratio);
        // Y轴位移: Up向量 * 鼠标NDCY * 半高 * 比例
        vec3.scale(shiftY, camUp, mouseY * visibleHeightHalf * ratio);

        // 更新 Target
        vec3.add(this.target, this.target, shiftX);
        vec3.add(this.target, this.target, shiftY);

        // 更新 Radius
        this.radius = newRadius;

        this.updateMatrix();
      },
      { passive: false }
    );
  }

  // 核心数学：将极坐标转为笛卡尔坐标，并生成 LookAt 矩阵
  public updateMatrix() {
    // x = r * sin(phi) * cos(theta)
    // z = r * sin(phi) * sin(theta)
    // y = r * cos(phi)
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    // 计算相对于 Target 的偏移量
    const offsetX = this.radius * sinPhi * cosTheta;
    const offsetY = this.radius * cosPhi;
    const offsetZ = this.radius * sinPhi * sinTheta;

    // 更新 Eye 位置 (Target + Offset)
    vec3.set(
      this.eye,
      this.target[0] + offsetX,
      this.target[1] + offsetY,
      this.target[2] + offsetZ
    );

    // 生成 View Matrix
    mat4.lookAt(this.viewMatrix, this.eye, this.target, this.up);
  }
}
