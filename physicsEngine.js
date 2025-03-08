checkCollision(x, y, width, height) {
  // Blok koordinatlarını hesapla
  const startX = Math.floor(x / this.game.blockSize);
  const startY = Math.floor(y / this.game.blockSize);
  const endX = Math.floor((x + width) / this.game.blockSize);
  const endY = Math.floor((y + height) / this.game.blockSize);

  // Çarpışma kontrolü
  for (let blockY = startY; blockY <= endY; blockY++) {
    for (let blockX = startX; blockX <= endX; blockX++) {
      const blockType = this.game.world.getBlock(blockX, blockY);
      const blockInfo = CONFIG.BLOCK_TYPES[blockType];
      
      // Blok katı ise çarpışma var
      if (blockInfo && blockInfo.solid) {
        return true;
      }
    }
  }
  
  return false;
} 