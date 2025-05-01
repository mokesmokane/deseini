/**
 * Simple section processor that identifies top-level markdown sections
 * Much simpler than the original SectionUpdater
 */

import {ProcessUpdateEvent, SectionData, UpdateState, SectionUpdateState} from "./types"


export type ProcessUpdateCallback = (update: ProcessUpdateEvent) => void;

export class SimpleSectionProcessor {
  private sections: SectionData[] = [];
  private currentLineBuffer: string[] = [];
  private lastSectionId: string | null = null;
  private isCreatingSection: boolean = false;
  private updateState: UpdateState = { sectionUpdateStates: [] };

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
    this.isCreatingSection = false;
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
    let prevSectionId: string | null = null;
    while (reading) {
      const { done, value } = await lineReader.read();
      
      if (done) {
        reading = false;
        // Process any remaining content in the buffer
        const finalSection = this.processLineBuffer();
        this.isCreatingSection = false;
        // Final update if we have a section from the buffer
        if (finalSection) {
          this.setSectionState(finalSection.id, 'created');
          onUpdate({
            section: finalSection,
            updateState: this.updateState,
            currentSectionId: this.lastSectionId,
            creating: this.isCreatingSection
          });
        }
        break;
      }
      
      if (!value) continue;
      
      // Before processing the new line, check if it is a header and if so, emit creating=false for the previous section
      const isHeader = value.match(/^(#)\s+(.+)$/);
      if (isHeader && this.sections.length > 0) {
        // Emit update for previous section with creating=false
        const prevSection = this.sections[this.sections.length - 1];
        this.setSectionState(prevSection.id, 'created');
        onUpdate({
          section: prevSection,
          updateState: this.updateState,
          currentSectionId: prevSection.id,
          creating: false
        });
      }
      // Process this line
      const currentSectionId = this.processLine(value);
      // Get the current section that was updated
      let updatedSection: SectionData | undefined;
      if (currentSectionId) {
        updatedSection = this.getSectionById(currentSectionId);
        // If this is a header, mark as creating
        if (isHeader && updatedSection) {
          this.setSectionState(updatedSection.id, 'creating');
        }
      }
      // Only call the update callback if we have an updated section
      if (updatedSection) {
        // Call the update callback with the single updated section
        onUpdate({
          section: updatedSection,
          updateState: this.updateState,
          currentSectionId,
          creating: this.isCreatingSection
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
      this.isCreatingSection = true;
      
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
  public processLineBuffer(): SectionData | null {
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
    this.isCreatingSection = false;
    // Clear the line buffer
    this.currentLineBuffer = [];
    // Return the last section updated
    return this.sections.length > 0 ? this.sections[this.sections.length - 1] : null;
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

  private setSectionState(sectionId: string, state: SectionUpdateState['state']) {
    // Remove any previous state for this section
    this.updateState.sectionUpdateStates = this.updateState.sectionUpdateStates.filter(s => s.sectionId !== sectionId);
    // Add the new state
    this.updateState.sectionUpdateStates.push({ sectionId, state });
  }
}
