import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import {
  getEnvironmentVariable,
  getEnvironmentVariableCasted,
  getEnvironmentVariableCastedOr,
} from '../src/utils/Env';

type ScriptProperties = Readonly<{
  getProperty: (envProperty: string) => string | null;
}>;

type ScriptPropertiesService = Readonly<{
  getScriptProperties: () => ScriptProperties;
}>;

const setScriptProperties = (scriptProperties: ScriptProperties): void => {
  const scriptPropertiesService: ScriptPropertiesService = {
    getScriptProperties: () => scriptProperties,
  };

  Object.defineProperty(globalThis, 'PropertiesService', {
    configurable: true,
    value: scriptPropertiesService,
  });
};

const setScriptPropertyValue = (scriptPropertyValue: string | null): void => {
  setScriptProperties({
    getProperty: () => scriptPropertyValue,
  });
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'PropertiesService');
});

describe('environment variable helpers', () => {
  it('returns a trimmed string environment variable', () => {
    setScriptPropertyValue('  configured value  ');

    expect(getEnvironmentVariable('EXAMPLE_PROPERTY')).toBe('configured value');
  });

  it('infers casted return types from the requested TypeOf value', () => {
    expectTypeOf(
      getEnvironmentVariableCasted('EXAMPLE_BOOLEAN', 'boolean')
    ).toEqualTypeOf<boolean>();
    expectTypeOf(getEnvironmentVariableCasted('EXAMPLE_NUMBER', 'number')).toEqualTypeOf<number>();
    expectTypeOf(getEnvironmentVariableCasted('EXAMPLE_STRING', 'string')).toEqualTypeOf<string>();
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

  it('uses the default value when a property is missing', () => {
    setScriptPropertyValue(null);

    expect(getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true)).toBe(true);
  });
});
