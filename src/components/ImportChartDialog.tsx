import React, { useState } from 'react';

interface ImportChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonData: string) => void;
}

const ImportChartDialog: React.FC<ImportChartDialogProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  
  // Check if the input is valid JSON
  const validateJson = (input: string): boolean => {
    try {
      JSON.parse(input);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonInput(value);
    
    // Only validate if there's content
    if (value.trim()) {
      setIsValidJson(validateJson(value));
    } else {
      setIsValidJson(null);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Import Gantt Chart</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Paste your Gantt chart JSON data:
          </label>
          <textarea
            className={`w-full h-64 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
              isValidJson === false 
                ? 'border-red-500 focus:ring-red-500' 
                : isValidJson === true 
                  ? 'border-green-500 focus:ring-green-500' 
                  : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Paste JSON here..."
            value={jsonInput}
            onChange={handleInputChange}
          />
          
          {isValidJson === false && (
            <p className="text-red-500 text-xs mt-1">
              Invalid JSON format. Please check your input.
            </p>
          )}
          
          {isValidJson === true && (
            <p className="text-green-500 text-xs mt-1">
              Valid JSON format.
            </p>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <p>The JSON should include the following structure:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>A name for your chart</li>
              <li>A tasks array with your gantt chart items</li>
              <li>Each task should have id, text, start_date, and duration properties</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 bg-neutral-700 hover:bg-neutral-800`}
          >
            Import Chart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportChartDialog;
