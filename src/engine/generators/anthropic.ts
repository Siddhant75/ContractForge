import { AstNode } from '../../types/ast';

/**
 * Generates an Anthropic Claude Tool Definition format.
 * Conforms to Anthropic's tool use JSON Schema standard.
 */
export function generateAnthropic(ast: AstNode, toolName = 'execute_api_call'): string {
  function nodeToClaudeSchema(node: AstNode): Record<string, unknown> {
    switch (node.kind) {
      case 'primitive': {
        if (node.primitive === 'null') return { type: 'null' };
        if (node.primitive === 'unknown') return { type: 'string' };
        if (node.primitive === 'number') return { type: 'number' };
        if (node.primitive === 'boolean') return { type: 'boolean' };

        const strSchema: Record<string, unknown> = { type: 'string' };
        if (node.format === 'date-time') strSchema.format = 'date-time';
        if (node.format === 'email') strSchema.format = 'email';
        if (node.format === 'url') strSchema.format = 'uri';
        if (node.format === 'uuid') strSchema.format = 'uuid';
        return strSchema;
      }

      case 'union': {
        return {
          anyOf: node.types.map(t => nodeToClaudeSchema(t))
        };
      }

      case 'array': {
        return {
          type: 'array',
          items: nodeToClaudeSchema(node.elementType)
        };
      }

      case 'object': {
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        for (const prop of node.properties) {
          properties[prop.name] = nodeToClaudeSchema(prop.type);
          if (!prop.optional) {
            required.push(prop.name);
          }
        }

        const schemaObj: Record<string, unknown> = {
          type: 'object',
          properties
        };

        if (required.length > 0) {
          schemaObj.required = required;
        }

        return schemaObj;
      }
    }
  }

  const inputSchema = ast.kind === 'object'
    ? nodeToClaudeSchema(ast)
    : {
        type: 'object',
        properties: {
          payload: nodeToClaudeSchema(ast)
        },
        required: ['payload']
      };

  const toolDefinition = {
    name: sanitizeToolName(toolName),
    description: 'Auto-generated tool definition for Anthropic Claude function calling',
    input_schema: inputSchema
  };

  return JSON.stringify(toolDefinition, null, 2);
}

function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'execute_api_call';
}
