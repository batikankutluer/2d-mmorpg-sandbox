import CONFIG from "./config.js";

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

    // Oyuncunun hareketini güncelle - önce yatay sonra dikey
    this.updatePlayerMovement();

    // Çarpışma kontrolü - önce yatay sonra dikey hareket için ayrı kontrol
    // Daha küçük adımlarla hareket ettirerek daha doğru çarpışma kontrolü
    const steps = 6; // Hareket adımı sayısını 5'ten 6'ya çıkardık

    // Yatay ve dikey hızları kaydet
    const originalVelocityX = this.game.player.velocityX;
    const originalVelocityY = this.game.player.velocityY;

    // Hızları adım sayısına böl
    this.game.player.velocityX = originalVelocityX / steps;
    this.game.player.velocityY = originalVelocityY / steps;

    // Her adımda hem yatay hem dikey hareketi kontrol et
    for (let i = 0; i < steps; i++) {
      // Önce yatay hareket
      this.game.player.x += this.game.player.velocityX;
      this.checkHorizontalCollisions();

      // Sonra dikey hareket
      this.game.player.y += this.game.player.velocityY;
      this.checkVerticalCollisions();
    }

    // Hızları orijinal değerlerine geri getir, ancak çarpışma durumunda değişmiş olabilirler
    // Bu nedenle, orijinal değerleri doğrudan atamak yerine, mevcut değerleri adım sayısıyla çarpıyoruz
    this.game.player.velocityX *= steps;
    this.game.player.velocityY *= steps;

    // Havada çarpışma durumunda hızları sınırla
    if (!this.isOnGround()) {
      // Havada yatay hızı sınırla
      const maxAirSpeed = CONFIG.PLAYER_SPEED * 0.9; // 0.8'den 0.9'a çıkardık
      if (Math.abs(this.game.player.velocityX) > maxAirSpeed) {
        this.game.player.velocityX =
          Math.sign(this.game.player.velocityX) * maxAirSpeed;
      }
    }

    // Dünya sınırlarını kontrol et
    this.checkWorldBoundaries();
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
    if (Math.abs(this.game.player.velocityX) > 0.1) {
      // Hareket yönüne göre yönü belirle
      this.game.player.direction = this.game.player.velocityX > 0 ? 1 : -1;
    }

    // Sürtünme uygula
    this.game.player.velocityX *= this.friction;

    // Çok küçük hızları sıfırla (kayma önleme)
    if (Math.abs(this.game.player.velocityX) < 0.1) {
      this.game.player.velocityX = 0;
    }
  }

  isOnGround() {
    // Oyuncunun altındaki blokları kontrol et
    const playerLeft = Math.floor(this.game.player.x / CONFIG.BLOCK_SIZE);
    const playerRight = Math.floor(
      (this.game.player.x + this.game.player.width - 1) / CONFIG.BLOCK_SIZE
    );
    const playerBottom = Math.floor(
      (this.game.player.y + this.game.player.height) / CONFIG.BLOCK_SIZE
    );

    // Oyuncunun altındaki tüm blokları kontrol et
    for (let x = playerLeft; x <= playerRight; x++) {
      // Oyuncunun tam altındaki bloğu kontrol et
      const blockType = this.game.world.getBlock(x, playerBottom);

      // Eğer blok varsa ve katıysa, oyuncu yerde demektir
      if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
        // Oyuncunun tam olarak bloğun üstünde olduğunu kontrol et
        const blockTop = playerBottom * CONFIG.BLOCK_SIZE;
        const playerBottomPos = this.game.player.y + this.game.player.height;

        // Eğer oyuncu bloğun üstüne çok yakınsa (1 piksel tolerans)
        if (Math.abs(playerBottomPos - blockTop) < 1) {
          // Oyuncu yere indiğinde zıplama durumunu sıfırla
          if (this.game.player.isJumping) {
            this.game.player.isJumping = false;
          }
          return true;
        }
      }
    }

    // Hiçbir katı blok bulunamadıysa, oyuncu havadadır
    return false;
  }

  checkHorizontalCollisions() {
    // Oyuncunun yeni yatay pozisyonunu hesapla
    const newX = this.game.player.x;

    // Oyuncunun sınırlarını hesapla
    const playerLeft = newX;
    const playerRight = newX + this.game.player.width;
    const playerTop = this.game.player.y + 4; // Kafanın 4 piksel altından başla (kafaya çarpma sorununu önlemek için)
    const playerBottom = this.game.player.y + this.game.player.height - 4; // 4 piksel tolerans

    // Oyuncunun bulunduğu blok koordinatlarını hesapla
    const blockLeft = Math.floor(playerLeft / CONFIG.BLOCK_SIZE);
    const blockRight = Math.floor(playerRight / CONFIG.BLOCK_SIZE);
    const blockTop = Math.floor(playerTop / CONFIG.BLOCK_SIZE);
    const blockBottom = Math.floor(playerBottom / CONFIG.BLOCK_SIZE);

    // Çarpışma olup olmadığını kontrol et
    let collision = false;

    // Yatay çarpışma kontrolü
    for (let y = blockTop; y <= blockBottom; y++) {
      // Sağa hareket ediyorsa sağdaki blokları kontrol et
      if (this.game.player.velocityX > 0) {
        const blockType = this.game.world.getBlock(blockRight, y);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Çarpışma var, oyuncuyu bloğun soluna yerleştir
          this.game.player.x =
            blockRight * CONFIG.BLOCK_SIZE - this.game.player.width;

          // Havada çarpışma durumunda yatay hızı azalt ama tamamen sıfırlama
          if (!this.isOnGround()) {
            this.game.player.velocityX *= 0.3; // 0.5'ten 0.3'e düşürdük
          } else {
            // Yerdeyse hızı sıfırla
            this.game.player.velocityX = 0;
          }

          collision = true;
          break;
        }
      }
      // Sola hareket ediyorsa soldaki blokları kontrol et
      else if (this.game.player.velocityX < 0) {
        const blockType = this.game.world.getBlock(blockLeft, y);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Çarpışma var, oyuncuyu bloğun sağına yerleştir
          this.game.player.x = (blockLeft + 1) * CONFIG.BLOCK_SIZE;

          // Havada çarpışma durumunda yatay hızı azalt ama tamamen sıfırlama
          if (!this.isOnGround()) {
            this.game.player.velocityX *= 0.3; // 0.5'ten 0.3'e düşürdük
          } else {
            // Yerdeyse hızı sıfırla
            this.game.player.velocityX = 0;
          }

          collision = true;
          break;
        }
      }
    }

    // Dünya sınırları kontrolü
    if (this.game.player.x < 0) {
      this.game.player.x = 0;
      this.game.player.velocityX = 0;
    } else if (
      this.game.player.x + this.game.player.width >
      this.game.world.width * CONFIG.BLOCK_SIZE
    ) {
      this.game.player.x =
        this.game.world.width * CONFIG.BLOCK_SIZE - this.game.player.width;
      this.game.player.velocityX = 0;
    }
  }

  checkVerticalCollisions() {
    // Oyuncunun yeni dikey pozisyonunu hesapla
    const newY = this.game.player.y;

    // Oyuncunun sınırlarını hesapla
    const playerLeft = this.game.player.x + 2; // 2 piksel tolerans
    const playerRight = this.game.player.x + this.game.player.width - 2; // 2 piksel tolerans
    const playerTop = newY;
    const playerBottom = newY + this.game.player.height;

    // Oyuncunun bulunduğu blok koordinatlarını hesapla
    const blockLeft = Math.floor(playerLeft / CONFIG.BLOCK_SIZE);
    const blockRight = Math.floor(playerRight / CONFIG.BLOCK_SIZE);
    const blockTop = Math.floor(playerTop / CONFIG.BLOCK_SIZE);
    const blockBottom = Math.floor(playerBottom / CONFIG.BLOCK_SIZE);

    // Çarpışma olup olmadığını kontrol et
    let collision = false;

    // Dikey çarpışma kontrolü
    for (let x = blockLeft; x <= blockRight; x++) {
      // Aşağı hareket ediyorsa alttaki blokları kontrol et
      if (this.game.player.velocityY > 0) {
        const blockType = this.game.world.getBlock(x, blockBottom);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Çarpışma var, oyuncuyu bloğun üstüne yerleştir
          this.game.player.y =
            blockBottom * CONFIG.BLOCK_SIZE - this.game.player.height;
          this.game.player.velocityY = 0;

          // Oyuncu yere indiğinde zıplama durumunu sıfırla
          this.game.player.isJumping = false;

          collision = true;
          break;
        }
      }
      // Yukarı hareket ediyorsa üstteki blokları kontrol et
      else if (this.game.player.velocityY < 0) {
        const blockType = this.game.world.getBlock(x, blockTop);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Çarpışma var, oyuncuyu bloğun altına yerleştir
          this.game.player.y = (blockTop + 1) * CONFIG.BLOCK_SIZE;

          // Kafaya çarpma durumunda dikey hızı sıfırla
          // Geri atılma sorununu önlemek için yatay hızı tamamen koruyoruz
          this.game.player.velocityY = 0;

          // Kafaya çarpma durumunda yatay hızı değiştirme
          // Bu, geri atılma sorununu tamamen çözecek

          collision = true;
          break;
        }
      }
    }

    // Dünya sınırları kontrolü
    if (this.game.player.y < 0) {
      this.game.player.y = 0;
      this.game.player.velocityY = 0;
    } else if (
      this.game.player.y + this.game.player.height >
      this.game.world.height * CONFIG.BLOCK_SIZE
    ) {
      this.game.player.y =
        this.game.world.height * CONFIG.BLOCK_SIZE - this.game.player.height;
      this.game.player.velocityY = 0;
      this.game.player.isJumping = false;
    }
  }

  jump() {
    // Eğer oyuncu yerdeyse ve zıplama bekleme süresi bittiyse
    if (this.isOnGround() && this.jumpCooldown <= 0) {
      // Zıplama kuvveti uygula
      this.game.player.velocityY = this.jumpForce;

      // Zıplama animasyonu
      this.game.player.isJumping = true;

      // Zıplama bekleme süresini ayarla
      this.jumpCooldown = 15;

      // Zıplama sırasında yatay hızı biraz azalt (Growtopia'daki gibi)
      this.game.player.velocityX *= 0.7;
    }
    // Eğer oyuncu havadaysa ve hala yukarı doğru hareket ediyorsa, zıplama tuşuna basılı tutma etkisi
    else if (
      this.game.player.isJumping &&
      this.game.player.velocityY < 0 &&
      this.jumpCooldown <= 10
    ) {
      // Zıplama tuşuna basılı tutma etkisi - yerçekimini azalt
      this.game.player.velocityY += this.gravity * 0.5; // Yerçekiminin yarısı kadar etki
    }
  }

  // Dünya sınırlarını kontrol et
  checkWorldBoundaries() {
    // Yatay sınırlar
    if (this.game.player.x < 0) {
      this.game.player.x = 0;
      this.game.player.velocityX = 0;
    } else if (
      this.game.player.x + this.game.player.width >
      this.game.world.width * CONFIG.BLOCK_SIZE
    ) {
      this.game.player.x =
        this.game.world.width * CONFIG.BLOCK_SIZE - this.game.player.width;
      this.game.player.velocityX = 0;
    }

    // Dikey sınırlar
    if (this.game.player.y < 0) {
      this.game.player.y = 0;
      this.game.player.velocityY = 0;
    } else if (
      this.game.player.y + this.game.player.height >
      this.game.world.height * CONFIG.BLOCK_SIZE
    ) {
      this.game.player.y =
        this.game.world.height * CONFIG.BLOCK_SIZE - this.game.player.height;
      this.game.player.velocityY = 0;
    }
  }
}

export default PhysicsEngine;
