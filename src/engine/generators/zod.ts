import { AstNode } from '../../types/ast';

export function generateZod(ast: AstNode, rootName = 'Root'): string {
  const schemaName = `${rootName}Schema`;
  const extraSchemas: string[] = [];

  function renderZod(node: AstNode, parentName: string, propName: string, indent = 2): string {
    const pad = ' '.repeat(indent);
    const innerPad = ' '.repeat(indent + 2);

    switch (node.kind) {
      case 'primitive': {
        if (node.primitive === 'null') return 'z.null()';
        if (node.primitive === 'unknown') return 'z.unknown()';
        if (node.primitive === 'number') return 'z.number()';
        if (node.primitive === 'boolean') return 'z.boolean()';
        
        // string with semantic formats
        if (node.format === 'date-time') return 'z.string().datetime()';
        if (node.format === 'uuid') return 'z.string().uuid()';
        if (node.format === 'email') return 'z.string().email()';
        if (node.format === 'url') return 'z.string().url()';
        return 'z.string()';
      }

      case 'union': {
        const types = node.types.map(t => renderZod(t, parentName, propName, indent));
        return `z.union([${types.join(', ')}])`;
      }

      case 'array': {
        const itemType = renderZod(node.elementType, parentName, `${propName}Item`, indent);
        return `z.array(${itemType})`;
      }

      case 'object': {
        const subSchemaName = `${capitalize(propName || parentName)}Schema`;
        const lines: string[] = [];
        lines.push(`z.object({`);

        for (const prop of node.properties) {
          const propZod = renderZod(prop.type, subSchemaName, prop.name, indent + 2);
          const optSuffix = prop.optional ? '.optional()' : '';
          const safeKey = isValidIdentifier(prop.name) ? prop.name : JSON.stringify(prop.name);
          lines.push(`${innerPad}${safeKey}: ${propZod}${optSuffix},`);
        }

        lines.push(`${pad}})`);
        return lines.join('\n');
      }
    }
  }

  const importHeader = `import { z } from 'zod';`;
  const mainSchemaBody = renderZod(ast, rootName, rootName, 0);
  const mainExport = `export const ${schemaName} = ${mainSchemaBody};`;
  const typeExport = `export type ${rootName} = z.infer<typeof ${schemaName}>;`;

  return [importHeader, ...extraSchemas, mainExport, typeExport].join('\n\n');
}

function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

function capitalize(str: string): string {
  if (!str) return 'Item';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
