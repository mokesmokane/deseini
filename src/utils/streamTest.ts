/**
 * Test utility for the streaming functionality
 */

import { streamToStreams } from './stream';

// Example response text from the server - the full ProjectPlan block
const testProjectPlan = `Thank you for providing all the necessary information. Based on your notes, here is your project plan:

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

// Function to simulate streaming the response in chunks
export async function simulateStreamingTest() {
  console.log("Starting streaming test...");

  // Create a mock reader that will provide chunks of the test data
  const mockChunks: Uint8Array[] = [];
  
  // Break the test plan into smaller chunks (simulating streaming)
  const chunkSize = 10; // Characters per chunk
  for (let i = 0; i < testProjectPlan.length; i += chunkSize) {
    const chunk = testProjectPlan.substring(i, i + chunkSize);
    mockChunks.push(new TextEncoder().encode(chunk));
  }
  
  // Create a mock reader
  let chunkIndex = 0;
  const mockReader = {
    read: async () => {
      if (chunkIndex < mockChunks.length) {
        return { done: false, value: mockChunks[chunkIndex++] };
      } else {
        return { done: true, value: undefined };
      }
    },
    cancel: () => Promise.resolve(),
  };
  
  // Process with our stream utility
  const { mainStream, codeBlockStreams } = streamToStreams(
    mockReader as ReadableStreamDefaultReader<Uint8Array>,
    ["projectplan", "ProjectPlan"] // Test with both lowercase and proper case
  );
  
  // Check if we have a projectplan stream
  console.log("Code block streams available:", Object.keys(codeBlockStreams));
  const projectPlanExists = "projectplan" in codeBlockStreams;
  const projectPlanProperExists = "ProjectPlan" in codeBlockStreams;
  
  console.log(`projectplan stream exists: ${projectPlanExists}`);
  console.log(`ProjectPlan stream exists: ${projectPlanProperExists}`);
  
  // Read from the main stream
  const mainReader = mainStream.getReader();
  console.log("Reading from main stream:");
  let mainContent = '';
  
  try {
    while (true) {
      const { done, value } = await mainReader.read();
      if (done) break;
      mainContent += value;
      console.log(`Main stream chunk (${value.length} chars)`);
    }
    console.log("Main stream complete, content length:", mainContent.length);
  } catch (error) {
    console.error("Error reading main stream:", error);
  }
  
  // If we have a projectplan stream, read from it
  if (projectPlanExists) {
    const projectPlanReader = codeBlockStreams["projectplan"].getReader();
    console.log("Reading from projectplan stream:");
    let projectPlanContent = '';
    
    try {
      while (true) {
        const { done, value } = await projectPlanReader.read();
        if (done) break;
        projectPlanContent += value;
        console.log(`projectplan stream chunk (${value.length} chars): ${value.substring(0, 30)}...`);
      }
      console.log("projectplan stream complete, content length:", projectPlanContent.length);
      console.log("Content sample:", projectPlanContent.substring(0, 100) + "...");
    } catch (error) {
      console.error("Error reading projectplan stream:", error);
    }
  }
  
  // If we have a ProjectPlan stream, read from it too
  if (projectPlanProperExists) {
    const projectPlanReader = codeBlockStreams["ProjectPlan"].getReader();
    console.log("Reading from ProjectPlan stream:");
    let projectPlanContent = '';
    
    try {
      while (true) {
        const { done, value } = await projectPlanReader.read();
        if (done) break;
        projectPlanContent += value;
        console.log(`ProjectPlan stream chunk (${value.length} chars): ${value.substring(0, 30)}...`);
      }
      console.log("ProjectPlan stream complete, content length:", projectPlanContent.length);
      console.log("Content sample:", projectPlanContent.substring(0, 100) + "...");
    } catch (error) {
      console.error("Error reading ProjectPlan stream:", error);
    }
  }
  
  console.log("Streaming test complete!");
  return "Test complete";
}

// Create an SSE-formatted chunk simulator function
export function simulateSSEChunks() {
  console.log("Starting SSE chunk test...");
  
  // Convert the test data into SSE format chunks
  const sseChunks: Uint8Array[] = [];
  
  // Break the test plan into smaller pieces
  const chunkSize = 10; // Characters per chunk
  for (let i = 0; i < testProjectPlan.length; i += chunkSize) {
    const chunkText = testProjectPlan.substring(i, i + chunkSize);
    // Format as SSE data event
    const sseData = `data: ${JSON.stringify({ chunk: chunkText })}\n\n`;
    sseChunks.push(new TextEncoder().encode(sseData));
  }
  
  // Create a mock reader
  let chunkIndex = 0;
  const mockReader = {
    read: async () => {
      if (chunkIndex < sseChunks.length) {
        return { done: false, value: sseChunks[chunkIndex++] };
      } else {
        return { done: true, value: undefined };
      }
    },
    cancel: () => Promise.resolve(),
  };
  
  // Process with our stream utility
  return streamToStreams(
    mockReader as ReadableStreamDefaultReader<Uint8Array>,
    ["projectplan", "ProjectPlan"] // Try both lowercase and proper case
  );
}

// Export a main function to run from command line
export async function runTests() {
  console.log("=== Running Direct Streaming Test ===");
  await simulateStreamingTest();
  
  console.log("\n=== Running SSE Format Test ===");
  const { mainStream, codeBlockStreams } = await simulateSSEChunks();
  
  // Read from the main stream
  const mainReader = mainStream.getReader();
  console.log("Reading from main stream (SSE):");
  let mainContent = '';
  
  try {
    while (true) {
      const { done, value } = await mainReader.read();
      if (done) break;
      mainContent += value;
      console.log(`Main stream chunk (${value.length} chars)`);
    }
    console.log("Main stream complete, content length:", mainContent.length);
  } catch (error) {
    console.error("Error reading main stream:", error);
  }
  
  // Check for projectplan stream
  if ("projectplan" in codeBlockStreams) {
    const projectPlanReader = codeBlockStreams["projectplan"].getReader();
    console.log("Reading from projectplan stream (SSE):");
    let projectPlanContent = '';
    
    try {
      while (true) {
        const { done, value } = await projectPlanReader.read();
        if (done) break;
        projectPlanContent += value;
        console.log(`projectplan stream chunk: ${value.substring(0, 30)}...`);
      }
      console.log("projectplan stream complete, content length:", projectPlanContent.length);
      console.log("Content sample:", projectPlanContent.substring(0, 100) + "...");
    } catch (error) {
      console.error("Error reading projectplan stream:", error);
    }
  }
  
  console.log("All tests complete!");
}

// Run the tests
if (typeof window !== 'undefined') {
  // Add a button to run the test in browser context
  const button = document.createElement('button');
  button.innerText = 'Run Stream Test';
  button.onclick = () => simulateStreamingTest();
  document.body.appendChild(button);
}
