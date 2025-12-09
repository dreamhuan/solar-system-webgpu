import type { PlanetData } from "./types";

// --- 物理常数 ---
export const EARTH_BASE_RADIUS = 1.0;

// 关键修改：1 AU (地球到太阳的平均距离) 约为 23,455 倍地球半径
// 这决定了真实的宇宙空旷程度
export const AU_TO_EARTH_RADIUS = 23455.0;

export const SOLAR_SYSTEM: PlanetData[] = [
  {
    name: "Sun",
    // 艺术模式 (假数据，为了好看)
    artisticRadius: 3.0,
    artisticDistance: 0,
    // 真实模式 (基于地球半径=1.0)
    realRadius: 109.0, // 太阳半径是地球的109倍
    realDistance: 0,
    speed: 0,
    color: [1, 1, 0.8],
    texIndex: 0,
    initialAngle: 0,
  },
  {
    name: "Mercury",
    artisticRadius: 0.38,
    artisticDistance: 6.0,
    realRadius: 0.38,
    realDistance: 0.39, // 单位：AU
    speed: 4.1,
    color: [1, 1, 1],
    texIndex: 1,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Venus",
    artisticRadius: 0.95,
    artisticDistance: 10.0,
    realRadius: 0.95,
    realDistance: 0.72,
    speed: 1.6,
    color: [1, 1, 1],
    texIndex: 2,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Earth",
    artisticRadius: 1.0,
    artisticDistance: 15.0,
    realRadius: 1.0,
    realDistance: 1.0, // 1.0 AU
    speed: 1.0,
    color: [1, 1, 1],
    texIndex: 3,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Mars",
    artisticRadius: 0.53,
    artisticDistance: 20.0,
    realRadius: 0.53,
    realDistance: 1.52,
    speed: 0.53,
    color: [1, 1, 1],
    texIndex: 4,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Jupiter",
    artisticRadius: 2.2,
    artisticDistance: 28.0,
    realRadius: 11.2,
    realDistance: 5.2,
    speed: 0.3,
    color: [1, 1, 1],
    texIndex: 5,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Saturn",
    artisticRadius: 2.0,
    artisticDistance: 36.0,
    realRadius: 9.45,
    realDistance: 9.54,
    speed: 0.2,
    color: [1, 1, 1],
    texIndex: 6,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Uranus",
    artisticRadius: 1.5,
    artisticDistance: 44.0,
    realRadius: 4.0,
    realDistance: 19.2,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 7,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Neptune",
    artisticRadius: 1.4,
    artisticDistance: 52.0,
    realRadius: 3.88,
    realDistance: 30.06,
    speed: 0.1,
    color: [1, 1, 1],
    texIndex: 8,
    initialAngle: Math.random() * 6,
  },
  {
    name: "Moon",
    artisticRadius: 0.2,
    artisticDistance: 2.0,
    realRadius: 0.27,
    realDistance: 0.00257, // AU
    speed: 12.0, // Much faster orbit
    color: [1, 1, 1],
    texIndex: 9,
    initialAngle: Math.random() * 6,
    parentName: "Earth",
  },
];

export const TEXTURE_URLS = SOLAR_SYSTEM.map((p) => `${p.name}.jpg`);
