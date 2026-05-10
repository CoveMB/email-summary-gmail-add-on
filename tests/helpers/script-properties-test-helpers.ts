export type ScriptPropertyMap = Readonly<Record<string, string | null | undefined>>;

type ScriptProperties = Readonly<{
  getProperty: (propertyName: string) => string | null;
}>;

type ScriptPropertiesService = Readonly<{
  getScriptProperties: () => ScriptProperties;
}>;

export const installScriptPropertiesMock = (scriptPropertyMap: ScriptPropertyMap): void => {
  const scriptPropertiesService: ScriptPropertiesService = {
    getScriptProperties: () => ({
      getProperty: (propertyName: string): string | null => scriptPropertyMap[propertyName] ?? null,
    }),
  };

  Object.defineProperty(globalThis, 'PropertiesService', {
    configurable: true,
    value: scriptPropertiesService,
  });
};

export const uninstallScriptPropertiesMock = (): void => {
  Reflect.deleteProperty(globalThis, 'PropertiesService');
};
