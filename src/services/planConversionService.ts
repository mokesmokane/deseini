/**
 * Service for converting markdown plan to Gantt chart with streaming support
 */

import { fetchApi } from '../utils/api';

/**
 * Gets a stream for converting a markdown plan to a Gantt chart
 * 
 * @param markdownPlan The markdown plan to convert
 * @returns Stream reader with plan conversion data
 */
export const getPlanToGanttStream = async (
  markdownPlan: string
): Promise<ReadableStream<Uint8Array>> => {
  try {
    const response = await fetchApi('/api/convert-plan-to-gantt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ markdownPlan })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to initiate plan conversion stream (Status: ${response.status})`;
      try { 
        const errorData = JSON.parse(errorText); 
        errorMessage = errorData.error || errorMessage; 
      } catch(e) {}
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Response body is null, cannot read stream.");
    }

    return response.body;
  } catch (error) {
    throw error;
  }
};

export default {
  getPlanToGanttStream
};
