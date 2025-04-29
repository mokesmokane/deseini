import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentSidebar from './ContentSidebar';
import ContentArea from './ContentArea';
import { useDraftMarkdown } from '../DraftMarkdownProvider';
import { Share2 } from 'lucide-react';
import TabSelector from './TabSelector';
import ContentHeader from './ContentHeader';
import PlanGenerationStatus from './PlanGenerationStatus';  
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';

interface CanvasProps {
  isVisible: boolean;
  activeTab: 'notes' | 'plan';
  setActiveTab: (tab: 'notes' | 'plan') => void;
  isChatVisible: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isVisible, activeTab, setActiveTab, isChatVisible }) => {
  const { currentSectionId, selectSection } = useDraftMarkdown();
  const { 
    isLoading: isPlanGenerating, 
    streamSummary 
  } = useDraftPlanMermaidContext();
  
  // Reference to track previous generation state
  const wasGeneratingRef = useRef(false);
  
  // Effect to automatically select plan tab when generation completes
  useEffect(() => {
    // If generation was happening and now it's complete
    if (wasGeneratingRef.current && !isPlanGenerating) {
      // Automatically switch to the plan tab
      setActiveTab('plan');
    }
    
    // Update the reference for next check
    wasGeneratingRef.current = isPlanGenerating;
  }, [isPlanGenerating, setActiveTab]);

  // Determine whether to show generation status - only when we're generating a plan or have a summary
  const showGenerationStatus = (isPlanGenerating && streamSummary);
  
  // Determine if window width >= 'xl' (1280px) for side-by-side layout
  const [isXl, setIsXl] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth >= 1280);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const handler = (e: MediaQueryListEvent) => setIsXl(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  const dualView = isVisible && !isChatVisible && isXl;

  return (
    <div className="flex items-center justify-center p-4 w-full h-full min-h-0 min-w-0">
        <div className="w-full h-full min-h-0 min-w-0 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border-gray-200">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!dualView && <TabSelector 
                activeTab={activeTab} 
                onChange={setActiveTab}
                isGeneratingPlan={isPlanGenerating} 
              />}
              {showGenerationStatus && (
                <PlanGenerationStatus />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <ContentHeader />
              <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-grow overflow-hidden min-h-0 min-w-0">
            <motion.div
              className="h-full w-full min-h-0 min-w-0 overflow-hidden flex shadow-lg rounded-lg"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ 
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.98,
                width: isVisible ? '100%' : 0 
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30 
              }}
            >
              <AnimatePresence mode="wait">
                {activeTab === 'notes' && (
                  <ContentSidebar 
                    key="sidebar"
                    currentSectionId={currentSectionId || ''}
                    onSelectSection={selectSection}
                  />
                )}
              </AnimatePresence>
              <ContentArea 
                currentSectionId={currentSectionId || ''}
                activeTab={activeTab}
                dualView={dualView}
              />
            </motion.div>
          </div>
        </div>
      </div>
  );
};

export default Canvas;