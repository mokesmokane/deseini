import React, { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Settings, Upload } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useFinalPlan } from '../../../hooks/useFinalPlan';

interface CanvasMenuProps {
}

const CanvasMenu: React.FC<CanvasMenuProps> = () => {
  const { setSettingsOpen } = useDraftPlanMermaidContext();  
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { generateFinalPlan, isGeneratingFinalPlan } = useFinalPlan();
  const { projectId } = useParams<{ projectId: string }>();
  const [publishComplete, setPublishComplete] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishTimeout, setPublishTimeout] = useState<NodeJS.Timeout | null>(null);

  // Spinner for tactile feedback
  const Spinner = () => (
    <div className="inline-block w-4 h-4 mr-2 align-middle">
      <div className="w-full h-full rounded-full border-2 border-b-transparent border-black animate-spin" />
    </div>
  );
  
  
  const handleOpenSettings = () => {
    setSettingsOpen(true);
    setIsMoreMenuOpen(false);
  };

  const handlePublishPlan = async () => {
    setPublishError(null);
    setPublishComplete(false);
    try {
      generateFinalPlan();
      setIsMoreMenuOpen(false);
      // Wait for publish to finish (track via isGeneratingFinalPlan)
      // Poll for state change
      if (publishTimeout) clearTimeout(publishTimeout);
      const waitForFinish = () => {
        if (!isGeneratingFinalPlan) {
          setPublishComplete(true);
        } else {
          setPublishTimeout(setTimeout(waitForFinish, 300));
        }
      };
      setTimeout(waitForFinish, 300);
    } catch (err: any) {
      setPublishError(err.message || 'Publish failed');
    }
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
      {/* Overlay for publishing feedback */}
      {isGeneratingFinalPlan && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg rounded-md z-50 flex flex-col items-center justify-center px-6 py-4" style={{ minHeight: '90px' }}>
          <Spinner />
          <span className="text-black text-sm font-medium mt-2">Publishing&hellip;</span>
        </div>
      )}
      {publishComplete && !isGeneratingFinalPlan && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg rounded-md z-50 flex flex-col items-center justify-center px-6 py-4" style={{ minHeight: '90px' }}>
          <span className="text-black text-base font-semibold mb-1">Published!</span>
          {projectId && (
            <a
              href={`/project/${projectId}/plan`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-black hover:text-gray-700 transition-colors text-sm mt-1"
              style={{ wordBreak: 'break-all' }}
            >
              View Published Plan
            </a>
          )}
        </div>
      )}
      {publishError && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-red-200 shadow-lg rounded-md z-50 flex flex-col items-center justify-center px-6 py-4" style={{ minHeight: '90px' }}>
          <span className="text-red-600 text-sm font-medium">{publishError}</span>
        </div>
      )}
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