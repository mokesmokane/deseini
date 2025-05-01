import { stream } from '../stream';

// Example response text from the server - the full ProjectPlan block
const testProjectPlan = `Thank you for providing all the necessary information. Based on your notes, here is your project plan:

Thank you for providing all the necessary information. Based on your notes, here is your project plan:

\`\`\`ProjectPlan
# Timescales
- Project duration: 6 months
- Key milestones at concept development, prototyping, user testing, and launch
- Launch deadline: End of Month 6

- Interim reviews at Months 2 (concept approval), 4 (prototype completion), and 5 (marketing prep)

# Scope
- Includes:
  - Design and development of modular DIY furniture kits
  - Creation of interchangeable components
  - Development of clear, illustrated assembly instructions
  - A range of finishes and accessory options
  - Prototyping of at least two core furniture pieces (shelving unit, table system)
  - Materials research with focus on eco-friendly options
  - Marketing collateral for DIY communities
- Excludes:
  - Mass manufacturing setup
  - Distribution logistics
  - Post-launch customer support infrastructure

# Tasks
- Concept Development
  - Brainstorm modular system features
  - Create initial sketches and configuration diagrams
- Material Research & Specification
  - Source eco-friendly materials
  - Compile component specification sheets
- Product Design & Engineering
  - Develop CAD models for core furniture pieces
  - Engineer interchangeable component interfaces
- Prototyping
  - Build prototypes for shelving unit and table system
  - Conduct internal testing for assembly and durability
- Instructional Content Creation
  - Draft and illustrate step-by-step assembly guides
  - Prepare customization catalog (finishes, colors, add-ons)
- Marketing Preparation
  - Stage product photography and lifestyle renders
  - Develop launch plan and marketing collateral

# Milestones
- Concept approval (End of Month 2)
- Material selection finalized (Mid Month 3)
- Prototype completion (End of Month 4)
- Assembly guide and customization catalog ready (Mid Month 5)
- Marketing collateral complete (End of Month 5)
- Launch (End of Month 6)

# Roles
- Product Designer: Oversees concept, sketches, modular configurations, and customization options
- Mechanical Engineer: Leads technical design, CAD modeling, engineering of modular interfaces
- Materials Specialist: Sources and specifies eco-friendly, durable materials
- Instructional Designer: Creates illustrated assembly guides and user-facing documentation
- Marketing Manager: Develops launch plan, marketing materials, and engages DIY communities

# Dependencies
- Availability and sourcing of sustainable materials
- Timely completion of CAD designs and prototypes
- Coordination between design, engineering, and instructional teams
- Access to professional photography and rendering resources

# Deliverables
- Initial concept sketches and modular configuration diagrams
- Material/component specification sheet (with sustainable options)
- Prototyping plan and completed prototypes for two core pieces
- Illustrated user assembly guide
- Customization options catalog (finishes, add-ons)
- Product photography and lifestyle renders
- Launch plan and marketing collateral for DIY audiences
\`\`\`  
`;

/**
 * Creates SSE-formatted chunks from a string by splitting into chunks of specified size
 * @param text The text to chunk
 * @param chunkSize Size of each chunk in characters
 * @returns Array of SSE-formatted chunks as Uint8Array
 */
function createSSEChunks(text: string, chunkSize: number): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.substring(i, i + chunkSize);
    // Format as SSE data event just like the server would
    const sseData = `data: ${JSON.stringify({ chunk })}\n\n`;
    chunks.push(new TextEncoder().encode(sseData));
  }
  
  return chunks;
}

describe('stream utility', () => {
  it('should correctly detect and extract ProjectPlan code blocks', async () => {
    // Create SSE formatted chunks from the test data - as sent by the server
    const chunks = createSSEChunks(testProjectPlan, 20); // 20 characters per chunk
    
    // Create a mock reader
    let chunkIndex = 0;
    const mockReader = {
      read: async () => {
        if (chunkIndex < chunks.length) {
          return { done: false, value: chunks[chunkIndex++] };
        } else {
          return { done: true, value: undefined };
        }
      },
      cancel: () => Promise.resolve(),
    };
    
    // Process with our stream utility
    const { mainStream, codeBlockStreams } = stream(
      mockReader as ReadableStreamDefaultReader<Uint8Array>,
      ["projectplan", "ProjectPlan"] // Try both lowercase and proper case
    );
    
    // Verify the main stream works
    const mainReader = mainStream.getReader();
    let mainContent = '';
    
    while (true) {
      const { done, value } = await mainReader.read();
      if (done) break;
      mainContent += value;
    }
    
    // Verify we got the full content
    expect(mainContent).toContain('Thank you for providing all the necessary information');
    expect(mainContent).toContain('# Timescales');
    
    // Check if we correctly detected the code block
    expect(Object.keys(codeBlockStreams)).toContain('projectplan');
    
    // If we have a projectplan stream, read from it
    const projectPlanReader = codeBlockStreams.projectplan.getReader();
    let projectPlanContent = '';
    
    while (true) {
      const { done, value } = await projectPlanReader.read();
      if (done) break;
      projectPlanContent += value;
    }
    
    // Verify the code block content was extracted correctly
    expect(projectPlanContent).toContain('# Timescales');
    expect(projectPlanContent).toContain('# Scope');
    expect(projectPlanContent).toContain('# Tasks');
    expect(projectPlanContent).toContain('# Roles');
    expect(projectPlanContent).toContain('# Dependencies');
    expect(projectPlanContent).toContain('# Deliverables');
    
    // Print the actual content for debugging
    console.log('Main content length:', mainContent.length);
    console.log('Project plan content length:', projectPlanContent.length);
    console.log('Project plan content sample:', projectPlanContent.substring(0, 100));
  });
});
