import { COLOR_PALETTES, GOLDEN_ANGLE } from './constants';

/**
 * Calculates the position of a dot in the Fibonacci spiral
 */
export const calculateDotPosition = (index: number, total: number) => {
  const radius = Math.sqrt(index / total);
  const angle = index * GOLDEN_ANGLE;
  const x = 0.5 + (radius * Math.cos(angle) * 0.5);
  const y = 0.5 + (radius * Math.sin(angle) * 0.5);
  return { x, y };
};

/**
 * Generates a color for a dot based on its position in the spiral
 */
export const getDotColor = (itemIndex: number, dotIndex: number, palette = 'neon') => {
  const colors = COLOR_PALETTES[palette]?.colors || COLOR_PALETTES.neon.colors;
  const colorIndex = itemIndex % colors.length;
  return colors[colorIndex];
};

/**
 * Calculates the size of a dot based on its position in the spiral
 */
export const calculateDotSize = (
  index: number,
  total: number,
  minSize: number,
  maxSize: number
) => {
  const sizeRatio = 1 - Math.sqrt(index / total);
  return minSize + sizeRatio * (maxSize - minSize);
};

/**
 * Creates a simple hash code from a string
 */
export const hashString = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash);
};

/**
 * Creates a stable dot delay based on indices
 */
export const calculateDotDelay = (
  itemIndex: number,
  dotIndex: number,
  baseDelay: number
) => {
  return dotIndex * baseDelay;
};