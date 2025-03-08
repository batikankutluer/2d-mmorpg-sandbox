// Web3 2D Minecraft benzeri oyun
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Oyun dünyası
    this.blockSize = CONFIG.BLOCK_SIZE;
    this.world = new World(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);

    // Oyuncu - kapının önünde başlat
    const playerX = this.world.doorPosition.x * this.blockSize;
    const playerY = this.world.doorPosition.y * this.blockSize;

    this.player = new Player(this, playerX, playerY);

    // Kamera
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0, // Zoom seviyesi
    };

    // Web3 entegrasyonu
    this.wallet = null;
    this.isWalletConnected = false;
    this.ownedLands = [];

    // Oyun durumu
    this.isRunning = false;
    this.selectedBlock = 1;
    this.isBuilding = false;
    this.showDebug = false;

    // Tuş durumları
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
    };

    // Fizik motoru
    this.physics = new PhysicsEngine(this);

    // Oyun döngüsü
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1000 / 60; // 60 FPS
  }

  init() {
    this.setupEventListeners();

    // Oyun başladığında kamerayı oyuncuya odakla
    this.updateCamera(true);

    console.log("Oyun başlatıldı");
  }

  setupEventListeners() {
    // Klavye kontrolleri - tuş basıldığında
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          this.keys.up = true;
          break;
        case "ArrowDown":
        case "s":
          this.keys.down = true;
          break;
        case "ArrowLeft":
        case "a":
          this.keys.left = true;
          break;
        case "ArrowRight":
        case "d":
          this.keys.right = true;
          break;
        case " ": // Boşluk tuşu
          this.physics.jump();
          break;
        case "b":
          this.isBuilding = !this.isBuilding;
          console.log(`İnşa modu: ${this.isBuilding ? "Açık" : "Kapalı"}`);
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          this.selectedBlock = parseInt(e.key);
          break;
      }
    });

    // Tuş bırakıldığında
    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
          this.keys.up = false;
          break;
        case "ArrowDown":
        case "s":
          this.keys.down = false;
          break;
        case "ArrowLeft":
        case "a":
          this.keys.left = false;
          break;
        case "ArrowRight":
        case "d":
          this.keys.right = false;
          break;
      }
    });

    // Fare kontrolleri
    this.canvas.addEventListener("mousedown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Dünya koordinatlarına dönüştür (zoom seviyesini dikkate alarak)
      const worldX = Math.floor(
        (mouseX / this.camera.zoom + this.camera.x) / this.blockSize
      );
      const worldY = Math.floor(
        (mouseY / this.camera.zoom + this.camera.y) / this.blockSize
      );

      if (e.button === 0) {
        // Sol tık
        if (this.isBuilding) {
          this.world.setBlock(worldX, worldY, this.selectedBlock);
        }
      } else if (e.button === 2) {
        // Sağ tık
        this.world.setBlock(worldX, worldY, 0); // Bloğu kaldır
      }
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Oyun döngüsünü başlat
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  gameLoop(currentTime) {
    // Zaman farkını hesapla
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Birikmiş zamanı güncelle
    this.accumulator += deltaTime;

    // Sabit zaman adımlarıyla güncelle
    while (this.accumulator >= this.timeStep) {
      this.update();
      this.accumulator -= this.timeStep;
    }

    // Çiz
    this.render();

    // Bir sonraki kareyi iste
    if (this.isRunning) {
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  update() {
    // Oyuncu hareketini güncelle
    this.handlePlayerMovement();

    // Oyuncu animasyonunu güncelle
    this.player.update();

    // Fizik güncellemesi
    this.physics.update();

    // Kamerayı güncelle
    this.updateCamera();
  }

  handlePlayerMovement() {
    // Yatay hareket - hızı doğrudan ayarla, sürtünme fizik motorunda uygulanacak
    if (this.keys.left) {
      this.player.velocityX = -this.player.speed;
      this.player.direction = -1; // Sola bak
    } else if (this.keys.right) {
      this.player.velocityX = this.player.speed;
      this.player.direction = 1; // Sağa bak
    } else {
      // Tuşa basılmadığında hızı azalt ama yönü değiştirme
      this.player.velocityX *= this.physics.friction;

      // Çok küçük hızları sıfırla
      if (Math.abs(this.player.velocityX) < 0.1) {
        this.player.velocityX = 0;
      }
    }

    // Dikey hareket (zıplama ve hızlı düşme)
    if (this.keys.up) {
      this.physics.jump();
    }

    if (this.keys.down) {
      // Eğer havadaysa, hızlı düşme
      if (!this.physics.isOnGround()) {
        this.player.velocityY += 1.5;
      }
    }
  }

  updateCamera(forceUpdate = false) {
    // Oyuncunun merkez pozisyonunu hesapla
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    // Ekranın merkezi
    const screenCenterX = this.width / 2;
    const screenCenterY = this.height / 2;

    // Hedef kamera pozisyonu (oyuncuyu tam merkezde tutacak şekilde)
    const targetX = playerCenterX - screenCenterX / this.camera.zoom;
    const targetY = playerCenterY - screenCenterY / this.camera.zoom;

    if (forceUpdate) {
      // Anında güncelle
      this.camera.x = targetX;
      this.camera.y = targetY;
    } else {
      // Yumuşak geçiş
      const smoothFactor = 0.1;
      this.camera.x += (targetX - this.camera.x) * smoothFactor;
      this.camera.y += (targetY - this.camera.y) * smoothFactor;
    }

    // Dünya sınırları kontrolü
    const maxX =
      this.world.width * this.blockSize - this.width / this.camera.zoom;
    const maxY =
      this.world.height * this.blockSize - this.height / this.camera.zoom;

    this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
  }

  render() {
    // Ekranı temizle
    this.ctx.fillStyle = "#87CEEB";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Zoom uygulamak için transform kullan
    this.ctx.save();
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // Kamera ofsetlerini hesapla
    const cameraOffsetX = this.camera.x;
    const cameraOffsetY = this.camera.y;

    // Güneş ve bulutlar çiz
    this.renderSky(cameraOffsetX, cameraOffsetY);

    // Dünyayı çiz
    this.world.render(
      this.ctx,
      cameraOffsetX,
      cameraOffsetY,
      this.blockSize,
      this.width / this.camera.zoom,
      this.height / this.camera.zoom
    );

    // Oyuncuyu çiz
    this.player.render(this.ctx, cameraOffsetX, cameraOffsetY);

    // Transform'u geri al
    this.ctx.restore();

    // UI çiz (zoom etkilemez)
    this.renderUI();
  }

  renderSky(cameraOffsetX, cameraOffsetY) {
    // Güneş çiz
    this.ctx.fillStyle = "#FFD700"; // Altın sarısı
    this.ctx.beginPath();
    this.ctx.arc((this.width / this.camera.zoom) * 0.8, 50, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Güneş parlaması
    this.ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
    this.ctx.beginPath();
    this.ctx.arc((this.width / this.camera.zoom) * 0.8, 50, 45, 0, Math.PI * 2);
    this.ctx.fill();

    // Bulutlar çiz
    this.renderClouds(cameraOffsetX, cameraOffsetY);
  }

  renderClouds(cameraOffsetX, cameraOffsetY) {
    // Basit bulutlar
    const clouds = [
      { x: 100, y: 50, width: 80, height: 40 },
      { x: 300, y: 30, width: 100, height: 50 },
      { x: 500, y: 70, width: 120, height: 40 },
      { x: 700, y: 40, width: 90, height: 30 },
    ];

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    for (const cloud of clouds) {
      // Bulutları kamera ile hareket ettir (paralaks efekti)
      const cloudX =
        (cloud.x - cameraOffsetX * 0.2) % (this.width / this.camera.zoom);

      this.ctx.beginPath();
      this.ctx.ellipse(
        cloudX,
        cloud.y,
        cloud.width / 2,
        cloud.height / 2,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }

  renderUI() {
    // UI öğelerini çiz (zoom etkilemez)
    const blockSize = 20; // UI blok boyutu
    const padding = 10;

    // Seçili blok göstergesi
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(padding, padding, 100, 40);
    this.ctx.fillStyle = CONFIG.BLOCK_TYPES[this.selectedBlock].color;
    this.ctx.fillRect(padding + 10, padding + 10, blockSize, blockSize);
    this.ctx.fillStyle = "white";
    this.ctx.font = "14px Arial";
    this.ctx.fillText(
      CONFIG.BLOCK_TYPES[this.selectedBlock].name,
      padding + blockSize + 20,
      padding + 25
    );

    // İnşa modu göstergesi
    this.ctx.fillStyle = this.isBuilding ? "green" : "red";
    this.ctx.fillRect(padding + 110, padding, 100, 40);
    this.ctx.fillStyle = "white";
    this.ctx.fillText(
      `İnşa: ${this.isBuilding ? "Açık" : "Kapalı"}`,
      padding + 120,
      padding + 25
    );

    // Debug bilgileri
    if (this.showDebug) {
      this.ctx.fillStyle = "rgba(0,0,0,0.5)";
      this.ctx.fillRect(padding, this.height - 100, 200, 90);
      this.ctx.fillStyle = "white";
      this.ctx.fillText(
        `X: ${Math.floor(this.player.x / this.blockSize)}`,
        padding + 10,
        this.height - 80
      );
      this.ctx.fillText(
        `Y: ${Math.floor(this.player.y / this.blockSize)}`,
        padding + 10,
        this.height - 60
      );
      this.ctx.fillText(
        `VelX: ${this.player.velocityX.toFixed(2)}`,
        padding + 10,
        this.height - 40
      );
      this.ctx.fillText(
        `VelY: ${this.player.velocityY.toFixed(2)}`,
        padding + 10,
        this.height - 20
      );
      this.ctx.fillText(
        `Zoom: ${this.camera.zoom.toFixed(2)}`,
        padding + 10,
        this.height - 100
      );
    }
  }

  // Web3 entegrasyonu için metotlar
  async connectWallet() {
    try {
      console.log("Cüzdan bağlantısı başlatılıyor...");
      this.isWalletConnected = true;
      this.wallet = "0x...";
      console.log("Cüzdan bağlandı:", this.wallet);
      await this.fetchOwnedLands();
    } catch (error) {
      console.error("Cüzdan bağlantısı başarısız:", error);
    }
  }

  async fetchOwnedLands() {
    console.log("Sahip olunan araziler getiriliyor...");
    this.ownedLands = [
      { id: 1, x: 10, y: 10, width: 10, height: 10 },
      { id: 2, x: 30, y: 15, width: 8, height: 8 },
    ];
    console.log("Sahip olunan araziler:", this.ownedLands);
  }

  mintLand(x, y, width, height) {
    if (!this.isWalletConnected) {
      console.error("Arazi oluşturmak için cüzdan bağlantısı gerekli!");
      return;
    }
    console.log(`Yeni arazi oluşturuluyor: (${x}, ${y}) - ${width}x${height}`);
  }

  pause() {
    this.isRunning = false;
    console.log("Oyun duraklatıldı");
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
      console.log("Oyun devam ediyor");
    }
  }
}

// HTML sayfası yüklendiğinde oyunu başlat
window.onload = () => {
  const game = new Game();
  game.init();
  game.start();

  // Sağ tıklama menüsünü engelle
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // Web3 bağlantı butonu
  const connectButton = document.getElementById("connectWallet");
  if (connectButton) {
    connectButton.addEventListener("click", () => game.connectWallet());
  }
};
