// Oyuncu sınıfı
class Player {
  constructor(game, x, y) {
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
      frameDelay: 5,
      frameTimer: 0,
    };

    // Sprite'ları oluştur
    this.sprites = {
      right: null,
      left: null,
    };

    this.createSprites();
  }

  createSprites() {
    // Sağa bakan sprite
    this.sprites.right = document.createElement("canvas");
    this.sprites.right.width = CONFIG.BLOCK_SIZE;
    this.sprites.right.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;

    const ctxRight = this.sprites.right.getContext("2d");

    // Baş
    ctxRight.fillStyle = "#FFD700";
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      0,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.8
    );

    // Gözler
    ctxRight.fillStyle = "black";
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.6,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.15,
      CONFIG.BLOCK_SIZE * 0.15
    );

    // Vücut
    ctxRight.fillStyle = "blue";
    ctxRight.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 1.2
    );

    // Sola bakan sprite
    this.sprites.left = document.createElement("canvas");
    this.sprites.left.width = CONFIG.BLOCK_SIZE;
    this.sprites.left.height = CONFIG.BLOCK_SIZE * CONFIG.PLAYER_HEIGHT;

    const ctxLeft = this.sprites.left.getContext("2d");

    // Baş
    ctxLeft.fillStyle = "#FFD700";
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      0,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.8
    );

    // Gözler
    ctxLeft.fillStyle = "black";
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.25,
      CONFIG.BLOCK_SIZE * 0.2,
      CONFIG.BLOCK_SIZE * 0.15,
      CONFIG.BLOCK_SIZE * 0.15
    );

    // Vücut
    ctxLeft.fillStyle = "blue";
    ctxLeft.fillRect(
      CONFIG.BLOCK_SIZE * 0.1,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 0.8,
      CONFIG.BLOCK_SIZE * 1.2
    );
  }

  update() {
    // Mevcut blok pozisyonunu hesapla
    const blockX = Math.floor(this.x / this.game.blockSize);
    const blockY = Math.floor(this.y / this.game.blockSize);

    // Oyuncunun üzerinde durduğu bloğu kontrol et
    const blockUnder = this.game.world.getBlock(blockX, blockY + 1);

    // Oyuncunun içinde olduğu bloğu kontrol et
    const blockInside = this.game.world.getBlock(blockX, blockY);

    // Kapı içinde mi kontrol et
    if (blockInside === 8) {
      // Kapı içindeyken efekt (örneğin, hafif parıltı)
      this.isInDoor = true;

      // Kapıdan geçiş efekti için bir şeyler yapabilirsiniz
      // Örneğin, ekranı hafifçe parlat veya ses çal
    } else {
      this.isInDoor = false;
    }

    // Animasyon güncelleme
    if (Math.abs(this.velocityX) > 0.5) {
      this.animation.frameTimer++;

      if (this.animation.frameTimer >= this.animation.frameDelay) {
        this.animation.frameTimer = 0;
        this.animation.frame =
          (this.animation.frame + 1) % this.animation.maxFrames;
      }
    } else {
      // Hareketsizse ilk kareye dön
      this.animation.frame = 0;
      this.animation.frameTimer = 0;
    }

    // Yön değişimini kontrol et (hız 0 olduğunda yönü korumak için)
    if (this.velocityX > 0.5) {
      this.direction = 1; // Sağa
    } else if (this.velocityX < -0.5) {
      this.direction = -1; // Sola
    }
    // Durunca yönü değiştirme
  }

  render(ctx, cameraX, cameraY) {
    // Oyuncuyu çiz
    ctx.fillStyle = this.isInDoor ? "rgba(255, 255, 255, 0.7)" : "red";

    // Oyuncu pozisyonunu hesapla
    const drawX = this.x - cameraX;
    const drawY = this.y - cameraY;

    // Oyuncuyu çiz
    ctx.fillRect(drawX, drawY, this.width, this.height);

    // Oyuncu yüzü çiz
    ctx.fillStyle = "black";

    // Göz
    const eyeSize = this.width * 0.15;
    const eyeY = drawY + this.height * 0.3;

    // Hareket yönüne göre yüzü çiz
    if (this.direction === 1) {
      ctx.fillRect(drawX + this.width * 0.6, eyeY, eyeSize, eyeSize);
    } else {
      ctx.fillRect(drawX + this.width * 0.25, eyeY, eyeSize, eyeSize);
    }

    // Kapı içindeyken parıltı efekti
    if (this.isInDoor) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(
        drawX + this.width / 2,
        drawY + this.height / 2,
        this.width * 0.8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Debug çizimi
    if (this.game.showDebug) {
      ctx.strokeStyle = "red";
      ctx.strokeRect(drawX, drawY, this.width, this.height);
    }
  }
}
