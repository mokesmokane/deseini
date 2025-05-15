// The golden angle in radians
export const GOLDEN_ANGLE = 137.5 * (Math.PI / 180);

// Color palettes
export const COLOR_PALETTES = {
  neon: {
    name: 'Neon',
    colors: ['#FF5E5B', '#D89CF6', '#70D6FF', '#FFD166', '#06D6A0', '#FF7096', '#54DEFD', '#9B89B3', '#2DE2E6', '#FF9E00']
  },
  pastel: {
    name: 'Pastel',
    colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFB3F7', '#B3FFF7', '#FFC9BA', '#E1BAFF', '#C9FFB3', '#FFDFBA']
  },
  ocean: {
    name: 'Ocean',
    colors: ['#05445E', '#189AB4', '#75E6DA', '#2C73D2', '#0081CF', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8']
  },
  forest: {
    name: 'Forest',
    colors: ['#2D5A27', '#4A8B38', '#87AB69', '#BFCBA8', '#5B8B3E', '#76B947', '#98CE00', '#A9CF54', '#B6E388', '#D4E7C5']
  },
  sunset: {
    name: 'Sunset',
    colors: ['#FF7B00', '#FF8800', '#FF9500', '#FFA200', '#FFAA00', '#FFB700', '#FFC300', '#FFD000', '#FFDD00', '#FFE900']
  },
  berry: {
    name: 'Berry',
    colors: ['#4A0404', '#720E07', '#8E1515', '#AA1E1E', '#C72828', '#E13232', '#FB3F3F', '#FF5757', '#FF6B6B', '#FF8383']
  },
  cosmic: {
    name: 'Cosmic',
    colors: ['#2E294E', '#541388', '#7B337D', '#A63A79', '#FF6B6B', '#FFB4A2', '#8E24AA', '#6A0DAD', '#9C27B0', '#E1BEE7']
  },
  candy: {
    name: 'Candy',
    colors: ['#FF1493', '#FF69B4', '#FFB6C1', '#FF66CC', '#FF99CC', '#FF1493', '#FF69B4', '#FFB6C1', '#FF66CC', '#FF99CC']
  },
  earth: {
    name: 'Earth',
    colors: ['#5D4037', '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#8B4513', '#A0522D', '#CD853F', '#DEB887']
  },
  grayscale: {
    name: 'Grayscale',
    colors: ['#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6']
  },
  white: {
    name: 'White',
    colors: ['#FFFFFF']
  }

};

// Animation constants
export const ANIMATION = {
  DOT_APPEAR_DURATION: 600,  // ms
  DOT_APPEAR_DELAY_BASE: 15, // Reduced from 50ms to 15ms for more immediate feedback
  PATTERN_ROTATION_DURATION: 120000, // ms - 2 minutes for a full rotation
  RESIZE_DEBOUNCE: 250, // ms
};

// Base dot styling
export const DOT_STYLE = {
  GLOW_INTENSITY: '0 0 10px 2px', // box-shadow
  MIN_SIZE: 1, // px
  MAX_SIZE: 6, // px
  OPACITY: 0.85,
};