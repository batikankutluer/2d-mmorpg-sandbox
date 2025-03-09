// Blok tiplerini tanımlayan enum
export enum BLOCKS {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  WOOD = 3,
  GRASS = 4,
  WOODEN_PLATFORM = 5,
  WATER = 6,
  LAVA = 7,
  DOOR = 8,
  BRICK = 9,
  SAND = 10,
  BEDROCK = 11,
}

// Blok tipi açıklamaları için yardımcı fonksiyon
export function getBlockName(blockType: BLOCKS): string {
  switch (blockType) {
    case BLOCKS.AIR:
      return "Hava";
    case BLOCKS.DIRT:
      return "Toprak";
    case BLOCKS.STONE:
      return "Taş";
    case BLOCKS.WOOD:
      return "Ahşap";
    case BLOCKS.GRASS:
      return "Çim";
    case BLOCKS.SAND:
      return "Kum";
    case BLOCKS.WATER:
      return "Su";
    case BLOCKS.LAVA:
      return "Lav";
    case BLOCKS.DOOR:
      return "Kapı";
    case BLOCKS.BRICK:
      return "Tuğla";
    case BLOCKS.WOODEN_PLATFORM:
      return "Ahşap Platform";
    case BLOCKS.BEDROCK:
      return "Bedrock";
    default:
      return "Bilinmeyen";
  }
}
