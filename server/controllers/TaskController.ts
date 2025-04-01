import express from 'express';
import { OpenAIService } from '../services/OpenAIService.ts';

// Controller class following Single Responsibility Principle
export class TaskController {
  private aiService: OpenAIService;
  
  constructor(apiKey: string) {
    this.aiService = new OpenAIService(apiKey);
  }
  
  // Method to generate project tasks based on user input
  async generateTasks(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { prompt, confirmUseFunction, projectContext, messages } = req.body;

      // Validate input
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required and must be a string' });
        return;
      }

      // Log incoming request for debugging
      console.log('Generate tasks request:', { 
        promptLength: prompt.length,
        hasProjectContext: !!projectContext,
        confirmUseFunction,
        messageCount: messages?.length || 0
      });

      // Call the conversation service
      const result = await this.aiService.handleConversation(prompt, projectContext, messages || []);

      if (result.error) {
        console.error('Conversation error:', result.error);
        res.status(400).json({ error: result.error });
        return;
      }

      // If the user has confirmed task generation, handle it
      if (confirmUseFunction === true && result.readyForTaskGeneration) {
        // Call the task generation service with project context
        const taskResult = await this.aiService.generateProjectTasks(prompt, projectContext, messages || []);
        
        if (taskResult.error) {
          console.error('Task generation error:', taskResult.error);
          res.status(400).json({ error: taskResult.error });
          return;
        }

        // Return the generated tasks
        res.status(200).json({ 
          tasks: taskResult.tasks,
          message: result.message
        });
        return;
      }

      // Return the conversation response
      res.status(200).json({ 
        message: result.message,
        readyForTaskGeneration: result.readyForTaskGeneration
      });
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    }
  }
}
