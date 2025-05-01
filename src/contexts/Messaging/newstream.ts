/**
 * Parses SSE stream into main content stream and per-code-block streams.
 * @param reader SSE reader from response.body.getReader()
 * @param codeBlocks list of code block languages to extract (case-insensitive)
 */
export function stream(
  reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
  codeBlocks: string[] = []
): { mainStream: ReadableStream<string>; codeBlockStreams: Record<string, ReadableStream<string>> } {
  if (!reader) {
    throw new Error('Reader is undefined');
  }

  const codeBlocksLower = Array.from(new Set(codeBlocks.map(cb => cb.toLowerCase())));
  let mainController!: ReadableStreamDefaultController<string>;
  const codeControllers: Record<string, ReadableStreamDefaultController<string>> = {};

  const mainStream = new ReadableStream<string>({
    start(controller) {
      mainController = controller;
    },
    cancel() {
      reader.cancel();
    },
  });

  const codeBlockStreams: Record<string, ReadableStream<string>> = {};
  for (const lang of codeBlocksLower) {
    codeBlockStreams[lang] = new ReadableStream<string>({
      start(controller) {
        codeControllers[lang] = controller;
      },
      cancel() {
        reader.cancel();
      },
    });
  }

  (async () => {
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const events = text.split(/\n\n/);
        for (const event of events) {
          const line = event.split('\n')[0]?.trim();
          if (!line?.startsWith('data:')) continue;
          const jsonPart = line.slice(5).trim();
          let parsed;
          try {
            parsed = JSON.parse(jsonPart);
          } catch {
            continue;
          }
          const chunk = parsed.chunk;
          mainController.enqueue(chunk);
          fullText += chunk;
        }
      }

      mainController.close();

      const regex = /```([A-Za-z0-9]+)\s*\n([\s\S]*?)```/g;
      let match;
      const found = new Set<string>();
      while ((match = regex.exec(fullText)) !== null) {
        const lang = match[1].toLowerCase();
        const content = match[2];
        if (codeBlocksLower.includes(lang)) {
          found.add(lang);
          codeControllers[lang].enqueue(content);
          codeControllers[lang].close();
        }
      }
      for (const lang of codeBlocksLower) {
        if (!found.has(lang)) {
          codeControllers[lang]?.close();
        }
      }
    } catch (err) {
      mainController.error(err);
      for (const lang of codeBlocksLower) {
        codeControllers[lang]?.error(err);
      }
    }
  })();

  return { mainStream, codeBlockStreams };
}
