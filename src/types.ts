// types.ts
export interface PlanetData {
  name: string;
  radius: number; // 相对于地球半径 (Earth = 1)
  distance: number; // 距离太阳的 AU (Earth = 1)
  speed: number; // 公转速度 (相对于地球)
  color: [number, number, number];
}

export const SOLAR_SYSTEM: PlanetData[] = [
  { name: "Sun", radius: 109, distance: 0, speed: 0, color: [1.0, 1.0, 0.0] },
  {
    name: "Mercury",
    radius: 0.38,
    distance: 0.39,
    speed: 4.1,
    color: [0.7, 0.7, 0.7],
  },
  {
    name: "Venus",
    radius: 0.95,
    distance: 0.72,
    speed: 1.6,
    color: [0.9, 0.8, 0.2],
  },
  {
    name: "Earth",
    radius: 1.0,
    distance: 1.0,
    speed: 1.0,
    color: [0.0, 0.5, 1.0],
  },
  {
    name: "Mars",
    radius: 0.53,
    distance: 1.52,
    speed: 0.53,
    color: [1.0, 0.2, 0.0],
  },
  // ... 其他行星
];
