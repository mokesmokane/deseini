import React from 'react';
import { UpdateIcon, Pencil1Icon } from '@radix-ui/react-icons'; // Import the icon and Edit icon

interface SuggestedRepliesProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  onRefreshSuggestions: () => void; // Add prop for refresh action
  onEditSuggestion: (suggestion: string) => void; // Add prop for edit action
  isLoading?: boolean; // Optional flag to show loading state
}

export const SuggestedReplies: React.FC<SuggestedRepliesProps> = ({
  suggestions,
  onSelectSuggestion,
  onRefreshSuggestions, // Destructure the new prop
  onEditSuggestion, // Destructure the new prop
  isLoading
}) => {
  // Show loading indicator if isLoading is true
  if (isLoading) {
    return (
      <div className="mb-3 px-1 flex items-center gap-2 animate-pulse">
        <span className="text-sm text-gray-400 mr-2 font-medium">Generating suggestions...</span>
        {/* Optional: add pulsing dots or spinner here */}
        <div className="flex space-x-1">
            <div className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }
  
  // Don't render anything if not loading and no suggestions are available
  if (!suggestions || suggestions.length === 0) {
    // Optionally, show the refresh button even if there are no suggestions initially?
    // For now, let's only show it when suggestions *are* present or were attempted.
    // If suggestions is empty but not loading, we can assume generation finished with no results.
    // We could show a standalone refresh button here if desired. Let's keep it hidden for now.
    return null; 
  }

  // Render suggestions if available and not loading
  // Render suggestions and the refresh button
  return (
    <div className="mb-3 px-1 flex gap-3 items-center"> {/* Changed to items-center for button alignment */}
      {/* Suggestions container */}
      <div className="flex-grow flex gap-3 items-stretch">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex-1 flex items-stretch shadow-sm rounded-lg overflow-hidden border border-teal-200">
            {/* Main suggestion button */}
            <button
              onClick={() => onSelectSuggestion(suggestion)}
              className="flex-grow bg-teal-100 text-teal-800 font-medium px-4 py-2 text-base hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-inset focus:ring-teal-400 transition-all whitespace-normal h-auto text-left disabled:opacity-70"
              disabled={isLoading}
            >
              {suggestion}
            </button>
            {/* Edit button */}
            <button
              onClick={() => onEditSuggestion(suggestion)}
              className="bg-teal-100 text-teal-600 hover:text-teal-800 hover:bg-teal-200 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-400 transition-colors disabled:opacity-50"
              aria-label={`Edit suggestion: ${suggestion}`}
              title="Edit this suggestion in the input box" // Tooltip
              disabled={isLoading}
            >
              <Pencil1Icon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {/* Refresh button */}
      <button
        onClick={onRefreshSuggestions}
        className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-md disabled:opacity-50"
        aria-label="Refresh suggestions"
        title="Refresh suggestions" // Tooltip for clarity
        disabled={isLoading} // Disable while loading
      >
        <UpdateIcon className="h-5 w-5" />
      </button>
    </div>
  );
}; 