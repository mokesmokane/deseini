
/**
 * Takes a ReadableStream<string> and returns a new ReadableStream<string> where each chunk is a full line.
 * Each emitted chunk ends with a newline (if present in the input), or is the last partial line at end-of-stream.
 */
export function streamByLine(input: ReadableStream<string>): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const reader = input.getReader();
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            controller.enqueue(line + '\n');
          }
        }
        if (buffer.length > 0) {
          controller.enqueue(buffer); // Emit any remaining partial line
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });
}