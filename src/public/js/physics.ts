import CONFIG from "./config.js";
import Game from "./game.js";
import { PlayerState } from "./player.js";

// Basit fizik motoru
class PhysicsEngine {
  game: Game;
  gravity: number;
  friction: number;
  terminalVelocity: number;
  jumpForce: number;
  jumpCooldown: number;

  constructor(game: Game) {
    this.game = game;
    this.gravity = CONFIG.GRAVITY;
    this.friction = CONFIG.FRICTION;
    this.terminalVelocity = CONFIG.TERMINAL_VELOCITY;

    // Zıplama kuvvetini zıplama yüksekliğine göre hesapla
    // Fizik formülü: v^2 = 2 * g * h
    // v: başlangıç hızı, g: yerçekimi, h: yükseklik
    // v = sqrt(2 * g * h)
    // Negatif değer yukarı doğru hareketi temsil eder
    // Tam 2.5 blok yüksekliğine ulaşmak için katsayıyı 1.0 yapıyoruz
    this.jumpForce = -Math.sqrt(
      2 * this.gravity * CONFIG.JUMP_HEIGHT * CONFIG.BLOCK_SIZE
    );

    this.jumpCooldown = 0;
  }

  // Fizik güncellemesi
  update(): void {
    // Zıplama bekleme süresini azalt
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }

    // Oyuncuya yerçekimi uygula
    this.applyGravity();

    // Zıplama tuşuna basılı tutma durumunu kontrol et
    this.checkJumpHold();

    // Oyuncunun hareketini güncelle
    // Not: updatePlayerMovement içinde pozisyon güncellemesi yapmıyoruz
    // Sadece hız hesaplamaları yapıyoruz
    this.updatePlayerMovement();

    // Çarpışma kontrolü - önce yatay sonra dikey hareket için ayrı kontrol
    // Daha küçük adımlarla hareket ettirerek daha doğru çarpışma kontrolü
    const steps = 6; // Hareket adımı sayısı

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
      const maxAirSpeed = CONFIG.PLAYER_SPEED * 0.9;
      if (Math.abs(this.game.player.velocityX) > maxAirSpeed) {
        this.game.player.velocityX =
          Math.sign(this.game.player.velocityX) * maxAirSpeed;
      }
    }

    // Dünya sınırlarını kontrol et
    this.checkWorldBoundaries();
  }

  applyGravity(): void {
    // Eğer oyuncu havadaysa, yerçekimi uygula
    if (!this.isOnGround()) {
      // Zıplama sırasında (yukarı doğru hareket ederken) yerçekimi etkisini azalt
      if (this.game.player.velocityY < 0) {
        // Yukarı doğru hareket ederken daha az yerçekimi
        // Zıplama tuşuna basılı tutulup tutulmadığını kontrol et
        const jumpKeyPressed = this.game.keys.up || this.game.keys.space;

        // Tuşa basılıysa daha az yerçekimi, bırakıldıysa daha fazla yerçekimi
        // Tam 2.5 blok yüksekliğine ulaşmak için yerçekimi faktörünü ayarla
        const gravityFactor = jumpKeyPressed ? 0.4 : 1.6;

        this.game.player.velocityY += this.gravity * gravityFactor;
      } else {
        // Düşerken normal yerçekimi
        this.game.player.velocityY += this.gravity;
      }

      // Terminal hızı aşmayı önle
      if (this.game.player.velocityY > this.terminalVelocity) {
        this.game.player.velocityY = this.terminalVelocity;
      }
    } else if (this.game.player.velocityY > 0) {
      // Yerdeyse ve düşüyorsa dikey hızı sıfırla
      this.game.player.velocityY = 0;

      // Yere değdiğinde zıplama durumunu sıfırla
      this.game.player.isJumping = false;

      // Yere değdiğinde havada zıplama sayısını sıfırla
      this.game.player.airJumpCount = 0;
    }
  }

  updatePlayerMovement(): void {
    // NOT: Pozisyon güncellemesi artık update fonksiyonunda yapılıyor
    // Burada sadece hız hesaplamaları ve platform kenarı kontrolü yapıyoruz

    // Platform kenarlarında düşme kontrolü
    if (this.isOnPlatformEdge()) {
      // Eğer oyuncu platform kenarındaysa ve yatay hareket varsa
      // Hafif bir yerçekimi uygula (düşmeyi kolaylaştırmak için)
      // Ancak sadece hızlı hareket ediyorsa
      if (Math.abs(this.game.player.velocityX) > 0.5) {
        this.game.player.velocityY += this.gravity * 0.8;

        // Oyuncunun merkez X pozisyonu
        const playerCenterX = this.game.player.x + this.game.player.width / 2;
        const playerCenterBlockX = Math.floor(
          playerCenterX / CONFIG.BLOCK_SIZE
        );
        const playerBottom = Math.floor(
          (this.game.player.y + this.game.player.height) / CONFIG.BLOCK_SIZE
        );

        // Oyuncunun merkezi bir platform üzerinde mi?
        const centerBlockType = this.game.world.getBlock(
          playerCenterBlockX,
          playerBottom
        );
        const isCenterOnPlatform =
          centerBlockType !== undefined &&
          CONFIG.BLOCK_TYPES[centerBlockType].solid &&
          CONFIG.BLOCK_TYPES[centerBlockType].isPlatform;

        // Eğer oyuncunun merkezi platform üzerinde değilse, düşmeyi hızlandır
        if (!isCenterOnPlatform) {
          this.game.player.setState(PlayerState.FALLING);
        }
      }
    }

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

  isOnPlatformEdge(): boolean {
    // Bu fonksiyon artık kullanılmıyor, her zaman false döndür
    return false;
  }

  isOnGround(): boolean {
    // Oyuncunun altındaki blokları kontrol et - daha dar bir çarpışma kutusu kullan
    const playerLeft = Math.floor(
      (this.game.player.x + this.game.player.width * 0.15) / CONFIG.BLOCK_SIZE
    );
    const playerRight = Math.floor(
      (this.game.player.x + this.game.player.width * 0.85) / CONFIG.BLOCK_SIZE
    );
    const playerBottom = Math.floor(
      (this.game.player.y + this.game.player.height) / CONFIG.BLOCK_SIZE
    );

    // Sınırları kontrol et
    if (playerBottom < 0 || playerBottom >= this.game.world.height) {
      return false;
    }

    // Oyuncunun ayaklarının tam pozisyonu
    const playerBottomPos = this.game.player.y + this.game.player.height;

    // Oyuncunun altındaki tüm blokları kontrol et
    for (let x = playerLeft; x <= playerRight; x++) {
      // Sınırları kontrol et
      if (x < 0 || x >= this.game.world.width) {
        continue;
      }

      // Oyuncunun tam altındaki bloğu kontrol et
      const blockType = this.game.world.getBlock(x, playerBottom);

      // Eğer blok varsa ve katıysa
      if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
        const blockInfo = CONFIG.BLOCK_TYPES[blockType];
        const blockTop = playerBottom * CONFIG.BLOCK_SIZE;

        // Blok üzerinde olup olmadığını kontrol et (platform veya normal blok)
        if (Math.abs(playerBottomPos - blockTop) < 2) {
          // Eğer oyuncu yukarı doğru hareket ediyorsa (zıplıyorsa) blok üzerinde değil
          if (this.game.player.velocityY < 0) {
            continue;
          }

          // Oyuncu durumunu güncelle
          if (Math.abs(this.game.player.velocityX) > 0.1) {
            this.game.player.setState(PlayerState.WALKING);
          } else {
            this.game.player.setState(PlayerState.IDLE);
          }

          if (this.game.player.isJumping) {
            this.game.player.isJumping = false;
          }

          return true;
        }
      }
    }

    // Hiçbir katı blok bulunamadıysa, oyuncu havadadır
    // Oyuncu durumunu güncelle
    if (this.game.player.velocityY < 0) {
      this.game.player.setState(PlayerState.JUMPING);
    } else {
      this.game.player.setState(PlayerState.FALLING);
    }

    return false;
  }

  checkHorizontalCollisions(): void {
    // Oyuncunun yeni yatay pozisyonunu hesapla
    const newX = this.game.player.x;

    // Oyuncunun sınırlarını hesapla - yatay çarpışma için daha dar bir kutu kullan
    const playerLeft = newX + this.game.player.width * 0.1; // %10 içeriden başla
    const playerRight = newX + this.game.player.width * 0.9; // %90'a kadar git
    const playerTop = this.game.player.y + 4 / CONFIG.BLOCK_SIZE; // Kafanın 4 piksel altından başla (kafaya çarpma sorununu önlemek için)
    const playerBottom =
      this.game.player.y + this.game.player.height - 4 / CONFIG.BLOCK_SIZE; // 4 piksel tolerans

    // Oyuncunun bulunduğu blok koordinatlarını hesapla
    const blockLeft = Math.floor(playerLeft / CONFIG.BLOCK_SIZE);
    const blockRight = Math.floor(playerRight / CONFIG.BLOCK_SIZE);
    const blockTop = Math.floor(playerTop / CONFIG.BLOCK_SIZE);
    const blockBottom = Math.floor(playerBottom / CONFIG.BLOCK_SIZE);

    // Sınırları kontrol et
    if (
      blockLeft < 0 ||
      blockRight >= this.game.world.width ||
      blockTop < 0 ||
      blockBottom >= this.game.world.height
    ) {
      return;
    }

    // Yatay çarpışma kontrolü
    for (let y = blockTop; y <= blockBottom; y++) {
      // Sınırları kontrol et
      if (y < 0 || y >= this.game.world.height) {
        continue;
      }

      // Sağa hareket ediyorsa sağdaki blokları kontrol et
      if (this.game.player.velocityX > 0) {
        // Sınırları kontrol et
        if (blockRight < 0 || blockRight >= this.game.world.width) {
          continue;
        }

        const blockType = this.game.world.getBlock(blockRight, y);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Platform kontrolü - platformların yanlarından geçilebilir
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];
          if (blockInfo.isPlatform) {
            continue; // Platformların yanlarından geçebilir
          }

          // Çarpışma var, oyuncuyu bloğun soluna yerleştir
          this.game.player.x =
            blockRight * CONFIG.BLOCK_SIZE - this.game.player.width;

          // Havada çarpışma durumunda yatay hızı azalt ama tamamen sıfırlama
          if (!this.isOnGround()) {
            this.game.player.velocityX *= 0.3;
          } else {
            // Yerdeyse hızı sıfırla
            this.game.player.velocityX = 0;
          }

          break;
        }
      }
      // Sola hareket ediyorsa soldaki blokları kontrol et
      else if (this.game.player.velocityX < 0) {
        // Sınırları kontrol et
        if (blockLeft < 0 || blockLeft >= this.game.world.width) {
          continue;
        }

        const blockType = this.game.world.getBlock(blockLeft, y);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Platform kontrolü - platformların yanlarından geçilebilir
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];
          if (blockInfo.isPlatform) {
            continue; // Platformların yanlarından geçebilir
          }

          // Çarpışma var, oyuncuyu bloğun sağına yerleştir
          this.game.player.x = (blockLeft + 1) * CONFIG.BLOCK_SIZE;

          // Havada çarpışma durumunda yatay hızı azalt ama tamamen sıfırlama
          if (!this.isOnGround()) {
            this.game.player.velocityX *= 0.3;
          } else {
            // Yerdeyse hızı sıfırla
            this.game.player.velocityX = 0;
          }

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

  checkVerticalCollisions(): void {
    // Oyuncunun yeni dikey pozisyonunu hesapla
    const newY = this.game.player.y;

    // Oyuncunun sınırlarını hesapla - dikey çarpışma için daha dar bir kutu kullan
    const playerLeft = this.game.player.x + this.game.player.width * 0.15; // %15 içeriden başla
    const playerRight = this.game.player.x + this.game.player.width * 0.85; // %85'e kadar git
    const playerTop = newY;
    const playerBottom = newY + this.game.player.height;

    // Oyuncunun merkez X pozisyonu
    const playerCenterX = this.game.player.x + this.game.player.width / 2;

    // Önceki pozisyonu hesapla
    const prevPlayerBottom =
      this.game.player.y - this.game.player.velocityY + this.game.player.height;

    // Oyuncunun bulunduğu blok koordinatlarını hesapla
    const blockLeft = Math.floor(playerLeft / CONFIG.BLOCK_SIZE);
    const blockRight = Math.floor(playerRight / CONFIG.BLOCK_SIZE);
    const blockTop = Math.floor(playerTop / CONFIG.BLOCK_SIZE);
    const blockBottom = Math.floor(playerBottom / CONFIG.BLOCK_SIZE);

    // Sınırları kontrol et
    if (blockBottom < 0 || blockTop >= this.game.world.height) {
      return;
    }

    // Dikey çarpışma kontrolü
    for (let x = blockLeft; x <= blockRight; x++) {
      // Sınırları kontrol et
      if (x < 0 || x >= this.game.world.width) {
        continue;
      }

      // Aşağı hareket ediyorsa alttaki blokları kontrol et
      if (this.game.player.velocityY > 0) {
        // Sınırları kontrol et
        if (blockBottom < 0 || blockBottom >= this.game.world.height) {
          continue;
        }

        const blockType = this.game.world.getBlock(x, blockBottom);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];
          const blockTop = blockBottom * CONFIG.BLOCK_SIZE;

          // Platform kontrolü
          if (blockInfo.isPlatform) {
            // Eğer oyuncu platformun üstünden geliyorsa çarpışma var
            // Önceki pozisyonda oyuncu platformun üstündeyse
            const prevBlockBottom = Math.floor(
              prevPlayerBottom / CONFIG.BLOCK_SIZE
            );

            if (prevBlockBottom < blockBottom) {
              // Platform kenarlarından düşebilmeyi sağla
              // Ancak sadece hızlı hareket ediyorsa
              if (
                this.isOnPlatformEdge() &&
                Math.abs(this.game.player.velocityX) > 0.5
              ) {
                continue; // Platformun kenarından düşebilir
              }

              // Çarpışma var, oyuncuyu platformun üstüne yerleştir
              this.game.player.y = blockTop - this.game.player.height;
              this.game.player.velocityY = 0;
              this.game.player.isJumping = false;
              break;
            }
            // Aksi halde platformun içinden geçebilir
            continue;
          }

          // Normal katı blok için çarpışma
          this.game.player.y = blockTop - this.game.player.height;
          this.game.player.velocityY = 0;
          this.game.player.isJumping = false;
          break;
        }
      }
      // Yukarı hareket ediyorsa üstteki blokları kontrol et
      else if (this.game.player.velocityY < 0) {
        // Sınırları kontrol et
        if (blockTop < 0 || blockTop >= this.game.world.height) {
          continue;
        }

        const blockType = this.game.world.getBlock(x, blockTop);
        if (blockType !== undefined && CONFIG.BLOCK_TYPES[blockType].solid) {
          // Platform kontrolü - platformların altından geçilebilir
          const blockInfo = CONFIG.BLOCK_TYPES[blockType];
          if (blockInfo.isPlatform) {
            continue; // Platformların altından geçebilir
          }

          // Çarpışma var, oyuncuyu bloğun altına yerleştir
          this.game.player.y = (blockTop + 1) * CONFIG.BLOCK_SIZE;
          this.game.player.velocityY = 0;
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

  jump(): void {
    // Sadece oyuncu yerdeyse ve zıplama bekleme süresi bittiyse zıplayabilir
    if (this.isOnGround() && this.jumpCooldown <= 0) {
      // Zıplama kuvveti uygula - minimum zıplama yüksekliği (%70)
      // Tam 2.5 blok yüksekliğine ulaşmak için jumpForce'un %70'ini kullan
      this.game.player.velocityY = this.jumpForce * 0.7;

      // Zıplama animasyonu
      this.game.player.isJumping = true;

      // Zıplama bekleme süresini ayarla
      this.jumpCooldown = 15;

      // Zıplama sırasında yatay hızı biraz azalt
      this.game.player.velocityX *= 0.7;

      // Zıplama başlangıç zamanını kaydet
      this.game.player.jumpStartTime = Date.now();
      this.game.player.jumpHoldTime = 0;
      this.game.player.maxJumpHoldTime = 300; // Maksimum 300ms basılı tutma süresi

      // Zıplama gücü faktörü (0.7 ile 1.0 arasında)
      this.game.player.jumpPowerFactor = 0.7;

      // Havada zıplama sayısını sıfırla
      this.game.player.airJumpCount = 0;
    }
  }

  // Dünya sınırlarını kontrol et
  checkWorldBoundaries(): void {
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
      this.game.player.isJumping = false;
    }
  }

  // Zıplama tuşuna basılı tutma durumunu kontrol et
  checkJumpHold(): void {
    // Eğer oyuncu zıplıyorsa ve yukarı doğru hareket ediyorsa
    if (this.game.player.isJumping && this.game.player.velocityY < 0) {
      // Zıplama tuşuna basılı tutulup tutulmadığını kontrol et
      const jumpKeyPressed = this.game.keys.up || this.game.keys.space;

      // Tuşa basılı tutma süresini hesapla
      const currentTime = Date.now();
      const holdTime = currentTime - this.game.player.jumpStartTime;

      // Maksimum basılı tutma süresini aştıysak veya tuş bırakıldıysa
      if (holdTime >= this.game.player.maxJumpHoldTime || !jumpKeyPressed) {
        // Tuş bırakıldığında veya maksimum süre aşıldığında, zıplama hızını azalt
        // Bu, zıplama yüksekliğini basma süresine bağlı hale getirir
        if (this.game.player.velocityY < this.jumpForce * 0.4) {
          // Hızı yavaşça azalt
          this.game.player.velocityY *= 0.85;
        }
      } else {
        // Tuşa hala basılıysa ve maksimum süreyi aşmadıysak
        // Basılı tutma süresine göre zıplama gücünü artır
        const holdRatio = Math.min(
          holdTime / this.game.player.maxJumpHoldTime,
          1.0
        );

        // Zıplama gücü faktörünü güncelle (0.7'den 1.0'a kadar)
        // Tam 2.5 blok yüksekliğine ulaşmak için
        this.game.player.jumpPowerFactor = 0.7 + 0.3 * holdRatio;

        // Zıplama hızını güncelle - tam 2.5 blok yüksekliğine ulaşmak için
        const targetVelocity =
          this.jumpForce * this.game.player.jumpPowerFactor;

        // Hızı yumuşak bir şekilde güncelle
        this.game.player.velocityY = Math.min(
          this.game.player.velocityY,
          targetVelocity
        );

        // Zıplama tuşuna basılı tutma süresini güncelle
        this.game.player.jumpHoldTime = holdTime;
      }
    }
  }
}

export default PhysicsEngine;
