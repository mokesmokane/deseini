/**
 * Helper functions for markdown processing and section management
 * These utilities help keep the main components cleaner and more focused
 */

/**
 * Gets section range based on line information
 */
export const getSectionRange = (
  lineNumber: number,
  lineInfo: any,
  findListItemRange: (lineNumber: number) => { start: number, end: number } | null,
  lines: string[] = []
): { start: number, end: number } => {
  if (lineInfo.isList) {
    const range = findListItemRange(lineNumber);
    if (range) {
      // Find last non-empty line in the range
      let lastNonEmptyLine = range.end;
      if (lines.length > 0) {
        while (lastNonEmptyLine > range.start && !lines[lastNonEmptyLine]?.trim()) {
          lastNonEmptyLine--;
        }
      }
      
      return { 
        start: range.start, 
        end: lastNonEmptyLine 
      };
    } else {
      return { start: lineNumber, end: lineNumber };
    }
  } else if (lineInfo.sections.length > 0) {
    const deepestSection = lineInfo.sections[lineInfo.sections.length - 1];
    
    // Find last non-empty line in the section
    let lastNonEmptyLine = deepestSection.end;
    if (lines.length > 0) {
      while (lastNonEmptyLine > deepestSection.start && !lines[lastNonEmptyLine]?.trim()) {
        lastNonEmptyLine--;
      }
    }
    
    return {
      start: deepestSection.start,
      end: lastNonEmptyLine
    };
  } else {
    // If no section, just use the current line
    return { start: lineNumber, end: lineNumber };
  }
};

/**
 * Determines the CSS classes for a markdown line
 */
export const getLineClasses = (
  isHeader: boolean,
  headerLevel: number | undefined,
  isList: boolean,
  listLevel: number | undefined,
  isActive: boolean,
  isHovered: boolean,
  isEditing: boolean,
  isLocked: boolean
): string[] => {
  const classes = ['line'];
  
  if (isHeader) {
    classes.push('header');
    classes.push(`h${headerLevel}`);
  }
  
  if (isList) {
    classes.push('list-item');
    if (listLevel) {
      classes.push(`list-level-${listLevel}`);
    }
  }
  
  if (isActive) {
    classes.push('highlight');
  }
  
  if (isHovered) {
    classes.push('hover');
  }
  
  if (isEditing) {
    classes.push('editing-line');
    classes.push('highlight');
  }
  
  if (isLocked) {
    classes.push('locked');
  }
  
  return classes;
};
