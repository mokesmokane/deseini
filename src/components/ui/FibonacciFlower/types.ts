export interface FibonacciFlowerProps {
  /**
   * List of items to visualize in the pattern
   */
  items: any[];
  
  /**
   * Maximum width of the container in pixels
   * @default 600
   */
  maxSize?: number;
  
  /**
   * Number of dots to generate per item
   * @default 5
   */
  dotsPerItem?: number;

  /**
   * Size of the dots
   * @default 6
   */
  dotSize?: number;
  
  /**
   * Base color for the dots (will be used for variations)
   * @default '#ffffff'
   */
  baseColor?: string;
  
  /**
   * Background color for the container
   * @default '#1a1a2e'
   */
  backgroundColor?: string;
  
  /**
   * Enable/disable rotation animation
   * @default true
   */
  enableRotation?: boolean;
  
  /**
   * Custom class name for the container
   */
  className?: string;

  /**
   * Selected color palette name
   */
  palette?: string;
}

export interface DotProps {
  /**
   * Horizontal position (0-1)
   */
  x: number;
  
  /**
   * Vertical position (0-1)
   */ 
  y: number;
  
  /**
   * Size of the dot
   */
  size: number;
  
  /**
   * Color of the dot
   */
  color: string;
  
  /**
   * Delay before the dot appears
   */
  delay: number;
  
  /**
   * Index of the dot (for key prop)
   */
  index: number;
}