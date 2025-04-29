// Removing the import of Section from MarkdownSections

export interface SectionDisplay {
  id: string;
  level: number;
  content: string; // all the text of this section and its subsections
  children: SectionDisplay[];
  type: 'section' | 'list';
  title?: string;
}

export interface SectionState {
  currentText: string;
  sections: Record<string, SectionDisplay>;
  currentSection: SectionDisplay | null;
  currentLineNumber: number;
}

export interface SectionUpdate {
  sections: Record<string, SectionDisplay>;
  currentSection: SectionDisplay | null;
  lineNumber: number;
}

/**
 * SectionUpdater manages the state of sections as markdown content is streamed.
 * It efficiently updates the section data structure without reprocessing the entire document.
 */
export class SectionUpdater {
  private text: string;
  private lines: string[];
  private sectionMap: Record<string, SectionDisplay>;
  private rootSection: SectionDisplay;
  private currentSection: SectionDisplay | null;
  private lastAnalyzedLine: number;
  private sectionStartLines: Record<string, number>; // Store starting line for each section

  /**
   * Initialize a new SectionUpdater
   * @param initialText The initial markdown text (can be empty)
   * @param initialSections Optional initial sections structure
   */
  constructor(initialText: string = '', initialSections: Record<string, SectionDisplay> = {}) {
    this.text = initialText;
    this.lines = initialText.split('\n');
    this.sectionMap = { ...initialSections };
    this.currentSection = null;
    this.lastAnalyzedLine = -1; // Initialize to -1 for empty document
    this.sectionStartLines = {};
    
    // Create a root section if none exists
    this.rootSection = this.sectionMap['root'] || {
      id: 'root',
      level: 0,
      content: initialText,
      children: [],
      type: 'section',
    };
    
    if (!this.sectionMap['root']) {
      this.sectionMap['root'] = this.rootSection;
    }
    
    // Set root section start line
    this.sectionStartLines['root'] = 0;
  }

  /**
   * Process new lines as they're streamed in and update the section structure
   * @param newLines New lines of markdown content
   * @returns Updated section state
   */
  public processNewLines(newLines: string[]): SectionUpdate {
    if (newLines.length === 0) {
      return {
        sections: this.sectionMap,
        currentSection: this.currentSection,
        lineNumber: this.lastAnalyzedLine
      };
    }

    // Add the new lines to our text and lines array
    const startLineIndex = this.lines.length;
    this.lines = [...this.lines, ...newLines];
    this.text = this.lines.join('\n');
    
    // Process each new line
    for (let i = 0; i < newLines.length; i++) {
      const lineIndex = startLineIndex + i;
      this.processLine(newLines[i], lineIndex);
    }

    // Update the section content
    this.updateSectionContent();
    
    // Filter sectionMap to only include level-1 sections
    const topLevelMap: Record<string, SectionDisplay> = {};
    this.rootSection.children.forEach(sec => {
      topLevelMap[sec.id] = sec;
    });
    this.sectionMap = topLevelMap;

    // Find the current section based on the last line
    this.lastAnalyzedLine = this.lines.length - 1;
    this.currentSection = this.findSectionForLine(this.lastAnalyzedLine);

    return {
      sections: this.sectionMap,
      currentSection: this.currentSection,
      lineNumber: this.lastAnalyzedLine
    };
  }

  /**
   * Process a single line and update the section structure
   * @param line The line content
   * @param lineIndex The line index in the document
   */
  private processLine(line: string, lineIndex: number): void {
    const headerMatch = line.match(/^(#{1,6}) (.+)/);
    const listMatch = this.isListItem(line);
    
    if (headerMatch) {
      // This is a header - create a new section
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const id = `section-${lineIndex}`;
      
      // Find the appropriate parent section
      let parentSection = this.findParentForSection(level);
      
      // Create the new section
      const newSection: SectionDisplay = {
        id,
        level,
        content: "", // Will be calculated in updateSectionContent
        children: [],
        type: 'section',
        title
      };
      
      // Store the starting line for this section
      this.sectionStartLines[id] = lineIndex;
      
      // Add to parent's children
      if (parentSection) {
        parentSection.children.push(newSection);
      }
      
      // Add to section map
      this.sectionMap[id] = newSection;
      
      // Set as current section
      this.currentSection = newSection;
    } else if (listMatch.isItem) {
      // Handle list item
      const id = `list-${lineIndex}`;
      
      // Find parent section or list item
      const currentParent = this.findParentForListItem(line, lineIndex);
      
      // Create the new list item
      const newListItem: SectionDisplay = {
        id,
        level: listMatch.level,
        content: line,
        children: [],
        type: 'list'
      };
      
      // Add to parent
      if (currentParent) {
        currentParent.children.push(newListItem);
      }
      
      // Add to section map
      this.sectionMap[id] = newListItem;
    }
  }

  /**
   * Find the appropriate parent for a list item based on its indentation level
   * @param line The list item text
   * @param lineIndex Current line index
   * @returns The parent section or list item
   */
  private findParentForListItem(line: string, lineIndex: number): SectionDisplay | null {
    const listInfo = this.isListItem(line);
    const level = listInfo.level;
    
    // If it's a top-level list item, find the enclosing section
    if (level === 0) {
      return this.findSectionForLine(lineIndex);
    }
    
    // For nested list items, we need to find the parent list item
    // First, try to find a preceding list item at the same level - could be a sibling
    let possibleParentLine = -1;
    let possibleSiblingLevel = -1;
    
    // Start from the previous line and move backward
    for (let i = lineIndex - 1; i >= 0; i--) {
      const prevLine = this.lines[i];
      
      // Skip empty lines
      if (!prevLine.trim()) continue;
      
      // Check if the previous line is a list item
      const prevItemMatch = this.isListItem(prevLine);
      if (prevItemMatch.isItem) {
        const prevItemLevel = prevItemMatch.level;
        
        // If this is the first list item we find, record it
        if (possibleParentLine === -1) {
          possibleParentLine = i;
          possibleSiblingLevel = prevItemLevel;
        }
        
        // If the previous item's indentation level is exactly one less than this one,
        // it's our parent
        if (prevItemLevel === level - 1) {
          const parentId = `list-${i}`;
          return this.sectionMap[parentId];
        }
        
        // If we find an item with a level less than the current level,
        // and we haven't found a better parent yet, use it
        if (prevItemLevel < level) {
          const parentId = `list-${i}`;
          return this.sectionMap[parentId];
        }
        
        // If we find an item at the same level, it's a sibling
        // Keep looking for a common parent
        if (prevItemLevel === level) {
          // Continue searching - siblings share the same parent
          continue;
        }
      } else {
        // If we hit a non-list line and we haven't found a parent,
        // break and return the section
        break;
      }
    }
    
    // If we found a sibling but no parent, try to get the sibling's parent
    if (possibleParentLine !== -1 && possibleSiblingLevel === level) {
      const siblingId = `list-${possibleParentLine}`;
      
      // Find all parent references to this sibling
      for (const id in this.sectionMap) {
        const section = this.sectionMap[id];
        if (section.children.some(child => child.id === siblingId)) {
          return section; // Return the sibling's parent
        }
      }
    }
    
    // If no appropriate list item parent found, return the enclosing section
    return this.findSectionForLine(lineIndex);
  }

  /**
   * Check if a line is a list item
   * @param line Line to check
   * @returns Information about the list item
   */
  private isListItem(line: string): { isItem: boolean; level: number } {
    const match = line.match(/^(\s*)[*+-]\s/);
    if (match) {
      const indentation = match[1].length;
      // More accurate indentation calculation - count 2 or 4 spaces as one level
      return { 
        isItem: true, 
        level: indentation === 0 ? 0 : Math.ceil(indentation / 2)
      };
    }
    return { isItem: false, level: 0 };
  }

  /**
   * Find the appropriate parent section for a new section with the given level
   * @param level Section level
   * @returns Parent section
   */
  private findParentForSection(level: number): SectionDisplay | null {
    if (level === 1) {
      return this.rootSection;
    }
    
    // Look for nearest higher-level section that appears before this line
    let bestMatch: SectionDisplay | null = this.rootSection;
    
    for (const id in this.sectionMap) {
      const section = this.sectionMap[id];
      
      if (section.level < level && section.type === 'section' && 
          (bestMatch === this.rootSection || section.level > bestMatch.level)) {
        bestMatch = section;
      }
    }
    
    return bestMatch;
  }

  /**
   * Find which section a line belongs to
   * @param lineIndex The line index to check
   * @returns The section containing this line
   */
  private findSectionForLine(lineIndex?: number): SectionDisplay | null {
    const lineToCheck = lineIndex !== undefined ? lineIndex : this.lastAnalyzedLine;
    
    // Find the most specific section that contains this line
    let bestMatch: SectionDisplay | null = this.rootSection;
    let bestMatchLineNumber = 0;
    
    for (const id in this.sectionMap) {
      if (id === 'root') continue;
      
      const section = this.sectionMap[id];
      
      if (section.type === 'section') {
        const sectionStartLine = this.sectionStartLines[id];
        
        if (sectionStartLine <= lineToCheck && sectionStartLine > bestMatchLineNumber) {
          bestMatch = section;
          bestMatchLineNumber = sectionStartLine;
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Update the content of all sections
   */
  private updateSectionContent(): void {
    // Sort section IDs by start line for proper processing
    const sortedSectionIds = Object.keys(this.sectionStartLines)
      .filter(id => id !== 'root')
      .sort((a, b) => this.sectionStartLines[a] - this.sectionStartLines[b]);
    
    // Calculate section content based on start and end lines
    for (let i = 0; i < sortedSectionIds.length; i++) {
      const sectionId = sortedSectionIds[i];
      const section = this.sectionMap[sectionId];
      
      if (section.type !== 'section') continue;
      
      const startLine = this.sectionStartLines[sectionId];
      let endLine: number;
      
      // Determine where this section ends
      if (i < sortedSectionIds.length - 1) {
        const nextSection = this.sectionMap[sortedSectionIds[i + 1]];
        
        // If the next section is at the same or higher level, this section ends there
        if (nextSection.type === 'section' && nextSection.level <= section.level) {
          endLine = this.sectionStartLines[sortedSectionIds[i + 1]] - 1;
        } else {
          // Otherwise continue to include content
          endLine = this.lines.length - 1;
        }
      } else {
        // Last section includes everything to the end
        endLine = this.lines.length - 1;
      }
      
      // Extract content lines for this section
      const sectionLines = this.lines.slice(startLine, endLine + 1);
      section.content = sectionLines.join('\n');
    }
    
    // Update root section to contain the entire document
    this.rootSection.content = this.text;
  }

  /**
   * Get the current state of the section updater
   * @returns Current section state
   */
  public getState(): SectionState {
    return {
      currentText: this.text,
      sections: this.sectionMap,
      currentSection: this.currentSection,
      currentLineNumber: this.lastAnalyzedLine
    };
  }

  /**
   * Get the full text content
   * @returns Current text
   */
  public getText(): string {
    return this.text;
  }

  /**
   * Get all sections
   * @returns Map of all sections
   */
  public getSections(): Record<string, SectionDisplay> {
    return this.sectionMap;
  }

  /**
   * Get current active section
   * @returns Current section or null
   */
  public getCurrentSection(): SectionDisplay | null {
    return this.currentSection;
  }
}