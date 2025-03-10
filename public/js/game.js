import CONFIG from "./config.js";
import World from "./world.js";
import Player from "./player.js";
import PhysicsEngine from "./physics.js";
import Web3Integration from "./web3Integration.js";

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
    this.web3 = new Web3Integration(this);

    // Oyun durumu
    this.isRunning = false;
    this.selectedBlock = 1;
    this.isBuilding = false;
    this.showDebug = false;
    this.isPaused = false;

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
    this.fixedTimeStep = CONFIG.TIME_STEP; // Sabit zaman adımı
    this.frameDelay = 1000 / CONFIG.FRAME_RATE; // Kare gecikmesi
    this.lastFrameTime = 0;

    // Fare pozisyonu
    this.mouse = {
      x: 0,
      y: 0,
      isDown: false,
      rightIsDown: false,
    };

    // Olay dinleyicileri
    this.setupEventListeners();
  }

  init() {
    // Web3 entegrasyonunu başlat
    this.web3.initialize();

    // Kamerayı oyuncuya odakla
    this.updateCamera();

    console.log("Oyun başlatıldı");
  }

  setupEventListeners() {
    // Klavye olayları
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));

    // Fare olayları
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  handleKeyDown(e) {
    if (this.isPaused) return;

    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.keys.left = true;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.keys.right = true;
        break;
      case "ArrowUp":
      case "w":
      case "W":
        this.keys.up = true;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.keys.down = true;
        break;
      case " ":
        // Zıplama
        this.physics.jump();
        break;
      case "b":
      case "B":
        // İnşa modunu aç/kapa
        this.isBuilding = !this.isBuilding;
        console.log("İnşa modu: " + (this.isBuilding ? "Açık" : "Kapalı"));
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
        // Blok seçimi
        const blockType = parseInt(e.key);
        if (CONFIG.BLOCK_TYPES[blockType]) {
          this.selectedBlock = blockType;
          console.log("Seçilen blok: " + CONFIG.BLOCK_TYPES[blockType].name);
        }
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        this.keys.left = false;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        this.keys.right = false;
        break;
      case "ArrowUp":
      case "w":
      case "W":
        this.keys.up = false;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.keys.down = false;
        break;
    }
  }

  handleMouseDown(e) {
    if (this.isPaused) return;

    // Sol tık
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.handleBlockPlacement();
    }
    // Sağ tık
    else if (e.button === 2) {
      this.mouse.rightIsDown = true;
      this.handleBlockRemoval();
    }
  }

  handleMouseUp(e) {
    // Sol tık
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
    // Sağ tık
    else if (e.button === 2) {
      this.mouse.rightIsDown = false;
    }
  }

  handleMouseMove(e) {
    // Fare pozisyonunu güncelle
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // Fare basılıysa ve inşa modundaysa blok yerleştir/kaldır
    if (this.isBuilding) {
      if (this.mouse.isDown) {
        this.handleBlockPlacement();
      } else if (this.mouse.rightIsDown) {
        this.handleBlockRemoval();
      }
    }
  }

  handleBlockPlacement() {
    if (!this.isBuilding) return;

    // Fare pozisyonunu dünya koordinatlarına dönüştür
    const worldX = Math.floor(
      (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
    );
    const worldY = Math.floor(
      (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
    );

    // Blok yerleştir
    if (this.canPlaceBlock(worldX, worldY)) {
      this.world.setBlock(worldX, worldY, this.selectedBlock);
    }
  }

  handleBlockRemoval() {
    if (!this.isBuilding) return;

    // Fare pozisyonunu dünya koordinatlarına dönüştür
    const worldX = Math.floor(
      (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
    );
    const worldY = Math.floor(
      (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
    );

    // Blok kaldır (hava bloğu yerleştir)
    if (this.canRemoveBlock(worldX, worldY)) {
      this.world.setBlock(worldX, worldY, 0);
    }
  }

  canPlaceBlock(x, y) {
    // Oyuncunun bulunduğu bloğa yerleştirmeyi engelle
    const playerBlockX = Math.floor(this.player.x / this.blockSize);
    const playerBlockY = Math.floor(this.player.y / this.blockSize);
    const playerBlockX2 = Math.floor(
      (this.player.x + this.player.width) / this.blockSize
    );
    const playerBlockY2 = Math.floor(
      (this.player.y + this.player.height) / this.blockSize
    );

    if (
      (x === playerBlockX || x === playerBlockX2) &&
      (y === playerBlockY || y === playerBlockY2)
    ) {
      return false;
    }

    // Web3 entegrasyonu: Arazi sahipliği kontrolü
    if (this.isWalletConnected) {
      return this.web3.isLandOwner(x, y);
    }

    return true;
  }

  canRemoveBlock(x, y) {
    // Kapı bloklarını kaldırmayı engelle
    const blockType = this.world.getBlock(x, y);
    if (blockType === 8) {
      return false;
    }

    // Web3 entegrasyonu: Arazi sahipliği kontrolü
    if (this.isWalletConnected) {
      return this.web3.isLandOwner(x, y);
    }

    return true;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    // Kare hızını sınırla
    if (timestamp - this.lastFrameTime < this.frameDelay) {
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      return;
    }

    // Zaman farkını hesapla ve sınırla
    let deltaTime = timestamp - this.lastTime;
    deltaTime = Math.min(deltaTime, CONFIG.MAX_DELTA_TIME); // Maksimum delta time sınırlaması

    this.lastTime = timestamp;
    this.lastFrameTime = timestamp;

    // Oyun duraklatıldıysa döngüyü durdur
    if (this.isPaused) {
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      return;
    }

    // Sabit zaman adımı için birikimli süre
    this.accumulator += deltaTime;

    // Sabit zaman adımlarıyla fizik güncellemesi
    const maxSteps = CONFIG.PHYSICS_ITERATIONS; // Fizik hesaplama iterasyon sayısı
    let steps = 0;

    while (this.accumulator >= this.fixedTimeStep && steps < maxSteps) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
      steps++;
    }

    // Kalan birikimli süreyi bir sonraki kareye aktar
    // Ancak çok büyükse sıfırla (takılma durumlarında)
    if (this.accumulator > this.fixedTimeStep * 3) {
      this.accumulator = 0;
    }

    // Render
    this.render();

    // Bir sonraki kare
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  update(deltaTime) {
    // Oyuncu hareketi
    if (this.keys.left) {
      this.player.velocityX = -this.player.speed;
    } else if (this.keys.right) {
      this.player.velocityX = this.player.speed;
    } else {
      this.player.velocityX *= CONFIG.FRICTION;
    }

    // Fizik güncellemesi
    this.physics.update();

    // Oyuncu güncellemesi
    this.player.update(deltaTime);

    // Kamerayı oyuncuya odakla
    this.updateCamera();
  }

  updateCamera(instant = false) {
    // Hedef kamera pozisyonu (oyuncuyu merkezde tut)
    const targetX =
      this.player.x +
      this.player.width / 2 -
      this.width / (2 * this.camera.zoom);
    const targetY =
      this.player.y +
      this.player.height / 2 -
      this.height / (2 * this.camera.zoom);

    if (instant) {
      // Anında kamera güncellemesi
      this.camera.x = targetX;
      this.camera.y = targetY;
    } else {
      // Yumuşak kamera takibi
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;
    }

    // Kamera sınırlarını kontrol et
    this.camera.x = Math.max(
      0,
      Math.min(
        this.camera.x,
        this.world.width * this.blockSize - this.width / this.camera.zoom
      )
    );
    this.camera.y = Math.max(
      0,
      Math.min(
        this.camera.y,
        this.world.height * this.blockSize - this.height / this.camera.zoom
      )
    );
  }

  render() {
    // Canvas'ı temizle
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Gökyüzü rengi
    this.ctx.fillStyle = "#87CEEB"; // Açık mavi
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dünyayı çiz
    this.world.render(
      this.ctx,
      this.camera.x,
      this.camera.y,
      this.blockSize,
      this.width,
      this.height,
      this.camera.zoom
    );

    // Oyuncuyu çiz
    this.player.draw(this.ctx, this.camera.x, this.camera.y, this.camera.zoom);

    // İnşa modu göstergesi
    if (this.isBuilding) {
      // Fare pozisyonundaki bloğu vurgula
      const worldX = Math.floor(
        (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
      );
      const worldY = Math.floor(
        (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
      );

      const screenX =
        (worldX * this.blockSize - this.camera.x) * this.camera.zoom;
      const screenY =
        (worldY * this.blockSize - this.camera.y) * this.camera.zoom;

      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        screenX,
        screenY,
        this.blockSize * this.camera.zoom,
        this.blockSize * this.camera.zoom
      );

      // Seçili blok göstergesi
      this.ctx.fillStyle = CONFIG.BLOCK_TYPES[this.selectedBlock].color;
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(
        screenX,
        screenY,
        this.blockSize * this.camera.zoom,
        this.blockSize * this.camera.zoom
      );
      this.ctx.globalAlpha = 1.0;
    }

    // Debug bilgileri
    if (this.showDebug) {
      this.renderDebugInfo();
    }
  }

  renderDebugInfo() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 10, 300, 150);

    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "left";

    const playerBlockX = Math.floor(this.player.x / this.blockSize);
    const playerBlockY = Math.floor(this.player.y / this.blockSize);

    this.ctx.fillText(`FPS: ${Math.round(1000 / this.fixedTimeStep)}`, 20, 30);
    this.ctx.fillText(
      `Oyuncu Pozisyonu: (${Math.round(this.player.x)}, ${Math.round(
        this.player.y
      )})`,
      20,
      50
    );
    this.ctx.fillText(
      `Blok Koordinatları: (${playerBlockX}, ${playerBlockY})`,
      20,
      70
    );
    this.ctx.fillText(
      `Kamera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`,
      20,
      90
    );
    this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 20, 110);
    this.ctx.fillText(
      `İnşa Modu: ${this.isBuilding ? "Açık" : "Kapalı"}`,
      20,
      130
    );
    this.ctx.fillText(
      `Seçili Blok: ${CONFIG.BLOCK_TYPES[this.selectedBlock].name}`,
      20,
      150
    );
  }

  connectWallet() {
    return this.web3.connectWallet();
  }

  mintLand(x, y, width, height) {
    return this.web3.mintLand(x, y, width, height);
  }
}

export default Game;
