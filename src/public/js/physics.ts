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
    this.jumpForce = CONFIG.JUMP_FORCE;
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

    // Oyuncunun hareketini güncelle
    // Not: updatePlayerMovement içinde pozisyon güncellemesi yapmıyoruz
    // Sadece hız hesaplamaları ve platform kenarı kontrolü yapıyoruz
    this.updatePlayerMovement();

    // Platform kenarında olup olmadığını kontrol et
    const onPlatformEdge = this.isOnPlatformEdge();

    // Oyuncunun merkez X pozisyonu
    const playerCenterX = this.game.player.x + this.game.player.width / 2;
    const playerCenterBlockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);
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
      CONFIG.BLOCK_TYPES[centerBlockType]?.solid &&
      CONFIG.BLOCK_TYPES[centerBlockType]?.isPlatform;

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

      // Platform kenarında ise ve hızlı yatay hareket varsa, düşmeyi kolaylaştır
      if (
        onPlatformEdge &&
        Math.abs(this.game.player.velocityX) > 0.5 &&
        !isCenterOnPlatform
      ) {
        this.game.player.velocityY += (this.gravity * 0.1) / steps;
      }
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

    // Platform kenarlarını kontrol et ve gerekirse düş
    this.handlePlatformEdges();
  }

  applyGravity(): void {
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

    // Oyuncunun ayaklarının tam pozisyonu
    const playerBottomPos = this.game.player.y + this.game.player.height;

    // Oyuncunun merkez X pozisyonu
    const playerCenterX = this.game.player.x + this.game.player.width / 2;
    const playerCenterBlockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);

    // Sınırları kontrol et
    if (
      playerBottom < 0 ||
      playerBottom >= this.game.world.height ||
      playerLeft < 0 ||
      playerRight >= this.game.world.width
    ) {
      return false;
    }

    // Önce oyuncunun bir platform üzerinde olup olmadığını kontrol et
    let onPlatform = false;
    let platformBlocks = [];

    // Oyuncunun altındaki tüm blokları kontrol et
    for (let x = playerLeft; x <= playerRight; x++) {
      const blockType = this.game.world.getBlock(x, playerBottom);

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
          onPlatform = true;
          platformBlocks.push(x);
        }
      }
    }

    // Eğer oyuncu bir platform üzerinde değilse
    if (!onPlatform || platformBlocks.length === 0) {
      return false;
    }

    // Oyuncunun sol ve sağ kenarlarını kontrol et
    const leftEdge = playerLeft - 1;
    const rightEdge = playerRight + 1;

    // Sol kenar kontrolü
    const leftBlock = this.game.world.getBlock(leftEdge, playerBottom);
    const isLeftEdge =
      platformBlocks.includes(playerLeft) && // Oyuncunun sol ayağı bir platform üzerinde
      (leftBlock === undefined ||
        !CONFIG.BLOCK_TYPES[leftBlock]?.solid ||
        !CONFIG.BLOCK_TYPES[leftBlock]?.isPlatform); // Sol tarafta platform yok

    // Sağ kenar kontrolü
    const rightBlock = this.game.world.getBlock(rightEdge, playerBottom);
    const isRightEdge =
      platformBlocks.includes(playerRight) && // Oyuncunun sağ ayağı bir platform üzerinde
      (rightBlock === undefined ||
        !CONFIG.BLOCK_TYPES[rightBlock]?.solid ||
        !CONFIG.BLOCK_TYPES[rightBlock]?.isPlatform); // Sağ tarafta platform yok

    // Ayrıca, oyuncunun platform üzerinde olup olmadığını daha kesin kontrol et
    // Oyuncunun merkezi bir platform üzerinde mi?
    const centerBlockType = this.game.world.getBlock(
      playerCenterBlockX,
      playerBottom
    );
    const isCenterOnPlatform =
      centerBlockType !== undefined &&
      CONFIG.BLOCK_TYPES[centerBlockType]?.solid &&
      CONFIG.BLOCK_TYPES[centerBlockType]?.isPlatform;

    // Eğer oyuncu sol kenarda ve sola hareket ediyorsa veya sağ kenarda ve sağa hareket ediyorsa
    // VE oyuncunun merkezi bir platform üzerinde değilse
    const isOnEdge =
      ((isLeftEdge && this.game.player.velocityX < -0.1) ||
        (isRightEdge && this.game.player.velocityX > 0.1)) &&
      !isCenterOnPlatform;

    // Eğer oyuncu kenar üzerindeyse, durumunu güncelle
    if (isOnEdge) {
      // Durum makinesini kullanarak oyuncu durumunu güncelle
      if (this.game.player.state !== PlayerState.PLATFORM_EDGE) {
        this.game.player.setState(PlayerState.PLATFORM_EDGE);
      }
    } else if (
      onPlatform &&
      this.game.player.state === PlayerState.PLATFORM_EDGE
    ) {
      // Eğer artık kenar üzerinde değilse ama hala platform üzerindeyse
      this.game.player.setState(PlayerState.ON_PLATFORM);
    }

    return isOnEdge;
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

    // Oyuncunun merkez X pozisyonu
    const playerCenterX = this.game.player.x + this.game.player.width / 2;
    const playerCenterBlockX = Math.floor(playerCenterX / CONFIG.BLOCK_SIZE);

    // Önce platform kenarında olup olmadığını kontrol et
    const onPlatformEdge = this.isOnPlatformEdge();

    // Eğer platform kenarındaysa ve hızlı hareket ediyorsa, yerde değil
    if (onPlatformEdge && Math.abs(this.game.player.velocityX) > 0.5) {
      return false;
    }

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

        // Platform kontrolü
        if (blockInfo.isPlatform) {
          // Platformun üzerinde olup olmadığını kontrol et
          if (Math.abs(playerBottomPos - blockTop) < 2) {
            // Eğer oyuncu yukarı doğru hareket ediyorsa (zıplıyorsa) platform üzerinde değil
            if (this.game.player.velocityY < 0) {
              continue;
            }

            // Oyuncunun merkezi bir platform üzerinde mi?
            const centerBlockType = this.game.world.getBlock(
              playerCenterBlockX,
              playerBottom
            );
            const isCenterOnPlatform =
              centerBlockType !== undefined &&
              CONFIG.BLOCK_TYPES[centerBlockType]?.solid &&
              CONFIG.BLOCK_TYPES[centerBlockType]?.isPlatform;

            // Eğer oyuncu platform kenarındaysa ve merkezi platform üzerinde değilse
            if (onPlatformEdge && !isCenterOnPlatform) {
              continue; // Platformun kenarından düşebilir
            }

            // Oyuncu durumunu güncelle
            if (onPlatformEdge) {
              this.game.player.setState(PlayerState.PLATFORM_EDGE);
            } else {
              this.game.player.setState(PlayerState.ON_PLATFORM);
            }

            if (this.game.player.isJumping) {
              this.game.player.isJumping = false;
            }
            return true;
          }
          continue;
        }

        // Normal katı blok için kontrol
        if (Math.abs(playerBottomPos - blockTop) < 2) {
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

  handlePlatformEdges() {
    // Eğer oyuncu platform kenarındaysa ve aşağı tuşuna basılıyorsa
    if (
      this.game.player.state === PlayerState.PLATFORM_EDGE &&
      this.game.keys.down
    ) {
      // Oyuncunun altındaki blokları kontrol et
      const playerLeft = Math.floor(this.game.player.x / CONFIG.BLOCK_SIZE);
      const playerRight = Math.floor(
        (this.game.player.x + this.game.player.width - 0.01) / CONFIG.BLOCK_SIZE
      );
      const playerBottom = Math.floor(
        (this.game.player.y + this.game.player.height) / CONFIG.BLOCK_SIZE
      );

      // Oyuncunun ayaklarının tam pozisyonu
      const playerBottomPos = this.game.player.y + this.game.player.height;

      // Platformları bul
      let platformBlocks = [];
      for (let x = playerLeft; x <= playerRight; x++) {
        const blockType = this.game.world.getBlock(x, playerBottom);

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
            platformBlocks.push(x);
          }
        }
      }

      // Eğer platform blokları bulunduysa
      if (platformBlocks.length > 0) {
        // Oyuncuyu platformdan düşür
        this.game.player.y += 1; // Platformdan biraz aşağı it

        // Platformdan düşme efekti için küçük bir aşağı hız ver
        this.game.player.velocityY = 1;

        // Oyuncu durumunu güncelle
        this.game.player.setState(PlayerState.FALLING);

        // Platformdan düşme sesi çal
        // this.game.audio.play("platform_drop");

        console.log("Oyuncu platformdan düştü");
      }
    }
  }
}

export default PhysicsEngine;
