import { describe, it, expect } from 'vitest';
import { parseJsonResilient, sanitizeJsonString } from '../src/engine/jsonParser';

describe('jsonParser & Auto-Sanitizer', () => {
  it('parses valid JSON without sanitization', () => {
    const raw = '{"id": "usr_123", "active": true, "count": 42}';
    const result = parseJsonResilient(raw);
    expect(result.success).toBe(true);
    expect(result.isSanitized).toBe(false);
    expect(result.data).toEqual({ id: 'usr_123', active: true, count: 42 });
  });

  it('recovers JSON with trailing commas in objects and arrays', () => {
    const malformed = `{
      "items": [
        "apple",
        "banana",
      ],
      "user": {
        "name": "Maya",
        "role": "Admin",
      },
    }`;
    const result = parseJsonResilient(malformed);
    expect(result.success).toBe(true);
    expect(result.isSanitized).toBe(true);
    expect(result.data).toEqual({
      items: ['apple', 'banana'],
      user: { name: 'Maya', role: 'Admin' }
    });
  });

  it('removes single-line and multi-line comments', () => {
    const withComments = `{
      // User identifier
      "id": 100,
      /* Multi-line config block */
      "settings": {
        "theme": "dark" // default theme
      }
    }`;
    const result = parseJsonResilient(withComments);
    expect(result.success).toBe(true);
    expect(result.isSanitized).toBe(true);
    expect(result.data).toEqual({
      id: 100,
      settings: { theme: 'dark' }
    });
  });

  it('converts single quotes to double quotes and recovers unquoted keys', () => {
    const jsObject = `{
      name: 'ContractForge',
      version: '1.0.0',
      active: true,
    }`;
    const result = parseJsonResilient(jsObject);
    expect(result.success).toBe(true);
    expect(result.isSanitized).toBe(true);
    expect(result.data).toEqual({
      name: 'ContractForge',
      version: '1.0.0',
      active: true
    });
  });

  it('handles empty string and completely unparseable garbage', () => {
    const emptyResult = parseJsonResilient('   ');
    expect(emptyResult.success).toBe(false);
    expect(emptyResult.error).toBe('Input is empty');

    const garbageResult = parseJsonResilient('this is definitely not json {{');
    expect(garbageResult.success).toBe(false);
    expect(garbageResult.error).toBeDefined();
  });
});
