import React, { useRef, useState } from 'react';
import { SuggestedReplies } from './dialogs/SuggestedReplies';
import ReactMarkdown from 'react-markdown';
import { useMessages } from '../contexts/MessagesContext';

interface ChartCreationChatProps {
  onCancel: () => void;
  className?: string;
}

// Sample avatar data - can be replaced with actual user data
const userAvatar = "https://i.pravatar.cc/300?img=5";
const assistantAvatar = "https://i.pravatar.cc/300?img=3";

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
    handleSendMessage,
    handleSelectSuggestion,
    handleEditSuggestion,
    handleRefreshSuggestions,
    handleGenerateTasksClick
  } = useMessages();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Format current time as HH:MM
  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex flex-col h-full rounded-lg shadow-lg bg-white ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
          </div>
          <button 
            onClick={onCancel}
            aria-label="Close chat"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1">
          {/* Chat Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isConfirmMessage = msg.role === 'assistant' && msg.content.includes('[CONFIRM_TASK_GENERATION]');
              let contentBeforeConfirm = '';
              let contentAfterConfirm = '';
              if (isConfirmMessage) {
                const parts = msg.content.split('[CONFIRM_TASK_GENERATION]');
                contentBeforeConfirm = parts[0];
                contentAfterConfirm = parts[1] || '';
              }
              
              // Generate timestamp for each message
              const msgTime = formatTime();

              return (
                <div
                  key={msg.id || `fallback-${msg.role}-${index}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-2">
                      <img src={assistantAvatar} alt="Assistant" className="w-8 h-8 rounded-full" />
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <div
                      className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-800'
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
                          <div className="prose prose-sm max-w-none text-xs space-y-2 text-gray-800">
                            <ReactMarkdown>{contentBeforeConfirm}</ReactMarkdown>
                            <div className="flex space-x-2 my-1">
                              <button
                                type="button"
                                onClick={handleGenerateTasksClick}
                                className="bg-black text-white px-3 py-1.5 rounded-md disabled:bg-opacity-70 hover:bg-opacity-90 transition-colors text-xs font-medium inline-block"
                                disabled={loading || isGeneratingTasks}
                                aria-label="Generate tasks"
                              >
                                Generate Tasks
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendMessage(null, "Continue questioning me")}
                                className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md disabled:bg-opacity-70 hover:bg-opacity-90 transition-colors text-xs font-medium inline-block"
                                disabled={loading || isGeneratingTasks}
                                aria-label="Continue questioning"
                              >
                                Continue questioning me
                              </button>
                            </div>
                            <ReactMarkdown>{contentAfterConfirm}</ReactMarkdown>
                            <div className="text-right text-xs text-gray-500 mt-2">{msgTime}</div>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-xs text-gray-800">
                            <ReactMarkdown>
                              {msg.content || (msg.content === '' && !loading ? '...' : '')}
                            </ReactMarkdown>
                            <div className="text-right text-xs text-gray-500 mt-2">{msgTime}</div>
                          </div>
                        )
                      ) : (
                        <div>
                          <span className="text-xs">{msg.content}</span>
                          <div className="text-right text-xs text-gray-400 mt-2">{msgTime}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 ml-2">
                      <img src={userAvatar} alt="User" className="w-8 h-8 rounded-full" />
                    </div>
                  )}
                </div>
              );
            })}
            
            {error && !loading && (
              <div className="p-2 bg-red-400 text-white rounded-lg mr-auto w-fit max-w-[85%] text-xs">
                Error: {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Replies with updated styling */}
          <div className="px-4">
            <SuggestedReplies
              suggestions={suggestedReplies}
              onSelectSuggestion={handleSelectSuggestion}
              onRefreshSuggestions={handleRefreshSuggestions}
              onEditSuggestion={handleEditSuggestion}
              isLoading={loadingSuggestions}
            />
          </div>

          {/* Input Form */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <form onSubmit={(e) => handleSendMessage(e, undefined)} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute left-3 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message"
                className="w-full bg-gray-100 border-gray-200 rounded-full text-gray-800 pl-12 pr-14 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                disabled={loading || isGeneratingTasks}
                aria-label="Chat input"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any, undefined); }}}
              />
              <button
                type="button"
                className="absolute right-14 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <button
                type="submit"
                className="absolute right-3 text-white bg-black rounded-full p-2 disabled:opacity-50 hover:bg-gray-800"
                disabled={loading || isGeneratingTasks || !input.trim()}
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}