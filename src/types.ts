export interface PlanetData {
  name: string;

  // A. 艺术数据 (默认显示，好看但不真实)
  artisticRadius: number;
  artisticDistance: number;

  // B. 科学数据 (真实的相对比例)
  // realRadius: 以地球半径(1.0)为基准
  // realDistance: 以地球到太阳距离(1.0 AU)为基准
  realRadius: number;
  realDistance: number;

  speed: number;
  color: [number, number, number];
  texIndex: number;
  initialAngle: number;
  parentName?: string;
}
