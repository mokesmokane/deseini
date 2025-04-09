interface Section {
    id: string;
    level: number;
    start: number;
    end: number;
    contentStart: number;
    contentEnd: number;
    content: string[];
    children: Section[];
    parent: Section | null;
    type: 'section' | 'list';
    indentLevel?: number;
  }
  
  export class MarkdownSectionAnalyzer {
    private sections: Section[] = [];
    private lines: string[] = [];
    
    constructor(markdown: string) {
      this.lines = markdown.split('\n');
      this.analyze();
    }
  
    private isListItem(line: string): { isItem: boolean; level: number } {
      const match = line.match(/^(\s*)[*+-]\s/);
      if (match) {
        return { 
          isItem: true, 
          level: Math.floor(match[1].length / 2)
        };
      }
      return { isItem: false, level: 0 };
    }
  
    private analyze() {
      const rootSection: Section = {
        id: 'root',
        level: 0,
        start: 0,
        end: this.lines.length - 1,
        contentStart: 0,
        contentEnd: this.lines.length - 1,
        content: [],
        children: [],
        parent: null,
        type: 'section'
      };
  
      let currentSection = rootSection;
      const sectionStack: Section[] = [rootSection];
      let currentListItem: Section | null = null;
      let listStack: Section[] = [];
  
      this.lines.forEach((line, index) => {
        const headerMatch = line.match(/^(#{1,6}) (.+)/);
        const { isItem, level: listLevel } = this.isListItem(line);
        
        if (headerMatch) {
          const level = headerMatch[1].length;
          const id = `section-${index}`;
          
          if (sectionStack.length > 1) {
            const currentTop = sectionStack[sectionStack.length - 1];
            currentTop.contentEnd = index - 1;
          }
  
          while (sectionStack.length > 1 && sectionStack[sectionStack.length - 1].level >= level) {
            sectionStack[sectionStack.length - 1].end = index - 1;
            sectionStack.pop();
          }
  
          const newSection: Section = {
            id,
            level,
            start: index,
            end: this.lines.length - 1,
            contentStart: index + 1,
            contentEnd: this.lines.length - 1,
            content: [line],
            children: [],
            parent: sectionStack[sectionStack.length - 1],
            type: 'section'
          };
  
          sectionStack[sectionStack.length - 1].children.push(newSection);
          sectionStack.push(newSection);
          currentSection = newSection;
          this.sections.push(newSection);
          
          currentListItem = null;
          listStack = [];
        } else if (isItem) {
          const id = `list-${index}`;
          
          while (listStack.length > 0 && listStack[listStack.length - 1].indentLevel! >= listLevel) {
            listStack[listStack.length - 1].end = index - 1;
            listStack.pop();
          }
  
          const newListItem: Section = {
            id,
            level: 1,
            start: index,
            end: this.lines.length - 1,
            contentStart: index,
            contentEnd: index,
            content: [line],
            children: [],
            parent: listStack.length > 0 ? listStack[listStack.length - 1] : currentSection,
            type: 'list',
            indentLevel: listLevel
          };
  
          if (listStack.length > 0) {
            listStack[listStack.length - 1].children.push(newListItem);
          } else {
            currentSection.children.push(newListItem);
          }
  
          listStack.push(newListItem);
          currentListItem = newListItem;
          this.sections.push(newListItem);
        } else {
          if (currentListItem) {
            currentListItem.content.push(line);
          } else {
            currentSection.content.push(line);
          }
        }
      });
  
      while (sectionStack.length > 1) {
        const section = sectionStack[sectionStack.length - 1];
        section.end = this.lines.length - 1;
        section.contentEnd = Math.min(
          section.contentEnd,
          section.children.length > 0 ? section.children[0].start - 1 : this.lines.length - 1
        );
        sectionStack.pop();
      }
  
      this.sections.forEach(section => {
        if (section.children.length > 0) {
          section.contentEnd = section.children[0].start - 1;
        }
      });
  
      while (listStack.length > 0) {
        listStack[listStack.length - 1].end = this.lines.length - 1;
        listStack.pop();
      }
    }
  
    public getLineInfo(lineNumber: number): { 
      sections: Section[],
      isHeader: boolean,
      headerLevel?: number,
      isContent: boolean,
      isList: boolean,
      listLevel?: number
    } {
      const line = this.lines[lineNumber];
      const headerMatch = line?.match(/^(#{1,6}) /);
      const { isItem, level } = this.isListItem(line || '');
      
      const containingSections = this.sections.filter(
        section => lineNumber >= section.start && lineNumber <= section.end
      );
  
      const isContent = containingSections.some(
        section => lineNumber >= section.contentStart && lineNumber <= section.contentEnd
      );
  
      return {
        sections: containingSections,
        isHeader: !!headerMatch,
        headerLevel: headerMatch ? headerMatch[1].length : undefined,
        isContent,
        isList: isItem,
        listLevel: isItem ? level : undefined
      };
    }
  
    public getAllLines(): string[] {
      return this.lines;
    }
  
    public getSectionById(id: string): Section | undefined {
      return this.sections.find(s => s.id === id);
    }
  
    public getSectionContent(section: Section): string[] {
      return this.lines.slice(section.contentStart, section.contentEnd + 1);
    }
  }