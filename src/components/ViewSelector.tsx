import React from 'react';
import './ViewSelector.css';
import GanttIcon from '../icons/GanttIcon';

export type ViewMode = 'chart' | 'markdown' | 'grid';

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

// Ultra minimal, clean SVG icons with larger dimensions
const MarkdownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);


const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="view-selector-container">
        <button
        type="button"
        className={`view-button ${currentView === 'markdown' ? 'active' : ''}`}
        onClick={() => onViewChange('markdown')}
          aria-current={currentView === 'markdown' ? 'page' : undefined}
        aria-label="Markdown View"
        title="Markdown View"
        >
          <MarkdownIcon />
        </button>
      
      <button
        type="button"
        className={`view-button ${currentView === 'grid' ? 'active' : ''}`}
        onClick={() => onViewChange('grid')}
        aria-current={currentView === 'grid' ? 'page' : undefined}
        aria-label="Grid View"
        title="Grid View"
      >
        <GridIcon />
          </button>
          <button
        type="button"
        className={`view-button ${currentView === 'chart' ? 'active' : ''}`}
        onClick={() => onViewChange('chart')}
        aria-current={currentView === 'chart' ? 'page' : undefined}
        aria-label="Chart View"
        title="Chart View"
      >
        <GanttIcon />
          </button>
    </div>
  );
};

export default ViewSelector;
