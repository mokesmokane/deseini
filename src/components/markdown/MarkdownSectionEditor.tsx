import React, { useState, useEffect, useRef } from 'react';
import './MarkdownViewer.css';

interface MarkdownSectionEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const MarkdownSectionEditor: React.FC<MarkdownSectionEditorProps> = ({ 
  content, 
  onSave, 
  onCancel 
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      // Place cursor at the end of the content
      textAreaRef.current.selectionStart = textAreaRef.current.value.length;
      textAreaRef.current.selectionEnd = textAreaRef.current.value.length;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSave(editedContent);
    }
    // Cancel on Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="markdown-section-editor">
      <textarea
        ref={textAreaRef}
        className="section-editor-textarea"
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Edit markdown section"
      />
      <div className="section-editor-controls">
        <button 
          className="section-editor-button save-button" 
          onClick={() => onSave(editedContent)}
        >
          Save
        </button>
        <button 
          className="section-editor-button cancel-button" 
          onClick={onCancel}
        >
          Cancel
        </button>
        <div className="section-editor-help">
          Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
};
