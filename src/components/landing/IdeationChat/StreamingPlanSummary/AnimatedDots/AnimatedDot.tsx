import React, { useRef, useEffect } from 'react';
import { TimelineItem } from './types';

interface AnimatedDotProps {
  item: TimelineItem;
  index: number;
  totalItems: number;
  isNew: boolean;
  primaryColor: string;
  dotSize: number;
  animationDuration: number;
  showTooltips: boolean;
  spacing: number;
  onDotClick?: (item: TimelineItem, index: number) => void;
}

const AnimatedDot: React.FC<AnimatedDotProps> = ({
  item,
  index,
  isNew,
  primaryColor,
  dotSize,
  animationDuration,
  showTooltips,
  spacing,
  onDotClick,
}) => {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNew && dotRef.current) {
      const dot = dotRef.current;
      dot.style.transform = 'scale(0) translate(-50%, -50%)';
      dot.style.opacity = '0';
      
      const timeout = setTimeout(() => {
        dot.style.transform = 'scale(1) translate(-50%, -50%)';
        dot.style.opacity = '1';
      }, 50);
      
      return () => clearTimeout(timeout);
    }
  }, [isNew]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDotClick?.(item, index);
    }
  };

  const dotColor = item.color || primaryColor;
  const dotStatus = item.status || 'pending';
  
  let dotStyles: React.CSSProperties = {
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    backgroundColor: dotColor,
    borderRadius: '50%',
    transition: `all ${animationDuration}ms ease-out`,
    position: 'absolute',
    top: '50%',
    left: `${index * spacing}px`,
    transform: 'translate(-50%, -50%)',
    cursor: onDotClick ? 'pointer' : 'default',
    zIndex: 2,
    boxShadow: '0 0 6px rgba(0,0,0,0.1)',
  };

  if (dotStatus === 'active') {
    dotStyles = {
      ...dotStyles,
      boxShadow: `0 0 0 ${dotSize/4}px ${dotColor}33, 0 0 ${dotSize/2}px ${dotColor}22`,
    };
  } else if (dotStatus === 'completed') {
    dotStyles = {
      ...dotStyles,
      backgroundColor: '#fff',
      border: `2px solid ${dotColor}`,
    };
  }

  return (
    <div
      ref={dotRef}
      role="button"
      tabIndex={onDotClick ? 0 : -1}
      aria-label={item.label || `Timeline item ${index + 1}`}
      style={dotStyles}
      onClick={() => onDotClick?.(item, index)}
      onKeyDown={handleKeyDown}
      title={showTooltips ? (item.tooltip as string) : undefined}
      data-tooltip={showTooltips ? item.tooltip : undefined}
    />
  );
};

export default AnimatedDot;