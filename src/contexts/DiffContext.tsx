import React, { createContext, useContext, useState } from 'react';

interface DiffContextType {
  currentText: string;
  setCurrentText: (text: string) => void;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  currentLineNumber: number;
  setCurrentLineNumber: (lineNumber: number) => void;
}

const DiffContext = createContext<DiffContextType | undefined>(undefined);

export const useDiffContext = () => {
  const context = useContext(DiffContext);
  if (!context) {
    throw new Error('useDiffContext must be used within a DiffProvider');
  }
  return context;
};

export const DiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentText, setCurrentText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLineNumber, setCurrentLineNumber] = useState(0);

  return (
    <DiffContext.Provider value={{
      currentText,
      setCurrentText,
      isStreaming,
      setIsStreaming,
      currentLineNumber,
      setCurrentLineNumber,
    }}>
      {children}
    </DiffContext.Provider>
  );
};