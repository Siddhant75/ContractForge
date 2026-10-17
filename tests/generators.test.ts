import { describe, it, expect } from 'vitest';
import { inferSchema } from '../src/engine/schemaInferrer';
import { generateOpenAiStrict } from '../src/engine/generators/openAiStrict';
import { generateAnthropic } from '../src/engine/generators/anthropic';

describe('OpenAI Strict Mode Generator', () => {
  const sample = {
    order_id: 'ord_123',
    amount: 5000,
    customer_email: 'buyer@example.com',
    details: {
      is_express: true,
      notes: 'Please leave at front door'
    },
    items: [
      { id: 'item_1', name: 'Widget', description: 'Blue' },
      { id: 'item_2', name: 'Gadget' } // description is optional
    ]
  };

  const ast = inferSchema(sample, 'Order');
  const openAiJsonString = generateOpenAiStrict(ast, 'create_order');
  const parsed = JSON.parse(openAiJsonString);

  it('generates a valid OpenAI tool definition with strict: true', () => {
    expect(parsed.type).toBe('function');
    expect(parsed.function).toBeDefined();
    expect(parsed.function.name).toBe('create_order');
    expect(parsed.function.strict).toBe(true);
    expect(parsed.function.parameters.type).toBe('object');
  });

  it('strictly enforces additionalProperties: false on all objects', () => {
    const rootParams = parsed.function.parameters;
    expect(rootParams.additionalProperties).toBe(false);

    const detailsProp = rootParams.properties.details;
    expect(detailsProp.additionalProperties).toBe(false);

    const itemsProp = rootParams.properties.items;
    expect(itemsProp.type).toBe('array');
    expect(itemsProp.items.additionalProperties).toBe(false);
  });

  it('places all properties in required in strict mode', () => {
    const rootParams = parsed.function.parameters;
    const propKeys = Object.keys(rootParams.properties);
    expect(rootParams.required.sort()).toEqual(propKeys.sort());

    // Check optional property in items
    const itemProps = rootParams.properties.items.items.properties;
    const itemRequired = rootParams.properties.items.items.required;
    expect(itemRequired.sort()).toEqual(Object.keys(itemProps).sort());

    // Verify description is mapped to nullable union
    const descProp = itemProps.description;
    expect(descProp.anyOf).toBeDefined();
    expect(descProp.anyOf).toContainEqual({ type: 'null' });
  });
});

describe('Anthropic Claude Tool Generator', () => {
  const sample = {
    location: 'San Francisco, CA',
    unit: 'celsius'
  };

  const ast = inferSchema(sample, 'GetWeather');
  const claudeJsonString = generateAnthropic(ast, 'get_weather');
  const parsed = JSON.parse(claudeJsonString);

  it('generates a valid Anthropic tool definition', () => {
    expect(parsed.name).toBe('get_weather');
    expect(parsed.input_schema).toBeDefined();
    expect(parsed.input_schema.type).toBe('object');
    expect(parsed.input_schema.properties.location.type).toBe('string');
    expect(parsed.input_schema.properties.unit.type).toBe('string');
    expect(parsed.input_schema.required).toContain('location');
    expect(parsed.input_schema.required).toContain('unit');
  });
});
