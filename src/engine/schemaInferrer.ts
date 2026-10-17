import { AstNode, AstProperty, SemanticFormat } from '../types/ast';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const MAX_DEPTH = 20;

export function detectSemanticFormat(value: string): SemanticFormat {
  if (ISO_DATE_REGEX.test(value)) return 'date-time';
  if (UUID_REGEX.test(value)) return 'uuid';
  if (EMAIL_REGEX.test(value)) return 'email';
  if (URL_REGEX.test(value)) return 'url';
  return 'none';
}

export function inferSchema(data: unknown, name = 'Root', depth = 0): AstNode {
  if (depth > MAX_DEPTH) {
    return { kind: 'primitive', primitive: 'unknown', format: 'none', sampleValue: data };
  }

  if (data === null) {
    return { kind: 'primitive', primitive: 'null', format: 'none', sampleValue: null };
  }

  if (data === undefined) {
    return { kind: 'primitive', primitive: 'unknown', format: 'none' };
  }

  const typeOf = typeof data;

  if (typeOf === 'string') {
    const str = data as string;
    return {
      kind: 'primitive',
      primitive: 'string',
      format: detectSemanticFormat(str),
      sampleValue: str
    };
  }

  if (typeOf === 'number') {
    return {
      kind: 'primitive',
      primitive: 'number',
      format: 'none',
      sampleValue: data as number
    };
  }

  if (typeOf === 'boolean') {
    return {
      kind: 'primitive',
      primitive: 'boolean',
      format: 'none',
      sampleValue: data as boolean
    };
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return {
        kind: 'array',
        elementType: { kind: 'primitive', primitive: 'unknown', format: 'none' }
      };
    }

    // Check if array of objects
    const allObjects = data.every(item => item !== null && typeof item === 'object' && !Array.isArray(item));
    if (allObjects && data.length > 0) {
      const mergedProperties: AstProperty[] = [];
      const keySet = new Set<string>();
      
      data.forEach(item => {
        Object.keys(item as Record<string, unknown>).forEach(k => keySet.add(k));
      });

      const totalItems = data.length;

      for (const key of keySet) {
        const presentItems = data.filter(item => key in (item as Record<string, unknown>));
        const optional = presentItems.length < totalItems;
        const values = presentItems.map(item => (item as Record<string, unknown>)[key]);

        // Infer type across present values
        const elementNodes = values.map((val, idx) => inferSchema(val, `${key}Item${idx}`, depth + 1));
        const unifiedType = unifyNodes(elementNodes);

        mergedProperties.push({
          name: key,
          type: unifiedType,
          optional
        });
      }

      return {
        kind: 'array',
        elementType: {
          kind: 'object',
          name: `${name}Item`,
          properties: mergedProperties
        }
      };
    }

    // Primitive or mixed elements
    const itemNodes = data.map((item, idx) => inferSchema(item, `${name}Item${idx}`, depth + 1));
    return {
      kind: 'array',
      elementType: unifyNodes(itemNodes)
    };
  }

  if (typeOf === 'object') {
    const obj = data as Record<string, unknown>;
    const properties: AstProperty[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const childNode = inferSchema(value, capitalize(key), depth + 1);
      properties.push({
        name: key,
        type: childNode,
        optional: value === undefined
      });
    }

    return {
      kind: 'object',
      name,
      properties
    };
  }

  return { kind: 'primitive', primitive: 'unknown', format: 'none', sampleValue: data };
}

function unifyNodes(nodes: AstNode[]): AstNode {
  if (nodes.length === 0) {
    return { kind: 'primitive', primitive: 'unknown', format: 'none' };
  }
  if (nodes.length === 1) {
    return nodes[0];
  }

  const distinctKinds = new Map<string, AstNode>();
  for (const node of nodes) {
    const key = nodeKey(node);
    if (!distinctKinds.has(key)) {
      distinctKinds.set(key, node);
    }
  }

  const distinct = Array.from(distinctKinds.values());
  if (distinct.length === 1) {
    return distinct[0];
  }

  return {
    kind: 'union',
    types: distinct
  };
}

function nodeKey(node: AstNode): string {
  if (node.kind === 'primitive') {
    return `${node.kind}:${node.primitive}:${node.format}`;
  }
  return node.kind;
}

function capitalize(str: string): string {
  if (!str) return 'Item';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
