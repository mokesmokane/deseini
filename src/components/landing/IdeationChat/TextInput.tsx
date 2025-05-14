import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Sparkles, ArrowRight, Loader2, X } from 'lucide-react';
import { sampleIdeas as sampleIdeasx } from '../sample';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useQuotes } from '../../../contexts/QuoteProvider';
import { enhanceProjectPrompt } from '../../../services/projectPlanService';
import { useDraftMarkdown } from '../../../contexts/DraftMarkdownProvider';
import { useActiveTab } from '../../../contexts/ActiveTabProvider';

// Get API base URL from environment or use relative path for proxy in development
// const API_BASE_URL = import.meta.env.VITE_API_SERVER || '';

interface TextInputProps {
  onSendMessage?: (message: string) => void;
  hasStarted?: boolean;
}

// Component for a single segment of the progress bar
const ProgressSegment = ({ filled }: { filled: boolean }) => (
  <div 
    className={`h-1 w-full ${filled ? 'bg-black' : 'bg-gray-200'} transition-colors duration-300`}
  />
);

// Component for the mini progress bar with 4 segments
const MiniProgressBar = ({ percentage }: { percentage: number }) => {
  // Calculate which segments should be filled
  const segments = [25, 50, 75, 100].map(threshold => percentage >= threshold);
  return (
    <div className="flex space-x-0.5 w-24 mx-auto">
      {segments.map((filled, index) => (
        <div key={index} className="flex-1">
          <ProgressSegment filled={filled} />
        </div>
      ))}
    </div>
  );
};

const TextInput: React.FC<TextInputProps> = ({ onSendMessage, hasStarted = false }) => {
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(!hasStarted);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const cancelledRef = useRef(false);
  const { setCurrentSectionId } = useDraftMarkdown();
  const { addMessage, percentageComplete, currentConversationId } = useMessaging();
  const { quotes, getQuotesByConversationId, removeQuote, clearQuotes } = useQuotes();
  const { setActiveTab } = useActiveTab();
  const randomisedorder = sampleIdeasx.sort(() => Math.random() - 0.5);
  const [sampleIdeas] = useState(["What would you build if you had the world's best Designers at your fingertips???",
    ...randomisedorder]);
  
  // Get quotes for the current conversation
  const activeQuotes = getQuotesByConversationId(currentConversationId);
  
  // Debug quotes and conversation ID
  useEffect(() => {
  }, [currentConversationId, activeQuotes, quotes]);
    

  // Typing and deleting animation
  useEffect(() => {
    // Skip animation entirely if chat has started
    if (hasStarted) {
      setIsTyping(false);
      setIsDeleting(false);
      return;
    }
    
    if (cancelledRef.current) return; // Prevent scheduling any new timeouts if cancelled
    cancelledRef.current = false; // Reset cancel flag on new animation cycle
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (isTyping) {
      const currentIdea = sampleIdeas[currentIdeaIndex];
      if (currentText.length < currentIdea.length) {
        const t = setTimeout(() => {
          if (cancelledRef.current) return;
          setCurrentText(currentIdea.substring(0, currentText.length + 1));
          // Move caret to end after text update
          setTimeout(() => {
            if (textAreaRef.current) {
              const len = currentText.length + 1;
              textAreaRef.current.setSelectionRange(len, len);
            }
          }, 0);
        }, 30);
        timeoutsRef.current.push(t);
        return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
      } else {
        const t = setTimeout(() => {
          if (cancelledRef.current) return;
          setIsTyping(false);
          setIsDeleting(true);
        }, 2000);
        timeoutsRef.current.push(t);
        return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
      }
    } else if (isDeleting) {
      if (currentText.length > 0) {
        const t = setTimeout(() => {
          if (cancelledRef.current) return;
          setCurrentText(currentText.substring(0, currentText.length - 1));
          setTimeout(() => {
            if (textAreaRef.current) {
              const len = currentText.length - 1;
              textAreaRef.current.setSelectionRange(len, len);
            }
          }, 0);
        }, 15);
        timeoutsRef.current.push(t);
        return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
      } else {
        const nextIdeaIndex = (currentIdeaIndex + 1) % sampleIdeas.length;
        setCurrentIdeaIndex(nextIdeaIndex);
        setIsDeleting(false);
        setIsTyping(true);
      }
    }
    return () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };
  }, [currentText, isTyping, isDeleting, currentIdeaIndex, hasStarted]);

  // Track click count and time for triple-click detection
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  
  const handleTextAreaClick = () => {
    // Don't handle animation if chat has started
    if (hasStarted) {
      if (textAreaRef.current) {
        textAreaRef.current.select();
      }
      return;
    }
    
    // Track clicks for triple-click detection
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) { // 500ms threshold for multi-clicks
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;
    
    // Handle triple-click to cycle through sample ideas
    if (clickCountRef.current === 3) {
      clickCountRef.current = 0; // Reset click count
      
      // Cycle to the next sample idea
      const nextIdeaIndex = (currentIdeaIndex + 1) % sampleIdeas.length;
      setCurrentIdeaIndex(nextIdeaIndex);
      
      // Cancel any ongoing animations
      cancelledRef.current = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      
      // Set the text to the next idea
      const nextIdea = sampleIdeas[nextIdeaIndex];
      setIsTyping(false);
      setIsDeleting(false);
      setCurrentText(nextIdea);
      
      // Select the text
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.select();
        }
      }, 0);
      
      return;
    }
    
    // Regular click behavior (interrupt typing/deleting)
    if (isTyping || isDeleting) {
      cancelledRef.current = true;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      const fullIdea = sampleIdeas[currentIdeaIndex];
      setIsTyping(false);
      setIsDeleting(false);
      setCurrentText(fullIdea);
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.select();
        }
      }, 0);
    } else {
      if (textAreaRef.current) {
        textAreaRef.current.select();
      }
    }
  };

  const handleSendClick = () => {
    if (currentText.trim() === '') return;

    addMessage(currentText, activeQuotes);
    clearQuotes();
    if (onSendMessage) onSendMessage(currentText);
    setCurrentText('');
  };

  const enhancePrompt = async () => {
    // Don't enhance if text is empty
    if (currentText.trim() === '') return;
    
    try {
      setIsEnhancing(true);
      
      // Keep track of original text to restore on error
      const originalText = currentText;
      let enhancedPrompt = '';
      
      // Set up the response with proper headers for SSE
      // Use the service function (assume it returns the same Response object)
      const response = await enhanceProjectPrompt({ initialPrompt: currentText });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error enhancing prompt:', errorData);
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      
      // Process the stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        
        try {
          // Convert the Uint8Array to a string
          const chunk = decoder.decode(value, { stream: true });
          
          // Process the chunk line by line (SSE format)
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            if (line.startsWith('data: ')) {
              try {
                // Extract the JSON data from the SSE data line
                const jsonStr = line.substring(6);
                const data = JSON.parse(jsonStr);
                
                if (data.chunk) {
                  enhancedPrompt += data.chunk;
                  // Update the text area with the enhanced prompt
                  setCurrentText(enhancedPrompt);
                  
                  // Scroll to the bottom and move caret to end after text update
                  setTimeout(() => {
                    if (textAreaRef.current) {
                      const textArea = textAreaRef.current;
                      const len = enhancedPrompt.length;
                      
                      // Set selection to the end
                      textArea.setSelectionRange(len, len);
                      
                      // If scrollable, ensure we're at the bottom
                      if (textArea.scrollHeight > textArea.clientHeight) {
                        textArea.scrollTop = textArea.scrollHeight;
                      }
                      
                      // Make sure the textarea has focus
                      textArea.focus();
                    }
                  }, 0);
                }
              } catch (e) {
                console.error('Error parsing data line:', e, line);
              }
            } 
            else if (line.startsWith('event: stream_end')) {
              // The next line should contain the data
            }
            else if (line.startsWith('event: stream_error')) {
              // Restore original text on error
              setCurrentText(originalText);
            }
          }
        } catch (e) {
          console.error('Error processing chunk:', e);
        }
      }
      
      // Final scroll to bottom and focus after completion
      if (textAreaRef.current) {
        const textArea = textAreaRef.current;
        // Focus the text area
        textArea.focus();
        // Scroll to the bottom
        textArea.scrollTop = textArea.scrollHeight;
        // Place cursor at the end
        const length = enhancedPrompt.length;
        textArea.setSelectionRange(length, length);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter allows multi-line input
        return;
      } else {
        // Regular Enter sends the message
        e.preventDefault();
        handleSendClick();
      }
    }
  };

  // Function to resize the textarea based on content
  const resizeTextArea = () => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    
    // Reset the height to auto to get the correct scrollHeight
    textArea.style.height = 'auto';
    
    // Use a more reliable line height calculation
    const computedStyle = window.getComputedStyle(textArea);
    const fontSize = parseInt(computedStyle.fontSize) || 18; // Default to 18px if can't get fontSize
    const lineHeight = Math.ceil(fontSize * 1.5); // Standard line height approximately 1.5x font size
    
    // Calculate the minimum height (4 lines) and maximum height (10 lines)
    // Adding padding to ensure content fits properly
    const verticalPadding = (parseInt(computedStyle.paddingTop) + parseInt(computedStyle.paddingBottom)) || 40;
    const minHeight = (lineHeight * 4) + verticalPadding; // Minimum of 4 lines plus padding
    const maxHeight = (lineHeight * 10) + verticalPadding;
    
    // Set the height based on content, but constrained between min and max
    // Add a buffer to ensure text and caret aren't clipped (20px extra)
    const contentHeight = textArea.scrollHeight + 20;
    const newHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight));
    textArea.style.height = `${newHeight}px`;
    
    // Enable scrolling if content exceeds maxHeight
    textArea.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  };

  // Handle text change and resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
    // Defer the resize to the next tick to ensure text has been updated
    setTimeout(resizeTextArea, 0);
  };

  // Resize textarea when content changes programmatically
  useEffect(() => {
    resizeTextArea();
  }, [currentText]);

  // Setup textarea initial height on mount
  useEffect(() => {
    resizeTextArea();
  }, []);

  // Only show progress bar once the conversation has started
  const showProgressBar = hasStarted;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Quote chips */}
      {activeQuotes.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {activeQuotes.map((quote) => (
            <div 
              key={quote.id}
              className="flex items-center bg-black text-white border border-black rounded-full px-3 py-1 text-sm cursor-pointer transition-colors hover:bg-neutral-900 shadow-sm"
              style={{ fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 500 }}
              title={quote.content.length > 50 ? quote.content.substring(0, 50) + '...' : quote.content}
              onClick={() => {
                setCurrentSectionId(quote.sectionId);
                setActiveTab('notes');
              }}
            >
              <span className="mr-2 flex items-center gap-1">
                <span className="text-white/70">@</span>
                <span className="font-semibold text-white/90 truncate max-w-[120px]">{quote.sectionTitle.length > 24 ? `${quote.sectionTitle.substring(0, 24)}...` : quote.sectionTitle}</span>
                <span className="text-xs text-white/60 pl-1">{quote.lineNumbers.start}-{quote.lineNumbers.end}</span>
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeQuote(quote.id);
                }}
                className="ml-1 text-white/60 hover:text-red-400 transition-colors rounded-full p-0.5"
                aria-label="Remove quote"
                tabIndex={-1}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative bg-white/80 backdrop-blur-md rounded-lg overflow-hidden shadow-xl border border-black transition-all duration-300">
        <textarea
          ref={textAreaRef}
          value={currentText}
          onChange={handleTextChange}
          onFocus={handleTextAreaClick}
          onClick={handleTextAreaClick}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-[160px] bg-transparent text-black px-6 ${showProgressBar ? 'pt-10' : 'pt-6'} pb-14 border-none outline-none resize-none text-lg placeholder-gray-400 overflow-hidden box-border`}
          style={{ 
            overflowY: 'hidden',
            lineHeight: '1.6',
            display: 'block'
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-black flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-black transition-colors">
              <Paperclip className="h-5 w-5" />
            </button>
            <button 
              className={`text-black hover:text-gray-700 transition-colors ${isEnhancing ? 'opacity-70' : ''}`}
              onClick={enhancePrompt}
              disabled={isEnhancing}
              title="Enhance your prompt with AI"
            >
              {isEnhancing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </button>
            
          </div>
          {showProgressBar && (
            <div className="absolute top-0 left-0 right-0 pt-1 px-6">
              <MiniProgressBar percentage={percentageComplete} />
            </div>
          )}
          <button 
            onClick={handleSendClick}
            className="flex items-center justify-center bg-black hover:bg-gray-900 text-white p-2 rounded-md transition-colors border border-black"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInput;