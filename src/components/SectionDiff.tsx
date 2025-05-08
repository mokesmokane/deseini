import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useEditedSection } from '../contexts/EditedSectionContext';
import * as diffLib from 'diff';
import './StreamingDiff.css'; // Reuse the existing CSS

interface DiffLine {
  type: 'context' | 'insert' | 'delete';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

// Group contiguous lines of the same type for action buttons
interface LineGroup {
  type: 'context' | 'insert' | 'delete';
  lines: DiffLine[];
  startIndex: number;
  endIndex: number;
  isRejected?: boolean;
}

const parseDiffToHunks = (diffText: string): DiffHunk[] => {
  if (!diffText) return [];

  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let oldLineNumber = 0;
  let newLineNumber = 0;

  const lines = diffText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      currentHunk = {
        header: line,
        lines: []
      };
      // Reset line numbers based on hunk header
      const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
      if (match) {
        oldLineNumber = parseInt(match[1], 10) - 1;
        newLineNumber = parseInt(match[2], 10) - 1;
      }
    } else if (currentHunk) {
      // Skip the "No newline at end of file" messages
      if (line.startsWith('\\ No newline at end of file')) {
        continue;
      }
      
      const firstChar = line[0];
      let type: DiffLine['type'] = 'context';
      let content = line;
      
      if (firstChar === '+') {
        type = 'insert';
        newLineNumber++;
        content = line.substring(1);
      } else if (firstChar === '-') {
        type = 'delete';
        oldLineNumber++;
        content = line.substring(1);
      } else if (firstChar === ' ') {
        oldLineNumber++;
        newLineNumber++;
        content = line.substring(1);
      }

      currentHunk.lines.push({
        type,
        content,
        oldLineNumber: type !== 'insert' ? oldLineNumber : undefined,
        newLineNumber: type !== 'delete' ? newLineNumber : undefined
      });
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
};

// Function to group contiguous lines of the same type
const groupLines = (lines: DiffLine[]): LineGroup[] => {
  const groups: LineGroup[] = [];
  let currentGroup: LineGroup | null = null;
  
  lines.forEach((line, index) => {
    // Start a new group if this is the first line or if the type changed
    if (!currentGroup || currentGroup.type !== line.type) {
      // Push the previous group if it exists
      if (currentGroup) {
        groups.push(currentGroup);
      }
      // Start a new group
      currentGroup = {
        type: line.type,
        lines: [line],
        startIndex: index,
        endIndex: index,
        isRejected: false
      };
    } else {
      // Add to the current group
      currentGroup.lines.push(line);
      currentGroup.endIndex = index;
    }
  });
  
  // Add the last group if it exists
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
};

// Generate live diff text between original and current content
const generateLiveDiff = (originalContent: string, currentContent: string): string => {
  if (!originalContent || !currentContent) return '';
  
  return diffLib.createPatch(
    'document.md',
    originalContent,
    currentContent,
    '',
    '',
    { context: 3 }
  );
};

const CustomHunk: React.FC<{ 
  hunk: DiffHunk, 
  hunkIndex: number
}> = ({ 
  hunk, 
  hunkIndex 
}) => {
  const { 
    acceptPartialChanges, 
    rejectPartialChanges
  } = useEditedSection();
  
  // Check if the header is a technical diff header (starts with @@)
  const isTechnicalHeader = hunk.header.startsWith('@@');
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
  const [acceptedGroups, setAcceptedGroups] = useState<Record<string, boolean>>({});
  const [rejectedGroups, setRejectedGroups] = useState<Record<string, boolean>>({});
  
  // Group lines by type
  const lineGroups = useMemo(() => groupLines(hunk.lines), [hunk.lines]);
  
  // Handler for accepting specific lines
  const handleAcceptLines = useCallback((startIndex: number, endIndex: number, type: 'insert' | 'delete') => {
    const groupKey = `hunk-${hunkIndex}-${startIndex}-${endIndex}`;
    
    // Update local UI state
    setAcceptedGroups(prev => ({
      ...prev,
      [groupKey]: true
    }));
    
    // Update context state
    acceptPartialChanges(startIndex, endIndex, type);
  }, [hunkIndex, acceptPartialChanges]);

  // Handler for rejecting specific lines
  const handleRejectLines = useCallback((startIndex: number, endIndex: number, type: 'insert' | 'delete') => {
    const groupKey = `hunk-${hunkIndex}-${startIndex}-${endIndex}`;
    
    // Update local UI state
    setRejectedGroups(prev => ({
      ...prev,
      [groupKey]: true
    }));
    
    // Update context state
    rejectPartialChanges(startIndex, endIndex, type);
  }, [hunkIndex, rejectPartialChanges]);
  
  return (
    <div className="custom-hunk mb-4 border border-black border-opacity-5 rounded-md shadow-sm">
      {!isTechnicalHeader && (
        <div className="hunk-header bg-white px-4 py-3 text-sm rounded-t-md border-b border-black border-opacity-5 text-black text-opacity-70 font-sans">
          {hunk.header}
        </div>
      )}
      <div className="hunk-content">
        {lineGroups.map((group, groupIdx) => {
          const groupKey = `hunk-${hunkIndex}-${group.startIndex}-${group.endIndex}`;
          const isGroupAccepted = acceptedGroups[groupKey] === true;
          const isGroupRejected = rejectedGroups[groupKey] === true;
          
          // If this is a rejected insert group, don't render it at all
          if (isGroupRejected && group.type === 'insert') {
            return null;
          }
          
          // If this is an accepted delete group, don't render it at all
          if (isGroupAccepted && group.type === 'delete') {
            return null;
          }

          // For context groups or groups that are neither accepted nor rejected
          return (
            <div 
              key={`group-${groupIdx}`}
              className="relative"
              onMouseEnter={() => group.type !== 'context' && !isGroupRejected && !isGroupAccepted ? setHoveredGroup(groupIdx) : null}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              {/* Action buttons for insert/delete groups that aren't rejected or accepted */}
              {hoveredGroup === groupIdx && group.type !== 'context' && !isGroupRejected && !isGroupAccepted && (
                <div className="absolute right-2 top-0 mt-1 flex space-x-2 z-10">
                  <button 
                    className={`px-2 py-1 text-xs rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-20
                      ${group.type === 'insert' 
                        ? 'bg-green-50/50 text-green-700 border border-green-200/50 hover:bg-green-100/50' 
                        : 'bg-red-50/50 text-red-700 border border-red-200/50 hover:bg-red-100/50'}`}
                    onClick={() => {
                      // Only handle 'insert' and 'delete' types to satisfy TypeScript
                      if (group.type === 'insert' || group.type === 'delete') {
                        handleAcceptLines(group.startIndex, group.endIndex, group.type);
                      }
                    }}
                  >
                    Accept
                  </button>
                  <button 
                    className="px-2 py-1 text-xs bg-white text-black text-opacity-70 border border-black border-opacity-10 rounded shadow-sm hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-20"
                    onClick={() => {
                      // Only handle 'insert' and 'delete' types to satisfy TypeScript
                      if (group.type === 'insert' || group.type === 'delete') {
                        handleRejectLines(group.startIndex, group.endIndex, group.type);
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
              
              {/* Group lines */}
              {group.lines.map((line, lineIdx) => {
                // If this is a rejected delete group, show it as context
                if (isGroupRejected && group.type === 'delete') {
                  return (
                    <div
                      key={`${group.startIndex}-${lineIdx}`}
                      className="diff-line flex"
                    >
                      <div className="gutter-old w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                        {line.oldLineNumber || ' '}
                      </div>
                      <div className="gutter-new w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                        {line.oldLineNumber || ' '}
                      </div>
                      <div className="line-content flex-1 px-4 py-1 font-mono whitespace-pre-wrap break-words text-black text-opacity-80">
                        {line.content}
                      </div>
                    </div>
                  );
                }
                
                // If this is an accepted insert group, show it as regular text without highlighting
                if (isGroupAccepted && group.type === 'insert') {
                  return (
                    <div
                      key={`${group.startIndex}-${lineIdx}`}
                      className="diff-line flex"
                    >
                      <div className="gutter-old w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                        {line.oldLineNumber || ' '}
                      </div>
                      <div className="gutter-new w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                        {line.newLineNumber || ' '}
                      </div>
                      <div className="line-content flex-1 px-4 py-1 font-mono whitespace-pre-wrap break-words text-black text-opacity-80">
                        {line.content}
                      </div>
                    </div>
                  );
                }
                
                // Normal rendering for non-rejected, non-accepted groups
                return (
                  <div
                    key={`${group.startIndex}-${lineIdx}`}
                    className={`diff-line flex ${
                      line.type === 'insert' 
                        ? 'bg-green-50/30 border-l-2 border-green-200/40' 
                        : line.type === 'delete' 
                          ? 'bg-red-50/30 border-l-2 border-red-200/40' 
                          : ''
                    } ${hoveredGroup === groupIdx ? 'opacity-90' : ''}`}
                  >
                    <div className="gutter-old w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                      {line.oldLineNumber || ' '}
                    </div>
                    <div className="gutter-new w-12 flex-shrink-0 text-right px-2 py-1 border-r border-black border-opacity-5 font-mono text-sm text-black text-opacity-40">
                      {line.newLineNumber || ' '}
                    </div>
                    <div className={`line-content flex-1 px-4 py-1 font-mono whitespace-pre-wrap break-words ${
                      line.type === 'insert'
                        ? 'text-green-700'
                        : line.type === 'delete'
                          ? 'text-red-700 line-through decoration-red-700 decoration-2'
                          : 'text-black text-opacity-80'
                    }`}>
                      {line.content}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SectionDiff: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    diffText, 
    isStreaming, 
    originalContent, 
    editedContent,
    instruction, // Get the instruction from context
    finalizeChanges,
    onFinalize
  } = useEditedSection();
  
  // Use either the completed diff or generate a live diff while streaming
  const currentDiffText = isStreaming && originalContent && editedContent 
    ? `diff --git a/document.md b/document.md\n${generateLiveDiff(originalContent, editedContent)}`
    : diffText;
  
  const hunks = parseDiffToHunks(currentDiffText);

  // Register the onClose callback to run when changes are finalized
  useEffect(() => {
    if (onClose) {
      onFinalize(onClose);
    }
  }, [onFinalize, onClose]);

  return (
    <div className="diff-view">
      <div className="diff-container bg-white rounded-md">
          <div>
            {isStreaming && (
              <div className="px-4 py-2 bg-black bg-opacity-5 text-black text-opacity-60 text-sm rounded-t-md">
                <span className="animate-pulse">Streaming changes...</span>
              </div>
            )}
            {hunks.map((hunk, index) => (
              <CustomHunk 
                key={`${hunk.header}-${index}`}
                hunk={{
                  ...hunk,
                  // Replace the technical diff header with the instruction
                  header: instruction || hunk.header 
                }}
                hunkIndex={index}
              />
            ))}
            
            {!isStreaming && hunks.length > 0 && (
              <div className="flex justify-end p-4 border-t border-black border-opacity-5">
                <button
                  onClick={() => finalizeChanges()}
                  className="px-4 py-2 bg-black bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
