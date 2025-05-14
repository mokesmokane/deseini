// messagingService.ts
// Service for messaging/chat API calls
import { fetchApi } from '../utils/api';

/**
 * Sends a message to the conversation API endpoint.
 * @param data The message data to send.
 * @returns The conversation response.
 */
export async function sendConversationMessage(data: any): Promise<any> {
  return fetchApi('/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Generates message suggestions from the backend API.
 * @param data The data for suggestions.
 * @returns The suggestions response.
 */
export async function generateMessageSuggestions(data: any): Promise<any> {
  return fetchApi('/api/generate-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Sends a project consultant chat message.
 * @param data The message data to send.
 * @returns The consultant chat response.
 */
export async function projectConsultantChat(data: any): Promise<any> {
  return fetchApi('/api/project-consultant-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Edits a project chat message.
 * @param data The edit data.
 * @returns The edited chat response.
 */
export async function editProjectChat(data: any): Promise<any> {
  return fetchApi('/api/edit-project-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
