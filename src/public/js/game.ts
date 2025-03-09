import CONFIG from "./config.js";
import World from "./world.js";
import Player from "./player.js";
import PhysicsEngine from "./physics.js";
import Web3Integration from "./web3Integration.js";

// Kamera arayüzü
interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// Tuş durumları arayüzü
interface Keys {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

// Fare pozisyonu arayüzü
interface Mouse {
  x: number;
  y: number;
  isDown: boolean;
  rightIsDown: boolean;
}

// Arazi arayüzü
interface Land {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Web3 2D Minecraft benzeri oyun
class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  blockSize: number;
  world: World;
  player: Player;
  camera: Camera;
  wallet: string | null;
  isWalletConnected: boolean;
  ownedLands: Land[];
  web3: Web3Integration;
  isRunning: boolean;
  selectedBlock: number;
  isBuilding: boolean;
  showDebug: boolean;
  isPaused: boolean;
  keys: Keys;
  physics: PhysicsEngine;
  lastTime: number;
  accumulator: number;
  fixedTimeStep: number;
  frameDelay: number;
  lastFrameTime: number;
  mouse: Mouse;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
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
    this.fixedTimeStep = CONFIG.TIME_STEP;
    this.frameDelay = 1000 / CONFIG.FRAME_RATE;
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

  init(): void {
    // Web3 entegrasyonunu başlat
    this.web3.initialize();

    // Kamerayı oyuncuya odakla
    this.updateCamera();

    console.log("Oyun başlatıldı");
  }

  setupEventListeners(): void {
    // Klavye olayları
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
    document.addEventListener("keyup", (e) => this.handleKeyUp(e));

    // Fare olayları
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  handleKeyDown(e: KeyboardEvent): void {
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
      case " ": // Boşluk tuşu
        this.player.jump();
        break;
      case "b":
      case "B":
        // İnşa modunu aç/kapa
        this.isBuilding = !this.isBuilding;
        console.log(this.isBuilding ? "İnşa modu açık" : "İnşa modu kapalı");
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
      case "0":
        // Blok seçimi
        const blockType = parseInt(e.key);
        if (blockType >= 0 && blockType <= 9) {
          this.selectedBlock = blockType;
          console.log(`Seçilen blok: ${CONFIG.BLOCK_TYPES[blockType].name}`);
        }
        break;
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
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

  handleMouseDown(e: MouseEvent): void {
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

  handleMouseUp(e: MouseEvent): void {
    // Sol tık
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
    // Sağ tık
    else if (e.button === 2) {
      this.mouse.rightIsDown = false;
    }
  }

  handleMouseMove(e: MouseEvent): void {
    // Fare pozisyonunu güncelle
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    // Fare basılıysa blok yerleştirme/kaldırma işlemlerini kontrol et
    if (this.mouse.isDown) {
      this.handleBlockPlacement();
    } else if (this.mouse.rightIsDown) {
      this.handleBlockRemoval();
    }
  }

  handleBlockPlacement(): void {
    if (!this.isBuilding) return;

    // Fare pozisyonunu dünya koordinatlarına dönüştür
    const worldX = Math.floor(
      (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
    );
    const worldY = Math.floor(
      (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
    );

    // Blok yerleştirme kontrolü
    if (this.canPlaceBlock(worldX, worldY)) {
      this.world.setBlock(worldX, worldY, this.selectedBlock);
    }
  }

  handleBlockRemoval(): void {
    // Fare pozisyonunu dünya koordinatlarına dönüştür
    const worldX = Math.floor(
      (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
    );
    const worldY = Math.floor(
      (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
    );

    // Blok kaldırma kontrolü
    if (this.canRemoveBlock(worldX, worldY)) {
      this.world.setBlock(worldX, worldY, 0); // 0: Hava
    }
  }

  canPlaceBlock(x: number, y: number): boolean {
    // Dünya sınırları içinde mi?
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return false;
    }

    // Mevcut blok hava mı?
    const currentBlock = this.world.getBlock(x, y);
    if (currentBlock !== 0) {
      return false;
    }

    // Oyuncunun içinde mi?
    const playerLeft = Math.floor(this.player.x / this.blockSize);
    const playerRight = Math.floor(
      (this.player.x + this.player.width) / this.blockSize
    );
    const playerTop = Math.floor(this.player.y / this.blockSize);
    const playerBottom = Math.floor(
      (this.player.y + this.player.height) / this.blockSize
    );

    if (
      x >= playerLeft &&
      x <= playerRight &&
      y >= playerTop &&
      y <= playerBottom
    ) {
      return false;
    }

    // Web3 entegrasyonu: Arazi sahibi mi?
    // if (!this.web3.isLandOwner(x, y)) {
    //   return false;
    // }

    return true;
  }

  canRemoveBlock(x: number, y: number): boolean {
    // Dünya sınırları içinde mi?
    if (x < 0 || x >= this.world.width || y < 0 || y >= this.world.height) {
      return false;
    }

    // Mevcut blok hava değil mi?
    const currentBlock = this.world.getBlock(x, y);
    if (currentBlock === 0 || currentBlock === undefined) {
      return false;
    }

    // Web3 entegrasyonu: Arazi sahibi mi?
    // if (!this.web3.isLandOwner(x, y)) {
    //   return false;
    // }

    return true;
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  gameLoop(timestamp: number): void {
    if (!this.isRunning) return;

    // Kare hızını sınırla
    if (timestamp - this.lastFrameTime < this.frameDelay) {
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      return;
    }

    // Zaman farkını hesapla ve sınırla
    let deltaTime = timestamp - this.lastTime;
    deltaTime = Math.min(deltaTime, CONFIG.MAX_DELTA_TIME);

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
    const maxSteps = CONFIG.PHYSICS_ITERATIONS;
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

  update(deltaTime: number): void {
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

  updateCamera(instant: boolean = false): void {
    // Hedef kamera pozisyonu (oyuncuyu merkezde tut)
    const targetX =
      this.player.x + this.player.width / 2 - this.width / this.camera.zoom / 2;
    const targetY =
      this.player.y +
      this.player.height / 2 -
      this.height / this.camera.zoom / 2;

    // Kamera takibi (yumuşak geçiş)
    if (instant) {
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

  render(): void {
    // Canvas'ı temizle
    this.ctx.fillStyle = "#87CEEB"; // Gökyüzü rengi
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
      // Fare pozisyonunu dünya koordinatlarına dönüştür
      const worldX = Math.floor(
        (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
      );
      const worldY = Math.floor(
        (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
      );

      // Geçerli blok yerleştirme pozisyonunu göster
      const screenX =
        (worldX * this.blockSize - this.camera.x) * this.camera.zoom;
      const screenY =
        (worldY * this.blockSize - this.camera.y) * this.camera.zoom;
      const screenWidth = this.blockSize * this.camera.zoom;
      const screenHeight = this.blockSize * this.camera.zoom;

      // Seçilen bloğun rengini göster
      this.ctx.fillStyle = CONFIG.BLOCK_TYPES[this.selectedBlock].color;
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
      this.ctx.globalAlpha = 1.0;

      // Blok çerçevesi
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    }

    // Debug bilgilerini göster
    if (this.showDebug) {
      this.renderDebugInfo();
    }
  }

  renderDebugInfo(): void {
    // Debug bilgilerini ekranın sol üst köşesine çiz
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(10, 10, 300, 150);

    this.ctx.font = "14px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";

    // Oyuncu pozisyonu
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);
    const playerBlockX = Math.floor(this.player.x / this.blockSize);
    const playerBlockY = Math.floor(this.player.y / this.blockSize);
    this.ctx.fillText(`Oyuncu Pozisyonu: (${playerX}, ${playerY})`, 20, 20);
    this.ctx.fillText(
      `Oyuncu Blok Pozisyonu: (${playerBlockX}, ${playerBlockY})`,
      20,
      40
    );

    // Oyuncu hızı
    const velocityX = this.player.velocityX.toFixed(2);
    const velocityY = this.player.velocityY.toFixed(2);
    this.ctx.fillText(`Oyuncu Hızı: (${velocityX}, ${velocityY})`, 20, 60);

    // Kamera pozisyonu
    const cameraX = Math.floor(this.camera.x);
    const cameraY = Math.floor(this.camera.y);
    this.ctx.fillText(`Kamera Pozisyonu: (${cameraX}, ${cameraY})`, 20, 80);

    // Fare pozisyonu
    const mouseX = Math.floor(this.mouse.x);
    const mouseY = Math.floor(this.mouse.y);
    const mouseWorldX = Math.floor(
      (this.mouse.x / this.camera.zoom + this.camera.x) / this.blockSize
    );
    const mouseWorldY = Math.floor(
      (this.mouse.y / this.camera.zoom + this.camera.y) / this.blockSize
    );
    this.ctx.fillText(`Fare Pozisyonu: (${mouseX}, ${mouseY})`, 20, 100);
    this.ctx.fillText(
      `Fare Dünya Pozisyonu: (${mouseWorldX}, ${mouseWorldY})`,
      20,
      120
    );

    // FPS
    const fps = Math.round(1000 / (performance.now() - this.lastTime));
    this.ctx.fillText(`FPS: ${fps}`, 20, 140);
  }

  connectWallet(): void {
    this.web3.connectWallet();
  }

  mintLand(x: number, y: number, width: number, height: number): void {
    this.web3.mintLand(x, y, width, height);
  }
}

export default Game;
