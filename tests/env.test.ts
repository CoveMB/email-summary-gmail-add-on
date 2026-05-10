import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import {
  getEnvironmentVariable,
  getEnvironmentVariableCasted,
  getEnvironmentVariableCastedOr,
} from '../src/utils/Env';
import {
  installScriptPropertiesMock,
  uninstallScriptPropertiesMock,
} from './helpers/script-properties-test-helpers';

const setScriptPropertyValue = (scriptPropertyValue: string | null): void => {
  installScriptPropertiesMock({
    EXAMPLE_PROPERTY: scriptPropertyValue,
    MAXIMUM_COUNT: scriptPropertyValue,
    USE_MOCK_GEMINI: scriptPropertyValue,
  });
};

afterEach(() => {
  uninstallScriptPropertiesMock();
});

describe('environment variable helpers', () => {
  it('returns a trimmed string environment variable', () => {
    setScriptPropertyValue('  configured value  ');

    expect(getEnvironmentVariable('EXAMPLE_PROPERTY')).toBe('configured value');
  });

  it('throws a safe error when a required property is missing', () => {
    expect(() => getEnvironmentVariable('EXAMPLE_PROPERTY')).toThrow(
      'Missing required script property: EXAMPLE_PROPERTY'
    );
  });

  it('infers casted return types from the requested TypeOf value', () => {
    expectTypeOf<
      ReturnType<typeof getEnvironmentVariableCasted<'boolean'>>
    >().toEqualTypeOf<boolean>();
    expectTypeOf<
      ReturnType<typeof getEnvironmentVariableCasted<'number'>>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      ReturnType<typeof getEnvironmentVariableCasted<'string'>>
    >().toEqualTypeOf<string>();
  });

  it('casts boolean environment variables without replacing false with the default value', () => {
    setScriptPropertyValue('false');

    expect(getEnvironmentVariableCasted('USE_MOCK_GEMINI', 'boolean')).toBe(false);
    expect(getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true)).toBe(false);
  });

  it('casts number environment variables without replacing zero with the default value', () => {
    setScriptPropertyValue('0');

    expect(getEnvironmentVariableCasted('MAXIMUM_COUNT', 'number')).toBe(0);
    expect(getEnvironmentVariableCastedOr('MAXIMUM_COUNT', 'number', 10)).toBe(0);
  });

  it('casts object, bigint, and symbol environment variables', () => {
    installScriptPropertiesMock({
      EXAMPLE_BIGINT: '123',
      EXAMPLE_OBJECT: '{"enabled":true}',
      EXAMPLE_SYMBOL: 'symbol-name',
    });

    expect(getEnvironmentVariableCasted('EXAMPLE_OBJECT', 'object')).toEqual({ enabled: true });
    expect(getEnvironmentVariableCasted('EXAMPLE_BIGINT', 'bigint')).toBe(123n);
    expect(getEnvironmentVariableCasted('EXAMPLE_SYMBOL', 'symbol').description).toBe(
      'symbol-name'
    );
  });

  it('rejects function casts', () => {
    setScriptPropertyValue('ignored');

    expect(() => getEnvironmentVariableCasted('EXAMPLE_PROPERTY', 'function')).toThrow(
      'Environment variables cannot be cast to functions.'
    );
  });

  it('uses the default value when a property is missing', () => {
    setScriptPropertyValue(null);

    expect(getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true)).toBe(true);
  });

  it('uses the default value when script properties are unavailable', () => {
    expect(getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true)).toBe(true);
  });
});
