import type { EnvironmentVariableCastValue, TypeOf } from '../types/types';

const getScriptProperties = (): GoogleAppsScript.Properties.Properties | undefined => {
  if (typeof PropertiesService === 'undefined') {
    return undefined;
  }

  return PropertiesService.getScriptProperties();
};

const readOptionalScriptProperty = (envProperty: string): string => {
  const value = getScriptProperties()?.getProperty(envProperty);

  return value?.trim() ?? '';
};

const readScriptProperty = (envProperty: string): string => {
  const value = readOptionalScriptProperty(envProperty);

  if (!value) {
    throw new Error(`Missing required script property: ${envProperty}`);
  }

  return value;
};

const parseBooleanEnvironmentVariable = (rawEnvironmentValue: string): boolean =>
  rawEnvironmentValue.toLowerCase() === 'true';

const parseObjectEnvironmentVariable = (rawEnvironmentValue: string): object => {
  const parsedEnvironmentValue = JSON.parse(rawEnvironmentValue) as unknown;

  if (typeof parsedEnvironmentValue !== 'object' || parsedEnvironmentValue === null) {
    throw new Error('Expected environment variable to contain a JSON object.');
  }

  return parsedEnvironmentValue;
};

const castEnvironmentVariable = <TCastType extends TypeOf>(
  rawEnvironmentValue: string,
  castType: TCastType
): EnvironmentVariableCastValue<TCastType> => {
  switch (castType) {
    case 'undefined':
      return undefined as EnvironmentVariableCastValue<TCastType>;
    case 'object':
      return parseObjectEnvironmentVariable(
        rawEnvironmentValue
      ) as EnvironmentVariableCastValue<TCastType>;
    case 'boolean':
      return parseBooleanEnvironmentVariable(
        rawEnvironmentValue
      ) as EnvironmentVariableCastValue<TCastType>;
    case 'number':
      return Number(rawEnvironmentValue) as EnvironmentVariableCastValue<TCastType>;
    case 'bigint':
      return BigInt(rawEnvironmentValue) as EnvironmentVariableCastValue<TCastType>;
    case 'string':
      return rawEnvironmentValue as EnvironmentVariableCastValue<TCastType>;
    case 'symbol':
      return Symbol(rawEnvironmentValue) as EnvironmentVariableCastValue<TCastType>;
    case 'function':
      throw new Error('Environment variables cannot be cast to functions.');
  }
};

export const getEnvironmentVariable = readScriptProperty;

export const getEnvironmentVariableCasted = <TCastType extends TypeOf>(
  envProperty: string,
  castType: TCastType
): EnvironmentVariableCastValue<TCastType> =>
  castEnvironmentVariable(readScriptProperty(envProperty), castType);

export const getEnvironmentVariableCastedOr = <TCastType extends TypeOf>(
  envProperty: string,
  castType: TCastType,
  defaultValue: EnvironmentVariableCastValue<TCastType>
): EnvironmentVariableCastValue<TCastType> => {
  const rawEnvironmentValue = readOptionalScriptProperty(envProperty);

  return rawEnvironmentValue === ''
    ? defaultValue
    : castEnvironmentVariable(rawEnvironmentValue, castType);
};
