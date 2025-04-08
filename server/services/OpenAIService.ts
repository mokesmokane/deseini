import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai/resources';
export type { ChatCompletionChunk };

// Interface segregation - defining clear interfaces
export interface RoleInfo {
  title?: string;
  type?: string;
  country?: string;
  region?: string;
  town?: string;
  level?: string;
  professions?: string;
  startDate?: string;
  endDate?: string;
  paymentBy?: string;
  hourlyRate?: number;
  description?: string;
}

export interface ExtractRoleResponse {
  extraction?: RoleInfo;
  error?: string;
}

export interface ExtractParams {
  text: string;
}

// Task interfaces
export interface ProjectTask {
  id: number | string;
  name: string;
  children?: ProjectTask[];
  parent?: number | string;
}

// Interface specifically for the structured task generation response
export interface GenerateTasksResponse {
  tasks?: ProjectTask[]; // Array of root tasks
  message?: string; // Confirmation message
  error?: string; // Error message
}

// Chat message interface
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Project context interface for task generation
export interface ProjectContext {
  id?: string;
  projectName?: string;
  description?: string;
  roles?: any[];
  charts?: any[];
}

// Define return type specifically for handleConversation when it might stream
export type ConversationResponse =
  | { stream: AsyncIterable<ChatCompletionChunk>; error?: undefined; } // Successful stream
  | { error: string; stream?: undefined; }; // Error case

// Defines the expected response for suggestion generation
export interface SuggestionResponse {
  suggestions?: string[];
  error?: string;
}

// Defines the expected response for project plan generation
export interface ProjectPlanResponse {
  projectPlan?: string;
  error?: string;
}

// Defines the expected response for streamed project plan generation
export type StreamedPlanResponse =
  | { stream: any; error?: undefined; } // Successful stream
  | { error: string; stream?: undefined; }; // Error case

// Types for document editing operations
interface ReplaceOperation {
  type: 'replace';
  startLine: number;
  endLine: number;
  content: string;
}

interface InsertAfterOperation {
  type: 'insertAfter';
  lineNumber: number;
  content: string;
}

interface DeleteLinesOperation {
  type: 'deleteLines';
  lineNumbers: number[];
}

type EditOperation = ReplaceOperation | InsertAfterOperation | DeleteLinesOperation;

interface EditProjectPlanResponse {
  content?: string;
  operations?: EditOperation[];
  error?: string;
  isComplete?: boolean;
  completionSummary?: string;
}

// Define interfaces for the Draft Plan structure
export interface DraftTask {
  id: string;
  type: 'task' | 'milestone';
  label: string;
  startDate: Date;
  subtasks?: DraftTask[];
  duration?: number;
  date?: Date;
}

export interface DraftTimeline {
  startDate: Date;
  endDate: Date;
}

export interface DraftPlanData {
  tasks: DraftTask[];
  timeline: DraftTimeline;
  error?: string;
}

// Define the final project plan format
export interface FinalPlanTask {
  id: string;
  name: string;
  start: string;
  end: string;
  color?: string;
  type?: string;
  tasks?: FinalPlanTask[];
  avatar?: string;
  dependsOn?: string[];
  assignedRoleId?: string;
  description?: string;
  relevantMilestones?: string[];
}

export interface FinalPlanMilestone {
  id: string;
  name: string;
  start: string;
  description?: string;
}

export interface FinalPlanDependency {
  sourceId: string;
  targetId: string;
}

export interface FinalProjectPlan {
  id: string;
  name: string;
  start: string;
  end: string;
  color?: string;
  description?: string;
  tasks: FinalPlanTask[];
  milestones: FinalPlanMilestone[];
  dependencies: FinalPlanDependency[];
}

export interface GenerateFinalPlanResponse {
  plan?: FinalProjectPlan;
  error?: string;
}

// OpenAI service abstract interface - following Dependency Inversion Principle
export interface AIService {
  extractRoleInfo(text: string): Promise<ExtractRoleResponse>;
  handleConversation(prompt: string | null, projectContext?: ProjectContext | null, previousMessages?: ChatMessage[]): Promise<ConversationResponse>;
  generateProjectTasks(prompt: string, projectContext?: ProjectContext | null, previousMessages?: ChatMessage[]): Promise<GenerateTasksResponse>;
  generateSuggestedReplies(messages: ChatMessage[], projectContext?: ProjectContext | null): Promise<SuggestionResponse>;
  generateProjectPlan(messages: ChatMessage[], projectContext?: ProjectContext | null, currentPlan?: string | null): Promise<StreamedPlanResponse>;
  parsePlanToTasks(markdownPlan: string): Promise<DraftPlanData>;
  generateFinalPlan(projectContext: ProjectContext, conversationHistory: ChatMessage[], draftPlanMarkdown: string, tasks: ProjectTask[]): Promise<GenerateFinalPlanResponse>;
}

// Helper function to parse markdown list into ProjectTask tree
function parseMarkdownToTaskTreeInternal(markdown: string): ProjectTask[] {
    const lines = markdown.trim().split('\n');
    const rootTasks: ProjectTask[] = [];
    const stack: { task: ProjectTask; indentLevel: number }[] = [];
    let idCounter = 1; // Simple counter for unique IDs

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('- ')) continue;

        const indentMatch = line.match(/^(\s*)- /);
        const indentLength = indentMatch ? indentMatch[1].length : 0;
        // Assuming 2 spaces per level, adjust if needed
        const indentLevel = Math.floor(indentLength / 2);
        const name = trimmedLine.substring(2).trim();

        if (!name) continue; // Skip lines that are just '- '

        const newTask: ProjectTask = {
            id: `task-${idCounter++}`, // Simple unique ID
            name: name,
            children: [], // Initialize children array
            // parent will be set when adding to parent's children array
        };

        // Pop from stack until we find the correct parent level
        while (stack.length > 0 && stack[stack.length - 1].indentLevel >= indentLevel) {
            stack.pop();
        }

        if (stack.length > 0) {
            const parentTask = stack[stack.length - 1].task;
            // Ensure children array exists (should always exist now)
            // if (!parentTask.children) {
            //     parentTask.children = [];
            // }
             newTask.parent = parentTask.id; // Set parent ID
            parentTask.children?.push(newTask); // Add to parent's children
        } else {
            // newTask.parent = 0; // Indicate root node explicitly if needed, otherwise undefined is fine
            rootTasks.push(newTask);
        }

        stack.push({ task: newTask, indentLevel: indentLevel });
    }

     // Clean up empty children arrays for leaf nodes
     const cleanupEmptyChildren = (tasks: ProjectTask[]) => {
        tasks.forEach(task => {
            if (task.children && task.children.length > 0) {
                cleanupEmptyChildren(task.children);
            } else {
                delete task.children; // Remove empty children array
            }
        });
     };
     cleanupEmptyChildren(rootTasks);


    return rootTasks;
}

// Concrete implementation of AIService - following Single Responsibility Principle
export class OpenAIService implements AIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }
  
  // Utility method for logging API calls with messages
  private logApiCall(methodName: string, messages: ChatCompletionMessageParam[], options?: Record<string, any>): void {
    console.log(`\n======= OpenAI API Call: ${methodName} =======`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('Messages:');
    messages.forEach((msg, index) => {
      console.log(`[${index}] Role: ${msg.role}`);
      console.log(`Content: ${msg.content}`);
      // Check function_call safely using type assertion if necessary
      const anyMsg = msg as any;
      if (anyMsg.function_call) {
        console.log(`Function call: ${JSON.stringify(anyMsg.function_call)}`);
      }
    });
    if (options) {
      console.log('Additional options:', JSON.stringify(options, null, 2));
    }
    console.log('==========================================\n');
  }
  
  async extractRoleInfo(text: string): Promise<ExtractRoleResponse> {
    try {
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: dateTimePrefix + `You are a helpful assistant that extracts structured information about job roles from text. 
                   Extract as much relevant information as possible in the exact format requested. 
                   If a field is not found in the text, leave it empty.`
        },
        {
          role: "user",
          content: text
        }
      ];
      
      const functionParams = {
        name: "extract_role_info",
        description: "Extract structured information about a job role from text",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The job title or role name"
            },
            type: {
              type: "string",
              description: "The type of role (e.g., Full-time, Part-time, Contract)"
            },
            country: {
              type: "string",
              description: "The country where the role is located"
            },
            region: {
              type: "string",
              description: "The region, state, or province where the role is located"
            },
            town: {
              type: "string",
              description: "The city, town, or locale where the role is located"
            },
            level: {
              type: "string",
              description: "The seniority level (e.g., Junior, Mid, Senior)"
            },
            professions: {
              type: "string",
              description: "The professions or skills required for the role"
            },
            startDate: {
              type: "string",
              description: "The start date of the role in YYYY-MM-DD format"
            },
            endDate: {
              type: "string",
              description: "The end date of the role in YYYY-MM-DD format"
            },
            paymentBy: {
              type: "string",
              description: "How payment is structured (e.g., Hourly, Daily, Weekly, Monthly, Fixed)"
            },
            hourlyRate: {
              type: "number",
              description: "The hourly rate in GBP (£)"
            },
            description: {
              type: "string",
              description: "A brief description of the role"
            }
          },
          required: []
        }
      };
      
      // Log the API call
      this.logApiCall('extractRoleInfo', messages, { 
        model: "gpt-4o", 
        functions: [functionParams], 
        function_call: { name: "extract_role_info" } 
      });
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        functions: [functionParams],
        function_call: { name: "extract_role_info" }
      });
      
      // Extract the function call results
      const functionCall = response.choices[0]?.message?.function_call;
      
      if (!functionCall || !functionCall.arguments) {
        console.warn("OpenAI did not return a function call for extract_role_info.");
        // Return empty extraction instead of error? Or depends on requirement.
        return { extraction: {} };
      }
      
      try {
        const extractedData = JSON.parse(functionCall.arguments);
        return {
          extraction: extractedData
        };
      } catch (parseError) {
        console.error("Failed to parse function call arguments:", functionCall.arguments, parseError);
        return { error: "Failed to parse extracted role information." };
      }
    } catch (error) {
      console.error('OpenAI API error during extractRoleInfo:', error);
      return {
        error: error instanceof Error ? error.message : "An unknown error occurred during role extraction"
      };
    }
  }

  // Updated handleConversation signature and return type
  async handleConversation(prompt: string | null, projectContext?: ProjectContext | null, previousMessages: ChatMessage[] = []): Promise<ConversationResponse> {
    try {
      const isInitiation = !prompt && previousMessages.length === 0;
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      
      let systemMessage = `You are a helpful and conversational project planning assistant.`;
      
      const projectDetails: string[] = [];
      let projectName = "this project"; 
      if (projectContext) {
        if (projectContext.projectName) {
          projectName = projectContext.projectName; // Use actual project name
          projectDetails.push(`Project Name: ${projectContext.projectName}`);
        }
        if (projectContext.description) {
          projectDetails.push(`Project Description: ${projectContext.description}`);
        }
        if (projectContext.roles && projectContext.roles.length > 0) {
          projectDetails.push(`Project Roles: ${projectContext.roles.length} roles defined`);
        }
        if (projectContext.charts && projectContext.charts.length > 0) {
          projectDetails.push(`Existing Charts: ${projectContext.charts.length} charts`);
        }
      }
      
      if (isInitiation) {
        systemMessage += `Initiate the planning conversation for project${projectName !== "this project" ? ` '${projectName}'` : ''}.
                         Message must be concise and professional.
                         State more details are needed for planning.
                         Suggest focusing on: 1. Timescales, 2. Scope/Tasks, or 3. Roles/Team.
                         You are to sound direct and professional. Do not sound excitable. Avoid using Exclamation marks to express yourself.
                         Ask the user how to proceed.
                         Use provided Project Context minimally.`;
        if (projectDetails.length > 0) {
          systemMessage += `\n\nProject Context:\n${projectDetails.join('\n')}`;
        }
      } else {
        systemMessage += `Your job is to gather information about the user's project needs by asking questions.
                         Start by asking open-ended questions about the project to get details about goals, timeline, team structure, etc.
                         After gathering sufficient information (through 2-3 questions), ask if the user would like you to generate a task breakdown.
                         You are to sound direct and professional. Do not sound excitable. Avoid using Exclamation marks to express yourself.
                         If asking for task breakdown confirmation, end your response *exactly* with the marker: [CONFIRM_TASK_GENERATION]
                         Be conversational, helpful, and engage with the information the user provides.
                         ASK ONLY 1 QUESTION AT A TIME.
                         If talking about project timescales, ask about medium short or long term. Get specific about the timescale offering suggestions about about numbers of weeks or months. 
                         If talking about project scope, ask about the scope of the project in terms of features or deliverables. offer suggestion for specific deliverabvles and milestones. dont be shy pretend youi know all about the project.
                         If talking about roles,dont forget you see all the roles defined in the project context. Offer suggestion abou who should eb doing what.
                         Make your questions specific to the project context when possible.`;
        if (projectDetails.length > 0) {
          systemMessage += `\n\nProject Context:\n${projectDetails.join('\n\n')}`;
          systemMessage += `\nUse this context to inform your questions and responses.`;
        }
      }

      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: dateTimePrefix + systemMessage }
      ];
      
      if (!isInitiation && previousMessages.length > 0) {
         previousMessages.forEach(msg => { formattedMessages.push({ role: msg.role, content: msg.content }); });
      }
      
      if (!isInitiation && prompt) {
        formattedMessages.push({ role: "user", content: prompt });
      }
      
      // Log the API call
      this.logApiCall('handleConversation', formattedMessages, { model: "gpt-4o", stream: true });
      
      // Request stream
      const stream = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        stream: true,
      });
      
      // Return the stream
      return { stream }; 

    } catch (error) {
      console.error('OpenAI API error in handleConversation:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during conversation.";
      return { error: message };
    }
  }

  // Modified generateProjectTasks: non-streaming, returns structured JSON
  async generateProjectTasks(prompt: string, projectContext?: ProjectContext | null, previousMessages: ChatMessage[] = []): Promise<GenerateTasksResponse> {
    try {
      // Create system message that incorporates project context if available
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      let systemMessage = `You are a project planning assistant that helps break down projects into meaningful tasks.
                     Create a detailed, multi-level hierarchical task breakdown based on the user's project description and our conversation.
                     Output the tasks ONLY as a markdown list using hyphens (-) and indentation for hierarchy (2 spaces per indent level).
                     Do not include any other text, commentary, or preamble before or after the markdown list.
                     Do not use headers or task IDs.

                     Example format:
                     - Phase 1: Planning
                       - Define Goals
                       - Research Market
                     - Phase 2: Development
                       - Task A
                         - Sub-task A.1
                         - Sub-task A.2
                       - Task B
                     - Phase 3: Deployment

                     Ensure the output is exclusively the markdown list.`;

      // Format previous messages for the conversation
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: "" } // Placeholder, will be updated
      ];

      // Enhance system message with project context if available
      if (projectContext) {
        const projectDetails = [];
        
        if (projectContext.projectName) {
          projectDetails.push(`Project Name: ${projectContext.projectName}`);
        }
        
        if (projectContext.description) {
          projectDetails.push(`Project Description: ${projectContext.description}`);
        }
        
        if (projectContext.roles && projectContext.roles.length > 0) {
          projectDetails.push(`Project Roles: ${projectContext.roles.length} roles defined`);
          // Include up to 3 roles as examples
          const roleExamples = projectContext.roles.slice(0, 3).map(role => 
            `- ${role.title || 'Untitled Role'}${role.description ? `: ${role.description.substring(0, 100)}${role.description.length > 100 ? '...' : ''}` : ''}`
          );
          projectDetails.push(roleExamples.join('\n'));
        }
        
        if (projectContext.charts && projectContext.charts.length > 0) {
          projectDetails.push(`Existing Charts: ${projectContext.charts.length} charts`);
          // List chart names
          const chartNames = projectContext.charts.map(chart => `- ${chart.name || 'Untitled Chart'}`);
          projectDetails.push(chartNames.join('\n'));
        }
        
        // Add project context to system message
        if (projectDetails.length > 0) {
            systemMessage += `\n\nProject Context:\n${projectDetails.join('\n\n')}`;
            // Add instructions for using the context
            systemMessage += `\n\nUse this project context to create a more relevant and detailed markdown task breakdown.
                           Ensure tasks align with the project goals and consider existing roles and deliverables.
                           Remember to output ONLY the markdown list.`;
        }

        // Update the system message in formatted messages
        formattedMessages[0].content = systemMessage;
      }
      
      // Add previous conversation messages for context
      if (previousMessages.length > 0) {
        previousMessages.forEach(msg => {
          formattedMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }
      
      // Add the current prompt as a user message - explicitly stating the goal is task generation
      formattedMessages.push({
        role: "user",
        content: `Based on our conversation and the project context, please generate the hierarchical task breakdown now as a markdown list. User's final request/confirmation: "${prompt}"`
      });

      // Add dateTimePrefix to system message content before making the call
      formattedMessages[0].content = dateTimePrefix + formattedMessages[0].content; 

      // Log the API call
      this.logApiCall('generateProjectTasks', formattedMessages, { model: "gpt-4o", stream: false });

      // Make the non-streaming API call
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        stream: false, // Ensure stream is false
      });

      const markdownContent = response.choices[0]?.message?.content;

      if (!markdownContent) {
        console.error('OpenAI API response missing content for task generation.');
        return { error: "Failed to generate tasks: No content received from AI." };
      }

      // Parse the markdown content into structured tasks
      try {
        const parsedTasks = parseMarkdownToTaskTreeInternal(markdownContent);
        if (parsedTasks.length === 0 && markdownContent.trim() !== '') {
            console.warn("Markdown parsing resulted in zero tasks, but content was present:", markdownContent);
            // Optionally return the raw markdown or a specific error
            return { error: "Generated content could not be parsed into tasks.", message: markdownContent };
        }
        return {
            tasks: parsedTasks,
            message: "Tasks generated successfully."
         };
      } catch (parseError) {
          console.error("Error parsing generated markdown task list:", parseError);
          console.error("Markdown content that failed parsing:", markdownContent);
          // Return the raw content along with the error for debugging
          return { error: `Failed to parse generated tasks. Parser error: ${parseError instanceof Error ? parseError.message : parseError}`, message: markdownContent };
      }

    } catch (error) {
      console.error('OpenAI API error in generateProjectTasks:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during task generation.";
      return { error: message };
    }
  }

  // Method for generating suggested replies (using gpt-4o)
  async generateSuggestedReplies(messages: ChatMessage[], projectContext?: ProjectContext | null): Promise<SuggestionResponse> {
    try {
      if (!messages || messages.length === 0) {
        return { suggestions: [] }; // No context, no suggestions
      }

      // Find the last assistant message to provide context for suggestions
      const lastAssistantMessage = messages.slice().reverse().find(msg => msg.role === 'assistant');
      if (!lastAssistantMessage) {
        return { suggestions: [] }; // No assistant message found
      }
      
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      

      let systemMessage = `You are an AI assistant helping a user plan a project. You have their project context, you can and should make direct suggestions in relation to it.
                         The user needs DIRECT, SPECIFIC answers to the last question posed in the assistant's message.
                         Generate 3 concise suggested replies that the *user* could use as DIRECT ANSWERS to the SPECIFIC QUESTION asked.
                         Do NOT generate generic responses - provide actual example answers with SPECIFIC details.
                         
                         IMPORTANT: Always identify the exact question asked in the assistant's message and generate responses that DIRECTLY answer that question.
                         
                         IF asked to pick between options, generate 3 concise suggested replies that simply answer that question picking one of the options.
                         For instance if asked "Let's begin planning for Project Piëch GT2.0. More details are needed to define the project parameters. How would you like to proceed—by focusing on Timescales, Scope/Tasks, or Roles/Team?"

                         The suggested replies should be "Let's start with timescales.", "Let's focus on scope and tasks.", or "Let's discuss roles and team structure." DO NOT ADD ADDITIONAL INFO. JUST ANSWER THE QUESTION AS SIMPLY AS POSSIBLE.
                         
                         EXAMPLES OF SPECIFIC QUESTION TYPES AND GOOD ANSWERS:
                         
                         1. If asked "Does this phasing align with your expectations, or is there a different structure you have in mind for the timeline?":
                            - "Yes, this phasing aligns perfectly with my expectations."
                            - "I'd prefer to spend more time on the detailed design phase and less on initial concepts."
                            - "The timeline works, but I'd like to add a dedicated testing phase before finalizing the design."
                         
                         2. If asked "Which aspect of the design should we prioritize first?":
                            - "Let's prioritize the exterior styling first."
                            - "The chassis and aerodynamics should be our initial focus."
                            - "I think we should start with the powertrain configuration."
                         
                         For instance the following replies are bad as they have too much info:
                              "Let's start with timescales—I'd like to map out key milestones, like having the 25% scale model concept ready by mid-May and full CAD models by early June."
                              "Let's focus on scope and tasks—defining deliverables such as full CAD models, engineering specs, and detailed 25% scale model components to meet Pebble Beach deadlines."
                              "Let's discuss roles and team structure—aligning the 8 roles to ensure clear responsibilities, possibly assigning 2 engineers, 1 designer, and a project manager to speed up our design phases."
                         
                         You will be able to reply with that info in subsequent messages.

                         The following replies are good as they are simple and to the point:
                              "Let's start with timescales."
                              "Let's focus on scope and tasks."
                              "Let's discuss roles and team structure."

                         Once we get more detailed you can add more specific detail to the answers.


                         For example:
                         - If asked about project timeline: suggest specific timeframes like "3 months with completion by September" not vague responses
                         - If asked about deliverables: suggest specific items like "Full CAD models, engineering specs, and a working prototype"
                         - If asked about team roles: suggest specific role assignments like "I need 2 engineers, 1 designer, and a project manager"
                         


                         Each suggestion should be a complete, usable answer that addresses the exact question.
                         Each suggestion should be different from the others.
                         Be specific and concrete - include numbers, dates, names, or other details whenever appropriate.
                         Phrase the suggestions as if the user is speaking.
                         Use the project context to make suggestions precise and relevant.
                         Output *only* the suggestions as an array of strings in the requested function call format.`;

      // Add project context
      if (projectContext) {
        const projectDetails: string[] = [];
        
        if (projectContext.projectName) {
          projectDetails.push(`Project Name: ${projectContext.projectName}`);
        }
        if (projectContext.description) {
          projectDetails.push(`Project Description: ${projectContext.description}`);
        }
        if (projectContext.roles && projectContext.roles.length > 0) {
          projectDetails.push(`Project Roles: ${projectContext.roles.length} roles defined`);
        }
        if (projectContext.charts && projectContext.charts.length > 0) {
          projectDetails.push(`Existing Charts: ${projectContext.charts.length} charts`);
        }

        if (projectDetails.length > 0) {
          systemMessage += `\n\nRelevant Project Context (use this to make suggestions more specific):\n${projectDetails.join('\n')}`;
          systemMessage += `\nBase your suggestions on the last assistant message and this project context.`;
        }
      }

      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: dateTimePrefix + systemMessage },
        // Provide only the last assistant message as direct context for the suggestion generation
        { role: "assistant", content: lastAssistantMessage.content }
        // We could include more history, but focusing on the *last* response is key
      ];

      const functionParams = {
        name: "provide_suggested_replies",
        description: "Provides a list of suggested replies for the user based on the assistant's last message.",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              description: "An array of 3 concise suggested replies (strings), phrased from the user's perspective.",
              items: { type: "string" }
            }
          },
          required: ["suggestions"]
        }
      };

      // Log the API call
      this.logApiCall('generateSuggestedReplies', formattedMessages, { 
        model: "gpt-4o", 
        functions: [functionParams], 
        function_call: { name: "provide_suggested_replies" } 
      });

      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // Using gpt-4o model
        messages: formattedMessages,
        functions: [
          functionParams
        ],
        function_call: { name: "provide_suggested_replies" }
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        console.warn("OpenAI did not return a function call for provide_suggested_replies.");
        return { suggestions: [] }; // Return empty if no function call
      }

      try {
        const parsedArgs = JSON.parse(functionCall.arguments);
        const suggestions = parsedArgs.suggestions || []; // Get suggestions or default to empty array

        // --- Add Logging Here ---
        console.log("Generated Suggestions:", suggestions);
        // ------------------------

        return {
          suggestions: suggestions
        };
      } catch (parseError) {
         console.error("Failed to parse function call arguments for suggestions:", functionCall.arguments, parseError);
         return { error: "Failed to parse suggested replies." };
      }

    } catch (error) {
      console.error('OpenAI API error in generateSuggestedReplies:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during suggestion generation.";
      return { error: message };
    }
  }

  // Generate a detailed project plan in markdown format, updating if a current plan is provided
  // Updated to return a stream
  async generateProjectPlan(messages: ChatMessage[], projectContext?: ProjectContext | null, currentPlan?: string | null): Promise<StreamedPlanResponse> {
    try {
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      let systemMessage = `You are a project consultant taking notes during a client conversation. Your task is to maintain and update a set of structured consultation notes in Markdown format based on the ongoing conversation.`;

      if (currentPlan) {
        systemMessage += `\n\nHere are your current consultation notes:\n---\n${currentPlan}\n---\n\nUpdate these notes based on the latest messages in the conversation. Focus on capturing key information that will help plan the project.
        
Maintain the following sections, updating them as new information becomes available:
# Timescales
Capture information about project duration, deadlines, milestones, and any timing constraints.

# Scope
Document what is included and excluded from the project, key deliverables, and any scope boundaries discussed.

# Tasks
List the tasks that need to be completed by the roles to deliver the project. Tend towards 2 levels, a set of high level tasks and a set of subtasks indented under each high level task that requires subtasks.

# Milestones
List the key milestones or events that need to be completed for the project.

# Roles
Note the key stakeholders, team members, and their responsibilities within the project.

# Dependencies
Record any external or internal dependencies that might impact the project timeline or success.

# Deliverables
List the specific outputs, products, or services that will be created during the project.

Write in a concise, consultant-style note-taking format rather than a formal project plan. Use bullet points liberally for clarity. Focus on recording information as it emerges in the conversation rather than trying to create a comprehensive plan at this stage.`;
      } else {
        systemMessage += `\n\nCreate initial consultation notes in Markdown format based on the conversation.
        
Structure your notes using these specific sections:
# Timescales
Capture information about project duration, deadlines, milestones, and any timing constraints.

# Scope
Document what is included and excluded from the project, key deliverables, and any scope boundaries discussed.

# Tasks
List the tasks that need to be completed by the roles to deliver the project. Tend towards 2 levels, a set of high level tasks and a set of subtasks indented under each high level task that requires subtasks.

# Milestones
List the key milestones or events that need to be completed for the project.

# Roles
Note the key stakeholders, team members, and their responsibilities within the project.

# Dependencies
Record any external or internal dependencies that might impact the project timeline or success.

# Deliverables
List the specific outputs, products, or services that will be created during the project.

Write in a concise, consultant-style note-taking format rather than a formal project plan. Use bullet points liberally for clarity. Focus on recording information as it emerges in the conversation rather than trying to create a comprehensive plan at this stage.

If there is no information yet on a particular section, include the section heading with a brief placeholder like: "No information gathered yet."

ONLY REPLY WITH THE GENERATED NOTES.
`;
      }
      
      // Add project context
      if (projectContext) {
        const projectDetails = [];
        
        if (projectContext.projectName) {
          projectDetails.push(`Project Name: ${projectContext.projectName}`);
        }
        
        if (projectContext.description) {
          projectDetails.push(`Project Description: ${projectContext.description}`);
        }
        
        if (projectContext.roles && projectContext.roles.length > 0) {
          projectDetails.push(`Project Roles: ${projectContext.roles.length} roles defined`);
          const roleDetails = projectContext.roles.map(role => 
            `- ${role.title || 'Untitled Role'}${role.description ? `: ${role.description.substring(0, 100)}${role.description.length > 100 ? '...' : ''}` : ''}`
          );
          projectDetails.push(roleDetails.join('\n'));
        }
        
        if (projectDetails.length > 0) {
          systemMessage += `\n\nProject Context:\n${projectDetails.join('\n')}`;
        }
      }
      
      // Format messages
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: dateTimePrefix + systemMessage }
      ];
      
      // Restructure conversation history - separate previous messages from the latest one
      if (messages.length > 0) {
        // Get all messages except the latest one
        const previousMessages = messages.slice(0, -1);
        const latestMessage = messages[messages.length - 1];
        
        // Format previous messages as a single context message if there are any
        if (previousMessages.length > 0) {
          const conversationSoFar = previousMessages.map(msg => 
            `${msg.role === 'assistant' ? 'Consultant' : 'Client'}: ${msg.content}`
          ).join('\n\n');
          
          formattedMessages.push({ 
            role: 'user',
            content: `Here is the conversation so far:\n\n<conversation>\n${conversationSoFar}\n</conversation>`
          });
        }
        
        // Add the latest message separately
        formattedMessages.push({ 
          role: 'user',
          content: `Here is the latest message:\n\n<latest_message>\n${latestMessage.role === 'assistant' ? 'Consultant' : 'Client'}: ${latestMessage.content}\n</latest_message>\n\nPlease update the consultation notes based on this latest message.`
        });
      } else {
        formattedMessages.push({ 
          role: 'user',
          content: `Please create the initial consultation notes based on the project context`
        });
      }
      
      // Log the API call
      this.logApiCall('generateProjectPlan', formattedMessages, { model: "gpt-4o", stream: true });

      // Call OpenAI API to generate/update project plan stream
      const stream = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        stream: true, // Enable streaming
      });

      return { stream }; // Return the stream object

    } catch (error) {
      console.error('OpenAI API error in generateProjectPlan:', error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during project plan generation/update"; // Capture error message
      return {
        error: message // Return error in the correct format
      };
    }
  }

  // Parse project plan markdown into structured task data for the draft plan UI
  async parsePlanToTasks(markdownPlan: string): Promise<DraftPlanData> {
    try {
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: dateTimePrefix + `You are a helpful assistant that converts a project plan in markdown format into a structured JSON format that can be used by a timeline/Gantt chart application. 

Extract tasks and milestones from the project plan, including:
1. Task or milestone title/label
2. Start dates for tasks
3. Duration for tasks (in days)
4. Date for milestones
5. Determine the overall timeline (earliest start date and latest end date)

Output should be a single valid JSON object with:
- tasks: An array of task objects (each with id, type, label, startDate, and either duration for tasks or date for milestones)
- timeline: An object with startDate and endDate properties

For dates, use ISO format (YYYY-MM-DD). If exact dates aren't specified, make reasonable estimates based on context.
Tasks should have type "task", milestones should have type "milestone".
Generate unique IDs for each task/milestone.
`
          },
          {
            role: "user",
            content: markdownPlan
          }
        ],
        temperature: 0.2,
        tool_choice: { type: "function", function: { name: "extract_plan_data" } },
        tools: [
          {
            type: "function",
            function: {
              name: "extract_plan_data",
              description: "Extract tasks, milestones and timeline information from a project plan markdown",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    description: "Array of tasks and milestones extracted from the project plan",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the task or milestone"
                        },
                        type: {
                          type: "string",
                          enum: ["task", "milestone"],
                          description: "The type of item - either 'task' or 'milestone'"
                        },
                        label: {
                          type: "string",
                          description: "The name or description of the task or milestone"
                        },
                        startDate: {
                          type: "string",
                          format: "date",
                          description: "The start date for the task in ISO format (YYYY-MM-DD)"
                        },
                        duration: {
                          type: "integer",
                          description: "The duration of the task in days (only for tasks, not for milestones)"
                        },
                        date: {
                          type: "string",
                          format: "date",
                          description: "The date for milestones in ISO format (YYYY-MM-DD) (only for milestones, not for tasks)"
                        },
                        subtasks: {
                          type: "array",
                          description: "Array of subtasks for the task",
                          items: {
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                description: "Unique identifier for the subtask"
                              },
                              type: {
                                type: "string",
                                enum: ["task", "milestone"],
                                description: "The type of item - either 'task' or 'milestone'"
                              },
                              label: {
                                type: "string",
                                description: "The name or description of the subtask"
                              },
                              startDate: {
                                type: "string",
                                format: "date",
                                description: "The start date for the subtask in ISO format (YYYY-MM-DD)"
                              },
                              duration: {
                                type: "integer",
                                description: "The duration of the subtask in days"
                              },
                              date: {
                                type: "string",
                                format: "date",
                                description: "The date for milestones in ISO format (YYYY-MM-DD) (only for milestones, not for tasks)"
                              }
                            },
                            required: ["id", "type","label", "startDate", "duration", "date"]
                          }
                        }
                      },
                      required: ["id", "type", "label", "startDate", "duration", "subtasks"]
                    }
                  },
                  timeline: {
                    type: "object",
                    description: "The overall timeline for the project",
                    properties: {
                      startDate: {
                        type: "string",
                        format: "date",
                        description: "The start date of the overall project timeline in ISO format (YYYY-MM-DD)"
                      },
                      endDate: {
                        type: "string",
                        format: "date",
                        description: "The end date of the overall project timeline in ISO format (YYYY-MM-DD)"
                      }
                    },
                    required: ["startDate", "endDate"]
                  }
                },
                required: ["tasks", "timeline"]
              }
            }
          }
        ]
      });

      // Extract the function call result from the response
      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      
      if (!toolCall || toolCall.function.name !== "extract_plan_data") {
        throw new Error("Invalid tool call response");
      }
      
      const resultJson = JSON.parse(toolCall.function.arguments);
      
      // Process dates to ensure they're Date objects
      if (resultJson.tasks && Array.isArray(resultJson.tasks)) {
        // Recursive function to process dates in tasks and subtasks
        const processTaskDates = (task: any): any => {
          const processedTask = {
            ...task,
            startDate: new Date(task.startDate),
            ...(task.date ? { date: new Date(task.date) } : {})
          };
          
          // Process subtasks recursively if they exist
          if (task.subtasks && Array.isArray(task.subtasks)) {
            processedTask.subtasks = task.subtasks.map(processTaskDates);
          }
          
          return processedTask;
        };
        
        resultJson.tasks = resultJson.tasks.map(processTaskDates);
      }
      
      if (resultJson.timeline) {
        resultJson.timeline = {
          startDate: new Date(resultJson.timeline.startDate),
          endDate: new Date(resultJson.timeline.endDate)
        };
      }

      // Log the API call
      this.logApiCall('parsePlanToTasks', [
        {
          role: "system" as const,
          content: dateTimePrefix + `You are a helpful assistant that converts a project plan in markdown format into a structured JSON format that can be used by a timeline/Gantt chart application. 

Extract tasks and milestones from the project plan, including:
1. Task or milestone title/label
2. Start dates for tasks
3. Duration for tasks (in days)

4. Date for milestones
5. Determine the overall timeline (earliest start date and latest end date)

Output should be a single valid JSON object with:
- tasks: An array of task objects (each with id, type, label, startDate, and either duration for tasks or date for milestones)
- timeline: An object with startDate and endDate properties

For dates, use ISO format (YYYY-MM-DD). If exact dates aren't specified, make reasonable estimates based on context.
Tasks should have type "task", milestones should have type "milestone".
Generate unique IDs for each task/milestone.
`
        },
        {
          role: "user" as const,
          content: markdownPlan
        }
      ], { 
        model: "gpt-4o", 
        temperature: 0.2,
        tool_choice: { type: "function", function: { name: "extract_plan_data" } },
        tools: [
          {
            type: "function",
            function: {
              name: "extract_plan_data",
              description: "Extract tasks, subtasks, milestones and timeline information from a project plan markdown",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    description: "Array of tasks and milestones extracted from the project plan",
                    items: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                          description: "Unique identifier for the task or milestone"
                        },
                        type: {
                          type: "string",
                          enum: ["task", "milestone"],
                          description: "The type of item - either 'task' or 'milestone'"
                        },
                        label: {
                          type: "string",
                          description: "The name or description of the task or milestone"
                        },
                        startDate: {
                          type: "string",
                          format: "date",
                          description: "The start date for the task in ISO format (YYYY-MM-DD)"
                        },
                        duration: {
                          type: "integer",
                          description: "The duration of the task in days (only for tasks, not for milestones)"
                        },
                        date: {
                          type: "string",
                          format: "date",
                          description: "The date for milestones in ISO format (YYYY-MM-DD) (only for milestones, not for tasks)"
                        },
                        subtasks: {
                          type: "array",
                          description: "Array of subtasks for the task",
                          items: {
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                description: "Unique identifier for the subtask"
                              },
                              type: {
                                type: "string",
                                enum: ["task", "milestone"],
                                description: "The type of item - either 'task' or 'milestone'"
                              },
                              label: {
                                type: "string",
                                description: "The name or description of the subtask"
                              },
                              startDate: {
                                type: "string",
                                format: "date",
                                description: "The start date for the subtask in ISO format (YYYY-MM-DD)"
                              },
                              duration: {
                                type: "integer",
                                description: "The duration of the subtask in days"
                              },
                              date: {
                                type: "string",
                                format: "date",
                                description: "The date for milestones in ISO format (YYYY-MM-DD) (only for milestones, not for tasks)"
                              }
                            },
                            required: ["id", "type","label", "startDate", "duration", "date"]
                          }
                        }
                      },
                      required: ["id", "type", "label", "startDate", "duration", "subtasks"]
                    }
                  },
                  timeline: {
                    type: "object",
                    description: "The overall timeline for the project",
                    properties: {
                      startDate: {
                        type: "string",
                        format: "date",
                        description: "The start date of the overall project timeline in ISO format (YYYY-MM-DD)"
                      },
                      endDate: {
                        type: "string",
                        format: "date",
                        description: "The end date of the overall project timeline in ISO format (YYYY-MM-DD)"
                      }
                    },
                    required: ["startDate", "endDate"]
                  }
                },
                required: ["tasks", "timeline"]
              }
            }
          }
        ]
      });
      console.log('Parsed plan data:', resultJson);
      return resultJson as DraftPlanData;
    } catch (error) {
      console.error("Error parsing project plan to tasks:", error);
      return {
        tasks: [],
        timeline: {
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Default 3-month timeline
        },
        error: error instanceof Error ? error.message : "Failed to parse project plan"
      };
    }
  }

  // Generate the final plan in JSON format for Gantt chart visualization
  async generateFinalPlan(
    projectContext: ProjectContext, 
    conversationHistory: ChatMessage[], 
    draftPlanMarkdown: string, 
    tasks: ProjectTask[]
  ): Promise<GenerateFinalPlanResponse> {
    try {
      const dateTimePrefix = `Current date and time: ${new Date().toISOString()}\n\n`;
      
      // Prepare system prompt with clear instructions about the expected output format
      let systemMessage = `You are a project planning specialist tasked with converting a draft project plan into a finalized JSON structure for a Gantt chart visualization.

Your task is to create a well-structured plan with proper dependencies, task hierarchy, timelines, and assignments. 
The final JSON structure must include:
- Project information (id, name, description, start/end dates)
- Tasks with hierarchy (main tasks and subtasks)
- Milestone information
- Dependencies between tasks
- Role assignments where applicable
- Color coding for different task categories

Create professional-looking task names and descriptions as needed.
`;

      // Add context to the system message
      const projectDetails: string[] = [];
      
      if (projectContext) {
        if (projectContext.projectName) {
          projectDetails.push(`Project Name: ${projectContext.projectName}`);
        }
        
        if (projectContext.description) {
          projectDetails.push(`Project Description: ${projectContext.description}`);
        }
        
        if (projectContext.roles && projectContext.roles.length > 0) {
          projectDetails.push(`Project Roles:`);
          projectContext.roles.forEach((role, index) => {
            projectDetails.push(`- Role ${index + 1}: ${role.title || 'Untitled Role'} (ID: ${role.id || 'unknown'})`);
          });
        }
      }
      
      if (projectDetails.length > 0) {
        systemMessage += `\n\nProject Context:\n${projectDetails.join('\n')}`;
      }

      // Add the expected output format template to the system message
      systemMessage += `\n\nYour output must be in this exact JSON format:
{
  "id": "unique-project-id",
  "name": "Project Name",
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "color": "#hexcolor",
  "description": "Project description",
  "tasks": [
    {
      "id": "task-id",
      "name": "Task Name",
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD",
      "color": "#hexcolor",
      "tasks": [
        // Nested subtasks with same structure
      ],
      "avatar": "https://avatar-url",
      "assignedRoleId": "role-id",
      "dependsOn": ["dependent-task-id"],
      "description": "Task description",
      "relevantMilestones": ["milestone-id"]
    }
  ],
  "milestones": [
    {
      "id": "milestone-id",
      "name": "Milestone Name",
      "start": "YYYY-MM-DD",
      "description": "Milestone description"
    }
  ],
  "dependencies": [
    {
      "sourceId": "source-task-id",
      "targetId": "target-task-id"
    }
  ]
}`;

      // Format messages
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: dateTimePrefix + systemMessage }
      ];
      
      // Add conversation history as context
      if (conversationHistory.length > 0) {
        const conversationString = conversationHistory.map(msg => 
          `${msg.role === 'assistant' ? 'Consultant' : 'Client'}: ${msg.content}`
        ).join('\n\n');
        
        formattedMessages.push({ 
          role: 'user',
          content: `Here is the conversation history related to this project plan:\n\n${conversationString}`
        });
      }
      
      // Add the draft plan markdown
      formattedMessages.push({ 
        role: 'user',
        content: `Here is the draft project plan in markdown format:\n\n${draftPlanMarkdown}`
      });
      
      // Add the tasks list if available
      if (tasks && tasks.length > 0) {
        const tasksString = JSON.stringify(tasks, null, 2);
        formattedMessages.push({ 
          role: 'user',
          content: `Here is the current task list structure:\n\n${tasksString}`
        });
      }
      
      // Final instruction
      formattedMessages.push({ 
        role: 'user',
        content: `Based on all the information provided, generate a complete final project plan in the JSON format specified. 
Make sure to:
1. Create a logical task hierarchy
2. Set appropriate start and end dates
3. Establish proper dependencies
4. Assign roles where applicable
5. Include relevant milestones
6. Choose appropriate colors for tasks and categories

Your response should be ONLY the valid JSON object, nothing else.`
      });
      
      // Log the API call
      this.logApiCall('generateFinalPlan', formattedMessages, { model: "gpt-4o" });

      // Call OpenAI API to generate the final plan
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        temperature: 0.2, // Lower temperature for more consistent output
        response_format: { type: "json_object" }, // Ensure JSON response
      });

      // Extract and parse the JSON response
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("Empty response from API");
      }
      
      try {
        // Parse and validate the response
        const finalPlan = JSON.parse(content) as FinalProjectPlan;
        
        // Validate required fields
        if (!finalPlan.id || !finalPlan.name || !finalPlan.start || !finalPlan.end || !Array.isArray(finalPlan.tasks)) {
          throw new Error("Invalid plan format: missing required fields");
        }
        
        // Return the final plan
        return { plan: finalPlan };
      } catch (parseError) {
        console.error("Error parsing final plan JSON:", parseError);
        return { error: "Failed to parse the generated plan" };
      }
    } catch (error) {
      console.error('OpenAI API error in generateFinalPlan:', error);
      return {
        error: error instanceof Error ? error.message : "An unknown error occurred during final plan generation"
      };
    }
  }
}