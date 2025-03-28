import React, { useState, useEffect } from 'react';

// Logo file names
const logoFiles = [
  'image.png',
  'image copy.png',
  'image copy 2.png',
  'image copy 3.png',
  'image copy 4.png',
  'image copy 5.png',
  'image copy 6.png',
  'image copy 7.png',
];

interface LogoCarouselProps {
  autoRotateInterval?: number; // Time in ms between rotations
  height?: string;
  width?: string;
}

const LogoCarousel: React.FC<LogoCarouselProps> = ({
  autoRotateInterval = 3000,
  height = '100px',
  width = '100%',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate logos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % logoFiles.length);
    }, autoRotateInterval);
    
    return () => clearInterval(interval);
  }, [autoRotateInterval]);
  
  return (
    <div className="flex justify-center items-center" style={{ width, height }}>
      <img 
        src={`/src/logos/${logoFiles[currentIndex]}`}
        alt={`Logo ${currentIndex + 1}`}
        className="max-w-full max-h-full object-contain transition-opacity duration-500"
      />
    </div>
  );
};

export default LogoCarousel;
