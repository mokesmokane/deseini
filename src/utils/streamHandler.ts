import { parseRawSSE } from "./streamParser";

/**
 * Converts a ReadableStream<Uint8Array> (from fetch) into a ReadableStream<string> of SSE text content.
 * This only handles the SSE parsing, not line buffering.
 */
export function sseStreamToText(
  responseBody: ReadableStream<Uint8Array>,
  jsonParam: string = 'chunk'
): ReadableStream<string> {
  if (!responseBody) {
    return new ReadableStream({
      start(controller) {
        controller.error(new Error("Response body is null, cannot read stream."));
        controller.close();
      }
    });
  }

  return new ReadableStream<string>({
    async start(controller) {
      try {
        const reader = responseBody.pipeThrough(new TextDecoderStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          // Parse SSE text (may be multiple events in one chunk)
          const sseText = parseRawSSE(value, jsonParam);
          if (sseText) controller.enqueue(sseText);
        }
      } catch (error) {
        controller.error(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
}
