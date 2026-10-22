import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createContractForgeServer } from '../src/mcp/server.js';

function getTextContent(result: any): string {
  const content = result.content as Array<{ type: string; text: string }>;
  return content[0].text;
}

describe('ContractForge MCP Server', () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeEach(async () => {
    const server = createContractForgeServer();
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
  });

  it('lists all 3 exposed MCP tools with valid schemas', async () => {
    const response = await client.listTools();
    const toolNames = response.tools.map((t) => t.name);

    expect(toolNames).toContain('infer_contract');
    expect(toolNames).toContain('fuzz_contract');
    expect(toolNames).toContain('dynamic_tool_register');

    const inferTool = response.tools.find((t) => t.name === 'infer_contract');
    expect(inferTool?.inputSchema.properties).toHaveProperty('input');
    expect(inferTool?.inputSchema.properties).toHaveProperty('target');
  });

  it('infer_contract handles raw JSON and generates all 4 targets', async () => {
    const rawJson = JSON.stringify({
      user_id: 'usr_4920',
      is_active: true,
      score: 95.5,
      roles: ['admin', 'billing'],
    });

    const result = await client.callTool({
      name: 'infer_contract',
      arguments: {
        input: rawJson,
        target: 'all',
        function_name: 'test_user_api',
      },
    });

    const text = getTextContent(result);
    const parsed = JSON.parse(text);
    expect(parsed.status).toBe('success');
    expect(parsed.detected_input_type).toBe('json');
    expect(parsed.typescript).toContain('export interface Root');
    expect(parsed.zod).toContain('z.object');

    // OpenAI Strict Mode invariants check
    expect(parsed.openai_strict.function.strict).toBe(true);
    expect(parsed.openai_strict.function.name).toBe('test_user_api');
    expect(parsed.openai_strict.function.parameters.additionalProperties).toBe(false);

    // Anthropic tool check
    expect(parsed.anthropic_claude.name).toBe('test_user_api');
    expect(parsed.anthropic_claude.input_schema.type).toBe('object');
  });

  it('infer_contract handles multi-line cURL commands with headers and query params', async () => {
    const curlCmd = `curl -X POST "https://api.stripe.com/v1/payment_intents?client=mobile" \\
      -H "Authorization: Bearer sk_test_123" \\
      -H "Content-Type: application/json" \\
      -d '{"amount": 5000, "currency": "usd"}'`;

    const result = await client.callTool({
      name: 'infer_contract',
      arguments: {
        input: curlCmd,
        target: 'openai',
        function_name: 'stripe_charge',
      },
    });

    const text = getTextContent(result);
    const parsed = JSON.parse(text);
    expect(parsed.detected_input_type).toBe('curl');
    expect(parsed.metadata.method).toBe('POST');
    expect(parsed.metadata.url).toBe('https://api.stripe.com/v1/payment_intents?client=mobile');
    expect(parsed.openai_strict).toBeDefined();
    expect(parsed.openai_strict.function.parameters.properties).toHaveProperty('amount');
    expect(parsed.openai_strict.function.parameters.properties).toHaveProperty('currency');
  });

  it('fuzz_contract compiles in-memory Zod and reports 200 OK and 422 REJECTED mutations', async () => {
    const rawJson = JSON.stringify({
      id: 'ord_990',
      total: 129.99,
      customer_email: 'buyer@example.com',
    });

    const result = await client.callTool({
      name: 'fuzz_contract',
      arguments: {
        input: rawJson,
        mutations: 3,
      },
    });

    const text = getTextContent(result);
    const parsed = JSON.parse(text);
    expect(parsed.status).toBe('success');
    expect(parsed.test_summary.total_cases).toBeGreaterThanOrEqual(4);
    expect(parsed.test_summary.passed_valid_cases).toBe(1); // Happy path
    expect(parsed.test_summary.intercepted_chaos_mutations).toBeGreaterThanOrEqual(3);

    // Check Happy Path is 200 OK
    const happyCase = parsed.test_cases.find((c: any) => c.name.includes('Happy Path'));
    expect(happyCase.simulated_http_status).toBe('200 OK');
    expect(happyCase.validation_passed).toBe(true);

    // Check at least one 422 REJECTED mutation
    const fuzzCase = parsed.test_cases.find((c: any) => c.simulated_http_status.includes('422'));
    expect(fuzzCase.validation_passed).toBe(false);
    expect(fuzzCase.errors.length).toBeGreaterThan(0);
  });

  it('dynamic_tool_register synthesizes agent-ready registration definitions', async () => {
    const curl = `curl https://api.weather.com/v1/forecast?city=Seattle&units=celsius`;

    const result = await client.callTool({
      name: 'dynamic_tool_register',
      arguments: {
        input: curl,
        tool_name: 'get_weather_forecast',
        description: 'Fetches live multi-day weather forecast by city name and units.',
        format: 'both',
      },
    });

    const text = getTextContent(result);
    const parsed = JSON.parse(text);
    expect(parsed.status).toBe('ready_to_register');
    expect(parsed.tool_name).toBe('get_weather_forecast');
    expect(parsed.openai_tool_definition.function.name).toBe('get_weather_forecast');
    expect(parsed.openai_tool_definition.function.description).toContain('Fetches live multi-day');
    expect(parsed.anthropic_tool_definition.name).toBe('get_weather_forecast');
    expect(parsed.anthropic_tool_definition.description).toContain('Fetches live multi-day');
  });

  it('throws helpful McpError on empty input', async () => {
    await expect(
      client.callTool({
        name: 'infer_contract',
        arguments: {
          input: '   ',
        },
      })
    ).rejects.toThrow();
  });
});
