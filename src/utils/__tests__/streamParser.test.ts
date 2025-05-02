import { parseRawSSE, processStreamValue } from '../streamParser';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('parseRawSSE', () => {
  it('extracts chunk from single data line', () => {
    const input = 'data: {"chunk":"Hello"}';
    expect(parseRawSSE(input)).toBe('Hello');
  });

  it('concatenates multiple lines and filters blanks', () => {
    const input = 'data: {"chunk":"Line1"}\n\n data: {"chunk":"Line2"}\n';
    expect(parseRawSSE(input)).toBe('Line1Line2');
  });

  it('falls back to raw content on JSON parse error', () => {
    const input = 'data: {invalid json}';
    expect(parseRawSSE(input)).toBe('{invalid json}');
  });

  it('returns plain line when not prefixed', () => {
    const input = 'Just text';
    expect(parseRawSSE(input)).toBe('Just text');
  });
});

describe('processStreamValue', () => {
  it('processes complete lines and returns buffer', () => {
    const buffer = '';
    const raw = 'data: {"chunk":"foo\nbar"}';
    const result = processStreamValue(buffer, raw);
    expect(result.completeLines).toEqual(['foo', 'bar']);
    expect(result.buffer).toBe('');
  });

  it('handles split lines across chunks', () => {
    const buffer = 'line1';
    const raw = 'data: {"chunk":"\nline2\npar';
    const result = processStreamValue(buffer, raw);
    expect(result.completeLines).toEqual(['line1', 'line2']);
    expect(result.buffer).toBe('par');
  });

  it('returns empty completeLines when no newline', () => {
    const buffer = '';
    const raw = 'data: {"chunk":"partial"}';
    const result = processStreamValue(buffer, raw);
    expect(result.completeLines).toEqual([]);
    expect(result.buffer).toBe('partial');
  });
});

describe.skip('processStreamValue full stream', () => {
  it('processes streamed chunks to reconstruct markdown', () => {
    const filePath = path.resolve(__dirname, 'streamed_chunks.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawLines = fileContent
      .split(/\r?\n/)
      .filter(line => line.trim().startsWith('data:'));
    let buffer = '';
    const collectedLines: string[] = [];
    for (const raw of rawLines) {
      const { completeLines, buffer: newBuffer } = processStreamValue(buffer, raw);
      collectedLines.push(...completeLines);
      buffer = newBuffer;
    }
    if (buffer) collectedLines.push(buffer);
    const reconstructed = collectedLines.join('\n');
    const expected = parseRawSSE(fileContent);
    expect(reconstructed).toBe(expected);
  });
});

describe('parseRawSSE full stream', () => {
  it('reconstructs markdown from streamed_chunks.txt', () => {
    const filePath = path.resolve(__dirname, 'streamed_chunks.txt');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseRawSSE(raw);
    // Basic structure assertions
    expect(parsed.startsWith('---')).toBe(true);
    expect(parsed).toContain('# Timescales');
    expect(parsed).toContain('- Project duration: 6 months');
    expect(parsed).toContain('# Scope');
    expect(parsed).toContain('# Tasks');
    expect(parsed).toContain('# Milestones');
    expect(parsed).toContain('# Deliverables');
  });
});
