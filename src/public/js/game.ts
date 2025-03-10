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
  space: boolean; // Space tuşu
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
  blockTextures: { [key: number]: HTMLImageElement }; // Blok texture'ları

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
      zoom: CONFIG.STANDARD_ZOOM, // Zoom seviyesi
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
      space: false,
    };

    // Blok texture'ları
    this.blockTextures = {};

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

    // Blok texture'larını yükle
    this.loadBlockTextures();

    // Kamerayı oyuncuya odakla
    this.updateCamera();

    console.log("Oyun başlatıldı");
  }

  loadBlockTextures(): void {
    // Tüm blok tiplerini kontrol et
    for (const blockTypeStr in CONFIG.BLOCK_TYPES) {
      const blockType = parseInt(blockTypeStr);
      const blockInfo = CONFIG.BLOCK_TYPES[blockType];

      // Eğer texture varsa yükle
      if (blockInfo.texture) {
        const img = new Image();
        img.src = blockInfo.texture;
        this.blockTextures[blockType] = img;

        console.log(`Blok texture'ı yükleniyor: ${blockInfo.name}`);
      }
    }
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
        this.player.jump();
        break;
      case "ArrowDown":
      case "s":
      case "S":
        this.keys.down = true;
        break;
      case " ": // Boşluk tuşu
        this.keys.space = true;
        this.player.jump();
        break;
      case "b":
      case "B":
        // İnşa modunu aç/kapa
        this.isBuilding = !this.isBuilding;
        console.log(this.isBuilding ? "İnşa modu açık" : "İnşa modu kapalı");
        break;
      case "f":
      case "F":
        // Debug modunu aç/kapa
        this.showDebug = !this.showDebug;
        console.log(this.showDebug ? "Debug modu açık" : "Debug modu kapalı");
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
      case " ": // Boşluk tuşu
        this.keys.space = false;
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
      this.camera.zoom,
      this.blockTextures
    );

    // Oyuncuyu çiz
    this.player.draw(this.ctx, this.camera.x, this.camera.y, this.camera.zoom);

    // Debug modunda çarpışma kutusunu göster
    if (this.showDebug) {
      this.renderPlayerCollisionBox();
    }

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
    this.ctx.fillRect(10, 10, 300, 240); // Yüksekliği azalttım

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

    // Zoom seviyesi
    const zoom = this.camera.zoom.toFixed(2);
    this.ctx.fillText(`Zoom Seviyesi: ${zoom}`, 20, 100);

    // FPS
    const fps = Math.round(1000 / (performance.now() - this.lastFrameTime));
    this.ctx.fillText(`FPS: ${fps}`, 20, 120);

    // Zıplama bilgileri
    const jumpHoldTime = this.player.jumpHoldTime;
    const maxJumpHoldTime = this.player.maxJumpHoldTime;
    const jumpHoldRatio = Math.min(jumpHoldTime / maxJumpHoldTime, 1.0).toFixed(
      2
    );
    const jumpPowerFactor = this.player.jumpPowerFactor.toFixed(2);
    this.ctx.fillText(
      `Zıplama Basılı Tutma: ${jumpHoldTime}ms / ${maxJumpHoldTime}ms (${jumpHoldRatio})`,
      20,
      160
    );
    this.ctx.fillText(`Zıplama Gücü Faktörü: ${jumpPowerFactor}`, 20, 180);

    // Oyuncu durumu
    this.ctx.fillText(`Oyuncu Durumu: ${this.player.state}`, 20, 200);

    // Yerde mi?
    const onGround = this.physics.isOnGround();
    this.ctx.fillText(`Yerde mi: ${onGround ? "Evet" : "Hayır"}`, 20, 220);

    // Debug kontrolleri hakkında bilgi
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(10, this.height - 60, 300, 50);
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Debug Kontrolleri:", 20, this.height - 55);
    this.ctx.fillText(
      "F: Debug modu aç/kapa | B: İnşa modu aç/kapa",
      20,
      this.height - 35
    );
  }

  renderPlayerCollisionBox(): void {
    // Oyuncunun çarpışma kutusu
    const playerLeft = this.player.x;
    const playerRight = this.player.x + this.player.width;
    const playerTop = this.player.y;
    const playerBottom = this.player.y + this.player.height;

    // Ekran koordinatlarına dönüştür
    const screenLeft = (playerLeft - this.camera.x) * this.camera.zoom;
    const screenRight = (playerRight - this.camera.x) * this.camera.zoom;
    const screenTop = (playerTop - this.camera.y) * this.camera.zoom;
    const screenBottom = (playerBottom - this.camera.y) * this.camera.zoom;

    // Çarpışma kutusunu çiz - daha belirgin olması için yarı saydam dolgu ekle
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.1)"; // Kırmızı yarı saydam dolgu
    this.ctx.fillRect(
      screenLeft,
      screenTop,
      screenRight - screenLeft,
      screenBottom - screenTop
    );

    // Çarpışma kutusu çerçevesi
    this.ctx.strokeStyle = "red";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      screenLeft,
      screenTop,
      screenRight - screenLeft,
      screenBottom - screenTop
    );

    // Gerçek çarpışma kutusu (daha dar)
    const collisionLeft = playerLeft + this.player.width * 0.15;
    const collisionRight = playerLeft + this.player.width * 0.85;
    const collisionTop = playerTop;
    const collisionBottom = playerBottom;

    // Ekran koordinatlarına dönüştür
    const screenCollisionLeft =
      (collisionLeft - this.camera.x) * this.camera.zoom;
    const screenCollisionRight =
      (collisionRight - this.camera.x) * this.camera.zoom;
    const screenCollisionTop =
      (collisionTop - this.camera.y) * this.camera.zoom;
    const screenCollisionBottom =
      (collisionBottom - this.camera.y) * this.camera.zoom;

    // Gerçek çarpışma kutusunu çiz
    this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; // Daha koyu kırmızı yarı saydam dolgu
    this.ctx.fillRect(
      screenCollisionLeft,
      screenCollisionTop,
      screenCollisionRight - screenCollisionLeft,
      screenCollisionBottom - screenCollisionTop
    );

    // Gerçek çarpışma kutusu çerçevesi
    this.ctx.strokeStyle = "darkred";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      screenCollisionLeft,
      screenCollisionTop,
      screenCollisionRight - screenCollisionLeft,
      screenCollisionBottom - screenCollisionTop
    );

    // "Collision Box" yazısı ekle
    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Visual Box",
      screenLeft + (screenRight - screenLeft) / 2,
      screenTop - 15
    );

    // "Actual Collision Box" yazısı ekle
    this.ctx.fillText(
      "Actual Collision Box",
      screenCollisionLeft + (screenCollisionRight - screenCollisionLeft) / 2,
      screenCollisionTop - 5
    );

    // Oyuncunun merkez noktasını çiz
    const playerCenterX = (playerLeft + playerRight) / 2;
    const playerCenterY = (playerTop + playerBottom) / 2;
    const screenCenterX = (playerCenterX - this.camera.x) * this.camera.zoom;
    const screenCenterY = (playerCenterY - this.camera.y) * this.camera.zoom;

    this.ctx.fillStyle = "yellow";
    this.ctx.beginPath();
    this.ctx.arc(screenCenterX, screenCenterY, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Merkez noktası yazısı
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Merkez", screenCenterX, screenCenterY - 10);

    // Oyuncunun altındaki blokları kontrol et
    const playerLeftBlock = Math.floor(playerLeft / this.blockSize);
    const playerRightBlock = Math.floor((playerRight - 0.01) / this.blockSize);
    const playerBottomBlock = Math.floor(playerBottom / this.blockSize);

    // Oyuncunun altındaki blokları vurgula
    for (let x = playerLeftBlock; x <= playerRightBlock; x++) {
      const blockScreenX =
        (x * this.blockSize - this.camera.x) * this.camera.zoom;
      const blockScreenY =
        (playerBottomBlock * this.blockSize - this.camera.y) * this.camera.zoom;

      // Blok tipini kontrol et
      const blockType = this.world.getBlock(x, playerBottomBlock);

      // Blok varsa ve katıysa
      if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
        // Platform ise mavi, normal blok ise yeşil
        if (CONFIG.BLOCK_TYPES[blockType].isPlatform) {
          this.ctx.strokeStyle = "blue";
          this.ctx.fillStyle = "rgba(0, 0, 255, 0.2)"; // Mavi yarı saydam dolgu
        } else {
          this.ctx.strokeStyle = "green";
          this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)"; // Yeşil yarı saydam dolgu
        }
      } else {
        // Hava veya katı olmayan blok ise kırmızı
        this.ctx.strokeStyle = "red";
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.1)"; // Kırmızı yarı saydam dolgu
      }

      // Blok dolgusu
      this.ctx.fillRect(
        blockScreenX,
        blockScreenY,
        this.blockSize * this.camera.zoom,
        this.blockSize * this.camera.zoom
      );

      // Blok çerçevesi
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        blockScreenX,
        blockScreenY,
        this.blockSize * this.camera.zoom,
        this.blockSize * this.camera.zoom
      );
    }

    // Platform kenarı kontrolünü görselleştir
    this.renderPlatformEdgeCheck();

    // Yatay çarpışma kontrolü için kullanılan noktaları çiz
    this.renderHorizontalCollisionPoints();

    // Dikey çarpışma kontrolü için kullanılan noktaları çiz
    this.renderVerticalCollisionPoints();
  }

  renderPlatformEdgeCheck(): void {
    const player = this.player;
    const ctx = this.ctx;

    // Oyuncunun altındaki blokları kontrol et
    const playerLeft = Math.floor(player.x / CONFIG.BLOCK_SIZE);
    const playerRight = Math.floor(
      (player.x + player.width - 0.01) / CONFIG.BLOCK_SIZE
    );
    const playerBottom = Math.floor(
      (player.y + player.height) / CONFIG.BLOCK_SIZE
    );

    // Oyuncunun ayaklarının tam pozisyonu
    const playerBottomPos = player.y + player.height;

    // Oyuncunun merkez X pozisyonu
    const playerCenterX = player.x + player.width / 2;
    const playerCenterBlockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);

    // Platformları ve kenarları görselleştir
    let platformBlocks = [];

    // Oyuncunun altındaki tüm blokları kontrol et
    for (let x = playerLeft - 1; x <= playerRight + 1; x++) {
      const blockType = this.world.getBlock(x, playerBottom);

      // Blok koordinatlarını ekran koordinatlarına dönüştür
      const screenX =
        (x * CONFIG.BLOCK_SIZE - this.camera.x) * this.camera.zoom;
      const screenY =
        (playerBottom * CONFIG.BLOCK_SIZE - this.camera.y) * this.camera.zoom;
      const blockWidth = CONFIG.BLOCK_SIZE * this.camera.zoom;
      const blockHeight = CONFIG.BLOCK_SIZE * this.camera.zoom;

      // Eğer blok bir platform ise
      if (
        blockType !== undefined &&
        CONFIG.BLOCK_TYPES[blockType].solid &&
        CONFIG.BLOCK_TYPES[blockType].isPlatform
      ) {
        // Platformun üzerinde olup olmadığını kontrol et
        const blockTop = playerBottom * CONFIG.BLOCK_SIZE;

        // Eğer oyuncu platformun üstündeyse
        if (Math.abs(playerBottomPos - blockTop) < 2) {
          // Platform bloğunu turkuaz renkle işaretle
          ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
          ctx.fillRect(screenX, screenY, blockWidth, blockHeight);

          // Platform bloğunun merkezini işaretle
          const blockCenterX = screenX + blockWidth / 2;
          const blockCenterY = screenY + blockHeight / 2;
          ctx.fillStyle = "pink";
          ctx.beginPath();
          ctx.arc(blockCenterX, blockCenterY, 3, 0, Math.PI * 2);
          ctx.fill();

          platformBlocks.push(x);
        }
      }
    }

    // Oyuncunun merkez bloğunu kontrol et
    const centerBlockType = this.world.getBlock(
      playerCenterBlockX,
      playerBottom
    );
    const isCenterOnPlatform =
      centerBlockType !== undefined &&
      CONFIG.BLOCK_TYPES[centerBlockType]?.solid &&
      CONFIG.BLOCK_TYPES[centerBlockType]?.isPlatform;

    // Oyuncunun merkez bloğunu görselleştir
    const centerScreenX =
      (playerCenterBlockX * CONFIG.BLOCK_SIZE - this.camera.x) *
      this.camera.zoom;
    const centerScreenY =
      (playerBottom * CONFIG.BLOCK_SIZE - this.camera.y) * this.camera.zoom;
    const centerBlockWidth = CONFIG.BLOCK_SIZE * this.camera.zoom;
    const centerBlockHeight = CONFIG.BLOCK_SIZE * this.camera.zoom;

    // Merkez bloğu çerçevele
    ctx.strokeStyle = isCenterOnPlatform ? "lime" : "red";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      centerScreenX,
      centerScreenY,
      centerBlockWidth,
      centerBlockHeight
    );

    // Oyuncunun merkez noktasını çiz
    const screenPlayerCenterX =
      (playerCenterX - this.camera.x) * this.camera.zoom;
    const screenPlayerCenterY =
      (playerBottom * CONFIG.BLOCK_SIZE - this.camera.y) * this.camera.zoom;

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(screenPlayerCenterX, screenPlayerCenterY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Merkez bloğu etiketle
    ctx.font = "10px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      isCenterOnPlatform
        ? "Merkez Platform Üzerinde"
        : "Merkez Platform Dışında",
      centerScreenX + centerBlockWidth / 2,
      centerScreenY - 5
    );

    // Eğer platform blokları bulunduysa, kenarları kontrol et
    if (platformBlocks.length > 0) {
      // Sol kenar kontrolü
      const leftEdge = playerLeft - 1;
      const leftBlock = this.world.getBlock(leftEdge, playerBottom);
      const isLeftEdge =
        platformBlocks.includes(playerLeft) && // Oyuncunun sol ayağı bir platform üzerinde
        (leftBlock === undefined ||
          !CONFIG.BLOCK_TYPES[leftBlock]?.solid ||
          !CONFIG.BLOCK_TYPES[leftBlock]?.isPlatform); // Sol tarafta platform yok

      // Sağ kenar kontrolü
      const rightEdge = playerRight + 1;
      const rightBlock = this.world.getBlock(rightEdge, playerBottom);
      const isRightEdge =
        platformBlocks.includes(playerRight) && // Oyuncunun sağ ayağı bir platform üzerinde
        (rightBlock === undefined ||
          !CONFIG.BLOCK_TYPES[rightBlock]?.solid ||
          !CONFIG.BLOCK_TYPES[rightBlock]?.isPlatform); // Sağ tarafta platform yok

      // Kenarları görselleştir
      ctx.font = "10px Arial";

      // Sol kenar
      if (isLeftEdge) {
        const edgeScreenX =
          (playerLeft * CONFIG.BLOCK_SIZE - this.camera.x) * this.camera.zoom;
        const edgeScreenY =
          (playerBottom * CONFIG.BLOCK_SIZE - this.camera.y) * this.camera.zoom;

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(edgeScreenX, edgeScreenY);
        ctx.lineTo(edgeScreenX, edgeScreenY - 20 * this.camera.zoom);
        ctx.stroke();

        ctx.fillStyle = "yellow";
        ctx.fillText(
          "Sol Kenar",
          edgeScreenX - 20,
          edgeScreenY - 25 * this.camera.zoom
        );
      }

      // Sağ kenar
      if (isRightEdge) {
        const edgeScreenX =
          ((playerRight + 1) * CONFIG.BLOCK_SIZE - this.camera.x) *
          this.camera.zoom;
        const edgeScreenY =
          (playerBottom * CONFIG.BLOCK_SIZE - this.camera.y) * this.camera.zoom;

        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(edgeScreenX, edgeScreenY);
        ctx.lineTo(edgeScreenX, edgeScreenY - 20 * this.camera.zoom);
        ctx.stroke();

        ctx.fillStyle = "yellow";
        ctx.fillText(
          "Sağ Kenar",
          edgeScreenX - 20,
          edgeScreenY - 25 * this.camera.zoom
        );
      }

      // Oyuncunun hareket yönünü göster
      ctx.fillStyle = "white";
      ctx.fillText(`Hız X: ${player.velocityX.toFixed(2)}`, 10, 130);

      // Platform kenarında olup olmadığını göster
      const isOnEdge =
        ((isLeftEdge && player.velocityX < -0.1) ||
          (isRightEdge && player.velocityX > 0.1)) &&
        !isCenterOnPlatform;
      ctx.fillStyle = isOnEdge ? "lime" : "red";
      ctx.fillText(
        `Platform Kenarında: ${isOnEdge ? "Evet" : "Hayır"}`,
        10,
        145
      );
    }
  }

  renderHorizontalCollisionPoints(): void {
    // Oyuncunun yatay çarpışma kontrolü için kullanılan noktalar
    const playerLeft = this.player.x + this.player.width * 0.15; // %15 içeriden başla
    const playerRight = this.player.x + this.player.width * 0.85; // %85'e kadar git
    const playerTop = this.player.y + 4 / this.blockSize; // 4 piksel tolerans
    const playerBottom =
      this.player.y + this.player.height - 4 / this.blockSize; // 4 piksel tolerans

    // Sol üst köşe
    this.drawCollisionPoint(playerLeft, playerTop, "purple");

    // Sağ üst köşe
    this.drawCollisionPoint(playerRight, playerTop, "purple");

    // Sol alt köşe
    this.drawCollisionPoint(playerLeft, playerBottom, "purple");

    // Sağ alt köşe
    this.drawCollisionPoint(playerRight, playerBottom, "purple");
  }

  renderVerticalCollisionPoints(): void {
    // Oyuncunun dikey çarpışma kontrolü için kullanılan noktalar
    const playerLeft = this.player.x + this.player.width * 0.15; // %15 içeriden başla
    const playerRight = this.player.x + this.player.width * 0.85; // %85'e kadar git
    const playerTop = this.player.y;
    const playerBottom = this.player.y + this.player.height;

    // Sol üst köşe
    this.drawCollisionPoint(playerLeft, playerTop, "orange");

    // Sağ üst köşe
    this.drawCollisionPoint(playerRight, playerTop, "orange");

    // Sol alt köşe
    this.drawCollisionPoint(playerLeft, playerBottom, "orange");

    // Sağ alt köşe
    this.drawCollisionPoint(playerRight, playerBottom, "orange");
  }

  drawCollisionPoint(x: number, y: number, color: string): void {
    // Ekran koordinatlarına dönüştür
    const screenX = (x - this.camera.x) * this.camera.zoom;
    const screenY = (y - this.camera.y) * this.camera.zoom;

    // Noktayı çiz
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  connectWallet(): void {
    this.web3.connectWallet();
  }

  mintLand(x: number, y: number, width: number, height: number): void {
    this.web3.mintLand(x, y, width, height);
  }
}

export default Game;
