import React from 'react';
import { motion } from 'framer-motion';

interface CanvasProps {
  isVisible: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isVisible }) => {
  return (
    <motion.div
      className="h-full bg-white overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: isVisible ? '100%' : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="h-full w-full flex items-center justify-center px-4 pt-6 pb-4">
        <div className="bg-white border border-black rounded-lg p-6 shadow-lg w-full h-[calc(100%-4px)] flex flex-col">
          <h2 className="text-2xl font-semibold mb-2 border-b border-black pb-2">Design Canvas</h2>
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500">Canvas content will appear here</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Canvas;
