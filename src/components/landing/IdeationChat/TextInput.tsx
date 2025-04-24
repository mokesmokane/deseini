import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Sparkles, ArrowRight } from 'lucide-react';
import { sampleIdeas } from '../sampleIdeas';

interface TextInputProps {
  onSendMessage: (message: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onSendMessage }) => {
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const cancelledRef = useRef(false);

  // Typing and deleting animation
  useEffect(() => {
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
  }, [currentText, isTyping, isDeleting, currentIdeaIndex]);

  const handleTextAreaClick = () => {
    // Interrupt typing/deleting and clear any pending timeouts
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
    onSendMessage(currentText);
    
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative bg-white rounded-lg overflow-hidden shadow-xl border border-black">
        <textarea
          ref={textAreaRef}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onClick={handleTextAreaClick}
          className="w-full h-40 bg-white text-black p-4 pr-12 border-none outline-none resize-none text-lg placeholder-gray-400"
          // placeholder="Enter your design idea..."
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-black flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button className="text-gray-500 hover:text-black transition-colors">
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="text-black hover:text-gray-700 transition-colors">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
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