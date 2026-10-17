export type PrimitiveType = 'string' | 'number' | 'boolean' | 'null' | 'unknown';
export type SemanticFormat = 'date-time' | 'uuid' | 'email' | 'url' | 'none';

export interface AstProperty {
  name: string;
  type: AstNode;
  optional: boolean;
  description?: string;
}

export type AstNode =
  | { kind: 'primitive'; primitive: PrimitiveType; format: SemanticFormat; sampleValue?: unknown }
  | { kind: 'object'; name: string; properties: AstProperty[] }
  | { kind: 'array'; elementType: AstNode }
  | { kind: 'union'; types: AstNode[] };

export interface ParsedCurl {
  method: string;
  url: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body: unknown | null;
}

export interface FuzzTestCase {
  id: string;
  name: string;
  description: string;
  type: 'happy_path' | 'missing_field' | 'type_corruption' | 'boundary_violation';
  payload: unknown;
  simulatedStatus: 200 | 422;
  simulatedLatencyMs: number;
  passed: boolean;
  errors?: string[];
}
