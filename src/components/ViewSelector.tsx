import React from 'react';

export type ViewMode = 'diff' | 'markdown' | 'grid';

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
          currentView === 'diff'
            ? 'bg-gray-700 text-white'
            : 'bg-white text-gray-900 hover:bg-gray-100'
        } border border-gray-300`}
        onClick={() => onViewChange('diff')}
        aria-current={currentView === 'diff' ? 'page' : undefined}
      >
        Diff View
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium ${
          currentView === 'markdown'
            ? 'bg-gray-700 text-white'
            : 'bg-white text-gray-900 hover:bg-gray-100'
        } border-t border-b border-gray-300`}
        onClick={() => onViewChange('markdown')}
        aria-current={currentView === 'markdown' ? 'page' : undefined}
      >
        Markdown
      </button>
      <button
        type="button"
        className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
          currentView === 'grid'
            ? 'bg-gray-700 text-white'
            : 'bg-white text-gray-900 hover:bg-gray-100'
        } border border-gray-300`}
        onClick={() => onViewChange('grid')}
        aria-current={currentView === 'grid' ? 'page' : undefined}
      >
        Grid View
      </button>
    </div>
  );
};

export default ViewSelector;
