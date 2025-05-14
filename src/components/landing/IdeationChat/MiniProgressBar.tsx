import React from 'react';

const ProgressSegment: React.FC<{ filled: boolean }> = ({ filled }) => (
  <div className={`h-1 w-full ${filled ? 'bg-black' : 'bg-gray-200'} transition-colors duration-300`} />
);

const MiniProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => {
  const segments = [25, 50, 75, 100].map((threshold) => percentage >= threshold);
  return (
    <div className="flex space-x-0.5 w-24 mx-auto">
      {segments.map((filled, index) => (
        <div key={index} className="flex-1">
          <ProgressSegment filled={filled} />
        </div>
      ))}
    </div>
  );
};

export default MiniProgressBar;
