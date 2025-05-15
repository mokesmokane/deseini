import React, { useState, useEffect, useRef } from 'react';
import { FibonacciFlowerProps } from './types';
import FibonacciDot from './FibonacciDot';
import { ANIMATION, DOT_STYLE } from './constants';
import { 
  calculateDotPosition, 
  getDotColor, 
  calculateDotSize,
  calculateDotDelay
} from './utils';

import { COLOR_PALETTES } from './constants';

const FibonacciFlower: React.FC<FibonacciFlowerProps> = ({
  items,
  maxSize = 600,
  dotsPerItem = 8,
  backgroundColor = 'transparent',
  enableRotation = true,
  className = '',
  palette = 'neon',
}) => {
    // Palette names memoized for stability
  const paletteNames = React.useMemo(() => Object.keys(COLOR_PALETTES), []);
  // Internal palette state for cycling
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(() => {
    const initial = paletteNames.indexOf(palette);
    return initial >= 0 ? initial : 0;
  });
  const currentPalette = paletteNames[currentPaletteIndex];

  // Handle cycling palettes on click
  const handleCyclePalette = () => {
    setCurrentPaletteIndex((prev: number) => (prev + 1) % paletteNames.length);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  // const [containerSize, setContainerSize] = useState(0);
  const [rotation, setRotation] = useState(0);
  
  const totalDots = items.length * dotsPerItem;
  
  const prevItemsLengthRef = useRef(items.length);
  
  useEffect(() => {
    // Only rotate when new items are added and rotation is enabled
    if (enableRotation && items.length > prevItemsLengthRef.current) {
      setRotation(prev => prev + 5);
    }
    // Update the ref to the current length
    prevItemsLengthRef.current = items.length;
  }, [items, enableRotation]);
  
  // useEffect(() => {
  //   const updateSize = () => {
  //     if (containerRef.current) {
  //       const width = containerRef.current.offsetWidth;
  //       setContainerSize(width);
  //     }
  //   };
    
  //   updateSize();
    
  //   const resizeObserver = new ResizeObserver(() => {
  //     updateSize();
  //   });
    
  //   if (containerRef.current) {
  //     resizeObserver.observe(containerRef.current);
  //   }
    
  //   return () => {
  //     if (containerRef.current) {
  //       resizeObserver.unobserve(containerRef.current);
  //     }
  //     resizeObserver.disconnect();
  //   };
  // }, []);
  
  const renderDots = () => {
    const dots = [];
    
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      for (let dotIndex = 0; dotIndex < dotsPerItem; dotIndex++) {
        const globalDotIndex = (itemIndex * dotsPerItem) + dotIndex;
        const { x, y } = calculateDotPosition(globalDotIndex, totalDots);
        const size = calculateDotSize(
          globalDotIndex,
          totalDots,
          DOT_STYLE.MIN_SIZE,
          DOT_STYLE.MAX_SIZE
        );
        const color = getDotColor(itemIndex, currentPalette);
        const delay = calculateDotDelay(
          dotIndex,
          ANIMATION.DOT_APPEAR_DELAY_BASE
        );
        
        dots.push(
          <FibonacciDot
            key={`dot-${itemIndex}-${dotIndex}`}
            x={x}
            y={y}
            size={size}
            color={color}
            delay={delay}
            index={globalDotIndex}
          />
        );
      }
    }
    
    return dots;
  };
  
  return (
    <div
      className={`fibonacci-flower-container ${className}`}
      ref={containerRef}
      onClick={handleCyclePalette}
      style={{
        width: '100%',
        maxWidth: `${maxSize}px`,
        aspectRatio: '1 / 1',
        position: 'relative',
        borderRadius: '50%',
        backgroundColor, // still accept the prop for compatibility, but do not use it for background
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer', // affordance for click
        userSelect: 'none',
      }}
      title={`Click to cycle color palette (current: ${currentPalette})`}
    >
      <div
        className="fibonacci-flower-pattern"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {renderDots()}
      </div>
    </div>
  );
};

export default FibonacciFlower;