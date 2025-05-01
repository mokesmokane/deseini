import { SimpleSectionProcessor } from './SimpleSectionProcessor';

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

describe('SimpleSectionProcessor', () => {
  let processor: SimpleSectionProcessor;

  beforeEach(() => {
    processor = new SimpleSectionProcessor();
  });

  describe('Core functionality tests', () => {
    test('creates a default section for content without headers', () => {
      const content = ['This is some content', 'without any headers', 'just plain text'];
      
      processor.processLines(content);
      const sections = processor.getSections();
      
      expect(sections.length).toBe(1);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[0].content).toBe('This is some content\nwithout any headers\njust plain text');
    });

    test('creates a new section when encountering a top-level header', () => {
      const content = [
        'Some initial content',
        '# First Section', 
        'Content for first section', 
        '# Second Section', 
        'Content for second section'
      ];
      
      processor.processLines(content);
      const sections = processor.getSections();
      
      expect(sections.length).toBe(3);
      expect(sections[0].title).toBe('Introduction');
      expect(sections[1].title).toBe('First Section');
      expect(sections[2].title).toBe('Second Section');
      
      expect(sections[0].content).toBe('Some initial content');
      expect(sections[1].content).toBe('# First Section\nContent for first section');
      expect(sections[2].content).toBe('# Second Section\nContent for second section');
    });

    test('only creates sections for top-level headers (# not ##)', () => {
      const content = [
        '# Top Level', 
        'Some content',
        '## Second Level', 
        'More content',
        '### Third Level',
        'Even more content'
      ];
      
      processor.processLines(content);
      const sections = processor.getSections();
      
      expect(sections.length).toBe(1);
      expect(sections[0].title).toBe('Top Level');
      expect(sections[0].content).toBe(
        '# Top Level\nSome content\n## Second Level\nMore content\n### Third Level\nEven more content'
      );
    });
  });

  describe('Project plan tests using real markdown', () => {
    test('correctly identifies all top-level sections in project plan', () => {
      // Split the markdown into lines
      const lines = MNARKDOWN_TO_TEST.split('\n');
      
      // Process the lines
      processor.processLines(lines);
      const sections = processor.getSections();
      
      // We expect 7 top-level sections based on the markdown
      expect(sections.length).toBe(7);
      
      // Verify each section title
      const expectedTitles = [
        'Timescales',
        'Scope',
        'Tasks',
        'Milestones',
        'Roles',
        'Dependencies',
        'Deliverables'
      ];
      
      sections.forEach((section, index) => {
        expect(section.title).toBe(expectedTitles[index]);
      });
    });

    test('preserves content including nested lists in each section', () => {
      const lines = MNARKDOWN_TO_TEST.split('\n');
      processor.processLines(lines);
      const sections = processor.getSections();
      
      // Check specific content markers
      const scopeSection = sections[1]; // Scope is second section
      expect(scopeSection.content).toContain('Mobile application for personalized');
      expect(scopeSection.content).toContain('Supported platforms: iOS & Android');
      
      const tasksSection = sections[2]; // Tasks is third section
      expect(tasksSection.content).toContain('Define user personas');
      expect(tasksSection.content).toContain('Integrate user progress');  // Verify nested list content
      expect(tasksSection.content).toContain('Tailor plans to user preferences');  // Verify nested list content
    });

    test('handles line-by-line processing the same as batch processing', () => {
      const lines = MNARKDOWN_TO_TEST.split('\n');
      
      // Process all lines at once
      const batchProcessor = new SimpleSectionProcessor();
      batchProcessor.processLines(lines);
      const batchResult = batchProcessor.getSections();
      
      // Process one line at a time
      const streamProcessor = new SimpleSectionProcessor();
      lines.forEach(line => streamProcessor.processLine(line));
      const streamResult = streamProcessor.getSections();
      
      // Compare results (ignoring IDs which are time-based)
      expect(streamResult.length).toBe(batchResult.length);
      
      for (let i = 0; i < streamResult.length; i++) {
        expect(streamResult[i].title).toBe(batchResult[i].title);
        expect(streamResult[i].content).toBe(batchResult[i].content);
      }
    });

    test('streaming updates reflect incremental content correctly', () => {
      const lines = MNARKDOWN_TO_TEST.split('\n');
      const milestoneHeaderIndex = lines.findIndex(line => line === '# Milestones');
      
      // Process lines up to Milestones
      const partialLines = lines.slice(0, milestoneHeaderIndex);
      processor.processLines(partialLines);
      
      // At this point, we should have 3 sections: Timescales, Scope, Tasks
      expect(processor.getSections().length).toBe(3);
      
      // Now add the Milestones header
      processor.processLine(lines[milestoneHeaderIndex]);
      expect(processor.getSections().length).toBe(4);
      
      // The 4th section should be Milestones with just the header
      const milestonesSection = processor.getSections()[3];
      expect(milestonesSection.title).toBe('Milestones');
      expect(milestonesSection.content).toBe('# Milestones');
      
      // Add a milestone item and verify content updates
      processor.processLine('- Completion of user personas and journey maps');
      expect(processor.getSections()[3].content).toBe('# Milestones\n- Completion of user personas and journey maps');
    });

    test('can extract the correct section by ID', () => {
      const lines = MNARKDOWN_TO_TEST.split('\n');
      processor.processLines(lines);
      const sections = processor.getSections();
      
      // Get the ID of the Roles section
      const rolesSection = sections.find(s => s.title === 'Roles');
      expect(rolesSection).toBeDefined();
      
      if (rolesSection) {
        // Now try to get this section by ID
        const sectionById = processor.getSectionById(rolesSection.id);
        expect(sectionById).toBeDefined();
        expect(sectionById?.title).toBe('Roles');
        expect(sectionById?.content).toContain('Product Manager');
      }
    });
  });

  describe('Extensive MNARKDOWN_TO_TEST suite', () => {
    let processor: SimpleSectionProcessor;
    let lines: string[];
    beforeEach(() => {
      processor = new SimpleSectionProcessor();
      lines = MNARKDOWN_TO_TEST.split('\n');
    });

    test('extracts all top-level sections with correct titles and order', () => {
      processor.processLines(lines);
      const sections = processor.getSections();
      expect(sections.length).toBe(7);
      const expectedTitles = [
        'Timescales',
        'Scope',
        'Tasks',
        'Milestones',
        'Roles',
        'Dependencies',
        'Deliverables'
      ];
      sections.forEach((section, idx) => {
        expect(section.title).toBe(expectedTitles[idx]);
      });
    });

    test('section IDs are unique, slugified, and match titles', () => {
      processor.processLines(lines);
      const sections = processor.getSections();
      const ids = new Set();
      sections.forEach(section => {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(ids.has(section.id)).toBe(false);
        ids.add(section.id);
        expect(section.id).toBe(section.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      });
    });

    test('section index is correct and sequential', () => {
      processor.processLines(lines);
      const sections = processor.getSections();
      sections.forEach((section, idx) => {
        expect(section.sectionIndex).toBe(idx);
      });
    });

    test('content of each section includes all expected lines and preserves nested lists', () => {
      processor.processLines(lines);
      const sections = processor.getSections();
      // Check a couple of sections for specific content
      expect(sections[1].content).toContain('Mobile application for personalized, AI-driven workout routines');
      expect(sections[1].content).toContain('Supported platforms: iOS & Android');
      expect(sections[2].content).toContain('Define user personas and create journey maps');
      expect(sections[2].content).toContain('Integrate user progress and feedback mechanisms');
      expect(sections[2].content).toContain('Tailor plans to user preferences and results');
      expect(sections[4].content).toContain('Product Manager: Project oversight, roadmap, stakeholder coordination');
      expect(sections[6].content).toContain('User Feedback Report and Iteration Plan');
    });

    test('throws error on duplicate section titles', () => {
      const dupLines = lines.concat(['# Tasks']);
      expect(() => processor.processLines(dupLines)).toThrow(/Duplicate section title/);
    });

    test('batch, line-by-line, and streaming processing produce consistent results', async () => {
      // Batch
      const batch = new SimpleSectionProcessor();
      batch.processLines(lines);
      const batchSections = batch.getSections();
      // Line-by-line
      const lineByLine = new SimpleSectionProcessor();
      lines.forEach(line => lineByLine.processLine(line));
      lineByLine.processLineBuffer();
      const lblSections = lineByLine.getSections();
      // Streaming
      const fakeReader = {
        idx: 0,
        read() {
          if (this.idx >= lines.length) return Promise.resolve({ done: true, value: undefined });
          return Promise.resolve({ done: false, value: lines[this.idx++] });
        }
      };
      const stream = new SimpleSectionProcessor();
      await stream.processStream(fakeReader as any, () => {});
      const streamSections = stream.getSections();
      // Compare
      expect(batchSections).toEqual(lblSections);
      expect(batchSections).toEqual(streamSections);
    });

    test('onUpdate emits correct creating state for each section during streaming', async () => {
      const fakeReader = {
        idx: 0,
        read() {
          if (this.idx >= lines.length) return Promise.resolve({ done: true, value: undefined });
          return Promise.resolve({ done: false, value: lines[this.idx++] });
        }
      };
      const updates: any[] = [];
      await processor.processStream(fakeReader as any, (update) => {
        updates.push({
          sectionTitle: update.section?.title,
          creating: update.creating
        });
      });
      // For each section, there should be creating:true at start and creating:false when finalized
      const expectedTitles = [
        'Timescales','Scope','Tasks','Milestones','Roles','Dependencies','Deliverables'
      ];
      expectedTitles.forEach(title => {
        expect(updates.find(u => u.sectionTitle === title && u.creating === true)).toBeTruthy();
        expect(updates.find(u => u.sectionTitle === title && u.creating === false)).toBeTruthy();
      });
    });
  });

  describe('Creating state tests', () => {
    test('onUpdate callback receives correct creating state during streaming', async () => {
      const markdown = `# Section One\nContent line 1\nContent line 2\n# Section Two\nContent line 3`;
      const lines = markdown.split('\n');
      // Simulate a ReadableStreamDefaultReader
      const fakeReader = {
        idx: 0,
        read() {
          if (this.idx >= lines.length) return Promise.resolve({ done: true, value: undefined });
          return Promise.resolve({ done: false, value: lines[this.idx++] });
        }
      };
      const processor = new SimpleSectionProcessor();
      const updates: any[] = [];
      await processor.processStream(fakeReader as any, (update) => {
        updates.push({
          sectionTitle: update.section?.title,
          creating: update.creating,
          currentSectionId: update.currentSectionId
        });
      });
      // Should toggle creating true on header, false after section ends
      // Find first update for Section One (should be creating: true)
      const sectionOneCreate = updates.find(u => u.sectionTitle === 'Section One' && u.creating === true);
      expect(sectionOneCreate).toBeTruthy();
      // Find last update for Section One (should be creating: false)
      const sectionOneDone = updates.reverse().find(u => u.sectionTitle === 'Section One' && u.creating === false);
      expect(sectionOneDone).toBeTruthy();
      // Find update for Section Two (should be creating: true at start)
      const sectionTwoCreate = updates.find(u => u.sectionTitle === 'Section Two' && u.creating === true);
      expect(sectionTwoCreate).toBeTruthy();
      // Section Two should also get a creating: false at the end
      const sectionTwoDone = updates.find(u => u.sectionTitle === 'Section Two' && u.creating === false);
      expect(sectionTwoDone).toBeTruthy();
    });

    test('creating state is false after all processing', async () => {
      const markdown = `# Section A\nAlpha\n# Section B\nBeta`;
      const lines = markdown.split('\n');
      const fakeReader = {
        idx: 0,
        read() {
          if (this.idx >= lines.length) return Promise.resolve({ done: true, value: undefined });
          return Promise.resolve({ done: false, value: lines[this.idx++] });
        }
      };
      const processor = new SimpleSectionProcessor();
      let lastCreating = true;
      await processor.processStream(fakeReader as any, (update) => {
        lastCreating = update.creating;
      });
      expect(lastCreating).toBe(false);
    });
  });

  // Utility function tests
  describe('Utility functions', () => {
    test('correctly extracts titles from section content', () => {
      expect(SimpleSectionProcessor.extractTitleFromContent('# My Title')).toBe('My Title');
      expect(SimpleSectionProcessor.extractTitleFromContent('Content without title')).toBeNull();
      expect(SimpleSectionProcessor.extractTitleFromContent('# Title with **markdown**')).toBe('Title with **markdown**');
      expect(SimpleSectionProcessor.extractTitleFromContent('Text\n# Title on second line')).toBe('Title on second line');
    });
  
    test('reset clears all sections and state', () => {
      const lines = MNARKDOWN_TO_TEST.split('\n');
      processor.processLines(lines);
      expect(processor.getSections().length).toBe(7);
      
      processor.reset();
      expect(processor.getSections().length).toBe(0);
    });
  });
});
