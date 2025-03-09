import CONFIG from "./config.js";

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
            this.blocks[y][x] = 1; // Toprak
          } else if (depth < 10) {
            // Taş katmanı
            if (Math.random() < 0.05) {
              // Nadir kömür/demir madenleri
              this.blocks[y][x] = 2; // Taş
            } else {
              this.blocks[y][x] = 1; // Toprak
            }
          } else {
            // En derin katman - lav ve değerli madenler
            if (Math.random() < 0.02) {
              this.blocks[y][x] = 7; // Lav
            } else if (Math.random() < 0.1) {
              this.blocks[y][x] = 2; // Taş
            } else {
              this.blocks[y][x] = 1; // Toprak
            }
          }
        } else {
          // Zemin üstü - hava
          this.blocks[y][x] = 0;
        }
      }
    }

    // Çim katmanı ekle
    this.addGrassLayer();

    // Kapı ekle
    this.addDoor();

    // Lav havuzları ekle
    this.generateLavaPools();

    // Rastgele ağaçlar ekle
    this.generateTrees();

    // Rastgele kum alanları ekle
    this.generateSandAreas();
  }

  addGrassLayer(): void {
    const groundLevel = Math.floor(this.height * 0.4);

    // Zemin seviyesindeki toprak bloklarını çim ile değiştir
    for (let x = 0; x < this.width; x++) {
      if (this.blocks[groundLevel][x] === 1) {
        this.blocks[groundLevel][x] = 4; // Çim
      }
    }
  }

  addDoor(): void {
    const groundLevel = Math.floor(this.height * 0.4);

    // Kapı için uygun bir yer bul (düz bir alan)
    let doorX = Math.floor(this.width * 0.2); // Dünya başlangıcından biraz uzakta

    // Kapı pozisyonunu kaydet
    this.doorPosition = { x: doorX, y: groundLevel - 2 };

    // Kapı için zemin oluştur (3 blok genişliğinde düz platform)
    for (let x = doorX - 1; x <= doorX + 1; x++) {
      // Zemini tuğla yap
      this.blocks[groundLevel][x] = 9; // Tuğla

      // Kapı altındaki blokları da tuğla yap (2 blok derinliğinde)
      this.blocks[groundLevel + 1][x] = 9;
      this.blocks[groundLevel + 2][x] = 9;

      // Kapının üstündeki blokları temizle
      for (let y = groundLevel - 3; y >= groundLevel - 5; y--) {
        if (y >= 0) {
          this.blocks[y][x] = 0; // Hava
        }
      }
    }

    // Kapı bloğunu yerleştir
    this.blocks[groundLevel - 2][doorX] = 8; // Kapı
    this.blocks[groundLevel - 1][doorX] = 8; // Kapı

    // Kapı çerçevesi
    this.blocks[groundLevel - 3][doorX - 1] = 3; // Ahşap
    this.blocks[groundLevel - 3][doorX] = 3; // Ahşap
    this.blocks[groundLevel - 3][doorX + 1] = 3; // Ahşap
    this.blocks[groundLevel - 2][doorX - 1] = 3; // Ahşap
    this.blocks[groundLevel - 2][doorX + 1] = 3; // Ahşap
    this.blocks[groundLevel - 1][doorX - 1] = 3; // Ahşap
    this.blocks[groundLevel - 1][doorX + 1] = 3; // Ahşap

    // Kapı tokmağı ekle
    this.addDoorKnob(doorX + 1, groundLevel - 2);

    // Kapıyı doğrula
    this.verifyDoor();
  }

  addDoorKnob(x: number, y: number): void {
    // Kapı tokmağı (şimdilik sadece farklı bir blok)
    this.blocks[y][x] = 5; // Kum
  }

  verifyDoor(): void {
    // Kapının doğru yerleştirildiğinden emin ol
    const doorX = this.doorPosition.x;
    const doorY = this.doorPosition.y;

    // Kapı bloğu kontrol et
    if (this.blocks[doorY][doorX] !== 8) {
      console.warn("Kapı bloğu doğru yerleştirilmemiş, düzeltiliyor...");
      this.blocks[doorY][doorX] = 8;
    }

    // Kapı altındaki zemini kontrol et
    if (this.blocks[doorY + 1][doorX] !== 0 && this.blocks[doorY + 1][doorX] !== 8) {
      console.warn("Kapı altındaki zemin doğru değil, düzeltiliyor...");
      this.blocks[doorY + 1][doorX] = 8;
    }

    // Kapı üstündeki alanı kontrol et
    if (this.blocks[doorY - 1][doorX] !== 0) {
      console.warn("Kapı üstündeki alan açık değil, düzeltiliyor...");
      this.blocks[doorY - 1][doorX] = 0;
    }
  }

  generateLavaPools(): void {
    const groundLevel = Math.floor(this.height * 0.4);

    // Derin bölgelerde lav havuzları oluştur
    const poolCount = Math.floor(this.width / 20); // Her 20 blokta bir lav havuzu

    for (let i = 0; i < poolCount; i++) {
      // Rastgele bir x pozisyonu seç
      const poolX = Math.floor(Math.random() * this.width);
      // Rastgele bir y pozisyonu seç (derin bölgelerde)
      const poolY = groundLevel + 10 + Math.floor(Math.random() * (this.height - groundLevel - 15));
      // Rastgele bir havuz boyutu seç
      const poolSize = 2 + Math.floor(Math.random() * 4);

      // Lav havuzu oluştur
      for (let y = poolY; y < poolY + poolSize && y < this.height; y++) {
        for (let x = poolX; x < poolX + poolSize * 2 && x < this.width; x++) {
          if (Math.random() < 0.7) {
            // %70 ihtimalle lav bloğu yerleştir
            this.blocks[y][x] = 7; // Lav
          }
        }
      }
    }
  }

  generateTrees(): void {
    // Ağaçları ekle
    // Bu fonksiyon daha sonra eklenecek
  }

  generateSandAreas(): void {
    // Kum alanlarını ekle
    // Bu fonksiyon daha sonra eklenecek
  }

  getBlock(x: number, y: number): number | undefined {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.blocks[y][x];
    }
    return undefined;
  }

  setBlock(x: number, y: number, blockType: number): void {
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
    // Görünür blokları hesapla
    const startX = Math.floor(cameraX / blockSize);
    const endX = Math.ceil((cameraX + viewportWidth / zoom) / blockSize);
    const startY = Math.floor(cameraY / blockSize);
    const endY = Math.ceil((cameraY + viewportHeight / zoom) / blockSize);

    // Görünür blokları çiz
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        // Dünya sınırları içinde mi kontrol et
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const blockType = this.blocks[y][x];
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];

          // Hava bloklarını çizme
          if (blockType !== 0) {
            // Blok pozisyonunu hesapla
            const blockX = (x * blockSize - cameraX) * zoom;
            const blockY = (y * blockSize - cameraY) * zoom;
            const blockWidth = blockSize * zoom;
            const blockHeight = blockSize * zoom;

            // Blok rengini ayarla
            ctx.fillStyle = blockInfo.color;

            // Bloğu çiz
            ctx.fillRect(blockX, blockY, blockWidth, blockHeight);

            // Blok kenarlarını çiz
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
          }
        }
      }
    }
  }
}

export default World; 