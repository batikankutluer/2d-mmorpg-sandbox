// Blok tipi arayüzü
interface BlockType {
  name: string;
  color: string;
  solid: boolean;
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

  // Fizik
  GRAVITY: number;
  FRICTION: number;
  TERMINAL_VELOCITY: number;
  JUMP_FORCE: number;

  // Oyuncu
  PLAYER_SPEED: number;
  PLAYER_WIDTH: number;
  PLAYER_HEIGHT: number;

  // Kamera
  MIN_ZOOM: number;
  MAX_ZOOM: number;
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
  WORLD_HEIGHT: 54, // 54 blok yükseklik

  // Fizik
  GRAVITY: 0.12, // Daha düşük yerçekimi
  FRICTION: 0.96, // Daha yüksek sürtünme
  TERMINAL_VELOCITY: 3.5, // Daha düşük terminal hız
  JUMP_FORCE: -3.5, // Daha düşük zıplama kuvveti

  // Oyuncu
  PLAYER_SPEED: 1.0, // Daha düşük hız
  PLAYER_WIDTH: 1, // Tam kare
  PLAYER_HEIGHT: 1, // 1 blok yüksekliğinde

  // Kamera
  MIN_ZOOM: 0.5, // Minimum zoom seviyesi
  MAX_ZOOM: 2.0, // Maximum zoom seviyesi
  ZOOM_SPEED: 0.1, // Zoom hızı
  
  // Oyun döngüsü
  FRAME_RATE: 60, // Hedef FPS
  TIME_STEP: 1000 / 60, // Sabit zaman adımı (ms)
  MAX_DELTA_TIME: 20, // Maksimum delta time (ms)
  PHYSICS_ITERATIONS: 6, // Fizik hesaplama iterasyon sayısı

  // Blok tipleri
  BLOCK_TYPES: {
    0: { name: "Hava", color: "transparent", solid: false },
    1: { name: "Toprak", color: "brown", solid: true },
    2: { name: "Taş", color: "gray", solid: true },
    3: { name: "Ahşap", color: "saddlebrown", solid: true },
    4: { name: "Çim", color: "green", solid: true },
    5: { name: "Kum", color: "sandybrown", solid: true },
    6: { name: "Su", color: "rgba(0, 100, 255, 0.5)", solid: false },
    7: { name: "Lav", color: "orangered", solid: false },
    8: { name: "Kapı", color: "white", solid: false },
    9: { name: "Tuğla", color: "#8B4513", solid: true },
  },
};

export default CONFIG; 