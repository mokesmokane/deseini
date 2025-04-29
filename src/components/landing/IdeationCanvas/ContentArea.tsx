import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownViewer } from '../markdown/MarkdownViewer';
import { useDraftMarkdown } from '../DraftMarkdownProvider';
import DraftPlanMermaid from '@/components/draft_plan_mermaid/DraftPlanMermaid';

interface ContentAreaProps {
  currentSectionId: string;
  activeTab: 'notes' | 'plan';
}

const ContentArea: React.FC<ContentAreaProps> = ({ currentSectionId, activeTab }) => {
  const { getSectionById } = useDraftMarkdown();
  const currentSection = getSectionById(currentSectionId);

  return (
    <motion.div 
      className="flex-grow flex flex-col bg-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >      
      <div className="flex-grow overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + currentSectionId}
            initial={{ opacity: 0, x: activeTab === 'notes' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'notes' ? 20 : -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="p-6 h-full"
          >
            {activeTab === 'notes' ? (
              currentSectionId ? (
                <MarkdownViewer section={currentSectionId} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                  <p className="mb-4">No section selected</p>
                  <p className="text-sm">Select a section from the sidebar to view its content</p>
                </div>
              )
            ) : (
              <DraftPlanMermaid />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ContentArea;