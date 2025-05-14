// import React, { createContext, useContext, useState, ReactNode } from 'react';

// export interface Quote {
//   id: string;
//   content: string;
//   lineNumbers: { start: number; end: number };
//   sectionTitle: string;
//   conversationId: string | null;
// }

// interface QuoteContextProps {
//   quotes: Quote[];
//   addQuote: (quote: Quote) => void;
//   removeQuote: (id: string) => void;
//   getQuotesByConversationId: (conversationId: string | null) => Quote[];
//   clearQuotes: (conversationId?: string | null) => void;
// }

// const QuoteContext = createContext<QuoteContextProps | undefined>(undefined);

// export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [quotes, setQuotes] = useState<Quote[]>([]);

//   const addQuote = (quote: Quote) => {
//     setQuotes(prevQuotes => [...prevQuotes, quote]);
//   };

//   const removeQuote = (id: string) => {
//     setQuotes(prevQuotes => prevQuotes.filter(quote => quote.id !== id));
//   };

//   const getQuotesByConversationId = (conversationId: string | null) => {
//     return quotes.filter(quote => quote.conversationId === conversationId);
//   };

//   const clearQuotes = (conversationId?: string | null) => {
//     if (conversationId) {
//       setQuotes(prevQuotes => prevQuotes.filter(quote => quote.conversationId !== conversationId));
//     } else {
//       setQuotes([]);
//     }
//   };

//   return (
//     <QuoteContext.Provider value={{ quotes, addQuote, removeQuote, getQuotesByConversationId, clearQuotes }}>
//       {children}
//     </QuoteContext.Provider>
//   );
// };

// export const useQuotes = () => {
//   const context = useContext(QuoteContext);
//   if (context === undefined) {
//     throw new Error('useQuotes must be used within a QuoteProvider');
//   }
//   return context;
// };
