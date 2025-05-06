// API utility for consistent server communication
const API_BASE_URL = import.meta.env.VITE_API_SERVER || '';

/**
 * Creates a full API URL by appending the endpoint to the base URL
 * @param endpoint API endpoint (should start with '/')
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Enhanced fetch function that automatically uses the configured API base URL
 * @param endpoint API endpoint (should start with '/')
 * @param options Fetch options
 * @returns Fetch promise
 */
export const fetchApi = (endpoint: string, options?: RequestInit): Promise<Response> => {
  return fetch(getApiUrl(endpoint), options);
};
