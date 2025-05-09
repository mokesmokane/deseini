import React, { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Settings, Upload } from 'lucide-react';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useFinalPlan } from '../../../hooks/useFinalPlan';

interface CanvasMenuProps {
}

const CanvasMenu: React.FC<CanvasMenuProps> = () => {
  const { setSettingsOpen } = useDraftPlanMermaidContext();  
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { generateFinalPlan } = useFinalPlan();
  
  
  const handleOpenSettings = () => {
    setSettingsOpen(true);
    setIsMoreMenuOpen(false);
  };

  const handlePublishPlan = () => {
    generateFinalPlan();
    setIsMoreMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  
  return (
    <div className="relative" ref={moreMenuRef}>
      <button 
        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {isMoreMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <ul className="py-1">
            <li 
              className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
              onClick={handlePublishPlan}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Publish Plan</span>
            </li>
            <li 
              className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
              onClick={handleOpenSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </li>
            {/* <li 
              className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
              onClick={() =>{}}
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Export Plan</span>
            </li> */}
          </ul>
        </div>
      )}
    </div>
          );
        };

export default CanvasMenu;