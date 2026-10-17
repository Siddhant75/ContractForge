import { AstNode } from '../../types/ast';

export function generateTypeScript(ast: AstNode, rootName = 'Root'): string {
  const extraInterfaces: string[] = [];

  function renderNode(node: AstNode, parentName: string, propName: string): string {
    switch (node.kind) {
      case 'primitive':
        if (node.primitive === 'null') return 'null';
        if (node.primitive === 'unknown') return 'unknown';
        return node.primitive;

      case 'union':
        return node.types.map(t => renderNode(t, parentName, propName)).join(' | ');

      case 'array': {
        const itemType = renderNode(node.elementType, parentName, `${propName}Item`);
        return itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`;
      }

      case 'object': {
        const interfaceName = sanitizeIdentifier(capitalize(propName || parentName));
        const lines: string[] = [];
        lines.push(`export interface ${interfaceName} {`);

        for (const prop of node.properties) {
          const optMark = prop.optional ? '?' : '';
          const propType = renderNode(prop.type, interfaceName, prop.name);
          const safeKey = isValidIdentifier(prop.name) ? prop.name : JSON.stringify(prop.name);
          lines.push(`  ${safeKey}${optMark}: ${propType};`);
        }

        lines.push('}');
        const declaration = lines.join('\n');
        if (!extraInterfaces.includes(declaration)) {
          extraInterfaces.push(declaration);
        }
        return interfaceName;
      }
    }
  }

  if (ast.kind === 'array') {
    const itemType = renderNode(ast.elementType, rootName, `${rootName}Item`);
    const rootArrayType = `export type ${rootName} = ${itemType.includes(' | ') ? `(${itemType})[]` : `${itemType}[]`};`;
    return [...extraInterfaces, rootArrayType].join('\n\n');
  }

  if (ast.kind === 'primitive') {
    const prim = ast.primitive === 'null' ? 'null' : ast.primitive;
    return `export type ${rootName} = ${prim};`;
  }

  if (ast.kind === 'union') {
    const types = ast.types.map(t => renderNode(t, rootName, 'Item')).join(' | ');
    return [...extraInterfaces, `export type ${rootName} = ${types};`].join('\n\n');
  }

  // Object
  const mainLines: string[] = [];
  mainLines.push(`export interface ${rootName} {`);
  for (const prop of ast.properties) {
    const optMark = prop.optional ? '?' : '';
    const propType = renderNode(prop.type, rootName, prop.name);
    const safeKey = isValidIdentifier(prop.name) ? prop.name : JSON.stringify(prop.name);
    mainLines.push(`  ${safeKey}${optMark}: ${propType};`);
  }
  mainLines.push('}');

  return [...extraInterfaces, mainLines.join('\n')].join('\n\n');
}

function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
}

function sanitizeIdentifier(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, '');
  return cleaned || 'Item';
}

function capitalize(str: string): string {
  if (!str) return 'Item';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
