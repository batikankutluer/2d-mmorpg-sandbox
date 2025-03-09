import CONFIG from "./config.js";
import { BLOCKS } from "./blocks.js";

// Kapı pozisyonu arayüzü
interface DoorPosition {
  x: number;
  y: number;
}

// Dünya sınıfı
class World {
  width: number;
  height: number;
  blocks: number[][];
  doorPosition: DoorPosition;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.blocks = [];
    this.doorPosition = { x: 0, y: 0 }; // Kapı pozisyonu
    this.generate();
  }

  generate(): void {
    // Gökyüzü rengi oyun canvas'ında ayarlanacak

    // Dünyayı oluştur
    for (let y = 0; y < this.height; y++) {
      this.blocks[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Düz zemin seviyesi (resme uygun olarak)
        const groundLevel = Math.floor(this.height * 0.4);

        if (y > groundLevel) {
          // Zemin altı katmanlar
          const depth = y - groundLevel;

          if (depth < 4) {
            // Üst toprak katmanı
            this.blocks[y][x] = BLOCKS.DIRT; // Toprak
          } else if (depth < 10) {
            // Taş katmanı
            if (Math.random() < 0.05) {
              // Nadir kömür/demir madenleri
              this.blocks[y][x] = BLOCKS.STONE; // Taş
            } else {
              this.blocks[y][x] = BLOCKS.DIRT; // Toprak
            }
          } else {
            // En derin katman - lav ve değerli madenler
            if (Math.random() < 0.1) {
              this.blocks[y][x] = BLOCKS.STONE; // Taş
            } else {
              this.blocks[y][x] = BLOCKS.DIRT; // Toprak
            }
          }
        } else {
          // Zemin üstü - hava
          this.blocks[y][x] = BLOCKS.AIR;
        }
      }
    }

    // Çim katmanı ekle
    this.addGrassLayer();

    // Kapı ekle
    this.addDoor();

    // Lav havuzları ekle
    this.generateLavaPools();

    // Rastgele kum alanları ekle
    this.generateSandAreas();
  }

  addGrassLayer(): void {
    const groundLevel = Math.floor(this.height * 0.4);

    // Zemin seviyesindeki toprak bloklarını çim ile değiştir
    for (let x = 0; x < this.width; x++) {
      this.blocks[groundLevel][x] = BLOCKS.GRASS; // Çim
    }
  }

  addDoor(): void {
    const groundLevel = Math.floor(this.height * 0.4);

    // Kapı için uygun bir yer bul (düz bir alan)
    let doorX = Math.floor(this.width * 0.2); // Dünya başlangıcından biraz uzakta

    // Kapı pozisyonunu kaydet
    this.doorPosition = { x: doorX, y: groundLevel - 2 };

    this.blocks[groundLevel - 1][doorX] = BLOCKS.DOOR;

    // Kapıyı doğrula
    this.verifyDoor();
  }

  verifyDoor(): void {
    // Kapının etrafında yeterli boş alan olduğundan emin ol
    const { x, y } = this.doorPosition;

    // Kapının önünde boş alan olduğundan emin ol
    for (let checkY = y; checkY < y + 2; checkY++) {
      for (let checkX = x - 3; checkX <= x + 3; checkX++) {
        if (
          checkX >= 0 &&
          checkX < this.width &&
          checkY >= 0 &&
          checkY < this.height
        ) {
          // Kapı ve çerçeve dışındaki blokları temizle
          if (
            !(
              (
                (checkX === x && (checkY === y || checkY === y + 1)) || // Kapı bloğu
                (checkX === x - 1 && checkY >= y && checkY < y + 2) || // Sol çerçeve
                (checkX === x + 1 && checkY >= y && checkY < y + 2) || // Sağ çerçeve
                (checkY === y - 1 && checkX >= x - 1 && checkX <= x + 1)
              ) // Üst çerçeve
            )
          ) {
            // Kapı önündeki alanı temizle
            if (
              checkX >= x - 2 &&
              checkX <= x + 2 &&
              checkY >= y &&
              checkY < y + 2
            ) {
              this.blocks[checkY][checkX] = BLOCKS.AIR;
            }
          }
        }
      }
    }
  }

  generateLavaPools(): void {
    // Dünyanın en alt katmanında lav katmanı oluştur
    const LAVA_SIZE = 6;
    const LAVA_CHANCE = 0.2;

    for (let n = 0; n < LAVA_SIZE; n++) {
      // Rastgele bir yükseklik seç (en alt 8 blok içinde)
      const lavaLayerY = this.height - n;

      // Lav katmanını oluştur
      for (let x = 0; x < this.width; x++) {
        // Rastgele boşluklar bırak
        if (Math.random() <= LAVA_CHANCE) {
          // %70 ihtimalle lav bloğu
          try {
            if (lavaLayerY >= 0 && lavaLayerY < this.height) {
              this.blocks[lavaLayerY][x] = BLOCKS.LAVA;
            }
          } catch (error) {
            console.error("Lav oluşturma hatası:", error);
          }
        }
      }
    }
  }

  generateSandAreas(): void {
    // İleride kum alanları oluşturma kodu eklenecek
  }

  getBlock(x: number, y: number): BLOCKS | undefined {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.blocks[y][x] as BLOCKS;
    }
    return undefined;
  }

  setBlock(x: number, y: number, blockType: BLOCKS): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.blocks[y][x] = blockType;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    blockSize: number,
    viewportWidth: number,
    viewportHeight: number,
    zoom: number
  ): void {
    // Görünüm alanı içindeki blokları hesapla
    const startX = Math.max(0, Math.floor(cameraX / blockSize));
    const startY = Math.max(0, Math.floor(cameraY / blockSize));
    const endX = Math.min(
      this.width,
      Math.ceil((cameraX + viewportWidth / zoom) / blockSize) + 1
    );
    const endY = Math.min(
      this.height,
      Math.ceil((cameraY + viewportHeight / zoom) / blockSize) + 1
    );

    // Görünüm alanı içindeki blokları çiz
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const blockType = this.blocks[y][x];
        const blockInfo = CONFIG.BLOCK_TYPES[blockType];

        if (blockType !== BLOCKS.AIR) {
          // Blok rengini ayarla
          ctx.fillStyle = blockInfo.color;

          // Bloğu çiz - ekran koordinatlarını hesapla
          const screenX = (x * blockSize - cameraX) * zoom;
          const screenY = (y * blockSize - cameraY) * zoom;
          const screenSize = blockSize * zoom;

          ctx.fillRect(screenX, screenY, screenSize, screenSize);

          // Blok kenarlarını çiz (3D efekti için)
          ctx.strokeStyle = "rgba(0,0,0,0.2)";
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, screenSize, screenSize);
        }
      }
    }
  }
}

export default World;
