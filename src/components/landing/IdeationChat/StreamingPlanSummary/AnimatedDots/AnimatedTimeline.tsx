import React, { useState, useEffect, useRef } from 'react';
import { AnimatedTimelineProps, TimelineItem } from './types';
import AnimatedDot from './AnimatedDot';

const MIN_DOT_SPACING = 50; // Minimum spacing between dots

const AnimatedTimeline: React.FC<AnimatedTimelineProps> = ({
  items,
  primaryColor = '#000000',
  lineHeight = 4,
  dotSize = 12,
  animationDuration = 500,
  className = '',
  style = {},
  showTooltips = true,
  onDotClick,
}) => {
  const [previousItems, setPreviousItems] = useState<TimelineItem[]>([]);
  const [spacing, setSpacing] = useState(MIN_DOT_SPACING);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const newItemIds = items.filter(item => 
    !previousItems.some(prevItem => prevItem.id === item.id)
  ).map(item => item.id);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPreviousItems(items);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [items]);

  // Calculate spacing based on container width
  useEffect(() => {
    if (!containerRef.current || items.length <= 1) return;

    const updateSpacing = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      if (containerWidth === 0) return;

      // Calculate new spacing based on available width
      const totalGaps = Math.max(items.length - 1, 1);
      const newSpacing = Math.min(MIN_DOT_SPACING, containerWidth / totalGaps);
      
      setSpacing(newSpacing);
    };

    updateSpacing();

    const observer = new ResizeObserver(updateSpacing);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [items.length]);
  
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: `${lineHeight + dotSize * 2}px`,
    ...style,
  };

  // Don't render any line if there's only one item
  if (items.length <= 1) {
    return (
      <div 
        ref={containerRef}
        className={`animated-timeline ${className}`}
        style={containerStyles}
        role="progressbar"
        aria-label="Timeline progress"
      >
        {items.length === 1 && (
          <AnimatedDot
            key={items[0].id}
            item={items[0]}
            index={0}
            totalItems={1}
            isNew={newItemIds.includes(items[0].id)}
            primaryColor={primaryColor}
            dotSize={dotSize}
            animationDuration={animationDuration}
            showTooltips={showTooltips}
            onDotClick={onDotClick}
            spacing={spacing}
          />
        )}
      </div>
    );
  }

  const lineWidth = (items.length - 1) * spacing;
  
  const progressLineStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: `${lineWidth}px`,
    height: `${lineHeight}px`,
    backgroundColor: primaryColor,
    transform: 'translateY(-50%)',
    borderRadius: `${lineHeight / 2}px`,
    transition: `width ${animationDuration}ms ease-out`,
    zIndex: 1,
  };

  return (
    <div 
      ref={containerRef}
      className={`animated-timeline ${className}`}
      style={containerStyles}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={(items.length / Math.max(items.length, 1)) * 100}
      aria-label="Timeline progress"
    >
      <div style={progressLineStyles} />
      
      {items.map((item, index) => (
        <AnimatedDot
          key={item.id}
          item={item}
          index={index}
          totalItems={items.length}
          isNew={newItemIds.includes(item.id)}
          primaryColor={primaryColor}
          dotSize={dotSize}
          animationDuration={animationDuration}
          showTooltips={showTooltips}
          onDotClick={onDotClick}
          spacing={spacing}
        />
      ))}
    </div>
  );
};

export default AnimatedTimeline;