import React, { useRef, useEffect } from 'react';
import { SuggestedReplies } from './dialogs/SuggestedReplies';
import ReactMarkdown from 'react-markdown';
import { useMessages } from '../contexts/MessagesContext';

interface ChartCreationChatProps {
  onCancel: () => void;
  className?: string;
}

export function ChartCreationChat({
  onCancel,
  className = ''
}: ChartCreationChatProps): JSX.Element {
  const {
    messages,
    loading,
    error,
    suggestedReplies,
    loadingSuggestions,
    isGeneratingTasks,
    input,
    setInput,
    isInitialized,
    initializeChat,
    handleSendMessage,
    handleSelectSuggestion,
    handleEditSuggestion,
    handleRefreshSuggestions,
    handleGenerateTasksClick
  } = useMessages();

  // Initialize chat when the component is mounted if not already initialized
  useEffect(() => {
    if (!isInitialized) {
      initializeChat();
    }
  }, [isInitialized, initializeChat]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex flex-col h-full border border-gray-200 rounded-md shadow-sm bg-white ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 flex-shrink-0">
          <h4 className="font-medium text-sm">Create Chart via Chat</h4>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cancel chart creation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages Area */}
         <div className="flex-grow overflow-y-auto p-3 space-y-3">
           {messages.map((msg) => {
             const isConfirmMessage = msg.role === 'assistant' && msg.content.includes('[CONFIRM_TASK_GENERATION]');
             let contentBeforeConfirm = '';
             let contentAfterConfirm = '';
             if (isConfirmMessage) {
               const parts = msg.content.split('[CONFIRM_TASK_GENERATION]');
               contentBeforeConfirm = parts[0];
               contentAfterConfirm = parts[1] || '';
             }

             return (
               <div
                 key={msg.id || `fallback-${msg.role}-${msg.content.slice(0,10)}`}
                 className={`p-2.5 rounded-lg w-fit max-w-[85%] ${
                   msg.role === 'user'
                     ? 'bg-neutral-100 ml-auto'
                     : 'bg-gray-100 mr-auto'
                 } ${msg.content === '' && msg.role === 'assistant' ? 'min-h-[32px] flex items-center' : ''}`}
                 style={{ wordWrap: 'break-word' }}
               >
                 {msg.role === 'assistant' ? (
                     msg.content === '' && loading ? (
                         <div className="flex space-x-1 items-center px-1.5">
                           <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="h-1 w-1 bg-gray-500 rounded-full animate-bounce"></div>
                         </div>
                     ) : isConfirmMessage ? (
                       <div className="prose prose-sm max-w-none text-xs space-y-2">
                         <ReactMarkdown>{contentBeforeConfirm}</ReactMarkdown>
                         <div className="flex space-x-2 my-1">
                           <button
                             type="button"
                             onClick={handleGenerateTasksClick}
                             className="bg-blue-600 text-white px-3 py-1.5 rounded-md disabled:bg-blue-400 hover:bg-blue-700 transition-colors text-xs font-medium inline-block"
                             disabled={loading || isGeneratingTasks}
                             aria-label="Generate tasks"
                           >
                             Generate Tasks
                           </button>
                           <button
                             type="button"
                             onClick={() => handleSendMessage(null, "Continue questioning me")}
                             className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md disabled:bg-gray-300 hover:bg-gray-300 transition-colors text-xs font-medium inline-block"
                             disabled={loading || isGeneratingTasks}
                             aria-label="Continue questioning"
                           >
                             Continue questioning me
                           </button>
                         </div>
                         <ReactMarkdown>{contentAfterConfirm}</ReactMarkdown>
                       </div>
                     ) : (
                       <div className="prose prose-sm max-w-none text-xs">
                         <ReactMarkdown>
                           {msg.content || (msg.content === '' && !loading ? '...' : '')}
                         </ReactMarkdown>
                       </div>
                     )
                 ) : (
                    <span className="text-xs">{msg.content}</span>
                 )}
               </div>
             );
           })}
           {error && !loading && (
            <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-auto w-fit max-w-[85%] text-xs">
              Error: {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Replies */}
        <SuggestedReplies
            suggestions={suggestedReplies}
            onSelectSuggestion={handleSelectSuggestion}
            onRefreshSuggestions={handleRefreshSuggestions}
            onEditSuggestion={handleEditSuggestion}
            isLoading={loadingSuggestions}
         />


        {/* Input Form */}
         <form onSubmit={(e) => handleSendMessage(e, undefined)} className="relative flex-shrink-0 border-t border-gray-200 p-3">
           <input
             ref={inputRef}
             type="text"
             value={input}
             onChange={(e) => {
               setInput(e.target.value);
               if (e.target.value.length > 0 && suggestedReplies.length > 0) {
                 // This is handled in the provider now
               }
             }}
             placeholder={"Your message..."}
             className="w-full p-2 pr-[75px] text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-neutral-500"
             disabled={loading || isGeneratingTasks}
             aria-label="Chat input"
             onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any, undefined); }}}
           />
           <button
             type="submit"
             className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-neutral-700 text-white px-3 py-1 rounded-md disabled:bg-neutral-400 hover:bg-neutral-800 transition-colors text-xs font-medium"
             disabled={loading || isGeneratingTasks || !input.trim()}
             aria-label="Send message"
           >
             Send
           </button>
         </form>
    </div>
  );
}