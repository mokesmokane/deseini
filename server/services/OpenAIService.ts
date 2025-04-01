import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

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

export interface GenerateTasksResponse {
  tasks?: ProjectTask[];
  error?: string;
  message?: string;
  readyForTaskGeneration?: boolean;
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

// OpenAI service abstract interface - following Dependency Inversion Principle
export interface AIService {
  extractRoleInfo(text: string): Promise<ExtractRoleResponse>;
  handleConversation(prompt: string, projectContext?: ProjectContext | null, previousMessages?: ChatMessage[]): Promise<GenerateTasksResponse>;
  generateProjectTasks(prompt: string, projectContext?: ProjectContext | null, previousMessages?: ChatMessage[]): Promise<GenerateTasksResponse>;
}

// Concrete implementation of AIService - following Single Responsibility Principle
export class OpenAIService implements AIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }
  
  async extractRoleInfo(text: string): Promise<ExtractRoleResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that extracts structured information about job roles from text. 
                     Extract as much relevant information as possible in the exact format requested. 
                     If a field is not found in the text, leave it empty.`
          },
          {
            role: "user",
            content: text
          }
        ],
        functions: [
          {
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
          }
        ],
        function_call: { name: "extract_role_info" }
      });
      
      // Extract the function call results
      const functionCall = response.choices[0]?.message?.function_call;
      
      if (!functionCall || !functionCall.arguments) {
        return { error: "Failed to extract role information" };
      }
      
      const extractedData = JSON.parse(functionCall.arguments);
      
      return {
        extraction: extractedData
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return { 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  }

  // Handle conversation with user about their project
  async handleConversation(prompt: string, projectContext?: ProjectContext | null, previousMessages: ChatMessage[] = []): Promise<GenerateTasksResponse> {
    try {
      // Create system message that incorporates project context if available
      let systemMessage = `You are a project planning assistant that helps break down projects into meaningful tasks.
                         Your job is to gather information about the user's project needs by asking questions.
                         Start by asking open-ended questions about the project to get details about goals, timeline, team structure, etc.
                         After gathering sufficient information (through 2-3 questions), ask if the user would like you to generate a task breakdown.
                         Be conversational, helpful, and engage with the information the user provides.
                         Make your questions specific to the project context when possible.`;
      
      // Format previous messages for the conversation
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage }
      ];
      
      // Add the project context to the system message if available
      if (projectContext) {
        // Format project details for the system message
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
        
        // Add additional context-specific guidance
        systemMessage += `\n\nProject Context:\n${projectDetails.join('\n\n')}`;
        
        // Update the system message in formatted messages
        formattedMessages[0].content = systemMessage;
      }
      
      // Add previous conversation messages
      if (previousMessages.length > 0) {
        previousMessages.forEach(msg => {
          formattedMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }
      
      // Add the current prompt as a user message
      formattedMessages.push({
        role: "user",
        content: prompt
      });
      
      // Send the conversation to OpenAI
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
      });
      
      // Extract the response
      const assistantResponse = response.choices[0]?.message?.content;
      
      if (!assistantResponse) {
        return { error: "Failed to get response from AI" };
      }
      
      // Determine if the assistant is ready to generate tasks
      const readyForTaskGeneration = assistantResponse.toLowerCase().includes('task breakdown') &&
        (assistantResponse.toLowerCase().includes('shall i') || 
         assistantResponse.toLowerCase().includes('would you like') || 
         assistantResponse.toLowerCase().includes('ready to create'));
      
      return {
        message: assistantResponse,
        readyForTaskGeneration
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return { 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  }

  async generateProjectTasks(prompt: string, projectContext?: ProjectContext | null, previousMessages: ChatMessage[] = []): Promise<GenerateTasksResponse> {
    try {
      // Create system message that incorporates project context if available
      let systemMessage = `You are a project planning assistant that helps break down projects into meaningful tasks.
                     Create a hierarchical task breakdown based on the user's project description.
                     Each task should have a clear name and be organized in a logical hierarchy.
                     Follow SOLID principles in your task organization to prevent potential race conditions.`;
      
      // Format previous messages for the conversation
      const formattedMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage }
      ];
      
      // Enhance system message with project context if available
      if (projectContext) {
        // Format project details for the system message
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
        systemMessage += `\n\nProject Context:\n${projectDetails.join('\n\n')}`;
        
        // Add instructions for using the context
        systemMessage += `\n\nUse this project context to create a more relevant and detailed task breakdown. 
                       Ensure tasks align with the project goals and consider existing roles and deliverables.
                       Follow SOLID principles in your task organization to prevent potential race conditions.`;
        
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
      
      // Add the current prompt as a user message
      formattedMessages.push({
        role: "user",
        content: `Based on our conversation, please create a detailed task breakdown for my project. ${prompt}`
      });

      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: formattedMessages,
        functions: [
          {
            name: "generate_project_tasks",
            description: "Generate a hierarchical task breakdown for a project",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "integer",
                        description: "A unique identifier for the task"
                      },
                      name: {
                        type: "string",
                        description: "The name or title of the task"
                      },
                      parent: {
                        type: ["integer", "null"],
                        description: "The ID of the parent task, or 0 for root tasks"
                      },
                      children: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: {
                              type: "integer",
                              description: "A unique identifier for the child task"
                            },
                            name: {
                              type: "string",
                              description: "The name or title of the child task"
                            },
                            parent: {
                              type: "integer",
                              description: "The ID of the parent task"
                            },
                            children: {
                              type: "array",
                              description: "Nested children tasks, following the same structure"
                            }
                          },
                          required: ["id", "name", "parent"]
                        }
                      }
                    },
                    required: ["id", "name"]
                  }
                }
              },
              required: ["tasks"]
            }
          }
        ],
        function_call: { name: "generate_project_tasks" }
      });
      
      // Extract the function call results
      const functionCall = response.choices[0]?.message?.function_call;
      
      if (!functionCall || !functionCall.arguments) {
        return { error: "Failed to generate project tasks" };
      }
      
      const generatedData = JSON.parse(functionCall.arguments);
      
      return {
        tasks: generatedData.tasks,
        message: "I've created a task breakdown based on your requirements. You can review the tasks to the right."
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return { 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  }
}
