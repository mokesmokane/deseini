import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useDraftMarkdown } from '../DraftMarkdownProvider';

interface SidebarProps {
  currentSectionId: string;
  onSelectSection: (id: string) => void;
}

const ContentSidebar: React.FC<SidebarProps> = ({ currentSectionId, onSelectSection }) => {
  const { sections } = useDraftMarkdown();
  
  return (
    <motion.div 
      className="w-64 bg-white border-r border-gray-200 overflow-auto"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >      
      <div className="py-2">
        {sections
          .sort((a, b) => (a.sectionIndex ?? 0) - (b.sectionIndex ?? 0))
          .map(section => (
            <motion.div
              key={section.id}
              whileHover={{ x: 4 }}
              onClick={() => onSelectSection(section.id)}
              className={`
                flex items-center px-4 py-3 cursor-pointer group
                ${currentSectionId === section.id 
                  ? 'bg-gray-100 border-l-4 border-gray-800' 
                  : 'border-l-4 border-transparent hover:bg-gray-50'
                }
              `}
            >
              <FileText 
                size={18} 
                className={`mr-3 ${currentSectionId === section.id ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`} 
              />
              <div>
                <p className={`text-sm font-medium 
                  ${currentSectionId === section.id ? 'text-gray-800' : 'text-gray-700'}`}
                >
                  {section.title}
                </p>
                <p className="text-xs text-gray-500">
                  {section.updatedAt 
                    ? new Date(section.updatedAt).toLocaleDateString() 
                    : 'No date'}
                </p>
              </div>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
};

export default ContentSidebar;