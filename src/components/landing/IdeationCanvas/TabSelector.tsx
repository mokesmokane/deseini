import React, { useState, useEffect } from 'react';

interface TabSelectorProps {
  activeTab: 'notes' | 'plan';
  onChange: (tab: 'notes' | 'plan') => void;
  isGeneratingPlan?: boolean;
}

// Simple spinner component with clean, modern styling
const Spinner = () => (
  <div className="inline-block w-4 h-4 ml-1">
    <div className="w-full h-full rounded-full border-2 border-b-transparent border-black animate-spin" />
  </div>
);

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onChange, isGeneratingPlan = false }) => {
  // Ensure we have a valid activeTab - default to 'notes' if undefined
  const currentTab = activeTab || 'notes';
  
  // Add a brief delay before showing to ensure proper rendering
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Ensure component is mounted before showing
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative bg-gray-100/80 backdrop-blur-sm rounded-full p-1 w-[200px]"
      style={{ opacity: isReady ? 1 : 0.99 }} // Very subtle opacity change to force re-render
    >
      <div className="relative flex">
        {/* White background indicator - static positioning instead of animation */}
        <div
          className="absolute inset-y-0 rounded-full bg-white shadow-md border border-gray-200 z-0 transition-all duration-300 ease-in-out"
          style={{
            width: '50%',
            left: currentTab === 'notes' ? '0%' : '50%'
          }}
        />
        
        {/* Tab buttons */}
        {['notes', 'plan'].map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab as 'notes' | 'plan')}
            className={`
              relative z-10 w-[100px] py-1.5 text-sm font-medium 
              rounded-full transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
              ${currentTab === tab 
                ? 'text-gray-800 font-semibold' 
                : 'text-gray-500 hover:text-gray-700 bg-transparent'
              }
            `}
            style={{ background: 'transparent' }}
          >
            <span className="flex items-center justify-center">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'plan' && isGeneratingPlan && <Spinner />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabSelector;