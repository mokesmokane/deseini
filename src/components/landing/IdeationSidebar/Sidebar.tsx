import React from 'react';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  DocumentIcon,
  PencilIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  
  return (
    <motion.div
      className="h-full bg-white overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: isVisible ? '72px' : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full flex flex-col pt-6 pb-4 overflow-x-hidden">
        <nav className="flex-1 pb-4 flex flex-col items-center space-y-6 overflow-y-auto overflow-x-hidden">
          <SidebarIcon icon={<FolderIcon className="h-6 w-6" />} tooltip="Projects" />
          <SidebarIcon icon={<DocumentIcon className="h-6 w-6" />} tooltip="Templates" />
          <SidebarIcon icon={<PencilIcon className="h-6 w-6" />} tooltip="Sketches" />
          <SidebarIcon icon={<ArrowsPointingOutIcon className="h-6 w-6" />} tooltip="Export" />
        </nav>
        
        <div className="flex justify-center pt-4">
          <button 
            className="flex items-center justify-center bg-white text-gray p-2 rounded-md hover:bg-gray-800 transition-colors w-10 h-10"
            title="Hide Sidebar"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SidebarIcon: React.FC<{ icon: React.ReactNode; tooltip: string }> = ({ icon, tooltip }) => {
  return (
    <div className="relative group">
      <button
        className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
        title={tooltip}
      >
        {icon}
      </button>
      <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
};

export default Sidebar;
