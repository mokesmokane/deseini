/**
 * Utility to convert a ReadableStream into a stream of lines
 * This provides a clean separation of concerns between stream reading and line processing
 */

/**
 * Process a reader stream line by line
 * @param initialText The starting text content (can be empty)
 * @param reader The stream reader to process
 * @param onLines Callback that receives arrays of complete lines as they're available
 * @param onComplete Optional callback when stream is complete
 */
export const streamByLine = async (
  initialText: string,
  reader: ReadableStreamDefaultReader<string>,
  onLines: (lines: string[]) => void,
  onComplete?: (finalText: string) => void
): Promise<string> => {
  let buffer = '';
  let textReceived = initialText;
  
  try {
    let reading = true;
    while (reading) {
      const { done, value } = await reader.read();
      
      if (done) {
        reading = false;
        break;
      }
      
      // Process the chunk into lines
      buffer += value;
      const lines = buffer.split('\n');
      
      // Keep the last potentially incomplete line in buffer
      buffer = lines.pop() || '';
      
      if (lines.length > 0) {
        // Call the line handler with complete lines
        onLines(lines);
        
        // Update the received text
        textReceived += lines.join('\n') + '\n';
      }
    }
    
    // Process any remaining content in buffer
    if (buffer) {
      onLines([buffer]);
      textReceived += buffer;
    }
    
    // Call the completion handler if provided
    if (onComplete) {
      onComplete(textReceived);
    }
    
    return textReceived;
  } catch (error) {
    console.error('Error processing stream by line:', error);
    throw error;
  }
};

export default streamByLine;
