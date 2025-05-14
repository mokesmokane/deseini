import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import * as diffLib from 'diff';
import { useProjectPlan } from './ProjectPlanContext';
import { editMarkdownSection } from '../services/projectMarkdownService';

interface EditedSectionContextType {
  originalContent: string;
  editedContent: string;
  isStreaming: boolean;
  currentLineNumber: number;
  isEditing: boolean;
  sectionRange: { start: number; end: number } | null;
  instruction: string;
  diffText: string;
  resetState: () => void;
  startEditing: (range: { start: number; end: number }, instruction: string) => void;
  acceptChanges: () => Promise<void>;
  rejectChanges: () => void;
  acceptPartialChanges: (startIndex: number, endIndex: number, type: 'insert' | 'delete') => void;
  rejectPartialChanges: (startIndex: number, endIndex: number, type: 'insert' | 'delete') => void;
  finalizeChanges: () => Promise<void>;
  onFinalize: (callback: () => void) => void;
}

const EditedSectionContext = createContext<EditedSectionContextType | undefined>(undefined);

// Parse diff result into diff chunks for display
const createUnifiedDiff = (oldText: string, newText: string) => {
  const diffResult = diffLib.createPatch(
    'document.md',    // filename
    oldText,          // old text
    newText,          // new text
    '',               // old header
    '',               // new header
    { context: 3 }    // context lines
  );
  
  return `diff --git a/document.md b/document.md\n${diffResult}`;
};

// Parse a diff output to extract line information
const parseDiffContent = (diffText: string) => {
  if (!diffText) return [];
  
  const lines = diffText.split('\n');
  const diffLines: Array<{ type: 'context' | 'insert' | 'delete'; content: string; diffIndex: number }> = [];
  let diffIndex = 0;
  
  for (const line of lines) {
    // Skip hunk headers and other metadata
    if (line.startsWith('diff --git') || line.startsWith('index ') || 
        line.startsWith('---') || line.startsWith('+++') || 
        line.startsWith('@@') || line.startsWith('\\ No newline')) {
      continue;
    }
    
    if (line.startsWith('+')) {
      diffLines.push({
        type: 'insert',
        content: line.substring(1),
        diffIndex
      });
    } else if (line.startsWith('-')) {
      diffLines.push({
        type: 'delete',
        content: line.substring(1),
        diffIndex
      });
    } else if (line.startsWith(' ')) {
      diffLines.push({
        type: 'context',
        content: line.substring(1),
        diffIndex
      });
    }
    
    diffIndex++;
  }
  
  return diffLines;
};

export const EditedSectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentText, setCurrentText } = useProjectPlan();
  
  const [originalContent, setOriginalContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLineNumber, setCurrentLineNumber] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [sectionRange, setSectionRange] = useState<{ start: number; end: number } | null>(null);
  const [instruction, setInstruction] = useState('');
  const [diffText, setDiffText] = useState('');
  const [acceptedInserts, setAcceptedInserts] = useState<Set<number>>(new Set());
  const [rejectedInserts, setRejectedInserts] = useState<Set<number>>(new Set());
  const [acceptedDeletes, setAcceptedDeletes] = useState<Set<number>>(new Set());
  const [rejectedDeletes, setRejectedDeletes] = useState<Set<number>>(new Set());

  // Callback for when changes are finalized
  const finalizeCallbackRef = useRef<(() => void) | null>(null);

  const onFinalize = useCallback((callback: () => void) => {
    finalizeCallbackRef.current = callback;
  }, []);

  // Start editing a section by sending a request to the API
  const startEditing = async (range: { start: number; end: number }, instruction: string) => {
    if (!currentText) return;
    setIsEditing(true);
    setSectionRange(range);
    setInstruction(instruction);
    setIsStreaming(true);
    
    // Extract the section from the current document
    const textLines = currentText.split('\n');
    const sectionContent = textLines.slice(range.start, range.end + 1).join('\n');
    setOriginalContent(sectionContent);
    setEditedContent(''); // Clear any previous content
    
    // Reset all accept/reject state
    setAcceptedInserts(new Set());
    setRejectedInserts(new Set());
    setAcceptedDeletes(new Set());
    setRejectedDeletes(new Set());
    
    try {
      // Make API request to edit the section
      const response = await editMarkdownSection({
        fullMarkdown: currentText,
        sectionRange: range,
        instruction: instruction,
        projectContext: null
      });
      
      // Handle streaming response (if the endpoint supports streaming)
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        let receivedText = '';
        let accumulatedContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the chunk to text
          const chunkText = new TextDecoder().decode(value);
          receivedText += chunkText;
          
          // Process any complete JSON objects
          const jsonObjects = receivedText
            .split('\n')
            .filter(line => line.trim() !== '');
            
          // Reset received text to any remaining incomplete data
          receivedText = '';
          
          // Process each JSON object
          for (const jsonStr of jsonObjects) {
            try {
              const obj = JSON.parse(jsonStr);
              
              // Collect content from "line" type objects
              if (obj.type === 'line' && typeof obj.content === 'string') {
                accumulatedContent += obj.content + '\n';
                // Update the edited content incrementally as lines come in
                setEditedContent(accumulatedContent.trim());
                // Update the diff text incrementally
                setDiffText(createUnifiedDiff(sectionContent, accumulatedContent.trim()));
              }
            } catch (e) {
              // If it's not valid JSON, keep it for the next chunk
              receivedText += jsonStr + '\n';
            }
          }
        }
        
        // Make sure final content is set
        setEditedContent(accumulatedContent.trim());
        setDiffText(createUnifiedDiff(sectionContent, accumulatedContent.trim()));
      } else {
        console.error('startEditing - Failed to receive streaming response');
      }

      
      setIsStreaming(false);
    } catch (error) {
      console.error('Error editing section:', error);
      setIsStreaming(false);
    }
  };

  // Accept partial changes (specific group of insertions or deletions)
  const acceptPartialChanges = (startIndex: number, endIndex: number, type: 'insert' | 'delete') => {
    const diffLines = parseDiffContent(diffText);
    
    // Find the actual diff indices for the provided range
    const rangeIndices = diffLines
      .filter((line, idx) => idx >= startIndex && idx <= endIndex && line.type === type)
      .map(line => line.diffIndex);
    
    if (type === 'insert') {
      setAcceptedInserts(prev => {
        const newSet = new Set(prev);
        rangeIndices.forEach(idx => newSet.add(idx));
        return newSet;
      });
    } else if (type === 'delete') {
      setAcceptedDeletes(prev => {
        const newSet = new Set(prev);
        rangeIndices.forEach(idx => newSet.add(idx));
        return newSet;
      });
    }
  };
  
  // Reject partial changes (specific group of insertions or deletions)
  const rejectPartialChanges = (startIndex: number, endIndex: number, type: 'insert' | 'delete') => {
    const diffLines = parseDiffContent(diffText);
    
    // Find the actual diff indices for the provided range
    const rangeIndices = diffLines
      .filter((line, idx) => idx >= startIndex && idx <= endIndex && line.type === type)
      .map(line => line.diffIndex);
    
    if (type === 'insert') {
      setRejectedInserts(prev => {
        const newSet = new Set(prev);
        rangeIndices.forEach(idx => newSet.add(idx));
        return newSet;
      });
    } else if (type === 'delete') {
      setRejectedDeletes(prev => {
        const newSet = new Set(prev);
        rangeIndices.forEach(idx => newSet.add(idx));
        return newSet;
      });
    }
  };
  
  // Finalize changes by applying all accepted changes and removing rejected ones
  const finalizeChanges = async () => {
    if (!currentText || !sectionRange) return Promise.resolve();
    
    const diffLines = parseDiffContent(diffText);
    const finalLines: string[] = [];
    
    // Process each diff line to create the final content
    for (const line of diffLines) {
      if (line.type === 'context') {
        finalLines.push(line.content);
      } else if (line.type === 'insert') {
        // Add the insertion if it's accepted or not rejected
        if (acceptedInserts.has(line.diffIndex) || 
            (!rejectedInserts.has(line.diffIndex) && !acceptedDeletes.has(line.diffIndex) && !rejectedDeletes.has(line.diffIndex))) {
          finalLines.push(line.content);
        }
      } else if (line.type === 'delete') {
        // Keep the original line if the deletion is rejected or not accepted
        if (rejectedDeletes.has(line.diffIndex) || 
            (!acceptedDeletes.has(line.diffIndex) && !acceptedInserts.has(line.diffIndex) && !rejectedInserts.has(line.diffIndex))) {
          finalLines.push(line.content);
        }
      }
    }
    
    const finalContent = finalLines.join('\n');
    
    // Update the full document with the finalized changes
    const textLines = currentText.split('\n');
    const beforeSection = textLines.slice(0, sectionRange.start).join('\n');
    const afterSection = textLines.slice(sectionRange.end + 1).join('\n');
    
    const updatedContent = [
      beforeSection, 
      finalContent, 
      afterSection
    ].filter(Boolean).join('\n');
    
    // Update the project plan with the new content
    try {
      // Update the project plan with the revised content
      setCurrentText(updatedContent);
      
      resetState();
      
      // Call the finalize callback if provided
      if (finalizeCallbackRef.current) {
        finalizeCallbackRef.current();
        finalizeCallbackRef.current = null;
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error finalizing changes:', error);
      return Promise.reject(error);
    }
  };

  // Accept edited changes and update the project plan
  const acceptChanges = async () => {
    if (!currentText || !sectionRange || !editedContent) return Promise.resolve();
    
    const textLines = currentText.split('\n');
    
    // Replace the edited section in the full document
    const beforeSection = textLines.slice(0, sectionRange.start).join('\n');
    const afterSection = textLines.slice(sectionRange.end + 1).join('\n');
    
    // Create the new document with the edited section
    const updatedContent = [
      beforeSection, 
      editedContent, 
      afterSection
    ].filter(Boolean).join('\n');
    
    // Update the project plan with the new content
    try {
      // Update the project plan with the revised content
      setCurrentText(updatedContent);
      
      resetState();
      
      // Call the finalize callback if provided
      if (finalizeCallbackRef.current) {
        finalizeCallbackRef.current();
        finalizeCallbackRef.current = null;
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating plan:', error);
      return Promise.reject(error);
    }
  };

  // Reject changes and reset the state
  const rejectChanges = () => {
    resetState();
  };

  // Reset the editing state
  const resetState = () => {
    setIsEditing(false);
    setSectionRange(null);
    setInstruction('');
    setOriginalContent('');
    setEditedContent('');
    setIsStreaming(false);
    setCurrentLineNumber(0);
    setDiffText('');
    setAcceptedInserts(new Set());
    setRejectedInserts(new Set());
    setAcceptedDeletes(new Set());
    setRejectedDeletes(new Set());
  };

  // Create the context value object
  const value = {
    originalContent,
    editedContent,
    isStreaming,
    currentLineNumber,
    isEditing,
    sectionRange,
    instruction,
    diffText,
    startEditing,
    acceptChanges,
    rejectChanges,
    resetState,
    acceptPartialChanges,
    rejectPartialChanges,
    finalizeChanges,
    onFinalize
  };

  return (
    <EditedSectionContext.Provider value={value}>
      {children}
    </EditedSectionContext.Provider>
  );
};

export const useEditedSection = () => {
  const context = useContext(EditedSectionContext);
  if (context === undefined) {
    throw new Error('useEditedSection must be used within an EditedSectionProvider');
  }
  return context;
};
