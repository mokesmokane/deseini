import React from 'react';
import { useLogoCarousel } from './LogoCarouselContext';

interface LogoCarouselProps {
  height?: string;
  width?: string;
}

const LogoCarousel: React.FC<LogoCarouselProps> = ({
  height = '100px',
  width = '100%',
}) => {
  const { currentIndex, logoFiles: contextLogoFiles } = useLogoCarousel();

  return (
    <div className="flex justify-center items-center" style={{ width, height }}>
      <img 
        src={`/logos/${contextLogoFiles[currentIndex]}`}
        alt={`Logo ${currentIndex + 1}`}
        className="max-w-full max-h-full object-contain transition-opacity duration-500"
      />
    </div>
  );
};

export default LogoCarousel;
