import React from 'react';
import LogoCarousel from './LogoCarousel';

const LogoCarouselExample: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">Our Partners</h2>
      <LogoCarousel 
        height="120px" 
        width="100%" 
        autoRotateInterval={4000} 
      />
    </div>
  );
};

export default LogoCarouselExample;
