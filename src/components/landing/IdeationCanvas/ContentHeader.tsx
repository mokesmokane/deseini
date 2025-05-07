import React, { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, RefreshCw } from 'lucide-react';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useDraftMarkdown } from '../../../contexts/DraftMarkdownProvider';


const ContentHeader: React.FC = () => {
  const { createPlanFromMarkdownString } = useDraftPlanMermaidContext();  
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { sections } = useDraftMarkdown();
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const handleRefreshPlan = () => {
    createPlanFromMarkdownString(sections.map(section => section.content).join('\n\n'));
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
                    {/* <li 
                      className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
                      onClick={handleRefreshPlan}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      <span>Show Canvas</span>
                    </li> */}
                    <li 
                      className="px-4 py-2 hover:bg-gray-100 flex items-center cursor-pointer"
                      onClick={handleRefreshPlan}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      <span>Refresh Plan</span>
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
            {/* </div>
    <div className="relative" ref={moreMenuRef}>
      <button 
        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
        aria-haspopup="true"
        aria-expanded={isMoreMenuOpen}
      >
        <MoreHorizontal size={18} />
      </button>
      
      {isMoreMenuOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <ul className="py-1">
            <li>
              <button 
                onClick={handleRefreshPlan}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh Plan
              </button>
            </li>
          </ul>
        </div>
      )}
    </div> */}
// Add CSS for shimmer animation in case it's needed elsewhere in the app
if (typeof document !== 'undefined' && !document.getElementById('shimmer-animation-style')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'shimmer-animation-style';
  styleElement.innerHTML = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(styleElement);
}

export default ContentHeader;