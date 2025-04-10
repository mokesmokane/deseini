import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownBaseProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  lineNumber: number;
  children: React.ReactNode;
}

export const DropdownBase: React.FC<DropdownBaseProps> = ({
  isOpen,
  onClose,
  lineNumber,
  buttonRef,
  children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const initialPositionRef = useRef<{top: number, left: number} | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  // Function to reset the auto-close timer
  const resetCloseTimer = useCallback(() => {
    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    
    if (isUserInteracting) return;
    
    // Set a new timeout
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 1000); // 1 second debounce
  }, [onClose, isUserInteracting]);
  
  useEffect(() => {
    // Initial position setting
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = { 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX - 150 + rect.width / 2 // Center the dropdown
      };
      
      // Only set initial position once when opening
      if (!initialPositionRef.current) {
        initialPositionRef.current = newPosition;
      }
      
      // Always use the stored initial position
      setPosition(initialPositionRef.current);
      
      setHasInitialized(true);
      resetCloseTimer();
    }
    
    // For line 0, use a simpler approach without relying on click handlers
    if (!isOpen || !hasInitialized) {
      return () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
      };
    }
    
    // Setup click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          !(buttonRef.current && buttonRef.current.contains(event.target as Node))) {
        onClose();
      }
    };
    
    // Add with a delay to prevent immediate triggering
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 300);
    
    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
      
      // Clear the auto-close timer when component unmounts
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      
      // Reset initial position when closed
      if (!isOpen) {
        initialPositionRef.current = null;
      }
    };
  }, [isOpen, onClose, buttonRef, hasInitialized, resetCloseTimer]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      ref={menuRef}
      className="dropdown-menu"
      role="menu"
      aria-orientation="vertical"
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000
      }}
      onMouseEnter={() => {
        setIsUserInteracting(true);
        clearTimeout(closeTimeoutRef.current || undefined);
      }}
      onMouseLeave={() => {
        // Don't close immediately to allow for interaction with elements inside
        // Instead, start a short timer to determine if user is still interacting
        setTimeout(() => {
          if (!menuRef.current?.contains(document.activeElement)) {
            setIsUserInteracting(false);
            onClose();
          }
        }, 50);
      }}
      onMouseMove={() => resetCloseTimer()}
      onKeyDown={() => resetCloseTimer()}
      // Stop propagation to prevent click outside handler from firing
      onClick={(e) => e.stopPropagation()}
    >
      <div className="dropdown-content">
        {children}
      </div>
    </div>,
    document.body
  );
};
