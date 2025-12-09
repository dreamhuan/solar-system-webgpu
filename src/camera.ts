import { mat4, vec3 } from "gl-matrix";

export class OrbitCamera {
  public viewMatrix: mat4;
  public eye: vec3;
  public target: vec3;
  public up: vec3;

  private radius: number;
  private theta: number;
  private phi: number;
  private initialRadius: number;

  private isDragging: boolean = false;
  private isPanning: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private canvas: HTMLCanvasElement;

  public sensitivity: number = 0.005;
  public zoomSpeed: number = 0.001;
  public minDistance: number = 2.0;

  // 修改：大幅增加最大视距，以适应真实比例下的天文距离 (1 AU = 23455)
  // 海王星约 30 AU = 700,000，所以这里设为 2,000,000 以防万一
  public maxDistance: number = 2000000.0;

  constructor(canvas: HTMLCanvasElement, initialRadius: number = 60) {
    this.canvas = canvas;
    this.viewMatrix = mat4.create();
    this.eye = vec3.create();
    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);
    this.initialRadius = initialRadius;
    this.radius = initialRadius;
    this.theta = Math.PI / 2;
    this.phi = Math.PI / 3;

    this.bindEvents();
    this.updateMatrix();
  }

  public reset() {
    vec3.set(this.target, 0, 0, 0);
    this.radius = this.initialRadius;
    this.theta = Math.PI / 2;
    this.phi = Math.PI / 3;
    this.updateMatrix();
  }

  // ... (getCameraBasis, bindEvents, updateMatrix 保持不变，代码复用之前的)
  // 为了节省篇幅，这里假设中间的交互逻辑代码与之前完全一致

  private getCameraBasis() {
    const forward = vec3.create();
    vec3.subtract(forward, this.target, this.eye);
    vec3.normalize(forward, forward);
    const right = vec3.create();
    vec3.cross(right, forward, this.up);
    vec3.normalize(right, right);
    const camUp = vec3.create();
    vec3.cross(camUp, right, forward);
    vec3.normalize(camUp, camUp);
    return { forward, right, camUp };
  }

  private bindEvents() {
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") this.reset();
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
      if (e.button === 0) this.isPanning = true;
      else if (e.button === 2) this.isDragging = true;
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.isDragging && !this.isPanning) return;
      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (this.isDragging) {
        this.theta += deltaX * this.sensitivity;
        this.phi -= deltaY * this.sensitivity;
        const epsilon = 0.01;
        this.phi = Math.max(epsilon, Math.min(Math.PI - epsilon, this.phi));
      }

      if (this.isPanning) {
        const { right, camUp } = this.getCameraBasis();
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
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const oldRadius = this.radius;
        const deltaRadius = e.deltaY * this.zoomSpeed * oldRadius;
        let newRadius = oldRadius + deltaRadius;
        newRadius = Math.max(
          this.minDistance,
          Math.min(this.maxDistance, newRadius)
        );
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        const fov = (2 * Math.PI) / 5;
        const aspect = rect.width / rect.height;
        const tanHalfFov = Math.tan(fov / 2);
        const visibleHeightHalf = oldRadius * tanHalfFov;
        const visibleWidthHalf = visibleHeightHalf * aspect;
        const ratio = (oldRadius - newRadius) / oldRadius;
        const { right, camUp } = this.getCameraBasis();
        const shiftX = vec3.create();
        const shiftY = vec3.create();
        vec3.scale(shiftX, right, mouseX * visibleWidthHalf * ratio);
        vec3.scale(shiftY, camUp, mouseY * visibleHeightHalf * ratio);
        vec3.add(this.target, this.target, shiftX);
        vec3.add(this.target, this.target, shiftY);
        this.radius = newRadius;
        this.updateMatrix();
      },
      { passive: false }
    );
  }

  public updateMatrix() {
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);
    const offsetX = this.radius * sinPhi * cosTheta;
    const offsetY = this.radius * cosPhi;
    const offsetZ = this.radius * sinPhi * sinTheta;
    vec3.set(
      this.eye,
      this.target[0] + offsetX,
      this.target[1] + offsetY,
      this.target[2] + offsetZ
    );
    mat4.lookAt(this.viewMatrix, this.eye, this.target, this.up);
  }
}
