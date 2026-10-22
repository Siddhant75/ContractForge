import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { isCurlCommand, parseCurl } from '../engine/curlLexer.js';
import { parseJsonResilient } from '../engine/jsonParser.js';
import { inferSchema } from '../engine/schemaInferrer.js';
import { generateTypeScript } from '../engine/generators/typescript.js';
import { generateZod } from '../engine/generators/zod.js';
import { generateOpenAiStrict } from '../engine/generators/openAiStrict.js';
import { generateAnthropic } from '../engine/generators/anthropic.js';
import { compileZodSchema, generateFuzzTestCases, executeFuzzSuite } from '../engine/chaosFuzzer.js';

/**
 * Creates and configures the ContractForge MCP Server.
 */
export function createContractForgeServer(): Server {
  const server = new Server(
    {
      name: 'contractforge-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'infer_contract',
          description:
            'Transforms raw API responses or multi-line cURL commands into strictly validated TypeScript interfaces, Zod schemas, OpenAI Strict Structured Outputs, and Anthropic Claude tool specifications.',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description:
                  'Raw JSON string or multi-line cURL command to ingest and convert.',
              },
              target: {
                type: 'string',
                enum: ['all', 'typescript', 'zod', 'openai', 'anthropic'],
                description:
                  'Target contract format to return. Defaults to "all".',
              },
              function_name: {
                type: 'string',
                description:
                  'Function name for agent tool specifications. Defaults to "execute_api_call".',
              },
            },
            required: ['input'],
          },
        },
        {
          name: 'fuzz_contract',
          description:
            'Compiles an in-memory runtime Zod schema from an input payload/cURL and executes live deterministic chaos mutations (Happy Path 200 OK baseline, missing required fields 422 REJECTED, type corruption 422 REJECTED, boundary violations 422 REJECTED) with simulated latency and exact diagnostic error paths.',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description:
                  'Raw JSON string or cURL command whose inferred contract will be live-fuzzed in memory.',
              },
              mutations: {
                type: 'number',
                description:
                  'Number of chaos mutations to evaluate. Defaults to 3.',
              },
            },
            required: ['input'],
          },
        },
        {
          name: 'dynamic_tool_register',
          description:
            'Synthesizes an immediate, copy-pasteable tool registration block formatted specifically for OpenAI Structured Outputs or Anthropic Claude Tools, ready for an autonomous agent to register to itself dynamically at runtime.',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description:
                  'Raw cURL command or JSON payload for the target API endpoint.',
              },
              tool_name: {
                type: 'string',
                description:
                  'Unique identifier for the tool (e.g. "stripe_create_payment_intent").',
              },
              description: {
                type: 'string',
                description:
                  'Detailed prompt description of what the tool accomplishes and when to call it.',
              },
              format: {
                type: 'string',
                enum: ['openai_strict', 'anthropic_tool', 'both'],
                description:
                  'Target tool specification format. Defaults to "both".',
              },
            },
            required: ['input', 'tool_name'],
          },
        },
      ],
    };
  });

  // Call tool implementation
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args || typeof args !== 'object') {
      throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
    }

    // Helper: Parse input into effective payload & AST
    const parsePayload = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        throw new McpError(ErrorCode.InvalidParams, 'Input string cannot be empty');
      }

      let payload: unknown = null;
      let inputType = 'json';
      let meta: Record<string, unknown> = {};

      if (isCurlCommand(trimmed)) {
        inputType = 'curl';
        const curlRes = parseCurl(trimmed);
        if (!curlRes.isCurl || curlRes.effectivePayload === null) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Failed to parse cURL command: ${curlRes.error || 'Empty payload'}`
          );
        }
        payload = curlRes.effectivePayload;
        meta = {
          method: curlRes.method,
          url: curlRes.url,
          headers: curlRes.headers,
          queryParams: curlRes.queryParams,
          hasBody: curlRes.rawBody !== undefined,
        };
      } else {
        const jsonRes = parseJsonResilient(trimmed);
        if (!jsonRes.success) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Failed to parse JSON: ${jsonRes.error || 'Invalid syntax'}`
          );
        }
        payload = jsonRes.data;
        meta = {
          isSanitized: jsonRes.isSanitized,
        };
      }

      const ast = inferSchema(payload, 'Root');
      return { payload, ast, inputType, meta };
    };

    switch (name) {
      case 'infer_contract': {
        const input = String(args.input || '');
        const target = String(args.target || 'all').toLowerCase();
        const functionName = String(args.function_name || 'execute_api_call');

        const { ast, inputType, meta } = parsePayload(input);

        const results: Record<string, unknown> = {
          status: 'success',
          detected_input_type: inputType,
          metadata: meta,
        };

        if (target === 'all' || target === 'typescript') {
          results.typescript = generateTypeScript(ast, 'Root');
        }
        if (target === 'all' || target === 'zod') {
          results.zod = generateZod(ast, 'Root');
        }
        if (target === 'all' || target === 'openai') {
          results.openai_strict = JSON.parse(generateOpenAiStrict(ast, functionName));
        }
        if (target === 'all' || target === 'anthropic') {
          results.anthropic_claude = JSON.parse(generateAnthropic(ast, functionName));
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'fuzz_contract': {
        const input = String(args.input || '');
        const { ast, inputType, meta } = parsePayload(input);

        const schema = compileZodSchema(ast);
        const cases = generateFuzzTestCases(ast);
        const validatedCases = executeFuzzSuite(cases, schema);

        const passed = validatedCases.filter((c) => c.passed).length;
        const intercepted = validatedCases.filter((c) => !c.passed).length;

        const summary = {
          status: 'success',
          detected_input_type: inputType,
          metadata: meta,
          test_summary: {
            total_cases: validatedCases.length,
            passed_valid_cases: passed,
            intercepted_chaos_mutations: intercepted,
            contract_soundness: `${Math.round((passed / validatedCases.length) * 100)}%`,
          },
          test_cases: validatedCases.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            status_code: c.simulatedStatus,
            simulated_http_status: c.simulatedStatus === 200 ? '200 OK' : '422 REJECTED',
            simulated_latency_ms: c.simulatedLatencyMs,
            validation_passed: c.passed,
            errors: c.errors || [],
            payload_preview: c.payload,
          })),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case 'dynamic_tool_register': {
        const input = String(args.input || '');
        const toolName = String(args.tool_name || 'dynamic_api_tool');
        const description = String(
          args.description || 'Auto-generated dynamic contract for API execution'
        );
        const format = String(args.format || 'both').toLowerCase();

        const { ast, inputType, meta } = parsePayload(input);

        const rawOpenAi = JSON.parse(generateOpenAiStrict(ast, toolName));
        // Inject custom description if supplied
        if (rawOpenAi.function) {
          rawOpenAi.function.description = description;
        }

        const rawClaude = JSON.parse(generateAnthropic(ast, toolName));
        if (rawClaude) {
          rawClaude.description = description;
        }

        const registration: Record<string, unknown> = {
          status: 'ready_to_register',
          tool_name: toolName,
          detected_input_type: inputType,
          metadata: meta,
        };

        if (format === 'both' || format === 'openai_strict') {
          registration.openai_tool_definition = rawOpenAi;
        }
        if (format === 'both' || format === 'anthropic_tool') {
          registration.anthropic_tool_definition = rawClaude;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(registration, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  return server;
}

/**
 * Runs the server using Standard I/O transport.
 */
export async function runServer(): Promise<void> {
  const server = createContractForgeServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ContractForge MCP Server running on stdio');
}

// Auto-run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runServer().catch((error) => {
    console.error('Fatal error starting ContractForge MCP Server:', error);
    process.exit(1);
  });
}
