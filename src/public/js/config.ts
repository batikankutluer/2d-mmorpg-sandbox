import { BLOCKS, getBlockName } from "./blocks.js";

// Blok tipi arayüzü
interface BlockType {
  name: string;
  color: string;
  solid: boolean;
  rarity?: number;
  texture?: string;

  isPlatform?: boolean; // Platform özelliği (opsiyonel)
}

// Blok tipleri sözlüğü arayüzü
interface BlockTypes {
  [key: number]: BlockType;
}

// Oyun yapılandırması arayüzü
interface GameConfig {
  // Oyun dünyası
  BLOCK_SIZE: number;
  WORLD_WIDTH: number;
  WORLD_HEIGHT: number;
  BEDROCK_HEIGHT: number;
  // Fizik
  GRAVITY: number;
  FRICTION: number;
  TERMINAL_VELOCITY: number;
  JUMP_HEIGHT: number; // Blok cinsinden zıplama yüksekliği

  // Oyuncu
  PLAYER_SPEED: number;
  PLAYER_WIDTH: number;
  PLAYER_HEIGHT: number;

  // Kamera
  MIN_ZOOM: number;
  MAX_ZOOM: number;
  STANDARD_ZOOM: number;
  ZOOM_SPEED: number;

  // Oyun döngüsü
  FRAME_RATE: number;
  TIME_STEP: number;
  MAX_DELTA_TIME: number;
  PHYSICS_ITERATIONS: number;

  // Blok tipleri
  BLOCK_TYPES: BlockTypes;
}

// Oyun yapılandırması
const CONFIG: GameConfig = {
  // Oyun dünyası
  BLOCK_SIZE: 32,
  WORLD_WIDTH: 100, // 100 blok genişlik
  WORLD_HEIGHT: 60, // 60 blok yükseklik
  BEDROCK_HEIGHT: 6, // 6 blok yükseklik

  // Fizik
  GRAVITY: 0.05, // Daha düşük yerçekimi (2.5 blok zıplama için)
  FRICTION: 0.9, // Daha yüksek sürtünme
  TERMINAL_VELOCITY: 3.5, // Daha düşük terminal hız
  JUMP_HEIGHT: 2.5, // Blok cinsinden zıplama yüksekliği

  // Oyuncu
  PLAYER_SPEED: 1.25, // Daha düşük hız
  PLAYER_WIDTH: 0.8, // 1 bloktan daha dar
  PLAYER_HEIGHT: 0.8, // 1 blok yüksekliğinde

  // Kamera
  MIN_ZOOM: 1.5, // Minimum zoom seviyesi
  MAX_ZOOM: 4.0, // Maximum zoom seviyesi
  STANDARD_ZOOM: 2.0, // Standart zoom seviyesi
  ZOOM_SPEED: 0.1, // Zoom hızı

  // Oyun döngüsü
  FRAME_RATE: 60, // Hedef FPS
  TIME_STEP: 1000 / 60, // Sabit zaman adımı (ms)
  MAX_DELTA_TIME: 20, // Maksimum delta time (ms)
  PHYSICS_ITERATIONS: 6, // Fizik hesaplama iterasyon sayısı

  // Blok tipleri
  BLOCK_TYPES: {
    [BLOCKS.AIR]: {
      name: getBlockName(BLOCKS.AIR),
      color: "transparent",
      solid: false,
    },
    [BLOCKS.DIRT]: {
      name: getBlockName(BLOCKS.DIRT),
      color: "#8B4513",
      solid: true,
    },
    [BLOCKS.STONE]: {
      name: getBlockName(BLOCKS.STONE),
      color: "gray",
      solid: true,
    },
    [BLOCKS.WOOD]: {
      name: getBlockName(BLOCKS.WOOD),
      color: "saddlebrown",
      solid: true,
    },
    [BLOCKS.GRASS]: {
      name: getBlockName(BLOCKS.GRASS),
      color: "green",
      solid: true,
    },
    [BLOCKS.SAND]: {
      name: getBlockName(BLOCKS.SAND),
      color: "sandybrown",
      solid: true,
    },
    [BLOCKS.WATER]: {
      name: getBlockName(BLOCKS.WATER),
      color: "rgba(0, 100, 255, 0.5)",
      solid: false,
    },
    [BLOCKS.LAVA]: {
      name: getBlockName(BLOCKS.LAVA),
      color: "orangered",
      solid: false,
    },
    [BLOCKS.DOOR]: {
      name: getBlockName(BLOCKS.DOOR),
      color: "white",
      solid: false,
    },
    [BLOCKS.BRICK]: {
      name: getBlockName(BLOCKS.BRICK),
      color: "brown",
      solid: true,
    },
    [BLOCKS.WOODEN_PLATFORM]: {
      name: getBlockName(BLOCKS.WOODEN_PLATFORM),
      color: "#D2B48C", // Tan rengi
      solid: true,
      isPlatform: true, // Platform özelliği
      texture: "/public/images/block/5.png", // Ahşap platform texture'ı
    },
    [BLOCKS.BEDROCK]: {
      name: getBlockName(BLOCKS.BEDROCK),
      color: "gray",
      solid: true,
    },
  },
};

export default CONFIG;
