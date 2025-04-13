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
  const [hasChanges, setHasChanges] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      // Place cursor at the end of the content
      textAreaRef.current.selectionStart = textAreaRef.current.value.length;
      textAreaRef.current.selectionEnd = textAreaRef.current.value.length;
      
      // Initial auto-resize
      adjustTextareaHeight();
    }
  }, []);

  // Track content changes
  useEffect(() => {
    setHasChanges(editedContent !== content);
  }, [editedContent, content]);
  
  // Adjust textarea height to fit content
  const adjustTextareaHeight = () => {
    const textarea = textAreaRef.current;
    const editor = editorRef.current;
    if (!textarea || !editor) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate if content would overflow our max container height
    const wouldOverflow = textarea.scrollHeight > editor.clientHeight * 0.9;
    setIsOverflowing(wouldOverflow);
    
    // Set height to scrollHeight to fit the content (within limits)
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    // Auto-resize the textarea as content changes
    adjustTextareaHeight();
  };

  const handleBlur = () => {
    // Auto-save when clicking away from the editor
    onSave(editedContent);
  };

  return (
    <div 
      ref={editorRef}
      className={`markdown-section-editor ${isOverflowing ? 'overflow' : ''}`}
    >
      <textarea
        ref={textAreaRef}
        className="section-editor-textarea auto-resize"
        value={editedContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Edit markdown section"
      />
      {hasChanges && (
        <div className="section-editor-controls">
          <button 
            className="section-editor-button cancel-button" 
            onClick={onCancel}
          >
            Cancel
          </button>
          <div className="section-editor-help">
            Press <kbd>Esc</kbd> to cancel
          </div>
        </div>
      )}
    </div>
  );
};
