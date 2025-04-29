/**
 * Transform a text stream into a line-by-line stream
 * This utility provides a clean separation between stream processing and line processing
 */

/**
 * Create a TransformStream that converts a stream of text chunks into a stream of complete lines
 * Each chunk emitted by the resulting stream is a complete line (or the final line)
 * 
 * @returns A TransformStream that converts chunks to lines
 */
export function createLineStream(): TransformStream<string, string> {
  let buffer = '';
  
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      // Add the new chunk to our buffer
      buffer += chunk;
      
      // Split the buffer by newlines
      const lines = buffer.split('\n');
      
      // Keep the last part in the buffer (it might be an incomplete line)
      buffer = lines.pop() || '';
      
      // Emit each complete line
      for (const line of lines) {
        controller.enqueue(line);
      }
    },
    
    // When the stream is closing, emit any remaining content in the buffer
    flush(controller) {
      if (buffer) {
        controller.enqueue(buffer);
      }
    }
  });
}

/**
 * Transform a text stream reader into a line-by-line stream reader
 * 
 * @param reader The input stream reader
 * @returns A reader that emits complete lines
 */
export function createLineReader(
  reader: ReadableStreamDefaultReader<string>
): ReadableStreamDefaultReader<string> {
  // Create a readable stream from the reader
  const readableStream = new ReadableStream<string>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          controller.close();
          return;
        }
        
        if (value) {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    
    cancel() {
      reader.cancel();
    }
  });
  
  // Transform the stream into lines and return a new reader
  return readableStream
    .pipeThrough(createLineStream())
    .getReader();
}

export default {
  createLineStream,
  createLineReader
};
