import { createPortal } from 'react-dom';
import { useDraftPlanMermaidContext } from '../../../../contexts/DraftPlan/DraftPlanContextMermaid';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  onTextChange: (text: string) => void;
  title: string;
  contextActions: {
    newSummary: any;
    handleShowFullText: () => void;
    handleShowChartSyntax: () => void;
  };
}

export const EditDialog = ({ 
  isOpen, 
  onClose, 
  text, 
  onTextChange,
  title,
  contextActions
}: EditDialogProps) => {
  const { createPlanFromMarkdownString } = useDraftPlanMermaidContext();

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-45 z-[2147483647] flex items-center justify-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="dialog-title"
    >
      <div
        className="bg-white text-black rounded-xl shadow-sm max-w-[98vw] max-h-[80vh] w-[1000px] p-8 overflow-auto relative font-mono text-base border-[1.5px] border-gray-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => createPlanFromMarkdownString(text)}
          className="absolute top-3 right-14 bg-white text-black border-[1.5px] border-gray-200 rounded-md py-1 px-4 font-semibold text-base cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Regenerate plan from edited text"
        >
          Regenerate
        </button>
        
        <button
          onClick={onClose}
          className="absolute top-3 right-4 bg-transparent border-none text-xl cursor-pointer text-black font-bold p-0 leading-none hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
          aria-label="Close dialog"
        >
          ×
        </button>
        
        <div 
          id="dialog-title"
          className="font-bold mb-4 text-lg tracking-wide text-black"
        >
          {title}
        </div>
        
        <div className="flex gap-2 mb-3">
          <button
            onClick={contextActions.handleShowFullText}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              title === 'Full Streamed Text' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Full Text
          </button>
          
          <button
            onClick={contextActions.handleShowChartSyntax}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              title === 'Mermaid Syntax' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            Chart Syntax
          </button>
        </div>
        
        <textarea
          value={text}
          onChange={e => onTextChange(e.target.value)}
          className="bg-white text-black rounded-lg p-4 overflow-auto font-mono text-sm m-0 box-border whitespace-pre-wrap flex-1 border-[1.5px] border-gray-200 w-full min-h-[300px] resize-y outline-none transition-all focus:border-black focus:ring-2 focus:ring-gray-300"
          aria-label="Edit plan text"
          spellCheck={false}
        />
      </div>
    </div>,
    document.body
  );
};