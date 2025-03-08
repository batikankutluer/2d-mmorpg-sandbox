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

    // Ağaçları kaldırdık

    // Su ve kum kaldırıldı

    // Yeraltı lav havuzları ekle
    this.generateLavaPools();

    // Kapının doğru oluşturulduğunu kontrol et
    this.verifyDoor();
  }

  addGrassLayer() {
    // Toprak yüzeyine çim ekle
    for (let x = 0; x < this.width; x++) {
      // Zemin seviyesi
      const groundLevel = Math.floor(this.height * 0.4);

      // Çim ekle
      this.blocks[groundLevel][x] = 4; // Çim
    }
  }

  // Kapı ekleme fonksiyonu
  addDoor() {
    // Sabit bir konum seç (dünya genişliğinin ortalarında)
    const doorX = Math.floor(this.width * 0.5);
    const groundLevel = Math.floor(this.height * 0.4);

    // Kapı pozisyonunu kaydet (oyuncu başlangıç pozisyonu için)
    this.doorPosition = { x: doorX, y: groundLevel - 1 };

    // Kapının altına taş blok ekle (fotoğraftaki gibi)
    this.blocks[groundLevel][doorX] = 2; // Taş blok

    // Kapı bloğu ekle (beyaz kapı)
    this.blocks[groundLevel - 1][doorX] = 8; // Kapı

    // Kapının etrafını temizle (oyuncu geçebilsin)
    this.blocks[groundLevel - 2][doorX] = 0; // Kapının üstü hava
    this.blocks[groundLevel - 3][doorX] = 0; // Kapının üstünün üstü hava

    // Kapının yanlarını temizle
    if (doorX > 0) {
      this.blocks[groundLevel - 1][doorX - 1] = 0;
      this.blocks[groundLevel - 2][doorX - 1] = 0;
      this.blocks[groundLevel - 3][doorX - 1] = 0;
    }

    if (doorX < this.width - 1) {
      this.blocks[groundLevel - 1][doorX + 1] = 0;
      this.blocks[groundLevel - 2][doorX + 1] = 0;
      this.blocks[groundLevel - 3][doorX + 1] = 0;
    }

    // Kapıya altın rengi bir nokta ekle (kapı kolu)
    this.addDoorKnob(doorX, groundLevel - 1);

    // Kapının etrafındaki çim bloklarını toprak yap
    this.blocks[groundLevel][doorX - 1] = 1; // Sol taraf toprak
    this.blocks[groundLevel][doorX + 1] = 1; // Sağ taraf toprak
  }

  addDoorKnob(x, y) {
    // Bu metod render sırasında özel olarak çizilecek
    this.doorKnob = { x, y };
  }

  // Kapının doğru oluşturulduğunu kontrol et
  verifyDoor() {
    const doorX = this.doorPosition.x;
    const doorY = this.doorPosition.y;
    const groundLevel = Math.floor(this.height * 0.4);

    // Kapı kontrolü
    if (this.blocks[doorY][doorX] !== 8) {
      console.error("Kapı bloğu doğru yerleştirilmemiş!");
      this.blocks[doorY][doorX] = 8; // Kapıyı düzelt
    }

    // Taş blok kontrolü
    if (this.blocks[groundLevel][doorX] !== 2) {
      console.error("Kapının altındaki taş blok doğru yerleştirilmemiş!");
      this.blocks[groundLevel][doorX] = 2; // Taş bloğu düzelt
    }

    // Kapının üstünün boş olduğunu kontrol et
    if (this.blocks[doorY - 1][doorX] !== 0) {
      console.error("Kapının üstü boş değil!");
      this.blocks[doorY - 1][doorX] = 0; // Kapının üstünü temizle
    }

    // Oyuncunun sıkışmaması için kapının etrafını temizle
    this.blocks[doorY][doorX - 1] = 0; // Sol taraf
    this.blocks[doorY][doorX + 1] = 0; // Sağ taraf
    this.blocks[doorY - 1][doorX - 1] = 0; // Sol üst
    this.blocks[doorY - 1][doorX + 1] = 0; // Sağ üst
  }

  generateLavaPools() {
    // Yeraltı lav havuzları
    const lavaPools = 3 + Math.floor(Math.random() * 3);
    const groundLevel = Math.floor(this.height * 0.4);

    for (let i = 0; i < lavaPools; i++) {
      const poolX = Math.floor(Math.random() * this.width);
      const poolY = groundLevel + 15 + Math.floor(Math.random() * 10);
      const poolSize = 3 + Math.floor(Math.random() * 3);

      // Lav havuzu oluştur
      for (let y = poolY - poolSize / 2; y <= poolY + poolSize / 2; y++) {
        for (let x = poolX - poolSize / 2; x <= poolX + poolSize / 2; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const distance = Math.sqrt(
              Math.pow(x - poolX, 2) + Math.pow(y - poolY, 2)
            );
            if (distance <= poolSize / 2) {
              this.blocks[Math.floor(y)][Math.floor(x)] = 7; // Lav
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
    return 0; // Sınırların dışında hava var
  }

  setBlock(x, y, blockType) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.blocks[y][x] = blockType;
      return true;
    }
    return false;
  }

  render(ctx, cameraX, cameraY, blockSize, viewportWidth, viewportHeight) {
    // Görünür alanı hesapla
    const startX = Math.floor(cameraX / blockSize);
    const startY = Math.floor(cameraY / blockSize);
    const endX = Math.ceil((cameraX + viewportWidth) / blockSize);
    const endY = Math.ceil((cameraY + viewportHeight) / blockSize);

    // Görünür blokları çiz
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const blockType = this.blocks[y][x];
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];

          if (blockType !== 0) {
            // Hava değilse çiz
            ctx.fillStyle = blockInfo.color;
            ctx.fillRect(
              x * blockSize - cameraX,
              y * blockSize - cameraY,
              blockSize,
              blockSize
            );

            // Blok kenarlarını çiz
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.strokeRect(
              x * blockSize - cameraX,
              y * blockSize - cameraY,
              blockSize,
              blockSize
            );

            // Kapı bloğu için özel çizim
            if (blockType === 8) {
              // Kapı panelleri
              ctx.fillStyle = "rgba(0,0,0,0.1)";

              // Üst sol panel
              ctx.fillRect(
                x * blockSize - cameraX + blockSize * 0.1,
                y * blockSize - cameraY + blockSize * 0.1,
                blockSize * 0.35,
                blockSize * 0.35
              );

              // Üst sağ panel
              ctx.fillRect(
                x * blockSize - cameraX + blockSize * 0.55,
                y * blockSize - cameraY + blockSize * 0.1,
                blockSize * 0.35,
                blockSize * 0.35
              );

              // Alt sol panel
              ctx.fillRect(
                x * blockSize - cameraX + blockSize * 0.1,
                y * blockSize - cameraY + blockSize * 0.55,
                blockSize * 0.35,
                blockSize * 0.35
              );

              // Alt sağ panel
              ctx.fillRect(
                x * blockSize - cameraX + blockSize * 0.55,
                y * blockSize - cameraY + blockSize * 0.55,
                blockSize * 0.35,
                blockSize * 0.35
              );
            }
          }
        }
      }
    }

    // Kapı kolunu çiz
    if (this.doorKnob) {
      const doorKnobX = this.doorKnob.x * blockSize - cameraX + blockSize * 0.7;
      const doorKnobY = this.doorKnob.y * blockSize - cameraY + blockSize * 0.5;

      ctx.fillStyle = "#FFD700"; // Altın rengi
      ctx.beginPath();
      ctx.arc(doorKnobX, doorKnobY, blockSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
