/**
 * Simple section processor that identifies top-level markdown sections
 * Much simpler than the original SectionUpdater
 */

// Basic section data structure
export interface SectionData {
  id: string;
  title: string;
  sectionIndex: number | null;
  content: string;
  updatedAt: Date;
}

// Process update event to notify consumers
export interface ProcessUpdateEvent {
  section?: SectionData; // The individual section that was updated
  currentSectionId: string | null;
}

// Callback for stream processing updates
export type ProcessUpdateCallback = (update: ProcessUpdateEvent) => void;

export class SimpleSectionProcessor {
  private sections: SectionData[] = [];
  private currentLineBuffer: string[] = [];
  private lastSectionId: string | null = null;

  constructor() {
    this.reset();
  }

  /**
   * Reset the processor state
   */
  public reset(): void {
    this.sections = [];
    this.currentLineBuffer = [];
    this.lastSectionId = null;
  }

  /**
   * Process a reader stream directly with callbacks for updates
   * @param lineReader - A ReadableStreamDefaultReader that yields lines
   * @param onUpdate - Callback function called on each significant update
   * @returns Promise that resolves when processing is complete
   */
  public async processStream(
    lineReader: ReadableStreamDefaultReader<string>,
    onUpdate: ProcessUpdateCallback
  ): Promise<SectionData[]> {
    let reading = true;
  
    while (reading) {
      const { done, value } = await lineReader.read();
      
      if (done) {
        reading = false;
        // Process any remaining content in the buffer
        const finalSection = this.processLineBuffer();
        
        // Final update if we have a section from the buffer
        if (finalSection) {
          onUpdate({
            section: finalSection,
            currentSectionId: this.lastSectionId
          });
        }
        break;
      }
      
      if (!value) continue;
      
      // Process this line
      const currentSectionId = this.processLine(value);
      
      // Get the current section that was updated
      let updatedSection: SectionData | undefined;
      
      if (currentSectionId) {
        updatedSection = this.getSectionById(currentSectionId);
      }
      
      // Only call the update callback if we have an updated section
      if (updatedSection) {
        // Call the update callback with the single updated section
        onUpdate({
          section: updatedSection,
          currentSectionId
        });
      }
    }
    
    return this.sections;
  }

  /**
   * Process a batch of lines
   * @param lines - Array of markdown lines to process
   * @returns The updated sections
   */
  public processLines(lines: string[]): SectionData[] {
    for (const line of lines) {
      this.processLine(line);
    }
    // Process any remaining content in the buffer
    this.processLineBuffer();
    return this.sections;
  }

  /**
   * Process a single line
   * @param line - A line of markdown text
   * @returns The current section ID
   * @throws Error if a duplicate section title is encountered
   */
  public processLine(line: string): string | null {
    // Check if this is a top-level section header
    const headerMatch = line.match(/^(#)\s+(.+)$/);
    
    if (headerMatch && headerMatch[1] === '#') {
      // This is a new top-level section - process any content we've accumulated
      this.processLineBuffer();
      
      // Start a new section
      const title = headerMatch[2].trim();
      const id = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Check for duplicate section names/IDs
      const existingSection = this.sections.find(section => section.id === id);
      if (existingSection) {
        throw new Error(`Duplicate section title detected: "${title}". Section titles must be unique.`);
      }
      
      this.currentLineBuffer = [line]; // Start with the header line
      
      // Add new section
      const newSection: SectionData = {
        id,
        title,
        sectionIndex: this.sections.length, // Index based on current array length
        content: line,
        updatedAt: new Date()
      };
      
      this.sections.push(newSection);
      this.lastSectionId = id;
    } else {
      // Just add to the current buffer
      this.currentLineBuffer.push(line);
      
      // If we have at least one section, update its content for live preview
      if (this.sections.length > 0) {
        const currentSection = this.sections[this.sections.length - 1];
        currentSection.content = this.currentLineBuffer.join('\n');
      }
    }
    
    return this.lastSectionId;
  }

  /**
   * Process the current line buffer and update sections
   */
  private processLineBuffer(): SectionData | null {
    if (this.currentLineBuffer.length === 0) return null;
    
    // If we don't have a section yet but have content, create a default section
    if (this.sections.length === 0) {
      const id = `section-${Date.now()}-0`;
      const content = this.currentLineBuffer.join('\n');
      
      const newSection: SectionData = {
        id,
        title: 'Introduction', // Default title
        sectionIndex: 0,
        content,
        updatedAt: new Date()
      };
      
      this.sections.push(newSection);
      this.lastSectionId = id;
    } else {
      // Update the content of the most recent section
      const currentSection = this.sections[this.sections.length - 1];
      currentSection.content = this.currentLineBuffer.join('\n');
    }
    
    // Clear the buffer for the next section
    this.currentLineBuffer = [];
    
    // Return the last section
    return this.sections[this.sections.length - 1];
  }

  /**
   * Get all processed sections
   */
  public getSections(): SectionData[] {
    return [...this.sections];
  }

  /**
   * Get a section by ID
   */
  public getSectionById(id: string): SectionData | undefined {
    return this.sections.find(section => section.id === id);
  }

  /**
   * Extract a title from section content
   */
  public static extractTitleFromContent(content: string): string | null {
    const match = content.match(/^#+\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }
}
