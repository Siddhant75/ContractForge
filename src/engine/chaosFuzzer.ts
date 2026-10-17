import { z } from 'zod';
import { AstNode, FuzzTestCase } from '../types/ast';

/**
 * Builds an executable Zod schema directly in memory from an AstNode.
 * 100% type-safe, pure in-memory execution without eval().
 */
export function compileZodSchema(node: AstNode): z.ZodTypeAny {
  switch (node.kind) {
    case 'primitive': {
      if (node.primitive === 'null') return z.null();
      if (node.primitive === 'unknown') return z.unknown();
      if (node.primitive === 'number') return z.number();
      if (node.primitive === 'boolean') return z.boolean();

      if (node.format === 'date-time') return z.string().datetime();
      if (node.format === 'uuid') return z.string().uuid();
      if (node.format === 'email') return z.string().email();
      if (node.format === 'url') return z.string().url();
      return z.string();
    }

    case 'union': {
      if (node.types.length === 0) return z.unknown();
      if (node.types.length === 1) return compileZodSchema(node.types[0]);
      const [first, second, ...rest] = node.types.map(compileZodSchema);
      return z.union([first, second, ...rest]);
    }

    case 'array': {
      return z.array(compileZodSchema(node.elementType));
    }

    case 'object': {
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const prop of node.properties) {
        let fieldSchema = compileZodSchema(prop.type);
        if (prop.optional) {
          fieldSchema = fieldSchema.optional();
        }
        shape[prop.name] = fieldSchema;
      }
      return z.object(shape);
    }
  }
}

/**
 * Generates a valid happy-path synthetic payload matching the AST.
 */
export function generateHappyPathPayload(node: AstNode): unknown {
  switch (node.kind) {
    case 'primitive': {
      if (node.primitive === 'null') return null;
      if (node.primitive === 'unknown') return 'sample_data';
      if (node.primitive === 'number') {
        return typeof node.sampleValue === 'number' ? node.sampleValue : 42;
      }
      if (node.primitive === 'boolean') {
        return typeof node.sampleValue === 'boolean' ? node.sampleValue : true;
      }

      // String with semantic formats
      if (node.format === 'date-time') return '2026-10-17T12:00:00Z';
      if (node.format === 'uuid') return '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      if (node.format === 'email') return 'alex.chen@example.com';
      if (node.format === 'url') return 'https://api.example.com/v1';
      return typeof node.sampleValue === 'string' ? node.sampleValue : 'sample_text';
    }

    case 'union': {
      return node.types.length > 0 ? generateHappyPathPayload(node.types[0]) : null;
    }

    case 'array': {
      return [generateHappyPathPayload(node.elementType)];
    }

    case 'object': {
      const result: Record<string, unknown> = {};
      for (const prop of node.properties) {
        result[prop.name] = generateHappyPathPayload(prop.type);
      }
      return result;
    }
  }
}

/**
 * Generates 4 test cases: 1 happy path and 3 mutated edge-case payloads.
 */
export function generateFuzzTestCases(ast: AstNode): FuzzTestCase[] {
  const happyPath = generateHappyPathPayload(ast);

  const testCases: FuzzTestCase[] = [
    {
      id: 'tc_happy_path',
      name: 'Happy Path Baseline',
      description: 'Fully compliant payload matching all types and semantic constraints',
      type: 'happy_path',
      payload: happyPath,
      simulatedStatus: 200,
      simulatedLatencyMs: 16,
      passed: true
    }
  ];

  if (ast.kind === 'object' && ast.properties.length > 0) {
    // 1. Missing required field
    const requiredProp = ast.properties.find(p => !p.optional) || ast.properties[0];
    const missingFieldPayload = { ...(happyPath as Record<string, unknown>) };
    delete missingFieldPayload[requiredProp.name];

    testCases.push({
      id: 'tc_missing_field',
      name: `Omit Required Field: [${requiredProp.name}]`,
      description: `Omits mandatory property '${requiredProp.name}' to test contract rejection`,
      type: 'missing_field',
      payload: missingFieldPayload,
      simulatedStatus: 422,
      simulatedLatencyMs: 22,
      passed: false
    });

    // 2. Type corruption
    const targetProp = ast.properties[0];
    const corruptedPayload = { ...(happyPath as Record<string, unknown>) };
    const currentValue = corruptedPayload[targetProp.name];
    corruptedPayload[targetProp.name] = typeof currentValue === 'number' ? 'INVALID_STRING_PAYLOAD' : 999999;

    testCases.push({
      id: 'tc_type_corruption',
      name: `Type Corruption on [${targetProp.name}]`,
      description: `Replaces field '${targetProp.name}' with mismatched primitive type`,
      type: 'type_corruption',
      payload: corruptedPayload,
      simulatedStatus: 422,
      simulatedLatencyMs: 28,
      passed: false
    });

    // 3. Boundary / semantic violation
    const hasSemanticProp = ast.properties.find(p => p.type.kind === 'primitive' && p.type.format !== 'none');
    const boundaryProp = hasSemanticProp || targetProp;
    const boundaryPayload = { ...(happyPath as Record<string, unknown>) };
    
    if (hasSemanticProp) {
      boundaryPayload[boundaryProp.name] = 'MALFORMED_REGEX_PATTERN_VALUE_@@@';
    } else {
      // Injects invalid structural type if no regex format is present
      boundaryPayload[boundaryProp.name] = ['__UNEXPECTED_ARRAY_OVERFLOW__'];
    }

    testCases.push({
      id: 'tc_boundary_violation',
      name: `Boundary Violation on [${boundaryProp.name}]`,
      description: hasSemanticProp
        ? `Injects malformed format into '${boundaryProp.name}' to verify regex guards`
        : `Injects structural overflow into '${boundaryProp.name}' to verify boundary enforcement`,
      type: 'boundary_violation',
      payload: boundaryPayload,
      simulatedStatus: 422,
      simulatedLatencyMs: 34,
      passed: false
    });
  } else {
    // Array or primitive root
    testCases.push({
      id: 'tc_type_corruption',
      name: 'Root Type Corruption',
      description: 'Replaces root container with invalid null payload',
      type: 'type_corruption',
      payload: null,
      simulatedStatus: 422,
      simulatedLatencyMs: 19,
      passed: false
    });
  }

  return testCases;
}

/**
 * Validates test cases against the live compiled Zod schema in-memory.
 */
export function executeFuzzSuite(testCases: FuzzTestCase[], schema: z.ZodTypeAny): FuzzTestCase[] {
  return testCases.map(tc => {
    const result = schema.safeParse(tc.payload);
    const passed = result.success;
    const errors: string[] = [];

    if (!result.success) {
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.') || 'root';
        errors.push(`${path}: ${issue.message}`);
      });
    }

    return {
      ...tc,
      passed,
      simulatedStatus: passed ? 200 : 422,
      errors: errors.length > 0 ? errors : undefined
    };
  });
}
