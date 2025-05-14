// roleService.ts
// Service for role-related API calls
import { fetchApi } from '../utils/api';

/**
 * Extracts role info from provided data using the backend API.
 * @param data The data to extract role info from.
 * @returns The extracted role info response.
 */
export async function extractRoleInfo(data: any): Promise<Response> {
  return fetchApi('/api/extract-role-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
