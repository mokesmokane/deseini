import express from 'express';
import { OpenAIService } from '../services/OpenAIService.ts';

// Controller class following Single Responsibility Principle
export class RoleController {
  private aiService: OpenAIService;
  
  constructor(apiKey: string) {
    this.aiService = new OpenAIService(apiKey);
  }
  
  // Method to extract role information from text
  async extractRoleInfo(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required and must be a string' });
        return;
      }

      // Call the extraction service
      const result = await this.aiService.extractRoleInfo(text);

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
  }
}
