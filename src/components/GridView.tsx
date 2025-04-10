import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createPortal } from 'react-dom';
import { 
  ChatBubbleLeftIcon, 
  SparklesIcon, 
  LockClosedIcon, 
  LockOpenIcon, 
  EllipsisVerticalIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import { useMessages } from '../contexts/MessagesContext';
import '../components/markdown/MarkdownViewer.css';

interface GridViewProps {
  content: string;
  onShowChat?: () => void; // Add optional callback for showing chat
}

interface Section {
  title: string;
  content: string;
  level: number; // 1 for h1, 2 for h2, etc.
  sectionId?: string; // Optional sectionId for locking
}

// Main section dropdown menu with submenus
const SectionDropdownMenu = ({ 
  isOpen, 
  onClose,
  sectionIndex,
  buttonRef,
  onOptionSelect,
  onChatOptionSelect,
  isLocked
}: { 
  isOpen: boolean; 
  onClose: () => void;
  sectionIndex: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onOptionSelect: (option: string, sectionIndex: number, customInstruction?: string) => void;
  onChatOptionSelect: (option: string, sectionIndex: number, customMessage?: string) => void;
  isLocked: boolean;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const initialPositionRef = useRef<{top: number, left: number} | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      setActiveSubmenu(null);
      onClose();
    }, 1000); // 1 second debounce
  }, [onClose, isUserInteracting]);
  
  useEffect(() => {
    // Initial position setting
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      const requiredWidth = 200; // Width of the dropdown menu
      
      // Determine position that ensures menu is fully visible
      let leftPosition = rect.left + window.scrollX;
      
      // Check if menu would go off the right edge of the screen
      if (leftPosition + requiredWidth > window.innerWidth) {
        leftPosition = window.innerWidth - requiredWidth - 10; // 10px margin
      }
      
      // Check if menu would go off the left edge of the screen
      if (leftPosition < 10) {
        leftPosition = 10; // 10px margin
      }
      
      const newPosition = { 
        top: rect.bottom + window.scrollY + 5, // 5px below the button 
        left: leftPosition
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
        setActiveSubmenu(null);
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
        setActiveSubmenu(null);
      }
    };
  }, [isOpen, onClose, buttonRef, hasInitialized, resetCloseTimer]);
  
  if (!isOpen) return null;
  
  const handleInstructionSubmit = () => {
    if (customInstruction.trim() && !isLoading) {
      setIsLoading(true);
      onOptionSelect('custom', sectionIndex, customInstruction);
      setActiveSubmenu(null);
      onClose();
    }
  };

  const handleMessageSubmit = () => {
    if (customMessage.trim() && !isLoading) {
      setIsLoading(true);
      onChatOptionSelect('custom', sectionIndex, customMessage);
      setActiveSubmenu(null);
      onClose();
    }
  };
  
  // Menu options
  const menuOptions = [
    { 
      id: 'edit',
      label: 'Edit with AI', 
      icon: <SparklesIcon className="h-4 w-4 mr-2" />,
      hasSubmenu: true,
      disabled: isLocked,
      submenuOptions: [
        { 
          label: 'Break Down', 
          action: () => {
            if (!isLoading) {
              onOptionSelect('break-down', sectionIndex);
              setActiveSubmenu(null);
              onClose();
            }
          }
        },
        { 
          label: 'More Detail', 
          action: () => {
            if (!isLoading) {
              onOptionSelect('more-detail', sectionIndex);
              setActiveSubmenu(null);
              onClose();
            }
          }
        },
        { 
          label: 'Consolidate', 
          action: () => {
            if (!isLoading) {
              onOptionSelect('consolidate', sectionIndex);
              setActiveSubmenu(null);
              onClose();
            }
          }
        }
      ],
      customInput: {
        placeholder: "Type custom instructions...",
        value: customInstruction,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setIsUserInteracting(true);
          resetCloseTimer();
          setCustomInstruction(e.target.value);
        },
        onSubmit: handleInstructionSubmit,
        submitText: "Apply"
      }
    },
    { 
      id: 'chat',
      label: 'Send to Chat', 
      icon: <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />,
      hasSubmenu: true,
      disabled: false,
      submenuOptions: [
        { 
          label: 'This needs work', 
          action: () => {
            if (!isLoading) {
              onChatOptionSelect('needs-work', sectionIndex);
              setActiveSubmenu(null);
              onClose();
            }
          }
        },
        { 
          label: 'Evaluate this section', 
          action: () => {
            if (!isLoading) {
              onChatOptionSelect('evaluate', sectionIndex);
              setActiveSubmenu(null);
              onClose();
            }
          }
        }
      ],
      customInput: {
        placeholder: "Type custom message...",
        value: customMessage,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setIsUserInteracting(true);
          resetCloseTimer();
          setCustomMessage(e.target.value);
        },
        onSubmit: handleMessageSubmit,
        submitText: "Send"
      }
    }
  ];
  
  return createPortal(
    <div 
      ref={menuRef}
      className="section-dropdown-menu"
      role="menu"
      aria-orientation="vertical"
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        width: '240px'
      }}
      onMouseEnter={() => {
        setIsUserInteracting(true);
        clearTimeout(closeTimeoutRef.current || undefined);
      }}
      onMouseLeave={() => {
        setTimeout(() => {
          if (!menuRef.current?.contains(document.activeElement)) {
            setIsUserInteracting(false);
            onClose();
          }
        }, 150);
      }}
      onMouseMove={() => resetCloseTimer()}
      onKeyDown={() => resetCloseTimer()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="menu-wrapper">
        {menuOptions.map((option) => (
          <div key={option.id} className="menu-item-wrapper">
            <button 
              className={`menu-item ${option.disabled ? 'disabled' : ''}`}
              role="menuitem"
              onClick={() => {
                resetCloseTimer();
                if (option.hasSubmenu && !option.disabled) {
                  setActiveSubmenu(prevSubmenu => prevSubmenu === option.id ? null : option.id);
                }
                // The 'action' property check has been removed as no menu items have this property anymore
              }}
              disabled={option.disabled}
              onMouseEnter={() => setIsUserInteracting(true)}
              onFocus={() => setIsUserInteracting(true)}
            >
              <span className="menu-item-content">
                {option.icon}
                <span>{isLoading ? 'Processing...' : option.label}</span>
              </span>
              {option.hasSubmenu && (
                <ChevronDownIcon className={`chevron-icon ${activeSubmenu === option.id ? 'open' : ''}`} />
              )}
            </button>
            
            {/* Submenu displayed directly below the parent menu item */}
            {option.hasSubmenu && activeSubmenu === option.id && (
              <div className="submenu">
                {option.submenuOptions?.map((subOption, idx) => (
                  <button
                    key={idx}
                    className="submenu-item"
                    onClick={() => {
                      resetCloseTimer();
                      subOption.action();
                    }}
                    disabled={isLoading}
                    onMouseEnter={() => setIsUserInteracting(true)}
                    onFocus={() => setIsUserInteracting(true)}
                  >
                    {isLoading ? 'Processing...' : subOption.label}
                  </button>
                ))}
                
                {option.customInput && (
                  <div className="custom-input-container">
                    <textarea
                      className="custom-input-textarea"
                      placeholder={option.customInput.placeholder}
                      value={option.customInput.value}
                      onChange={option.customInput.onChange}
                      onFocus={() => setIsUserInteracting(true)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsUserInteracting(true);
                      }}
                      disabled={isLoading}
                    />
                    <button
                      className="custom-input-submit"
                      onClick={() => {
                        resetCloseTimer();
                        option.customInput?.onSubmit();
                      }}
                      disabled={
                        !option.customInput.value.trim() || isLoading
                      }
                      onMouseEnter={() => setIsUserInteracting(true)}
                      onFocus={() => setIsUserInteracting(true)}
                    >
                      {isLoading ? 'Processing...' : option.customInput.submitText}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

const GridView: React.FC<GridViewProps> = ({ content, onShowChat }) => {
  const { editMarkdownSection, isLineLocked, toggleLock } = useProjectPlan();
  const { handleSendMessage } = useMessages();
  const [openMenuSection, setOpenMenuSection] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const menuButtonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());

  // Clean content of any streaming markers
  const cleanContent = content
    ?.split('\n')
    .filter(line => !line.includes('event: stream_') && line.trim() !== '---event: stream_end')
    .join('\n') || '';

  // Parse the markdown into sections based on headings
  const sections = useMemo(() => {
    if (!cleanContent) return [];
    
    const lines = cleanContent.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    
    const headingRegex = /^(#+)\s+(.+)$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(headingRegex);
      
      if (headingMatch) {
        // If we found a heading and have a current section, push it
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Create a new section
        currentSection = {
          title: headingMatch[2],
          content: line + '\n',
          level: headingMatch[1].length,
          sectionId: `section-${sections.length}`, // Add unique ID for locking
        };
      } else if (currentSection) {
        // Add this line to the current section
        currentSection.content += line + '\n';
      } else if (line.trim() !== '') {
        // Handle content before any heading as an "Introduction" section
        currentSection = {
          title: 'Introduction',
          content: line + '\n',
          level: 0,
          sectionId: 'introduction',
        };
      }
    }
    
    // Don't forget to add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }, [cleanContent]);

  // Calculate grid columns based on number of sections
  const getGridColumns = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };
  
  // Calculate appropriate height constraints
  const getCardHeight = (columns: number): string => {
    if (columns === 1) return 'min-h-[300px]';
    if (columns === 2) return 'min-h-[250px]';
    return 'min-h-[200px]';
  };

  const gridCols = getGridColumns(sections.length);
  const cardHeight = getCardHeight(
    gridCols === 'grid-cols-1' ? 1 : 
    gridCols === 'grid-cols-2' ? 2 : 3
  );

  // Handle option select for sparkles dropdown
  const handleOptionSelect = useCallback(async (
    option: string, 
    sectionIndex: number, 
    customInstruction?: string
  ) => {
    const instruction = customInstruction 
      ? customInstruction 
      : option === 'break-down' 
        ? 'Break this section down into more detailed steps.'
        : option === 'more-detail'
          ? 'Expand this section with more detailed information.'
          : option === 'consolidate'
            ? 'Consolidate this section to make it more concise.'
            : '';
    
    if (!instruction || sectionIndex >= sections.length) return;
    
    // Determine section range based on markdown content
    const lines = cleanContent.split('\n');
    let start = 0;
    let end = lines.length - 1;
    
    // Find this section in the content
    let currentSectionIndex = 0;
    const headingRegex = /^(#+)\s+(.+)$/;
    
    for (let i = 0; i < lines.length; i++) {
      if (headingRegex.test(lines[i])) {
        if (currentSectionIndex === sectionIndex) {
          start = i;
          // Find the end (next heading or end of file)
          for (let j = i + 1; j < lines.length; j++) {
            if (headingRegex.test(lines[j])) {
              end = j - 1;
              break;
            }
            if (j === lines.length - 1) {
              end = j;
            }
          }
          break;
        }
        currentSectionIndex++;
      } else if (i === 0 && currentSectionIndex === sectionIndex && sections[0].title === 'Introduction') {
        // Handle introduction section (content before first heading)
        start = 0;
        for (let j = 0; j < lines.length; j++) {
          if (headingRegex.test(lines[j])) {
            end = j - 1;
            break;
          }
        }
        break;
      }
    }
    
    console.log('Editing section:', { start, end }, 'with instruction:', instruction);
    setEditingSection(sectionIndex);
    
    try {
      const success = await editMarkdownSection({ start, end }, instruction);
      if (!success) {
        console.error('Failed to edit section');
      }
    } catch (error) {
      console.error('Error editing section:', error);
    } finally {
      setEditingSection(null);
    }
  }, [sections, cleanContent, editMarkdownSection]);

  // Handle chat option select
  const handleChatOptionSelect = useCallback((
    option: string,
    sectionIndex: number,
    customMessage?: string
  ) => {
    if (sectionIndex >= sections.length) return;
    
    const section = sections[sectionIndex];
    const sectionText = section.content;
    
    // Prepare the message based on the selected option
    let message = '';
    
    if (option === 'needs-work') {
      message = `This section needs work:\n\n\`\`\`\n${sectionText}\n\`\`\`\n\nThis needs to be improved.`;
    } else if (option === 'evaluate') {
      message = `Please evaluate this section:\n\n\`\`\`\n${sectionText}\n\`\`\`\n\nI'd like an evaluation of this content.`;
    } else if (option === 'custom' && customMessage) {
      message = `About this section:\n\n\`\`\`\n${sectionText}\n\`\`\`\n\n${customMessage}`;
    }
    
    if (message) {
      // If onShowChat callback is provided, call it to show chat component
      if (onShowChat) {
        onShowChat();
      }
      
      // Send message to chat with a slight delay to ensure chat is visible
      setTimeout(() => {
        handleSendMessage(null, message);
      }, 100);
    }
    
    // Close the dropdown
    setOpenMenuSection(null);
    
  }, [sections, handleSendMessage, onShowChat]);

  // Render loading spinner for editing
  const renderSpinner = () => (
    <div className="editing-spinner">
      <div className="editing-spinner-circle"></div>
      <span className="editing-label">Editing...</span>
    </div>
  );

  // Handle toggle lock
  const handleToggleLock = useCallback((sectionIndex: number) => {
    if (toggleLock) {
      toggleLock(sectionIndex);
    }
  }, [toggleLock]);

  // Handle global click-outside events for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuSection !== null) {
        const targetElem = event.target as HTMLElement;
        
        const isOnMenuButton = targetElem.closest('.section-menu-button') !== null;
        const isOnDropdownMenu = targetElem.closest('.section-dropdown-menu') !== null;
        
        if (!isOnMenuButton && !isOnDropdownMenu) {
          setOpenMenuSection(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuSection]);

  const gridViewStyles = `
    /* Main dropdown menu */
    .section-dropdown-menu {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .menu-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    .menu-item-wrapper {
      width: 100%;
    }
    
    .menu-item {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.625rem 0.75rem;
      background: none;
      border: none;
      font-size: 0.875rem;
      color: #4b5563;
      cursor: pointer;
      transition: background-color 0.2s;
      text-align: left;
    }
    
    .menu-item:hover:not(.disabled) {
      background-color: #f3f4f6;
    }
    
    .menu-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .menu-item-content {
      display: flex;
      align-items: center;
    }
    
    .chevron-icon {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s;
    }
    
    .chevron-icon.open {
      transform: rotate(180deg);
    }
    
    /* Submenu styling */
    .submenu {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      width: 100%;
    }
    
    .submenu-item {
      width: 100%;
      padding: 0.5rem 1.25rem;
      background: none;
      border: none;
      text-align: left;
      font-size: 0.875rem;
      color: #4b5563;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .submenu-item:hover:not(:disabled) {
      background-color: #f3f4f6;
    }
    
    .custom-input-container {
      padding: 0.75rem;
      border-top: 1px solid #e5e7eb;
    }
    
    .custom-input-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      min-height: 5rem;
      margin-bottom: 0.5rem;
      resize: vertical;
    }
    
    .custom-input-submit {
      width: 100%;
      padding: 0.375rem 0.75rem;
      background-color: #4b5563;
      color: white;
      border: none;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .custom-input-submit:hover:not(:disabled) {
      background-color: #374151;
    }
    
    .custom-input-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .editing-spinner {
      display: flex;
      align-items: center;
      color: #4b5563;
      font-size: 0.75rem;
    }
    
    .editing-spinner-circle {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e2e8f0;
      border-top-color: #4b5563;
      border-radius: 50%;
      margin-right: 0.5rem;
      animation: spin 1s linear infinite;
    }
    
    .section-menu-button {
      transition: background-color 0.2s;
      border: 1px solid transparent;
    }
    
    .section-menu-button:hover {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = gridViewStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="p-4">
      {sections.length > 0 ? (
        <div className={`grid ${gridCols} gap-4`}>
          {sections.map((section, index) => {
            // Create a ref for this section's menu button if it doesn't exist
            if (!menuButtonRefs.current.has(index)) {
              menuButtonRefs.current.set(index, React.createRef<HTMLButtonElement>());
            }
            
            const isLocked = isLineLocked ? isLineLocked(index) : false;
            const isMenuOpen = openMenuSection === index;
            
            return (
              <div 
                key={index} 
                className={`${cardHeight} p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-auto border border-gray-200 relative ${isLocked ? 'section-locked' : ''}`}
              >
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">
                    {section.title}
                  </h3>
                  
                  {/* Section menu button - always visible */}
                  <div className="flex items-center">
                    {editingSection === index ? (
                      renderSpinner()
                    ) : (
                      <button
                        ref={menuButtonRefs.current.get(index)}
                        className={`section-menu-button p-1 rounded-full ${isMenuOpen ? 'bg-gray-100' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setOpenMenuSection(prev => prev === index ? null : index);
                        }}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    )}
                    
                    {isMenuOpen && (
                      <SectionDropdownMenu
                        isOpen={true}
                        onClose={() => setOpenMenuSection(null)}
                        sectionIndex={index}
                        buttonRef={menuButtonRefs.current.get(index) as React.RefObject<HTMLButtonElement>}
                        onOptionSelect={handleOptionSelect}
                        onChatOptionSelect={handleChatOptionSelect}
                        isLocked={isLocked}
                      />
                    )}
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none overflow-hidden">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {/* Exclude the heading from the content */}
                    {section.content.split('\n').slice(1).join('\n')}
                  </ReactMarkdown>
                </div>
                
                {/* Lock button moved to bottom right corner with subtle styling */}
                <div className="absolute bottom-2 right-2">
                  {isLocked ? (
                    <button
                      className="section-lock-button p-1 opacity-50 hover:opacity-100 transition-opacity"
                      onClick={() => handleToggleLock(index)}
                      title="Unlock section"
                    >
                      <LockClosedIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  ) : (
                    <button
                      className="section-lock-button p-1 opacity-30 hover:opacity-100 transition-opacity"
                      onClick={() => handleToggleLock(index)}
                      title="Lock section"
                    >
                      <LockOpenIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          No content available to display in grid view
        </div>
      )}
    </div>
  );
};

export default GridView;
