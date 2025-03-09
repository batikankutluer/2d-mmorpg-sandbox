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

    // Kapı çerçevesi oluştur
    // Sol duvar
    this.blocks[groundLevel - 1][doorX - 1] = 3; // Ahşap
    this.blocks[groundLevel - 2][doorX - 1] = 3;

    // Sağ duvar
    this.blocks[groundLevel - 1][doorX + 1] = 3;
    this.blocks[groundLevel - 2][doorX + 1] = 3;

    // Üst kiriş
    this.blocks[groundLevel - 3][doorX - 1] = 3;
    this.blocks[groundLevel - 3][doorX] = 3;
    this.blocks[groundLevel - 3][doorX + 1] = 3;

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

  generateTrees() {
    const groundLevel = Math.floor(this.height * 0.4);

    // Zemin seviyesinde rastgele ağaçlar ekle
    for (let x = 0; x < this.width; x++) {
      // Kapıdan uzakta olsun
      if (Math.abs(x - this.doorPosition.x) > 10 && Math.random() < 0.05) {
        // Ağaç gövdesi
        const treeHeight = 3 + Math.floor(Math.random() * 3); // 3-5 blok yüksekliğinde

        for (let y = 1; y <= treeHeight; y++) {
          this.blocks[groundLevel - y][x] = 3; // Ahşap
        }

        // Ağaç yaprakları
        for (let dy = -2; dy <= 0; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const leafX = x + dx;
            const leafY = groundLevel - treeHeight - 1 + dy;

            if (
              leafX >= 0 &&
              leafX < this.width &&
              leafY >= 0 &&
              leafY < this.height &&
              !(dx === 0 && dy === 0) // Gövdenin üstünde yaprak olmasın
            ) {
              // Yaprakları çim bloğu olarak temsil ediyoruz
              this.blocks[leafY][leafX] = 4; // Çim
            }
          }
        }
      }
    }
  }

  generateSandAreas() {
    const groundLevel = Math.floor(this.height * 0.4);

    // Zemin seviyesinde rastgele kum alanları ekle
    for (let x = 0; x < this.width; x++) {
      if (Math.random() < 0.02) {
        // Kum alanı merkezi
        if (this.blocks[groundLevel][x] === 4) {
          // Eğer çim ise
          this.blocks[groundLevel][x] = 5; // Kum

          // Kum alanını genişlet
          for (let dx = -3; dx <= 3; dx++) {
            const sandX = x + dx;

            if (
              sandX >= 0 &&
              sandX < this.width &&
              Math.random() < 0.7 - Math.abs(dx) * 0.15
            ) {
              if (this.blocks[groundLevel][sandX] === 4) {
                // Eğer çim ise
                this.blocks[groundLevel][sandX] = 5; // Kum
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
