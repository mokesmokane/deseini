import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type BlockState = Record<string, Record<string, ReadableStream<string> | undefined>>;

interface MessageBlocksContextValue {
  state: BlockState;
  updateBlock: (blockType: string, id: string, value: ReadableStream<string>) => void;
  clearBlocks: (id: string) => void;
}

const MessageBlocksContext = createContext<MessageBlocksContextValue | undefined>(undefined);

export const MessageBlocksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BlockState>({});
  const clearBlocks = useCallback((id: string) => {
    setState(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);
  const updateBlock = useCallback((blockType: string, id: string, value: ReadableStream<string>) => {
    try {
    const lowercaseBlockType = blockType.toLowerCase();
    const [teedStream] = value.tee();
    setState(prev => ({
      ...prev,
      [lowercaseBlockType]: {
        ...(prev[lowercaseBlockType] || {}),
        [id]: teedStream,
      },
    }));
  } catch (error) {
    console.error('Error updating block:', error);
  }
}, []);

  return (
    <MessageBlocksContext.Provider value={{ state, updateBlock, clearBlocks }}>
      {children}
    </MessageBlocksContext.Provider>
  );
};

export const useBlock = (blockType: string, id: string): ReadableStream<string> | undefined => {
  const lowercaseBlockType = blockType.toLowerCase();
  const context = useContext(MessageBlocksContext);
  if (!context) {
    throw new Error('useBlock must be used within a MessageBlocksProvider');
  }
  return context.state[lowercaseBlockType]?.[id];
};

export const useUpdateBlock = (): {updateBlock: (blockType: string, id: string, value: ReadableStream<string>) => void, clearBlocks: (id: string) => void} => {
  const context = useContext(MessageBlocksContext);
  if (!context) {
    throw new Error('useUpdateBlock must be used within a MessageBlocksProvider');
  }
  return {
    updateBlock: context.updateBlock,
    clearBlocks: context.clearBlocks,
  }
};
