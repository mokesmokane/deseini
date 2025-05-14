import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface PromptEnhancerButtonProps {
  isEnhancing: boolean;
  onClick: () => void;
}

const PromptEnhancerButton: React.FC<PromptEnhancerButtonProps> = ({ isEnhancing, onClick }) => {
  return (
    <button
      className={`text-black hover:text-gray-700 transition-colors ${isEnhancing ? 'opacity-70' : ''}`}
      onClick={onClick}
      disabled={isEnhancing}
      title="Enhance your prompt with AI"
    >
      {isEnhancing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </button>
  );
};

export default PromptEnhancerButton;
