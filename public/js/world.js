import CONFIG from "./config.js";

// Dünya sınıfı
class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.blocks = [];
    this.doorPosition = { x: 0, y: 0 }; // Kapı pozisyonu
    this.generate();
  }

  generate() {
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
            this.blocks[y][x] = 3; // Toprak
          } else if (depth < 10) {
            // Taş katmanı
            if (Math.random() < 0.01) {
              // Nadir kömür/demir madenleri
              this.blocks[y][x] = 2; // Taş
            } else {
              this.blocks[y][x] = 3; // Toprak
            }
          } else {
            // En derin katman - lav ve değerli madenler
            if (Math.random() < 0.01) {
              this.blocks[y][x] = 7; // Lav
            } else if (Math.random() < 0.1) {
              this.blocks[y][x] = 2; // Taş
            } else {
              this.blocks[y][x] = 3; // Toprak
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
  }

  addGrassLayer() {
    const groundLevel = Math.floor(this.height * 0.4);

    // Zemin seviyesindeki toprak bloklarını çim ile değiştir
    for (let x = 0; x < this.width; x++) {
      if (this.blocks[groundLevel][x] === 1) {
        this.blocks[groundLevel][x] = 4; // Çim
      }
    }
  }

  addDoor() {
    const groundLevel = Math.floor(this.height * 0.4);

    // Kapı için uygun bir yer bul (düz bir alan)
    let doorX = Math.floor(this.width * 0.2); // Dünya başlangıcından biraz uzakta

    // Kapı pozisyonunu kaydet
    this.doorPosition = { x: doorX, y: groundLevel - 2 };

    // Kapı için zemin oluştur (3 blok genişliğinde düz platform)
    for (let x = doorX - 1; x <= doorX + 1; x++) {
      // Zemini tuğla yap
      this.blocks[groundLevel][x] = 3; // Tuğla

      // Kapı altındaki blokları da tuğla yap (2 blok derinliğinde)
      this.blocks[groundLevel + 1][x] = 3;
      this.blocks[groundLevel + 2][x] = 3;

      // Kapının üstündeki blokları temizle
      for (let y = groundLevel - 3; y >= groundLevel - 5; y--) {
        if (y >= 0) {
          this.blocks[y][x] = 0; // Hava
        }
      }
    }

    // Kapı bloğu
    this.blocks[groundLevel - 1][doorX] = 8; // Kapı
    this.blocks[groundLevel - 2][doorX] = 8; // Kapı

    // Kapı kolu ekle
    this.addDoorKnob(doorX + 1, groundLevel - 2);

    // Kapının doğru yerleştirildiğinden emin ol
    this.verifyDoor();
  }

  addDoorKnob(x, y) {
    // Kapı kolu için özel bir blok tipi eklenebilir
    // Şimdilik sadece kapı bloğu kullanıyoruz
  }

  verifyDoor() {
    // Kapının etrafında yeterli boş alan olduğundan emin ol
    const doorX = this.doorPosition.x;
    const doorY = this.doorPosition.y;

    // Kapının önünde en az 3 blok boş alan olsun
    for (let y = doorY; y <= doorY + 1; y++) {
      for (let x = doorX + 2; x <= doorX + 4; x++) {
        if (x < this.width) {
          this.blocks[y][x] = 0; // Hava
        }
      }
    }

    // Kapının arkasında da biraz boş alan olsun
    for (let y = doorY; y <= doorY + 1; y++) {
      for (let x = doorX - 4; x <= doorX - 2; x++) {
        if (x >= 0) {
          this.blocks[y][x] = 0; // Hava
        }
      }
    }

    // Kapının üstünde de boş alan olsun
    for (let y = doorY - 3; y >= doorY - 5; y--) {
      if (y >= 0) {
        for (let x = doorX - 2; x <= doorX + 2; x++) {
          if (x >= 0 && x < this.width) {
            this.blocks[y][x] = 0; // Hava
          }
        }
      }
    }
  }

  generateLavaPools() {
    const groundLevel = Math.floor(this.height * 0.4);

    // Derin bölgelerde lav havuzları oluştur
    for (let y = groundLevel + 15; y < this.height - 5; y++) {
      for (let x = 0; x < this.width; x++) {
        // Rastgele lav havuzları
        if (Math.random() < 0.01) {
          // Lav havuzu merkezi
          this.blocks[y][x] = 7; // Lav

          // Lav havuzunu genişlet
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const newX = x + dx;
              const newY = y + dy;

              if (
                newX >= 0 &&
                newX < this.width &&
                newY >= 0 &&
                newY < this.height &&
                Math.random() < 0.7
              ) {
                this.blocks[newY][newX] = 7; // Lav
              }
            }
          }
        }
      }
    }
  }

  getBlock(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.blocks[y][x];
    }
    return undefined;
  }

  setBlock(x, y, blockType) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.blocks[y][x] = blockType;
      return true;
    }
    return false;
  }

  render(
    ctx,
    cameraX,
    cameraY,
    blockSize,
    viewportWidth,
    viewportHeight,
    zoom
  ) {
    // Görünür blokları hesapla
    const startX = Math.floor(cameraX / blockSize);
    const startY = Math.floor(cameraY / blockSize);
    const endX = Math.ceil((cameraX + viewportWidth / zoom) / blockSize);
    const endY = Math.ceil((cameraY + viewportHeight / zoom) / blockSize);

    // Görünür blokları çiz
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const blockType = this.blocks[y][x];

          // Hava bloklarını çizme
          if (blockType !== 0) {
            const blockInfo = CONFIG.BLOCK_TYPES[blockType];

            // Blok pozisyonunu hesapla
            const blockX = (x * blockSize - cameraX) * zoom;
            const blockY = (y * blockSize - cameraY) * zoom;
            const scaledBlockSize = blockSize * zoom;

            // Bloğu çiz
            ctx.fillStyle = blockInfo.color;
            ctx.fillRect(blockX, blockY, scaledBlockSize, scaledBlockSize);

            // Blok kenarlarını çiz (3D efekti için)
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(blockX, blockY, scaledBlockSize, scaledBlockSize);
          }
        }
      }
    }
  }
}

export default World;
