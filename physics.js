// Basit fizik motoru
class PhysicsEngine {
  constructor(game) {
    this.game = game;
    this.gravity = CONFIG.GRAVITY;
    this.friction = CONFIG.FRICTION;
    this.terminalVelocity = CONFIG.TERMINAL_VELOCITY;
    this.jumpForce = CONFIG.JUMP_FORCE;
    this.jumpCooldown = 0;
  }

  // Fizik güncellemesi
  update() {
    // Zıplama bekleme süresini azalt
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }

    // Oyuncuya yerçekimi uygula
    this.applyGravity();

    // Oyuncunun hareketini güncelle
    this.updatePlayerMovement();

    // Çarpışma kontrolü - önce yatay sonra dikey hareket için ayrı kontrol
    this.checkHorizontalCollisions();
    this.checkVerticalCollisions();
  }

  applyGravity() {
    // Eğer oyuncu havadaysa, yerçekimi uygula
    if (!this.isOnGround()) {
      this.game.player.velocityY += this.gravity;

      // Terminal hızı aşmayı önle
      if (this.game.player.velocityY > this.terminalVelocity) {
        this.game.player.velocityY = this.terminalVelocity;
      }
    } else if (this.game.player.velocityY > 0) {
      // Yerdeyse ve düşüyorsa dikey hızı sıfırla
      this.game.player.velocityY = 0;
    }
  }

  updatePlayerMovement() {
    // Hızları pozisyona uygula - önce yatay sonra dikey hareket
    this.game.player.x += this.game.player.velocityX;
    this.game.player.y += this.game.player.velocityY;

    // Oyuncu animasyonunu güncelle
    this.game.player.update();

    // Yön değişimini kontrol et
    if (this.game.player.velocityX > 0.5) {
      this.game.player.direction = 1; // Sağa
    } else if (this.game.player.velocityX < -0.5) {
      this.game.player.direction = -1; // Sola
    }
    // Durunca yönü değiştirme
  }

  isOnGround() {
    // Oyuncunun ayaklarının altındaki bloğu kontrol et
    const playerBottom = Math.floor(
      (this.game.player.y + this.game.player.height) / this.game.blockSize
    );
    const playerLeftEdge = Math.floor(
      (this.game.player.x + this.game.player.width * 0.2) / this.game.blockSize
    );
    const playerRightEdge = Math.floor(
      (this.game.player.x + this.game.player.width * 0.8) / this.game.blockSize
    );

    // Oyuncunun ayaklarının altındaki her bloğu kontrol et
    for (let x = playerLeftEdge; x <= playerRightEdge; x++) {
      if (
        playerBottom < this.game.world.height &&
        x >= 0 &&
        x < this.game.world.width
      ) {
        const block = this.game.world.getBlock(x, playerBottom);
        if (CONFIG.BLOCK_TYPES[block].solid) {
          // Oyuncunun tam olarak blok üzerinde olduğundan emin ol
          const blockTop = playerBottom * this.game.blockSize;
          if (
            this.game.player.y + this.game.player.height >= blockTop - 2 &&
            this.game.player.y + this.game.player.height <= blockTop + 2
          ) {
            return true;
          }
        }
      }
    }

    // Dünya sınırında mı kontrol et
    if (
      this.game.player.y + this.game.player.height >=
      this.game.world.height * this.game.blockSize
    ) {
      return true;
    }

    return false;
  }

  checkHorizontalCollisions() {
    // Oyuncunun yatay hareketinden sonraki sınırlarını hesapla
    const playerLeft = Math.floor(this.game.player.x / this.game.blockSize);
    const playerRight = Math.floor(
      (this.game.player.x + this.game.player.width) / this.game.blockSize
    );

    // Oyuncunun vücudunun üst ve alt kısmını kontrol et (baş ve ayaklar)
    const playerHeadY = Math.floor(
      (this.game.player.y + this.game.player.height * 0.25) /
        this.game.blockSize
    );
    const playerBodyY = Math.floor(
      (this.game.player.y + this.game.player.height * 0.75) /
        this.game.blockSize
    );
    const playerFeetY = Math.floor(
      (this.game.player.y + this.game.player.height - 1) / this.game.blockSize
    );

    const checkPoints = [playerHeadY, playerBodyY, playerFeetY];

    // Yatay çarpışma kontrolü
    for (let y of checkPoints) {
      if (y < 0 || y >= this.game.world.height) continue;

      // Sağ taraf çarpışması
      if (this.game.player.velocityX > 0) {
        if (playerRight < this.game.world.width) {
          const rightBlock = this.game.world.getBlock(playerRight, y);
          if (
            CONFIG.BLOCK_TYPES[rightBlock].solid &&
            this.game.player.x + this.game.player.width >
              playerRight * this.game.blockSize
          ) {
            this.game.player.x =
              playerRight * this.game.blockSize - this.game.player.width;
            this.game.player.velocityX = 0;
          }
        }
      }

      // Sol taraf çarpışması
      if (this.game.player.velocityX < 0) {
        if (playerLeft >= 0) {
          const leftBlock = this.game.world.getBlock(playerLeft, y);
          if (
            CONFIG.BLOCK_TYPES[leftBlock].solid &&
            this.game.player.x < (playerLeft + 1) * this.game.blockSize
          ) {
            this.game.player.x = (playerLeft + 1) * this.game.blockSize;
            this.game.player.velocityX = 0;
          }
        }
      }
    }
  }

  checkVerticalCollisions() {
    // Oyuncunun dikey hareketinden sonraki sınırlarını hesapla
    const playerTop = Math.floor(this.game.player.y / this.game.blockSize);
    const playerBottom = Math.floor(
      (this.game.player.y + this.game.player.height) / this.game.blockSize
    );

    // Oyuncunun vücudunun sol ve sağ kısmını kontrol et
    const playerLeftEdge = Math.floor(
      (this.game.player.x + this.game.player.width * 0.2) / this.game.blockSize
    );
    const playerRightEdge = Math.floor(
      (this.game.player.x + this.game.player.width * 0.8) / this.game.blockSize
    );

    const checkPoints = [playerLeftEdge, playerRightEdge];

    // Dikey çarpışma kontrolü
    for (let x of checkPoints) {
      if (x < 0 || x >= this.game.world.width) continue;

      // Tavan çarpışması
      if (this.game.player.velocityY < 0) {
        if (playerTop >= 0) {
          const topBlock = this.game.world.getBlock(x, playerTop);
          if (
            CONFIG.BLOCK_TYPES[topBlock].solid &&
            this.game.player.y < (playerTop + 1) * this.game.blockSize
          ) {
            this.game.player.y = (playerTop + 1) * this.game.blockSize;
            this.game.player.velocityY = 0;
          }
        }
      }

      // Zemin çarpışması
      if (this.game.player.velocityY > 0) {
        if (playerBottom < this.game.world.height) {
          const bottomBlock = this.game.world.getBlock(x, playerBottom);
          if (
            CONFIG.BLOCK_TYPES[bottomBlock].solid &&
            this.game.player.y + this.game.player.height >
              playerBottom * this.game.blockSize
          ) {
            this.game.player.y =
              playerBottom * this.game.blockSize - this.game.player.height;
            this.game.player.velocityY = 0;

            // Yere düştüğünde zıplama durumunu sıfırla
            this.game.player.isJumping = false;
          }
        }
      }
    }

    // Dünya sınırlarını kontrol et
    if (this.game.player.x < 0) {
      this.game.player.x = 0;
      this.game.player.velocityX = 0;
    }
    if (
      this.game.player.x + this.game.player.width >
      this.game.world.width * this.game.blockSize
    ) {
      this.game.player.x =
        this.game.world.width * this.game.blockSize - this.game.player.width;
      this.game.player.velocityX = 0;
    }
    if (this.game.player.y < 0) {
      this.game.player.y = 0;
      this.game.player.velocityY = 0;
    }
    if (
      this.game.player.y + this.game.player.height >
      this.game.world.height * this.game.blockSize
    ) {
      this.game.player.y =
        this.game.world.height * this.game.blockSize - this.game.player.height;
      this.game.player.velocityY = 0;
      this.game.player.isJumping = false;
    }
  }

  // Zıplama fonksiyonu
  jump() {
    if (this.isOnGround() && this.jumpCooldown <= 0) {
      this.game.player.velocityY = this.jumpForce;
      this.game.player.isJumping = true;
      this.jumpCooldown = 10; // 10 kare boyunca zıplayamaz
    }
  }
}
