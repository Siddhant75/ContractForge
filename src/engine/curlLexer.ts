import { parseJsonResilient } from './jsonParser';

export interface CurlParseResult {
  isCurl: boolean;
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, unknown>;
  rawBody?: string;
  parsedBody: unknown | null;
  effectivePayload: unknown | null;
  error?: string;
}

/**
 * Tokenizes a shell command string into discrete arguments,
 * respecting single quotes, double quotes, and escaped characters.
 */
export function tokenizeShellCommand(command: string): string[] {
  // Normalize line continuations (\ at end of line, ^ at end of line, ` at end of line)
  const normalized = command
    .replace(/\\[\r\n]+/g, ' ')
    .replace(/\^[\r\n]+/g, ' ')
    .replace(/`[\r\n]+/g, ' ')
    .trim();

  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      // Check for Windows cmd escaped double quote ("")
      if (inDoubleQuote && i + 1 < normalized.length && normalized[i + 1] === '"') {
        current += '"';
        i++; // skip second quote
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parses URL query parameters into an inferred key-value dictionary.
 * Numbers and booleans are coerced for accurate schema inference.
 */
export function parseQueryString(urlStr: string): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};
  const queryIndex = urlStr.indexOf('?');
  if (queryIndex === -1) return queryParams;

  const queryString = urlStr.slice(queryIndex + 1).split('#')[0];
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    if (!pair) continue;
    const [rawKey, rawVal] = pair.split('=');
    const key = decodeURIComponent(rawKey || '');
    const val = rawVal !== undefined ? decodeURIComponent(rawVal) : 'true';

    // Coerce numbers
    if (/^-?\d+(\.\d+)?$/.test(val)) {
      queryParams[key] = Number(val);
    } else if (val.toLowerCase() === 'true') {
      queryParams[key] = true;
    } else if (val.toLowerCase() === 'false') {
      queryParams[key] = false;
    } else {
      queryParams[key] = val;
    }
  }

  return queryParams;
}

/**
 * Detects if a text string looks like a cURL command.
 */
export function isCurlCommand(input: string): boolean {
  const trimmed = input.trim();
  return /^curl\b/i.test(trimmed) || /^\$\s*curl\b/i.test(trimmed);
}

/**
 * Lexes and parses a cURL command into an AST-ready payload.
 */
export function parseCurl(command: string): CurlParseResult {
  const trimmed = command.trim();
  if (!isCurlCommand(trimmed)) {
    return {
      isCurl: false,
      method: 'GET',
      url: '',
      headers: {},
      queryParams: {},
      parsedBody: null,
      effectivePayload: null,
      error: 'Not a cURL command'
    };
  }

  const rawTokens = tokenizeShellCommand(trimmed);
  // Remove leading '$' or 'curl'
  const tokens = rawTokens.filter((t, idx) => {
    if (idx === 0 && t === '$') return false;
    if ((idx === 0 || (idx === 1 && rawTokens[0] === '$')) && t.toLowerCase() === 'curl') return false;
    return true;
  });

  let method: string | null = null;
  let url = '';
  const headers: Record<string, string> = {};
  let rawBody: string | undefined = undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
      }
    } else if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          const hKey = headerStr.slice(0, colonIdx).trim().toLowerCase();
          const hVal = headerStr.slice(colonIdx + 1).trim();
          headers[hKey] = hVal;
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      if (i + 1 < tokens.length) {
        rawBody = tokens[++i];
      }
    } else if (token === '--url') {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
    } else if (!token.startsWith('-') && !url) {
      url = token;
    }
  }

  // Infer default HTTP method
  if (!method) {
    method = rawBody !== undefined ? 'POST' : 'GET';
  }

  const queryParams = parseQueryString(url);

  // Parse Body if present
  let parsedBody: unknown | null = null;
  if (rawBody) {
    const jsonRes = parseJsonResilient(rawBody);
    if (jsonRes.success) {
      parsedBody = jsonRes.data;
    } else {
      parsedBody = rawBody;
    }
  }

  // Effective payload for contract generation:
  // 1. If body exists -> body
  // 2. If no body, but queryParams exist (e.g. GET request) -> queryParams
  // 3. Otherwise empty object
  let effectivePayload: unknown | null = null;
  if (parsedBody !== null) {
    effectivePayload = parsedBody;
  } else if (Object.keys(queryParams).length > 0) {
    effectivePayload = queryParams;
  } else {
    effectivePayload = {};
  }

  return {
    isCurl: true,
    method,
    url,
    headers,
    queryParams,
    rawBody,
    parsedBody,
    effectivePayload
  };
}
