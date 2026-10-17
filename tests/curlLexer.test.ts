import { describe, it, expect } from 'vitest';
import { parseCurl, isCurlCommand, tokenizeShellCommand } from '../src/engine/curlLexer';

describe('curlLexer', () => {
  it('correctly identifies curl command strings', () => {
    expect(isCurlCommand('curl https://api.stripe.com/v1/charges')).toBe(true);
    expect(isCurlCommand('$ curl -X GET https://example.com')).toBe(true);
    expect(isCurlCommand('{"name": "test"}')).toBe(false);
  });

  it('tokenizes shell arguments respecting quotes and line breaks', () => {
    const cmd = `curl -X POST "https://api.example.com/v1" \\
      -H "Content-Type: application/json" \\
      -d '{"amount": 1000}'`;
    const tokens = tokenizeShellCommand(cmd);
    expect(tokens).toContain('-X');
    expect(tokens).toContain('POST');
    expect(tokens).toContain('https://api.example.com/v1');
    expect(tokens).toContain('-H');
    expect(tokens).toContain('Content-Type: application/json');
    expect(tokens).toContain('-d');
    expect(tokens).toContain('{"amount": 1000}');
  });

  it('parses a multi-line POST cURL with headers and JSON body', () => {
    const cmd = `curl -X POST https://api.stripe.com/v1/payment_intents \\
      -H "Authorization: Bearer sk_test_secret" \\
      -H "Content-Type: application/json" \\
      -d '{"amount": 2500, "currency": "usd", "confirm": true}'`;

    const result = parseCurl(cmd);
    expect(result.isCurl).toBe(true);
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://api.stripe.com/v1/payment_intents');
    expect(result.headers['authorization']).toBe('Bearer sk_test_secret');
    expect(result.headers['content-type']).toBe('application/json');
    expect(result.parsedBody).toEqual({
      amount: 2500,
      currency: 'usd',
      confirm: true
    });
    expect(result.effectivePayload).toEqual(result.parsedBody);
  });

  it('parses a GET cURL with query parameters and converts them to root schema', () => {
    const cmd = `curl 'https://api.github.com/repos/owner/repo/issues?state=closed&per_page=50&active=true' \\
      -H 'Accept: application/vnd.github+json'`;

    const result = parseCurl(cmd);
    expect(result.isCurl).toBe(true);
    expect(result.method).toBe('GET');
    expect(result.queryParams).toEqual({
      state: 'closed',
      per_page: 50,
      active: true
    });
    // When no body is present, effectivePayload MUST be query parameters!
    expect(result.effectivePayload).toEqual({
      state: 'closed',
      per_page: 50,
      active: true
    });
  });

  it('recovers malformed JSON inside cURL body with trailing commas', () => {
    const cmd = `curl -X POST https://api.test.com/data -d '{"tag": "alpha", "score": 98, }'`;
    const result = parseCurl(cmd);
    expect(result.isCurl).toBe(true);
    expect(result.parsedBody).toEqual({ tag: 'alpha', score: 98 });
  });

  it('handles Windows cmd style with carets ^ and double-double quotes', () => {
    const cmd = `curl -X POST ^
      https://api.test.com/order ^
      -d "{ ""orderId"": ""ord_44"", ""total"": 99.5 }"`;
    const result = parseCurl(cmd);
    expect(result.isCurl).toBe(true);
    expect(result.parsedBody).toEqual({ orderId: 'ord_44', total: 99.5 });
  });
});
