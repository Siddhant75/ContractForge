import { describe, it, expect } from 'vitest';
import { inferSchema } from '../src/engine/schemaInferrer';
import {
  compileZodSchema,
  generateHappyPathPayload,
  generateFuzzTestCases,
  executeFuzzSuite
} from '../src/engine/chaosFuzzer';

describe('chaosFuzzer', () => {
  const sample = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'developer@contractforge.dev',
    amount: 1500,
    active: true,
    created_at: '2026-10-17T12:00:00Z'
  };

  const ast = inferSchema(sample, 'UserAccount');
  const compiledSchema = compileZodSchema(ast);

  it('compiles an executable Zod schema matching AST', () => {
    expect(compiledSchema).toBeDefined();
    const valid = compiledSchema.safeParse(sample);
    expect(valid.success).toBe(true);
  });

  it('generates a valid happy-path payload', () => {
    const happyPath = generateHappyPathPayload(ast);
    const valid = compiledSchema.safeParse(happyPath);
    expect(valid.success).toBe(true);
  });

  it('generates deterministic fuzz mutations', () => {
    const testCases = generateFuzzTestCases(ast);
    expect(testCases.length).toBeGreaterThanOrEqual(4);

    const happyCase = testCases.find(tc => tc.type === 'happy_path');
    const missingFieldCase = testCases.find(tc => tc.type === 'missing_field');
    const typeCorruptionCase = testCases.find(tc => tc.type === 'type_corruption');
    const boundaryCase = testCases.find(tc => tc.type === 'boundary_violation');

    expect(happyCase).toBeDefined();
    expect(missingFieldCase).toBeDefined();
    expect(typeCorruptionCase).toBeDefined();
    expect(boundaryCase).toBeDefined();
  });

  it('executes the fuzz suite and correctly catches edge cases', () => {
    const testCases = generateFuzzTestCases(ast);
    const results = executeFuzzSuite(testCases, compiledSchema);

    const happyResult = results.find(tc => tc.type === 'happy_path');
    expect(happyResult?.passed).toBe(true);
    expect(happyResult?.simulatedStatus).toBe(200);

    const corruptedResult = results.find(tc => tc.type === 'type_corruption');
    expect(corruptedResult?.passed).toBe(false);
    expect(corruptedResult?.simulatedStatus).toBe(422);
    expect(corruptedResult?.errors).toBeDefined();
    expect(corruptedResult?.errors?.length).toBeGreaterThan(0);
  });
});
