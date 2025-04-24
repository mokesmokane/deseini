import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Logo file names
const logoFiles = [
  'DeseiniBubble.png',
  'DeseiniGraffiti.png',
  'DeseiniItalic.png',
  'DeseiniNewRoman.png',
  'DeseiniPaint.png',
  'DeseiniSans.png',
  'DeseiniSketch.png',
  'DeseiniWestern.png',
];

interface LogoCarouselContextValue {
  currentIndex: number;
  logoFiles: string[];
}

const LogoCarouselContext = createContext<LogoCarouselContextValue | undefined>(undefined);

interface LogoCarouselProviderProps {
  autoRotateInterval?: number;
  children: ReactNode;
}

export const LogoCarouselProvider: React.FC<LogoCarouselProviderProps> = ({ autoRotateInterval = 3000, children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % logoFiles.length);
    }, autoRotateInterval);
    return () => clearInterval(interval);
  }, [autoRotateInterval]);

  return (
    <LogoCarouselContext.Provider value={{ currentIndex, logoFiles }}>
      {children}
    </LogoCarouselContext.Provider>
  );
};

export const useLogoCarousel = () => {
  const context = useContext(LogoCarouselContext);
  if (!context) {
    throw new Error('useLogoCarousel must be used within a LogoCarouselProvider');
  }
  return context;
};
