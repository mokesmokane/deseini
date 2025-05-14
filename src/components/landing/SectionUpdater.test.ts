import { SectionUpdater } from './SectionUpdater';
import { describe, expect, test } from 'vitest';


const MNARKDOWN_TO_TEST = `# Timescales
- Project duration: 6 months
- No specific milestone dates provided yet
- Deadline for initial beta release to fall within 6-month window
# Scope
- Mobile application for personalized, AI-driven workout routines
- Features: AI-driven coaching, real-time exercise guidance, performance tracking, motivational support
- Audience: Beginners to intermediate fitness enthusiasts
- Supported platforms: iOS & Android
- Scope boundaries: No explicit exclusions discussed yet
# Tasks
- Define user personas and create journey maps
- Design high-fidelity wireframes and interactive prototypes
- Develop AI-powered workout recommendation engine
    - Integrate user progress and feedback mechanisms
    - Tailor plans to user preferences and results
- Develop in-app real-time coaching functionality
    - Audio, video, and text-based guidance
- Build progress analytics dashboard
- Produce and curate comprehensive exercise video library
    - Write/descriptions for exercises
- Conduct beta testing (via TestFlight/Google Play Beta)
    - Collect and analyze user feedback
    - Iterate based on findings
# Milestones
- Completion of user personas and journey maps
- Delivery of wireframes and prototypes
- AI engine MVP complete
- Launch of exercise/video content library
- Initial beta release on both platforms
- Feedback report and plan for iteration
# Roles
- Product Manager: Project oversight, roadmap, stakeholder coordination
- Mobile App Developer (iOS & Android): Build, release, and maintain app
- AI/ML Engineer: Develop and optimize recommendation engine
- UI/UX Designer: Design user flows, interfaces, and prototypes
- Fitness Content Specialist: Develop routines, create/curate video content
# Dependencies
- Availability of high-quality exercise video content
- AI/ML model training data
- Access to beta-testing cohorts
- App store approvals for beta access
# Deliverables
- User Personas and Journey Maps
- Wireframes and Interactive Prototypes
- AI-Powered Workout Recommendation Engine
- In-App Real-Time Coaching (audio/video/text)
- Progress Analytics Dashboard
- Library of Exercise Videos and Descriptions
- Initial Beta Release (TestFlight/Google Play Beta)
- User Feedback Report and Iteration Plan`;

describe('SectionUpdater', () => {
  // Helper function to create a simple updater with test markdown
  const createUpdaterWithMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const updater = new SectionUpdater();
    updater.processNewLines(lines);
    return updater;
  };

  describe('basic functionality', () => {
    test('initializes with empty state', () => {
      const updater = new SectionUpdater();
      const state = updater.getState();
      
      expect(state.currentText).toBe('');
      expect(Object.keys(state.sections)).toContain('root');
      expect(state.currentSection).toBeNull();
      expect(state.currentLineNumber).toBe(-1);
    });

    test('processes simple markdown with headers', () => {
      const markdown = '# Header 1\nContent 1\n## Header 2\nContent 2';
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Should have 3 sections: root, Header 1, and Header 2
      expect(Object.keys(sections).length).toBe(3);
    });
  });

  describe('section identification', () => {
    test('identifies sections by header level', () => {
      const markdown = '# Header 1\n## Subheader 1\n# Header 2';
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Find the sections (excluding root)
      const sectionValues = Object.values(sections).filter(s => s.id !== 'root');
      
      expect(sectionValues.length).toBe(3);
      expect(sectionValues.filter(s => s.level === 1).length).toBe(2); // Two level 1 headers
      expect(sectionValues.filter(s => s.level === 2).length).toBe(1); // One level 2 header
    });
  });

  describe('list item handling', () => {
    test('identifies list items correctly', () => {
      const markdown = '# Section\n- Item 1\n- Item 2\n  - Subitem 1\n  - Subitem 2';
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Find all list items
      const listItems = Object.values(sections).filter(s => s.type === 'list');
      
      expect(listItems.length).toBe(4); // Should have 4 list items
      
      // This test might fail with the current implementation due to the bug
      // Test will verify the issue exists
      const indentedItems = listItems.filter(item => item.content.includes('Subitem'));
      expect(indentedItems.length).toBe(2);
    });

    test('list items are siblings instead of nested incorrectly', () => {
      const markdown = '# Deliverables\n- Item 1\n- Item 2\n- Item 3';
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Find the section with title "Deliverables"
      const deliverablesSection = Object.values(sections).find(
        s => s.type === 'section' && s.title === 'Deliverables'
      );
      
      expect(deliverablesSection).toBeDefined();
      
      if (deliverablesSection) {
        // Should have 3 direct children (the list items)
        expect(deliverablesSection.children.length).toBe(3);
        
        // In the buggy implementation, they might be nested as children of each other
        // rather than siblings
        const firstItem = deliverablesSection.children[0];
        
        // This test will fail with the current implementation due to the bug
        // It verifies the issue exists
        expect(firstItem.children.length).toBe(0);
      }
    });
  });

  describe('content isolation', () => {
    test('sections should contain only their own content, not the entire document', () => {
      const markdown = '# Section 1\nContent for section 1\n# Section 2\nContent for section 2';
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Find section 1 and section 2
      const sectionValues = Object.values(sections).filter(s => s.id !== 'root');
      const section1 = sectionValues.find(s => s.title === 'Section 1');
      const section2 = sectionValues.find(s => s.title === 'Section 2');
      
      expect(section1).toBeDefined();
      expect(section2).toBeDefined();
      
      if (section1 && section2) {
        // This test will fail with the current implementation due to the bug
        // It verifies the issue exists
        expect(section1.content).not.toEqual(section2.content);
        expect(section1.content).not.toContain('Section 2');
        expect(section2.content).not.toContain('Section 1');
      }
    });

    test('specific test for Deliverables section', () => {
      const markdown = `# Timescales
- Project duration: 6 months
# Scope
- Mobile application
# Deliverables
- User Personas and Journey Maps
- Wireframes and Interactive Prototypes`;
      
      const updater = createUpdaterWithMarkdown(markdown);
      const sections = updater.getSections();
      
      // Find the Deliverables section
      const deliverablesSection = Object.values(sections).find(
        s => s.type === 'section' && s.title === 'Deliverables'
      );
      
      expect(deliverablesSection).toBeDefined();
      
      if (deliverablesSection) {
        // This test will fail with the current implementation due to the bug
        // It verifies the issue exists
        expect(deliverablesSection.content).not.toContain('# Timescales');
        expect(deliverablesSection.content).not.toContain('# Scope');
        expect(deliverablesSection.content).toContain('# Deliverables');
        expect(deliverablesSection.content).toContain('- User Personas and Journey Maps');
      }
    });
  });

  describe('SectionUpdater with complex markdown', () => {
    test('correctly identifies all top-level sections', () => {
      const updater = createUpdaterWithMarkdown(MNARKDOWN_TO_TEST);
      const sections = updater.getSections();
      
      // Find all top-level sections (h1)
      const h1Sections = Object.values(sections).filter(s => 
        s.type === 'section' && s.level === 1 && s.id !== 'root'
      );
      
      // Should have 7 top-level sections (Timescales, Scope, Tasks, Milestones, Roles, Dependencies, Deliverables)
      expect(h1Sections.length).toBe(7);
      
      // Verify section titles
      const sectionTitles = h1Sections.map(s => s.title);
      expect(sectionTitles).toContain('Timescales');
      expect(sectionTitles).toContain('Scope');
      expect(sectionTitles).toContain('Tasks');
      expect(sectionTitles).toContain('Milestones');
      expect(sectionTitles).toContain('Roles');
      expect(sectionTitles).toContain('Dependencies');
      expect(sectionTitles).toContain('Deliverables');
    });

    test('properly isolates Deliverables section content', () => {
      const updater = createUpdaterWithMarkdown(MNARKDOWN_TO_TEST);
      const sections = updater.getSections();
      
      // Find the Deliverables section
      const deliverablesSection = Object.values(sections).find(
        s => s.type === 'section' && s.title === 'Deliverables'
      );
      
      expect(deliverablesSection).toBeDefined();
      
      if (deliverablesSection) {
        // The content should only include the Deliverables section, not other sections
        // These tests will initially fail with the current implementation
        expect(deliverablesSection.content).not.toContain('# Timescales');
        expect(deliverablesSection.content).not.toContain('# Scope');
        expect(deliverablesSection.content).not.toContain('# Tasks');
        
        // It should contain all the deliverables items
        expect(deliverablesSection.content).toContain('# Deliverables');
        expect(deliverablesSection.content).toContain('- User Personas and Journey Maps');
        expect(deliverablesSection.content).toContain('- Wireframes and Interactive Prototypes');
        expect(deliverablesSection.content).toContain('- AI-Powered Workout Recommendation Engine');
      }
    });

    test('correctly structures list items in Deliverables section as siblings', () => {
      const updater = createUpdaterWithMarkdown(MNARKDOWN_TO_TEST);
      const sections = updater.getSections();
      
      // Find the Deliverables section
      const deliverablesSection = Object.values(sections).find(
        s => s.type === 'section' && s.title === 'Deliverables'
      );
      
      expect(deliverablesSection).toBeDefined();
      
      if (deliverablesSection) {
        // Should have 8 direct children (the list items)
        // This will fail with the current implementation due to the nesting bug
        expect(deliverablesSection.children.length).toBe(8);
        
        // Check that each child is a list item
        for (const child of deliverablesSection.children) {
          expect(child.type).toBe('list');
        }
        
        // Verify the content of specific list items
        const listTexts = deliverablesSection.children.map(item => item.content);
        expect(listTexts).toContain('- User Personas and Journey Maps');
        expect(listTexts).toContain('- Wireframes and Interactive Prototypes');
        expect(listTexts).toContain('- AI-Powered Workout Recommendation Engine');
      }
    });

    test('correctly handles multi-level list items in Tasks section', () => {
      const updater = createUpdaterWithMarkdown(MNARKDOWN_TO_TEST);
      const sections = updater.getSections();
      
      // Find the Tasks section
      const tasksSection = Object.values(sections).find(
        s => s.type === 'section' && s.title === 'Tasks'
      );
      
      expect(tasksSection).toBeDefined();
      
      if (tasksSection) {
        // The Tasks section has several top-level list items
        expect(tasksSection.children.length).toBeGreaterThan(0);
        
        // Find the "Develop AI-powered workout recommendation engine" list item
        const aiEngineItem = tasksSection.children.find(
          item => item.content.includes('Develop AI-powered workout recommendation engine')
        );
        
        expect(aiEngineItem).toBeDefined();
        
        if (aiEngineItem) {
          // Debug all list items to find indented ones
          const allListItems = Object.values(sections).filter(s => s.type === 'list');
          
          // Look for items that should be children of the AI Engine item
          const integrateItem = allListItems.find(item => 
            item.content.includes('Integrate user progress')
          );
          const tailorItem = allListItems.find(item => 
            item.content.includes('Tailor plans')
          );
          
          
          
          // Check if these items are children of aiEngineItem
          if (integrateItem) {
            console.log('Is Integrate a child of AI Engine?', 
              aiEngineItem.children.some(child => child.id === integrateItem.id));
          }
          if (tailorItem) {
            console.log('Is Tailor a child of AI Engine?', 
              aiEngineItem.children.some(child => child.id === tailorItem.id));
          }
          
          // Debug AI Engine item's children
          console.log('AI Engine children:', aiEngineItem.children.map(c => c.content));
          
          // Should have sub-items
          // In the current buggy implementation, this might not be correctly structured
          expect(aiEngineItem.children.length).toBe(2);
          
          // Verify sub-item content
          const subItemTexts = aiEngineItem.children.map(item => item.content);
          expect(subItemTexts).toContain('    - Integrate user progress and feedback mechanisms');
          expect(subItemTexts).toContain('    - Tailor plans to user preferences and results');
        }
      }
    });

    test('identifies correct line numbers and sections', () => {
      const updater = createUpdaterWithMarkdown(MNARKDOWN_TO_TEST);
      const state = updater.getState();
      
      // Account for possible empty lines at the beginning or end
      expect(state.currentLineNumber).toBe(51);
      expect(state.currentSection).not.toBeNull();
      
      if (state.currentSection) {
        // Last section should be Deliverables since it's at the end of the markdown
        expect(state.currentSection.title).toBe('Deliverables');
      }
    });
  });
});
