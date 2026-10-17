/**
 * Resilient JSON Parser & Auto-Sanitizer
 * Recovers malformed JSON with trailing commas, single-line/multi-line comments,
 * and single-quoted properties.
 */

export interface JsonParseResult {
  success: boolean;
  data: unknown;
  isSanitized: boolean;
  sanitizedJson?: string;
  error?: string;
}

/**
 * Sanitizes a loosely formatted JSON string into strict JSON.
 */
export function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();

  // 1. Remove single-line comments // ...
  // Note: Avoid replacing if inside a double-quoted string
  cleaned = cleaned.replace(/(^|[^\\])\/\/.*$/gm, '$1');

  // 2. Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Remove trailing commas in objects and arrays before } or ]
  // e.g. [1, 2,] or {"a": 1,}
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

  // 4. Convert single-quoted string values/keys to double quotes: 'key': 'val' -> "key": "val"
  // Look for single-quoted strings not containing double quotes
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, group) => {
    // Escape unescaped double quotes inside the single-quoted string if any
    const escaped = group.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  // 5. Wrap unquoted object keys: { name: "John" } -> { "name": "John" }
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)\s*:/g, '$1"$2":');

  // 6. Second pass for trailing commas that might have appeared after comment removal
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');

  return cleaned;
}

/**
 * Parses raw JSON string with resilient fallback to sanitization.
 */
export function parseJsonResilient(raw: string): JsonParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      success: false,
      data: null,
      isSanitized: false,
      error: 'Input is empty'
    };
  }

  // Pass 1: Standard JSON.parse
  try {
    const data = JSON.parse(trimmed);
    return {
      success: true,
      data,
      isSanitized: false
    };
  } catch (originalErr) {
    const originalError = originalErr instanceof Error ? originalErr.message : String(originalErr);

    // Pass 2: Sanitized JSON.parse
    try {
      const sanitized = sanitizeJsonString(trimmed);
      const data = JSON.parse(sanitized);
      return {
        success: true,
        data,
        isSanitized: true,
        sanitizedJson: JSON.stringify(data, null, 2),
        error: originalError
      };
    } catch (sanitizedErr) {
      const finalError = sanitizedErr instanceof Error ? sanitizedErr.message : String(sanitizedErr);
      return {
        success: false,
        data: null,
        isSanitized: false,
        error: finalError
      };
    }
  }
}
