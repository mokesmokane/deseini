import React from 'react';
import ReactMarkdown from 'react-markdown';
interface TextDisplayDialogProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

/**
 * A dialog component for displaying plain text content
 */
const TextDisplayDialog: React.FC<TextDisplayDialogProps> = ({
  isOpen,
  title,
  content,
  onClose
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
      <div className="relative p-6 bg-white w-full max-w-2xl m-auto rounded-md shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="mb-6 overflow-auto max-h-96">
          <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm border border-gray-200 p-4 rounded-md bg-gray-50">
            {content}
          </pre>
        </div>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 focus:outline-none"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextDisplayDialog;
