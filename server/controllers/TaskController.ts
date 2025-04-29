import express from 'express';
import { OpenAIService } from '../services/OpenAIService.ts';
import type { ConversationResponse, GenerateTasksResponse, StreamedPlanResponse, DraftPlanData, StreamedGanttResponse } from '../services/OpenAIService.ts'; // Import necessary types

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
      
      console.log('Generate project plan request:', {
          messageCount: messages.length,
          hasProjectContext: !!projectContext,
          hasCurrentPlan: !!currentPlan
      });

      // Call the AI service - expecting a StreamedPlanResponse
      const result: StreamedPlanResponse = await this.aiService.generateProjectPlan(messages, projectContext??null, currentPlan??null);

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
             // Flush to ensure data is sent immediately
             (res as any).flushHeaders?.();
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

  // Converts project plan markdown to structured task data for draft plan
  async convertPlanToTasks(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { markdownPlan } = req.body;
      
      // Validate the markdown plan exists
      if (!markdownPlan || typeof markdownPlan !== 'string' || markdownPlan.trim() === '') {
        res.status(400).json({ error: 'Project plan markdown is required' });
        return;
      }
      
      console.log('Converting project plan markdown to task structure...');
      const draftPlanData: DraftPlanData = await this.aiService.parsePlanToTasks(markdownPlan);
      
      if (draftPlanData.error) {
        console.error('Plan conversion error:', draftPlanData.error);
        res.status(400).json({ error: draftPlanData.error });
        return;
      }
      
      res.status(200).json(draftPlanData);
    } catch (error) {
      console.error('API Controller Error (convertPlanToTasks):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      }
    }
  }
  // Converts project plan markdown to structured task data for draft plan
  async convertPlanToGantt(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { markdownPlan } = req.body;
      
      // Validate the markdown plan exists
      if (!markdownPlan || typeof markdownPlan !== 'string' || markdownPlan.trim() === '') {
        res.status(400).json({ error: 'Project plan markdown is required' });
        return;
      }
      
      console.log('Converting project plan markdown to Mermaid Gantt...');
      const ganttResponse: StreamedGanttResponse = await this.aiService.parsePlanToGantt(markdownPlan);
      
      if (ganttResponse.error) {
        console.error('Plan conversion error:', ganttResponse.error);
        res.status(400).json({ error: ganttResponse.error });
        return;
      }
      
      // Set up response headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Stream each chunk from OpenAI to the client
      try {
        for await (const chunk of ganttResponse.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          console.log('Gantt chunk:', content);
          if (content) {
            // Send the content as SSE (Server-Sent Events)
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
            // Flush to ensure data is sent immediately
            (res as any).flushHeaders?.();
          }
        }
        
        // End the stream with a completion event
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error while streaming Gantt chart data' });
        } else {
          // If headers are already sent, just end the stream
          res.write(`data: ${JSON.stringify({ error: 'Error while streaming Gantt chart data' })}\n\n`);
          res.end();
        }
      }
    } catch (error) {
      console.error('API Controller Error (convertPlanToGantt):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      }
    }
  }

  // Generates a final project plan in JSON format for the Gantt chart
  async generateFinalPlan(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { projectContext, messages, draftPlanMarkdown } = req.body;
      
      // Validate required inputs
      if (!projectContext) {
        res.status(400).json({ error: 'Project context is required' });
        return;
      }
      
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Conversation history is required' });
        return;
      }
      
      if (!draftPlanMarkdown || typeof draftPlanMarkdown !== 'string' || draftPlanMarkdown.trim() === '') {
        res.status(400).json({ error: 'Draft plan markdown is required' });
        return;
      }
      
      
      console.log('Generating final project plan...');
      const finalPlanResult = await this.aiService.generateFinalPlan(
        projectContext,
        messages,
        draftPlanMarkdown
      );
      
      if (finalPlanResult.error) {
        console.error('Final plan generation error:', finalPlanResult.error);
        res.status(400).json({ error: finalPlanResult.error });
        return;
      }
      
      res.status(200).json(finalPlanResult.plan);

    } catch (error) {
      console.error('API Controller Error (generateFinalPlan):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      }
    }
  }


  // Judge if a project draft is ready to be created
  async judgeProjectDraftReadiness(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { messageHistory } = req.body;
      
      if (!messageHistory || !Array.isArray(messageHistory)) {
        res.status(400).json({ error: 'Valid chat messages are required' });
        return;
      }

      console.log('Checking project draft readiness...');

      for (const message of messageHistory) {
        console.log('Message:', message);
      }

      const result = await this.aiService.judgeProjectDraftReadiness(messageHistory);
      
      if (result.error) {
        console.error('Project readiness check error:', result.error);
        res.status(400).json({ error: result.error });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('API Controller Error (judgeProjectDraftReadiness):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      }
    }
  }

    // Gets the current project context
  async getProjectContext(req: express.Request, res: express.Response): Promise<void> {
    try {
      // In a real implementation, this would fetch the actual project data from a session or database
      // For now, we'll send a placeholder response with sample project data
      // This would typically come from the authenticated user's session
      
      const projectContext = {
        id: req.query.projectId || 'project-1',
        projectName: 'Sample Project',
        description: 'A sample project for testing the final plan generation',
        roles: [
          { id: 'role-1', name: 'Developer', description: 'Software developer' },
          { id: 'role-2', name: 'Designer', description: 'UI/UX designer' },
          { id: 'role-3', name: 'Project Manager', description: 'Manages the project' }
        ],
        charts: []
      };
      
      res.status(200).json(projectContext);
    } catch (error) {
      console.error('API Controller Error (getProjectContext):', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
      });
    }
  }

  // Edits a specific section of markdown based on an instruction
  async editMarkdownSection(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { fullMarkdown, sectionRange, instruction, projectContext } = req.body;
      
      // Validate required inputs
      if (!fullMarkdown || typeof fullMarkdown !== 'string') {
        res.status(400).json({ error: 'Full markdown content is required' });
        return;
      }
      
      if (!sectionRange || typeof sectionRange.start !== 'number' || typeof sectionRange.end !== 'number') {
        res.status(400).json({ error: 'Valid section range with start and end line numbers is required' });
        return;
      }
      
      if (!instruction || typeof instruction !== 'string') {
        res.status(400).json({ error: 'Instruction for editing is required' });
        return;
      }
      
      console.log('Editing markdown section:', {
        sectionRange: `${sectionRange.start}-${sectionRange.end}`,
        instruction: instruction.substring(0, 50) + (instruction.length > 50 ? '...' : ''),
        hasProjectContext: !!projectContext
      });
      
      const result = await this.aiService.editMarkdownSection(
        fullMarkdown, 
        sectionRange, 
        instruction,
        projectContext || null
      );
      
      if (result.error || !result.stream) {
        console.error('Markdown section editing error:', result.error);
        res.status(400).json({ error: result.error || 'Failed to start markdown edit stream' });
        return;
      }
      
      // Set headers for JSON streaming
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush headers to establish connection
      
      try {
        let currentLine = '';
        
        // Iterate over the stream and send chunks to the client
        for await (const chunk of result.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            // Send the chunk content to the client with type information
            res.write(JSON.stringify({ 
              type: 'chunk',
              content
            }) + '\n');
            
            // Accumulate the content into the current line
            currentLine += content;
            
            // Check if we have a complete line
            if (content.includes('\n')) {
              // Split by newline to handle multiple newlines in one chunk
              const lines = currentLine.split('\n');
              
              // The last element is the start of the next line or an empty string
              currentLine = lines.pop() || '';
              
              // Send each complete line
              for (const line of lines) {
                const linejson = JSON.stringify({ 
                  type: 'line', 
                  content: line 
                }) + '\n'
                console.log('Sending line:', linejson);
                res.write(linejson);
              }
            }
          }
        }
        
        // Send the last line if there's any content remaining
        if (currentLine) {
          res.write(JSON.stringify({ 
            type: 'line', 
            content: currentLine 
          }) + '\n');
        }
        
        // Send a final info event to signal stream completion
        res.write(JSON.stringify({ 
          type: 'info', 
          content: 'Edit stream ended' 
        }) + '\n');
        
      } catch (streamError) {
        console.error('Error processing markdown edit stream:', streamError);
        // Attempt to send an error event if possible
        if (!res.headersSent) {
             res.status(500).json({ error: 'Error processing markdown edit stream' });
        } else if (!res.writableEnded) {
             res.write(JSON.stringify({ 
               type: 'info', 
               content: 'Edit stream processing failed',
               error: true
             }) + '\n');
        }
      } finally {
        console.log('Markdown edit stream ended. Closing connection.');
        res.end(); // End the response stream
      }
    } catch (error) {
      console.error('API Controller Error (editMarkdownSection):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      } else if (!res.writableEnded) {
        try {
          res.write(JSON.stringify({ 
            type: 'info', 
            content: 'Internal server error handling markdown edit',
            error: true
          }) + '\n');
          res.end();
        } catch (writeError) {
          console.error("Failed to write stream error event for markdown edit:", writeError);
          res.end(); // Force end if write fails
        }
      }
    }
  }

  // Enhance project prompt endpoint
  async enhanceProjectPrompt(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { initialPrompt } = req.body;
      
      // Validate required inputs
      if (!initialPrompt || typeof initialPrompt !== 'string' || initialPrompt.trim() === '') {
        res.status(400).json({ error: 'Initial prompt is required' });
        return;
      }
      
      // Call OpenAI API with streaming enabled
      const result = await this.aiService.enhanceProjectPrompt(initialPrompt);
      
      if (result.error || !result.stream) {
        console.error('Prompt enhancement error:', result.error);
        res.status(500).json({ error: result.error || 'Failed to start enhancement stream' });
        return;
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush headers to establish connection

      let accumulatedContent = '';

      try {
        // Iterate over the stream and send chunks to the client
        for await (const chunk of result.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedContent += content;
            // Send the chunk content to the client
            console.log('Sending chunk:', content);
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        }
        
        // Send a final event to signal stream completion
        res.write(`event: stream_end\ndata: ${JSON.stringify({ message: 'Stream ended', fullContent: accumulatedContent })}\n\n`);
        
      } catch (streamError) {
        console.error('Error processing enhancement stream:', streamError);
        // Attempt to send an error event if possible
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error processing enhancement stream' });
        } else if (!res.writableEnded) {
          res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
        }
      } finally {
        console.log('Enhancement stream ended. Closing connection.');
        res.end(); // End the response stream
      }
    } catch (error) {
      console.error('API Controller Error (enhanceProjectPrompt):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      } else if (!res.writableEnded) {
        try {
          res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Internal server error enhancing prompt' })}\n\n`);
          res.end();
        } catch (writeError) {
          console.error("Failed to write stream error event:", writeError);
          res.end(); // Force end if write fails
        }
      }
    }
  }

  async projectConsultantChat(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { messageHistory, projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations } = req.body;

      const result = await this.aiService.projectConsultantChat(
        messageHistory,
        projectReady,
        projectReadyReason,
        percentageComplete,
        projectReadyRecommendations
      );

      if (result.error || !result.stream) {
        console.error('Project consultant chat error:', result.error);
        res.status(500).json({ error: result.error || 'Failed to start chat stream' });
        return;
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders(); // Flush headers to establish connection

      let accumulatedContent = '';

      try {
        // Iterate over the stream and send chunks to the client
        for await (const chunk of result.stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedContent += content;
            // Send the chunk content to the client
            console.log('Sending chunk:', content);
            res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
          }
        }
        
        // Send a final event to signal stream completion
        res.write(`event: stream_end\ndata: ${JSON.stringify({ message: 'Stream ended', fullContent: accumulatedContent })}\n\n`);
        
      } catch (streamError) {
        console.error('Error processing chat stream:', streamError);
        // Attempt to send an error event if possible
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error processing chat stream' });
        } else if (!res.writableEnded) {
          res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`);
        }
      } finally {
        console.log('Chat stream ended. Closing connection.');
        res.end(); // End the response stream
      }
    } catch (error) {
      console.error('API Controller Error (projectConsultantChat):', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'An unknown internal server error occurred'
        });
      } else if (!res.writableEnded) {
        try {
          res.write(`event: stream_error\ndata: ${JSON.stringify({ error: 'Internal server error processing chat' })}\n\n`);
          res.end();
        } catch (writeError) {
          console.error("Failed to write stream error event:", writeError);
          res.end(); // Force end if write fails
        }
      }
    }
  }
}
