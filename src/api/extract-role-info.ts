import { OpenAI } from 'openai';

// Define the expected API response structure
interface ExtractRoleResponse {
  extraction?: {
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
  };
  error?: string;
}

// Function parameters interface
interface ExtractParams {
  text: string;
}

// OpenAI service with dependency injection for better testability
class OpenAIService {
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
}

// Main handler function for the API
export async function extractRoleInfo({ text }: ExtractParams): Promise<ExtractRoleResponse> {
  // Get API key from environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return { error: "OpenAI API key is not configured" };
  }
  
  if (!text || text.trim() === '') {
    return { error: "No text provided for extraction" };
  }
  
  const openaiService = new OpenAIService(apiKey);
  return await openaiService.extractRoleInfo(text);
}
