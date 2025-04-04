import express from 'express';
import { OpenAIService } from '../services/OpenAIService.ts';
import type { ConversationResponse, GenerateTasksResponse, StreamedPlanResponse, ChatCompletionChunk } from '../services/OpenAIService.ts'; // Import necessary types

// Controller class following Single Responsibility Principle
export class TaskController {
  private aiService: OpenAIService;
  
  constructor(apiKey: string) {
    this.aiService = new OpenAIService(apiKey);
  }
  
  // Method to generate project tasks or handle conversation steps
  // async generateTasks(req: express.Request, res: express.Response): Promise<void> {
  // --- Method for handling conversation steps (Streaming) ---
  async handleConversationStep(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { prompt, projectContext, messages } = req.body;
      
      // Correctly identify initiation: prompt is null/undefined/empty AND messages are empty/null
      const isInitiation = (prompt == null || prompt === "") && (!messages || messages.length === 0);

      // Validation: Prompt is required ONLY for non-initiation steps
      if (!isInitiation && (prompt == null || typeof prompt !== 'string' || prompt.trim() === '')) {
        res.status(400).json({ error: 'Prompt is required for ongoing conversation' });
        return;
      }
      
      console.log('Handling conversation step request (streaming)...', { isInitiation, prompt, messageCount: messages?.length });

      // --- Task Generation Path (Non-streaming) ---
      // if (confirmUseFunction === true && !isInitiation) {
      //   console.log('Handling task generation request...');
      //   const taskResult = await this.aiService.generateProjectTasks(prompt, projectContext, messages || []);
        
      //   if (taskResult.error) {
      //     console.error('Task generation error:', taskResult.error);
      //     res.status(400).json({ error: taskResult.error });
      //     return;
      //   }

      //   res.status(200).json({ 
      //     tasks: taskResult.tasks,
      //     message: taskResult.message // Include confirmation/completion message
      //   });
      //   return;
      // }

      // --- Conversation Path (Streaming) ---
      // console.log('Handling conversation request (streaming)...');

      const conversationResult: ConversationResponse = await this.aiService.handleConversation(
        isInitiation ? null : prompt, // Pass null prompt for initiation, otherwise pass the string
        projectContext, 
        messages || []
      );

      if (conversationResult.error || !conversationResult.stream) {
        console.error('Conversation error:', conversationResult.error);
        res.status(500).json({ error: conversationResult.error || 'Failed to start conversation stream' });
        return;
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush headers to establish connection

      let accumulatedMessage = '';
      const confirmationMarker = '[CONFIRM_TASK_GENERATION]';

      try {
        // Iterate over the stream and send chunks to the client
        for await (const chunk of conversationResult.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          console.log('>>> Server Stream Chunk Content:', content);
          if (content) {
            accumulatedMessage += content;
            // Check if the accumulated message ends with the marker
            if (accumulatedMessage.endsWith(confirmationMarker)) {
              // Send content *before* the marker
              const messageToSend = accumulatedMessage.replace(confirmationMarker, '');
              if (messageToSend) { 
                  res.write(`data: ${JSON.stringify({ chunk: messageToSend })}\n\n`);
              }
              // Send the confirmation event
              res.write(`event: confirmation_needed\ndata: ${JSON.stringify({ readyForTaskGeneration: true })}\n\n`);
              accumulatedMessage = ''; // Reset accumulator after sending marker content
            } else {
               // Check if marker is within the accumulated message but not at the end (split chunk)
               const markerIndex = accumulatedMessage.indexOf(confirmationMarker);
               if (markerIndex !== -1) {
                   // Send content before the marker
                   const messageBeforeMarker = accumulatedMessage.substring(0, markerIndex);
                    if (messageBeforeMarker) {
                        res.write(`data: ${JSON.stringify({ chunk: messageBeforeMarker })}\n\n`);
                    }
                    // Send confirmation event
                    res.write(`event: confirmation_needed\ndata: ${JSON.stringify({ readyForTaskGeneration: true })}\n\n`);
                    // Keep the part *after* the marker in the accumulator
                    accumulatedMessage = accumulatedMessage.substring(markerIndex + confirmationMarker.length);
               } else {
                  // Send the chunk as is if marker isn't present
                   res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
                  accumulatedMessage = ''; // Clear accumulator if we sent the whole chunk
               }
            }
          }
        }
        
        // If there's remaining content in accumulator that didn't end with marker (shouldn't happen often with current marker logic)
        // if (accumulatedMessage) { 
        //    res.write(`data: ${JSON.stringify({ chunk: accumulatedMessage })}\n\n`);
        // }
        // Send any remaining content in the accumulator (should be rare with current logic)
        if (accumulatedMessage) {
           res.write(`data: ${JSON.stringify({ chunk: accumulatedMessage })}\n\n`);
        }

        // Send a final event to signal stream completion
        res.write(`event: stream_end\ndata: ${JSON.stringify({ message: 'Stream ended' })}\n\n`);
        
      } catch (streamError) {
        console.error('Error processing stream:', streamError);
        // Attempt to send an error event if possible
        if (!res.headersSent) {
             res.status(500).json({ error: 'Error processing stream' });
        } else if (!res.writableEnded) {
             res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
        }
      } finally {
        console.log('Stream ended. Closing connection.');
        console.log('Conversation stream ended. Closing connection.');
        res.end(); // End the response stream
      }

    } catch (error) {
      console.error('API Controller Error:', error);
      console.error('API Controller Error (handleConversationStep):', error);
      // Ensure response isn't sent twice
      if (!res.headersSent) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred' 
        });
      } else {
          console.error("Error occurred after headers sent in handleConversationStep.");
          // Attempt to signal error via stream if possible and not already ended
          if (!res.writableEnded) {
              try {
                 res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Internal server error handling conversation' })}\n\n`);
                 res.end();
              } catch (writeError) {
                  console.error("Failed to write stream error event:", writeError);
                  res.end(); // Force end if write fails
              }
          }
      }
    }
  }

  // --- Method for creating tasks directly from conversation history (Non-streaming) ---
  async createTasksFromConversation(req: express.Request, res: express.Response): Promise<void> {
    try {
        const { prompt, projectContext, messages } = req.body;

        // Validate required fields for task generation
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            res.status(400).json({ error: 'A confirmation prompt/message is required to generate tasks.' });
            return;
        }
        if (!messages || !Array.isArray(messages)) {
             res.status(400).json({ error: 'Conversation history (messages) is required.' });
             return;
        }

        console.log('Handling create tasks request...');
        const taskResult: GenerateTasksResponse = await this.aiService.generateProjectTasks(
            prompt, // The user's confirmation/final instruction
            projectContext,
            messages // The preceding conversation history
        );

        if (taskResult.error) {
          console.error('Task generation error:', taskResult.error);
          // Send specific error message if available, otherwise generic
          res.status(400).json({ error: taskResult.error, // Send full error
                                   details: taskResult.message }); // Send raw markdown if parsing failed
          return;
        }

        // Successfully generated and parsed tasks
        res.status(200).json({
          tasks: taskResult.tasks || [], // Ensure tasks is always an array
          message: taskResult.message || "Tasks generated successfully." // Include confirmation message
        });

    } catch (error) {
      console.error('API Controller Error (createTasksFromConversation):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred during task creation'
        });
      }
    }
  }

  // Method to generate suggested replies based on conversation context
  async generateSuggestions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { messages, projectContext } = req.body;

      // Basic validation
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required and must not be empty' });
        return;
      }
      
      console.log('Generate suggestions request:', { 
        messageCount: messages.length, 
        hasProjectContext: !!projectContext 
      });

      // Call the AI service to generate suggestions
      const result = await this.aiService.generateSuggestedReplies(messages, projectContext);

      if (result.error) {
        console.error('Suggestion generation error:', result.error);
        res.status(400).json({ error: result.error });
        return;
      }

      // Return the generated suggestions
      res.status(200).json({ suggestions: result.suggestions || [] });

    } catch (error) {
      console.error('API error in generateSuggestions:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred during suggestion generation' 
      });
    }
  }

  // Method to generate a project plan in markdown format
  async generateProjectPlan(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { messages, projectContext, currentPlan } = req.body;

      // Basic validation
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Conversation history (messages) is required to generate a plan.' });
        return;
      }
      
      console.log('Generate project plan request:', {
          messageCount: messages.length,
          hasProjectContext: !!projectContext,
          hasCurrentPlan: !!currentPlan
      });

      // Call the AI service - expecting a StreamedPlanResponse
      const result: StreamedPlanResponse = await this.aiService.generateProjectPlan(messages, projectContext, currentPlan);

      if (result.error || !result.stream) {
        console.error('Project plan generation error:', result.error);
        res.status(500).json({ error: result.error || 'Failed to start project plan stream' });
        return;
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush headers to establish connection

      try {
        // Iterate over the stream and send chunks to the client
        for await (const chunk of result.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
             // Send the chunk content
             res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        }
        
        // Send a final event to signal stream completion
        res.write(`event: stream_end\ndata: ${JSON.stringify({ message: 'Plan stream ended' })}\n\n`);
        
      } catch (streamError) {
        console.error('Error processing project plan stream:', streamError);
        // Attempt to send an error event if possible
        if (!res.headersSent) {
             res.status(500).json({ error: 'Error processing project plan stream' });
        } else if (!res.writableEnded) {
             res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Plan stream processing failed' })}\n\n`);
        }
      } finally {
        console.log('Project plan stream ended. Closing connection.');
        res.end(); // End the response stream
      }

    } catch (error) {
      console.error('API Controller Error (generateProjectPlan):', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred during plan generation' 
        });
      } else if (!res.writableEnded) {
           try {
              res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Internal server error handling plan generation' })}\n\n`);
              res.end();
           } catch (writeError) {
               console.error("Failed to write stream error event for plan generation:", writeError);
               res.end(); // Force end if write fails
           }
      }
    }
  }
}
