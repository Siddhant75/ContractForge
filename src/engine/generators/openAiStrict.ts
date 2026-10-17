import { AstNode } from '../../types/ast';

interface OpenAiSchemaObject {
  [key: string]: unknown;
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: unknown;
  anyOf?: unknown[];
  format?: string;
  description?: string;
}

/**
 * Generates an OpenAI Function Calling Tool Definition with strict Structured Outputs compliance.
 * Invariant 1: "strict": true
 * Invariant 2: Every object recursively defines "additionalProperties": false
 * Invariant 3: Every property is placed into "required"; optional fields are mapped to anyOf: [type, { type: "null" }]
 */
export function generateOpenAiStrict(ast: AstNode, functionName = 'execute_api_call'): string {
  function nodeToJsonSchema(node: AstNode, isOptional = false): Record<string, unknown> {
    let baseSchema: Record<string, unknown>;

    switch (node.kind) {
      case 'primitive': {
        if (node.primitive === 'null') {
          baseSchema = { type: 'null' };
        } else if (node.primitive === 'unknown') {
          baseSchema = { type: 'string', description: 'Dynamic string or object value' };
        } else if (node.primitive === 'number') {
          baseSchema = { type: 'number' };
        } else if (node.primitive === 'boolean') {
          baseSchema = { type: 'boolean' };
        } else {
          // string
          const schemaObj: OpenAiSchemaObject = { type: 'string' };
          if (node.format === 'date-time') schemaObj.format = 'date-time';
          if (node.format === 'email') schemaObj.format = 'email';
          if (node.format === 'url') schemaObj.format = 'uri';
          if (node.format === 'uuid') schemaObj.format = 'uuid';
          baseSchema = schemaObj as Record<string, unknown>;
        }
        break;
      }

      case 'union': {
        baseSchema = {
          anyOf: node.types.map(t => nodeToJsonSchema(t, false))
        };
        break;
      }

      case 'array': {
        baseSchema = {
          type: 'array',
          items: nodeToJsonSchema(node.elementType, false)
        };
        break;
      }

      case 'object': {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        for (const prop of node.properties) {
          properties[prop.name] = nodeToJsonSchema(prop.type, prop.optional);
          // OpenAI strict mode requires EVERY property to be in `required`
          required.push(prop.name);
        }

        baseSchema = {
          type: 'object',
          properties,
          required,
          additionalProperties: false
        };
        break;
      }
    }

    if (isOptional) {
      return {
        anyOf: [baseSchema, { type: 'null' }]
      };
    }

    return baseSchema;
  }

  const parameters = ast.kind === 'object'
    ? nodeToJsonSchema(ast, false)
    : {
        type: 'object',
        properties: {
          payload: nodeToJsonSchema(ast, false)
        },
        required: ['payload'],
        additionalProperties: false
      };

  const toolDefinition = {
    type: 'function',
    function: {
      name: sanitizeFunctionName(functionName),
      description: 'Auto-generated strict contract for API execution and tool calling',
      strict: true,
      parameters
    }
  };

  return JSON.stringify(toolDefinition, null, 2);
}

function sanitizeFunctionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'execute_api_call';
}
