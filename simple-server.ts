import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();

// Types
interface RoleInfo {
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

interface ExtractRoleResponse {
  extraction?: RoleInfo;
  error?: string;
}

// OpenAI service - following SOLID principles with Single Responsibility
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
        model: "gpt-4.1",  
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
                  description: "How payment is structured (e.g., Timesheet Based, Deliverable Based)"
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

// Initialize express app
const app = express();
const PORT = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

const openAIService = new OpenAIService(apiKey);

// Apply middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Extract role information endpoint
app.post('/api/extract-role-info', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    // Call the extraction service
    const result = await openAIService.extractRoleInfo(text);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }

    // Return the extracted information
    res.status(200).json({ extraction: result.extraction });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
