// Oyun yapılandırması
const CONFIG = {
  // Oyun dünyası
  BLOCK_SIZE: 32,
  WORLD_WIDTH: 100,  // 100 blok genişlik
  WORLD_HEIGHT: 54,  // 54 blok yükseklik
  
  // Fizik
  GRAVITY: 0.5,
  FRICTION: 0.8,
  TERMINAL_VELOCITY: 10,
  JUMP_FORCE: -12,
  
  // Oyuncu
  PLAYER_SPEED: 5,
  PLAYER_WIDTH: 0.8, // Blok genişliğinin çarpanı
  PLAYER_HEIGHT: 1,  // Blok yüksekliğinin çarpanı (1 blok yüksekliğinde)
  
  // Kamera
  MIN_ZOOM: 0.5,  // Minimum zoom seviyesi
  MAX_ZOOM: 2.0,  // Maximum zoom seviyesi
  ZOOM_SPEED: 0.1, // Zoom hızı
  
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
    9: { name: "Tuğla", color: "#8B4513", solid: true }
  }
}; 