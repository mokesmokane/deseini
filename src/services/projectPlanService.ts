/**
 * Service for project plan generation with clean text stream
 */

import { ChatMessage } from '../types';

/**
 * Get a project plan stream with the "data:{}" formatting removed
 * Returns a reader that provides the raw text content
 * 
 * @param messages Chat messages to generate from
 * @param currentPlan Optional existing plan
 * @returns Stream reader with clean content
 */
export const getCleanProjectPlanStream = async (
  messages: ChatMessage[],
  currentPlan: string | null
): Promise<ReadableStream<string>> => {
  const requestBody = JSON.stringify({
    messages,
    projectContext: null,
    currentPlan
  });

  const response = await fetch('/api/generate-project-plan', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream' 
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Failed to initiate project plan stream (Status: ${response.status})`;
    try { 
      const errorData = JSON.parse(errorText); 
      errorMessage = errorData.error || errorMessage; 
    } catch(e) {}
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Response body is null, cannot read stream.");
  }

  // First decode the stream to text
  const textStream = response.body.pipeThrough(new TextDecoderStream());
  
  // Create a special TransformStream for SSE parsing and data extraction
  // Use a closure to maintain state between transform calls
  let textBuffer = '';
  
  const cleanStream = new TransformStream<string, string>({
    transform(chunk, controller) {
      // Process line by line to properly extract content
      textBuffer += chunk;
      
      // Look for complete "data:" lines in the buffer
      const processBuffer = () => {
        const dataPrefix = 'data: ';
        const dataIndex = textBuffer.indexOf(dataPrefix);
        
        if (dataIndex === -1) return false; // No data line found
        
        // Find the end of the line
        const endIndex = textBuffer.indexOf('\n', dataIndex);
        if (endIndex === -1) return false; // Incomplete line
        
        // Extract the data line
        const dataLine = textBuffer.substring(dataIndex + dataPrefix.length, endIndex).trim();
        
        try {
          // Parse the JSON and extract the chunk content
          const jsonData = JSON.parse(dataLine);
          if (jsonData && jsonData.chunk) {
            controller.enqueue(jsonData.chunk);
          }
        } catch (e) {
          console.warn('Failed to parse data line:', dataLine, e);
        }
        
        // Remove the processed part from the buffer
        textBuffer = textBuffer.substring(endIndex + 1);
        return true; // Successfully processed a line
      };
      
      // Process all complete lines in the buffer
      let found = true;
      while (found) {
        found = processBuffer();
      }
    },
    
    flush(controller) {
      // Try to process any remaining buffer content
      if (textBuffer.trim().length > 0) {
        const dataPrefix = 'data: ';
        const dataIndex = textBuffer.indexOf(dataPrefix);
        
        if (dataIndex !== -1) {
          const dataLine = textBuffer.substring(dataIndex + dataPrefix.length).trim();
          
          try {
            const jsonData = JSON.parse(dataLine);
            if (jsonData && jsonData.chunk) {
              controller.enqueue(jsonData.chunk);
            }
          } catch (e) {
            console.warn('Failed to parse final data line:', e);
          }
        }
      }
    }
  });
  
  // Connect the streams and return the reader
  return textStream.pipeThrough(cleanStream);
};

export default {
  getCleanProjectPlanStream
};
