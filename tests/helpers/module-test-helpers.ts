import { vi } from 'vitest';

import { installCardServiceMock } from './card-service-test-helpers';
import {
  installScriptPropertiesMock,
  type ScriptPropertyMap,
} from './script-properties-test-helpers';

export const mockGeminiModeProperties = {
  USE_MOCK_GEMINI: 'true',
} as const;

export const realGeminiModeProperties = {
  GEMINI_API_KEY: 'test-api-key',
  USE_MOCK_GEMINI: 'false',
} as const;

export const realGeminiModeWithoutApiKeyProperties = {
  USE_MOCK_GEMINI: 'false',
} as const;

export const importWithScriptProperties = async <TModule>(
  scriptProperties: ScriptPropertyMap,
  importModule: () => Promise<TModule>
): Promise<TModule> => {
  vi.resetModules();
  installScriptPropertiesMock(scriptProperties);

  return importModule();
};

export const importWithCardService = async <TModule>(
  scriptProperties: ScriptPropertyMap,
  importModule: () => Promise<TModule>
): Promise<TModule> => {
  vi.resetModules();
  installScriptPropertiesMock(scriptProperties);
  installCardServiceMock();

  return importModule();
};
