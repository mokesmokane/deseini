/**
 * Interface for streaming data response
 */
export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}

/**
 * Process streaming response data, handling errors and formatting
 * @param responseBody Readable stream from fetch response
 * @param onData Callback for each chunk of data
 * @param onComplete Callback when streaming is complete
 * @param onError Callback for stream errors
 */
export const processStreamResponse = async (
  responseBody: ReadableStream<Uint8Array>,
  onData: (content: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  if (!responseBody) {
    onError(new Error("Response body is null, cannot read stream."));
    return;
  }

  try {
    const reader = responseBody.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Process any remaining buffer content
        if (buffer.length > 0) {
          onData(buffer);
        }
        onComplete();
        break;
      }
      
      try {
        // Process the value line by line
        const lines = value.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.substring(6);
            try {
              const jsonData: StreamResponse = JSON.parse(dataContent);
              
              // Process content
              if (jsonData.content !== undefined) {
                onData(jsonData.content);
              }
              
              // Check if we're done
              if (jsonData.done) {
                onComplete();
                return;
              }
              
              // Handle error
              if (jsonData.error) {
                onError(new Error(jsonData.error));
                return;
              }
            } catch (e) {
              // If JSON parsing fails, treat as plain text
              console.warn("Failed to parse JSON from data line:", e);
              buffer += dataContent;
            }
          } else {
            // Handle non-data lines as plain text
            buffer += line;
          }
        }
        
        // Process any complete content in the buffer
        if (buffer.length > 0) {
          onData(buffer);
          buffer = '';
        }
      } catch (e) {
        // Fallback if there's any error in parsing
        console.warn("Error processing stream value:", e);
        buffer += value;
        
        // Still try to process the buffer
        if (buffer.length > 0) {
          onData(buffer);
          buffer = '';
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};
