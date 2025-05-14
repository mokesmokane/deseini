/**
 * Service for project plan generation with clean text stream
 */

import { Project } from '../types';
import { Message } from '../components/landing/types';
import { fetchApi } from '../utils/api';

  /**
 * Get a project plan stream with the "data:{}" formatting removed
 * Returns a reader that provides the raw text content
 * 
 * @param messages Chat messages to generate from
 * @param currentPlan Optional existing plan
 * @returns Stream reader with clean content
 */
// Utility to prepend quote content to message content
function prependQuotesToMessages(messages: Message[]): Message[] {
  return messages.map((msg) => {
    if (!msg.quotes || msg.quotes.length === 0) return msg;
    const quoteBlocks = msg.quotes.map(q =>
      `\`\`\`quote from ${q.sectionTitle}\n${q.content}\n\`\`\``
    ).join('\n\n');
    // Prepend to content (if present)
    return {
      ...msg,
      content: quoteBlocks + (msg.content ? `\n\n${msg.content}` : ''),
    };
  });
}

export interface EditProjectChatOptions {
  messageHistory: Message[];
  projectMarkdown: string;
  mermaidMarkdown: string;
}

/**
 * Calls the /api/edit-project-chat endpoint and returns the Response.
 * Handles SSE streaming response for edited project plan and mermaid markdown.
 */
export async function editProjectChat(options: EditProjectChatOptions): Promise<Response> {
  const processedMessages = prependQuotesToMessages(options.messageHistory);
  const body = JSON.stringify({
    messageHistory: processedMessages,
    projectMarkdown: options.projectMarkdown,
    mermaidMarkdown: options.mermaidMarkdown
  });
  return fetchApi('/api/edit-project-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
}

export const getCleanProjectPlanStream = async (
  messages: Message[],
  currentPlan: string | null
): Promise<ReadableStream<string>> => {
  // Preprocess messages to prepend quotes
  const processedMessages = prependQuotesToMessages(messages);
  const requestBody = JSON.stringify({
    messages: processedMessages,
    projectContext: null,
    currentPlan
  });

  const response = await fetchApi('/api/generate-project-plan', {
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
    } catch (e) { }
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

/**
 * Enhances a project prompt via the backend API.
 */
export interface EnhanceProjectPromptOptions { initialPrompt: string; }
export async function enhanceProjectPrompt(data: EnhanceProjectPromptOptions): Promise<Response> {
  return fetchApi('/api/enhance-project-prompt', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
}

/**
 * Creates tasks from provided data.
 */
export interface CreateTasksOptions {
  prompt: string;
  projectContext: Project;
  messages: Message[];
  model?: string;
}
export async function createTasks(data: any): Promise<Response> {
  return fetchApi('/api/create-tasks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
}

/**
 * Generates a project plan from provided data.
 */
export interface GenerateProjectPlanOptions {
  messages: Message[];
  projectContext: Project;
  currentPlan: string | null;
}
export async function generateProjectPlan(data: GenerateProjectPlanOptions): Promise<Response> {
  return fetchApi('/api/generate-project-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
}

/**
 * Judges project draft readiness.
 */
export interface JudgeProjectDraftReadinessOptions {
  messageHistory: { content: string; role: Message['role'] }[];
}
export async function judgeProjectDraftReadiness(data: JudgeProjectDraftReadinessOptions): Promise<Response> {
  return fetchApi('/api/judge-project-draft-readiness', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
}

/**
 * Generates the final project plan.
 */
export interface GenerateFinalPlanOptions {
  projectContext: Project;
  messages: Message[];
  draftPlanMarkdown: string;
}
export async function generateFinalPlan(data: GenerateFinalPlanOptions): Promise<Response> {
  return fetchApi('/api/generate-final-plan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
}

export default {
  getCleanProjectPlanStream,
  enhanceProjectPrompt,
  createTasks,
  generateProjectPlan,
  judgeProjectDraftReadiness,
  generateFinalPlan
};
