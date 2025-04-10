import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { useProjectPlan } from './ProjectPlanContext';
import { toast } from 'react-hot-toast';

interface SectionRange {
  start: number;
  end: number;
}

interface EditedSectionContextType {
  previousText: string | null;
  currentText: string | null;
  isStreaming: boolean;
  currentRange: SectionRange | null;
  currentInstruction: string;
  currentLineNumber: number;
  
  // Actions
  startEditing: (range: SectionRange, instruction: string) => Promise<void>;
  clearEditing: () => void;
  setIsStreaming: (streaming: boolean) => void;
  setCurrentLineNumber: (lineNumber: number) => void;
}

const EditedSectionContext = createContext<EditedSectionContextType | undefined>(undefined);

// Helper function to handle streaming text similar to ProjectPlanContext
const streamLines = async (
  currentText: string,
  reader: ReadableStreamDefaultReader<string>,
  onLineUpdate: (lineNumber: number, text: string) => void
): Promise<void> => {
  const currentLines = currentText.split('\n');
  let workingLines = [...currentLines];
  let buffer = '';
  let lineIndex = 0;
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    
    try {
      // Try to parse the value as JSON
      const lines = value.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          console.log('[EditedSection] Processing line:', line);
          const dataContent = line.substring(6);
          try {
            const jsonData = JSON.parse(dataContent);
            if (jsonData && jsonData.chunk) {
              // Extract the chunk text
              buffer += jsonData.chunk;
            }
          } catch (e) {
            // If JSON parsing fails, treat as plain text
            console.warn("Failed to parse JSON from data line:", e);
            buffer += dataContent;
          }
        } else {
          // Handle non-data lines as plain text
          buffer += line;
        }
      }
    } catch (e) {
      // Fallback if there's any error in parsing
      console.warn("Error processing stream value:", e);
      buffer += value;
    }
    
    // Process any complete lines in the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    
    for (const line of lines) {
      // Ensure the workingLines array has enough lines
      while (workingLines.length <= lineIndex) {
        workingLines.push('');
      }
      
      workingLines[lineIndex] = line;
      
      const updatedText = workingLines.join('\n');
      onLineUpdate(lineIndex, updatedText);
      lineIndex++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final line flush if there's any remaining data in the buffer
  if (buffer.length > 0) {
    while (workingLines.length <= lineIndex) {
      workingLines.push('');
    }
    
    workingLines[lineIndex] = buffer;
    const updatedText = workingLines.join('\n');
    onLineUpdate(lineIndex, updatedText);
  }
  
  // Trim any remaining lines from the original text if needed
  if (lineIndex < currentLines.length - 1) {
    workingLines = workingLines.slice(0, lineIndex + 1);
    const finalText = workingLines.join('\n');
    onLineUpdate(lineIndex, finalText);
  }
  
  return Promise.resolve();
};

export const EditedSectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getAllLines } = useProjectPlan();
  
  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [currentRange, setCurrentRange] = useState<SectionRange | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [currentLineNumber, setCurrentLineNumber] = useState<number>(0);
  
  const wasStreamingRef = useRef(false);
  
  // Track streaming state changes to update previousContent
  useEffect(() => {
    if (isStreaming !== wasStreamingRef.current) {
      if (isStreaming) {
        // Streaming started, save current content as previous
        setPreviousText(currentText);
      }
      wasStreamingRef.current = isStreaming;
    }
  }, [isStreaming, currentText]);

  // Start editing a section
  const startEditing = useCallback(async (range: SectionRange, instruction: string) => {
    const allLines = getAllLines();
    const sectionContent = allLines.slice(range.start, range.end + 1).join('\n');
    
    setPreviousText(sectionContent);
    setCurrentText(sectionContent);
    setCurrentRange(range);
    setCurrentInstruction(instruction);
    setCurrentLineNumber(0);
    setIsStreaming(true);
    
    try {
      // Prepare the request for streaming
      const response = await fetch('/api/edit-markdown-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullMarkdown: getAllLines().join('\n'),
          sectionRange: range,
          instruction,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Check if the response is a stream
      if (response.body) {
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        
        // Process the stream and update state as lines come in
        await streamLines(sectionContent, reader, (lineNumber: number, updatedText: string) => {
          console.log('[EditedSection] Updating line number:', lineNumber, updatedText);
          setCurrentLineNumber(lineNumber);
          setCurrentText(updatedText);
        });      
      } else {
        // If it's not a stream, handle as a regular JSON response (fallback)
        const data = await response.json();
        
        if (data.editedMarkdown) {
          // Extract just the edited section from the full document
          const editedLines = data.editedMarkdown.split('\n');
          const editedSectionLines = editedLines.slice(range.start, range.end + 1);
          const editedSectionContent = editedSectionLines.join('\n');
          
          setCurrentText(editedSectionContent);
          
          // Simulate streaming for visual effect
          for (let i = 0; i < editedSectionLines.length; i++) {
            setCurrentLineNumber(i);
            
            // Slight delay between line highlights
            const delay = 100 + Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // Make sure we hit the last line
          setCurrentLineNumber(editedSectionLines.length - 1);
        } else {
          throw new Error('No edited content returned');
        }
      }
      
      // Short delay before completing
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsStreaming(false);
    } catch (error) {
      console.error('Error in section edit streaming:', error);
      toast.error('Failed to edit section');
      setIsStreaming(false);
    }
  }, [getAllLines]);

  // Accept changes and apply to the main document
  const acceptChanges = useCallback(async (): Promise<boolean> => {
    return false;
  }, [currentRange, getAllLines, setCurrentText]);
  
  // Reject changes and revert to original
  const rejectChanges = useCallback(() => {
    clearEditing();
    toast.success('Changes discarded');
  }, []);
  
  // Clear the editing state
  const clearEditing = useCallback(() => {
    setCurrentText(null);
    setPreviousText(null);
    setCurrentRange(null);
    setCurrentInstruction('');
    setIsStreaming(false);
    setCurrentLineNumber(0);
  }, []);
  
  const value = {
    currentText,
    previousText,
    isStreaming,
    currentRange,
    currentLineNumber,
    currentInstruction,
    startEditing,
    clearEditing,
    setIsStreaming,
    setCurrentLineNumber
  };
  
  return (
    <EditedSectionContext.Provider value={value}>
      {children}
    </EditedSectionContext.Provider>
  );
};

export const useEditedSection = (): EditedSectionContextType => {
  const context = useContext(EditedSectionContext);
  if (context === undefined) {
    throw new Error('useEditedSection must be used within an EditedSectionProvider');
  }
  return context;
};
