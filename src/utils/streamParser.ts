// Pure functions to parse SSE stream data and extract complete lines

export interface ProcessStreamResult {
  completeLines: string[];
  buffer: string;
}

/**
 * Parses SSE text for all 'data:' entries and concatenates their chunk values.
 */
export function parseRawSSE(value: string, jsonParam: string = 'chunk'): string {
  const prefix = 'data: ';
  console.log('[Parse raw SSE] value:', value);
  const occurrences = (value.match(/data: /g) || []).length;
  if (occurrences === 0) return value;
  // Single-event: use full JSON (may include embedded newlines)
  if (occurrences === 1) {
    const start = value.indexOf(prefix) + prefix.length;
    const dataContent = value.substring(start);
    try {
      const obj = JSON.parse(dataContent);
      if (typeof obj[jsonParam] === 'string'){
        console.log('[Parse raw SSE] obj.' + jsonParam + ':', obj[jsonParam]);
        return obj[jsonParam];
      }
    } catch {
      // fallback to manual extraction
      const cp = '"' + jsonParam + '":"';
      const idx = dataContent.indexOf(cp);
      let rest = idx >= 0 ? dataContent.substring(idx + cp.length) : dataContent;
      // strip trailing quotes/braces
      if (rest.endsWith('"}')) rest = rest.slice(0, -2);
      else if (rest.endsWith('"')) rest = rest.slice(0, -1);
      console.log('[Parse raw SSE] rest:', rest);
      return rest;
    }
    return '';
  }
  // Multi-event: split by lines
  const lines = value.split(/\r?\n/);
  let output = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(prefix)) continue;
    const dataContent = trimmed.substring(prefix.length);
    try {
      const obj = JSON.parse(dataContent);
      
      if (typeof obj[jsonParam] === 'string') {
        output += obj[jsonParam];
        continue;
      }
    } catch {
      // fallback
      const cp = '"' + jsonParam + '":"';
      const idx = dataContent.indexOf(cp);
      let rest = idx >= 0 ? dataContent.substring(idx + cp.length) : dataContent;
      if (rest.endsWith('"}')) rest = rest.slice(0, -2);
      else if (rest.endsWith('"')) rest = rest.slice(0, -1);
      output += rest;
    }
  }
  return output;
}

/**
 * Processes a raw SSE chunk and prior buffer to extract complete lines.
 */
export function processStreamValue(
  buffer: string,
  rawValue: string
): ProcessStreamResult {
  const combined = buffer + parseRawSSE(rawValue);
  const parts = combined.split('\n');
  // For first payload, if multiple lines, return all as complete
  if (buffer === '' && parts.length > 1) {
    return { completeLines: parts, buffer: '' };
  }
  if (parts.length > 1) {
    const newBuffer = parts.pop()!;
    return { completeLines: parts, buffer: newBuffer };
  }
  return { completeLines: [], buffer: combined };
}
