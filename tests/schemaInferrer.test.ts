import { describe, it, expect } from 'vitest';
import { inferSchema, detectSemanticFormat } from '../src/engine/schemaInferrer';
import { generateTypeScript } from '../src/engine/generators/typescript';
import { generateZod } from '../src/engine/generators/zod';

describe('schemaInferrer', () => {
  it('detects semantic string formats correctly', () => {
    expect(detectSemanticFormat('2026-10-17T12:00:00Z')).toBe('date-time');
    expect(detectSemanticFormat('123e4567-e89b-12d3-a456-426614174000')).toBe('uuid');
    expect(detectSemanticFormat('developer@contractforge.dev')).toBe('email');
    expect(detectSemanticFormat('https://contractforge.dev/api/v1')).toBe('url');
    expect(detectSemanticFormat('just normal text')).toBe('none');
  });

  it('infers primitives and nested objects correctly', () => {
    const sample = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'ContractForge',
      version: 1,
      active: true,
      meta: {
        created_at: '2026-10-17T14:00:00Z',
        tags: ['api', 'schema']
      }
    };

    const ast = inferSchema(sample, 'AppConfig');
    expect(ast.kind).toBe('object');
    if (ast.kind === 'object') {
      expect(ast.properties).toHaveLength(5);
      const idProp = ast.properties.find(p => p.name === 'id');
      expect(idProp?.type.kind).toBe('primitive');
      if (idProp?.type.kind === 'primitive') {
        expect(idProp.type.format).toBe('uuid');
      }
    }
  });

  it('detects optional fields across array of objects', () => {
    const data = [
      { id: 1, name: 'Alpha', description: 'Has description' },
      { id: 2, name: 'Beta' } // missing description
    ];

    const ast = inferSchema(data, 'ItemList');
    expect(ast.kind).toBe('array');
    if (ast.kind === 'array' && ast.elementType.kind === 'object') {
      const descProp = ast.elementType.properties.find(p => p.name === 'description');
      expect(descProp?.optional).toBe(true);
      const idProp = ast.elementType.properties.find(p => p.name === 'id');
      expect(idProp?.optional).toBe(false);
    }
  });

  it('handles empty arrays without crashing', () => {
    const sample = { emptyList: [] };
    const ast = inferSchema(sample, 'TestEmpty');
    expect(ast.kind).toBe('object');
    if (ast.kind === 'object') {
      const prop = ast.properties.find(p => p.name === 'emptyList');
      expect(prop?.type.kind).toBe('array');
      if (prop?.type.kind === 'array') {
        expect(prop.type.elementType.kind).toBe('primitive');
        if (prop.type.elementType.kind === 'primitive') {
          expect(prop.type.elementType.primitive).toBe('unknown');
        }
      }
    }
  });
});

describe('code generators', () => {
  it('generates valid TypeScript interface', () => {
    const sample = {
      id: 'abc-123',
      score: 98.5,
      is_valid: true
    };
    const ast = inferSchema(sample, 'ScoreData');
    const tsCode = generateTypeScript(ast, 'ScoreData');
    expect(tsCode).toContain('export interface ScoreData {');
    expect(tsCode).toContain('id: string;');
    expect(tsCode).toContain('score: number;');
    expect(tsCode).toContain('is_valid: boolean;');
  });

  it('generates valid Zod schema with semantic validators', () => {
    const sample = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'alex@example.com',
      created_at: '2026-10-17T12:30:00Z'
    };
    const ast = inferSchema(sample, 'User');
    const zodCode = generateZod(ast, 'User');
    expect(zodCode).toContain("import { z } from 'zod';");
    expect(zodCode).toContain('user_id: z.string().uuid(),');
    expect(zodCode).toContain('email: z.string().email(),');
    expect(zodCode).toContain('created_at: z.string().datetime(),');
    expect(zodCode).toContain('export type User = z.infer<typeof UserSchema>;');
  });
});
