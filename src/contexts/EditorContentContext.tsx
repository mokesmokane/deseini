import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useMemo
  } from 'react';
  import { sampleIdeas as importSampleIdeas } from '@/components/landing/sample';
  import { fetchApi } from '@/utils/api';
  
  const API_BASE_URL = import.meta.env.VITE_API_SERVER || '';
  
  export interface EditorSelection {
    start: number;
    end: number;
    direction?: 'forward' | 'backward' | 'none';
  }
  
  interface EditorContentContextType {
    content: string;
    setContent: (htmlContent: string, isUserInput?: boolean) => void;
    clearContent: () => void;
    getTextContent: () => string;
  
    isPlaceholderEffectivelyActive: boolean;
    currentPlaceholderVisualText: string;
    stopPlaceholderCycle: () => void;
    triggerNextSampleIdea: () => void;
    notifyChatStatus: (hasStarted: boolean) => void;
  
    isEnhancing: boolean;
    enhanceCurrentPrompt: () => Promise<void>;
  
    editorSelection: EditorSelection | null;
    updateEditorSelection: (selection: EditorSelection | null) => void;
    insertChip: (quoteContent: string, quoteId?: string) => void;
  }
  
  const EditorContentContext = createContext<EditorContentContextType | undefined>(undefined);
  
  const getDefaultSampleIdeas = () => {
    const randomisedOrder = [...importSampleIdeas].sort(() => Math.random() - 0.5);
    return [
      "What would you build if you had the world's best Designers at your fingertips???",
      ...randomisedOrder
    ];
  };
  
  export const EditorContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [content, setContentState] = useState<string>('');
    const [chatHasStarted, setChatHasStartedState] = useState<boolean>(false);
    const [editorSelection, setEditorSelectionState] = useState<EditorSelection | null>(null);
  
    const sampleIdeas = useMemo(() => getDefaultSampleIdeas(), []);
    const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [animatedText, setAnimatedText] = useState('');
    const animationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
    const animationManuallyStoppedRef = useRef<boolean>(false);
  
    const setContent = useCallback((htmlContent: string, isUserInput: boolean = false) => {
      setContentState(htmlContent);
      if (isUserInput && htmlContent !== '') {
        animationManuallyStoppedRef.current = true;
        animationTimeoutsRef.current.forEach(clearTimeout);
        animationTimeoutsRef.current = [];
        setIsTyping(false);
        setIsDeleting(false);
      } else if (isUserInput && htmlContent === '') {
        animationManuallyStoppedRef.current = false;
      }
    }, []);
  
    const clearContent = useCallback(() => {
      setContent('', false); // Call setContent, not directly setContentState
      animationManuallyStoppedRef.current = false;
    }, [setContent]);
  
    useEffect(() => {
      const canAnimate = !animationManuallyStoppedRef.current && !chatHasStarted;
  
      if (!canAnimate) {
        if (isTyping || isDeleting) {
          animationTimeoutsRef.current.forEach(clearTimeout);
          animationTimeoutsRef.current = [];
          setIsTyping(false);
          setIsDeleting(false);
        }
        return;
      }
  
      if (content === '' && !isTyping && !isDeleting) {
        setIsTyping(true);
        setAnimatedText('');
        // currentIdeaIndex is already set, or will be set by triggerNextSampleIdea if needed
        return;
      }
      
      if (content !== animatedText && (isTyping || isDeleting)) {
          animationManuallyStoppedRef.current = true;
          animationTimeoutsRef.current.forEach(clearTimeout);
          animationTimeoutsRef.current = [];
          setIsTyping(false);
          setIsDeleting(false);
          return;
      }
  
      const currentIdeaFullText = sampleIdeas[currentIdeaIndex];
  
      if (isTyping) {
        if (animatedText.length < currentIdeaFullText.length) {
          const t = setTimeout(() => {
            if (animationManuallyStoppedRef.current || chatHasStarted) return;
            const newText = currentIdeaFullText.substring(0, animatedText.length + 1);
            setAnimatedText(newText);
            setContentState(newText); 
          }, 30);
          animationTimeoutsRef.current.push(t);
        } else {
          const t = setTimeout(() => {
            if (animationManuallyStoppedRef.current || chatHasStarted) return;
            setIsTyping(false);
            setIsDeleting(true);
          }, 2000);
          animationTimeoutsRef.current.push(t);
        }
      } else if (isDeleting) {
        if (animatedText.length > 0) {
          const t = setTimeout(() => {
            if (animationManuallyStoppedRef.current || chatHasStarted) return;
            const newText = animatedText.substring(0, animatedText.length - 1);
            setAnimatedText(newText);
            setContentState(newText);
          }, 15);
          animationTimeoutsRef.current.push(t);
        } else {
           const nextIdeaIndex = (currentIdeaIndex + 1) % sampleIdeas.length;
           setCurrentIdeaIndex(nextIdeaIndex);
           setAnimatedText(''); 
           setContentState(''); // This triggers the (content === '' && !isTyping && !isDeleting) block
        }
      }
  
      return () => {
        animationTimeoutsRef.current.forEach(clearTimeout);
        animationTimeoutsRef.current = [];
      };
    }, [chatHasStarted, content, isTyping, isDeleting, animatedText, currentIdeaIndex, sampleIdeas]);
  
    const getTextContent = useCallback((): string => {
      if (typeof window === 'undefined') return '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      let text = '';
      tempDiv.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.classList.contains('chip')) {
            text += element.innerText || '';
          } else {
            text += element.textContent || '';
          }
        }
      });
      return text.trim();
    }, [content]);
  
    const stopPlaceholderCycle = useCallback(() => {
      animationManuallyStoppedRef.current = true;
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
      setIsTyping(false);
      setIsDeleting(false);
    }, []);
  
    const triggerNextSampleIdea = useCallback(() => {
      animationManuallyStoppedRef.current = true;
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
      setIsTyping(false);
      setIsDeleting(false);
  
      const nextIdeaIndex = (currentIdeaIndex + 1) % sampleIdeas.length;
      setCurrentIdeaIndex(nextIdeaIndex);
      const newContent = sampleIdeas[nextIdeaIndex];
      setContentState(newContent);
      setAnimatedText(newContent); 
      animationManuallyStoppedRef.current = false; 
    }, [currentIdeaIndex, sampleIdeas]);
  
    const notifyChatStatus = useCallback((hasStarted: boolean) => {
      setChatHasStartedState(hasStarted);
      if (hasStarted) {
        animationManuallyStoppedRef.current = true;
        animationTimeoutsRef.current.forEach(clearTimeout);
        animationTimeoutsRef.current = [];
        setIsTyping(false);
        setIsDeleting(false);
      } else {
        animationManuallyStoppedRef.current = false;
      }
    }, []);
  
    const isPlaceholderEffectivelyActive = useMemo(() => {
      return !chatHasStarted && (!animationManuallyStoppedRef.current && (isTyping || isDeleting || content === ''));
    }, [chatHasStarted, isTyping, isDeleting, content]);
    
    const currentPlaceholderVisualText = useMemo(() => {
      if (!chatHasStarted && !animationManuallyStoppedRef.current) {
        if (isTyping || isDeleting) return animatedText;
        if (content === '') return sampleIdeas[currentIdeaIndex];
      }
      return content; // If content is a sample idea (e.g. after trigger), show it
    }, [chatHasStarted, animatedText, content, currentIdeaIndex, sampleIdeas, isTyping, isDeleting]);
  
    const [isEnhancing, setIsEnhancingState] = useState<boolean>(false);
  
    const enhanceCurrentPrompt = useCallback(async () => {
      const initialPromptHtml = content;
      const plainTextPrompt = getTextContent();
      if (plainTextPrompt === '') return;
  
      stopPlaceholderCycle();
      setIsEnhancingState(true);
      setContentState('Enhancing...'); // Initial feedback
  
      try {
        const response = await fetchApi(`${API_BASE_URL}/api/enhance-project-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialPrompt: plainTextPrompt }),
        });
  
        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to enhance prompt and parse error.' }));
          throw new Error(errorData.error || 'Failed to enhance prompt');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamedText = '';
        setContentState(""); // Clear "Enhancing..." for streamed content
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
  
          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            try {
              const jsonStr = line.substring(6);
              const data = JSON.parse(jsonStr);
              if (data.chunk) {
                streamedText += data.chunk;
                setContentState(streamedText); 
              }
            } catch (e) { console.error('Error parsing stream data:', e, line); }
          }
        }
      } catch (error) {
        console.error('Error enhancing prompt:', error);
        setContentState(initialPromptHtml);
      } finally {
        setIsEnhancingState(false);
      }
    }, [content, getTextContent, stopPlaceholderCycle]);
  
    const updateEditorSelection = useCallback((selection: EditorSelection | null) => {
      setEditorSelectionState(selection);
    }, []);
  
    const insertChip = useCallback((quoteContent: string, quoteId: string = 'unknown_id') => {
      stopPlaceholderCycle();
  
      const chipText = `@${quoteContent.substring(0, 20)}${quoteContent.length > 20 ? '...' : ''}`;
      // IMPORTANT: Ensure no empty text nodes are created around the chip by mistake.
      // The nonBreakingSpace span is contenteditable=false to help with caret.
      const chipHtml = `<span class="chip" data-quote-id="${quoteId}" contenteditable="false">${chipText}</span><span contenteditable="false">&nbsp;</span>`;
  
      setContentState(prevContent => {
        const currentSelection = editorSelection;
        let newContent = prevContent;
        let newCursorPos = prevContent.length + chipHtml.length; // Default to end
  
        if (currentSelection && typeof currentSelection.start === 'number' && typeof currentSelection.end === 'number' && currentSelection.start <= prevContent.length && currentSelection.end <= prevContent.length) {
          const before = prevContent.substring(0, currentSelection.start);
          const after = prevContent.substring(currentSelection.end);
          newContent = before + chipHtml + after;
          newCursorPos = currentSelection.start + chipHtml.length;
        } else {
          newContent = prevContent + chipHtml; // Fallback: append
        }
        
        // Update selection to be after the inserted chip and space
        setEditorSelectionState({ start: newCursorPos, end: newCursorPos });
        return newContent;
      });
    }, [editorSelection, stopPlaceholderCycle]);
  
    return (
      <EditorContentContext.Provider value={{
        content, setContent, clearContent, getTextContent,
        isPlaceholderEffectivelyActive, currentPlaceholderVisualText, stopPlaceholderCycle,
        triggerNextSampleIdea, notifyChatStatus,
        isEnhancing, enhanceCurrentPrompt,
        editorSelection, updateEditorSelection, insertChip
      }}>
        {children}
      </EditorContentContext.Provider>
    );
  };
  
  export const useEditorContent = (): EditorContentContextType => {
    const context = useContext(EditorContentContext);
    if (context === undefined) {
      throw new Error('useEditorContent must be used within an EditorContentProvider');
    }
    return context;
  };