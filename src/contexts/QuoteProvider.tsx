import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Quote {
  id: string;
  content: string;
  lineNumbers: { start: number; end: number };
  sectionTitle: string;
  conversationId: string | null;
}

interface QuoteContextProps {
  quotes: Quote[];
  addQuote: (content: string, lineNumbers: { start: number; end: number }, sectionTitle: string) => void;
  removeQuote: (id: string) => void;
  getQuotesByConversationId: (conversationId: string | null) => Quote[];
  clearQuotes: (conversationId?: string | null) => void;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
}

const QuoteContext = createContext<QuoteContextProps | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const addQuote = (
    content: string, 
    lineNumbers: { start: number; end: number }, 
    sectionTitle: string
  ) => {
    
    const newQuote: Quote = {
      id: uuidv4(),
      content,
      lineNumbers,
      sectionTitle,
      conversationId: currentConversationId
    };
    
    setQuotes(prevQuotes => [...prevQuotes, newQuote]);
    return newQuote.id;
  };

  const removeQuote = (id: string) => {
    setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== id));
  };

  const getQuotesByConversationId = (conversationId: string | null) => {
    const matchingQuotes = quotes.filter(quote => quote.conversationId === conversationId);
    return matchingQuotes;
  };

  const clearQuotes = (conversationId?: string | null) => {
    if (conversationId) {
      setQuotes(prevQuotes => prevQuotes.filter(quote => quote.conversationId !== conversationId));
    } else {
      setQuotes([]);
    }
  };

  return (
    <QuoteContext.Provider value={{ 
      quotes, 
      addQuote, 
      removeQuote, 
      getQuotesByConversationId, 
      clearQuotes,
      currentConversationId,
      setCurrentConversationId
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
