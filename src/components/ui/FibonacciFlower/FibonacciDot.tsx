import React, { useState, useEffect } from 'react';
import { DotProps } from './types';

/**
 * Individual dot component in the Fibonacci pattern
 */
const FibonacciDot: React.FC<DotProps> = ({ 
  x, y, size, color, delay, index 
}) => {
  // State to control dot visibility for animation
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger appearance animation after specified delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 0.85 : 0,
        transition: `
          opacity 600ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
          transform 600ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms,
          width 800ms cubic-bezier(0.4, 0, 0.2, 1),
          height 800ms cubic-bezier(0.4, 0, 0.2, 1),
          left 800ms cubic-bezier(0.4, 0, 0.2, 1),
          top 800ms cubic-bezier(0.4, 0, 0.2, 1)
        `,
        boxShadow:'none',
        zIndex: Math.floor(1000 - index),
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(FibonacciDot);