// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { diffLines } from 'diff';
// import './MarkdownDiffViewer.css';
// import { useProjectPlan } from '../../contexts/ProjectPlanContext';
// import { MarkdownLineRenderer } from './renderer/MarkdownLineRenderer';
// import { getSectionRange } from './utils/markdownHelpers';

// interface DiffBlock {
//   start: number;
//   end: number;
//   isAddition: boolean;
//   content: string[];
// }

// interface Props {
//   originalMarkdown: string;
//   modifiedMarkdown?: string;
//   onShowChat?: () => void;
//   onAcceptChanges?: () => void;
//   onRejectChanges?: () => void;
//   onShowSectionDiff?: (range: {start: number, end: number}, instruction: string) => void;
// }

// export const MarkdownDiffViewer: React.FC<Props> = ({ 
//   originalMarkdown, 
//   modifiedMarkdown, 
//   onShowChat, 
//   onAcceptChanges, 
//   onRejectChanges,
//   onShowSectionDiff 
// }) => {
//   const { 
//     setCurrentText, 
//     isLineLocked, 
//     toggleLock, 
//     unlockSection, 
//     getLineInfo, 
//     findListItemRange, 
//     getAllLines, 
//     editMarkdownSection 
//   } = useProjectPlan();
  
//   const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
//   const [openDropdownLine, setOpenDropdownLine] = useState<number | null>(null);
//   const [openChatDropdownLine, setOpenChatDropdownLine] = useState<number | null>(null);
//   const [lineHovered, setLineHovered] = useState<number | null>(null);
//   const [editingSection, setEditingSection] = useState<{start: number, end: number} | null>(null);
//   const [displayText, setDisplayText] = useState<string>(originalMarkdown);
//   const [diffBlocks, setDiffBlocks] = useState<DiffBlock[]>([]);
//   const [processingBlock, setProcessingBlock] = useState<number | null>(null);
  
//   const containerRef = useRef<HTMLDivElement>(null);
//   const buttonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());
//   const chatButtonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Initialize markdown text and calculate diffs if modified text exists
//   useEffect(() => {
//     setDisplayText(originalMarkdown);
    
//     if (modifiedMarkdown) {
//       const blocks = identifyChangeBlocks(originalMarkdown, modifiedMarkdown);
//       setDiffBlocks(blocks);
//     } else {
//       setDiffBlocks([]);
//     }
//   }, [originalMarkdown, modifiedMarkdown]);

//   // Handle clicks outside of dropdowns
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if ((openDropdownLine !== null) || (openChatDropdownLine !== null)) {
//         const targetElem = event.target as HTMLElement;
        
//         // Check if the click is on the dropdown or its button
//         const isOnDropdown = dropdownRef.current && dropdownRef.current.contains(targetElem);
//         const isOnDropdownButton = targetElem.closest('.sparkles-button') !== null;
//         const isOnChatButton = targetElem.closest('.icon-button') !== null;
//         const isOnDropdownMenu = targetElem.closest('.dropdown-menu') !== null; 
        
//         // Only close if click is outside dropdown, its button, and any dropdown menu
//         if (!isOnDropdown && !isOnDropdownButton && !isOnChatButton && !isOnDropdownMenu) {
//           setOpenDropdownLine(null);
//           setOpenChatDropdownLine(null);
//         }
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [openDropdownLine, openChatDropdownLine]);

//   // Function to identify and group change blocks
//   const identifyChangeBlocks = (previous: string, current: string): DiffBlock[] => {
//     if (!previous || !current) return [];
    
//     const blocks: DiffBlock[] = [];
//     const diff = diffLines(previous, current);
    
//     let lineIndex = 0;
//     let blockStart = -1;
//     let currentBlockType: 'addition' | 'removal' | null = null;
//     let currentBlockContent: string[] = [];
    
//     diff.forEach(part => {
//       const lines = part.value.split('\n').filter(Boolean);
      
//       if (part.added && currentBlockType !== 'addition') {
//         // Start new addition block
//         if (blockStart !== -1 && currentBlockType === 'removal') {
//           // Save previous removal block
//           blocks.push({
//             start: blockStart,
//             end: lineIndex - 1,
//             isAddition: false,
//             content: currentBlockContent
//           });
//         }
//         blockStart = lineIndex;
//         currentBlockType = 'addition';
//         currentBlockContent = [...lines];
//       } else if (part.removed && currentBlockType !== 'removal') {
//         // Start new removal block
//         if (blockStart !== -1 && currentBlockType === 'addition') {
//           // Save previous addition block
//           blocks.push({
//             start: blockStart,
//             end: lineIndex - 1,
//             isAddition: true,
//             content: currentBlockContent
//           });
//         }
//         blockStart = lineIndex;
//         currentBlockType = 'removal';
//         currentBlockContent = [...lines];
//       } else if (!part.added && !part.removed) {
//         // Unchanged section - save previous block if it exists
//         if (blockStart !== -1) {
//           blocks.push({
//             start: blockStart,
//             end: lineIndex - 1,
//             isAddition: currentBlockType === 'addition',
//             content: currentBlockContent
//           });
//           blockStart = -1;
//           currentBlockType = null;
//           currentBlockContent = [];
//         }
//       } else if ((part.added && currentBlockType === 'addition') || 
//                 (part.removed && currentBlockType === 'removal')) {
//         // Continue current block
//         currentBlockContent = [...currentBlockContent, ...lines];
//       }
      
//       // Only increment line index for additions and unchanged
//       if (!part.removed) {
//         lineIndex += lines.length;
//       }
//     });
    
//     // Add any remaining block
//     if (blockStart !== -1) {
//       blocks.push({
//         start: blockStart,
//         end: lineIndex - 1,
//         isAddition: currentBlockType === 'addition',
//         content: currentBlockContent
//       });
//     }
    
//     return blocks;
//   };

//   // Handle line hover states
//   const handleLineHover = useCallback((lineNumber: number | null) => {
//     if (lineNumber === null) {
//       setLineHovered(null);
//       return;
//     }
    
//     const info = getLineInfo(lineNumber);
    
//     if (info.isList) {
//       const range = findListItemRange(lineNumber);
//       if (range) {
//         const linesToHighlight = Array.from(
//           { length: range.end - range.start + 1 },
//           (_, i) => range.start + i
//         );
//         setActiveLines(new Set(linesToHighlight));
//         setLineHovered(lineNumber);
//       } else {
//         setActiveLines(new Set([lineNumber]));
//         setLineHovered(lineNumber);
//       }
//     } else if (info.sections.length > 0) {
//       const deepestSection = info.sections[info.sections.length - 1];
//       if (info.isContent) {
//         const contentLines = Array.from(
//           { length: deepestSection.contentEnd - deepestSection.contentStart + 1 },
//           (_, i) => deepestSection.contentStart + i
//         );
//         setActiveLines(new Set(contentLines));
//         setLineHovered(lineNumber);
//       } else if (info.isHeader) {
//         const sectionLines = Array.from(
//           { length: deepestSection.end - deepestSection.start + 1 },
//           (_, i) => deepestSection.start + i
//         );
//         setActiveLines(new Set(sectionLines));
//         setLineHovered(lineNumber);
//       } else {
//         setActiveLines(new Set([lineNumber]));
//         setLineHovered(lineNumber);
//       }
//     } else {
//       setActiveLines(new Set([lineNumber]));
//       setLineHovered(lineNumber);
//     }
//   }, [getLineInfo, findListItemRange]);

//   const handleLineLeave = useCallback(() => {
//     setActiveLines(new Set());
//     setLineHovered(null);
//   }, []);

//   const getSectionId = useCallback((lineNumber: number) => {
//     const info = getLineInfo(lineNumber);
//     return info.sections.length > 0 
//       ? info.sections[info.sections.length - 1].id 
//       : `line-${lineNumber}`;
//   }, [getLineInfo]);

//   // Delete section function
//   const deleteSection = useCallback((lineNumber: number) => {
//     const info = getLineInfo(lineNumber);
//     let linesToDelete: number[] = [];

//     const sectionIdToDelete = getSectionId(lineNumber);
    
//     if (info.isList) {
//       const range = findListItemRange(lineNumber);
//       if (range) {
//         for (let i = range.start; i <= range.end; i++) {
//           linesToDelete.push(i);
//         }
//       } else {
//         linesToDelete.push(lineNumber);
//       }
//     } else if (info.sections.length > 0) {
//       const deepestSection = info.sections[info.sections.length - 1];
//       for (let i = deepestSection.start; i <= deepestSection.end; i++) {
//         linesToDelete.push(i);
//       }
//     } else {
//       linesToDelete.push(lineNumber);
//     }

//     const lines = getAllLines();
//     const updatedLines = lines.filter((_, index) => !linesToDelete.includes(index));
//     setCurrentText(updatedLines.join('\n'));
    
//     setActiveLines(new Set());
//     setLineHovered(null);
    
//     unlockSection(sectionIdToDelete);
//   }, [setCurrentText, unlockSection, getSectionId, findListItemRange, getAllLines, getLineInfo]);

//   // Handle dropdown option selection
//   const handleOptionSelect = useCallback(async (
//     option: string, 
//     lineNumber: number, 
//     customInstruction?: string
//   ) => {
//     const instruction = customInstruction 
//       ? customInstruction 
//       : option === 'break-down' 
//         ? 'Break this section down into more detailed steps.'
//         : option === 'more-detail'
//           ? 'Expand this section with more detailed information.'
//           : option === 'consolidate'
//             ? 'Consolidate this section to make it more concise.'
//             : '';
    
//     if (!instruction) return;
    
//     // Get the section range for the clicked line
//     const lineInfo = getLineInfo(lineNumber);
//     const sectionRange = getSectionRange(lineNumber, lineInfo, findListItemRange);
    
//     setEditingSection(sectionRange);
    
//     // If onShowSectionDiff is provided, use it to show section diff panel
//     if (onShowSectionDiff) {
//       onShowSectionDiff(sectionRange, instruction);
//       setEditingSection(null);
//       // Close any open dropdown
//       setOpenDropdownLine(null);
//       return;
//     }
    
//     // Fallback to direct editing if onShowSectionDiff is not provided
//     try {
//       const success = await editMarkdownSection(sectionRange, instruction);
//       if (!success) {
//         console.error('Failed to edit section');
//       }
//     } catch (error) {
//       console.error('Error editing section:', error);
//     } finally {
//       setEditingSection(null);
//     }
//   }, [editMarkdownSection, getLineInfo, findListItemRange, onShowSectionDiff]);

//   // Handle chat dropdown options
//   const handleChatOptionSelect = useCallback((
//     option: string,
//     lineNumber: number,
//     customMessage?: string
//   ) => {
//     // Get section information
//     const info = getLineInfo(lineNumber);
//     let content = '';
    
//     if (info.sections.length > 0) {
//       const deepestSection = info.sections[info.sections.length - 1];
      
//       // Get the content of the section
//       const lines = getAllLines();
//       content = lines.slice(deepestSection.start, deepestSection.end + 1).join('\n');
//     } else if (info.isList) {
//       const range = findListItemRange(lineNumber);
//       if (range) {
//         const lines = getAllLines();
//         content = lines.slice(range.start, range.end + 1).join('\n');
//       } else {
//         const lines = getAllLines();
//         content = lines[lineNumber];
//       }
//     } else {
//       const lines = getAllLines();
//       content = lines[lineNumber];
//     }
    
//     // Close any open dropdown
//     setOpenChatDropdownLine(null);
    
//     // If onShowChat callback is provided, call it to show chat component
//     if (onShowChat) {
//       // Prepare message based on the selected option
//       let message = '';
      
//       switch (option) {
//         case 'analyze':
//           message = `Can you analyze this section from my project plan and ask me clarifying questions about it?\n\n${content}`;
//           break;
//         case 'improve':
//           message = `Can you suggest improvements for this section of my project plan?\n\n${content}`;
//           break;
//         case 'custom':
//           message = customMessage || `Let's discuss this section:\n\n${content}`;
//           break;
//         default:
//           message = `I'd like to discuss this section of my project plan:\n\n${content}`;
//       }
      
//       console.log(`Initiating chat with message: ${message.substring(0, 50)}...`);
//       onShowChat();
//     }
    
//   }, [getLineInfo, getAllLines, findListItemRange, onShowChat]);

//   // Check if a line is part of a diff block
//   const isLineDiff = useCallback((lineNumber: number): { isDiff: boolean, isAddition: boolean, blockIndex: number } => {
//     for (let i = 0; i < diffBlocks.length; i++) {
//       const block = diffBlocks[i];
//       if (lineNumber >= block.start && lineNumber <= block.end) {
//         return { isDiff: true, isAddition: block.isAddition, blockIndex: i };
//       }
//     }
//     return { isDiff: false, isAddition: false, blockIndex: -1 };
//   }, [diffBlocks]);

//   // Handle block action (accept or reject)
//   const handleBlockAction = useCallback((blockIndex: number, isAccept: boolean) => {
//     const block = diffBlocks[blockIndex];
//     if (!block) return;
    
//     setProcessingBlock(blockIndex);
    
//     try {
//       // Apply the changes from modified to original if accepting
//       if (isAccept && onAcceptChanges) {
//         // In a real implementation, you would update the actual content
//         // For now just notify via the callback
//         onAcceptChanges();
//       } else if (!isAccept && onRejectChanges) {
//         onRejectChanges();
//       }
      
//       // Update UI to show accepted/rejected state
//       const updatedBlocks = diffBlocks.filter((_, i) => i !== blockIndex);
//       setDiffBlocks(updatedBlocks);
      
//     } catch (error) {
//       console.error(`Error ${isAccept ? 'accepting' : 'rejecting'} block:`, error);
//     } finally {
//       setProcessingBlock(null);
//     }
//   }, [diffBlocks, onAcceptChanges, onRejectChanges]);

//   // Line editing status checks
//   const isLineEditing = useCallback((lineNumber: number) => {
//     if (!editingSection) return false;
//     return lineNumber >= editingSection.start && lineNumber <= editingSection.end;
//   }, [editingSection]);

//   const isTopLineEditing = useCallback((lineNumber: number) => {
//     if (!editingSection) return false;
//     return lineNumber === editingSection.start;
//   }, [editingSection]);

//   // Initialize button refs
//   const getButtonRef = useCallback((lineNumber: number) => {
//     if (!buttonRefs.current.has(lineNumber)) {
//       buttonRefs.current.set(lineNumber, React.createRef<HTMLButtonElement>());
//     }
//     return buttonRefs.current.get(lineNumber)!;
//   }, []);
  
//   const getChatButtonRef = useCallback((lineNumber: number) => {
//     if (!chatButtonRefs.current.has(lineNumber)) {
//       chatButtonRefs.current.set(lineNumber, React.createRef<HTMLButtonElement>());
//     }
//     return chatButtonRefs.current.get(lineNumber)!;
//   }, []);

//   // Add diff block controls
//   const addBlockControls = useCallback((blockIndex: number, isAddition: boolean) => {
//     if (!containerRef.current) return;

//     // Find all lines in this block
//     const blockLineElements = Array.from(containerRef.current.querySelectorAll(`.diff-block-${blockIndex}`));
//     if (blockLineElements.length === 0) return;

//     // If controls already exist, don't add another one
//     if (containerRef.current.querySelector(`.diff-block-controls-${blockIndex}`)) return;

//     // Create controls container
//     const controlsContainer = document.createElement('div');
//     controlsContainer.className = `diff-block-controls diff-block-controls-${blockIndex} flex items-center space-x-2 absolute -right-1 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-md shadow-sm z-10`;
    
//     // Accept button
//     const acceptButton = document.createElement('button');
//     acceptButton.className = 'p-1 hover:bg-green-50 text-green-600 rounded-l-md';
//     acceptButton.title = `Accept this ${isAddition ? 'addition' : 'removal'}`;
//     acceptButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
//     acceptButton.onclick = () => handleBlockAction(blockIndex, true);
    
//     // Reject button
//     const rejectButton = document.createElement('button');
//     rejectButton.className = 'p-1 hover:bg-red-50 text-red-600 rounded-r-md';
//     rejectButton.title = `Reject this ${isAddition ? 'addition' : 'removal'}`;
//     rejectButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
//     rejectButton.onclick = () => handleBlockAction(blockIndex, false);
    
//     controlsContainer.appendChild(acceptButton);
//     controlsContainer.appendChild(rejectButton);
    
//     // Insert the controls container
//     const firstBlockElement = blockLineElements[0] as HTMLElement;
//     if (firstBlockElement) {
//       firstBlockElement.style.position = 'relative';
//       firstBlockElement.appendChild(controlsContainer);
//     }
//   }, [handleBlockAction]);

//   // Add controls to diff blocks
//   useEffect(() => {
//     if (diffBlocks.length > 0 && containerRef.current) {
//       // Add a small delay to ensure the DOM is updated
//       setTimeout(() => {
//         diffBlocks.forEach((block, index) => {
//           addBlockControls(index, block.isAddition);
//         });
//       }, 100);
//     }
//   }, [diffBlocks, addBlockControls]);

//   // Render markdown content with diffs
//   const renderMarkdown = useCallback(() => {
//     if (!displayText) {
//       return <div className="markdown-empty">No content to display</div>;
//     }
    
//     const lines = displayText.split('\n');
    
//     return (
//       <div ref={containerRef} className="markdown-diff-viewer">
//         <pre>
//           <code className="markdown-raw">
//             {lines.map((line, index) => {
//               const info = getLineInfo(index);
//               const isLocked = isLineLocked(index);
//               const isDropdownOpen = openDropdownLine === index;
//               const isChatDropdownOpen = openChatDropdownLine === index;
              
//               // Check if this line is part of a diff
//               const { isDiff, isAddition, blockIndex } = isLineDiff(index);
              
//               // Additional classes for diff styling
//               const diffClasses = isDiff 
//                 ? isAddition 
//                   ? 'diff-line-added diff-block-' + blockIndex
//                   : 'diff-line-removed diff-block-' + blockIndex
//                 : '';
              
//               return (
//                 <MarkdownLineRenderer
//                   key={index}
//                   line={line}
//                   lineNumber={index}
//                   isHeader={info.isHeader}
//                   headerLevel={info.headerLevel}
//                   isList={info.isList}
//                   listLevel={info.listLevel}
//                   isActive={activeLines.has(index)}
//                   isHovered={lineHovered === index}
//                   isEditing={isLineEditing(index)}
//                   isTopLineEditing={isTopLineEditing(index)}
//                   isLocked={isLocked}
//                   isDropdownOpen={isDropdownOpen}
//                   isChatDropdownOpen={isChatDropdownOpen}
//                   buttonRef={getButtonRef(index)}
//                   chatButtonRef={getChatButtonRef(index)}
//                   handleLineHover={handleLineHover}
//                   handleLineLeave={handleLineLeave}
//                   handleOptionSelect={handleOptionSelect}
//                   handleChatOptionSelect={handleChatOptionSelect}
//                   setOpenDropdownLine={setOpenDropdownLine}
//                   setOpenChatDropdownLine={setOpenChatDropdownLine}
//                   toggleLock={toggleLock}
//                   deleteSection={deleteSection}
//                   isLineEditing={isLineEditing}
//                   className={diffClasses}
//                 />
//               );
//             })}
//           </code>
//         </pre>
//       </div>
//     );
//   }, [
//     displayText,
//     activeLines, 
//     handleLineHover, 
//     handleLineLeave, 
//     isLineLocked, 
//     lineHovered, 
//     openDropdownLine, 
//     openChatDropdownLine, 
//     getLineInfo,
//     toggleLock, 
//     deleteSection,
//     isLineEditing, 
//     isTopLineEditing,
//     handleOptionSelect,
//     handleChatOptionSelect,
//     getButtonRef,
//     getChatButtonRef,
//     isLineDiff
//   ]);

//   return (
//     <div className="markdown-diff-container">
//       {renderMarkdown()}
      
//       {/* Loading indicator for processing a specific block */}
//       {processingBlock !== null && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 z-50">
//           <div className="bg-white p-3 rounded-lg shadow-lg flex items-center space-x-3">
//             <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
//             <span>Processing change...</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
