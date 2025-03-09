import CONFIG from "./config.js";
import Game from "./game.js";

// Animasyon arayüzü
interface Animation {
  frame: number;
  maxFrames: number;
  frameDelay: number;
  frameTimer: number;
  isWalking: boolean;
}

// Sprite arayüzü
interface Sprites {
  right: HTMLCanvasElement | null;
  left: HTMLCanvasElement | null;
  rightWalk: HTMLCanvasElement[];
  leftWalk: HTMLCanvasElement[];
}

// Oyuncu sınıfı
class Player {
  game: Game;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  velocityX: number;
  velocityY: number;
  inventory: any[];
  direction: number;
  isJumping: boolean;
  animation: Animation;
  sprites: Sprites;

  constructor(game: Game, x: number, y: number) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.width = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_WIDTH;
    this.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;
    this.speed = CONFIG.PLAYER_SPEED;
    this.velocityX = 0;
    this.velocityY = 0;
    this.inventory = [];
    this.direction = 1; // 1: sağa, -1: sola
    this.isJumping = false;
    this.animation = {
      frame: 0,
      maxFrames: 4,
      frameDelay: 10,
      frameTimer: 0,
      isWalking: false,
    };

    // Sprite'ları oluştur
    this.sprites = {
      right: null,
      left: null,
      rightWalk: [],
      leftWalk: [],
    };

    this.createSprites();
  }

  createSprites(): void {
    // Ana sprite'ları oluştur
    this.createMainSprites();

    // Yürüme animasyonu sprite'larını oluştur
    this.createWalkingSprites();
  }

  createMainSprites(): void {
    // Sağa bakan sprite
    this.sprites.right = document.createElement("canvas");
    this.sprites.right.width = CONFIG.BLOCK_SIZE;
    this.sprites.right.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;

    const ctxRight = this.sprites.right.getContext("2d");
    if (!ctxRight) return;

    // Growtopia benzeri karakter - sağa bakan

    // Vücut (kare şeklinde)
    ctxRight.fillStyle = "#3498db"; // Mavi gövde
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.6
    );

    // Baş (kare şeklinde)
    ctxRight.fillStyle = "#f1c40f"; // Sarı baş
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.2,
      0,
      CONFIG.BLOCK_SIZE * 0.6,
      CONFIG.BLOCK_SIZE * 0.4
    );

    // Gözler
    ctxRight.fillStyle = "black";
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.6,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.1
    );

    // Ağız
    ctxRight.fillStyle = "#e74c3c"; // Kırmızı ağız
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.5,
      CONFIG.BLOCK_SIZE * 0.25,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.05
    );

    // Kollar
    ctxRight.fillStyle = "#3498db"; // Mavi kollar
    // Sağ kol
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.9,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.3
    );

    // Bacaklar
    ctxRight.fillStyle = "#2c3e50"; // Koyu mavi bacaklar
    // Sol bacak
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.2
    );
    // Sağ bacak
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.5,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.2
    );

    // Sola bakan sprite (sağdakinin aynalı hali)
    this.sprites.left = document.createElement("canvas");
    this.sprites.left.width = CONFIG.BLOCK_SIZE;
    this.sprites.left.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;

    const ctxLeft = this.sprites.left.getContext("2d");
    if (!ctxLeft) return;

    // Growtopia benzeri karakter - sola bakan

    // Vücut (kare şeklinde)
    ctxLeft.fillStyle = "#3498db"; // Mavi gövde
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.6
    );

    // Baş (kare şeklinde)
    ctxLeft.fillStyle = "#f1c40f"; // Sarı baş
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.2,
      0,
      CONFIG.BLOCK_SIZE * 0.6,
      CONFIG.BLOCK_SIZE * 0.4
    );

    // Gözler (sola bakan)
    ctxLeft.fillStyle = "black";
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.1
    );

    // Ağız
    ctxLeft.fillStyle = "#e74c3c"; // Kırmızı ağız
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.25,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.05
    );

    // Kollar
    ctxLeft.fillStyle = "#3498db"; // Mavi kollar
    // Sol kol
    ctxLeft.fillRect(
      0,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.3
    );

    // Bacaklar
    ctxLeft.fillStyle = "#2c3e50"; // Koyu mavi bacaklar
    // Sol bacak
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.2
    );
    // Sağ bacak
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.5,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.3,
      CONFIG.BLOCK_SIZE * 0.2
    );
  }

  createWalkingSprites(): void {
    // Yürüme animasyonu için 4 kare oluştur
    for (let i = 0; i < 4; i++) {
      // Sağa yürüme
      const rightWalk = document.createElement("canvas");
      rightWalk.width = CONFIG.BLOCK_SIZE;
      rightWalk.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;
      const ctxRightWalk = rightWalk.getContext("2d");
      if (!ctxRightWalk) continue;

      // Ana gövde ve baş (sabit)
      if (this.sprites.right) {
        ctxRightWalk.drawImage(this.sprites.right, 0, 0);
      }

      // Bacakları farklı pozisyonlarda çiz
      ctxRightWalk.clearRect(
        CONFIG.BLOCK_SIZE * 0.2,
        CONFIG.BLOCK_SIZE * 0.8,
        CONFIG.BLOCK_SIZE * 0.6,
        CONFIG.BLOCK_SIZE * 0.2
      );

      // Growtopia benzeri yürüme animasyonu
      ctxRightWalk.fillStyle = "#2c3e50"; // Koyu mavi bacaklar

      if (i === 0) {
        // İlk kare - normal duruş
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.5,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else if (i === 1) {
        // İkinci kare - sol bacak ileri
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.1,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.6,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else if (i === 2) {
        // Üçüncü kare - normal duruş (farklı)
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.25,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.55,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else {
        // Dördüncü kare - sağ bacak ileri
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxRightWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.4,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      }

      this.sprites.rightWalk.push(rightWalk);

      // Sola yürüme (sağa yürümenin aynalı hali)
      const leftWalk = document.createElement("canvas");
      leftWalk.width = CONFIG.BLOCK_SIZE;
      leftWalk.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;
      const ctxLeftWalk = leftWalk.getContext("2d");
      if (!ctxLeftWalk) continue;

      // Ana gövde ve baş (sabit)
      if (this.sprites.left) {
        ctxLeftWalk.drawImage(this.sprites.left, 0, 0);
      }

      // Bacakları farklı pozisyonlarda çiz
      ctxLeftWalk.clearRect(
        CONFIG.BLOCK_SIZE * 0.2,
        CONFIG.BLOCK_SIZE * 0.8,
        CONFIG.BLOCK_SIZE * 0.6,
        CONFIG.BLOCK_SIZE * 0.2
      );

      // Growtopia benzeri yürüme animasyonu
      ctxLeftWalk.fillStyle = "#2c3e50"; // Koyu mavi bacaklar

      if (i === 0) {
        // İlk kare - normal duruş
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.5,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else if (i === 1) {
        // İkinci kare - sağ bacak ileri
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.1,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.6,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else if (i === 2) {
        // Üçüncü kare - normal duruş (farklı)
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.25,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.55,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.2,
          CONFIG.BLOCK_SIZE * 0.2
        );
      } else {
        // Dördüncü kare - sol bacak ileri
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
        ctxLeftWalk.fillRect(
          CONFIG.BLOCK_SIZE * 0.4,
          CONFIG.BLOCK_SIZE * 0.8,
          CONFIG.BLOCK_SIZE * 0.3,
          CONFIG.BLOCK_SIZE * 0.2
        );
      }

      this.sprites.leftWalk.push(leftWalk);
    }
  }

  update(deltaTime: number): void {
    // Yatay hareket - ivmelenme ve yavaşlama ile
    const maxSpeed = this.speed;
    const acceleration = 0.1;

    if (this.game.keys.left) {
      // Sola ivmelenme
      this.velocityX -= acceleration;
      if (this.velocityX < -maxSpeed) this.velocityX = -maxSpeed;
      this.direction = -1;
    } else if (this.game.keys.right) {
      // Sağa ivmelenme
      this.velocityX += acceleration;
      if (this.velocityX > maxSpeed) this.velocityX = maxSpeed;
      this.direction = 1;
    } else {
      // Yavaşlama
      if (Math.abs(this.velocityX) < 0.05) {
        this.velocityX = 0;
      } else {
        this.velocityX *= CONFIG.FRICTION;
      }
    }

    // Dikey hareket (yerçekimi)
    this.velocityY += CONFIG.GRAVITY;

    // Terminal hız kontrolü
    if (this.velocityY > CONFIG.TERMINAL_VELOCITY) {
      this.velocityY = CONFIG.TERMINAL_VELOCITY;
    }

    // Not: Pozisyon güncellemesi ve çarpışma kontrolü artık physics.js'de yapılıyor
    // Burada sadece hız hesaplamaları yapılıyor

    // Animasyon güncelleme
    this.updateAnimation(deltaTime);
  }

  jump(): void {
    // Zıplama işlemi physics.js'de yapılıyor
    this.game.physics.jump();
  }

  updateAnimation(deltaTime: number): void {
    // Hareket ediyorsa animasyonu güncelle
    if (Math.abs(this.velocityX) > 0.3) {
      this.animation.isWalking = true;
      this.animation.frameTimer += deltaTime;
      if (this.animation.frameTimer >= this.animation.frameDelay) {
        this.animation.frameTimer = 0;
        this.animation.frame =
          (this.animation.frame + 1) % this.animation.maxFrames;
      }
    } else {
      // Hareketsizse ilk kareye dön
      this.animation.isWalking = false;
      this.animation.frame = 0;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    zoom: number
  ): void {
    // Kameraya göre pozisyon hesapla
    const screenX = (this.x - cameraX) * zoom;
    const screenY = (this.y - cameraY) * zoom;
    const screenWidth = this.width * zoom;
    const screenHeight = this.height * zoom;

    // Yöne ve animasyon durumuna göre sprite seç
    let sprite: HTMLCanvasElement | null = null;

    if (this.animation.isWalking) {
      // Yürüme animasyonu
      const walkFrames =
        this.direction === 1 ? this.sprites.rightWalk : this.sprites.leftWalk;
      if (walkFrames.length > this.animation.frame) {
        sprite = walkFrames[this.animation.frame];
      }
    } else {
      // Duruş sprite'ı
      sprite = this.direction === 1 ? this.sprites.right : this.sprites.left;
    }

    // Oyuncuyu çiz
    if (sprite) {
      ctx.drawImage(sprite, screenX, screenY, screenWidth, screenHeight);
    }
  }
}

export default Player;
